import { useState } from "react";
import { X, Check, ChevronDown, ChevronUp, Trash2, Plus, AlertCircle } from "lucide-react";
import { rows as itemRows } from "./ItemPage";
import { rows as receiptRows } from "./GoodsAndServicesPage";

interface NewReceiptPageProps {
  onClose: () => void;
  onCreate: (receipt: any) => void;
}

const statusColor: Record<string, string> = {
  Active: "#4ade80", 
  Pending: "#fbbf24", 
  Rejected: "#f87171",
  "Not Released": "#fbbf24",
  Validated: "#4ade80",
  Approved: "#4ade80"
};

function SectionCard({ title, children, rightAction }: { title: string; children: React.ReactNode; rightAction?: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden w-full" style={{ background: "var(--card)", border: "1px solid var(--border)", flexShrink: 0 }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
        {rightAction}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-4">{children}</div>;
}

function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-x-8 gap-y-4">{children}</div>;
}

function Grid4({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-4 gap-x-8 gap-y-4">{children}</div>;
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

function ELabelSelect({ label, value, onChange, options, required, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>
        {label.toUpperCase()} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
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
          cursor: disabled ? "not-allowed" : "pointer"
        }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// Prepare item master lookup lists
const itemMasterList = [
  ...itemRows.map(r => ({
    id: r.id,
    name: r.name,
    rate: parseFloat(r.rate.replace(/[^0-9.]/g, "")) || 450.0
  })),
  { id: "EX-880063", name: "Omeprazole Enteric Coated Pellets", rate: 4200.0 },
  { id: "EX-880064", name: "Amoxicillin Trihydrate USP", rate: 3000.0 },
  { id: "EX-880065", name: "Azithromycin Dihydrate USP", rate: 5000.0 }
];

export function GoodsAndServicesNewReceiptPage({ onClose, onCreate }: NewReceiptPageProps) {
  // Receiver Information
  const receiverOptions = [
    "Select Receiver",
    "Demo Industrial Works Pvt Ltd / Tamil Nadu (TN) / 33ABCDE1234F1Z5",
    "Demo Industrial Works Pvt Ltd / Karnataka (KA) / 29ABCDE1234F1Z5",
    "Demo Industrial Works Pvt Ltd / Maharashtra (MH) / 27ABCDE1234F1Z5"
  ];
  const [receiver, setReceiver] = useState("Select Receiver");

  // Derived Receiver Fields from selection
  const isReceiverSelected = receiver !== "Select Receiver" && receiver !== "";
  const receiverId = isReceiverSelected ? "OM0000000002" : "";
  const receiverName = isReceiverSelected ? "Demo Industrial Works Pvt Ltd" : "";
  const receiverPan = isReceiverSelected ? "ABCDE1234F" : "";
  const receiverGst = isReceiverSelected ? receiver.split(" / ")[2] || "33ABCDE1234F1Z5" : "";
  const localCurrency = "INR";

  // Sender Information
  const senderOptions = [
    "Select Sender",
    "Global BioPharma Ingredients Inc. / VM0000000018",
    "ABC Chemicals Ltd / VM0000000019",
    "HealthLogistics Pvt Ltd / VM0000000020",
    "EuroLab Compliance Services GmbH / VM0000000021"
  ];
  const [senderTaxReg, setSenderTaxReg] = useState("Select Sender");

  // Derived Sender Fields from selection
  const isSenderSelected = senderTaxReg !== "Select Sender" && senderTaxReg !== "";
  const senderParts = senderTaxReg.split(" / ");
  const senderName = isSenderSelected ? senderParts[0] : "";
  const senderId = isSenderSelected ? senderParts[1] || "VM0000000018" : "";
  const senderPan = isSenderSelected ? "—" : "";
  const senderGst = isSenderSelected ? "—" : "";
  const senderCurrency = "INR";

  // Document Information - Start blank / empty
  const [docType, setDocType] = useState("GoodsReceipt");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [orderType, setOrderType] = useState("Select Order Type");
  const [orderNumber, setOrderNumber] = useState("");
  
  // Collect original GRN/SRN records for dropdown list
  const existingGseoOptions = ["Select", ...receiptRows.map(r => r.id)];
  const [origGrnSrn, setOrigGrnSrn] = useState("Select");
  const [accountingDate, setAccountingDate] = useState("");
  const [modeDelivery, setModeDelivery] = useState("Select Mode");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Select Terms");
  const [remarks, setRemarks] = useState("");

  // Charges & Currency
  const [addlChargeType, setAddlChargeType] = useState("Select Charge Type");
  const [totalAddlCharge, setTotalAddlCharge] = useState("0.0");
  const [exchangeRate, setExchangeRate] = useState("1.0");
  const [createDate, setCreateDate] = useState(new Date().toISOString().split("T")[0]);

  // Section 2: Goods & Services Entries Item cards - Start blank
  const [lineItems, setLineItems] = useState<any[]>([
    {
      lineId: "1",
      itemId: "Select",
      itemName: "",
      orderDescription: "",
      forPrdFrom: "",
      forPrdTo: "",
      orderQty: "",
      balanceQty: "",
      invoiceQty: "",
      receivedQty: "",
      rejectedQty: "0",
      acceptedQty: "",
      orderRate: "",
      thisGrnSrnRate: "",
      orderValue: "0.0",
      addlCharge: "0.0",
      thisGrnSrnValue: "0.0",
      amtLclCurr: "0.0",
      amtTxnCurr: "0.0",
      costAllocMethod: "Weighted Average",
      sectionName: "",
      pctTds: ""
    }
  ]);
  const [expandedLines, setExpandedLines] = useState<string[]>(["1"]);

  // Section 3: Cost Allocation - Start blank
  const [costAllocRows, setCostAllocRows] = useState<any[]>([
    { id: "1", method: "Weighted Average", lob: "", param: "", val: "" }
  ]);

  // Section 4: Journal - Start blank
  const [journalEntries, setJournalEntries] = useState<any[]>([
    {
      docNumber: "AJ0226270000048",
      accountingDate: "",
      accountType: "",
      itemType: "",
      accountGroup: "",
      accountClass: "",
      misGrouping: "",
      ledgerName: "",
      subLedgerName: "",
      coaAccountCode: "",
      amtLclCurr: "",
      amtTxnCurr: ""
    }
  ]);
  const [expandedJournals, setExpandedJournals] = useState<string[]>(["AJ0226270000048"]);

  // Section 5: Workflow - Standard pending initialization
  const [workflow, setWorkflow] = useState<any[]>([
    { lob: "LOB-01", code: "ACT-01", name: "Quality Check & Verification", status: "Pending", dependency: "—", department: "Quality Assurance", dueDate: "", reason: "" },
    { lob: "LOB-01", code: "ACT-02", name: "Financial Reconciliation", status: "Pending", dependency: "ACT-01", department: "Finance & Accounts", dueDate: "", reason: "" },
    { lob: "LOB-02", code: "ACT-03", name: "Gate Entry Verification", status: "Pending", dependency: "—", department: "Logistics", dueDate: "", reason: "" }
  ]);
  const [rejectingCode, setRejectingCode] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleAddItem = () => {
    const nextId = String(lineItems.length + 1);
    const newLine = {
      lineId: nextId,
      itemId: "Select",
      itemName: "",
      orderDescription: "",
      forPrdFrom: "",
      forPrdTo: "",
      orderQty: "",
      balanceQty: "",
      invoiceQty: "",
      receivedQty: "",
      rejectedQty: "0",
      acceptedQty: "",
      orderRate: "",
      thisGrnSrnRate: "",
      orderValue: "0.0",
      addlCharge: "0.0",
      thisGrnSrnValue: "0.0",
      amtLclCurr: "0.0",
      amtTxnCurr: "0.0",
      costAllocMethod: "Weighted Average",
      sectionName: "",
      pctTds: ""
    };
    setLineItems(prev => [...prev, newLine]);
    setExpandedLines(prev => [...prev, nextId]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter(item => item.lineId !== id));
    setExpandedLines(prev => prev.filter(lineId => lineId !== id));
  };

  const toggleLineExpanded = (id: string) => {
    setExpandedLines(prev =>
      prev.includes(id) ? prev.filter(lineId => lineId !== id) : [...prev, id]
    );
  };

  const updateLineField = (lineId: string, field: string, value: string) => {
    setLineItems(prev =>
      prev.map(item => {
        if (item.lineId !== lineId) return item;
        const updated = { ...item, [field]: value };

        // Handle auto lookup when Item ID changes
        if (field === "itemId") {
          const matched = itemMasterList.find(m => m.id === value);
          if (matched) {
            updated.itemName = matched.name;
            updated.orderRate = String(matched.rate);
            updated.thisGrnSrnRate = String(matched.rate);
          }
        }

        // Calculate dynamic line values
        const qty = parseFloat(updated.orderQty) || 0;
        const rate = parseFloat(updated.thisGrnSrnRate) || 0;
        const addl = parseFloat(updated.addlCharge) || 0;
        const val = qty * rate + addl;

        updated.orderValue = String(qty * rate);
        updated.thisGrnSrnValue = String(val);
        updated.amtLclCurr = String(val);
        updated.amtTxnCurr = String(val);

        return updated;
      })
    );
  };

  // Cost Allocation handlers
  const handleAddCostAllocRow = () => {
    const nextId = String(costAllocRows.length + 1);
    setCostAllocRows(prev => [
      ...prev,
      { id: nextId, method: "Weighted Average", lob: "", param: "", val: "" }
    ]);
  };

  const handleRemoveCostAllocRow = (id: string) => {
    if (costAllocRows.length <= 1) return;
    setCostAllocRows(prev => prev.filter(r => r.id !== id));
  };

  const updateCostAllocField = (id: string, field: string, val: string) => {
    setCostAllocRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Journal handlers
  const handleAddJournal = () => {
    const nextNum = `AJ02262700000${48 + journalEntries.length}`;
    const newEntry = {
      docNumber: nextNum,
      accountingDate: "",
      accountType: "",
      itemType: "",
      accountGroup: "",
      accountClass: "",
      misGrouping: "",
      ledgerName: "",
      subLedgerName: "",
      coaAccountCode: "",
      amtLclCurr: "",
      amtTxnCurr: ""
    };
    setJournalEntries(prev => [...prev, newEntry]);
    setExpandedJournals(prev => [...prev, nextNum]);
  };

  const handleRemoveJournal = (docNum: string) => {
    if (journalEntries.length <= 1) return;
    setJournalEntries(prev => prev.filter(j => j.docNumber !== docNum));
    setExpandedJournals(prev => prev.filter(id => id !== docNum));
  };

  const toggleJournalExpanded = (docNum: string) => {
    setExpandedJournals(prev =>
      prev.includes(docNum) ? prev.filter(id => id !== docNum) : [...prev, docNum]
    );
  };

  const updateJournalField = (docNum: string, field: string, val: string) => {
    setJournalEntries(prev =>
      prev.map(j => (j.docNumber === docNum ? { ...j, [field]: val } : j))
    );
  };

  // Workflow actions
  const handleWorkflowApprove = (code: string) => {
    setWorkflow(prev =>
      prev.map(act => (act.code === code ? { ...act, status: "Approved", reason: "" } : act))
    );
  };

  const handleWorkflowReset = (code: string) => {
    setWorkflow(prev =>
      prev.map(act => (act.code === code ? { ...act, status: "Pending", reason: "" } : act))
    );
  };

  const handleWorkflowRejectClick = (code: string) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newGseoId = `GSEO2262700000${Math.floor(10 + Math.random() * 90)}`;
    const totalAmount = lineItems.reduce((acc, curr) => acc + (parseFloat(curr.thisGrnSrnValue) || 0), 0);

    const newReceiptRecord = {
      id: newGseoId,
      vendorName: senderName || "New Vendor",
      docType: docType,
      invoiceRef: invoiceRef || "GBI/NEW",
      invoiceDate: invoiceDate || createDate,
      items: lineItems.length,
      amount: `₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      status: "Active"
    };

    onCreate(newReceiptRecord);
    alert(`Receipt "${newGseoId}" created successfully.`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full w-full bg-background" style={{ background: "var(--background)" }}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-lg cursor-pointer"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>New Goods & Services Receipt</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: "#fbbf24" }}>
              <span className="rounded-full" style={{ width: 5, height: 5, background: "#fbbf24", display: "inline-block" }} />
              Draft
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer"
            style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer"
            style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none" }}
          >
            <Check size={13} /> Create Receipt
          </button>
        </div>
      </div>

      {/* Content Form Scroll View - Full Width */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 w-full">
        
        {/* Section 1: Goods & Services Entries Info */}
        <SectionCard title="Goods & Services Entries Info">
          <div className="flex flex-col gap-5">
            <div>
              <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em", marginBottom: 12 }}>RECEIVER INFORMATION</h4>
              <Grid3>
                <ELabelSelect label="Receiver (w) Tax Reg." value={receiver} onChange={setReceiver} options={receiverOptions} required />
                <ELabelInput label="Receiver ID" value={receiverId} disabled mono placeholder="Auto-populated on selection" />
                <ELabelInput label="Receiver Name" value={receiverName} disabled placeholder="Auto-populated on selection" />
                <ELabelInput label="Receiver PAN" value={receiverPan} disabled mono placeholder="Auto-populated on selection" />
                <ELabelInput label="Receiver GST Number" value={receiverGst} disabled mono placeholder="Auto-populated on selection" />
                <ELabelInput label="Local Currency" value={localCurrency} disabled />
              </Grid3>
            </div>

            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

            <div>
              <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em", marginBottom: 12 }}>SENDER INFORMATION</h4>
              <Grid3>
                <ELabelSelect label="Sender Name / Tax Reg." value={senderTaxReg} onChange={setSenderTaxReg} options={senderOptions} required />
                <ELabelInput label="Sender ID" value={senderId} disabled mono placeholder="Auto-populated on selection" />
                <ELabelInput label="Sender Name" value={senderName} disabled placeholder="Auto-populated on selection" />
                <ELabelInput label="Sender PAN" value={senderPan} disabled placeholder="Auto-populated on selection" />
                <ELabelInput label="Sender GST Number" value={senderGst} disabled placeholder="Auto-populated on selection" />
                <ELabelInput label="Currency" value={senderCurrency} disabled />
              </Grid3>
            </div>
          </div>
        </SectionCard>

        {/* Section 1b: Document Information */}
        <SectionCard title="Document Information">
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <ELabelSelect label="Document Type" value={docType} onChange={setDocType} options={["GoodsReceipt", "ServiceReceipt"]} required />
            <ELabelInput label="Invoice Ref" value={invoiceRef} onChange={setInvoiceRef} placeholder="e.g. GBI/CM5" required />
            <ELabelInput label="Invoice Date" value={invoiceDate} onChange={setInvoiceDate} type="date" required mono />
            <ELabelSelect label="Order Type" value={orderType} onChange={setOrderType} options={["Select Order Type", "Bill", "Purchase Order", "CapeXPurchase Order", "Internal Plan"]} required />
            <ELabelInput label="Order Number" value={orderNumber} onChange={setOrderNumber} placeholder="e.g. BE0000001336" required mono />
            <ELabelSelect label="Original GRN/SRN Number" value={origGrnSrn} onChange={setOrigGrnSrn} options={existingGseoOptions} />
            <ELabelInput label="Accounting Date" value={accountingDate} onChange={setAccountingDate} type="date" required mono />
            <ELabelSelect label="Mode of Delivery" value={modeDelivery} onChange={setModeDelivery} options={["Select Mode", "Offline", "Online"]} required />
            <ELabelInput label="Delivery Terms" value={deliveryTerms} onChange={setDeliveryTerms} placeholder="e.g. FOB Destination" />
            <ELabelSelect label="Payment Terms" value={paymentTerms} onChange={setPaymentTerms} options={["Select Terms", "Advance 50%", "Net 7", "Net 15", "Net 30", "Net 45", "Net 60", "Due End of Month"]} />
            <ELabelInput label="Remarks (For Internal Use)" value={remarks} onChange={setRemarks} placeholder="Enter internal comments..." />
          </div>
        </SectionCard>

        {/* Section 1c: Charges & Currency */}
        <SectionCard title="Charges & Currency">
          <div className="grid grid-cols-4 gap-x-8 gap-y-4">
            <ELabelSelect label="Addl Charge Type" value={addlChargeType} onChange={setAddlChargeType} options={["Select Charge Type", "Toll Charges", "Freight Charges", "Handling Charges", "Packaging Charges", "Customs Duty", "Service Charge", "Installation Charge", "Other Charges", "Environmental Charge", "Consulting fee", "Administrative Fee"]} />
            <ELabelInput label="Total Addl Charge" value={totalAddlCharge} onChange={setTotalAddlCharge} type="number" mono />
            <ELabelInput label="Exchange Rate" value={exchangeRate} onChange={setExchangeRate} type="number" mono />
            <ELabelInput label="Create Date" value={createDate} onChange={setCreateDate} type="date" mono />
          </div>
        </SectionCard>

        {/* Section 2: Goods & Services Entries Item */}
        <div className="flex flex-col gap-4 w-full" style={{ flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Goods & Services Entries Item</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
              style={{
                background: "var(--secondary)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                height: 32
              }}
            >
              <Plus size={13} /> Add Item
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {lineItems.map(item => {
              const isExpanded = expandedLines.includes(item.lineId);
              const itemSelectOptions = ["Select", ...itemMasterList.map(master => master.id)];
              return (
                <div
                  key={item.lineId}
                  className="rounded-xl overflow-hidden transition-all duration-200 w-full"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)"
                  }}
                >
                  {/* Card collapsed header bar */}
                  <div
                    className="w-full flex items-center justify-between px-5 py-3 cursor-pointer select-none transition-colors"
                    onClick={() => toggleLineExpanded(item.lineId)}
                    style={{ background: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
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
                        L{item.lineId.padStart(3, "0")}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.itemName || "Select Item to start"}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                          {item.itemId !== "Select" ? item.itemId : "No item selected"} · {item.orderDescription || "No description"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col items-end">
                        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>QTY</span>
                        <span style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>{item.orderQty || "—"}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>RATE</span>
                        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>₹{(parseFloat(item.thisGrnSrnRate) || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>VALUE</span>
                        <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>₹{(parseFloat(item.thisGrnSrnValue) || 0).toLocaleString("en-IN")}</span>
                      </div>
                      
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.lineId)}
                          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer text-slate-400"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      <span className="text-slate-400 cursor-pointer" onClick={() => toggleLineExpanded(item.lineId)}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* Card expanded inputs section */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                      
                      {/* Sub-Card 1: Item Identification */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ITEM SELECTION</h4>
                        <Grid3>
                          <ELabelSelect label="Item ID" value={item.itemId} onChange={val => updateLineField(item.lineId, "itemId", val)} options={itemSelectOptions} required />
                          <ELabelInput label="Item Name" value={item.itemName} onChange={val => updateLineField(item.lineId, "itemName", val)} placeholder="e.g. Omeprazole Enteric Coated Pellets" required />
                          <ELabelInput label="Order Description" value={item.orderDescription} onChange={val => updateLineField(item.lineId, "orderDescription", val)} placeholder="e.g. Omeprazole Pellets Supply" required />
                        </Grid3>
                      </div>

                      <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                      {/* Sub-Card 2: Period information */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PERIOD DATES</h4>
                        <Grid2>
                          <ELabelInput label="For Period From" value={item.forPrdFrom} onChange={val => updateLineField(item.lineId, "forPrdFrom", val)} type="date" required mono />
                          <ELabelInput label="For Period To" value={item.forPrdTo} onChange={val => updateLineField(item.lineId, "forPrdTo", val)} type="date" required mono />
                        </Grid2>
                      </div>

                      <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                      {/* Sub-Card 3: Quantities */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>QUANTITIES</h4>
                        <Grid3>
                          <ELabelInput label="Order Qty" value={item.orderQty} onChange={val => updateLineField(item.lineId, "orderQty", val)} type="number" placeholder="e.g. 95" required />
                          <ELabelInput label="Balance Qty" value={item.balanceQty} onChange={val => updateLineField(item.lineId, "balanceQty", val)} type="number" placeholder="e.g. 95" />
                          <ELabelInput label="Invoice Qty" value={item.invoiceQty} onChange={val => updateLineField(item.lineId, "invoiceQty", val)} type="number" placeholder="e.g. 95" required />
                          <ELabelInput label="Received Qty" value={item.receivedQty} onChange={val => updateLineField(item.lineId, "receivedQty", val)} type="number" placeholder="e.g. 95" />
                          <ELabelInput label="Rejected Qty" value={item.rejectedQty} onChange={val => updateLineField(item.lineId, "rejectedQty", val)} type="number" placeholder="e.g. 0" />
                          <ELabelInput label="Accepted Qty" value={item.acceptedQty} onChange={val => updateLineField(item.lineId, "acceptedQty", val)} type="number" placeholder="e.g. 95" />
                        </Grid3>
                      </div>

                      <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                      {/* Sub-Card 4: Pricing & derived values */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PRICING & VALUES</h4>
                        <Grid3>
                          <ELabelInput label="Order Rate" value={item.orderRate} onChange={val => updateLineField(item.lineId, "orderRate", val)} type="number" placeholder="e.g. 4200" required mono />
                          <ELabelInput label="This GRN/SRN Rate" value={item.thisGrnSrnRate} onChange={val => updateLineField(item.lineId, "thisGrnSrnRate", val)} type="number" placeholder="e.g. 4200" required mono />
                          <ELabelInput label="Order Value" value={item.orderValue} disabled mono />
                          <ELabelInput label="Additional Charge" value={item.addlCharge} onChange={val => updateLineField(item.lineId, "addlCharge", val)} type="number" placeholder="e.g. 0.0" mono />
                          <ELabelInput label="This GRN/SRN Value" value={item.thisGrnSrnValue} disabled mono />
                          <ELabelInput label="Amt in Lcl Curr" value={item.amtLclCurr} disabled mono />
                          <ELabelInput label="Amt in Txn Curr" value={item.amtTxnCurr} disabled mono />
                        </Grid3>
                      </div>

                      <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                      {/* Sub-Card 5: Taxes & Allocations */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TAXES & ALLOCATIONS</h4>
                        <Grid3>
                          <ELabelSelect label="Cost Allocation Method" value={item.costAllocMethod} onChange={val => updateLineField(item.lineId, "costAllocMethod", val)} options={["Weighted Average", "Direct LOB Costing", "LOB Allocation Ratio", "Equal Distribution"]} required />
                          <ELabelInput label="Section Name" value={item.sectionName} onChange={val => updateLineField(item.lineId, "sectionName", val)} placeholder="e.g. Sec A" />
                          <ELabelInput label="Percentage of TDS" value={item.pctTds} onChange={val => updateLineField(item.lineId, "pctTds", val)} placeholder="e.g. 2.0%" />
                        </Grid3>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Goods & Services Entries Cost Allocation */}
        <SectionCard 
          title="Goods & Services Entries Cost Allocation"
          rightAction={
            <button
              type="button"
              onClick={handleAddCostAllocRow}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
              style={{
                background: "var(--secondary)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                height: 28
              }}
            >
              <Plus size={12} /> Add Allocation
            </button>
          }
        >
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cost Allocation Method</th>
                  <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>LOB</th>
                  <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cost Allocation Parameter Value</th>
                  <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cost Allocated Lcl Curr</th>
                  <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {costAllocRows.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 16px", fontSize: 13, color: "var(--foreground)" }}>
                      <select
                        value={r.method}
                        onChange={e => updateCostAllocField(r.id, "method", e.target.value)}
                        style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: "100%", maxWidth: 200 }}
                      >
                        {["Weighted Average", "Direct LOB Costing", "LOB Allocation Ratio", "Equal Distribution"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "8px 16px", fontSize: 13, color: "var(--foreground)" }}>
                      <input
                        value={r.lob}
                        onChange={e => updateCostAllocField(r.id, "lob", e.target.value)}
                        placeholder="e.g. LOB-01"
                        style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 110 }}
                      />
                    </td>
                    <td style={{ padding: "8px 16px", fontSize: 13, color: "var(--foreground)" }}>
                      <input
                        value={r.param}
                        onChange={e => updateCostAllocField(r.id, "param", e.target.value)}
                        placeholder="e.g. Parameter A"
                        style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 160 }}
                      />
                    </td>
                    <td style={{ padding: "8px 16px", fontSize: 13, color: "var(--foreground)" }}>
                      <input
                        value={r.val}
                        onChange={e => updateCostAllocField(r.id, "val", e.target.value)}
                        placeholder="e.g. 399000.00"
                        style={{ height: 32, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--foreground)", width: 140, fontFamily: "var(--font-mono)" }}
                      />
                    </td>
                    <td style={{ padding: "8px 16px", textAlign: "right" }}>
                      {costAllocRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCostAllocRow(r.id)}
                          className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors text-slate-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Section 4: Goods & Services Entries Journal */}
        <div className="flex flex-col gap-4 w-full" style={{ flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
              Goods & Services Entries Journal ({journalEntries.length} Line Items)
            </h3>
            <button
              type="button"
              onClick={handleAddJournal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
              style={{
                background: "var(--secondary)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                height: 32
              }}
            >
              <Plus size={13} /> Add Journal Entry
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {journalEntries.map(entry => {
              const isExpanded = expandedJournals.includes(entry.docNumber);
              return (
                <div 
                  key={entry.docNumber} 
                  className="rounded-xl overflow-hidden transition-all duration-200 w-full" 
                  style={{ 
                    background: "var(--card)", 
                    border: "1px solid var(--border)"
                  }}
                >
                  {/* Collapsed Header Bar */}
                  <div 
                    className="w-full flex items-center justify-between px-5 py-3 cursor-pointer select-none transition-colors"
                    onClick={() => toggleJournalExpanded(entry.docNumber)}
                    style={{ background: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
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
                          {entry.accountClass || "New Entry"} {entry.accountingDate ? `· ${entry.accountingDate}` : ""}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col items-end">
                        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>GROUP</span>
                        <span style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>{entry.accountGroup || "—"}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>LOCAL AMT</span>
                        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>₹{(parseFloat(entry.amtLclCurr) || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>TXN AMT</span>
                        <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>₹{(parseFloat(entry.amtTxnCurr) || 0).toLocaleString("en-IN")}</span>
                      </div>

                      {journalEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveJournal(entry.docNumber)}
                          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer text-slate-400"
                          title="Remove journal entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      <span className="text-slate-400 cursor-pointer" onClick={() => toggleJournalExpanded(entry.docNumber)}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content Section */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                      
                      {/* Section 1: Document & Date Details */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DOCUMENT & DATE</h4>
                        <Grid2>
                          <ELabelInput label="AccDoc Number" value={entry.docNumber} onChange={val => updateJournalField(entry.docNumber, "docNumber", val)} mono required />
                          <ELabelInput label="Accounting Date" value={entry.accountingDate} onChange={val => updateJournalField(entry.docNumber, "accountingDate", val)} type="date" mono required />
                        </Grid2>
                      </div>

                      <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                      {/* Section 2: Account Classification */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT CLASSIFICATION</h4>
                        <Grid3>
                          <ELabelInput label="Account Type" value={entry.accountType} onChange={val => updateJournalField(entry.docNumber, "accountType", val)} placeholder="e.g. InventoryAc" required />
                          <ELabelInput label="Item Type" value={entry.itemType} onChange={val => updateJournalField(entry.docNumber, "itemType", val)} placeholder="e.g. Inventory" required />
                          <ELabelInput label="Account Group" value={entry.accountGroup} onChange={val => updateJournalField(entry.docNumber, "accountGroup", val)} placeholder="e.g. Raw Materials" required />
                          <ELabelInput label="Account Class" value={entry.accountClass} onChange={val => updateJournalField(entry.docNumber, "accountClass", val)} placeholder="e.g. Omeprazole Enteric Coated Pellets" required />
                          <ELabelInput label="MIS Grouping" value={entry.misGrouping} onChange={val => updateJournalField(entry.docNumber, "misGrouping", val)} placeholder="e.g. Operational Asset" />
                        </Grid3>
                      </div>

                      <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                      {/* Section 3: Ledger Details */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>LEDGER DETAILS</h4>
                        <Grid3>
                          <ELabelInput label="Ledger Name" value={entry.ledgerName} onChange={val => updateJournalField(entry.docNumber, "ledgerName", val)} placeholder="e.g. Omeprazole Pellets Inventory" required />
                          <ELabelInput label="SubLedger Name" value={entry.subLedgerName} onChange={val => updateJournalField(entry.docNumber, "subLedgerName", val)} placeholder="e.g. —" />
                          <ELabelInput label="COA Account Code" value={entry.coaAccountCode} onChange={val => updateJournalField(entry.docNumber, "coaAccountCode", val)} placeholder="e.g. 310106" mono required />
                        </Grid3>
                      </div>

                      <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                      {/* Section 4: Monetary Information */}
                      <div className="flex flex-col gap-2">
                        <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>MONETARY VALUES</h4>
                        <Grid2>
                          <ELabelInput label="Amt in Lcl Curr" value={entry.amtLclCurr} onChange={val => updateJournalField(entry.docNumber, "amtLclCurr", val)} type="number" placeholder="e.g. 0.0" mono required />
                          <ELabelInput label="Amt in Txn Curr" value={entry.amtTxnCurr} onChange={val => updateJournalField(entry.docNumber, "amtTxnCurr", val)} type="number" placeholder="e.g. 0.0" mono required />
                        </Grid2>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Goods & Services Entries Work Flow */}
        <SectionCard title="Goods & Services Entries Work Flow">
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
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>{act.lob}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{act.code}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>{act.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                        style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[act.status] || "#fbbf24" }}>
                        <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[act.status] || "#fbbf24", display: "inline-block" }} />
                        {act.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted-foreground)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={act.reason}>
                      {act.reason || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted-foreground)" }}>{act.dependency}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)" }}>{act.department}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{act.dueDate || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button"
                          onClick={() => handleWorkflowReset(act.code)}
                          style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 500 }}
                        >
                          Reset
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleWorkflowApprove(act.code)}
                          style={{ background: "rgba(74,222,128,0.12)", color: "#10b981", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                        >
                          Approve
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleWorkflowRejectClick(act.code)}
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
                type="button"
                onClick={() => setRejectingCode(null)}
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500 }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmReject}
                style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                Reject Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
