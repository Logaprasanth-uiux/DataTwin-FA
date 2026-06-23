import { useState, useRef, useEffect, useContext } from "react";
import { User, Settings, Bell, HelpCircle, LogOut } from "lucide-react";
import { AuthContext } from "../contexts";

export function UserProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { onLogout } = useContext(AuthContext);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left p-1 rounded-lg transition-colors hover:bg-accent"
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 30, height: 30, background: "var(--accent)", fontSize: 11, fontWeight: 600, color: "var(--foreground)", flexShrink: 0 }}
        >
          AJ
        </div>
        <div className="flex flex-col">
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>Alex Johnson</span>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Admin</span>
        </div>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 rounded-lg shadow-lg py-1 flex flex-col z-50"
          style={{ width: 200, background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-foreground bg-transparent border-none cursor-pointer hover:bg-accent text-left transition-colors">
            <User size={14} /> My Profile
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-foreground bg-transparent border-none cursor-pointer hover:bg-accent text-left transition-colors">
            <Settings size={14} /> Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-foreground bg-transparent border-none cursor-pointer hover:bg-accent text-left transition-colors">
            <Bell size={14} /> Notifications
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-foreground bg-transparent border-none cursor-pointer hover:bg-accent text-left transition-colors">
            <HelpCircle size={14} /> Help
          </button>
          <div className="my-1 border-t border-border" />
          <button 
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-transparent border-none cursor-pointer hover:bg-accent text-left transition-colors"
            style={{ color: "#ef4444" }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
