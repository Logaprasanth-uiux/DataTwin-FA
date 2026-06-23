import { useState } from "react";
import { Check, X } from "lucide-react";

const summaryCards = [
  { label: "Awaiting Approval", value: 12, color: "#fbbf24" },
  { label: "Validated", value: 38, color: "#4ade80" },
  { label: "Change Request", value: 6, color: "#6b8cff" },
  { label: "Rejected", value: 4, color: "#f87171" },
];

type ApprovalTab = "All" | "Purchase Order" | "Invoice" | "Vendor";
const approvalTabs: ApprovalTab[] = ["All", "Purchase Order", "Invoice", "Vendor"];

interface ApprovalRow {
  id: string;
  type: "Purchase Order" | "Invoice" | "Vendor";
  name: string;
  submittedBy: string;
  date: string;
  status: "Awaiting Approval" | "Change Request";
}

const poRows: ApprovalRow[] = [
  { id: "PO-2026-009", type: "Purchase Order", name: "Media Equipment Q3", submittedBy: "Anita Kumar", date: "Jun 12, 2026", status: "Awaiting Approval" },
  { id: "PO-2026-011", type: "Purchase Order", name: "IT Hardware Refresh", submittedBy: "Ravi Srinivasan", date: "Jun 14, 2026", status: "Awaiting Approval" },
  { id: "PO-2026-013", type: "Purchase Order", name: "Office Supplies Annual", submittedBy: "Meera Pillai", date: "Jun 16, 2026", status: "Change Request" },
  { id: "PO-2026-014", type: "Purchase Order", name: "Cloud Infra Upgrade", submittedBy: "Priya Ramesh", date: "Jun 17, 2026", status: "Awaiting Approval" },
];

const invoiceRows: ApprovalRow[] = [
  { id: "INV-2026-003", type: "Invoice", name: "CloudNet Solutions — Jun Invoice", submittedBy: "Finance Team", date: "Jun 04, 2026", status: "Awaiting Approval" },
  { id: "INV-2026-007", type: "Invoice", name: "SwiftCargo — Logistics Jun", submittedBy: "Finance Team", date: "Jun 09, 2026", status: "Change Request" },
  { id: "INV-2026-011", type: "Invoice", name: "NextLevel IT — SaaS License", submittedBy: "Kiran Nair", date: "Jun 14, 2026", status: "Awaiting Approval" },
  { id: "INV-2026-015", type: "Invoice", name: "MediaBridge — Production Jun", submittedBy: "Finance Team", date: "Jun 16, 2026", status: "Awaiting Approval" },
];

const vendorRows: ApprovalRow[] = [
  { id: "VND-013", type: "Vendor", name: "Zenith Packaging Co", submittedBy: "Procurement", date: "Jun 10, 2026", status: "Awaiting Approval" },
  { id: "VND-014", type: "Vendor", name: "Alpine Security Systems", submittedBy: "Operations", date: "Jun 13, 2026", status: "Change Request" },
  { id: "VND-015", type: "Vendor", name: "Vertex Analytics Pvt Ltd", submittedBy: "Technology", date: "Jun 15, 2026", status: "Awaiting Approval" },
  { id: "VND-016", type: "Vendor", name: "PrecisionParts Inc", submittedBy: "Manufacturing", date: "Jun 18, 2026", status: "Awaiting Approval" },
];

const statusColor: Record<string, string> = {
  "Awaiting Approval": "#fbbf24",
  "Change Request": "#6b8cff",
};

function ApprovalTable({ rows }: { rows: ApprovalRow[] }) {
  const [localRows, setLocalRows] = useState(rows);

  function handleAction(id: string, action: "approve" | "reject") {
    setLocalRows(prev => prev.filter(r => r.id !== id));
    alert(`${action === "approve" ? "Approved" : "Rejected"}: ${id}`);
  }

  if (localRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <Check size={24} style={{ color: "#4ade80" }} />
        <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>All items processed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
            {["ID", "Name / Description", "Type", "Submitted By", "Date", "Status", "Actions"].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                {h.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {localRows.map((row, i) => (
            <tr key={row.id} style={{ borderBottom: i < localRows.length - 1 ? "1px solid var(--border)" : "none", background: "var(--card)" }}>
              <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "var(--font-mono)", color: "#6b8cff" }}>{row.id}</td>
              <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)", maxWidth: 220 }}>
                <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{row.name}</span>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <span className="rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", whiteSpace: "nowrap" }}>
                  {row.type}
                </span>
              </td>
              <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>{row.submittedBy}</td>
              <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{row.date}</td>
              <td style={{ padding: "12px 16px" }}>
                <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: statusColor[row.status] }}>
                  <span className="rounded-full" style={{ width: 6, height: 6, background: statusColor[row.status], display: "inline-block", flexShrink: 0 }} />
                  {row.status}
                </span>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(row.id, "approve")}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors"
                    style={{ fontSize: 11, fontWeight: 600, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", cursor: "pointer", color: "#4ade80" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.22)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.12)")}
                  >
                    <Check size={11} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(row.id, "reject")}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors"
                    style={{ fontSize: 11, fontWeight: 600, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer", color: "#f87171" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.18)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}
                  >
                    <X size={11} /> Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<ApprovalTab>("All");

  const allRows = [...poRows, ...invoiceRows, ...vendorRows];
  const tableRows = activeTab === "All" ? allRows : allRows.filter(r => r.type === activeTab);

  return (
    <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em" }}>Approvals</h1>

      {/* Summary cards — horizontal row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {summaryCards.map(card => (
          <div key={card.label} className="rounded-xl flex flex-col gap-2 px-5 py-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>{card.label.toUpperCase()}</span>
            <div className="flex items-end gap-2">
              <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", color: card.color, lineHeight: 1 }}>{card.value}</span>
              <span className="rounded-full" style={{ width: 8, height: 8, background: card.color, display: "inline-block", marginBottom: 5 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Type selector tabs */}
      <div className="flex gap-0 rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)", width: "fit-content" }}>
        {approvalTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 transition-colors"
            style={{
              fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              background: activeTab === tab ? "var(--foreground)" : "transparent",
              color: activeTab === tab ? "var(--background)" : "var(--muted-foreground)",
              border: "none", cursor: "pointer",
              width: 140,
              textAlign: "center",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <ApprovalTable key={activeTab} rows={tableRows} />
    </main>
  );
}
