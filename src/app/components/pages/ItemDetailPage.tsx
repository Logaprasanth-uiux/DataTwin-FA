import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useActivity } from "../../contexts";
import { rows } from "./ItemPage";

const statusColor: Record<string, string> = { 
  Active: "#4ade80", 
  Hold: "#fbbf24", 
  Inactive: "#888896",
  Pending: "#fbbf24",
  Approved: "#4ade80",
  Rejected: "#f87171"
};

interface WorkflowActivity {
  code: string;
  name: string;
  status: "Pending" | "Approved" | "Rejected";
  dependency: string;
  department: string;
  dueDate: string;
  reason?: string;
}

interface ItemDetailPageProps {
  itemId: string;
  onClose: () => void;
}

function getItemDetails(id: string) {
  const matchingRow = rows.find(r => r.id === id);
  const name = matchingRow?.name || "Office Stationery Supplies";
  const status = matchingRow?.status || "Active";
  const rate = matchingRow?.rate ? matchingRow.rate.replace(/[^\d.]/g, "") : "1.0";
  const commodityCode = matchingRow?.commodityCode || "1112";

  if (id === "EX-880001") {
    return {
      id: "EX-880001",
      name: "Office Stationery Supplies",
      status: "Active",
      type: "Office",
      group: "Others",
      commodityClass: "HSN",
      commodityCode: "1112",
      unit: "—",
      rate: "1.0",
      taxPercentage: "18.0",
      taxPreference: "Taxable",
      forPrdFrom: "—",
      forPrdTo: "—"
    };
  }

  return {
    id,
    name,
    status,
    type: name.includes("Supplies") || name.includes("Chemicals") || name.includes("Kit") ? "Office" : "Others",
    group: "Others",
    commodityClass: "HSN",
    commodityCode,
    unit: "—",
    rate,
    taxPercentage: "18.0",
    taxPreference: "Taxable",
    forPrdFrom: "—",
    forPrdTo: "—"
  };
}

function ViewField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 13, color: value ? "var(--foreground)" : "var(--muted-foreground)", fontFamily: mono ? "var(--font-mono)" : undefined, lineHeight: 1.5 }}>{value || "—"}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function ItemDetailPage({ itemId, onClose }: ItemDetailPageProps) {
  const { openActivity } = useActivity();
  const item = getItemDetails(itemId);
  const tabs = ["Item Information", "Workflow"];
  const [activeTab, setActiveTab] = useState("Item Information");

  const [workflow, setWorkflow] = useState<WorkflowActivity[]>([
    {
      code: "IMV001",
      name: "Item Master Verifier",
      status: "Pending",
      dependency: "—",
      department: "General",
      dueDate: "Jun 25, 2026",
      reason: ""
    }
  ]);

  const [rejectingCode, setRejectingCode] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    openActivity({
      type: "Item",
      id: item.id,
      status: item.status,
      createdBy: "Alex Johnson",
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    });
    return () => {
      openActivity(null as any);
    };
  }, [item.id, item.status, openActivity]);

  const handleValidate = () => {
    alert("Item validated successfully.");
  };

  const handleActivate = () => {
    alert("Item activated successfully.");
  };

  const handleApprove = (code: string) => {
    setWorkflow(prev => prev.map(w => w.code === code ? { ...w, status: "Approved", reason: "" } : w));
  };

  const handleReset = (code: string) => {
    setWorkflow(prev => prev.map(w => w.code === code ? { ...w, status: "Pending", reason: "" } : w));
  };

  const handleRejectClick = (code: string) => {
    setRejectingCode(code);
    setRejectionReason("");
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) return;
    setWorkflow(prev => prev.map(w => w.code === rejectingCode ? { ...w, status: "Rejected", reason: rejectionReason } : w));
    setRejectingCode(null);
    setRejectionReason("");
  };

  return (
    <div className="flex flex-col h-full bg-background" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}>
            <X size={14} />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
              {item.id} · {item.name}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[item.status] }}>
              <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[item.status], display: "inline-block" }} />
              {item.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleValidate}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
          >
            Validate
          </button>
          <button 
            onClick={handleActivate}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
          >
            Activate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-8 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "11px 16px", fontSize: 13,
            fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === tab ? "2px solid var(--foreground)" : "2px solid transparent",
            marginBottom: -1, whiteSpace: "nowrap", transition: "color 0.15s",
          }}>{tab}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6" style={{ maxWidth: 1000 }}>
        {/* Item Master Info Card */}
        {activeTab === "Item Information" && (
          <SectionCard title="Item Master Information">
            <div className="flex flex-col gap-6">
              <div>
                <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Item Identification</h4>
                <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  <ViewField label="Item ID" value={item.id} mono />
                  <ViewField label="Item Name" value={item.name} />
                  <ViewField label="Item Type" value={item.type} />
                  <ViewField label="Item Group" value={item.group} />
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Classification</h4>
                <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  <ViewField label="Commodity Class" value={item.commodityClass} />
                  <ViewField label="Commodity Code" value={item.commodityCode} mono />
                  <ViewField label="Unit" value={item.unit} />
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Commercial / Tax</h4>
                <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  <ViewField label="Rate" value={item.rate} mono />
                  <ViewField label="Tax Percentage" value={item.taxPercentage + "%"} mono />
                  <ViewField label="Tax Preference" value={item.taxPreference} />
                  <ViewField label="ForPrdFrom" value={item.forPrdFrom} />
                  <ViewField label="ForPrdTo" value={item.forPrdTo} />
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Item Master Workflow Card */}
        {activeTab === "Workflow" && (
          <SectionCard title="Item Master Workflow">
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ borderCollapse: "collapse", minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>Activity Code</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>Activity Name</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>Activity Status</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>Dependency</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>Department</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>Due Date</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>Reason</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workflow.map(rec => (
                    <tr key={rec.code} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{rec.code}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>{rec.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                          style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[rec.status] }}>
                          <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[rec.status], display: "inline-block" }} />
                          {rec.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted-foreground)" }}>{rec.dependency}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>{rec.department}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{rec.dueDate}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted-foreground)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rec.reason}>
                        {rec.reason || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleReset(rec.code)}
                            style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 500 }}
                          >
                            Reset
                          </button>
                          <button 
                            onClick={() => handleApprove(rec.code)}
                            style={{ background: "rgba(74,222,128,0.12)", color: "#10b981", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectClick(rec.code)}
                            style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Rejection Modal Overlay */}
      {rejectingCode && (
        <div
          onClick={() => { setRejectingCode(null); setRejectionReason(""); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 360,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                Reject Workflow Activity
              </span>
              <button 
                type="button" 
                onClick={() => { setRejectingCode(null); setRejectionReason(""); }} 
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center" }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                REJECTION REASON <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                required
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Please enter a reason for rejection..."
                rows={3}
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                  color: "var(--foreground)",
                  outline: "none",
                  resize: "none",
                  fontFamily: "var(--font-family)"
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={() => { setRejectingCode(null); setRejectionReason(""); }}
                className="rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
                style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  background: "none", 
                  border: "1px solid var(--border)", 
                  color: "var(--muted-foreground)" 
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={handleRejectConfirm}
                className="rounded-lg px-3 py-1.5 transition-colors"
                style={{
                  fontSize: 12,
                  fontWeight: 650,
                  border: "none",
                  background: !rejectionReason.trim() ? "var(--border)" : "#ef4444",
                  color: !rejectionReason.trim() ? "var(--muted-foreground)" : "#fff",
                  cursor: !rejectionReason.trim() ? "not-allowed" : "pointer"
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
