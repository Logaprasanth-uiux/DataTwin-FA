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

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 220,
        minWidth: 220,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo & Standalone Notifications Button */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 56, borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded"
            style={{ width: 26, height: 26, background: "var(--foreground)" }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--background)", fontFamily: "var(--font-mono)" }}>
              DT
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sidebar-primary)", letterSpacing: "-0.02em" }}>
            DataTwin AI
          </span>
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => onSetActive("Inbox")}
          className="relative flex items-center justify-center rounded-lg p-1.5 transition-colors"
          style={{
            background: active === "Inbox" ? "var(--sidebar-accent)" : "transparent",
            color: active === "Inbox" ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
            border: "none",
            cursor: "pointer",
          }}
          title="Inbox Notifications"
        >
          <Inbox size={17} strokeWidth={active === "Inbox" ? 2 : 1.5} />
          {unreadCount > 0 && (
            <span
              className="absolute flex items-center justify-center rounded-full"
              style={{
                top: 2,
                right: 2,
                transform: "translate(25%, -25%)",
                minWidth: 16,
                height: 16,
                background: "#f87171",
                fontSize: 9,
                fontWeight: 700,
                color: "#fff",
                padding: "0 3px",
                border: "2px solid var(--sidebar)",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-3 flex flex-col gap-0.5 overflow-y-auto">
        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", padding: "4px 8px 6px" }}>
          MENU
        </p>

        {mainNav.map(({ icon: Icon, label }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => onSetActive(label)}
              className="flex items-center gap-2.5 w-full rounded px-3 transition-colors"
              style={{
                height: 34,
                background: isActive ? "var(--sidebar-accent)" : "transparent",
                color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400 }}>{label}</span>
              {isActive && <ChevronRight size={13} className="ml-auto" style={{ opacity: 0.4 }} />}
            </button>
          );
        })}

        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", padding: "16px 8px 6px" }}>
          TRANSACT
        </p>
        {documentsNav.map(({ icon: Icon, label }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => onSetActive(label)}
              className="flex items-center gap-2.5 w-full rounded px-3 transition-colors"
              style={{
                height: 34,
                background: isActive ? "var(--sidebar-accent)" : "transparent",
                color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400 }}>{label}</span>
              {isActive && <ChevronRight size={13} className="ml-auto" style={{ opacity: 0.4 }} />}
            </button>
          );
        })}

        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", padding: "16px 8px 6px" }}>
          OPERATIONS
        </p>
        {operationsNav.map(({ icon: Icon, label }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => onSetActive(label)}
              className="flex items-center gap-2.5 w-full rounded px-3 transition-colors"
              style={{
                height: 34,
                background: isActive ? "var(--sidebar-accent)" : "transparent",
                color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400 }}>{label}</span>
              {isActive && <ChevronRight size={13} className="ml-auto" style={{ opacity: 0.4 }} />}
            </button>
          );
        })}
      </nav>

      {/* Dark mode toggle */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={onToggleDark}
          className="flex items-center gap-2.5 w-full rounded-lg px-3 transition-colors"
          style={{
            height: 36,
            background: "var(--sidebar-accent)",
            border: "1px solid var(--sidebar-border)",
            cursor: "pointer",
            color: "var(--sidebar-foreground)",
          }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          <span style={{ fontSize: 12, fontWeight: 500 }}>Switch to {dark ? "Light" : "Dark"}</span>
          <div
            className="ml-auto rounded-full flex items-center"
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
        </button>
      </div>
    </aside>
  );
}
