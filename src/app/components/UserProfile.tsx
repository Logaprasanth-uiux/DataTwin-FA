import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Bell, CheckSquare, HelpCircle, ShieldCheck, Inbox } from "lucide-react";
import { useActivity } from "../contexts";

interface UserProfileProps {
  size?: "sm" | "md";
}

export function UserProfile({ size = "md" }: UserProfileProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout } = useActivity();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const avatarSize = size === "sm" ? 28 : 30;
  const nameFontSize = size === "sm" ? 11 : 12;
  const roleFontSize = size === "sm" ? 10 : 11;
  const gap = size === "sm" ? 2 : 2.5;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size === "sm" ? "10px" : "14px" }}>
      {/* Inbox Notification */}
      <InboxNotification size={size} />

      {/* Notification Bell */}
      <NotificationBell size={size} />

      {/* Profile Trigger & Dropdown */}
      <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center rounded-lg px-2 py-1 transition-colors hover:bg-accent select-none"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            color: "var(--foreground)",
            gap: gap === 2 ? 8 : 10,
          }}
        >
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: avatarSize,
              height: avatarSize,
              background: "var(--accent)",
              fontSize: size === "sm" ? 10 : 11,
              fontWeight: size === "sm" ? 700 : 600,
              color: "var(--foreground)",
            }}
          >
            AJ
          </div>
          <div className="flex flex-col flex-grow min-w-0">
            <span style={{ fontSize: nameFontSize, fontWeight: 500, color: "var(--foreground)", whiteSpace: "nowrap" }}>
              Alex Johnson
            </span>
            <span style={{ fontSize: roleFontSize, color: "var(--muted-foreground)" }}>
              Admin
            </span>
          </div>
          <ChevronDown
            size={12}
            style={{
              color: "var(--muted-foreground)",
              opacity: 0.6,
              transition: "transform 0.15s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0,
            }}
          />
        </button>

        {open && (
          <div
            className="absolute rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
            style={{
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: 160,
              background: "var(--popover)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 100,
            }}
          >
            <div style={{ padding: "10px 12px 6px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Alex Johnson</p>
              <p style={{ fontSize: 10, color: "var(--muted-foreground)", margin: 0 }}>demo@datatwin.ai</p>
            </div>
            
            <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />

            <button
              onClick={() => {
                setOpen(false);
                logout?.();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#f87171",
                fontSize: 12,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationBell({ size }: { size: "sm" | "md" }) {
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const { pendingNotifications = [], navigateToRecord } = useActivity();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare size={12} className="text-amber-500" />;
      case "info_request":
        return <HelpCircle size={12} className="text-blue-500" />;
      case "approval_request":
        return <ShieldCheck size={12} className="text-emerald-500" />;
      default:
        return <Bell size={12} className="text-muted-foreground" />;
    }
  };

  return (
    <div ref={bellRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setBellOpen((o) => !o)}
        className="flex items-center justify-center rounded-lg hover:bg-accent transition-colors relative"
        style={{
          width: size === "sm" ? 28 : 32,
          height: size === "sm" ? 28 : 32,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--foreground)",
        }}
      >
        <Bell size={size === "sm" ? 15 : 17} />
        {pendingNotifications.length > 0 && (
          <span
            className="absolute rounded-full flex items-center justify-center font-bold text-white bg-red-500"
            style={{
              top: 1,
              right: 1,
              width: 13,
              height: 13,
              fontSize: "8.5px",
              boxShadow: "0 0 0 2px var(--card)"
            }}
          >
            {pendingNotifications.length}
          </span>
        )}
      </button>

      {bellOpen && (
        <div
          className="absolute rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          style={{
            top: "calc(100% + 6px)",
            right: 0,
            width: 280,
            background: "var(--popover)",
            border: "1px solid var(--border)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            zIndex: 100,
          }}
        >
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between" style={{ background: "var(--card)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }}>Pending Actions</span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-secondary text-muted-foreground">
              {pendingNotifications.length} open
            </span>
          </div>

          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {pendingNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center" style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>
                No actions pending. All tasks resolved!
              </div>
            ) : (
              pendingNotifications.map((notif, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setBellOpen(false);
                    navigateToRecord?.(notif.recordType, notif.recordId);
                  }}
                  className="w-full text-left p-3 border-b border-border flex items-start gap-2.5 transition-colors cursor-pointer"
                  style={{ background: "transparent", border: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="mt-0.5 flex-shrink-0">{getIcon(notif.type)}</span>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] font-bold" style={{ color: "var(--foreground)" }}>{notif.actionId}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">{notif.recordId}</span>
                    </div>
                    <span style={{ fontSize: 11.5, color: "var(--foreground)", fontWeight: 500 }} className="truncate">
                      {notif.content}
                    </span>
                    <span style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                      Assignee: {notif.owner}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InboxNotification({ size }: { size: "sm" | "md" }) {
  const { activePage, setActivePage, unreadInboxCount = 0 } = useActivity();
  
  if (!setActivePage) return null;

  const isActive = activePage === "Inbox";

  return (
    <button
      onClick={() => setActivePage("Inbox")}
      className="flex items-center justify-center rounded-lg hover:bg-accent transition-colors relative"
      style={{
        width: size === "sm" ? 28 : 32,
        height: size === "sm" ? 28 : 32,
        background: isActive ? "var(--accent)" : "transparent",
        border: "none",
        cursor: "pointer",
        color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
      }}
      title="Inbox Notifications"
    >
      <Inbox size={size === "sm" ? 15 : 17} strokeWidth={isActive ? 2 : 1.5} />
      {unreadInboxCount > 0 && (
        <span
          className="absolute rounded-full flex items-center justify-center font-bold text-white bg-red-500"
          style={{
            top: 1,
            right: 1,
            width: 13,
            height: 13,
            fontSize: "8.5px",
            boxShadow: "0 0 0 2px var(--card)"
          }}
        >
          {unreadInboxCount}
        </span>
      )}
    </button>
  );
}
