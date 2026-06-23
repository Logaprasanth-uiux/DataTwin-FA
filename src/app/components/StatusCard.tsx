interface StatusItem {
  label: string;
  value: number;
  color: string;
}

interface StatusCardProps {
  title: string;
  items: StatusItem[];
  onClick?: () => void;
}

export function StatusCard({ title, items, onClick }: StatusCardProps) {
  return (
    <div
      className="flex flex-col gap-5 rounded-lg p-5 transition-colors"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--foreground)"; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
    >
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
          {title}
        </p>
        {onClick && (
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>View all →</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map(({ label, value, color }) => (
          <div
            key={label}
            className="flex flex-col gap-1.5 rounded-lg p-3"
            style={{ background: "var(--muted)" }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="rounded-full"
                style={{ width: 7, height: 7, background: color, display: "inline-block", flexShrink: 0 }}
              />
              <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 500 }}>{label}</span>
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "var(--foreground)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontFamily: "var(--font-mono)",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
