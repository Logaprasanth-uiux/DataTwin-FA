import { useState, useEffect, useContext } from "react";
import { Sparkles, X, Activity, BotMessageSquare } from "lucide-react";
import { PanelContext, useActivity, WorkspaceContextInfo } from "../contexts";
import { AIAssistant } from "./AIAssistant";
import { ActivityWorkspace } from "./ActivityWorkspace";
import { resolveWorkspaceContext } from "../utils/workspaceContextResolver";

interface AIWorkspaceProps {
  onNavigate: (page: string, highlightId?: string, mode?: string) => void;
  hasHeaderOffset?: boolean;
  activePage?: string;
}

export function AIWorkspace({ onNavigate, hasHeaderOffset = false, activePage }: AIWorkspaceProps) {
  const panelCtx = useContext(PanelContext);
  const { activeRecord } = useActivity();
  const currentContext = resolveWorkspaceContext(activeRecord);

  const isOpen = panelCtx ? panelCtx.activePanel !== null : false;

  const handleToggle = () => {
    if (panelCtx) {
      if (isOpen) {
        panelCtx.setActivePanel(null);
      } else {
        panelCtx.setActivePanel("ai");
      }
    }
  };

  const handleClose = () => {
    if (panelCtx) {
      panelCtx.setActivePanel(null);
    }
  };

  return (
    <div
      className="flex flex-row flex-shrink-0 z-10"
      style={{
        height: hasHeaderOffset ? "calc(100% - 56px)" : "100%",
        marginTop: hasHeaderOffset ? 56 : 0,
      }}
    >
      {/* ─── MAIN EXPANDABLE DRAWER ─── */}
      {isOpen && (
        <div
          className="flex flex-col bg-card"
          style={{
            width: 360,
            height: "100%",
            borderLeft: "1px solid var(--border)",
            overflow: "hidden",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 28, height: 28, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}
            >
              <BotMessageSquare size={14} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>AI Workspace</span>
              {activeRecord ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                  <span style={{ color: "var(--muted-foreground)" }}>{activeRecord.type}</span>
                  <span style={{ color: "var(--border)" }}>•</span>
                  <span style={{ color: "var(--foreground)", fontWeight: 500, fontFamily: "var(--font-mono)" }} className="truncate">
                    {activeRecord.id}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>No item selected</span>
              )}
            </div>
            <button
              onClick={handleClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                width: 24,
                height: 24,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              title="Close Workspace"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <AIAssistant 
              isEmbedded={true} 
              onNavigate={onNavigate} 
              activePage={activePage} 
              currentContext={currentContext} 
            />
          </div>
        </div>
      )}

      {/* ─── PERMANENT RIGHT TOOLBAR STRIP ─── */}
      <div
        className="flex flex-col items-center"
        style={{
          width: 44,
          height: "100%",
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          paddingTop: 12,
          gap: 12,
        }}
      >
        <button
          onClick={handleToggle}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 32,
            height: 32,
            background: isOpen ? "rgba(107,140,255,0.12)" : "var(--secondary)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: isOpen ? "#6b8cff" : "var(--foreground)",
          }}
          onMouseEnter={(e) => {
            if (!isOpen) e.currentTarget.style.background = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            if (!isOpen) e.currentTarget.style.background = "var(--secondary)";
          }}
          title={isOpen ? "Minimize AI Workspace" : "Open AI Workspace"}
        >
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  );
}
