import { useState, useRef, useEffect } from "react";
import { X, FileText, Edit3, Check, X as XIcon, Lock, ExternalLink, Upload, AlertCircle } from "lucide-react";
import { AIPOScanner, type ScannedPOData } from "../../components/AIPOScanner";

const tabs = ["PO Header", "Organization & Vendor", "Terms", "PO Items", "Allocation", "Workflow", "Doc Control"];

const statusColor: Record<string, string> = {
  Draft: "#888896", Sent: "#6b8cff", Approved: "#4ade80", Rejected: "#f87171", "Pending Approval": "#fbbf24",
};
const wfStatusColor: Record<string, string> = {
  Approved: "#4ade80", Rejected: "#f87171", Pending: "#fbbf24", "In Review": "#6b8cff",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface POData {
  poNumber: string; poDate: string; status: string; orderName: string; orderId: string; orderType: string;
  docType: string; exchangeRate: string; modeOfDelivery: string; deliveryTerms: string; paymentTerms: string;
  otherTerms: string; agreementSigned: string; agreementFrom: string; agreementTo: string;
  orgName: string; orgId: string; orgTaxReg: string; orgPan: string; orgGst: string;
  placeOfSupply: string; localCurrency: string; deliveryAddress: string;
  vendorName: string; vendorId: string; vendorPan: string; vendorGst: string;
  vendorSourceOfSupply: string; invoiceAuthorised: string; taxCategory: string; currency: string;
  requestedBy: string; preparedBy: string; authorisedBy: string;
  selectedWorkflow: string;
}

// ─── Pre-defined PO workflow templates ────────────────────────────────────────

interface WFStep {
  actCode: string; actName: string; lob: string;
  dependency: string; dueOffsetDays: number; // calendar days after PO date
}

interface WFTemplate {
  id: string; name: string; description: string; steps: WFStep[];
}

const PO_WORKFLOWS: WFTemplate[] = [
  {
    id: "standard",
    name: "Standard PO Approval",
    description: "Three-level approval for routine purchase orders.",
    steps: [
      { actCode: "ACT-001", actName: "Requestor Submission",       lob: "Operations",  dependency: "—",       dueOffsetDays: 0 },
      { actCode: "ACT-002", actName: "Department Head Review",      lob: "Operations",  dependency: "ACT-001", dueOffsetDays: 2 },
      { actCode: "ACT-003", actName: "Finance Team Approval",       lob: "Finance",     dependency: "ACT-002", dueOffsetDays: 4 },
    ],
  },
  {
    id: "high_value",
    name: "High Value PO Approval",
    description: "Four-level flow for POs above ₹5 lakhs — includes CFO sign-off.",
    steps: [
      { actCode: "ACT-001", actName: "Requestor Submission",       lob: "Operations",  dependency: "—",       dueOffsetDays: 0 },
      { actCode: "ACT-002", actName: "Finance Review",             lob: "Finance",     dependency: "ACT-001", dueOffsetDays: 2 },
      { actCode: "ACT-003", actName: "Procurement Head Approval",  lob: "Procurement", dependency: "ACT-002", dueOffsetDays: 4 },
      { actCode: "ACT-004", actName: "CFO Sign-off",               lob: "Finance",     dependency: "ACT-003", dueOffsetDays: 6 },
    ],
  },
  {
    id: "it_procurement",
    name: "IT Procurement Flow",
    description: "Specialised flow for IT hardware, software and cloud services.",
    steps: [
      { actCode: "ACT-001", actName: "IT Manager Submission",      lob: "Technology",  dependency: "—",       dueOffsetDays: 0 },
      { actCode: "ACT-002", actName: "IT Head Approval",           lob: "Technology",  dependency: "ACT-001", dueOffsetDays: 1 },
      { actCode: "ACT-003", actName: "Finance Concurrence",        lob: "Finance",     dependency: "ACT-002", dueOffsetDays: 3 },
    ],
  },
  {
    id: "emergency",
    name: "Emergency PO",
    description: "Single-step direct approval for urgent procurement.",
    steps: [
      { actCode: "ACT-001", actName: "Director Direct Approval",   lob: "Executive",   dependency: "—",       dueOffsetDays: 0 },
    ],
  },
  {
    id: "auto",
    name: "Auto Approve (Trusted Vendor)",
    description: "Bypasses manual steps for pre-verified trusted vendors.",
    steps: [],
  },
];

function makeEmpty(): POData {
  return {
    poNumber: "", poDate: "", status: "Draft", orderName: "", orderId: "", orderType: "Standard PO",
    docType: "Purchase Order", exchangeRate: "1.00", modeOfDelivery: "Courier",
    deliveryTerms: "Ex-Works", paymentTerms: "Net 30", otherTerms: "",
    agreementSigned: "No", agreementFrom: "", agreementTo: "",
    orgName: "", orgId: "", orgTaxReg: "", orgPan: "", orgGst: "",
    placeOfSupply: "Tamil Nadu", localCurrency: "INR", deliveryAddress: "",
    vendorName: "", vendorId: "", vendorPan: "", vendorGst: "",
    vendorSourceOfSupply: "Tamil Nadu", invoiceAuthorised: "Yes", taxCategory: "Regular", currency: "INR",
    requestedBy: "", preparedBy: "", authorisedBy: "",
    selectedWorkflow: "",
  };
}

function makePO(id: string, status = "Approved"): POData {
  return {
    poNumber: id, poDate: "Jun 01, 2026", status,
    orderName: "IT Hardware Procurement Q2", orderId: "ORD-2026-441", orderType: "Standard PO",
    docType: "Purchase Order", exchangeRate: "1.00", modeOfDelivery: "Courier",
    deliveryTerms: "Ex-Works", paymentTerms: "Net 30", agreementSigned: "Yes",
    agreementFrom: "Jan 01, 2026", agreementTo: "Dec 31, 2026",
    otherTerms: "Goods must be delivered within 10 working days from PO date. Invoices to be submitted within 7 days of delivery.",
    orgName: "Acme Corp", orgId: "ORG-001", orgTaxReg: "REG-TN-2020-00123",
    orgPan: "AABCA1234B", orgGst: "33AABCA1234B1ZD",
    placeOfSupply: "Tamil Nadu", localCurrency: "INR",
    deliveryAddress: "Plot 5, SIPCOT Industrial Park, Sriperumbudur, Chennai – 602105, Tamil Nadu, India",
    vendorName: "TechSupply Co", vendorId: "VND-001", vendorPan: "AABCT1332L", vendorGst: "33AABCT1332L1ZC",
    vendorSourceOfSupply: "Tamil Nadu", invoiceAuthorised: "Yes", taxCategory: "Regular", currency: "INR",
    requestedBy: "Priya Ramesh", preparedBy: "Kiran Nair", authorisedBy: "Sundar Rajan",
    selectedWorkflow: "high_value",
  };
}

// ─── UI primitives ────────────────────────────────────────────────────────────

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

function ETextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea value={value} rows={2} onChange={e => onChange(e.target.value)}
      style={{ background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "8px 10px", width: "100%", resize: "vertical", lineHeight: 1.5 }} />
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr" }}>{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>{children}</div>;
}

