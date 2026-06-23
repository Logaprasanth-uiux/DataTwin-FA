import { useState, useEffect } from "react";
import { ListPage } from "./ListPage";
import { BillDetailPage } from "./BillDetailPage";
import { FileSearch } from "lucide-react";
import { CompanySwitch } from "../CompanySwitch";
import { DateRangeFilter } from "../DateRangeFilter";
import { AIBillScanner, type ScannedBillData } from "../AIBillScanner";

function currentMonthRange() {
  const now = new Date();
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
}

const statusColor: Record<string, string> = {
  Received: "#6b8cff", "In Progress": "#fbbf24", Validated: "#4ade80", Rejected: "#f87171",
};

const rows = [
  { id: "INV-2026-001", vendorId: "VND-001", vendor: "TechSupply Co", date: "Jun 01, 2026", status: "Validated" },
  { id: "INV-2026-002", vendorId: "VND-002", vendor: "OfficeMax Pro", date: "Jun 03, 2026", status: "In Progress" },
  { id: "INV-2026-003", vendorId: "VND-003", vendor: "CloudNet Solutions", date: "Jun 04, 2026", status: "Received" },
  { id: "INV-2026-004", vendorId: "VND-004", vendor: "Green Facilities", date: "Jun 05, 2026", status: "Validated" },
  { id: "INV-2026-005", vendorId: "VND-005", vendor: "SafeLogistics", date: "Jun 07, 2026", status: "Rejected" },
  { id: "INV-2026-006", vendorId: "VND-001", vendor: "TechSupply Co", date: "Jun 08, 2026", status: "Validated" },
  { id: "INV-2026-007", vendorId: "VND-010", vendor: "SwiftCargo", date: "Jun 09, 2026", status: "In Progress" },
  { id: "INV-2026-008", vendorId: "VND-006", vendor: "PrintHouse Ltd", date: "Jun 10, 2026", status: "Received" },
  { id: "INV-2026-009", vendorId: "VND-009", vendor: "MediaBridge", date: "Jun 12, 2026", status: "In Progress" },
  { id: "INV-2026-010", vendorId: "VND-012", vendor: "FoodFirst Corp", date: "Jun 13, 2026", status: "Validated" },
  { id: "INV-2026-011", vendorId: "VND-011", vendor: "NextLevel IT", date: "Jun 14, 2026", status: "Received" },
  { id: "INV-2026-012", vendorId: "VND-001", vendor: "TechSupply Co", date: "Jun 16, 2026", status: "Validated" },
];

const filters = [
  { key: "vendor", label: "Vendor", options: ["TechSupply Co", "OfficeMax Pro", "CloudNet Solutions", "Green Facilities", "SafeLogistics", "SwiftCargo", "PrintHouse Ltd", "MediaBridge", "FoodFirst Corp", "NextLevel IT"] },
  { key: "status", label: "Status", options: ["Received", "In Progress", "Validated", "Rejected"] },
];

type View = "list" | "detail" | "new";

interface BillPageProps {
  highlightId?: string;
  prefill?: any;
  navReferrer?: string;
  onBackToInbox?: () => void;
  onBackToOverview?: () => void;
}

export function BillPage({ highlightId, prefill, navReferrer, onBackToInbox, onBackToOverview }: BillPageProps) {
  const [view, setView] = useState<View>(() => prefill ? "new" : "list");
  const [activeId, setActiveId] = useState<string>("");
  const [activeStatus, setActiveStatus] = useState<string>("Received");
  const [docPopupId, setDocPopupId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(currentMonthRange);
  const [scannerPrefill, setScannerPrefill] = useState<ScannedBillData | null>(() => prefill || null);

  useEffect(() => {
    if (highlightId) {
      setActiveId(highlightId);
      const matched = rows.find(r => r.id === highlightId);
      setActiveStatus(matched ? matched.status : "Received");
      setView("detail");
    }
  }, [highlightId]);

  useEffect(() => {
    if (prefill) {
      setScannerPrefill(prefill);
      setView("new");
    }
  }, [prefill]);

  const columns = [
    {
      key: "id", label: "Bill Number", mono: true,
      render: (val: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => { setActiveId(String(val)); setActiveStatus(String(row.status ?? "Received")); setView("detail"); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-mono)", color: "#6b8cff", textDecoration: "none", padding: 0 }}
        >
          {String(val)}
        </button>
      ),
    },
    { key: "vendorId", label: "Vendor ID", mono: true },
    { key: "vendor", label: "Vendor Name" },
    { key: "date", label: "Date", mono: true },
    {
      key: "status", label: "Status",
      render: (val: unknown) => (
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: statusColor[String(val)] }}>
          <span className="rounded-full" style={{ width: 6, height: 6, background: statusColor[String(val)], display: "inline-block" }} />
          {String(val)}
        </span>
      ),
    },
    {
      key: "id", colId: "view_bill", label: "View Bill",
      render: (val: unknown) => (
        <button
          onClick={() => setDocPopupId(String(val))}
          className="flex items-center gap-1 rounded px-2 py-1 transition-colors"
          style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
        >
          <FileSearch size={11} /> View Bill
        </button>
      ),
    },
  ];

  if (view === "new") return (
    <BillDetailPage
      billId="NEW"
      isNew
      onClose={() => setView("list")}
      prefill={scannerPrefill ?? undefined}
    />
  );
  if (view === "detail") return (
    <BillDetailPage
      billId={activeId}
      billStatus={activeStatus}
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
      {/* Bill doc popup */}
      {docPopupId && (
        <div
          className="flex items-center justify-center"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={() => setDocPopupId(null)}
        >
          <div
            className="flex flex-col items-center justify-center rounded-2xl gap-4"
            style={{ width: "min(600px,90vw)", padding: 48, background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <FileSearch size={40} style={{ color: "var(--muted-foreground)" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>Bill Document</p>
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{docPopupId}</p>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Document preview not available in this environment.</p>
            <button
              onClick={() => setDocPopupId(null)}
              className="rounded-lg px-4 py-2"
              style={{ fontSize: 13, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* New Bill with AI scanner — shown above list when creating */}
      <ListPage
        title="Bills / Invoices"
        addLabel="New Bill"
        columns={columns}
        rows={rows}
        filters={filters}
        highlightId={highlightId}
        idKey="id"
        onAdd={() => { setScannerPrefill(null); setView("new"); }}
        titleSlot={<CompanySwitch />}
        filterSlot={<DateRangeFilter from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />}
      />
    </>
  );
}
