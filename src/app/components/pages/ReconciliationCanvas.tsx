import React, { useState, useRef, useEffect } from "react";

interface ReconciliationCanvasProps {
  children: React.ReactNode;
  topLeftControls?: React.ReactNode;
}

export function ReconciliationCanvas({ children, topLeftControls }: ReconciliationCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [displayScale, setDisplayScale] = useState(100);

  const updateTransform = () => {
    const { x, y, scale } = transformRef.current;
    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
    if (canvasRef.current) {
      const baseGridSize = 24;
      const currentGridSize = baseGridSize * scale;
      canvasRef.current.style.backgroundSize = `${currentGridSize}px ${currentGridSize}px`;
      canvasRef.current.style.backgroundPosition = `${x}px ${y}px`;
    }
    setDisplayScale(Math.round(scale * 100));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Do not pan if clicking on input, select, textarea, button, anchor, or interactive-card
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

    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - transformRef.current.x,
      y: e.clientY - transformRef.current.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    transformRef.current.x = e.clientX - dragStart.x;
    transformRef.current.y = e.clientY - dragStart.y;
    
    updateTransform();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) {
      return; // Normal vertical scroll when ctrl key isn't pressed
    }

    e.preventDefault();

    const zoomSpeed = 0.05;
    const prevScale = transformRef.current.scale;
    let newScale = prevScale;

    if (e.deltaY < 0) {
      newScale = Math.min(2.0, prevScale + zoomSpeed);
    } else {
      newScale = Math.max(0.5, prevScale - zoomSpeed);
    }

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      // Pointer-centered zoom calculations
      const newX = pointerX - (pointerX - transformRef.current.x) * (newScale / prevScale);
      const newY = pointerY - (pointerY - transformRef.current.y) * (newScale / prevScale);

      transformRef.current.scale = newScale;
      transformRef.current.x = newX;
      transformRef.current.y = newY;

      updateTransform();
    }
  };

  const resetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
    updateTransform();
  };

  const zoomIn = () => {
    const prevScale = transformRef.current.scale;
    const newScale = Math.min(2.0, prevScale + 0.1);
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      transformRef.current.x = cx - (cx - transformRef.current.x) * (newScale / prevScale);
      transformRef.current.y = cy - (cy - transformRef.current.y) * (newScale / prevScale);
      transformRef.current.scale = newScale;
      updateTransform();
    }
  };

  const zoomOut = () => {
    const prevScale = transformRef.current.scale;
    const newScale = Math.max(0.5, prevScale - 0.1);
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      transformRef.current.x = cx - (cx - transformRef.current.x) * (newScale / prevScale);
      transformRef.current.y = cy - (cy - transformRef.current.y) * (newScale / prevScale);
      transformRef.current.scale = newScale;
      updateTransform();
    }
  };

  useEffect(() => {
    updateTransform();
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      const handleTouchGesture = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      canvasElement.addEventListener("touchstart", handleTouchGesture, { passive: false });
      return () => {
        canvasElement.removeEventListener("touchstart", handleTouchGesture);
      };
    }
  }, []);

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 w-full overflow-hidden select-none"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        backgroundImage: `
          linear-gradient(to right, rgba(107, 140, 255, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(107, 140, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundColor: "var(--background)",
        backgroundSize: "24px 24px"
      }}
    >
      <div
        ref={contentRef}
        className="w-full h-full p-4"
        style={{
          transformOrigin: "0 0",
          transition: isDragging ? "none" : "transform 0.05s ease-out"
        }}
      >
        {children}
      </div>

      {/* Floating Canvas Controls */}
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