// ─── Section card with edit toggle ───────────────────────────────────────────

interface SectionProps {
  title: string;
  isDraft: boolean;
  defaultEditing?: boolean;
  children: (editing: boolean, draft: POData, set: (k: keyof POData, v: string) => void) => React.ReactNode;
  data: POData;
  onSave: (d: POData) => void;
}

function Section({ title, isDraft, defaultEditing = false, children, data, onSave }: SectionProps) {
  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState<POData>(data);

  useEffect(() => {
    if (!editing) setDraft(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function set(k: keyof POData, v: string) { setDraft(d => ({ ...d, [k]: v })); }

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
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" title={`Edit is only available for Draft POs. This PO is ${data.status}.`}
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

// ─── PO Items (accordion) ─────────────────────────────────────────────────────

const poItems = [
  { sno: 1, subOrderDesc: "Laptop – Dell Latitude 5540", subOrderId: "SO-001", periodFrom: "Jun 01, 2026", periodTo: "Jun 30, 2026", itemRef: "DELL-LAT-5540", itemDesc: "14\" FHD, i5, 16GB RAM, 512 SSD", itemId: "ITM-1001", itemName: "Dell Latitude 5540", qty: 10, uom: "NOS", addlCharges: "500.00", discount: "200.00", taxCode: "GST18", taxPct: "18%", rate: "85000.00", baseValue: "850000.00", taxValue: "153000.00", totalValue: "1003300.00", costMethod: "Direct", dept: "IT" },
  { sno: 2, subOrderDesc: "Wireless Mouse – Logitech MX", subOrderId: "SO-002", periodFrom: "Jun 01, 2026", periodTo: "Jun 30, 2026", itemRef: "LGT-MX-MASTER3", itemDesc: "Ergonomic wireless mouse", itemId: "ITM-1002", itemName: "Logitech MX Master 3", qty: 15, uom: "NOS", addlCharges: "0.00", discount: "50.00", taxCode: "GST18", taxPct: "18%", rate: "4500.00", baseValue: "67500.00", taxValue: "12150.00", totalValue: "79600.00", costMethod: "Direct", dept: "IT" },
  { sno: 3, subOrderDesc: "USB-C Hub – Anker 7-in-1", subOrderId: "SO-003", periodFrom: "Jun 01, 2026", periodTo: "Jun 30, 2026", itemRef: "ANK-A83460A1", itemDesc: "7-in-1 USB-C hub", itemId: "ITM-1003", itemName: "Anker USB-C Hub", qty: 10, uom: "NOS", addlCharges: "0.00", discount: "0.00", taxCode: "GST18", taxPct: "18%", rate: "3200.00", baseValue: "32000.00", taxValue: "5760.00", totalValue: "37760.00", costMethod: "Direct", dept: "IT" },
];

interface ItemFieldProps {
  label: string;
  value: string;
  field: string;
  sno: number;
  mono?: boolean;
  isDraft: boolean;
  onUpdate: (sno: number, key: string, val: string) => void;
}

function ItemField({ label, value, field, sno, mono, isDraft, onUpdate }: ItemFieldProps) {
  if (isDraft) {
    return (
      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label.toUpperCase()}</span>
        <input
          value={value}
          onChange={e => onUpdate(sno, field, e.target.value)}
          style={{
            height: 34,
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            outline: "none",
            fontSize: 13,
            color: "var(--foreground)",
            padding: "0 10px",
            width: "100%",
          }}
        />
      </div>
    );
  }
  return <ViewField label={label} value={value} mono={mono} />;
}

function POItemsSection({ items, setItems, isDraft }: { items: any[]; setItems: React.Dispatch<React.SetStateAction<any[]>>; isDraft: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(items.length > 0 ? items[0].sno : null);

  function updateItem(sno: number, key: string, val: string) {
    setItems(prev => prev.map(item => {
      if (item.sno !== sno) return item;
      const updated = { ...item, [key]: val };

      // Re-calculate values if numerical fields change
      if (["qty", "rate", "addlCharges", "discount"].includes(key)) {
        const qty = parseFloat(String(updated.qty)) || 0;
        const rate = parseFloat(String(updated.rate)) || 0;
        const addl = parseFloat(String(updated.addlCharges)) || 0;
        const disc = parseFloat(String(updated.discount)) || 0;

        const base = qty * rate;
        const tax = base * 0.18; // standard 18%
        const total = base + tax + addl - disc;

        updated.baseValue = base.toFixed(2);
        updated.taxValue = tax.toFixed(2);
        updated.totalValue = total.toFixed(2);
      }
      return updated;
    }));
  }

  function addItem() {
    const nextSno = items.length > 0 ? Math.max(...items.map(i => i.sno)) + 1 : 1;
    const newItem = {
      sno: nextSno,
      subOrderDesc: "",
      subOrderId: `SO-${String(nextSno).padStart(3, "0")}`,
      periodFrom: "Jun 01, 2026",
      periodTo: "Jun 30, 2026",
      itemRef: "",
      itemDesc: "",
      itemId: `ITM-${1000 + nextSno}`,
      itemName: "",
      qty: 1,
      uom: "NOS",
      addlCharges: "0.00",
      discount: "0.00",
      taxCode: "GST18",
      taxPct: "18%",
      rate: "0.00",
      baseValue: "0.00",
      taxValue: "0.00",
      totalValue: "0.00",
      costMethod: "Direct",
      dept: "IT",
    };
    setItems(prev => [...prev, newItem]);
    setExpanded(nextSno);
  }

  function deleteItem(sno: number) {
    setItems(prev => prev.filter(i => i.sno !== sno).map((item, idx) => ({ ...item, sno: idx + 1 })));
    setExpanded(null);
  }

  const baseTotal = items.reduce((acc, curr) => acc + (parseFloat(curr.baseValue) || 0), 0);
  const taxTotal = items.reduce((acc, curr) => acc + (parseFloat(curr.taxValue) || 0), 0);
  const grandTotal = items.reduce((acc, curr) => acc + (parseFloat(curr.totalValue) || 0), 0);

  const formattedBaseTotal = "₹ " + baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedTaxTotal = "₹ " + taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedGrandTotal = "₹ " + grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-3">
      {isDraft && (
        <div className="flex justify-end mb-2">
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2"
            style={{
              fontSize: 12,
              fontWeight: 600,
              background: "var(--foreground)",
              color: "var(--background)",
              border: "none",
              cursor: "pointer",
            }}
          >
            + Add Line Item
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl" style={{ background: "var(--card)", border: "1px dashed var(--border)" }}>
          <AlertCircle size={24} style={{ color: "var(--muted-foreground)" }} />
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No line items added yet.</p>
          {isDraft && (
            <button
              onClick={addItem}
              className="rounded-lg px-3 py-1.5 transition-colors"
              style={{
                fontSize: 12,
                fontWeight: 500,
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                color: "var(--foreground)",
              }}
            >
              Add First Item
            </button>
          )}
        </div>
      ) : (
        items.map(item => (
          <div key={item.sno} className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-full flex items-center justify-between px-5 py-3 text-left"
              style={{ background: "none", border: "none" }}>
              <button
                className="flex flex-1 items-center justify-between text-left"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onClick={() => setExpanded(expanded === item.sno ? null : item.sno)}
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 26, height: 26, background: "var(--secondary)", fontSize: 11, fontWeight: 700, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{item.sno}</span>
                  <div className="flex flex-col">
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{item.itemName || "(Empty Item Name)"}</span>
                    <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{item.itemId} · {item.itemRef || "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-8 pr-4">
                  <div className="flex flex-col items-end">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>QTY</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{item.qty} {item.uom}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>TOTAL</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)" }}>₹ {item.totalValue}</span>
                  </div>
                  <span style={{ fontSize: 18, color: "var(--muted-foreground)" }}>{expanded === item.sno ? "−" : "+"}</span>
                </div>
              </button>
              {isDraft && (
                <button
                  onClick={() => deleteItem(item.sno)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#f87171",
                    marginRight: 10,
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            {expanded === item.sno && (
              <div className="px-5 pb-5 flex flex-col gap-5" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="grid gap-x-8 gap-y-4 pt-4" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
                  <ItemField label="Item Name" value={item.itemName} field="itemName" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                  <ItemField label="Item ID" value={item.itemId} field="itemId" sno={item.sno} mono isDraft={isDraft} onUpdate={updateItem} />
                  <ItemField label="Item Reference" value={item.itemRef} field="itemRef" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                  
                  <ItemField label="Item Description" value={item.itemDesc} field="itemDesc" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                  <ItemField label="Sub Order Description" value={item.subOrderDesc} field="subOrderDesc" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                  <ItemField label="Sub Order ID" value={item.subOrderId} field="subOrderId" sno={item.sno} mono isDraft={isDraft} onUpdate={updateItem} />
                  
                  <ItemField label="For Period From" value={item.periodFrom} field="periodFrom" sno={item.sno} mono isDraft={isDraft} onUpdate={updateItem} />
                  <ItemField label="For Period To" value={item.periodTo} field="periodTo" sno={item.sno} mono isDraft={isDraft} onUpdate={updateItem} />
                  <ItemField label="Department" value={item.dept} field="dept" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                </div>
                <div style={{ height: 1, background: "var(--border)" }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em", marginBottom: 12 }}>PRICING & TAX</p>
                  <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    <ItemField label="Rate" value={item.rate} field="rate" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                    <ItemField label="Additional Charges" value={item.addlCharges} field="addlCharges" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                    <ItemField label="Discount" value={item.discount} field="discount" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                    <ViewField label="Base Value" value={`₹ ${item.baseValue}`} mono />
                    
                    <ItemField label="Tax Code" value={item.taxCode} field="taxCode" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                    <ViewField label="Tax %" value={item.taxPct} />
                    <ViewField label="Tax Value" value={`₹ ${item.taxValue}`} mono />
                    <ViewField label="Total Value" value={`₹ ${item.totalValue}`} mono />
                  </div>
                </div>
                <div style={{ height: 1, background: "var(--border)" }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em", marginBottom: 12 }}>COST ALLOCATION</p>
                  <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                    <ItemField label="Cost Allocation Method" value={item.costMethod} field="costMethod" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                    <ItemField label="Department" value={item.dept} field="dept" sno={item.sno} isDraft={isDraft} onUpdate={updateItem} />
                  </div>
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

// ─── Agreement preview modal ──────────────────────────────────────────────────

function AgreementModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-center"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ width: 640, maxHeight: "85vh", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Vendor Agreement – TechSupply Co</span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>AGR-2024-0089 · 340 KB</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}><XIcon size={16} /></button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8" style={{ minHeight: 320 }}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center rounded-2xl" style={{ width: 80, height: 80, background: "var(--secondary)", border: "1px solid var(--border)" }}>
              <FileText size={36} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>Vendor_Agreement_2024.pdf</p>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Signed agreement · Valid Jan 01 – Dec 31, 2026</p>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8 }}>Preview available after re-uploading the file.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDateStr(s: string): Date | null {
  // Handles "Jun 01, 2026" format
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── PO Workflow Tab ──────────────────────────────────────────────────────────

// Execution status for an existing PO (keyed by workflow template step index)
const EXEC_STATUS: Record<string, { status: string; reason: string }[]> = {
  high_value: [
    { status: "Approved", reason: "PO initiated and submitted by requestor" },
    { status: "Approved", reason: "Budget availability confirmed" },
    { status: "Approved", reason: "Vendor terms and compliance verified" },
    { status: "Pending",  reason: "—" },
  ],
  standard: [
    { status: "Approved", reason: "Submitted by department team" },
    { status: "Approved", reason: "Department head sign-off done" },
    { status: "Pending",  reason: "—" },
  ],
  it_procurement: [
    { status: "Approved", reason: "IT manager initiated" },
    { status: "Pending",  reason: "—" },
    { status: "Pending",  reason: "—" },
  ],
  emergency: [{ status: "Approved", reason: "Director approved directly" }],
  auto: [],
};

function POWorkflowTab({ data, onSave, isDraft, isNew }: { data: POData; onSave: (d: POData) => void; isDraft: boolean; isNew: boolean }) {
  const poBaseDate = parseDateStr(data.poDate);
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(data.selectedWorkflow || "");

  const activeTpl = PO_WORKFLOWS.find(w => w.id === data.selectedWorkflow) ?? null;
  const execRows = data.selectedWorkflow ? (EXEC_STATUS[data.selectedWorkflow] ?? []) : [];

  function handleSave() {
    onSave({ ...data, selectedWorkflow: draft });
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 900 }}>
      {/* ── Workflow selection card ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Assigned Workflow</p>
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
                title={`Workflow can only be changed on Draft POs. This PO is ${data.status}.`}
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
              <button onClick={handleSave}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
                <Check size={11} /> Save
              </button>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            Select a pre-defined approval workflow for this Purchase Order. The chosen workflow determines the approval chain that will be triggered when this PO is submitted.
          </p>

          {/* Workflow options */}
          {editing ? (
            <div className="flex flex-col gap-2">
              {PO_WORKFLOWS.map(wf => (
                <button
                  key={wf.id}
                  onClick={() => setDraft(wf.id)}
                  className="flex items-start gap-3 rounded-xl p-4 text-left transition-colors"
                  style={{
                    background: draft === wf.id ? "var(--accent)" : "var(--secondary)",
                    border: `1px solid ${draft === wf.id ? "var(--foreground)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  {/* Radio dot */}
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
                            <span className="rounded-full px-2 py-0.5"
                              style={{ fontSize: 10, fontWeight: 500, background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                              {s.actName}
                            </span>
                            {i < wf.steps.length - 1 && <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>→</span>}
                          </span>
                        ))}
                      </div>
                    )}
                    {wf.steps.length === 0 && (
                      <span style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>✓ Auto-approved, no manual steps</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", flexShrink: 0, marginTop: 2 }}>
                    {wf.steps.length} step{wf.steps.length !== 1 ? "s" : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* View-only: show selected workflow */
            activeTpl ? (
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{activeTpl.name}</p>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{activeTpl.description}</p>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                    {activeTpl.steps.length} step{activeTpl.steps.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {activeTpl.steps.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeTpl.steps.map((s, i) => (
                      <span key={s.actCode} className="flex items-center gap-1.5">
                        <span className="rounded-full px-2.5 py-1"
                          style={{ fontSize: 11, fontWeight: 500, background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                          {s.actName}
                        </span>
                        {i < activeTpl.steps.length - 1 && (
                          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>→</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "#4ade80" }}>✓ This workflow auto-approves without manual steps.</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)" }}>
                <AlertCircle size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "var(--foreground)" }}>No workflow assigned. {isDraft ? "Click Edit to select one." : "Contact the admin to assign a workflow."}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Execution status (only for existing POs with steps) ── */}
      {!isNew && activeTpl && activeTpl.steps.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Workflow Progress</p>
          </div>
          <div className="p-5 flex flex-col gap-2">
            {activeTpl.steps.map((step, i) => {
              const exec = execRows[i] ?? { status: "Pending", reason: "—" };
              return (
                <div key={step.actCode} className="flex items-start gap-4 rounded-xl p-4"
                  style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                  {/* Step indicator + connector */}
                  <div className="flex flex-col items-center gap-1" style={{ flexShrink: 0 }}>
                    <div className="flex items-center justify-center rounded-full"
                      style={{
                        width: 28, height: 28,
                        background: exec.status === "Approved" ? "rgba(74,222,128,0.15)" : exec.status === "Rejected" ? "rgba(248,113,113,0.15)" : "var(--accent)",
                        border: `1px solid ${wfStatusColor[exec.status] ?? "var(--border)"}`,
                        fontSize: 11, fontWeight: 700,
                        color: wfStatusColor[exec.status] ?? "var(--muted-foreground)",
                        fontFamily: "var(--font-mono)",
                      }}>
                      {i + 1}
                    </div>
                    {i < activeTpl.steps.length - 1 && <div style={{ width: 1, height: 16, background: "var(--border)" }} />}
                  </div>

                  <div className="flex-1 grid gap-x-6 gap-y-2" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>ACTIVITY</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{step.actName}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{step.actCode} · {step.lob}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>STATUS</span>
                      <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: wfStatusColor[exec.status] ?? "var(--muted-foreground)" }}>
                        <span className="rounded-full" style={{ width: 6, height: 6, background: wfStatusColor[exec.status] ?? "var(--border)", display: "inline-block" }} />
                        {exec.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>REASON</span>
                      <span style={{ fontSize: 12, color: "var(--foreground)" }}>{exec.reason}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>DEPENDENCY</span>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{step.dependency}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>DUE DATE</span>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                        {poBaseDate ? addDays(poBaseDate, step.dueOffsetDays) : `+${step.dueOffsetDays}d`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const KNOWN_VENDORS: Record<string, { id: string; pan: string; gst: string }> = {
  "TechSupply Co": { id: "VND-001", pan: "AABCT1332L", gst: "33AABCT1332L1ZC" },
  "OfficeMax Pro": { id: "VND-002", pan: "AABCO8821K", gst: "33AABCO8821K1ZB" },
  "CloudNet Solutions": { id: "VND-003", pan: "AABCC7741M", gst: "33AABCC7741M1ZA" },
  "Green Facilities": { id: "VND-004", pan: "AABCG6632P", gst: "33AABCG6632P1ZD" },
  "SafeLogistics": { id: "VND-005", pan: "AABCS5511Q", gst: "33AABCS5511Q1ZE" },
  "DataVault Inc": { id: "VND-007", pan: "AABCD3321N", gst: "33AABCD3321N1ZH" },
  "SwiftCargo": { id: "VND-010", pan: "AABCS7744R", gst: "33AABCS7744R1ZM" },
  "PrintHouse Ltd": { id: "VND-006", pan: "AABCP4411P", gst: "33AABCP4411P1ZG" },
  "MediaBridge": { id: "VND-009", pan: "AABCM9922Q", gst: "33AABCM9922Q1ZL" },
  "FoodFirst Corp": { id: "VND-012", pan: "AABCF1122S", gst: "33AABCF1122S1ZP" },
};

const KNOWN_ORGS: Record<string, { id: string; pan: string; gst: string; taxReg: string; address: string }> = {
  "Acme Corp": {
    id: "ORG-001",
    pan: "AABCA1234B",
    gst: "33AABCA1234B1ZD",
    taxReg: "REG-TN-2020-00123",
    address: "Plot 5, SIPCOT Industrial Park, Sriperumbudur, Chennai – 602105, Tamil Nadu, India"
  },
  "Globex Ltd": {
    id: "ORG-002",
    pan: "AABCG5678C",
    gst: "27AABCG5678C1ZE",
    taxReg: "REG-MH-2021-00456",
    address: "12th Floor, Express Towers, Nariman Point, Mumbai – 400021, Maharashtra, India"
  },
  "Initech Inc": {
    id: "ORG-003",
    pan: "AABCI9012D",
    gst: "29AABCI9012D1ZF",
    taxReg: "REG-KA-2022-00789",
    address: "Tech Park, Outer Ring Road, Bengaluru – 560103, Karnataka, India"
  }
};

interface Props { poId: string; onClose: () => void; isNew?: boolean; poStatus?: string; prefill?: Record<string, string>; }

export function PODetailPage({ poId, onClose, isNew = false, poStatus, prefill }: Props) {
  const [activeTab, setActiveTab] = useState("PO Header");
  const [data, setData] = useState<POData>(() => {
    const base = isNew ? makeEmpty() : makePO(poId, poStatus);
    if (!prefill) return base;
    const next = {
      ...base,
      ...(prefill.vendor && { vendorName: prefill.vendor }),
      ...(prefill.org && { orgName: prefill.org }),
      ...(prefill.date && { poDate: prefill.date }),
      ...(prefill.description && { orderName: prefill.description }),
    };
    if (prefill.vendor) {
      const known = KNOWN_VENDORS[prefill.vendor];
      if (known) {
        next.vendorId = known.id;
        next.vendorPan = known.pan;
        next.vendorGst = known.gst;
      }
    }
    if (prefill.org) {
      const known = KNOWN_ORGS[prefill.org];
      if (known) {
        next.orgId = known.id;
        next.orgPan = known.pan;
        next.orgGst = known.gst;
        next.orgTaxReg = known.taxReg;
        next.deliveryAddress = known.address;
      }
    }
    return next;
  });
  const [showAgreement, setShowAgreement] = useState(false);
  const [itemsList, setItemsList] = useState<any[]>(() => {
    if (!isNew) return poItems;
    if (prefill && prefill.amount) {
      const amt = parseFloat(prefill.amount.replace(/[^0-9.]/g, "")) || 0;
      const itemName = prefill.description || "Procured Items";
      const base = amt;
      const tax = base * 0.18;
      const total = base + tax;
      return [{
        sno: 1,
        subOrderDesc: "",
        subOrderId: "SO-001",
        periodFrom: "Jun 01, 2026",
        periodTo: "Jun 30, 2026",
        itemRef: "",
        itemDesc: itemName,
        itemId: "ITM-1001",
        itemName: itemName,
        qty: 1,
        uom: "NOS",
        addlCharges: "0.00",
        discount: "0.00",
        taxCode: "GST18",
        taxPct: "18%",
        rate: base.toFixed(2),
        baseValue: base.toFixed(2),
        taxValue: tax.toFixed(2),
        totalValue: total.toFixed(2),
        costMethod: "Direct",
        dept: "IT",
      }];
    }
    return [];
  });

  useEffect(() => {
    if (prefill) {
      setData(prev => {
        const next = { ...prev };
        if (prefill.vendor) {
          next.vendorName = prefill.vendor;
          const known = KNOWN_VENDORS[prefill.vendor];
          if (known) {
            next.vendorId = known.id;
            next.vendorPan = known.pan;
            next.vendorGst = known.gst;
          }
        }
        if (prefill.org) {
          next.orgName = prefill.org;
          const known = KNOWN_ORGS[prefill.org];
          if (known) {
            next.orgId = known.id;
            next.orgPan = known.pan;
            next.orgGst = known.gst;
            next.orgTaxReg = known.taxReg;
            next.deliveryAddress = known.address;
          }
        }
        if (prefill.date) {
          next.poDate = prefill.date;
        }
        if (prefill.description) {
          next.orderName = prefill.description;
        }
        return next;
      });

      if (prefill.amount) {
        const amt = parseFloat(prefill.amount.replace(/[^0-9.]/g, "")) || 0;
        const itemName = prefill.description || "Procured Items";
        setItemsList(prev => {
          if (prev.length > 0) {
            return prev.map((item, idx) => {
              if (idx === 0) {
                const base = amt;
                const tax = base * 0.18;
                const total = base + tax;
                return {
                  ...item,
                  qty: 1,
                  rate: base.toFixed(2),
                  baseValue: base.toFixed(2),
                  taxValue: tax.toFixed(2),
                  totalValue: total.toFixed(2),
                  itemName: itemName || item.itemName || "Procured Items",
                };
              }
              return item;
            });
          } else {
            const base = amt;
            const tax = base * 0.18;
            const total = base + tax;
            return [{
              sno: 1,
              subOrderDesc: "",
              subOrderId: "SO-001",
              periodFrom: "Jun 01, 2026",
              periodTo: "Jun 30, 2026",
              itemRef: "",
              itemDesc: itemName,
              itemId: "ITM-1001",
              itemName: itemName,
              qty: 1,
              uom: "NOS",
              addlCharges: "0.00",
              discount: "0.00",
              taxCode: "GST18",
              taxPct: "18%",
              rate: base.toFixed(2),
              baseValue: base.toFixed(2),
              taxValue: tax.toFixed(2),
              totalValue: total.toFixed(2),
              costMethod: "Direct",
              dept: "IT",
            }];
          }
        });
      } else if (prefill.description) {
        setItemsList(prev => {
          if (prev.length > 0) {
            return prev.map((item, idx) => {
              if (idx === 0) {
                return {
                  ...item,
                  itemName: prefill.description || item.itemName,
                  itemDesc: prefill.description || item.itemDesc,
                };
              }
              return item;
            });
          }
          return prev;
        });
      }
    }
  }, [prefill]);

  function handleSave(updated: POData) { setData(updated); }

  const isDraft = data.status === "Draft";
  const editBlockedMsg = `Edit is disabled for ${data.status} POs. Only Draft POs can be edited.`;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {showAgreement && <AgreementModal onClose={() => setShowAgreement(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}>
            <X size={14} />
          </button>
          {isNew ? (
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>New Purchase Order</h1>
              <span className="rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}>Draft</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>{data.orderName}</h1>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{data.poNumber}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[data.status] }}>
                <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[data.status], display: "inline-block" }} />
                {data.status}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isNew && (
            <button onClick={() => { alert(`PO "${data.orderName || "New PO"}" created.`); onClose(); }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2"
              style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
              <Check size={13} /> Create PO
            </button>
          )}
          {!isDraft && !isNew && (
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" title={editBlockedMsg}
              style={{ fontSize: 12, background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)", cursor: "not-allowed", opacity: 0.7 }}>
              <Lock size={12} /> Edit Disabled
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: "var(--accent)", fontSize: 10, fontWeight: 700, color: "var(--foreground)" }}>AJ</div>
            <div className="flex flex-col">
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)" }}>Alex Johnson</span>
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Admin</span>
            </div>
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

        {/* ── PO HEADER ────────────────────────────────────────────────────── */}
        {activeTab === "PO Header" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
            {isNew && (
              <AIPOScanner onApply={(d: ScannedPOData) => {
                setData(prev => ({
                  ...prev,
                  ...(d.vendorName    && { vendorName: d.vendorName }),
                  ...(d.vendorGst     && { vendorGst: d.vendorGst }),
                  ...(d.vendorPan     && { vendorPan: d.vendorPan }),
                  ...(d.orgName       && { orgName: d.orgName }),
                  ...(d.orgGst        && { orgGst: d.orgGst }),
                  ...(d.poDate        && { poDate: d.poDate }),
                  ...(d.paymentTerms  && { paymentTerms: d.paymentTerms }),
                  ...(d.deliveryTerms && { deliveryTerms: d.deliveryTerms }),
                  ...(d.currency      && { currency: d.currency }),
                }));
              }} />
            )}
            <Section title="Purchase Order Info" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid3>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PO NUMBER</span><EInput value={draft.poNumber} onChange={v => set("poNumber", v)} /></div> : <ViewField label="PO Number" value={data.poNumber} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATUS</span><ESelect value={draft.status} onChange={v => set("status", v)} options={["Draft", "Sent", "Pending Approval"]} /></div> : <ViewField label="Status" value={data.status} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PO DATE</span><EInput value={draft.poDate} onChange={v => set("poDate", v)} /></div> : <ViewField label="PO Date" value={data.poDate} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DOC TYPE</span><ESelect value={draft.docType} onChange={v => set("docType", v)} options={["Purchase Order", "Blanket PO", "Contract PO"]} /></div> : <ViewField label="Doc Type" value={data.docType} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORDER NAME</span><EInput value={draft.orderName} onChange={v => set("orderName", v)} /></div> : <ViewField label="Order Name" value={data.orderName} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORDER ID</span><EInput value={draft.orderId} onChange={v => set("orderId", v)} /></div> : <ViewField label="Order ID" value={data.orderId} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORDER TYPE</span><ESelect value={draft.orderType} onChange={v => set("orderType", v)} options={["Standard PO", "Blanket PO", "Contract PO", "Service PO"]} /></div> : <ViewField label="Order Type" value={data.orderType} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>EXCHANGE RATE</span><EInput value={draft.exchangeRate} onChange={v => set("exchangeRate", v)} /></div> : <ViewField label="Exchange Rate" value={data.exchangeRate} mono />}
                </Grid3>
              )}
            </Section>
          </div>
        )}

        {/* ── ORG & VENDOR ─────────────────────────────────────────────────── */}
        {activeTab === "Organization & Vendor" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
            <Section title="Organization Info" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <div className="flex flex-col gap-4">
                  <Grid3>
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORG NAME</span><EInput value={draft.orgName} onChange={v => set("orgName", v)} /></div> : <ViewField label="Org Name" value={data.orgName} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORGANIZATION ID</span><EInput value={draft.orgId} onChange={v => set("orgId", v)} /></div> : <ViewField label="Organization ID" value={data.orgId} mono />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TAX REGISTRATION</span><EInput value={draft.orgTaxReg} onChange={v => set("orgTaxReg", v)} /></div> : <ViewField label="Tax Registration" value={data.orgTaxReg} mono />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PAN</span><EInput value={draft.orgPan} onChange={v => set("orgPan", v)} /></div> : <ViewField label="PAN" value={data.orgPan} mono />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GST</span><EInput value={draft.orgGst} onChange={v => set("orgGst", v)} /></div> : <ViewField label="GST" value={data.orgGst} mono />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PLACE OF SUPPLY</span><ESelect value={draft.placeOfSupply} onChange={v => set("placeOfSupply", v)} options={["Tamil Nadu", "Maharashtra", "Karnataka", "Delhi", "Gujarat"]} /></div> : <ViewField label="Place of Supply" value={data.placeOfSupply} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>LOCAL CURRENCY</span><ESelect value={draft.localCurrency} onChange={v => set("localCurrency", v)} options={["INR", "USD", "EUR"]} /></div> : <ViewField label="Local Currency" value={data.localCurrency} />}
                  </Grid3>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DELIVERY ADDRESS</span>
                    {editing ? <ETextarea value={draft.deliveryAddress} onChange={v => set("deliveryAddress", v)} /> : <span style={{ fontSize: 13, color: data.deliveryAddress ? "var(--foreground)" : "var(--muted-foreground)", lineHeight: 1.6 }}>{data.deliveryAddress || "—"}</span>}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Vendor Info" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid3>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR NAME</span><EInput value={draft.vendorName} onChange={v => set("vendorName", v)} /></div> : <ViewField label="Vendor Name" value={data.vendorName} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR ID</span><EInput value={draft.vendorId} onChange={v => set("vendorId", v)} /></div> : <ViewField label="Vendor ID" value={data.vendorId} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PAN</span><EInput value={draft.vendorPan} onChange={v => set("vendorPan", v)} /></div> : <ViewField label="PAN" value={data.vendorPan} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GSTIN</span><EInput value={draft.vendorGst} onChange={v => set("vendorGst", v)} /></div> : <ViewField label="GSTIN" value={data.vendorGst} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>SOURCE OF SUPPLY</span><ESelect value={draft.vendorSourceOfSupply} onChange={v => set("vendorSourceOfSupply", v)} options={["Tamil Nadu", "Maharashtra", "Karnataka", "Delhi", "Gujarat"]} /></div> : <ViewField label="Source of Supply" value={data.vendorSourceOfSupply} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>INVOICE AUTHORISED</span><ESelect value={draft.invoiceAuthorised} onChange={v => set("invoiceAuthorised", v)} options={["Yes", "No"]} /></div> : <ViewField label="Invoice Authorised" value={data.invoiceAuthorised} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TAX CATEGORY</span><ESelect value={draft.taxCategory} onChange={v => set("taxCategory", v)} options={["Regular", "Composition", "Exempt", "Zero Rated"]} /></div> : <ViewField label="Tax Category" value={data.taxCategory} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>CURRENCY</span><ESelect value={draft.currency} onChange={v => set("currency", v)} options={["INR", "USD", "EUR", "GBP"]} /></div> : <ViewField label="Currency" value={data.currency} />}
                </Grid3>
              )}
            </Section>
          </div>
        )}

        {/* ── TERMS ────────────────────────────────────────────────────────── */}
        {activeTab === "Terms" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
            <Section title="Delivery & Payment" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <div className="flex flex-col gap-4">
                  <Grid3>
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>MODE OF DELIVERY</span><ESelect value={draft.modeOfDelivery} onChange={v => set("modeOfDelivery", v)} options={["Courier", "Surface", "Air", "Sea", "Hand Delivery"]} /></div> : <ViewField label="Mode of Delivery" value={data.modeOfDelivery} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DELIVERY TERMS</span><ESelect value={draft.deliveryTerms} onChange={v => set("deliveryTerms", v)} options={["Ex-Works", "FOB", "CIF", "DDP", "DAP"]} /></div> : <ViewField label="Delivery Terms" value={data.deliveryTerms} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PAYMENT TERMS</span><ESelect value={draft.paymentTerms} onChange={v => set("paymentTerms", v)} options={["Net 7", "Net 15", "Net 30", "Net 45", "Net 60", "Immediate"]} /></div> : <ViewField label="Payment Terms" value={data.paymentTerms} />}
                  </Grid3>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>OTHER TERMS AND CONDITIONS</span>
                    {editing ? <ETextarea value={draft.otherTerms} onChange={v => set("otherTerms", v)} /> : <span style={{ fontSize: 13, color: data.otherTerms ? "var(--foreground)" : "var(--muted-foreground)", lineHeight: 1.6 }}>{data.otherTerms || "—"}</span>}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Agreement" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <div className="flex flex-col gap-4">
                  <Grid3>
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>AGREEMENT SIGNED</span><ESelect value={draft.agreementSigned} onChange={v => set("agreementSigned", v)} options={["Yes", "No"]} /></div> : <ViewField label="Agreement Signed" value={data.agreementSigned} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>AGREEMENT FROM</span><EInput value={draft.agreementFrom} onChange={v => set("agreementFrom", v)} /></div> : <ViewField label="Agreement From" value={data.agreementFrom} mono />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>AGREEMENT TO</span><EInput value={draft.agreementTo} onChange={v => set("agreementTo", v)} /></div> : <ViewField label="Agreement To" value={data.agreementTo} mono />}
                  </Grid3>
                  {!editing && data.agreementSigned === "Yes" && (
                    <button
                      onClick={() => setShowAgreement(true)}
                      className="flex items-center gap-2 rounded-lg px-4 py-2.5 transition-colors self-start"
                      style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
                    >
                      <FileText size={13} />
                      View Agreement
                      <ExternalLink size={11} style={{ opacity: 0.5 }} />
                    </button>
                  )}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── PO ITEMS ─────────────────────────────────────────────────────── */}
        {activeTab === "PO Items" && (
          <div className="flex flex-col gap-3" style={{ maxWidth: 900 }}>
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Line Items ({itemsList.length})</p>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Click any item to expand details</p>
            </div>
            <POItemsSection items={itemsList} setItems={setItemsList} isDraft={isDraft} />
          </div>
        )}

        {/* ── ALLOCATION ───────────────────────────────────────────────────── */}
        {activeTab === "Allocation" && (() => {
          const grandTotal = itemsList.reduce((acc, curr) => acc + (parseFloat(curr.totalValue) || 0), 0);
          const formattedGrandTotal = "₹ " + grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return (
            <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Purchase Order Cost Allocation</p>
                </div>
                <div className="p-5">
                  <div className="rounded-lg overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
                          {["Cost Allocation Method", "LOB", "Allocation Parameter Value", "Cost Allocated (Local Currency)"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>{h.toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>Direct</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>Technology</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>100%</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)" }}>{formattedGrandTotal}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── WORKFLOW ─────────────────────────────────────────────────────── */}
        {activeTab === "Workflow" && (
          <POWorkflowTab data={data} onSave={handleSave} isDraft={isDraft} isNew={isNew} />
        )}

        {/* ── DOC CONTROL ──────────────────────────────────────────────────── */}
        {activeTab === "Doc Control" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 820 }}>
            <Section title="Document Control" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid3>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>REQUESTED BY</span><EInput value={draft.requestedBy} onChange={v => set("requestedBy", v)} /></div> : <ViewField label="Requested By" value={data.requestedBy} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PREPARED BY</span><EInput value={draft.preparedBy} onChange={v => set("preparedBy", v)} /></div> : <ViewField label="Prepared By" value={data.preparedBy} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>AUTHORISED BY</span><EInput value={draft.authorisedBy} onChange={v => set("authorisedBy", v)} /></div> : <ViewField label="Authorised By" value={data.authorisedBy} />}
                </Grid3>
              )}
            </Section>
          </div>
        )}

      </div>
    </div>
  );
}
