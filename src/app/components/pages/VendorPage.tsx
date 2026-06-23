import { useState, useEffect, useContext } from "react";
import { ListPage } from "./ListPage";
import { VendorDetailPage } from "./VendorDetailPage";
import { CompanySwitch } from "../CompanySwitch";
import { ActivityContext } from "../../contexts";
import { MessageSquare } from "lucide-react";

const statusColor: Record<string, string> = { Active: "#4ade80", Hold: "#fbbf24", Suspended: "#f87171", Inactive: "#888896" };

const rows = [
  { id: "VND-001", name: "TechSupply Co", memberType: "Non MSME", gstTreatment: "GST Registered", state: "Tamil Nadu", createdAt: "Jan 10, 2026", status: "Active" },
  { id: "VND-002", name: "OfficeMax Pro", memberType: "MSME – Small", gstTreatment: "GST Registered", state: "Maharashtra", createdAt: "Feb 3, 2026", status: "Active" },
  { id: "VND-003", name: "CloudNet Solutions", memberType: "Non MSME", gstTreatment: "Unregistered", state: "Karnataka", createdAt: "Mar 15, 2026", status: "Hold" },
  { id: "VND-004", name: "Green Facilities", memberType: "MSME – Micro", gstTreatment: "Composition", state: "Delhi", createdAt: "Mar 22, 2026", status: "Active" },
  { id: "VND-005", name: "SafeLogistics", memberType: "Non MSME", gstTreatment: "GST Registered", state: "Gujarat", createdAt: "Apr 5, 2026", status: "Active" },
  { id: "VND-006", name: "PrintHouse Ltd", memberType: "MSME – Small", gstTreatment: "GST Registered", state: "West Bengal", createdAt: "Apr 18, 2026", status: "Suspended" },
  { id: "VND-007", name: "DataVault Inc", memberType: "Foreign Vendor", gstTreatment: "Overseas", state: "—", createdAt: "May 2, 2026", status: "Active" },
  { id: "VND-008", name: "Cleanroom Services", memberType: "Non MSME", gstTreatment: "GST Registered", state: "Tamil Nadu", createdAt: "May 14, 2026", status: "Active" },
  { id: "VND-009", name: "MediaBridge", memberType: "MSME – Medium", gstTreatment: "GST Registered", state: "Telangana", createdAt: "May 27, 2026", status: "Hold" },
  { id: "VND-010", name: "SwiftCargo", memberType: "Non MSME", gstTreatment: "Special Economic Zone", state: "Maharashtra", createdAt: "Jun 3, 2026", status: "Active" },
  { id: "VND-011", name: "NextLevel IT", memberType: "Foreign Vendor", gstTreatment: "Overseas", state: "—", createdAt: "Jun 9, 2026", status: "Active" },
  { id: "VND-012", name: "FoodFirst Corp", memberType: "MSME – Micro", gstTreatment: "Composition", state: "Karnataka", createdAt: "Jun 15, 2026", status: "Inactive" },
];

const filters = [
  { key: "memberType", label: "Member Type", options: ["Non MSME", "MSME – Micro", "MSME – Small", "MSME – Medium", "Foreign Vendor"] },
  { key: "gstTreatment", label: "GST Treatment", options: ["GST Registered", "Unregistered", "Composition", "Overseas", "Special Economic Zone"] },
  { key: "state", label: "State", options: ["Tamil Nadu", "Maharashtra", "Karnataka", "Delhi", "Gujarat", "West Bengal", "Telangana"] },
  { key: "status", label: "Status", options: ["Active", "Hold", "Suspended", "Inactive"] },
];

interface VendorPageProps {
  highlightId?: string;
  prefill?: Record<string, string>;
  navReferrer?: string;
  onBackToInbox?: () => void;
}

export function VendorPage({ highlightId, prefill, navReferrer, onBackToInbox }: VendorPageProps) {
  const openActivity = useContext(ActivityContext);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(() => !!prefill);

  useEffect(() => {
    if (highlightId) {
      setDetailId(highlightId);
    }
  }, [highlightId]);

  useEffect(() => {
    if (prefill) {
      setCreatingNew(true);
    }
  }, [prefill]);

  const columns = [
    {
      key: "id", label: "Vendor ID", mono: true,
      render: (val: unknown) => (
        <button
          onClick={() => setDetailId(String(val))}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontFamily: "var(--font-mono)",
            color: "#6b8cff", textDecoration: "none", padding: 0,
          }}
        >
          {String(val)}
        </button>
      ),
    },
    { key: "name", label: "Vendor Name" },
    { key: "memberType", label: "Member Type" },
    { key: "gstTreatment", label: "GST Treatment" },
    { key: "state", label: "State" },
    { key: "createdAt", label: "Created At", mono: true },
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
      key: "completion", colId: "completion", label: "Completion",
      render: (val: unknown, row: Record<string, unknown>) => {
        const idStr = String(row.id);
        const pct = idStr.includes("001") ? 100 : idStr.includes("002") ? 82 : idStr.includes("003") ? 45 : 95;
        return (
          <div className="flex items-center gap-2">
             <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
               <div className="h-full" style={{ width: `${pct}%`, background: pct === 100 ? "#4ade80" : "#6b8cff" }}/>
             </div>
             <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{pct}%</span>
          </div>
        );
      }
    },
    {
      key: "id", colId: "activity", label: "Activity",
      render: (val: unknown, row: Record<string, unknown>) => {
        const collabRecord = {
          type: "Vendor",
          id: String(val),
          name: String(row.name || "Vendor"),
          status: String(row.status || "Active"),
          createdBy: "Alex Johnson",
          createdDate: String(row.createdAt || "Jan 10, 2026")
        };
        return (
          <button
            onClick={() => openActivity(collabRecord)}
            className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-accent relative"
            style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
            title="Open Activity Workspace"
          >
            <MessageSquare size={14} />
            {(String(val) === "VND-002" || String(val) === "VND-003") && (
               <span className="absolute top-0 right-0 flex items-center justify-center rounded-full bg-red-500 text-white" style={{ width: 14, height: 14, fontSize: 9, transform: "translate(25%, -25%)" }}>
                 {String(val) === "VND-002" ? 2 : 1}
               </span>
            )}
          </button>
        );
      }
    },
  ];

  if (creatingNew) {
    return <VendorDetailPage vendorId="NEW" isNew onClose={() => setCreatingNew(false)} prefill={prefill} />;
  }

  if (detailId) {
    return (
      <VendorDetailPage
        vendorId={detailId}
        onClose={() => {
          if (navReferrer === "from_inbox") {
            onBackToInbox?.();
          } else {
            setDetailId(null);
          }
        }}
      />
    );
  }

  return (
    <ListPage
      title="Vendors"
      addLabel="New Vendor"
      columns={columns}
      rows={rows}
      filters={filters}
      onAdd={() => setCreatingNew(true)}
      titleSlot={<CompanySwitch />}
    />
  );
}
