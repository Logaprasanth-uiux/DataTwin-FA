import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  sub: string;
}

export function StatCard({ label, value, change, positive, sub }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg p-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: "0.02em" }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </p>
      <div className="flex items-center gap-1.5">
        {positive ? (
          <TrendingUp size={13} style={{ color: "#4ade80" }} />
        ) : (
          <TrendingDown size={13} style={{ color: "var(--destructive)" }} />
        )}
        <span style={{ fontSize: 12, color: positive ? "#4ade80" : "var(--destructive)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
          {change}
        </span>
        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{sub}</span>
      </div>
    </div>
  );
}
