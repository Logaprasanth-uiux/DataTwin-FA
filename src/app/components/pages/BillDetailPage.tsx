import { useState, useRef, useEffect, useContext } from "react";
import { UserProfileMenu } from "../UserProfileMenu";
import { X, Edit3, Check, X as XIcon, Lock, AlertCircle, MessageSquare } from "lucide-react";
import { AIBillScanner, type ScannedBillData } from "../AIBillScanner";
import { ActivityContext } from "../../contexts";

const tabs = ["Bill Header", "Vendor Info", "Line Items", "Tax Summary", "Workflow", "Doc Control"];

const statusColor: Record<string, string> = {
  Received: "#6b8cff", "In Progress": "#fbbf24", Validated: "#4ade80", Rejected: "#f87171",
};

interface BillData {
  billNumber: string; invoiceDate: string; dueDate: string; status: string;
  poReference: string; currency: string;
  vendorName: string; vendorId: string; vendorPan: string; vendorGstin: string;
  receivedBy: string; verifiedBy: string; approvedBy: string;
  selectedWorkflow: string;
}

interface WFTemplate { id: string; name: string; description: string; steps: { actCode: string; actName: string; lob: string }[]; }

const BILL_WORKFLOWS: WFTemplate[] = [
  { id: "standard", name: "Standard Bill Approval", description: "Three-level approval for routine bills.", steps: [{ actCode: "ACT-001", actName: "Finance Review", lob: "Finance" }, { actCode: "ACT-002", actName: "Department Head Approval", lob: "Operations" }, { actCode: "ACT-003", actName: "CFO Confirmation", lob: "Finance" }] },
  { id: "fast_track", name: "Fast Track Approval", description: "Two-step for small value bills under ₹50k.", steps: [{ actCode: "ACT-001", actName: "Finance Officer Review", lob: "Finance" }, { actCode: "ACT-002", actName: "Manager Approval", lob: "Management" }] },
  { id: "auto", name: "Auto Validate", description: "Auto-validates bills from trusted vendors.", steps: [] },
];

function makeEmpty(): BillData {
  return {
    billNumber: "", invoiceDate: "", dueDate: "", status: "Received",
    poReference: "", currency: "INR",
    vendorName: "", vendorId: "", vendorPan: "", vendorGstin: "",
    receivedBy: "", verifiedBy: "", approvedBy: "",
    selectedWorkflow: "",
  };
}

function makeBill(id: string, status = "Validated"): BillData {
  return {
    billNumber: id, invoiceDate: "Jun 01, 2026", dueDate: "Jun 30, 2026", status,
    poReference: "PO-2026-001", currency: "INR",
    vendorName: "TechSupply Co", vendorId: "VND-001", vendorPan: "AABCT1332L", vendorGstin: "33AABCT1332L1ZC",
    receivedBy: "Priya Ramesh", verifiedBy: "Kiran Nair", approvedBy: "Sundar Rajan",
    selectedWorkflow: "standard",
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

function EInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px", width: "100%" }} />
  );
}

function ESelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px", width: "100%", cursor: "pointer" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr" }}>{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>{children}</div>;
}

interface SectionProps {
  title: string; isDraft: boolean; defaultEditing?: boolean;
  children: (editing: boolean, draft: BillData, set: (k: keyof BillData, v: string) => void) => React.ReactNode;
  data: BillData; onSave: (d: BillData) => void;
}

function Section({ title, isDraft, defaultEditing = false, children, data, onSave }: SectionProps) {
  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState<BillData>(data);

  useEffect(() => {
    if (!editing) setDraft(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function set(k: keyof BillData, v: string) { setDraft(d => ({ ...d, [k]: v })); }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
        {!editing ? (
          isDraft ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}>
              <Edit3 size={11} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
              style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--muted)", border: "1px solid var(--border)", cursor: "not-allowed", opacity: 0.6 }}>
              <Lock size={10} /> Edit
            </div>
          )
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setDraft(data); setEditing(false); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}>
              <XIcon size={11} /> Cancel
            </button>
            <button onClick={() => { onSave(draft); setEditing(false); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
              <Check size={11} /> Save
            </button>
          </div>
        )}
      </div>
      <div className="p-5">{children(editing, draft, set)}</div>
    </div>
  );
}

