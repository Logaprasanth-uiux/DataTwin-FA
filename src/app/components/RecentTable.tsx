const transactions = [
  { id: "TXN-4821", user: "Sarah Chen", amount: "$1,240.00", status: "Completed", date: "Jun 18, 2026" },
  { id: "TXN-4820", user: "Marcus Reid", amount: "$580.50", status: "Pending", date: "Jun 18, 2026" },
  { id: "TXN-4819", user: "Leila Osei", amount: "$3,100.00", status: "Completed", date: "Jun 17, 2026" },
  { id: "TXN-4818", user: "Tomás Rivera", amount: "$220.00", status: "Failed", date: "Jun 17, 2026" },
  { id: "TXN-4817", user: "Yuki Tanaka", amount: "$890.75", status: "Completed", date: "Jun 16, 2026" },
];

const statusColor: Record<string, string> = {
  Completed: "#4ade80",
  Pending: "#fbbf24",
  Failed: "#f87171",
};

export function RecentTable() {
  return (
    <div
      className="rounded-lg flex flex-col"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Recent Transactions</p>
        <button
          style={{ fontSize: 12, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
        >
          View all →
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["ID", "User", "Amount", "Status", "Date"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 20px",
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {h.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr
              key={tx.id}
              style={{
                borderBottom: i < transactions.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "12px 20px", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{tx.id}</td>
              <td style={{ padding: "12px 20px", fontSize: 13, color: "var(--foreground)" }}>{tx.user}</td>
              <td style={{ padding: "12px 20px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>{tx.amount}</td>
              <td style={{ padding: "12px 20px" }}>
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ fontSize: 12, color: statusColor[tx.status] }}
                >
                  <span
                    className="rounded-full"
                    style={{ width: 6, height: 6, background: statusColor[tx.status], display: "inline-block" }}
                  />
                  {tx.status}
                </span>
              </td>
              <td style={{ padding: "12px 20px", fontSize: 12, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{tx.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
