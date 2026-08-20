import { useState, useEffect } from "react";
import { X, Check, Edit3, Lock, AlertCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useActivity } from "../../contexts";
import { rows } from "./GoodsAndServicesPage";

const statusColor: Record<string, string> = {
  Active: "#4ade80", 
  Pending: "#fbbf24", 
  Rejected: "#f87171",
  "Not Released": "#fbbf24", // Yellow/Amber Hold state styling token
  Validated: "#4ade80"
};

interface WorkflowActivity {
  lob: string;
  code: string;
  name: string;
  status: "Pending" | "Approved" | "Rejected";
  dependency: string;
  department: string;
  dueDate: string;
  reason?: string;
}

interface GoodsAndServicesDetailPageProps {
  itemId: string;
  onClose: () => void;
}

interface SectionCardProps {
  title: string;
  isEditable?: boolean;
  editing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}

function SectionCard({ title, isEditable, editing, onEdit, onSave, onCancel, children }: SectionCardProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)", flexShrink: 0 }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
        {onEdit !== undefined && (
          !editing ? (
            isEditable ? (
              <button 
                onClick={onEdit}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
              >
                <Edit3 size={11} /> Edit
              </button>
            ) : (
              <div 
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--muted)", border: "1px solid var(--border)", cursor: "not-allowed", opacity: 0.6 }}
              >
                <Lock size={10} /> Edit
              </div>
            )
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={onCancel}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
              >
                <X size={11} /> Cancel
              </button>
              <button 
                onClick={onSave}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
              >
                <Check size={11} /> Save
              </button>
            </div>
          )
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ViewField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 13, color: value ? "var(--foreground)" : "var(--muted-foreground)", fontFamily: mono ? "var(--font-mono)" : undefined, lineHeight: 1.5 }}>{value || "—"}</span>
    </div>
  );
}

function EInput({ value, onChange, type = "text", placeholder, mono, disabled }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; mono?: boolean; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <input 
        type={type}
        value={value} 
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ 
          height: 34, 
          background: disabled ? "var(--muted)" : "var(--secondary)", 
          border: "1px solid var(--border)", 
          borderRadius: 8, 
          outline: "none", 
          fontSize: 13, 
          fontFamily: mono ? "var(--font-mono)" : undefined,
          color: "var(--foreground)", 
          padding: "0 10px", 
          width: "100%",
          cursor: disabled ? "not-allowed" : "text",
          opacity: disabled ? 0.7 : 1,
          marginTop: 2
        }} 
      />
    </div>
  );
}

function ELabelInput({ label, value, onChange, placeholder, required, type = "text", disabled, mono }: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; required?: boolean; type?: string; disabled?: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>
        {label.toUpperCase()} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={disabled ? "cursor-not-allowed opacity-80" : ""}
        style={{
          height: 34,
          background: disabled ? "var(--muted)" : "var(--secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          outline: "none",
          fontSize: 13,
          fontFamily: mono ? "var(--font-mono)" : undefined,
          color: "var(--foreground)",
          padding: "0 10px",
          width: "100%"
        }}
      />
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-4">{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-x-8 gap-y-4">{children}</div>;
}

function SelectField({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label.toUpperCase()}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          height: 34,
          background: disabled ? "var(--muted)" : "var(--secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          outline: "none",
          fontSize: 13,
          color: "var(--foreground)",
          padding: "0 10px",
          width: "100%",
          cursor: disabled ? "not-allowed" : "pointer",
          marginTop: 2,
          opacity: disabled ? 0.7 : 1
        }}
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

const initialEntryLines = [
  {
    lineId: "1",
    orderDescription: "Omeprazole Pellets Supply",
    forPrdFrom: "01-06-2026",
    forPrdTo: "30-06-2026",
    itemName: "Omeprazole Enteric Coated Pellets",
    itemId: "EX-880063",
    orderQty: "95",
    balanceQty: "95",
    invoiceQty: "95",
    receivedQty: "95",
    rejectedQty: "0",
    acceptedQty: "95",
    orderRate: 4200.0,
    thisGrnSrnRate: 4200.0,
    orderValue: 399000.0,
    addlCharge: 0.0,
    thisGrnSrnValue: 399000.0,
    amtLclCurr: 399000.0,
    amtTxnCurr: 399000.0,
    costAllocMethod: "Weighted Average",
    sectionName: "Sec A",
    pctTds: "2.0%",
    action: "View"
  },
  {
    lineId: "2",
    orderDescription: "Amoxicillin Raw Powder",
    forPrdFrom: "01-06-2026",
    forPrdTo: "30-06-2026",
    itemName: "Amoxicillin Trihydrate USP",
    itemId: "EX-880064",
    orderQty: "50",
    balanceQty: "50",
    invoiceQty: "50",
    receivedQty: "50",
    rejectedQty: "0",
    acceptedQty: "50",
    orderRate: 3000.0,
    thisGrnSrnRate: 3000.0,
    orderValue: 150000.0,
    addlCharge: 0.0,
    thisGrnSrnValue: 150000.0,
    amtLclCurr: 150000.0,
    amtTxnCurr: 150000.0,
    costAllocMethod: "Weighted Average",
    sectionName: "Sec B",
    pctTds: "2.0%",
    action: "View"
  }
];