// ─── Line Items ───────────────────────────────────────────────────────────────

const billItems = [
  { sno: 1, desc: "Dell Latitude 5540 Laptop", qty: 10, rate: "85000.00", taxPct: "18%", taxAmount: "153000.00", total: "1003000.00" },
  { sno: 2, desc: "Logitech MX Master 3 Mouse", qty: 15, rate: "4500.00", taxPct: "18%", taxAmount: "12150.00", total: "79650.00" },
  { sno: 3, desc: "Anker USB-C Hub 7-in-1", qty: 10, rate: "3200.00", taxPct: "18%", taxAmount: "5760.00", total: "37760.00" },
];

function BillLineItems({ items }: { items: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(items.length > 0 ? 0 : null);
  const baseTotal = items.reduce((acc, curr) => acc + (parseFloat(curr.rate) * curr.qty || 0), 0);
  const taxTotal = items.reduce((acc, curr) => acc + (parseFloat(curr.taxAmount) || 0), 0);
  const grandTotal = items.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);

  const formattedBaseTotal = "₹ " + baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedTaxTotal = "₹ " + taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedGrandTotal = "₹ " + grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl" style={{ background: "var(--card)", border: "1px dashed var(--border)" }}>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No line items added yet.</p>
        </div>
      ) : (
        items.map(item => (
          <div key={item.sno} className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <button className="w-full flex items-center justify-between px-5 py-3 text-left"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
              onClick={() => setExpanded(expanded === item.sno ? null : item.sno)}>
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 26, height: 26, background: "var(--secondary)", fontSize: 11, fontWeight: 700, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{item.sno}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{item.desc}</span>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>QTY</span>
                  <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{item.qty}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>TOTAL</span>
                  <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)" }}>₹ {item.total}</span>
                </div>
                <span style={{ fontSize: 18, color: "var(--muted-foreground)" }}>{expanded === item.sno ? "−" : "+"}</span>
              </div>
            </button>
            {expanded === item.sno && (
              <div className="px-5 pb-5 flex flex-col gap-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="grid gap-x-8 gap-y-4 pt-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  <ViewField label="Rate" value={`₹ ${item.rate}`} mono />
                  <ViewField label="Tax %" value={item.taxPct} />
                  <ViewField label="Tax Amount" value={`₹ ${item.taxAmount}`} mono />
                  <ViewField label="Total" value={`₹ ${item.total}`} mono />
                </div>
              </div>
            )}
          </div>
        ))
      )}
      {items.length > 0 && (
        <div className="flex justify-end gap-8 rounded-xl px-5 py-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {[{ label: "BASE VALUE", value: formattedBaseTotal }, { label: "TOTAL TAX", value: formattedTaxTotal }].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-end gap-0.5">
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label}</span>
              <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)" }}>{value}</span>
            </div>
          ))}
          <div className="flex flex-col items-end gap-0.5" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 32 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GRAND TOTAL</span>
            <span style={{ fontSize: 16, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>{formattedGrandTotal}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Workflow Tab ─────────────────────────────────────────────────────────────

function BillWorkflowTab({ data, onSave, isDraft, isNew }: { data: BillData; onSave: (d: BillData) => void; isDraft: boolean; isNew: boolean }) {
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(data.selectedWorkflow || "");
  const activeTpl = BILL_WORKFLOWS.find(w => w.id === data.selectedWorkflow) ?? null;

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 900 }}>
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Assigned Workflow</p>
          {!editing ? (
            isDraft ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}>
                <Edit3 size={11} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--muted)", border: "1px solid var(--border)", cursor: "not-allowed", opacity: 0.6 }}>
                <Lock size={10} /> Edit
              </div>
            )
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setDraft(data.selectedWorkflow); setEditing(false); }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <XIcon size={11} /> Cancel
              </button>
              <button onClick={() => { onSave({ ...data, selectedWorkflow: draft }); setEditing(false); }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
                <Check size={11} /> Save
              </button>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col gap-4">
          {editing ? (
            <div className="flex flex-col gap-2">
              {BILL_WORKFLOWS.map(wf => (
                <button key={wf.id} onClick={() => setDraft(wf.id)}
                  className="flex items-start gap-3 rounded-xl p-4 text-left transition-colors"
                  style={{ background: draft === wf.id ? "var(--accent)" : "var(--secondary)", border: `1px solid ${draft === wf.id ? "var(--foreground)" : "var(--border)"}`, cursor: "pointer" }}>
                  <div className="flex items-center justify-center rounded-full mt-0.5 flex-shrink-0"
                    style={{ width: 16, height: 16, border: `2px solid ${draft === wf.id ? "var(--foreground)" : "var(--muted-foreground)"}`, background: draft === wf.id ? "var(--foreground)" : "transparent" }}>
                    {draft === wf.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--background)" }} />}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{wf.name}</span>
                    <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{wf.description}</span>
                    {wf.steps.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {wf.steps.map((s, i) => (
                          <span key={s.actCode} className="flex items-center gap-1">
                            <span className="rounded-full px-2 py-0.5" style={{ fontSize: 10, fontWeight: 500, background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>{s.actName}</span>
                            {i < wf.steps.length - 1 && <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>→</span>}
                          </span>
                        ))}
                      </div>
                    )}
                    {wf.steps.length === 0 && <span style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>✓ Auto-validated, no manual steps</span>}
                  </div>
                </button>
              ))}
            </div>
          ) : activeTpl ? (
            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{activeTpl.name}</p>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{activeTpl.description}</p>
              {activeTpl.steps.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeTpl.steps.map((s, i) => (
                    <span key={s.actCode} className="flex items-center gap-1.5">
                      <span className="rounded-full px-2.5 py-1" style={{ fontSize: 11, fontWeight: 500, background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>{s.actName}</span>
                      {i < activeTpl.steps.length - 1 && <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>→</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <AlertCircle size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "var(--foreground)" }}>No workflow assigned. {isDraft ? "Click Edit to select one." : "Contact the admin to assign a workflow."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { billId: string; onClose: () => void; isNew?: boolean; billStatus?: string; prefill?: ScannedBillData; }

export function BillDetailPage({ billId, onClose, isNew = false, billStatus, prefill }: Props) {
  const openActivity = useContext(ActivityContext);
  const [activeTab, setActiveTab] = useState("Bill Header");
  const [data, setData] = useState<BillData>(() => {
    const base = isNew ? makeEmpty() : makeBill(billId, billStatus);
    if (!prefill) return base;
    return {
      ...base,
      ...(prefill.vendorName    && { vendorName: prefill.vendorName }),
      ...(prefill.invoiceNumber && { billNumber: prefill.invoiceNumber }),
      ...(prefill.invoiceDate   && { invoiceDate: prefill.invoiceDate }),
      ...(prefill.dueDate       && { dueDate: prefill.dueDate }),
      ...(prefill.gstin         && { vendorGstin: prefill.gstin }),
      ...(prefill.pan           && { vendorPan: prefill.pan }),
    };
  });
  const [itemsList, setItemsList] = useState<any[]>(() => {
    if (!isNew) return billItems;
    if (prefill && prefill.amount) {
      const amt = parseFloat(prefill.amount.replace(/[^0-9.]/g, "")) || 0;
      return [{ sno: 1, desc: prefill.description || "Services Rendered", qty: 1, rate: amt.toFixed(2), taxPct: "18%", taxAmount: (amt * 0.18).toFixed(2), total: (amt * 1.18).toFixed(2) }];
    }
    return [];
  });

  useEffect(() => {
    if (prefill) {
      setData(prev => ({
        ...prev,
        ...(prefill.vendorName    && { vendorName: prefill.vendorName }),
        ...(prefill.invoiceNumber && { billNumber: prefill.invoiceNumber }),
        ...(prefill.invoiceDate   && { invoiceDate: prefill.invoiceDate }),
        ...(prefill.dueDate       && { dueDate: prefill.dueDate }),
        ...(prefill.gstin         && { vendorGstin: prefill.gstin }),
        ...(prefill.pan           && { vendorPan: prefill.pan }),
      }));

      if (prefill.amount) {
        const amt = parseFloat(prefill.amount.replace(/[^0-9.]/g, "")) || 0;
        setItemsList(prev => {
          if (prev.length > 0) {
            return prev.map((item, idx) => {
              if (idx === 0) {
                return {
                  ...item,
                  rate: amt.toFixed(2),
                  taxAmount: (amt * 0.18).toFixed(2),
                  total: (amt * 1.18).toFixed(2),
                  desc: prefill.description || item.desc || "Services Rendered"
                };
              }
              return item;
            });
          } else {
            return [{
              sno: 1,
              desc: prefill.description || "Services Rendered",
              qty: 1,
              rate: amt.toFixed(2),
              taxPct: "18%",
              taxAmount: (amt * 0.18).toFixed(2),
              total: (amt * 1.18).toFixed(2)
            }];
          }
        });
      } else if (prefill.description) {
        setItemsList(prev => {
          if (prev.length > 0) {
            return prev.map((item, idx) => {
              if (idx === 0) {
                return { ...item, desc: prefill.description! };
              }
              return item;
            });
          }
          return prev;
        });
      }
    }
  }, [prefill]);

  function handleSave(updated: BillData) { setData(updated); }
  const isDraft = data.status === "Received" || isNew;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}>
            <X size={14} />
          </button>
          {isNew ? (
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>New Bill / Invoice</h1>
              <span className="rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}>New</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>{data.billNumber}</h1>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{data.vendorName}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[data.status] }}>
                <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[data.status], display: "inline-block" }} />
                {data.status}
              </span>
              {!isNew && (
                <div className="flex flex-col gap-1 ml-4 pl-4" style={{ borderLeft: "1px solid var(--border)", height: 28, justifyContent: "center" }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>COMPLETION</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }}>70%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 rounded-full h-1.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                      <div className="h-full rounded-full" style={{ width: "70%", background: "#6b8cff" }} />
                    </div>
                    <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>2/5 Sections</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isNew && (
            <button onClick={() => { alert(`Bill "${data.billNumber || "New Bill"}" created.`); onClose(); }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2"
              style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
              <Check size={13} /> Create Bill
            </button>
          )}
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                onClick={() => openActivity({
                  type: "Invoice",
                  id: data.billNumber || "NEW",
                  name: data.vendorName || "Invoice",
                  status: data.status,
                  createdBy: "Alex Johnson",
                  createdDate: data.invoiceDate || "Jun 01, 2026"
                })}
                className="flex items-center justify-center rounded-lg transition-colors relative"
                style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--secondary)"}
                title="Open Activity Workspace"
              >
                <MessageSquare size={15} />
                <span className="absolute top-0 right-0 flex items-center justify-center rounded-full bg-red-500 text-white" style={{ width: 14, height: 14, fontSize: 9, transform: "translate(30%, -30%)" }}>1</span>
              </button>
            )}
            <UserProfileMenu />
          </div>
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
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── BILL HEADER ──────────────────────────────────────────────────────── */}
        {activeTab === "Bill Header" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
            {isNew && (
              <AIBillScanner onApply={(d: ScannedBillData) => {
                setData(prev => ({
                  ...prev,
                  ...(d.vendorName    && { vendorName: d.vendorName }),
                  ...(d.invoiceNumber && { billNumber: d.invoiceNumber }),
                  ...(d.invoiceDate   && { invoiceDate: d.invoiceDate }),
                  ...(d.dueDate       && { dueDate: d.dueDate }),
                  ...(d.gstin         && { vendorGstin: d.gstin }),
                  ...(d.pan           && { vendorPan: d.pan }),
                }));
              }} />
            )}
            <Section title="Bill Header Info" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid3>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BILL NUMBER</span><EInput value={draft.billNumber} onChange={v => set("billNumber", v)} /></div> : <ViewField label="Bill Number" value={data.billNumber} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATUS</span><ESelect value={draft.status} onChange={v => set("status", v)} options={["Received", "In Progress", "Validated", "Rejected"]} /></div> : <ViewField label="Status" value={data.status} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>INVOICE DATE</span><EInput value={draft.invoiceDate} onChange={v => set("invoiceDate", v)} /></div> : <ViewField label="Invoice Date" value={data.invoiceDate} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DUE DATE</span><EInput value={draft.dueDate} onChange={v => set("dueDate", v)} /></div> : <ViewField label="Due Date" value={data.dueDate} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PO REFERENCE</span><EInput value={draft.poReference} onChange={v => set("poReference", v)} /></div> : <ViewField label="PO Reference" value={data.poReference} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>CURRENCY</span><ESelect value={draft.currency} onChange={v => set("currency", v)} options={["INR", "USD", "EUR", "GBP"]} /></div> : <ViewField label="Currency" value={data.currency} />}
                </Grid3>
              )}
            </Section>
          </div>
        )}

        {/* ── VENDOR INFO ───────────────────────────────────────────────────────── */}
        {activeTab === "Vendor Info" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
            <Section title="Vendor Information" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid2>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR NAME</span><EInput value={draft.vendorName} onChange={v => set("vendorName", v)} /></div> : <ViewField label="Vendor Name" value={data.vendorName} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR ID</span><EInput value={draft.vendorId} onChange={v => set("vendorId", v)} /></div> : <ViewField label="Vendor ID" value={data.vendorId} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PAN</span><EInput value={draft.vendorPan} onChange={v => set("vendorPan", v)} /></div> : <ViewField label="PAN" value={data.vendorPan} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GSTIN</span><EInput value={draft.vendorGstin} onChange={v => set("vendorGstin", v)} /></div> : <ViewField label="GSTIN" value={data.vendorGstin} mono />}
                </Grid2>
              )}
            </Section>
          </div>
        )}

        {/* ── LINE ITEMS ────────────────────────────────────────────────────────── */}
        {activeTab === "Line Items" && (
          <div className="flex flex-col gap-3" style={{ maxWidth: 900 }}>
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Line Items ({itemsList.length})</p>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Click any item to expand details</p>
            </div>
            <BillLineItems items={itemsList} />
          </div>
        )}

        {/* ── TAX SUMMARY ───────────────────────────────────────────────────────── */}
        {activeTab === "Tax Summary" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>GST Tax Breakdown</p>
              </div>
              <div className="p-5">
                <div className="rounded-lg overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
                        {["Tax Type", "Taxable Value", "Rate", "Tax Amount"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: "IGST", taxable: "₹ 9,49,500.00", rate: "18%", amount: "₹ 1,70,910.00" },
                        { type: "CGST", taxable: "—", rate: "—", amount: "—" },
                        { type: "SGST", taxable: "—", rate: "—", amount: "—" },
                      ].map((row, i) => (
                        <tr key={row.type} style={{ borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{row.type}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{row.taxable}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>{row.rate}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)" }}>{row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-4 gap-8">
                  <div className="flex flex-col items-end gap-0.5">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TOTAL TAX</span>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)" }}>₹ 1,70,910.00</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 32 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GRAND TOTAL</span>
                    <span style={{ fontSize: 16, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>₹ 11,20,410.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKFLOW ──────────────────────────────────────────────────────────── */}
        {activeTab === "Workflow" && (
          <BillWorkflowTab data={data} onSave={handleSave} isDraft={isDraft} isNew={isNew} />
        )}

        {/* ── DOC CONTROL ───────────────────────────────────────────────────────── */}
        {activeTab === "Doc Control" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
            <Section title="Document Control" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid3>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>RECEIVED BY</span><EInput value={draft.receivedBy} onChange={v => set("receivedBy", v)} /></div> : <ViewField label="Received By" value={data.receivedBy} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VERIFIED BY</span><EInput value={draft.verifiedBy} onChange={v => set("verifiedBy", v)} /></div> : <ViewField label="Verified By" value={data.verifiedBy} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>APPROVED BY</span><EInput value={draft.approvedBy} onChange={v => set("approvedBy", v)} /></div> : <ViewField label="Approved By" value={data.approvedBy} />}
                </Grid3>
              )}
            </Section>
          </div>
        )}

      </div>
    </div>
  );
}
