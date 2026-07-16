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

  // Internal tab state. Default to "ai".
  const [activeTab, setActiveTab] = useState<"ai" | "activity">("ai");
  // Keep track of the last selected tab to preserve it when closing/reopening the drawer.
  const [lastSelectedTab, setLastSelectedTab] = useState<"ai" | "activity">("ai");

  const isOpen = panelCtx ? panelCtx.activePanel !== null : false;

  // Synchronize tab state with PanelContext triggers (like when openActivity is called)
  useEffect(() => {
    if (panelCtx?.activePanel === "ai") {
      setActiveTab("ai");
      setLastSelectedTab("ai");
    } else if (panelCtx?.activePanel === "activity") {
      setActiveTab("activity");
      setLastSelectedTab("activity");
    }
  }, [panelCtx?.activePanel]);

  const handleToggle = () => {
    if (panelCtx) {
      if (isOpen) {
        panelCtx.setActivePanel(null);
      } else {
        panelCtx.setActivePanel(lastSelectedTab);
      }
    }
  };

  const handleClose = () => {
    if (panelCtx) {
      panelCtx.setActivePanel(null);
    }
  };

  const handleTabChange = (tab: "ai" | "activity") => {
    setActiveTab(tab);
    setLastSelectedTab(tab);
    if (panelCtx) {
      panelCtx.setActivePanel(tab);
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

          {/* Top Tabs */}
          <div className="flex px-4 border-b border-border bg-card" style={{ flexShrink: 0 }}>
            <button
              onClick={() => handleTabChange("ai")}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "ai"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              AI Assistant
            </button>
            <button
              onClick={() => handleTabChange("activity")}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "activity"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Activity
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {activeTab === "ai" ? (
              <AIAssistant 
                isEmbedded={true} 
                onNavigate={onNavigate} 
                activePage={activePage} 
                currentContext={currentContext} 
              />
            ) : activeRecord ? (
              <ActivityWorkspace isEmbedded={true} />
            ) : (
              /* Empty State for Activity Tab when no record context is active */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-card">
                <div
                  className="flex items-center justify-center rounded-full mb-3"
                  style={{ width: 44, height: 44, background: "rgba(107,140,255,0.08)", color: "#6b8cff" }}
                >
                  <Activity size={18} />
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 650, color: "var(--foreground)", marginBottom: 4 }}>
                  No Activity Context
                </h4>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5, maxWidth: 220 }}>
                  Select a record to begin reviewing, or ask AI a finance-related question.
                </p>
              </div>
            )}
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
