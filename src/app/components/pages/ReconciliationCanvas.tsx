import React, { useState, useRef, useEffect, useCallback } from "react";

interface ReconciliationCanvasProps {
  children: React.ReactNode;
  topLeftControls?: React.ReactNode;
}

const CANVAS_PADDING = 260; // Generous padding (approx 200-300px)
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const ZOOM_SPEED = 0.05;

export function ReconciliationCanvas({ children, topLeftControls }: ReconciliationCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const scaleRef = useRef(1);
  const [displayScale, setDisplayScale] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ scrollLeft: 0, scrollTop: 0, clientX: 0, clientY: 0 });

  // Grid background position alignment with native scroll
  const syncGrid = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const s = scaleRef.current;
    const baseGridSize = 24;
    const currentGridSize = baseGridSize * s;

    // Offset grid so it maps with scroll position
    const offX = -vp.scrollLeft % currentGridSize;
    const offY = -vp.scrollTop % currentGridSize;
    
    vp.style.backgroundSize = `${currentGridSize}px ${currentGridSize}px`;
    vp.style.backgroundPosition = `${offX}px ${offY}px`;
  }, []);

  // Update scale & world dimensions
  const updateLayout = useCallback(() => {
    const content = contentRef.current;
    const world = worldRef.current;
    if (!content || !world) return;
    const s = scaleRef.current;
    
    // Scale content
    content.style.transform = `scale(${s})`;
    content.style.transformOrigin = "top left";

    // Set world size to content size + padding
    const contentRect = content.getBoundingClientRect();
    const contentWidth = contentRect.width / s;
    const contentHeight = contentRect.height / s;

    world.style.width = `${contentWidth * s + CANVAS_PADDING * 2}px`;
    world.style.height = `${contentHeight * s + CANVAS_PADDING * 2}px`;

    setDisplayScale(Math.round(s * 100));
    syncGrid();
  }, [syncGrid]);

  // Sync canvas size on child updates
  useEffect(() => {
    updateLayout();
  }, [children, updateLayout]);

  // Initially scroll to center content context slightly on mount
  useEffect(() => {
    const vp = viewportRef.current;
    if (vp) {
      vp.scrollLeft = 120;
      vp.scrollTop = 120;
    }
  }, []);

  const handleScroll = () => {
    syncGrid();
  };

  // Zoom logic centering around mouse pointer
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();

        const prevScale = scaleRef.current;
        let newScale = prevScale;
        if (e.deltaY < 0) {
          newScale = Math.min(MAX_SCALE, prevScale + ZOOM_SPEED);
        } else {
          newScale = Math.max(MIN_SCALE, prevScale - ZOOM_SPEED);
        }

        if (newScale === prevScale) return;

        const rect = vp.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;

        // Coordinates in scaled world space before zoom
        const worldX = (vp.scrollLeft + pointerX) / prevScale;
        const worldY = (vp.scrollTop + pointerY) / prevScale;

        scaleRef.current = newScale;
        updateLayout();

        // New scroll positions to align the pointer location
        vp.scrollLeft = worldX * newScale - pointerX;
        vp.scrollTop = worldY * newScale - pointerY;

        syncGrid();
      }
    };

    vp.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      vp.removeEventListener("wheel", handleWheel);
    };
  }, [updateLayout, syncGrid]);

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons or interactive cards
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "A" ||
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button") ||
      target.closest("a") ||
      target.closest(".interactive-card")
    ) {
      return;
    }

    const vp = viewportRef.current;
    if (!vp) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      scrollLeft: vp.scrollLeft,
      scrollTop: vp.scrollTop,
      clientX: e.clientX,
      clientY: e.clientY
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const vp = viewportRef.current;
    if (!vp) return;

    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    vp.scrollLeft = dragStartRef.current.scrollLeft - dx;
    vp.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const zoomIn = () => {
    const prevScale = scaleRef.current;
    const newScale = Math.min(MAX_SCALE, prevScale + 0.1);
    if (newScale === prevScale) return;

    scaleRef.current = newScale;
    updateLayout();
  };

  const zoomOut = () => {
    const prevScale = scaleRef.current;
    const newScale = Math.max(MIN_SCALE, prevScale - 0.1);
    if (newScale === prevScale) return;

    scaleRef.current = newScale;
    updateLayout();
  };

  const resetView = () => {
    scaleRef.current = 1.0;
    updateLayout();
    const vp = viewportRef.current;
    if (vp) {
      vp.scrollLeft = 120;
      vp.scrollTop = 120;
    }
  };

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
      {/* 1. Scrollable Viewport Container */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onScroll={handleScroll}
        className="reconciliation-canvas-viewport flex-1 w-full select-none"
        style={{
          overflow: "auto",
          cursor: isDragging ? "grabbing" : "grab",
          backgroundImage: `
            linear-gradient(to right, rgba(107, 140, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(107, 140, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundColor: "var(--background)",
          backgroundSize: "24px 24px"
        }}
      >
        {/* Scrollbar styling injected inline */}
        <style>{`
          .reconciliation-canvas-viewport::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .reconciliation-canvas-viewport::-webkit-scrollbar-track {
            background: transparent;
          }
          .reconciliation-canvas-viewport::-webkit-scrollbar-thumb {
            background: rgba(107, 140, 255, 0.2);
            border-radius: 3px;
          }
          .reconciliation-canvas-viewport::-webkit-scrollbar-thumb:hover {
            background: rgba(107, 140, 255, 0.35);
          }
        `}</style>

        {/* Outer world container that holds content + padding */}
        <div ref={worldRef} style={{ position: "relative" }}>
          {/* Content element that gets scaled */}
          <div
            ref={contentRef}
            style={{
              position: "absolute",
              top: CANVAS_PADDING,
              left: CANVAS_PADDING
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* 2. Floating Zoom Controls (Fixed relative to viewport wrapper) */}
      <div 
        className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border/80 shadow-md select-none z-20"
        style={{ pointerEvents: "auto" }}
      >
        <button
          onClick={zoomOut}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer border-none flex items-center justify-center font-bold text-sm"
          style={{ width: 24, height: 24, background: "none" }}
          title="Zoom Out"
        >
          −
        </button>
        <span className="text-[10px] font-mono font-bold text-muted-foreground w-8 text-center">
          {displayScale}%
        </span>
        <button
          onClick={zoomIn}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer border-none flex items-center justify-center font-bold text-sm"
          style={{ width: 24, height: 24, background: "none" }}
          title="Zoom In"
        >
          +
        </button>
        <div className="w-px h-3 bg-border/80 mx-0.5" />
        <button
          onClick={resetView}
          className="px-1.5 py-1 rounded-lg hover:bg-secondary text-[9px] font-bold text-muted-foreground hover:text-foreground cursor-pointer border-none"
          style={{ background: "none" }}
          title="Reset view to 100%"
        >
          Reset
        </button>
      </div>

      {/* 3. Floating View Mode Switcher (Fixed relative to viewport wrapper) */}
      {topLeftControls && (
        <div 
          className="absolute top-3 left-3 flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border/80 shadow-md select-none z-20"
          style={{ pointerEvents: "auto" }}
        >
          {topLeftControls}
        </div>
      )}
    </div>
  );
}