const initialJournalEntries = [
  {
    docNumber: "AJ0226270000048",
    accountingDate: "01-06-2026",
    accountType: "InventoryAc",
    itemType: "Inventory",
    accountGroup: "Pharmaceutical Formulation Materials",
    accountClass: "Omeprazole Enteric Coated Pellets",
    misGrouping: "Operational Asset",
    ledgerName: "Omeprazole Pellets Inventory",
    subLedgerName: "—",
    coaAccountCode: "310106",
    amtLclCurr: 399000.0,
    amtTxnCurr: 399000.0
  },
  {
    docNumber: "AJ0226270000049",
    accountingDate: "01-06-2026",
    accountType: "InventoryAc",
    itemType: "Inventory",
    accountGroup: "Raw Materials",
    accountClass: "Amoxicillin Trihydrate USP",
    misGrouping: "Operational Asset",
    ledgerName: "Amoxicillin Inventory",
    subLedgerName: "—",
    coaAccountCode: "310107",
    amtLclCurr: 150000.0,
    amtTxnCurr: 150000.0
  },
  {
    docNumber: "AJ0226270000050",
    accountingDate: "01-06-2026",
    accountType: "InventoryAc",
    itemType: "Inventory",
    accountGroup: "Raw Materials",
    accountClass: "Azithromycin Dihydrate USP",
    misGrouping: "Operational Asset",
    ledgerName: "Azithromycin Inventory",
    subLedgerName: "—",
    coaAccountCode: "310108",
    amtLclCurr: 250000.0,
    amtTxnCurr: 250000.0
  }
];

