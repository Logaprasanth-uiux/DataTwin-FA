import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Building2,
  Store,
  ShoppingCart,
  Receipt,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Inbox,
  CheckCircle2,
  RefreshCw,
  Activity,
} from "lucide-react";
import { InboxItem, InboxItemType } from "./pages/InboxPage";

const mainNav = [
  { icon: LayoutDashboard, label: "Overview" },
  { icon: CheckSquare, label: "Approvals" },
  { icon: FileText, label: "Report" },
];

const documentsNav = [
  { icon: Building2, label: "Organization" },
  { icon: Store, label: "Vendor" },
  { icon: ShoppingCart, label: "Purchase Order" },
  { icon: Receipt, label: "Bill" },
];

const operationsNav = [
  { icon: Activity, label: "Transaction Hub" },
];

interface SidebarProps {
  dark: boolean;
  onToggleDark: () => void;
  active: string;
  onSetActive: (label: string) => void;
  inboxItems: InboxItem[];
  setInboxItems: React.Dispatch<React.SetStateAction<InboxItem[]>>;
}

export function Sidebar({ dark, onToggleDark, active, onSetActive, inboxItems, setInboxItems }: SidebarProps) {
  const unreadCount = inboxItems.filter(i => i.unread).length;
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return sessionStorage.getItem("sidebarCollapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      sessionStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  return (
    <aside
      className="flex flex-col h-full transition-all duration-200 ease-in-out flex-shrink-0 relative"
      style={{
        width: isCollapsed ? 64 : 220,
        minWidth: isCollapsed ? 64 : 220,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo Container */}
      <div
        className="flex items-center transition-all duration-200 flex-shrink-0"
        style={{ 
          height: 56, 
          borderBottom: "1px solid var(--sidebar-border)",
          justifyContent: isCollapsed ? "center" : "flex-start",
          paddingLeft: isCollapsed ? 0 : 16,
          paddingRight: isCollapsed ? 0 : 16
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded flex-shrink-0"
            style={{ width: 26, height: 26, background: "var(--foreground)" }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--background)", fontFamily: "var(--font-mono)" }}>
              DT
            </span>
          </div>
          {!isCollapsed && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sidebar-primary)", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              DataTwin AI
            </span>
          )}
        </div>
      </div>

      {/* Floating Divider Handle Collapse/Expand Toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute z-50 flex items-center justify-center rounded-full cursor-pointer hover:bg-secondary/80 border transition-all duration-200"
        style={{
          width: 24,
          height: 24,
          top: 28,
          right: 0,
          transform: "translate(50%, -50%)",
          background: "var(--card)",
          borderColor: "var(--sidebar-border)",
          color: "var(--muted-foreground)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
        title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
      >
        {isCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-3 flex flex-col gap-0.5 overflow-y-auto">
        {!isCollapsed && (
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", padding: "4px 8px 6px" }}>
            MENU
          </p>
        )}

        {mainNav.map(({ icon: Icon, label }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => onSetActive(label)}
              className="flex items-center w-full rounded transition-colors"
              title={isCollapsed ? label : undefined}
              style={{
                height: 34,
                paddingLeft: isCollapsed ? 0 : 12,
                paddingRight: isCollapsed ? 0 : 12,
                justifyContent: isCollapsed ? "center" : "flex-start",
                background: isActive ? "var(--sidebar-accent)" : "transparent",
                color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, marginLeft: 10 }}>{label}</span>
                  {isActive && <ChevronRight size={13} className="ml-auto" style={{ opacity: 0.4 }} />}
                </>
              )}
            </button>
          );
        })}

        {!isCollapsed && (
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", padding: "16px 8px 6px" }}>
            TRANSACT
          </p>
        )}
        {documentsNav.map(({ icon: Icon, label }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => onSetActive(label)}
              className="flex items-center w-full rounded transition-colors"
              title={isCollapsed ? label : undefined}
              style={{
                height: 34,
                paddingLeft: isCollapsed ? 0 : 12,
                paddingRight: isCollapsed ? 0 : 12,
                justifyContent: isCollapsed ? "center" : "flex-start",
                background: isActive ? "var(--sidebar-accent)" : "transparent",
                color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, marginLeft: 10 }}>{label}</span>
                  {isActive && <ChevronRight size={13} className="ml-auto" style={{ opacity: 0.4 }} />}
                </>
              )}
            </button>
          );
        })}

        {!isCollapsed && (
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", padding: "16px 8px 6px" }}>
            OPERATIONS
          </p>
        )}
        {operationsNav.map(({ icon: Icon, label }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => onSetActive(label)}
              className="flex items-center w-full rounded transition-colors"
              title={isCollapsed ? label : undefined}
              style={{
                height: 34,
                paddingLeft: isCollapsed ? 0 : 12,
                paddingRight: isCollapsed ? 0 : 12,
                justifyContent: isCollapsed ? "center" : "flex-start",
                background: isActive ? "var(--sidebar-accent)" : "transparent",
                color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, marginLeft: 10 }}>{label}</span>
                  {isActive && <ChevronRight size={13} className="ml-auto" style={{ opacity: 0.4 }} />}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Dark mode toggle */}
      <div className="px-3 py-4 flex justify-center flex-shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={onToggleDark}
          className="flex items-center w-full rounded-lg transition-colors"
          title={isCollapsed ? `Switch to ${dark ? "Light" : "Dark"}` : undefined}
          style={{
            height: 36,
            paddingLeft: isCollapsed ? 0 : 12,
            paddingRight: isCollapsed ? 0 : 12,
            justifyContent: isCollapsed ? "center" : "flex-start",
            background: "var(--sidebar-accent)",
            border: "1px solid var(--sidebar-border)",
            cursor: "pointer",
            color: "var(--sidebar-foreground)",
          }}
        >
          {dark ? <Sun size={14} className="flex-shrink-0" /> : <Moon size={14} className="flex-shrink-0" />}
          {!isCollapsed && (
            <>
              <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 8 }}>Switch to {dark ? "Light" : "Dark"}</span>
              <div
                className="ml-auto rounded-full flex items-center flex-shrink-0"
                style={{ width: 28, height: 16, background: dark ? "var(--foreground)" : "var(--muted-foreground)", padding: "2px", transition: "background 0.2s" }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: 12, height: 12,
                    background: dark ? "var(--background)" : "var(--sidebar)",
                    transform: dark ? "translateX(12px)" : "translateX(0)",
                    transition: "transform 0.2s",
                  }}
                />
              </div>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
