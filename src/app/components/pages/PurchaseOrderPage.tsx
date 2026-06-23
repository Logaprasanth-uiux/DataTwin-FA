import { useState, useEffect } from "react";
import { ListPage } from "./ListPage";
import { PODetailPage } from "./PODetailPage";
import { PODocumentView } from "./PODocumentView";
import { FileSearch } from "lucide-react";
import { CompanySwitch } from "../CompanySwitch";
import { DateRangeFilter } from "../DateRangeFilter";

function currentMonthRange() {
  const now = new Date();
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
}

const statusColor: Record<string, string> = {
  Draft: "#888896", Sent: "#6b8cff", Approved: "#4ade80", Rejected: "#f87171", "Pending Approval": "#fbbf24",
};

const rows = [
  { id: "PO-2026-001", date: "Jun 01, 2026", vendorId: "VND-001", vendorName: "TechSupply Co", status: "Approved" },
  { id: "PO-2026-002", date: "Jun 03, 2026", vendorId: "VND-002", vendorName: "OfficeMax Pro", status: "Sent" },
  { id: "PO-2026-003", date: "Jun 04, 2026", vendorId: "VND-003", vendorName: "CloudNet Solutions", status: "Draft" },
  { id: "PO-2026-004", date: "Jun 05, 2026", vendorId: "VND-004", vendorName: "Green Facilities", status: "Approved" },
  { id: "PO-2026-005", date: "Jun 07, 2026", vendorId: "VND-005", vendorName: "SafeLogistics", status: "Rejected" },
  { id: "PO-2026-006", date: "Jun 08, 2026", vendorId: "VND-001", vendorName: "TechSupply Co", status: "Approved" },
  { id: "PO-2026-007", date: "Jun 09, 2026", vendorId: "VND-010", vendorName: "SwiftCargo", status: "Sent" },
  { id: "PO-2026-008", date: "Jun 10, 2026", vendorId: "VND-006", vendorName: "PrintHouse Ltd", status: "Draft" },
  { id: "PO-2026-009", date: "Jun 12, 2026", vendorId: "VND-009", vendorName: "MediaBridge", status: "Pending Approval" },
  { id: "PO-2026-010", date: "Jun 13, 2026", vendorId: "VND-012", vendorName: "FoodFirst Corp", status: "Approved" },
  { id: "PO-2026-011", date: "Jun 14, 2026", vendorId: "VND-011", vendorName: "NextLevel IT", status: "Draft" },
  { id: "PO-2026-012", date: "Jun 16, 2026", vendorId: "VND-001", vendorName: "TechSupply Co", status: "Approved" },
];

const filters = [
  { key: "vendorName", label: "Vendor", options: ["TechSupply Co", "OfficeMax Pro", "CloudNet Solutions", "Green Facilities", "SafeLogistics", "SwiftCargo", "PrintHouse Ltd", "MediaBridge", "FoodFirst Corp", "NextLevel IT"] },
  { key: "status", label: "Status", options: ["Draft", "Sent", "Approved", "Rejected", "Pending Approval"] },
];

type View = "list" | "detail" | "new";

interface PurchaseOrderPageProps {
  highlightId?: string;
  prefill?: Record<string, string>;
  navReferrer?: string;
  onBackToInbox?: () => void;
  onBackToOverview?: () => void;
}

export function PurchaseOrderPage({ highlightId, prefill, navReferrer, onBackToInbox, onBackToOverview }: PurchaseOrderPageProps) {
  const [view, setView] = useState<View>(() => (prefill ? "new" : "list"));
  const [activeId, setActiveId] = useState<string>("");
  const [activeStatus, setActiveStatus] = useState<string>("Draft");
  const [docPopupId, setDocPopupId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(currentMonthRange);

  useEffect(() => {
    if (highlightId) {
      setActiveId(highlightId);
      const matched = rows.find(r => r.id === highlightId);
      setActiveStatus(matched ? matched.status : "Draft");
      setView("detail");
    }
  }, [highlightId]);

  useEffect(() => {
    if (prefill) {
      setView("new");
    }
  }, [prefill]);

  const columns = [
    {
      key: "id", label: "PO Number", mono: true,
      render: (val: unknown, row: Record<string, unknown>) => (
        // PO Number → tabbed detail view
        <button
          onClick={() => { setActiveId(String(val)); setActiveStatus(String(row.status ?? "Draft")); setView("detail"); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-mono)", color: "#6b8cff", textDecoration: "none", padding: 0 }}
        >
          {String(val)}
        </button>
      ),
    },
    { key: "date", label: "Date", mono: true },
    { key: "vendorId", label: "Vendor ID", mono: true },
    { key: "vendorName", label: "Vendor Name" },
    {
      key: "status", label: "PO Status",
      render: (val: unknown) => (
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: statusColor[String(val)] }}>
          <span className="rounded-full" style={{ width: 6, height: 6, background: statusColor[String(val)], display: "inline-block" }} />
          {String(val)}
        </span>
      ),
    },
    {
      // Show PO → document/print view
      key: "id", colId: "show_po", label: "Show PO",
      render: (val: unknown) => (
        <button
          onClick={() => setDocPopupId(String(val))}
          className="flex items-center gap-1 rounded px-2 py-1 transition-colors"
          style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
        >
          <FileSearch size={11} /> View PO
        </button>
      ),
    },
  ];

  if (view === "new") return <PODetailPage poId="NEW" isNew onClose={() => setView("list")} prefill={prefill} />;
  if (view === "detail") return (
    <PODetailPage
      poId={activeId}
      poStatus={activeStatus}
      onClose={() => {
        if (navReferrer === "from_inbox") {
          onBackToInbox?.();
        } else if (navReferrer === "from_tree") {
          onBackToOverview?.();
        } else {
          setView("list");
        }
      }}
    />
  );

  return (
    <>
      {/* PO Document modal popup */}
      {docPopupId && (
        <div
          className="flex items-center justify-center"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={() => setDocPopupId(null)}
        >
          <div
            style={{ width: "min(900px, 95vw)", height: "min(90vh, 860px)", display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <PODocumentView poId={docPopupId} onClose={() => setDocPopupId(null)} />
          </div>
        </div>
      )}
      <ListPage
        title="Purchase Orders"
        addLabel="New PO"
        columns={columns}
        rows={rows}
        filters={filters}
        highlightId={highlightId}
        idKey="id"
        onAdd={() => setView("new")}
        titleSlot={<CompanySwitch />}
        filterSlot={<DateRangeFilter from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />}
      />
    </>
  );
}