export function GoodsAndServicesDetailPage({ itemId, onClose }: GoodsAndServicesDetailPageProps) {
  const { openActivity } = useActivity();
  
  // Local mock receipt lookup
  const matchedRow = rows.find(r => r.id === itemId);
  const vendorName = matchedRow?.vendorName || "Global BioPharma Ingredients Inc.";

  const [statusVal, setStatusVal] = useState("Not Released");
  const [deductTds, setDeductTds] = useState(false);
  const [activeTab, setActiveTab] = useState("Goods & Services Info");
  const [expandedLines, setExpandedLines] = useState<string[]>(["1"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedJournals, setExpandedJournals] = useState<string[]>(["AJ0226270000048"]);
  const [journalSearchQuery, setJournalSearchQuery] = useState("");

  // Edit states for sections (Active, Rejected, Pending, Not Released are editable)
  const isEditable = ["Active", "Rejected", "Pending", "Not Released"].includes(statusVal);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingEntries, setEditingEntries] = useState(false);
  const [editingCostAlloc, setEditingCostAlloc] = useState(false);
  const [editingJournal, setEditingJournal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(false);

  // Goods & Services Info field states
  const [receiverTaxReg, setReceiverTaxReg] = useState("Demo Industrial Works Pvt Ltd / Tamil Nadu (TN) / 33ABCDE1234F1Z5");
  const [receiverId, setReceiverId] = useState("OM0000000002");
  const [receiverName, setReceiverName] = useState("Demo Industrial Works Pvt Ltd");
  const [receiverPan, setReceiverPan] = useState("ABCDE1234F");
  const [receiverGst, setReceiverGst] = useState("33ABCDE1234F1Z5");
  const [localCurrency, setLocalCurrency] = useState("INR");

  const [senderTaxReg, setSenderTaxReg] = useState(vendorName);
  const [senderId, setSenderId] = useState("VM0000000018");
  const [senderName, setSenderName] = useState(vendorName);
  const [senderPan, setSenderPan] = useState("—");
  const [senderGst, setSenderGst] = useState("—");
  const [senderCurrency, setSenderCurrency] = useState("INR");

  // Document information fields states
  const [docType, setDocType] = useState(matchedRow?.docType || "GoodsReceipt");
  const [invoiceRef, setInvoiceRef] = useState(matchedRow?.invoiceRef || "GBI/CM5");
  const [invoiceDate, setInvoiceDate] = useState("01-06-2026");
  const [orderType, setOrderType] = useState("Bill");
  const [orderNumber, setOrderNumber] = useState("BE0000001336");
  const [origGrnSrn, setOrigGrnSrn] = useState("Select");
  const [accountingDate, setAccountingDate] = useState("01-06-2026");
  const [modeDelivery, setModeDelivery] = useState("Offline");
  const [deliveryTerms, setDeliveryTerms] = useState("—");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [remarks, setRemarks] = useState("—");
  const [addlChargeType, setAddlChargeType] = useState("Handling Charges");
  const [totalAddlCharge, setTotalAddlCharge] = useState("0.0");
  const [exchangeRate, setExchangeRate] = useState("1.0");
  const [createDate, setCreateDate] = useState("01-06-2026");

  // Entries Item state
  const [entryLines, setEntryLines] = useState(initialEntryLines);

  // Cost Allocation state
  const [costAllocRows, setCostAllocRows] = useState([
    { method: "Weighted Average", lob: "LOB-01", param: "Parameter A", val: "₹3,99,000.00" },
    { method: "Weighted Average", lob: "LOB-02", param: "Parameter B", val: "₹1,50,000.00" }
  ]);

  // Journal state
  const [journalEntries, setJournalEntries] = useState(initialJournalEntries);

  // Workflow states
  const [workflow, setWorkflow] = useState<WorkflowActivity[]>([
    { lob: "LOB-01", code: "ACT-01", name: "Quality Check & Verification", status: "Pending", dependency: "—", department: "Quality Assurance", dueDate: "05-06-2026", reason: "" },
    { lob: "LOB-01", code: "ACT-02", name: "Financial Reconciliation", status: "Pending", dependency: "ACT-01", department: "Finance & Accounts", dueDate: "08-06-2026", reason: "" },
    { lob: "LOB-02", code: "ACT-03", name: "Gate Entry Verification", status: "Pending", dependency: "—", department: "Logistics", dueDate: "03-06-2026", reason: "" }
  ]);
  const [rejectingCode, setRejectingCode] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Establish AI Workspace context on mount and clear on unmount
  useEffect(() => {
    openActivity({
      type: "Goods and Services",
      id: itemId,
      status: statusVal,
      createdBy: "Alex Johnson",
      createdDate: matchedRow?.invoiceDate || "Jun 01, 2026"
    });

    return () => {
      openActivity(null as any);
    };
  }, [itemId, statusVal, openActivity, matchedRow]);

  const tabs = [
    "Goods & Services Info",
    "Entries Item",
    "Cost Allocation",
    "Journal",
    "Workflow"
  ];

  // Update line item helper
  const updateLineField = (lineId: string, field: string, val: any) => {
    setEntryLines(prev =>
      prev.map(line => {
        if (line.lineId !== lineId) return line;
        const updated = { ...line, [field]: val };
        if (field === "orderQty" || field === "thisGrnSrnRate" || field === "addlCharge") {
          const qty = parseFloat(updated.orderQty) || 0;
          const rate = parseFloat(updated.thisGrnSrnRate) || 0;
          const addl = parseFloat(updated.addlCharge) || 0;
          const valTotal = (qty * rate) + addl;
          updated.orderValue = qty * rate;
          updated.thisGrnSrnValue = valTotal;
          updated.amtLclCurr = valTotal;
          updated.amtTxnCurr = valTotal;
        }
        return updated;
      })
    );
  };

  // Update journal entry helper
  const updateJournalField = (docNumber: string, field: string, val: any) => {
    setJournalEntries(prev =>
      prev.map(j => (j.docNumber === docNumber ? { ...j, [field]: val } : j))
    );
  };

  // Update workflow item helper
  const updateWorkflowField = (code: string, field: string, val: any) => {
    setWorkflow(prev =>
      prev.map(act => (act.code === code ? { ...act, [field]: val } : act))
    );
  };

  // Actions for Workflow
  const handleApprove = (code: string) => {
    setWorkflow(prev =>
      prev.map(act => (act.code === code ? { ...act, status: "Approved", reason: "" } : act))
    );
  };

  const handleReset = (code: string) => {
    setWorkflow(prev =>
      prev.map(act => (act.code === code ? { ...act, status: "Pending", reason: "" } : act))
    );
  };

  const handleRejectClick = (code: string) => {
    setRejectingCode(code);
    setRejectReason("");
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    setWorkflow(prev =>
      prev.map(act => (act.code === rejectingCode ? { ...act, status: "Rejected", reason: rejectReason } : act))
    );
    setRejectingCode(null);
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
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>{itemId}</h1>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{vendorName}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[statusVal] }}>
              <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[statusVal], display: "inline-block" }} />
              {statusVal}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Deduct TDS Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none py-1 px-2.5 rounded-lg border border-border" style={{ background: "var(--secondary)", height: 32 }}>
            <input
              type="checkbox"
              checked={deductTds}
              onChange={(e) => setDeductTds(e.target.checked)}
              className="rounded border-border text-blue-600 focus:ring-blue-500/20"
              style={{ width: 14, height: 14, cursor: "pointer" }}
            />
            <span className="text-[12px] font-medium text-foreground">
              Deduct TDS
            </span>
          </label>

          <button 
            onClick={() => {
              setStatusVal("Validated");
              alert("Goods & Services receipt validated successfully.");
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
          >
            Validate
          </button>
          <button 
            onClick={() => {
              setStatusVal("Active");
              alert("Goods & Services receipt activated successfully.");
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
          >
            Activate
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
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

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        
        {/* Tab 1: Goods & Services Info */}
        {activeTab === "Goods & Services Info" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 1000 }}>
            {/* Receiver Info */}
            <SectionCard 
              title="Receiver Info"
              isEditable={isEditable}
              editing={editingInfo}
              onEdit={() => setEditingInfo(true)}
              onSave={() => setEditingInfo(false)}
              onCancel={() => setEditingInfo(false)}
            >
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <div className="col-span-full">
                  <SelectField
                    label="Receiver (w) Tax Reg."
                    value={receiverTaxReg}
                    onChange={setReceiverTaxReg}
                    disabled={!editingInfo}
                    options={[
                      "Demo Industrial Works Pvt Ltd / Tamil Nadu (TN) / 33ABCDE1234F1Z5",
                      "Demo Industrial Works Pvt Ltd / Karnataka (KA) / 29ABCDE1234F1Z5",
                      "Demo Industrial Works Pvt Ltd / Maharashtra (MH) / 27ABCDE1234F1Z5"
                    ]}
                  />
                </div>
                {editingInfo ? (
                  <>
                    <ELabelInput label="Receiver ID" value={receiverId} onChange={setReceiverId} mono disabled />
                    <ELabelInput label="Receiver Name" value={receiverName} onChange={setReceiverName} />
                    <ELabelInput label="Receiver PAN" value={receiverPan} onChange={setReceiverPan} mono />
                    <ELabelInput label="Receiver GST Number" value={receiverGst} onChange={setReceiverGst} mono />
                    <ELabelInput label="Local Currency" value={localCurrency} onChange={setLocalCurrency} />
                  </>
                ) : (
                  <>
                    <ViewField label="Receiver ID" value={receiverId} mono />
                    <ViewField label="Receiver Name" value={receiverName} />
                    <ViewField label="Receiver PAN" value={receiverPan} mono />
                    <ViewField label="Receiver GST Number" value={receiverGst} mono />
                    <ViewField label="Local Currency" value={localCurrency} />
                  </>
                )}
              </div>
            </SectionCard>

            {/* Sender Info */}
            <SectionCard 
              title="Sender Info"
              isEditable={isEditable}
              editing={editingInfo}
              onEdit={() => setEditingInfo(true)}
              onSave={() => setEditingInfo(false)}
              onCancel={() => setEditingInfo(false)}
            >
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <div className="col-span-full">
                  <SelectField
                    label="Sender Name / Tax Reg."
                    value={senderTaxReg}
                    onChange={setSenderTaxReg}
                    disabled={!editingInfo}
                    options={[
                      "Global BioPharma Ingredients Inc.",
                      "ABC Chemicals Ltd",
                      "HealthLogistics Pvt Ltd",
                      "EuroLab Compliance Services GmbH"
                    ]}
                  />
                </div>
                {editingInfo ? (
                  <>
                    <ELabelInput label="Sender ID" value={senderId} onChange={setSenderId} mono disabled />
                    <ELabelInput label="Sender Name" value={senderName} onChange={setSenderName} />
                    <ELabelInput label="Sender PAN" value={senderPan} onChange={setSenderPan} />
                    <ELabelInput label="Sender GST Number" value={senderGst} onChange={setSenderGst} />
                    <ELabelInput label="Currency" value={senderCurrency} onChange={setSenderCurrency} />
                  </>
                ) : (
                  <>
                    <ViewField label="Sender ID" value={senderId} mono />
                    <ViewField label="Sender Name" value={senderName} />
                    <ViewField label="Sender PAN" value={senderPan} />
                    <ViewField label="Sender GST Number" value={senderGst} />
                    <ViewField label="Currency" value={senderCurrency} />
                  </>
                )}
              </div>
            </SectionCard>

            {/* Document Information */}
            <SectionCard 
              title="Document Information"
              isEditable={isEditable}
              editing={editingInfo}
              onEdit={() => setEditingInfo(true)}
              onSave={() => setEditingInfo(false)}
              onCancel={() => setEditingInfo(false)}
            >
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <SelectField label="Document Type" value={docType} onChange={setDocType} disabled={!editingInfo} options={["GoodsReceipt", "ServiceReceipt"]} />
                {editingInfo ? <ELabelInput label="Invoice Ref" value={invoiceRef} onChange={setInvoiceRef} /> : <ViewField label="Invoice Ref" value={invoiceRef} />}
                {editingInfo ? <ELabelInput label="Invoice Date" value={invoiceDate} onChange={setInvoiceDate} mono /> : <ViewField label="Invoice Date" value={invoiceDate} mono />}
                <SelectField label="Order Type" value={orderType} onChange={setOrderType} disabled={!editingInfo} options={["Bill", "Purchase Order", "CapeXPurchase Order", "Internal Plan"]} />
                {editingInfo ? <ELabelInput label="Order Number" value={orderNumber} onChange={setOrderNumber} mono /> : <ViewField label="Order Number" value={orderNumber} mono />}
                <SelectField
                  label="Original GRN/SRN Number"
                  value={origGrnSrn}
                  onChange={setOrigGrnSrn}
                  disabled={!editingInfo}
                  options={["Select", "GSEO226270000041", "GSEO226270000040", "GSEO226270000039", "GSEO226270000038", "GSEO226270000005"]}
                />
                {editingInfo ? <ELabelInput label="Accounting Date" value={accountingDate} onChange={setAccountingDate} mono /> : <ViewField label="Accounting Date" value={accountingDate} mono />}
                <SelectField label="Mode of Delivery" value={modeDelivery} onChange={setModeDelivery} disabled={!editingInfo} options={["Offline", "Online"]} />
                {editingInfo ? <ELabelInput label="Delivery Terms" value={deliveryTerms} onChange={setDeliveryTerms} /> : <ViewField label="Delivery Terms" value={deliveryTerms} />}
                <SelectField label="Payment Terms" value={paymentTerms} onChange={setPaymentTerms} disabled={!editingInfo} options={["Advance 50%", "Net 7", "Net 15", "Net 30", "Net 45", "Net 60", "Due End of Month"]} />
                {editingInfo ? <ELabelInput label="Remarks (For Internal Use)" value={remarks} onChange={setRemarks} /> : <ViewField label="Remarks (For Internal Use)" value={remarks} />}
                <SelectField label="Addl Charge Type" value={addlChargeType} onChange={setAddlChargeType} disabled={!editingInfo} options={["Toll Charges", "Freight Charges", "Handling Charges", "Packaging Charges", "Customs Duty", "Service Charge", "Installation Charge", "Other Charges", "Environmental Charge", "Consulting fee", "Administrative Fee"]} />
                {editingInfo ? <ELabelInput label="Total Addl Charge" value={totalAddlCharge} onChange={setTotalAddlCharge} mono /> : <ViewField label="Total Addl Charge" value={totalAddlCharge} mono />}
                {editingInfo ? <ELabelInput label="Exchange Rate" value={exchangeRate} onChange={setExchangeRate} mono /> : <ViewField label="Exchange Rate" value={exchangeRate} mono />}
                {editingInfo ? <ELabelInput label="Create Date" value={createDate} onChange={setCreateDate} mono /> : <ViewField label="Create Date" value={createDate} mono />}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Tab 2: Entries Item */}
        {activeTab === "Entries Item" && (
          <div className="flex flex-col gap-4 animate-fadeIn" style={{ maxWidth: 900 }}>
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  Goods & Services Entries Item ({entryLines.length} Line Items)
                </p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  Expand a line item to view detailed quantity, pricing, allocation, and tax breakdown.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400" style={{ top: 2 }}>
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search line, description, item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      width: 200,
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 32
                    }}
                  />
                </div>
                {/* Expand / Collapse Actions */}
                <button
                  onClick={() => setExpandedLines(entryLines.map(l => l.lineId))}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                  style={{
                    background: "var(--secondary)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    height: 32
                  }}
                >
                  Expand All
                </button>
                <button
                  onClick={() => setExpandedLines([])}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                  style={{
                    background: "var(--secondary)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    height: 32
                  }}
                >
                  Collapse All
                </button>

                {/* Edit Control for Entries Item */}
                {!editingEntries ? (
                  isEditable ? (
                    <button 
                      onClick={() => setEditingEntries(true)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                      style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)", height: 32 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
                    >
                      <Edit3 size={11} /> Edit
                    </button>
                  ) : (
                    <div 
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                      style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--muted)", border: "1px solid var(--border)", cursor: "not-allowed", opacity: 0.6, height: 32 }}
                    >
                      <Lock size={10} /> Edit
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setEntryLines(initialEntryLines); setEditingEntries(false); }}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                      style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)", height: 32 }}
                    >
                      <X size={11} /> Cancel
                    </button>
                    <button 
                      onClick={() => setEditingEntries(false)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                      style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer", height: 32 }}
                    >
                      <Check size={11} /> Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* List of expandable cards */}
            <div className="flex flex-col gap-3">
              {entryLines
                .filter(l => {
                  const q = searchQuery.toLowerCase().trim();
                  return !q || 
                    l.lineId.includes(q) ||
                    l.itemName.toLowerCase().includes(q) ||
                    l.itemId.toLowerCase().includes(q) ||
                    l.orderDescription.toLowerCase().includes(q);
                })
                .map(line => {
                  const isExpanded = expandedLines.includes(line.lineId);
                  return (
                    <div 
                      key={line.lineId} 
                      className="rounded-xl overflow-hidden transition-all duration-200" 
                      style={{ 
                        background: "var(--card)", 
                        border: "1px solid var(--border)"
                      }}
                    >
                      {/* Collapsed Header Bar */}
                      <button 
                        className="w-full flex items-center justify-between px-5 py-3 text-left focus:outline-none select-none transition-colors"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedLines(prev => prev.filter(id => id !== line.lineId));
                          } else {
                            setExpandedLines(prev => [...prev, line.lineId]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                          <span 
                            className="flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ 
                              width: 28, 
                              height: 28, 
                              background: "var(--secondary)", 
                              fontSize: 10, 
                              fontWeight: 700, 
                              color: "var(--foreground)", 
                              fontFamily: "var(--font-mono)",
                              border: "1px solid var(--border)"
                            }}
                          >
                            L{line.lineId.padStart(3, "0")}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {line.itemName}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                              {line.itemId} · {line.orderDescription}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8 flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>QTY</span>
                            <span style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>{line.orderQty}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>RATE</span>
                            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>₹{(typeof line.thisGrnSrnRate === 'number' ? line.thisGrnSrnRate : parseFloat(line.thisGrnSrnRate) || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>VALUE</span>
                            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>₹{(typeof line.thisGrnSrnValue === 'number' ? line.thisGrnSrnValue : parseFloat(line.thisGrnSrnValue) || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Content Section */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                          
                          {/* Section 1: Item Information */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ITEM INFORMATION</h4>
                            <Grid3>
                              <ViewField label="Line ID" value={line.lineId} mono />
                              <ViewField label="Item ID" value={line.itemId} mono />
                              {editingEntries ? (
                                <ELabelInput label="Item Name" value={line.itemName} onChange={val => updateLineField(line.lineId, "itemName", val)} />
                              ) : (
                                <ViewField label="Item Name" value={line.itemName} />
                              )}
                              {editingEntries ? (
                                <ELabelInput label="Order Description" value={line.orderDescription} onChange={val => updateLineField(line.lineId, "orderDescription", val)} />
                              ) : (
                                <ViewField label="Order Description" value={line.orderDescription} />
                              )}
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 2: Period Information */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PERIOD INFORMATION</h4>
                            <Grid2>
                              {editingEntries ? (
                                <ELabelInput label="For Period From" value={line.forPrdFrom} onChange={val => updateLineField(line.lineId, "forPrdFrom", val)} mono />
                              ) : (
                                <ViewField label="For Period From" value={line.forPrdFrom} mono />
                              )}
                              {editingEntries ? (
                                <ELabelInput label="For Period To" value={line.forPrdTo} onChange={val => updateLineField(line.lineId, "forPrdTo", val)} mono />
                              ) : (
                                <ViewField label="For Period To" value={line.forPrdTo} mono />
                              )}
                            </Grid2>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 3: Quantity & Pricing */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>QUANTITY & STATUS</h4>
                            <Grid3>
                              {editingEntries ? <ELabelInput label="Order Quantity" value={String(line.orderQty)} onChange={val => updateLineField(line.lineId, "orderQty", val)} type="number" /> : <ViewField label="Order Quantity" value={String(line.orderQty)} />}
                              {editingEntries ? <ELabelInput label="Balance Quantity" value={String(line.balanceQty)} onChange={val => updateLineField(line.lineId, "balanceQty", val)} type="number" /> : <ViewField label="Balance Quantity" value={String(line.balanceQty)} />}
                              {editingEntries ? <ELabelInput label="Invoice Quantity" value={String(line.invoiceQty)} onChange={val => updateLineField(line.lineId, "invoiceQty", val)} type="number" /> : <ViewField label="Invoice Quantity" value={String(line.invoiceQty)} />}
                              {editingEntries ? <ELabelInput label="Received Quantity" value={String(line.receivedQty)} onChange={val => updateLineField(line.lineId, "receivedQty", val)} type="number" /> : <ViewField label="Received Quantity" value={String(line.receivedQty)} />}
                              {editingEntries ? <ELabelInput label="Rejected Quantity" value={String(line.rejectedQty)} onChange={val => updateLineField(line.lineId, "rejectedQty", val)} type="number" /> : <ViewField label="Rejected Quantity" value={String(line.rejectedQty)} />}
                              {editingEntries ? <ELabelInput label="Accepted Quantity" value={String(line.acceptedQty)} onChange={val => updateLineField(line.lineId, "acceptedQty", val)} type="number" /> : <ViewField label="Accepted Quantity" value={String(line.acceptedQty)} />}
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 4: Pricing breakdown */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PRICING & VALUATION</h4>
                            <Grid3>
                              {editingEntries ? <ELabelInput label="Order Rate" value={String(line.orderRate)} onChange={val => updateLineField(line.lineId, "orderRate", val)} type="number" mono /> : <ViewField label="Order Rate" value={`₹${Number(line.orderRate).toLocaleString("en-IN")}`} mono />}
                              {editingEntries ? <ELabelInput label="This GRN/SRN Rate" value={String(line.thisGrnSrnRate)} onChange={val => updateLineField(line.lineId, "thisGrnSrnRate", val)} type="number" mono /> : <ViewField label="This GRN/SRN Rate" value={`₹${Number(line.thisGrnSrnRate).toLocaleString("en-IN")}`} mono />}
                              <ViewField label="Order Value" value={`₹${Number(line.orderValue).toLocaleString("en-IN")}`} mono />
                              {editingEntries ? <ELabelInput label="Additional Charge" value={String(line.addlCharge)} onChange={val => updateLineField(line.lineId, "addlCharge", val)} type="number" mono /> : <ViewField label="Additional Charge" value={`₹${Number(line.addlCharge).toLocaleString("en-IN")}`} mono />}
                              <ViewField label="This GRN/SRN Value" value={`₹${Number(line.thisGrnSrnValue).toLocaleString("en-IN")}`} mono />
                              <ViewField label="Amount in Local Currency" value={`₹${Number(line.amtLclCurr).toLocaleString("en-IN")}`} mono />
                              <ViewField label="Amount in Transaction Currency" value={`₹${Number(line.amtTxnCurr).toLocaleString("en-IN")}`} mono />
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 5: Allocation & Taxes */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ALLOCATION & TAXES</h4>
                            <Grid3>
                              {editingEntries ? (
                                <SelectField label="Cost Allocation Method" value={line.costAllocMethod} onChange={val => updateLineField(line.lineId, "costAllocMethod", val)} options={["Weighted Average", "Direct LOB Costing", "LOB Allocation Ratio", "Equal Distribution"]} />
                              ) : (
                                <ViewField label="Cost Allocation Method" value={line.costAllocMethod} />
                              )}
                              {editingEntries ? (
                                <ELabelInput label="Section Name" value={line.sectionName} onChange={val => updateLineField(line.lineId, "sectionName", val)} />
                              ) : (
                                <ViewField label="Section Name" value={line.sectionName} />
                              )}
                              {editingEntries ? (
                                <ELabelInput label="Percentage of TDS" value={line.pctTds} onChange={val => updateLineField(line.lineId, "pctTds", val)} />
                              ) : (
                                <ViewField label="Percentage of TDS" value={line.pctTds} />
                              )}
                            </Grid3>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tab 3: Cost Allocation */}
        {activeTab === "Cost Allocation" && (
          <SectionCard 
            title="Goods & Services Entries Cost Allocation"
            isEditable={isEditable}
            editing={editingCostAlloc}
            onEdit={() => setEditingCostAlloc(true)}
            onSave={() => setEditingCostAlloc(false)}
            onCancel={() => {
              setCostAllocRows([
                { method: "Weighted Average", lob: "LOB-01", param: "Parameter A", val: "₹3,99,000.00" },
                { method: "Weighted Average", lob: "LOB-02", param: "Parameter B", val: "₹1,50,000.00" }
              ]);
              setEditingCostAlloc(false);
            }}
          >
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cost Allocation Method</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>LOB</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cost Allocation Parameter Value</th>
                    <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cost Allocated Lcl Curr</th>
                  </tr>
                </thead>
                <tbody>
                  {costAllocRows.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>
                        {editingCostAlloc ? (
                          <select
                            value={r.method}
                            onChange={e => {
                              const updated = [...costAllocRows];
                              updated[idx].method = e.target.value;
                              setCostAllocRows(updated);
                            }}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)" }}
                          >
                            {["Weighted Average", "Direct LOB Costing", "LOB Allocation Ratio", "Equal Distribution"].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        ) : r.method}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>
                        {editingCostAlloc ? (
                          <input
                            value={r.lob}
                            onChange={e => {
                              const updated = [...costAllocRows];
                              updated[idx].lob = e.target.value;
                              setCostAllocRows(updated);
                            }}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 100 }}
                          />
                        ) : r.lob}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>
                        {editingCostAlloc ? (
                          <input
                            value={r.param}
                            onChange={e => {
                              const updated = [...costAllocRows];
                              updated[idx].param = e.target.value;
                              setCostAllocRows(updated);
                            }}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 140 }}
                          />
                        ) : r.param}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>
                        {editingCostAlloc ? (
                          <input
                            value={r.val}
                            onChange={e => {
                              const updated = [...costAllocRows];
                              updated[idx].val = e.target.value;
                              setCostAllocRows(updated);
                            }}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 140 }}
                          />
                        ) : r.val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* Tab 4: Journal */}
        {activeTab === "Journal" && (
          <div className="flex flex-col gap-4 animate-fadeIn" style={{ maxWidth: 900 }}>
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  Goods & Services Entries Journal ({journalEntries.length} Line Items)
                </p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  Expand a journal entry to view detailed accounting, ledger, and monetary breakdown.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400" style={{ top: 2 }}>
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search document, account, ledger..."
                    value={journalSearchQuery}
                    onChange={(e) => setJournalSearchQuery(e.target.value)}
                    className="pl-8 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      width: 200,
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 32
                    }}
                  />
                </div>
                {/* Expand / Collapse Actions */}
                <button
                  onClick={() => setExpandedJournals(journalEntries.map(l => l.docNumber))}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                  style={{
                    background: "var(--secondary)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    height: 32
                  }}
                >
                  Expand All
                </button>
                <button
                  onClick={() => setExpandedJournals([])}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                  style={{
                    background: "var(--secondary)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    height: 32
                  }}
                >
                  Collapse All
                </button>

                {/* Edit Control for Journal */}
                {!editingJournal ? (
                  isEditable ? (
                    <button 
                      onClick={() => setEditingJournal(true)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                      style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)", height: 32 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
                    >
                      <Edit3 size={11} /> Edit
                    </button>
                  ) : (
                    <div 
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                      style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--muted)", border: "1px solid var(--border)", cursor: "not-allowed", opacity: 0.6, height: 32 }}
                    >
                      <Lock size={10} /> Edit
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setJournalEntries(initialJournalEntries); setEditingJournal(false); }}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                      style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)", height: 32 }}
                    >
                      <X size={11} /> Cancel
                    </button>
                    <button 
                      onClick={() => setEditingJournal(false)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                      style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer", height: 32 }}
                    >
                      <Check size={11} /> Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* List of expandable cards */}
            <div className="flex flex-col gap-3">
              {journalEntries
                .filter(l => {
                  const q = journalSearchQuery.toLowerCase().trim();
                  return !q || 
                    l.docNumber.toLowerCase().includes(q) ||
                    l.accountType.toLowerCase().includes(q) ||
                    l.accountGroup.toLowerCase().includes(q) ||
                    l.accountClass.toLowerCase().includes(q) ||
                    l.ledgerName.toLowerCase().includes(q) ||
                    l.coaAccountCode.includes(q);
                })
                .map(entry => {
                  const isExpanded = expandedJournals.includes(entry.docNumber);
                  return (
                    <div 
                      key={entry.docNumber} 
                      className="rounded-xl overflow-hidden transition-all duration-200" 
                      style={{ 
                        background: "var(--card)", 
                        border: "1px solid var(--border)"
                      }}
                    >
                      {/* Collapsed Header Bar */}
                      <button 
                        className="w-full flex items-center justify-between px-5 py-3 text-left focus:outline-none select-none transition-colors"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedJournals(prev => prev.filter(id => id !== entry.docNumber));
                          } else {
                            setExpandedJournals(prev => [...prev, entry.docNumber]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                          <span 
                            className="flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ 
                              width: 28, 
                              height: 28, 
                              background: "var(--secondary)", 
                              fontSize: 10, 
                              fontWeight: 700, 
                              color: "var(--foreground)", 
                              fontFamily: "var(--font-mono)",
                              border: "1px solid var(--border)",
                              padding: "0 4px",
                              textAlign: "center"
                            }}
                          >
                            AJ
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {entry.docNumber}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                              {entry.accountClass} · {entry.accountingDate}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8 flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>GROUP</span>
                            <span style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>{entry.accountGroup}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>LOCAL AMT</span>
                            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>₹{Number(entry.amtLclCurr).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>TXN AMT</span>
                            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>₹{Number(entry.amtTxnCurr).toLocaleString("en-IN")}</span>
                          </div>
                          <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Content Section */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                          
                          {/* Section 1: Document & Date Details */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DOCUMENT & DATE</h4>
                            <Grid2>
                              <ViewField label="AccDoc Number" value={entry.docNumber} mono />
                              {editingJournal ? (
                                <ELabelInput label="Accounting Date" value={entry.accountingDate} onChange={val => updateJournalField(entry.docNumber, "accountingDate", val)} mono />
                              ) : (
                                <ViewField label="Accounting Date" value={entry.accountingDate} mono />
                              )}
                            </Grid2>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 2: Account Classification */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT CLASSIFICATION</h4>
                            <Grid3>
                              {editingJournal ? <ELabelInput label="Account Type" value={entry.accountType} onChange={val => updateJournalField(entry.docNumber, "accountType", val)} /> : <ViewField label="Account Type" value={entry.accountType} />}
                              {editingJournal ? <ELabelInput label="Item Type" value={entry.itemType} onChange={val => updateJournalField(entry.docNumber, "itemType", val)} /> : <ViewField label="Item Type" value={entry.itemType} />}
                              {editingJournal ? <ELabelInput label="Account Group" value={entry.accountGroup} onChange={val => updateJournalField(entry.docNumber, "accountGroup", val)} /> : <ViewField label="Account Group" value={entry.accountGroup} />}
                              {editingJournal ? <ELabelInput label="Account Class" value={entry.accountClass} onChange={val => updateJournalField(entry.docNumber, "accountClass", val)} /> : <ViewField label="Account Class" value={entry.accountClass} />}
                              {editingJournal ? <ELabelInput label="MIS Grouping" value={entry.misGrouping} onChange={val => updateJournalField(entry.docNumber, "misGrouping", val)} /> : <ViewField label="MIS Grouping" value={entry.misGrouping} />}
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 3: Ledger Details */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>LEDGER DETAILS</h4>
                            <Grid3>
                              {editingJournal ? <ELabelInput label="Ledger Name" value={entry.ledgerName} onChange={val => updateJournalField(entry.docNumber, "ledgerName", val)} /> : <ViewField label="Ledger Name" value={entry.ledgerName} />}
                              {editingJournal ? <ELabelInput label="SubLedger Name" value={entry.subLedgerName} onChange={val => updateJournalField(entry.docNumber, "subLedgerName", val)} /> : <ViewField label="SubLedger Name" value={entry.subLedgerName} />}
                              {editingJournal ? <ELabelInput label="COA Account Code" value={entry.coaAccountCode} onChange={val => updateJournalField(entry.docNumber, "coaAccountCode", val)} mono /> : <ViewField label="COA Account Code" value={entry.coaAccountCode} mono />}
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 4: Monetary Information */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>MONETARY VALUES</h4>
                            <Grid2>
                              {editingJournal ? (
                                <ELabelInput label="Amt in Lcl Curr" value={String(entry.amtLclCurr)} onChange={val => updateJournalField(entry.docNumber, "amtLclCurr", val)} type="number" mono />
                              ) : (
                                <ViewField label="Amt in Lcl Curr" value={`₹${Number(entry.amtLclCurr).toLocaleString("en-IN")}`} mono />
                              )}
                              {editingJournal ? (
                                <ELabelInput label="Amt in Txn Curr" value={String(entry.amtTxnCurr)} onChange={val => updateJournalField(entry.docNumber, "amtTxnCurr", val)} type="number" mono />
                              ) : (
                                <ViewField label="Amt in Txn Curr" value={`₹${Number(entry.amtTxnCurr).toLocaleString("en-IN")}`} mono />
                              )}
                            </Grid2>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tab 5: Workflow */}
        {activeTab === "Workflow" && (
          <SectionCard 
            title="Goods & Services Entries Work Flow"
            isEditable={isEditable}
            editing={editingWorkflow}
            onEdit={() => setEditingWorkflow(true)}
            onSave={() => setEditingWorkflow(false)}
            onCancel={() => setEditingWorkflow(false)}
          >
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left" style={{ borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["LOB", "Activity Code", "Activity Name", "Activity Status", "Reason", "Dependency", "Department", "Due Date", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workflow.map(act => (
                    <tr key={act.code} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>
                        {editingWorkflow ? (
                          <input
                            value={act.lob}
                            onChange={e => updateWorkflowField(act.code, "lob", e.target.value)}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 90 }}
                          />
                        ) : act.lob}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{act.code}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>
                        {editingWorkflow ? (
                          <input
                            value={act.name}
                            onChange={e => updateWorkflowField(act.code, "name", e.target.value)}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", minWidth: 160 }}
                          />
                        ) : act.name}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                          style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[act.status] }}>
                          <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[act.status], display: "inline-block" }} />
                          {act.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted-foreground)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={act.reason}>
                        {act.reason || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted-foreground)" }}>
                        {editingWorkflow ? (
                          <input
                            value={act.dependency}
                            onChange={e => updateWorkflowField(act.code, "dependency", e.target.value)}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 80 }}
                          />
                        ) : act.dependency}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>
                        {editingWorkflow ? (
                          <input
                            value={act.department}
                            onChange={e => updateWorkflowField(act.code, "department", e.target.value)}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 140 }}
                          />
                        ) : act.department}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                        {editingWorkflow ? (
                          <input
                            value={act.dueDate}
                            onChange={e => updateWorkflowField(act.code, "dueDate", e.target.value)}
                            style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 100 }}
                          />
                        ) : act.dueDate}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleReset(act.code)}
                            style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 500 }}
                          >
                            Reset
                          </button>
                          <button 
                            onClick={() => handleApprove(act.code)}
                            style={{ background: "rgba(74,222,128,0.12)", color: "#10b981", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectClick(act.code)}
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

      {/* Rejection Modal */}
      {rejectingCode && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="rounded-xl p-6 flex flex-col gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)", width: 420 }}>
            <div className="flex items-center gap-2 text-[#ef4444]">
              <AlertCircle size={18} />
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Enter Rejection Reason</h3>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Provide a clear reason for rejecting this workflow activity..."
              style={{
                width: "100%",
                height: 90,
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                outline: "none",
                fontSize: 13,
                color: "var(--foreground)",
                padding: "8px 10px",
                resize: "none"
              }}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button 
                onClick={() => setRejectingCode(null)}
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmReject}
                style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                Reject Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
