import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Building2 } from "lucide-react";

const companies = [
  { id: 1, name: "Acme Corp", role: "Admin" },
  { id: 2, name: "Globex Ltd", role: "Viewer" },
  { id: 3, name: "Initech Inc", role: "Admin" },
];

export function CompanySwitch() {
  const [selected, setSelected] = useState(companies[0]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-3 transition-colors"
        style={{
          height: 34,
          background: "var(--secondary)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          color: "var(--foreground)",
          gap: 8,
        }}
      >
        <Building2 size={13} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{selected.name}</span>
        <ChevronDown
          size={13}
          style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute rounded-lg overflow-hidden"
          style={{
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 200,
            background: "var(--popover)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 50,
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", padding: "10px 12px 6px" }}>
            SWITCH COMPANY
          </p>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelected(c); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 transition-colors"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                className="flex items-center justify-center rounded flex-shrink-0"
                style={{ width: 24, height: 24, background: "var(--accent)", fontSize: 10, fontWeight: 600, color: "var(--foreground)" }}
              >
                {c.name[0]}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{c.role}</span>
              </div>
              {selected.id === c.id && (
                <Check size={13} style={{ color: "var(--foreground)", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
