import { useState, useEffect } from "react";
import { X, Edit3, Check, Lock, AlertCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { AIBillScanner, type ScannedBillData } from "../AIBillScanner";
import { useActivity } from "../../contexts";

const tabs = [
  "Bill Information",
  "Vendor Information",
  "Invoice",
  "Billing Summary",
  "Matching",
  "Cost Allocation",
  "Journals",
  "Workflow"
];

const statusColor: Record<string, string> = {
  Received: "#6b8cff",
  "In Progress": "#fbbf24",
  Validated: "#4ade80",
  Rejected: "#f87171",
  Draft: "#888896",
  Reset: "#6b8cff",
  Approve: "#4ade80",
  Reject: "#f87171"
};

function ViewField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 13, color: value ? "var(--foreground)" : "var(--muted-foreground)", fontFamily: mono ? "var(--font-mono)" : undefined, lineHeight: 1.5 }}>{value || "—"}</span>
    </div>
  );
}

function FullWidthField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 col-span-full">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 13, color: value ? "var(--foreground)" : "var(--muted-foreground)", lineHeight: 1.5 }}>{value || "—"}</span>
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
              <X size={11} /> Cancel
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

function TabPlaceholder({ tabName }: { tabName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)", maxWidth: 900 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{tabName}</p>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>This section will be fully implemented in a subsequent phase.</p>
    </div>
  );
}

interface BillData {
  // Card 1 – Organization Information
  organizationName: string;
  organizationId: string;
  interimId: string;
  billNumber: string;
  status: string;
  uploadMode: string;
  messageId: string;
  objectId: string;

  // Vendor Information
  vendorId: string;
  vendorName: string;
  vendorNameAsPerMaster: string;
  vendorPan: string;
  vendorGstNumber: string;
  vendorStateCode: string;
  currency: string;
  taxCategory: string;

  // Invoice – Card 1: General Information
  invoiceReference: string;
  originalInvoiceReference: string;
  documentType: string;
  invoiceDate: string;
  accountingDate: string;
  dueDate: string;

  // Invoice – Card 2: Tax Information
  pan: string;
  gstNumber: string;
  billingStateCode: string;
  localCurrency: string;

  // Invoice – Card 3: Financial Summary
  totalInvoiceBaseValue: string;
  totalInvoiceTaxValue: string;
  totalInvoiceGrossValue: string;
  additionalChargeType: string;
  totalAdditionalCharge: string;
  roundOffValue: string;
  exchangeRate: string;

  // Invoice – Card 4: Shipping Information
  shipTo: string;

  // Invoice – Card 5: Payment Details
  bankName: string;
  branchName: string;
  ifscCode: string;
  accountNumber: string;
  accountHolderName: string;
  micrCode: string;
  swiftCode: string;
  bic: string;
  beneficiary: string;
  ibanGbp: string;

  poReference: string;
}

function makeEmpty(): BillData {
  return {
    organizationName: "", organizationId: "", interimId: "", billNumber: "", status: "Received", uploadMode: "API", messageId: "", objectId: "",
    vendorId: "", vendorName: "", vendorNameAsPerMaster: "", vendorPan: "", vendorGstNumber: "", vendorStateCode: "", currency: "USD", taxCategory: "",
    invoiceReference: "", originalInvoiceReference: "", documentType: "Standard Invoice", invoiceDate: "", accountingDate: "", dueDate: "",
    pan: "", gstNumber: "", billingStateCode: "", localCurrency: "USD",
    totalInvoiceBaseValue: "", totalInvoiceTaxValue: "", totalInvoiceGrossValue: "", additionalChargeType: "", totalAdditionalCharge: "", roundOffValue: "", exchangeRate: "1.00",
    shipTo: "",
    bankName: "", branchName: "", ifscCode: "", accountNumber: "", accountHolderName: "", micrCode: "", swiftCode: "", bic: "", beneficiary: "", ibanGbp: "",
    poReference: ""
  };
}

function makeBill(id: string, status = "Validated"): BillData {
  const index = parseInt(id.replace(/[^0-9]/g, "")) || 1;
  const interimId = `INT-2026-${String(index).padStart(3, "0")}`;
  const vendorIds = ["VND-001", "VND-002", "VND-003", "VND-004", "VND-005", "VND-006", "VND-007", "VND-008", "VND-009", "VND-010", "VND-011", "VND-012", "VND-003"];
  const vendorNames = [
    "TechSupply Co", "OfficeMax Pro", "CloudNet Solutions", "Green Facilities", "SafeLogistics", 
    "PrintHouse Ltd", "OfficeMax Pro", "PrintHouse Ltd", "MediaBridge", "SwiftCargo", 
    "NextLevel IT", "FoodFirst Corp", "CloudNet Solutions"
  ];
  
  const vId = vendorIds[index - 1] || "VND-001";
  const vName = vendorNames[index - 1] || "TechSupply Co";

  return {
    organizationName: "DataTwin Enterprise Solutions Ltd",
    organizationId: "ORG-DT-091",
    interimId: interimId,
    billNumber: id,
    status: status,
    uploadMode: "Email Attachment",
    messageId: `MSG-${100000 + index}-DT`,
    objectId: `OBJ-${500000 + index}-RECON`,

    vendorId: vId,
    vendorName: vName,
    vendorNameAsPerMaster: vName + " Pvt Ltd",
    vendorPan: "AABCT" + (1300 + index) + "L",
    vendorGstNumber: "33AABCT" + (1300 + index) + "L1ZC",
    vendorStateCode: "TN (33)",
    currency: "INR",
    taxCategory: "Regular Compliance",

    invoiceReference: `REF-${2026}-${1000 + index}`,
    originalInvoiceReference: `ORIG-${2026}-${1000 + index}`,
    documentType: "Commercial Invoice",
    invoiceDate: "Jun 01, 2026",
    accountingDate: "Jun 02, 2026",
    dueDate: "Jun 30, 2026",

    pan: "AAACD4492K",
    gstNumber: "27AAACD4492K1Z5",
    billingStateCode: "MH (27)",
    localCurrency: "INR",

    totalInvoiceBaseValue: "949500.00",
    totalInvoiceTaxValue: "170910.00",
    totalInvoiceGrossValue: "1120410.00",
    additionalChargeType: "Freight Charges",
    totalAdditionalCharge: "5000.00",
    roundOffValue: "0.00",
    exchangeRate: "1.00",

    shipTo: "DataTwin Warehousing Unit 4, Navi Mumbai, Maharashtra, 400705",

    bankName: "HDFC Bank Ltd",
    branchName: "Kanjurmarg East Branch",
    ifscCode: "HDFC0000492",
    accountNumber: "50100482938492",
    accountHolderName: vName + " Pvt Ltd",
    micrCode: "400240092",
    swiftCode: "HDFCINBBXXX",
    bic: "HDFCINBB",
    beneficiary: vName,
    ibanGbp: "GB82HDFC00004925010048",
    poReference: "PO-2026-001"
  };
}

interface BillingLineItem {
  lineId: string;
  orderId: string;
  reference: string;
  itemReference: string;
  itemId: string;
  itemName: string;
  resourceName: string;
  orderType: string;
  hsnSac: string;
  forPeriodFrom: string;
  forPeriodTo: string;
  quantity: number;
  rate: number;
  baseValue: number;
  discountAmount: number;
  additionalCharge: number;
  additionalCharge1: number;
  totalValue: number;
  taxCode: string;
  cgstPercentage: number;
  cgst: number;
  sgstPercentage: number;
  sgst: number;
  igstPercentage: number;
  igst: number;
  taxPercentage: number;
  taxValue: number;
  accountType: string;
  costAllocationMethod: string;
  department: string;
  sectionName: string;
  ledgerCategory: string;
  percentageOfTds: number;
}

const mockBillingLines: BillingLineItem[] = [
  {
    lineId: "L001",
    orderId: "PO-2026-001",
    reference: "REF-MS-928",
    itemReference: "ITEM-REF-MS-365",
    itemId: "MS-365-E5",
    itemName: "Microsoft 365 E5 License Renewal",
    resourceName: "Microsoft Cloud Services",
    orderType: "SaaS Subscription",
    hsnSac: "997331",
    forPeriodFrom: "Jun 01, 2026",
    forPeriodTo: "May 31, 2027",
    quantity: 120,
    rate: 2800,
    baseValue: 336000,
    discountAmount: 16800,
    additionalCharge: 0,
    additionalCharge1: 0,
    totalValue: 319200,
    taxCode: "GST-18",
    cgstPercentage: 9,
    cgst: 28728,
    sgstPercentage: 9,
    sgst: 28728,
    igstPercentage: 0,
    igst: 0,
    taxPercentage: 18,
    taxValue: 57456,
    accountType: "Operational Expense",
    costAllocationMethod: "Direct LOB Costing",
    department: "Information Technology",
    sectionName: "Software Subscriptions",
    ledgerCategory: "Software & SaaS Licenses",
    percentageOfTds: 10
  },
  {
    lineId: "L002",
    orderId: "PO-2026-001",
    reference: "REF-AWS-839",
    itemReference: "ITEM-REF-AWS-EC2",
    itemId: "AWS-EC2-OPS",
    itemName: "AWS EC2 Compute Infrastructure",
    resourceName: "Amazon Web Services",
    orderType: "Cloud Hosting",
    hsnSac: "998315",
    forPeriodFrom: "Jun 01, 2026",
    forPeriodTo: "Jun 30, 2026",
    quantity: 1,
    rate: 185000,
    baseValue: 185000,
    discountAmount: 9250,
    additionalCharge: 1500,
    additionalCharge1: 0,
    totalValue: 177250,
    taxCode: "GST-18",
    cgstPercentage: 0,
    cgst: 0,
    sgstPercentage: 0,
    sgst: 0,
    igstPercentage: 18,
    igst: 31905,
    taxPercentage: 18,
    taxValue: 31905,
    accountType: "Operational Expense",
    costAllocationMethod: "Usage-Based Allocation",
    department: "Cloud Engineering",
    sectionName: "Hosting & Infrastructure",
    ledgerCategory: "Cloud Compute Costs",
    percentageOfTds: 2
  },
  {
    lineId: "L003",
    orderId: "PO-2026-002",
    reference: "REF-AZ-112",
    itemReference: "ITEM-REF-AZ-SQL",
    itemId: "AZ-SQL-DB",
    itemName: "Azure SQL Managed Databases",
    resourceName: "Microsoft Cloud Services",
    orderType: "Cloud Hosting",
    hsnSac: "998315",
    forPeriodFrom: "Jun 01, 2026",
    forPeriodTo: "Jun 30, 2026",
    quantity: 2,
    rate: 45000,
    baseValue: 90000,
    discountAmount: 0,
    additionalCharge: 0,
    additionalCharge1: 0,
    totalValue: 90000,
    taxCode: "GST-18",
    cgstPercentage: 9,
    cgst: 8100,
    sgstPercentage: 9,
    sgst: 8100,
    igstPercentage: 0,
    igst: 0,
    taxPercentage: 18,
    taxValue: 16200,
    accountType: "Operational Expense",
    costAllocationMethod: "Direct LOB Costing",
    department: "Business Intelligence",
    sectionName: "Data Infrastructure",
    ledgerCategory: "Cloud Compute Costs",
    percentageOfTds: 2
  },
  {
    lineId: "L004",
    orderId: "PO-2026-002",
    reference: "REF-SAP-901",
    itemReference: "ITEM-REF-SAP-MNT",
    itemId: "SAP-ERP-MAIN",
    itemName: "SAP ERP Enterprise Maintenance & Support",
    resourceName: "SAP SE",
    orderType: "Annual Maintenance",
    hsnSac: "998715",
    forPeriodFrom: "Jun 01, 2026",
    forPeriodTo: "May 31, 2027",
    quantity: 1,
    rate: 220000,
    baseValue: 220000,
    discountAmount: 22000,
    additionalCharge: 0,
    additionalCharge1: 0,
    totalValue: 198000,
    taxCode: "GST-18",
    cgstPercentage: 9,
    cgst: 17820,
    sgstPercentage: 9,
    sgst: 17820,
    igstPercentage: 0,
    igst: 0,
    taxPercentage: 18,
    taxValue: 35640,
    accountType: "Operational Expense",
    costAllocationMethod: "Shared Service Allocation",
    department: "Finance & Accounts",
    sectionName: "Enterprise Applications",
    ledgerCategory: "Application Support",
    percentageOfTds: 10
  },
  {
    lineId: "L005",
    orderId: "PO-2026-003",
    reference: "REF-ORA-241",
    itemReference: "ITEM-REF-ORA-DB",
    itemId: "ORA-DB-PRO",
    itemName: "Oracle Database Support Services",
    resourceName: "Oracle Corporation",
    orderType: "Annual Support",
    hsnSac: "998715",
    forPeriodFrom: "Jun 01, 2026",
    forPeriodTo: "May 31, 2027",
    quantity: 1,
    rate: 115000,
    baseValue: 115000,
    discountAmount: 0,
    additionalCharge: 0,
    additionalCharge1: 0,
    totalValue: 115000,
    taxCode: "GST-18",
    cgstPercentage: 0,
    cgst: 0,
    sgstPercentage: 0,
    sgst: 0,
    igstPercentage: 18,
    igst: 20700,
    taxPercentage: 18,
    taxValue: 20700,
    accountType: "Operational Expense",
    costAllocationMethod: "Shared Service Allocation",
    department: "Data Operations",
    sectionName: "Enterprise Applications",
    ledgerCategory: "Application Support",
    percentageOfTds: 10
  },
  {
    lineId: "L006",
    orderId: "PO-2026-003",
    reference: "REF-CON-992",
    itemReference: "ITEM-REF-CON-SRV",
    itemId: "CON-FIN-ADVISORY",
    itemName: "Professional Consulting - Financial Advisory",
    resourceName: "McKinsey & Co",
    orderType: "Consulting Service",
    hsnSac: "998216",
    forPeriodFrom: "Jun 01, 2026",
    forPeriodTo: "Jun 15, 2026",
    quantity: 40,
    rate: 12000,
    baseValue: 480000,
    discountAmount: 24000,
    additionalCharge: 0,
    additionalCharge1: 0,
    totalValue: 456000,
    taxCode: "GST-18",
    cgstPercentage: 9,
    cgst: 41040,
    sgstPercentage: 9,
    sgst: 41040,
    igstPercentage: 0,
    igst: 0,
    taxPercentage: 18,
    taxValue: 82080,
    accountType: "Operational Expense",
    costAllocationMethod: "Direct LOB Costing",
    department: "Corporate Advisory",
    sectionName: "Advisory Services",
    ledgerCategory: "Professional & Legal Fees",
    percentageOfTds: 10
  },
  {
    lineId: "L007",
    orderId: "PO-2026-004",
    reference: "REF-HW-003",
    itemReference: "ITEM-REF-HW-LAP",
    itemId: "HW-DELL-L5540",
    itemName: "Dell Latitude 5540 Enterprise Laptops",
    resourceName: "Dell Technologies",
    orderType: "Hardware Procurement",
    hsnSac: "847130",
    forPeriodFrom: "Jun 01, 2026",
    forPeriodTo: "Jun 01, 2026",
    quantity: 10,
    rate: 85000,
    baseValue: 850000,
    discountAmount: 42500,
    additionalCharge: 8000,
    additionalCharge1: 0,
    totalValue: 815500,
    taxCode: "GST-18",
    cgstPercentage: 9,
    cgst: 73395,
    sgstPercentage: 9,
    sgst: 73395,
    igstPercentage: 0,
    igst: 0,
    taxPercentage: 18,
    taxValue: 146790,
    accountType: "Capital Asset",
    costAllocationMethod: "Asset Capitalization",
    department: "Information Technology",
    sectionName: "IT Hardware",
    ledgerCategory: "Office Equipment & Computers",
    percentageOfTds: 2
  },
  {
    lineId: "L008",
    orderId: "PO-2026-004",
    reference: "REF-NET-482",
    itemReference: "ITEM-REF-NET-SWT",
    itemId: "CISC-9300-24T",
    itemName: "Cisco Catalyst 9300 24-Port Network Switch",
    resourceName: "Cisco Systems",
    orderType: "Hardware Procurement",
    hsnSac: "851762",
    forPeriodFrom: "Jun 01, 2026",
    forPeriodTo: "Jun 01, 2026",
    quantity: 2,
    rate: 145000,
    baseValue: 290000,
    discountAmount: 14500,
    additionalCharge: 3500,
    additionalCharge1: 0,
    totalValue: 279000,
    taxCode: "GST-18",
    cgstPercentage: 0,
    cgst: 0,
    sgstPercentage: 0,
    sgst: 0,
    igstPercentage: 18,
    igst: 50220,
    taxPercentage: 18,
    taxValue: 50220,
    accountType: "Capital Asset",
    costAllocationMethod: "Asset Capitalization",
    department: "Network Operations",
    sectionName: "IT Hardware",
    ledgerCategory: "Office Equipment & Computers",
    percentageOfTds: 2
  }
];

interface MatchingRecord {
  poIpNumber: string;
  itemId: string;
  field: string;
  balanceInPoIp: string;
  referencePoint: string;
  bill: string;
  difference: string;
}

const mockMatchingRecords: MatchingRecord[] = [
  {
    poIpNumber: "PO-2026-001",
    itemId: "MS-365-E5",
    field: "Quantity",
    balanceInPoIp: "120 Units",
    referencePoint: "Good Receipt Note #GRN-392",
    bill: "120 Units",
    difference: "0 Units"
  },
  {
    poIpNumber: "PO-2026-001",
    itemId: "AWS-EC2-OPS",
    field: "Base Value",
    balanceInPoIp: "₹1,85,000.00",
    referencePoint: "Vendor Statement #VS-928",
    bill: "₹1,85,000.00",
    difference: "₹0.00"
  },
  {
    poIpNumber: "PO-2026-002",
    itemId: "AZ-SQL-DB",
    field: "Base Value",
    balanceInPoIp: "₹90,000.00",
    referencePoint: "Database Usage Sheet #DB-392",
    bill: "₹90,000.00",
    difference: "₹0.00"
  },
  {
    poIpNumber: "PO-2026-002",
    itemId: "SAP-ERP-MAIN",
    field: "Tax Code",
    balanceInPoIp: "GST-18",
    referencePoint: "Master Tax Registry",
    bill: "GST-18",
    difference: "None"
  },
  {
    poIpNumber: "PO-2026-003",
    itemId: "ORA-DB-PRO",
    field: "Quantity",
    balanceInPoIp: "1 Year",
    referencePoint: "Support Contract SLA #SLA-ORA",
    bill: "1 Year",
    difference: "0"
  },
  {
    poIpNumber: "PO-2026-003",
    itemId: "CON-FIN-ADVISORY",
    field: "Base Value",
    balanceInPoIp: "₹4,80,000.00",
    referencePoint: "Timesheet Sheet #TS-MACK-2026",
    bill: "₹4,80,000.00",
    difference: "₹0.00"
  },
  {
    poIpNumber: "PO-2026-004",
    itemId: "HW-DELL-L5540",
    field: "Quantity",
    balanceInPoIp: "10 Units",
    referencePoint: "Gate Entry #GE-2921",
    bill: "10 Units",
    difference: "0 Units"
  },
  {
    poIpNumber: "PO-2026-004",
    itemId: "CISC-9300-24T",
    field: "Base Value",
    balanceInPoIp: "₹2,90,000.00",
    referencePoint: "Purchase Order Schedule #PO-SCH-4",
    bill: "₹2,90,000.00",
    difference: "₹0.00"
  }
];

interface BillCostAllocation {
  id: string;
  costAllocationMethod: string;
  lob: string;
  costAllocationParameterValue: string;
  costAllocatedLcl: string;
  poIpNumber: string;
  fromDate: string;
  toDate: string;
}

const mockBillCostAllocations: BillCostAllocation[] = [
  {
    id: "BCA-001",
    costAllocationMethod: "Direct LOB Costing",
    lob: "Information Technology",
    costAllocationParameterValue: "User Count Basis (120 Users)",
    costAllocatedLcl: "₹3,19,200.00",
    poIpNumber: "PO-2026-001",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    id: "BCA-002",
    costAllocationMethod: "Usage-Based Allocation",
    lob: "Cloud Engineering",
    costAllocationParameterValue: "EC2 Consumption Hours",
    costAllocatedLcl: "₹1,77,250.00",
    poIpNumber: "PO-2026-001",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026"
  },
  {
    id: "BCA-003",
    costAllocationMethod: "Direct LOB Costing",
    lob: "Business Intelligence",
    costAllocationParameterValue: "Database Instance Count (2)",
    costAllocatedLcl: "₹90,000.00",
    poIpNumber: "PO-2026-002",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026"
  },
  {
    id: "BCA-004",
    costAllocationMethod: "Shared Service Allocation",
    lob: "Finance & Accounts",
    costAllocationParameterValue: "Revenue Contribution Ratio",
    costAllocatedLcl: "₹1,98,000.00",
    poIpNumber: "PO-2026-002",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    id: "BCA-005",
    costAllocationMethod: "Shared Service Allocation",
    lob: "Data Operations",
    costAllocationParameterValue: "Revenue Contribution Ratio",
    costAllocatedLcl: "₹1,15,000.00",
    poIpNumber: "PO-2026-003",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    id: "BCA-006",
    costAllocationMethod: "Direct LOB Costing",
    lob: "Corporate Advisory",
    costAllocationParameterValue: "Project Consulting Hours",
    costAllocatedLcl: "₹4,56,000.00",
    poIpNumber: "PO-2026-003",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 15, 2026"
  },
  {
    id: "BCA-007",
    costAllocationMethod: "Asset Capitalization",
    lob: "Information Technology",
    costAllocationParameterValue: "Hardware Tagging System",
    costAllocatedLcl: "₹8,15,500.00",
    poIpNumber: "PO-2026-004",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026"
  },
  {
    id: "BCA-008",
    costAllocationMethod: "Asset Capitalization",
    lob: "Network Operations",
    costAllocationParameterValue: "Hardware Tagging System",
    costAllocatedLcl: "₹2,79,000.00",
    poIpNumber: "PO-2026-004",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026"
  }
];

interface ProvisionReversalCostAllocation {
  id: string;
  reversalCostAllocationMethod: string;
  reversalLob: string;
  reversalCostAllocationParameterValue: string;
  reversalCostAllocatedLcl: string;
  poIpNumber: string;
  fromDate: string;
  toDate: string;
}

const mockProvisionReversals: ProvisionReversalCostAllocation[] = [
  {
    id: "PRC-001",
    reversalCostAllocationMethod: "Direct LOB Reversal",
    reversalLob: "Information Technology",
    reversalCostAllocationParameterValue: "Reversed Accrual P05",
    reversalCostAllocatedLcl: "₹3,19,200.00",
    poIpNumber: "PO-2026-001",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    id: "PRC-002",
    reversalCostAllocationMethod: "Usage-Based Reversal",
    reversalLob: "Cloud Engineering",
    reversalCostAllocationParameterValue: "Reversed Accrual P05",
    reversalCostAllocatedLcl: "₹1,77,250.00",
    poIpNumber: "PO-2026-001",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026"
  },
  {
    id: "PRC-003",
    reversalCostAllocationMethod: "Direct LOB Reversal",
    reversalLob: "Business Intelligence",
    reversalCostAllocationParameterValue: "Reversed Accrual P05",
    reversalCostAllocatedLcl: "₹90,000.00",
    poIpNumber: "PO-2026-002",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026"
  },
  {
    id: "PRC-004",
    reversalCostAllocationMethod: "Shared Service Reversal",
    reversalLob: "Finance & Accounts",
    reversalCostAllocationParameterValue: "Reversed Accrual P05",
    reversalCostAllocatedLcl: "₹1,98,000.00",
    poIpNumber: "PO-2026-002",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    id: "PRC-005",
    reversalCostAllocationMethod: "Shared Service Reversal",
    reversalLob: "Data Operations",
    reversalCostAllocationParameterValue: "Reversed Accrual P05",
    reversalCostAllocatedLcl: "₹1,15,000.00",
    poIpNumber: "PO-2026-003",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    id: "PRC-006",
    reversalCostAllocationMethod: "Direct LOB Reversal",
    reversalLob: "Corporate Advisory",
    reversalCostAllocationParameterValue: "Reversed Accrual P05",
    reversalCostAllocatedLcl: "₹4,56,000.00",
    poIpNumber: "PO-2026-003",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 15, 2026"
  },
  {
    id: "PRC-007",
    reversalCostAllocationMethod: "Asset Capitalization Reversal",
    reversalLob: "Information Technology",
    reversalCostAllocationParameterValue: "Reversed Accrual P05",
    reversalCostAllocatedLcl: "₹8,15,500.00",
    poIpNumber: "PO-2026-004",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026"
  },
  {
    id: "PRC-008",
    reversalCostAllocationMethod: "Asset Capitalization Reversal",
    reversalLob: "Network Operations",
    reversalCostAllocationParameterValue: "Reversed Accrual P05",
    reversalCostAllocatedLcl: "₹2,79,000.00",
    poIpNumber: "PO-2026-004",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026"
  }
];

interface ExpensesJournalRecord {
  docNumber: string;
  docDate: string;
  accountType: string;
  itemType: string;
  accountGroup: string;
  accountClass: string;
  misGrouping: string;
  ledgerName: string;
  subLedgerName: string;
  coa: string;
  accountCode: string;
  amountLcl: string;
  amountTxn: string;
  poIpNumber: string;
  itemId: string;
  fromDate: string;
  toDate: string;
}

const mockExpensesJournals: ExpensesJournalRecord[] = [
  {
    docNumber: "JV-2026-0001",
    docDate: "Jun 01, 2026",
    accountType: "Expense Account",
    itemType: "SaaS License Expense",
    accountGroup: "Indirect Expenses",
    accountClass: "Software Subscriptions",
    misGrouping: "Technology Costs",
    ledgerName: "General Ledger India",
    subLedgerName: "SaaS Sub Ledger",
    coa: "Global COA v2.1",
    accountCode: "GL-48201",
    amountLcl: "₹3,19,200.00",
    amountTxn: "₹3,19,200.00",
    poIpNumber: "PO-2026-001",
    itemId: "MS-365-E5",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    docNumber: "JV-2026-0002",
    docDate: "Jun 01, 2026",
    accountType: "Expense Account",
    itemType: "Hosting Infrastructure Expense",
    accountGroup: "Operating Expenses",
    accountClass: "Hosting Services",
    misGrouping: "Infrastructure Costs",
    ledgerName: "General Ledger US",
    subLedgerName: "Cloud Infrastructure Sub Ledger",
    coa: "Global COA v2.1",
    accountCode: "GL-48305",
    amountLcl: "₹1,77,250.00",
    amountTxn: "₹1,77,250.00",
    poIpNumber: "PO-2026-001",
    itemId: "AWS-EC2-OPS",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026"
  },
  {
    docNumber: "JV-2026-0003",
    docDate: "Jun 01, 2026",
    accountType: "Expense Account",
    itemType: "Database Infrastructure Expense",
    accountGroup: "Operating Expenses",
    accountClass: "Hosting Services",
    misGrouping: "Infrastructure Costs",
    ledgerName: "General Ledger US",
    subLedgerName: "Cloud Infrastructure Sub Ledger",
    coa: "Global COA v2.1",
    accountCode: "GL-48305",
    amountLcl: "₹90,000.00",
    amountTxn: "₹90,000.00",
    poIpNumber: "PO-2026-002",
    itemId: "AZ-SQL-DB",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026"
  },
  {
    docNumber: "JV-2026-0004",
    docDate: "Jun 01, 2026",
    accountType: "Expense Account",
    itemType: "ERP Maintenance Support",
    accountGroup: "Indirect Expenses",
    accountClass: "Application Maintenance Support",
    misGrouping: "Technology Costs",
    ledgerName: "General Ledger India",
    subLedgerName: "ERP Support Sub Ledger",
    coa: "Global COA v2.1",
    accountCode: "GL-48202",
    amountLcl: "₹1,98,000.00",
    amountTxn: "₹1,98,000.00",
    poIpNumber: "PO-2026-002",
    itemId: "SAP-ERP-MAIN",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    docNumber: "JV-2026-0005",
    docDate: "Jun 01, 2026",
    accountType: "Expense Account",
    itemType: "Database Support Services",
    accountGroup: "Indirect Expenses",
    accountClass: "Application Maintenance Support",
    misGrouping: "Technology Costs",
    ledgerName: "General Ledger India",
    subLedgerName: "Database Support Sub Ledger",
    coa: "Global COA v2.1",
    accountCode: "GL-48202",
    amountLcl: "₹1,15,000.00",
    amountTxn: "₹1,15,000.00",
    poIpNumber: "PO-2026-003",
    itemId: "ORA-DB-PRO",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    docNumber: "JV-2026-0006",
    docDate: "Jun 01, 2026",
    accountType: "Expense Account",
    itemType: "Professional Consulting Advisory",
    accountGroup: "Professional Expenses",
    accountClass: "Consulting & Legal Fees",
    misGrouping: "Professional Services",
    ledgerName: "General Ledger India",
    subLedgerName: "Consulting Services Sub Ledger",
    coa: "Global COA v2.1",
    accountCode: "GL-48501",
    amountLcl: "₹4,56,000.00",
    amountTxn: "₹4,56,000.00",
    poIpNumber: "PO-2026-003",
    itemId: "CON-FIN-ADVISORY",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 15, 2026"
  },
  {
    docNumber: "JV-2026-0007",
    docDate: "Jun 01, 2026",
    accountType: "Capital Asset Account",
    itemType: "Hardware Procurement",
    accountGroup: "Fixed Assets",
    accountClass: "Computers & Office Equipment",
    misGrouping: "IT Capital Assets",
    ledgerName: "General Ledger India",
    subLedgerName: "IT Hardware Sub Ledger",
    coa: "Global COA v2.1",
    accountCode: "GL-12001",
    amountLcl: "₹8,15,500.00",
    amountTxn: "₹8,15,500.00",
    poIpNumber: "PO-2026-004",
    itemId: "HW-DELL-L5540",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026"
  },
  {
    docNumber: "JV-2026-0008",
    docDate: "Jun 01, 2026",
    accountType: "Capital Asset Account",
    itemType: "Hardware Procurement",
    accountGroup: "Fixed Assets",
    accountClass: "Computers & Office Equipment",
    misGrouping: "IT Capital Assets",
    ledgerName: "General Ledger India",
    subLedgerName: "IT Hardware Sub Ledger",
    coa: "Global COA v2.1",
    accountCode: "GL-12001",
    amountLcl: "₹2,79,000.00",
    amountTxn: "₹2,79,000.00",
    poIpNumber: "PO-2026-004",
    itemId: "CISC-9300-24T",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026"
  }
];

interface ProvReversalRecord {
  reversalDocNumber: string;
  reversalDocDate: string;
  reversalAccountType: string;
  reversalItemType: string;
  reversalAccountGroup: string;
  reversalAccountClass: string;
  reversalMisGrouping: string;
  reversalLedgerName: string;
  reversalSubLedgerName: string;
  coa: string;
  reversalAccountCode: string;
  reversalAmountLcl: string;
  reversalAmountTxn: string;
  poIpNumber: string;
  itemId: string;
  fromDate: string;
  toDate: string;
}

const mockProvReversals: ProvReversalRecord[] = [
  {
    reversalDocNumber: "REV-2026-0001",
    reversalDocDate: "Jun 01, 2026",
    reversalAccountType: "Accrued Liability Reversal",
    reversalItemType: "SaaS Provision Reversal",
    reversalAccountGroup: "Current Liabilities",
    reversalAccountClass: "Provision Adjustments",
    reversalMisGrouping: "Technology Costs Reversal",
    reversalLedgerName: "General Ledger India",
    reversalSubLedgerName: "SaaS Sub Ledger",
    coa: "Global COA v2.1",
    reversalAccountCode: "GL-24501",
    reversalAmountLcl: "₹3,19,200.00",
    reversalAmountTxn: "₹3,19,200.00",
    poIpNumber: "PO-2026-001",
    itemId: "MS-365-E5",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    reversalDocNumber: "REV-2026-0002",
    reversalDocDate: "Jun 01, 2026",
    reversalAccountType: "Accrued Liability Reversal",
    reversalItemType: "Hosting Provision Reversal",
    reversalAccountGroup: "Current Liabilities",
    reversalAccountClass: "Provision Adjustments",
    reversalMisGrouping: "Infrastructure Costs Reversal",
    reversalLedgerName: "General Ledger US",
    reversalSubLedgerName: "Cloud Infrastructure Sub Ledger",
    coa: "Global COA v2.1",
    reversalAccountCode: "GL-24505",
    reversalAmountLcl: "₹1,77,250.00",
    reversalAmountTxn: "₹1,77,250.00",
    poIpNumber: "PO-2026-001",
    itemId: "AWS-EC2-OPS",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026"
  },
  {
    reversalDocNumber: "REV-2026-0003",
    reversalDocDate: "Jun 01, 2026",
    reversalAccountType: "Accrued Liability Reversal",
    reversalItemType: "Database Provision Reversal",
    reversalAccountGroup: "Current Liabilities",
    reversalAccountClass: "Provision Adjustments",
    reversalMisGrouping: "Infrastructure Costs Reversal",
    reversalLedgerName: "General Ledger US",
    reversalSubLedgerName: "Cloud Infrastructure Sub Ledger",
    coa: "Global COA v2.1",
    reversalAccountCode: "GL-24505",
    reversalAmountLcl: "₹90,000.00",
    reversalAmountTxn: "₹90,000.00",
    poIpNumber: "PO-2026-002",
    itemId: "AZ-SQL-DB",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026"
  },
  {
    reversalDocNumber: "REV-2026-0004",
    reversalDocDate: "Jun 01, 2026",
    reversalAccountType: "Accrued Liability Reversal",
    reversalItemType: "ERP Support Provision Reversal",
    reversalAccountGroup: "Current Liabilities",
    reversalAccountClass: "Provision Adjustments",
    reversalMisGrouping: "Technology Costs Reversal",
    reversalLedgerName: "General Ledger India",
    reversalSubLedgerName: "ERP Support Sub Ledger",
    coa: "Global COA v2.1",
    reversalAccountCode: "GL-24501",
    reversalAmountLcl: "₹1,98,000.00",
    reversalAmountTxn: "₹1,98,000.00",
    poIpNumber: "PO-2026-002",
    itemId: "SAP-ERP-MAIN",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    reversalDocNumber: "REV-2026-0005",
    reversalDocDate: "Jun 01, 2026",
    reversalAccountType: "Accrued Liability Reversal",
    reversalItemType: "Database Support Provision Reversal",
    reversalAccountGroup: "Current Liabilities",
    reversalAccountClass: "Provision Adjustments",
    reversalMisGrouping: "Technology Costs Reversal",
    reversalLedgerName: "General Ledger India",
    reversalSubLedgerName: "Database Support Sub Ledger",
    coa: "Global COA v2.1",
    reversalAccountCode: "GL-24501",
    reversalAmountLcl: "₹1,15,000.00",
    reversalAmountTxn: "₹1,15,000.00",
    poIpNumber: "PO-2026-003",
    itemId: "ORA-DB-PRO",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027"
  },
  {
    reversalDocNumber: "REV-2026-0006",
    reversalDocDate: "Jun 01, 2026",
    reversalAccountType: "Accrued Liability Reversal",
    reversalItemType: "Professional Consulting Reversal",
    reversalAccountGroup: "Current Liabilities",
    reversalAccountClass: "Provision Adjustments",
    reversalMisGrouping: "Professional Services Reversal",
    reversalLedgerName: "General Ledger India",
    reversalSubLedgerName: "Consulting Services Sub Ledger",
    coa: "Global COA v2.1",
    reversalAccountCode: "GL-24502",
    reversalAmountLcl: "₹4,56,000.00",
    reversalAmountTxn: "₹4,56,000.00",
    poIpNumber: "PO-2026-003",
    itemId: "CON-FIN-ADVISORY",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 15, 2026"
  },
  {
    reversalDocNumber: "REV-2026-0007",
    reversalDocDate: "Jun 01, 2026",
    reversalAccountType: "Accrued Liability Reversal",
    reversalItemType: "Hardware Procurement Reversal",
    reversalAccountGroup: "Current Liabilities",
    reversalAccountClass: "Provision Adjustments",
    reversalMisGrouping: "IT Assets Reversal",
    reversalLedgerName: "General Ledger India",
    reversalSubLedgerName: "IT Hardware Sub Ledger",
    coa: "Global COA v2.1",
    reversalAccountCode: "GL-24503",
    reversalAmountLcl: "₹8,15,500.00",
    reversalAmountTxn: "₹8,15,500.00",
    poIpNumber: "PO-2026-004",
    itemId: "HW-DELL-L5540",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026"
  },
  {
    reversalDocNumber: "REV-2026-0008",
    reversalDocDate: "Jun 01, 2026",
    reversalAccountType: "Accrued Liability Reversal",
    reversalItemType: "Network Switch Reversal",
    reversalAccountGroup: "Current Liabilities",
    reversalAccountClass: "Provision Adjustments",
    reversalMisGrouping: "IT Assets Reversal",
    reversalLedgerName: "General Ledger India",
    reversalSubLedgerName: "IT Hardware Sub Ledger",
    coa: "Global COA v2.1",
    reversalAccountCode: "GL-24503",
    reversalAmountLcl: "₹2,79,000.00",
    reversalAmountTxn: "₹2,79,000.00",
    poIpNumber: "PO-2026-004",
    itemId: "CISC-9300-24T",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026"
  }
];

interface AmortizationRecord {
  lineId: string;
  poIpItemReference: string;
  itemId: string;
  itemName: string;
  fromDate: string;
  toDate: string;
  unitPeriod: string;
  amortizationDate: string;
  baseValue: string;
  baseValuePerUnit: string;
}

const mockAmortizations: AmortizationRecord[] = [
  {
    lineId: "AM-001",
    poIpItemReference: "ITEM-REF-MS-365",
    itemId: "MS-365-E5",
    itemName: "Microsoft 365 E5 License Renewal",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027",
    unitPeriod: "Monthly",
    amortizationDate: "Jun 30, 2026",
    baseValue: "₹3,19,200.00",
    baseValuePerUnit: "₹26,600.00"
  },
  {
    lineId: "AM-002",
    poIpItemReference: "ITEM-REF-AWS-EC2",
    itemId: "AWS-EC2-OPS",
    itemName: "AWS EC2 Compute Infrastructure",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026",
    unitPeriod: "Daily",
    amortizationDate: "Jun 30, 2026",
    baseValue: "₹1,77,250.00",
    baseValuePerUnit: "₹5,908.33"
  },
  {
    lineId: "AM-003",
    poIpItemReference: "ITEM-REF-AZ-SQL",
    itemId: "AZ-SQL-DB",
    itemName: "Azure SQL Managed Databases",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 30, 2026",
    unitPeriod: "Daily",
    amortizationDate: "Jun 30, 2026",
    baseValue: "₹90,000.00",
    baseValuePerUnit: "₹3,000.00"
  },
  {
    lineId: "AM-004",
    poIpItemReference: "ITEM-REF-SAP-MNT",
    itemId: "SAP-ERP-MAIN",
    itemName: "SAP ERP Enterprise Maintenance & Support",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027",
    unitPeriod: "Monthly",
    amortizationDate: "Jun 30, 2026",
    baseValue: "₹1,98,000.00",
    baseValuePerUnit: "₹16,500.00"
  },
  {
    lineId: "AM-005",
    poIpItemReference: "ITEM-REF-ORA-DB",
    itemId: "ORA-DB-PRO",
    itemName: "Oracle Database Support Services",
    fromDate: "Jun 01, 2026",
    toDate: "May 31, 2027",
    unitPeriod: "Monthly",
    amortizationDate: "Jun 30, 2026",
    baseValue: "₹1,15,000.00",
    baseValuePerUnit: "₹9,583.33"
  },
  {
    lineId: "AM-006",
    poIpItemReference: "ITEM-REF-CON-SRV",
    itemId: "CON-FIN-ADVISORY",
    itemName: "Professional Consulting - Financial Advisory",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 15, 2026",
    unitPeriod: "Daily",
    amortizationDate: "Jun 15, 2026",
    baseValue: "₹4,56,000.00",
    baseValuePerUnit: "₹30,400.00"
  },
  {
    lineId: "AM-007",
    poIpItemReference: "ITEM-REF-HW-LAP",
    itemId: "HW-DELL-L5540",
    itemName: "Dell Latitude 5540 Enterprise Laptops",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026",
    unitPeriod: "None (Capitalized)",
    amortizationDate: "Jun 01, 2026",
    baseValue: "₹8,15,500.00",
    baseValuePerUnit: "N/A"
  },
  {
    lineId: "AM-008",
    poIpItemReference: "ITEM-REF-NET-SWT",
    itemId: "CISC-9300-24T",
    itemName: "Cisco Catalyst 9300 24-Port Network Switch",
    fromDate: "Jun 01, 2026",
    toDate: "Jun 01, 2026",
    unitPeriod: "None (Capitalized)",
    amortizationDate: "Jun 01, 2026",
    baseValue: "₹2,79,000.00",
    baseValuePerUnit: "N/A"
  }
];

interface WorkflowActivity {
  code: string;
  name: string;
  department: string;
  status: string;
  dueDate: string;
  lob: string;
  dependency: string;
  reason: string;
  isEditable: boolean;
}

const initialWorkflowActivities: WorkflowActivity[] = [
  {
    code: "ACT-001",
    name: "OCR Validation",
    department: "Data Operations",
    status: "Approve",
    dueDate: "Jun 02, 2026",
    lob: "Finance Shared Services",
    dependency: "None",
    reason: "Automated document ingestion and text recognition matched with 99.4% confidence.",
    isEditable: false
  },
  {
    code: "ACT-002",
    name: "Vendor Validation",
    department: "Master Data Management",
    status: "Approve",
    dueDate: "Jun 03, 2026",
    lob: "Global Master Data",
    dependency: "ACT-001 (OCR Validation)",
    reason: "Vendor PAN and GST number verified against internal corporate registry.",
    isEditable: false
  },
  {
    code: "ACT-003",
    name: "Tax Verification",
    department: "Taxation & Compliance",
    status: "Approve",
    dueDate: "Jun 05, 2026",
    lob: "Corporate Taxation",
    dependency: "ACT-002 (Vendor Validation)",
    reason: "IGST 18% verify checked. Correct HSN code classification confirmed.",
    isEditable: false
  },
  {
    code: "ACT-004",
    name: "Cost Allocation Review",
    department: "Finance Control",
    status: "Reset",
    dueDate: "Jun 08, 2026",
    lob: "Finance Control",
    dependency: "ACT-003 (Tax Verification)",
    reason: "Reviewing direct cost allocation across IT and Cloud Engineering divisions.",
    isEditable: true
  },
  {
    code: "ACT-005",
    name: "Accounting Validation",
    department: "Accounts Payable",
    status: "Reset",
    dueDate: "Jun 10, 2026",
    lob: "Accounts Payable",
    dependency: "ACT-004 (Cost Allocation Review)",
    reason: "Verify matching parameters and ledger accounting mappings.",
    isEditable: true
  },
  {
    code: "ACT-006",
    name: "Finance Review",
    department: "Finance LOB Control",
    status: "Reset",
    dueDate: "Jun 12, 2026",
    lob: "Corporate Advisory LOB",
    dependency: "ACT-005 (Accounting Validation)",
    reason: "General ledger entries and sub-ledger entries matching review.",
    isEditable: true
  },
  {
    code: "ACT-007",
    name: "Approval",
    department: "Management",
    status: "Reset",
    dueDate: "Jun 15, 2026",
    lob: "Management",
    dependency: "ACT-006 (Finance Review)",
    reason: "CFO confirmation for total invoice gross value ₹11,20,410.00.",
    isEditable: true
  },
  {
    code: "ACT-008",
    name: "ERP Posting",
    department: "IT Systems",
    status: "Reset",
    dueDate: "Jun 18, 2026",
    lob: "Global Infrastructure LOB",
    dependency: "ACT-007 (Approval)",
    reason: "ERP posting triggers once approval workflows are completed.",
    isEditable: true
  }
];

interface Props {
  billId: string;
  onClose: () => void;
  isNew?: boolean;
  billStatus?: string;
  prefill?: ScannedBillData;
}

export function BillDetailPage({ billId, onClose, isNew = false, billStatus, prefill }: Props) {
  const { openActivity, setActiveDetailRecord, setNavigationContext, navigationContext } = useActivity();
  const [activeTab, setActiveTab] = useState("Bill Information");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLines, setExpandedLines] = useState<string[]>([]);

  // Phase 3 States
  const [matchingSearchQuery, setMatchingSearchQuery] = useState("");
  const [expandedMatching, setExpandedMatching] = useState<string[]>([]);
  const [billAllocSearchQuery, setBillAllocSearchQuery] = useState("");
  const [expandedBillAlloc, setExpandedBillAlloc] = useState<string[]>([]);
  const [provAllocSearchQuery, setProvAllocSearchQuery] = useState("");
  const [expandedProvAlloc, setExpandedProvAlloc] = useState<string[]>([]);

  // Phase 4 States
  const [expJournalSearchQuery, setExpJournalSearchQuery] = useState("");
  const [expandedExpJournal, setExpandedExpJournal] = useState<string[]>([]);
  const [revJournalSearchQuery, setRevJournalSearchQuery] = useState("");
  const [expandedRevJournal, setExpandedRevJournal] = useState<string[]>([]);
  const [amortSearchQuery, setAmortSearchQuery] = useState("");
  const [expandedAmort, setExpandedAmort] = useState<string[]>([]);

  // Phase 5 States
  const [workflowActivities, setWorkflowActivities] = useState<WorkflowActivity[]>(initialWorkflowActivities);
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState("");
  const [expandedWorkflow, setExpandedWorkflow] = useState<string[]>([]);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const [workflowDrafts, setWorkflowDrafts] = useState<WorkflowActivity[]>([]);

  const [data, setData] = useState<BillData>(() => {
    const base = isNew ? makeEmpty() : makeBill(billId, billStatus);
    if (!prefill) return base;
    return {
      ...base,
      ...(prefill.vendorName    && { vendorName: prefill.vendorName }),
      ...(prefill.invoiceNumber && { billNumber: prefill.invoiceNumber }),
      ...(prefill.invoiceDate   && { invoiceDate: prefill.invoiceDate }),
      ...(prefill.dueDate       && { dueDate: prefill.dueDate }),
      ...(prefill.gstin         && { vendorGstNumber: prefill.gstin }),
      ...(prefill.pan           && { vendorPan: prefill.pan }),
    };
  });

  useEffect(() => {
    openActivity({
      type: "Bill",
      id: billId,
      status: billStatus || data.status || "Received",
      createdBy: "Alex Johnson",
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    });
  }, [billId, billStatus, data.status, openActivity]);

  useEffect(() => {
    if (prefill) {
      setData(prev => ({
        ...prev,
        ...(prefill.vendorName    && { vendorName: prefill.vendorName }),
        ...(prefill.invoiceNumber && { billNumber: prefill.invoiceNumber }),
        ...(prefill.invoiceDate   && { invoiceDate: prefill.invoiceDate }),
        ...(prefill.dueDate       && { dueDate: prefill.dueDate }),
        ...(prefill.gstin         && { vendorGstNumber: prefill.gstin }),
        ...(prefill.pan           && { vendorPan: prefill.pan }),
      }));
    }
  }, [prefill]);

  function handleSave(updated: BillData) { setData(updated); }
  const isDraft = data.status === "Received" || data.status === "Draft" || isNew;

  // Filters
  const filteredLines = mockBillingLines.filter(line => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      line.lineId.toLowerCase().includes(query) ||
      line.orderId.toLowerCase().includes(query) ||
      line.itemId.toLowerCase().includes(query) ||
      line.itemName.toLowerCase().includes(query) ||
      line.resourceName.toLowerCase().includes(query)
    );
  });

  const filteredMatching = mockMatchingRecords.filter(rec => {
    const q = matchingSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.poIpNumber.toLowerCase().includes(q) ||
      rec.itemId.toLowerCase().includes(q) ||
      rec.field.toLowerCase().includes(q) ||
      rec.referencePoint.toLowerCase().includes(q)
    );
  });

  const filteredBillAllocations = mockBillCostAllocations.filter(rec => {
    const q = billAllocSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.costAllocationMethod.toLowerCase().includes(q) ||
      rec.lob.toLowerCase().includes(q) ||
      rec.poIpNumber.toLowerCase().includes(q)
    );
  });

  const filteredProvAllocations = mockProvisionReversals.filter(rec => {
    const q = provAllocSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.reversalCostAllocationMethod.toLowerCase().includes(q) ||
      rec.reversalLob.toLowerCase().includes(q) ||
      rec.poIpNumber.toLowerCase().includes(q)
    );
  });

  const filteredExpJournals = mockExpensesJournals.filter(rec => {
    const q = expJournalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.docNumber.toLowerCase().includes(q) ||
      rec.accountCode.toLowerCase().includes(q) ||
      rec.ledgerName.toLowerCase().includes(q) ||
      rec.subLedgerName.toLowerCase().includes(q) ||
      rec.poIpNumber.toLowerCase().includes(q)
    );
  });

  const filteredRevJournals = mockProvReversals.filter(rec => {
    const q = revJournalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.reversalDocNumber.toLowerCase().includes(q) ||
      rec.reversalAccountCode.toLowerCase().includes(q) ||
      rec.reversalLedgerName.toLowerCase().includes(q) ||
      rec.reversalSubLedgerName.toLowerCase().includes(q) ||
      rec.poIpNumber.toLowerCase().includes(q)
    );
  });

  const filteredAmortizations = mockAmortizations.filter(rec => {
    const q = amortSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.lineId.toLowerCase().includes(q) ||
      rec.itemId.toLowerCase().includes(q) ||
      rec.itemName.toLowerCase().includes(q) ||
      rec.poIpItemReference.toLowerCase().includes(q)
    );
  });

  const filteredWorkflow = (isEditingWorkflow ? workflowDrafts : workflowActivities).filter(rec => {
    const q = workflowSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.code.toLowerCase().includes(q) ||
      rec.name.toLowerCase().includes(q) ||
      rec.department.toLowerCase().includes(q) ||
      rec.lob.toLowerCase().includes(q) ||
      rec.status.toLowerCase().includes(q)
    );
  });

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
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew ? (
            <>
              <button 
                onClick={() => {
                  setData(prev => ({ ...prev, status: "Validated" }));
                  alert("Bill validated successfully.");
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
              >
                Validate
              </button>
              <button 
                onClick={() => {
                  alert("Bill activated successfully.");
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
              >
                Activate
              </button>
              <button 
                onClick={() => {
                  alert("Retrying document extraction...");
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
              >
                Retry Extraction
              </button>
            </>
          ) : (
            <button onClick={() => { alert(`Bill "${data.billNumber || "New Bill"}" created.`); onClose(); }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2"
              style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
              <Check size={13} /> Create Bill
            </button>
          )}
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

        {/* ── BILL INFORMATION ─────────────────────────────────────────────────── */}
        {activeTab === "Bill Information" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 900 }}>
            {isNew && (
              <AIBillScanner onApply={(d: ScannedBillData) => {
                setData(prev => ({
                  ...prev,
                  ...(d.vendorName    && { vendorName: d.vendorName }),
                  ...(d.invoiceNumber && { billNumber: d.invoiceNumber }),
                  ...(d.invoiceDate   && { invoiceDate: d.invoiceDate }),
                  ...(d.dueDate       && { dueDate: d.dueDate }),
                  ...(d.gstin         && { vendorGstNumber: d.gstin }),
                  ...(d.pan           && { vendorPan: d.pan }),
                }));
              }} />
            )}
            
            <Section title="Organization Information" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid2>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORGANIZATION NAME</span>
                      <EInput value={draft.organizationName} onChange={v => set("organizationName", v)} />
                    </div>
                  ) : (
                    <ViewField label="Organization Name" value={data.organizationName} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORGANIZATION ID</span>
                      <EInput value={draft.organizationId} onChange={v => set("organizationId", v)} />
                    </div>
                  ) : (
                    <ViewField label="Organization ID" value={data.organizationId} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>INTERIM ID</span>
                      <EInput value={draft.interimId} onChange={v => set("interimId", v)} />
                    </div>
                  ) : (
                    <ViewField label="Interim ID" value={data.interimId} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BILL NUMBER</span>
                      <EInput value={draft.billNumber} onChange={v => set("billNumber", v)} />
                    </div>
                  ) : (
                    <ViewField label="Bill Number" value={data.billNumber} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATUS</span>
                      <ESelect value={draft.status} onChange={v => set("status", v)} options={["Received", "In Progress", "Validated", "Rejected", "Draft"]} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATUS</span>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                          style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[data.status] }}>
                          <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[data.status], display: "inline-block" }} />
                          {data.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>UPLOAD MODE</span>
                      <EInput value={draft.uploadMode} onChange={v => set("uploadMode", v)} />
                    </div>
                  ) : (
                    <ViewField label="Upload Mode" value={data.uploadMode} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>MESSAGE ID</span>
                      <EInput value={draft.messageId} onChange={v => set("messageId", v)} />
                    </div>
                  ) : (
                    <ViewField label="Message ID" value={data.messageId} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>OBJECT ID</span>
                      <EInput value={draft.objectId} onChange={v => set("objectId", v)} />
                    </div>
                  ) : (
                    <ViewField label="Object ID" value={data.objectId} mono />
                  )}
                </Grid2>
              )}
            </Section>
          </div>
        )}

        {/* ── VENDOR INFORMATION ───────────────────────────────────────────────── */}
        {activeTab === "Vendor Information" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 900 }}>
            <Section title="Vendor Information" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid2>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR ID</span>
                      <EInput value={draft.vendorId} onChange={v => set("vendorId", v)} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR ID</span>
                      <button
                        onClick={() => {
                          setActiveDetailRecord?.({ type: "Vendor", id: data.vendorId, status: "Active" });
                          setNavigationContext?.({
                            previousModule: navigationContext?.previousModule || null,
                            currentModule: "Bill",
                            detailPageOrigin: "Bill"
                          });
                        }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: 13, fontFamily: "var(--font-mono)",
                          color: "#6b8cff", textDecoration: "none", padding: 0,
                          textAlign: "left", alignSelf: "flex-start"
                        }}
                      >
                        {data.vendorId}
                      </button>
                    </div>
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR NAME</span>
                      <EInput value={draft.vendorName} onChange={v => set("vendorName", v)} />
                    </div>
                  ) : (
                    <ViewField label="Vendor Name" value={data.vendorName} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR NAME AS PER MASTER</span>
                      <EInput value={draft.vendorNameAsPerMaster} onChange={v => set("vendorNameAsPerMaster", v)} />
                    </div>
                  ) : (
                    <ViewField label="Vendor Name As Per Master" value={data.vendorNameAsPerMaster} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR PAN</span>
                      <EInput value={draft.vendorPan} onChange={v => set("vendorPan", v)} />
                    </div>
                  ) : (
                    <ViewField label="Vendor PAN" value={data.vendorPan} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR GST NUMBER</span>
                      <EInput value={draft.vendorGstNumber} onChange={v => set("vendorGstNumber", v)} />
                    </div>
                  ) : (
                    <ViewField label="Vendor GST Number" value={data.vendorGstNumber} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR STATE CODE</span>
                      <EInput value={draft.vendorStateCode} onChange={v => set("vendorStateCode", v)} />
                    </div>
                  ) : (
                    <ViewField label="Vendor State Code" value={data.vendorStateCode} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TRANSACTION CURRENCY</span>
                      <ESelect value={draft.currency} onChange={v => set("currency", v)} options={["INR", "USD", "EUR", "GBP"]} />
                    </div>
                  ) : (
                    <ViewField label="Transaction Currency" value={data.currency} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TAX CATEGORY</span>
                      <EInput value={draft.taxCategory} onChange={v => set("taxCategory", v)} />
                    </div>
                  ) : (
                    <ViewField label="Tax Category" value={data.taxCategory} />
                  )}
                </Grid2>
              )}
            </Section>
          </div>
        )}

        {/* ── INVOICE ──────────────────────────────────────────────────────────── */}
        {activeTab === "Invoice" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 900 }}>
            {/* Card 1: General Information */}
            <Section title="General Information" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid3>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>INVOICE REFERENCE</span>
                      <EInput value={draft.invoiceReference} onChange={v => set("invoiceReference", v)} />
                    </div>
                  ) : (
                    <ViewField label="Invoice Reference" value={data.invoiceReference} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORIGINAL INVOICE REFERENCE</span>
                      <EInput value={draft.originalInvoiceReference} onChange={v => set("originalInvoiceReference", v)} />
                    </div>
                  ) : (
                    <ViewField label="Original Invoice Reference" value={data.originalInvoiceReference} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DOCUMENT TYPE</span>
                      <EInput value={draft.documentType} onChange={v => set("documentType", v)} />
                    </div>
                  ) : (
                    <ViewField label="Document Type" value={data.documentType} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>INVOICE DATE</span>
                      <EInput value={draft.invoiceDate} onChange={v => set("invoiceDate", v)} />
                    </div>
                  ) : (
                    <ViewField label="Invoice Date" value={data.invoiceDate} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNTING DATE</span>
                      <EInput value={draft.accountingDate} onChange={v => set("accountingDate", v)} />
                    </div>
                  ) : (
                    <ViewField label="Accounting Date" value={data.accountingDate} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DUE DATE</span>
                      <EInput value={draft.dueDate} onChange={v => set("dueDate", v)} />
                    </div>
                  ) : (
                    <ViewField label="Due Date" value={data.dueDate} mono />
                  )}
                </Grid3>
              )}
            </Section>

            {/* Card 2: Tax Information */}
            <Section title="Tax Information" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid2>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PAN</span>
                      <EInput value={draft.pan} onChange={v => set("pan", v)} />
                    </div>
                  ) : (
                    <ViewField label="PAN" value={data.pan} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GST NUMBER</span>
                      <EInput value={draft.gstNumber} onChange={v => set("gstNumber", v)} />
                    </div>
                  ) : (
                    <ViewField label="GST Number" value={data.gstNumber} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BILLING STATE CODE</span>
                      <EInput value={draft.billingStateCode} onChange={v => set("billingStateCode", v)} />
                    </div>
                  ) : (
                    <ViewField label="Billing State Code" value={data.billingStateCode} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>LOCAL CURRENCY</span>
                      <ESelect value={draft.localCurrency} onChange={v => set("localCurrency", v)} options={["INR", "USD", "EUR", "GBP"]} />
                    </div>
                  ) : (
                    <ViewField label="Local Currency" value={data.localCurrency} />
                  )}
                </Grid2>
              )}
            </Section>

            {/* Card 3: Financial Summary */}
            <Section title="Financial Summary" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid3>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TOTAL INVOICE BASE VALUE</span>
                      <EInput value={draft.totalInvoiceBaseValue} onChange={v => set("totalInvoiceBaseValue", v)} />
                    </div>
                  ) : (
                    <ViewField label="Total Invoice Base Value" value={data.totalInvoiceBaseValue} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TOTAL INVOICE TAX VALUE</span>
                      <EInput value={draft.totalInvoiceTaxValue} onChange={v => set("totalInvoiceTaxValue", v)} />
                    </div>
                  ) : (
                    <ViewField label="Total Invoice Tax Value" value={data.totalInvoiceTaxValue} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TOTAL INVOICE GROSS VALUE</span>
                      <EInput value={draft.totalInvoiceGrossValue} onChange={v => set("totalInvoiceGrossValue", v)} />
                    </div>
                  ) : (
                    <ViewField label="Total Invoice Gross Value" value={data.totalInvoiceGrossValue} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ADDITIONAL CHARGE TYPE</span>
                      <EInput value={draft.additionalChargeType} onChange={v => set("additionalChargeType", v)} />
                    </div>
                  ) : (
                    <ViewField label="Additional Charge Type" value={data.additionalChargeType} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TOTAL ADDITIONAL CHARGE</span>
                      <EInput value={draft.totalAdditionalCharge} onChange={v => set("totalAdditionalCharge", v)} />
                    </div>
                  ) : (
                    <ViewField label="Total Additional Charge" value={data.totalAdditionalCharge} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ROUND OFF VALUE</span>
                      <EInput value={draft.roundOffValue} onChange={v => set("roundOffValue", v)} />
                    </div>
                  ) : (
                    <ViewField label="Round Off Value" value={data.roundOffValue} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>EXCHANGE RATE</span>
                      <EInput value={draft.exchangeRate} onChange={v => set("exchangeRate", v)} />
                    </div>
                  ) : (
                    <ViewField label="Exchange Rate" value={data.exchangeRate} mono />
                  )}
                </Grid3>
              )}
            </Section>

            {/* Card 4: Shipping Information */}
            <Section title="Shipping Information" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid2>
                  {editing ? (
                    <div className="flex flex-col gap-1 col-span-full">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>SHIP TO</span>
                      <EInput value={draft.shipTo} onChange={v => set("shipTo", v)} />
                    </div>
                  ) : (
                    <FullWidthField label="Ship To" value={data.shipTo} />
                  )}
                </Grid2>
              )}
            </Section>

            {/* Card 5: Payment Details */}
            <Section title="Payment Details" isDraft={isDraft} defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid3>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BANK NAME</span>
                      <EInput value={draft.bankName} onChange={v => set("bankName", v)} />
                    </div>
                  ) : (
                    <ViewField label="Bank Name" value={data.bankName} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BRANCH NAME</span>
                      <EInput value={draft.branchName} onChange={v => set("branchName", v)} />
                    </div>
                  ) : (
                    <ViewField label="Branch Name" value={data.branchName} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>IFSC CODE</span>
                      <EInput value={draft.ifscCode} onChange={v => set("ifscCode", v)} />
                    </div>
                  ) : (
                    <ViewField label="IFSC Code" value={data.ifscCode} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT NUMBER</span>
                      <EInput value={draft.accountNumber} onChange={v => set("accountNumber", v)} />
                    </div>
                  ) : (
                    <ViewField label="Account Number" value={data.accountNumber} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT HOLDER NAME</span>
                      <EInput value={draft.accountHolderName} onChange={v => set("accountHolderName", v)} />
                    </div>
                  ) : (
                    <ViewField label="Account Holder Name" value={data.accountHolderName} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>MICR CODE</span>
                      <EInput value={draft.micrCode} onChange={v => set("micrCode", v)} />
                    </div>
                  ) : (
                    <ViewField label="MICR Code" value={data.micrCode} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>SWIFT CODE</span>
                      <EInput value={draft.swiftCode} onChange={v => set("swiftCode", v)} />
                    </div>
                  ) : (
                    <ViewField label="SWIFT Code" value={data.swiftCode} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BIC</span>
                      <EInput value={draft.bic} onChange={v => set("bic", v)} />
                    </div>
                  ) : (
                    <ViewField label="BIC" value={data.bic} mono />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BENEFICIARY</span>
                      <EInput value={draft.beneficiary} onChange={v => set("beneficiary", v)} />
                    </div>
                  ) : (
                    <ViewField label="Beneficiary" value={data.beneficiary} />
                  )}

                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>IBAN (GBP)</span>
                      <EInput value={draft.ibanGbp} onChange={v => set("ibanGbp", v)} />
                    </div>
                  ) : (
                    <ViewField label="IBAN (GBP)" value={data.ibanGbp} mono />
                  )}
                </Grid3>
              )}
            </Section>
          </div>
        )}

        {/* ── BILLING SUMMARY ──────────────────────────────────────────────────── */}
        {activeTab === "Billing Summary" && (
          <div className="flex flex-col gap-4 animate-fadeIn" style={{ maxWidth: 900 }}>
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  Billing Summary ({filteredLines.length} Line Items)
                </p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  Expand a line item to view detailed financial, period, tax, and cost allocation breakdown.
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
                    placeholder="Search line, order, item..."
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
                  onClick={() => setExpandedLines(filteredLines.map(l => l.lineId))}
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
              </div>
            </div>

            {/* List of expandable cards */}
            <div className="flex flex-col gap-3">
              {filteredLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No billing lines match the search criteria.</p>
                </div>
              ) : (
                filteredLines.map(line => {
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
                            {line.lineId}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {line.itemName}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                              {line.orderId}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8 flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>QUANTITY</span>
                            <span style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>{line.quantity}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>RATE</span>
                            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>₹{line.rate.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>TOTAL VALUE</span>
                            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>₹{line.totalValue.toLocaleString("en-IN")}</span>
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
                              <ViewField label="Order ID" value={line.orderId} mono />
                              <ViewField label="Reference" value={line.reference} mono />
                              <ViewField label="Item Reference" value={line.itemReference} mono />
                              <ViewField label="Item ID" value={line.itemId} mono />
                              <ViewField label="Item Name" value={line.itemName} />
                              <ViewField label="Resource Name" value={line.resourceName} />
                              <ViewField label="Order Type" value={line.orderType} />
                              <ViewField label="HSN/SAC" value={line.hsnSac} mono />
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 2: Period Information */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PERIOD INFORMATION</h4>
                            <Grid2>
                              <ViewField label="For Period From" value={line.forPeriodFrom} mono />
                              <ViewField label="For Period To" value={line.forPeriodTo} mono />
                            </Grid2>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 3: Quantity & Pricing */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>QUANTITY & PRICING</h4>
                            <Grid3>
                              <ViewField label="Quantity" value={String(line.quantity)} />
                              <ViewField label="Rate" value={`₹${line.rate.toLocaleString("en-IN")}`} mono />
                              <ViewField label="Base Value" value={`₹${line.baseValue.toLocaleString("en-IN")}`} mono />
                              <ViewField label="Discount Amount" value={`₹${line.discountAmount.toLocaleString("en-IN")}`} mono />
                              <ViewField label="Additional Charge" value={`₹${line.additionalCharge.toLocaleString("en-IN")}`} mono />
                              <ViewField label="Additional Charge 1" value={`₹${line.additionalCharge1.toLocaleString("en-IN")}`} mono />
                              <ViewField label="Total Value" value={`₹${line.totalValue.toLocaleString("en-IN")}`} mono />
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 4: Tax Information */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TAX INFORMATION</h4>
                            <Grid3>
                              <ViewField label="Tax Code" value={line.taxCode} mono />
                              <ViewField label="CGST Percentage" value={`${line.cgstPercentage}%`} />
                              <ViewField label="CGST" value={`₹${line.cgst.toLocaleString("en-IN")}`} mono />
                              <ViewField label="SGST Percentage" value={`${line.sgstPercentage}%`} />
                              <ViewField label="SGST" value={`₹${line.sgst.toLocaleString("en-IN")}`} mono />
                              <ViewField label="IGST Percentage" value={`${line.igstPercentage}%`} />
                              <ViewField label="IGST" value={`₹${line.igst.toLocaleString("en-IN")}`} mono />
                              <ViewField label="Tax Percentage" value={`${line.taxPercentage}%`} />
                              <ViewField label="Tax Value" value={`₹${line.taxValue.toLocaleString("en-IN")}`} mono />
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Section 5: Accounting Information (Prepared for Edit Mode Dropdowns) */}
                          <div className="flex flex-col gap-3">
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNTING INFORMATION</h4>
                            <Grid3>
                              <div className="flex flex-col gap-1">
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT TYPE</span>
                                <input 
                                  type="text" 
                                  value={line.accountType} 
                                  disabled 
                                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-foreground cursor-not-allowed"
                                  style={{ background: "var(--secondary)", borderColor: "var(--border)", height: 34, outline: "none", opacity: 0.8 }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>COST ALLOCATION METHOD</span>
                                <input 
                                  type="text" 
                                  value={line.costAllocationMethod} 
                                  disabled 
                                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-foreground cursor-not-allowed"
                                  style={{ background: "var(--secondary)", borderColor: "var(--border)", height: 34, outline: "none", opacity: 0.8 }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DEPARTMENT</span>
                                <input 
                                  type="text" 
                                  value={line.department} 
                                  disabled 
                                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-foreground cursor-not-allowed"
                                  style={{ background: "var(--secondary)", borderColor: "var(--border)", height: 34, outline: "none", opacity: 0.8 }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>SECTION NAME</span>
                                <input 
                                  type="text" 
                                  value={line.sectionName} 
                                  disabled 
                                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-foreground cursor-not-allowed"
                                  style={{ background: "var(--secondary)", borderColor: "var(--border)", height: 34, outline: "none", opacity: 0.8 }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>LEDGER CATEGORY</span>
                                <input 
                                  type="text" 
                                  value={line.ledgerCategory} 
                                  disabled 
                                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-foreground cursor-not-allowed"
                                  style={{ background: "var(--secondary)", borderColor: "var(--border)", height: 34, outline: "none", opacity: 0.8 }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PERCENTAGE OF TDS</span>
                                <input 
                                  type="text" 
                                  value={`${line.percentageOfTds}%`} 
                                  disabled 
                                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-foreground cursor-not-allowed"
                                  style={{ background: "var(--secondary)", borderColor: "var(--border)", height: 34, outline: "none", opacity: 0.8 }}
                                />
                              </div>
                            </Grid3>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── MATCHING ─────────────────────────────────────────────────────────── */}
        {activeTab === "Matching" && (
          <div className="flex flex-col gap-4 animate-fadeIn" style={{ maxWidth: 900 }}>
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  Matching ({filteredMatching.length} Records)
                </p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  Verify system matching parameters between Purchase Orders (PO), Goods Receipts (GR), and Bills.
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
                    placeholder="Search PO, item, field..."
                    value={matchingSearchQuery}
                    onChange={(e) => setMatchingSearchQuery(e.target.value)}
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
                  onClick={() => setExpandedMatching(filteredMatching.map(l => l.poIpNumber + "-" + l.itemId))}
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
                  onClick={() => setExpandedMatching([])}
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
              </div>
            </div>

            {/* List of matching cards */}
            <div className="flex flex-col gap-3">
              {filteredMatching.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No matching records match the search criteria.</p>
                </div>
              ) : (
                filteredMatching.map(rec => {
                  const uniqueKey = rec.poIpNumber + "-" + rec.itemId;
                  const isExpanded = expandedMatching.includes(uniqueKey);
                  return (
                    <div 
                      key={uniqueKey}
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
                            setExpandedMatching(prev => prev.filter(id => id !== uniqueKey));
                          } else {
                            setExpandedMatching(prev => [...prev, uniqueKey]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                          <span 
                            className="flex items-center justify-center rounded-lg flex-shrink-0 px-2"
                            style={{ 
                              height: 28, 
                              background: "var(--secondary)", 
                              fontSize: 10, 
                              fontWeight: 700, 
                              color: "var(--foreground)", 
                              fontFamily: "var(--font-mono)",
                              border: "1px solid var(--border)"
                            }}
                          >
                            {rec.poIpNumber}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {rec.itemId}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                              Field: {rec.field}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8 flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>BALANCE</span>
                            <span style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>{rec.balanceInPoIp}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>DIFFERENCE</span>
                            <span 
                              style={{ 
                                fontSize: 12, 
                                fontWeight: 600,
                                color: rec.difference === "0 Units" || rec.difference === "₹0.00" || rec.difference === "None" || rec.difference === "0" ? "#4ade80" : "#f87171"
                              }}
                            >
                              {rec.difference}
                            </span>
                          </div>
                          <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Content Section */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-4 flex flex-col gap-4 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                          <Grid3>
                            <ViewField label="Item ID" value={rec.itemId} mono />
                            <ViewField label="PO/IP Number" value={rec.poIpNumber} mono />
                            <ViewField label="Field" value={rec.field} />
                            <ViewField label="Balance in PO/IP" value={rec.balanceInPoIp} mono />
                            <ViewField label="Reference Point" value={rec.referencePoint} />
                            <ViewField label="Bill Value" value={rec.bill} mono />
                            <ViewField label="Difference" value={rec.difference} mono />
                          </Grid3>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── COST ALLOCATION ──────────────────────────────────────────────────── */}
        {activeTab === "Cost Allocation" && (
          <div className="flex flex-col gap-8 animate-fadeIn" style={{ maxWidth: 900 }}>
            
            {/* Section 1: Bill Cost Allocation */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                    Bill Cost Allocation ({filteredBillAllocations.length} Records)
                  </h3>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                    Direct allocations mapped to corporate Line of Business (LOB) cost centers.
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
                      placeholder="Search allocation..."
                      value={billAllocSearchQuery}
                      onChange={(e) => setBillAllocSearchQuery(e.target.value)}
                      className="pl-8 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        width: 180,
                        background: "var(--secondary)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        height: 30
                      }}
                    />
                  </div>
                  {/* Expand / Collapse Actions */}
                  <button
                    onClick={() => setExpandedBillAlloc(filteredBillAllocations.map(l => l.id))}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedBillAlloc([])}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* List of allocations */}
              <div className="flex flex-col gap-3">
                {filteredBillAllocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No allocations match the search criteria.</p>
                  </div>
                ) : (
                  filteredBillAllocations.map(alloc => {
                    const isExpanded = expandedBillAlloc.includes(alloc.id);
                    return (
                      <div 
                        key={alloc.id}
                        className="rounded-xl overflow-hidden transition-all duration-200" 
                        style={{ 
                          background: "var(--card)", 
                          border: "1px solid var(--border)"
                        }}
                      >
                        <button 
                          className="w-full flex items-center justify-between px-5 py-3 text-left focus:outline-none select-none transition-colors"
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedBillAlloc(prev => prev.filter(id => id !== alloc.id));
                            } else {
                              setExpandedBillAlloc(prev => [...prev, alloc.id]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            <div className="flex flex-col min-w-0">
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                                {alloc.costAllocationMethod}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                                LOB: {alloc.lob}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 flex-shrink-0">
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>PO/IP NUMBER</span>
                              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>{alloc.poIpNumber}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>COST ALLOCATED</span>
                              <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>{alloc.costAllocatedLcl}</span>
                            </div>
                            <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-4 flex flex-col gap-4 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                            <Grid3>
                              <ViewField label="Cost Allocation Method" value={alloc.costAllocationMethod} />
                              <ViewField label="LOB" value={alloc.lob} />
                              <ViewField label="Cost Allocation Parameter Value" value={alloc.costAllocationParameterValue} />
                              <ViewField label="Cost Allocated (Local Currency)" value={alloc.costAllocatedLcl} mono />
                              <ViewField label="PO/IP Number" value={alloc.poIpNumber} mono />
                              <ViewField label="From Date" value={alloc.fromDate} mono />
                              <ViewField label="To Date" value={alloc.toDate} mono />
                            </Grid3>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Section 2: Provision Reversal Cost Allocation */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                    Provision Reversal Cost Allocation ({filteredProvAllocations.length} Records)
                  </h3>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                    Reversal entries and adjustments for provision allocations.
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
                      placeholder="Search reversal..."
                      value={provAllocSearchQuery}
                      onChange={(e) => setProvAllocSearchQuery(e.target.value)}
                      className="pl-8 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        width: 180,
                        background: "var(--secondary)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        height: 30
                      }}
                    />
                  </div>
                  {/* Expand / Collapse Actions */}
                  <button
                    onClick={() => setExpandedProvAlloc(filteredProvAllocations.map(l => l.id))}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedProvAlloc([])}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* List of reversals */}
              <div className="flex flex-col gap-3">
                {filteredProvAllocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No reversals match the search criteria.</p>
                  </div>
                ) : (
                  filteredProvAllocations.map(alloc => {
                    const isExpanded = expandedProvAlloc.includes(alloc.id);
                    return (
                      <div 
                        key={alloc.id}
                        className="rounded-xl overflow-hidden transition-all duration-200" 
                        style={{ 
                          background: "var(--card)", 
                          border: "1px solid var(--border)"
                        }}
                      >
                        <button 
                          className="w-full flex items-center justify-between px-5 py-3 text-left focus:outline-none select-none transition-colors"
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedProvAlloc(prev => prev.filter(id => id !== alloc.id));
                            } else {
                              setExpandedProvAlloc(prev => [...prev, alloc.id]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            <div className="flex flex-col min-w-0">
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                                {alloc.reversalCostAllocationMethod}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                                LOB: {alloc.reversalLob}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 flex-shrink-0">
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>PO/IP NUMBER</span>
                              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>{alloc.poIpNumber}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>COST ALLOCATED</span>
                              <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>{alloc.reversalCostAllocatedLcl}</span>
                            </div>
                            <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-4 flex flex-col gap-4 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                            <Grid3>
                              <ViewField label="Reversal Cost Allocation Method" value={alloc.reversalCostAllocationMethod} />
                              <ViewField label="Reversal LOB" value={alloc.reversalLob} />
                              <ViewField label="Reversal Cost Allocation Parameter Value" value={alloc.reversalCostAllocationParameterValue} />
                              <ViewField label="Reversal Cost Allocated (Local Currency)" value={alloc.reversalCostAllocatedLcl} mono />
                              <ViewField label="PO/IP Number" value={alloc.poIpNumber} mono />
                              <ViewField label="From Date" value={alloc.fromDate} mono />
                              <ViewField label="To Date" value={alloc.toDate} mono />
                            </Grid3>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── JOURNALS ─────────────────────────────────────────────────────────── */}
        {activeTab === "Journals" && (
          <div className="flex flex-col gap-8 animate-fadeIn" style={{ maxWidth: 900 }}>
            
            {/* Section 1: Expenses Journal */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                    Expenses Journal ({filteredExpJournals.length} Records)
                  </h3>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                    Ledger accounting document reference transactions mapped to LOB codes.
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
                      placeholder="Search journal..."
                      value={expJournalSearchQuery}
                      onChange={(e) => setExpJournalSearchQuery(e.target.value)}
                      className="pl-8 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        width: 180,
                        background: "var(--secondary)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        height: 30
                      }}
                    />
                  </div>
                  {/* Expand / Collapse Actions */}
                  <button
                    onClick={() => setExpandedExpJournal(filteredExpJournals.map(l => l.docNumber))}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedExpJournal([])}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* List of expenses journals */}
              <div className="flex flex-col gap-3">
                {filteredExpJournals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No journals match the search criteria.</p>
                  </div>
                ) : (
                  filteredExpJournals.map(rec => {
                    const isExpanded = expandedExpJournal.includes(rec.docNumber);
                    return (
                      <div 
                        key={rec.docNumber}
                        className="rounded-xl overflow-hidden transition-all duration-200" 
                        style={{ 
                          background: "var(--card)", 
                          border: "1px solid var(--border)"
                        }}
                      >
                        <button 
                          className="w-full flex items-center justify-between px-5 py-3 text-left focus:outline-none select-none transition-colors"
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedExpJournal(prev => prev.filter(id => id !== rec.docNumber));
                            } else {
                              setExpandedExpJournal(prev => [...prev, rec.docNumber]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            <div className="flex flex-col min-w-0">
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                                {rec.docNumber}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                                Date: {rec.docDate} • Type: {rec.accountType}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 flex-shrink-0">
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>ACCOUNT CODE</span>
                              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>{rec.accountCode}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>AMOUNT</span>
                              <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>{rec.amountLcl}</span>
                            </div>
                            <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                            {/* Sub Section 1: General Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GENERAL INFORMATION</h4>
                              <Grid3>
                                <ViewField label="Accounting Document Number" value={rec.docNumber} mono />
                                <ViewField label="Accounting Date" value={rec.docDate} mono />
                                <ViewField label="Account Type" value={rec.accountType} />
                                <ViewField label="Item Type" value={rec.itemType} />
                                <ViewField label="Account Group" value={rec.accountGroup} />
                                <ViewField label="Account Class" value={rec.accountClass} />
                                <ViewField label="MIS Grouping" value={rec.misGrouping} />
                              </Grid3>
                            </div>

                            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                            {/* Sub Section 2: Ledger Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>LEDGER INFORMATION</h4>
                              <Grid3>
                                <ViewField label="Ledger Name" value={rec.ledgerName} />
                                <ViewField label="Sub Ledger Name" value={rec.subLedgerName} />
                                <ViewField label="Chart of Accounts (COA)" value={rec.coa} />
                                <ViewField label="Account Code" value={rec.accountCode} mono />
                              </Grid3>
                            </div>

                            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                            {/* Sub Section 3: Financial Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>FINANCIAL INFORMATION</h4>
                              <Grid2>
                                <ViewField label="Amount (Local Currency)" value={rec.amountLcl} mono />
                                <ViewField label="Amount (Transaction Currency)" value={rec.amountTxn} mono />
                              </Grid2>
                            </div>

                            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                            {/* Sub Section 4: Reference Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>REFERENCE INFORMATION</h4>
                              <Grid3>
                                <ViewField label="PO/IP Number" value={rec.poIpNumber} mono />
                                <ViewField label="Item ID" value={rec.itemId} mono />
                                <ViewField label="From Date" value={rec.fromDate} mono />
                                <ViewField label="To Date" value={rec.toDate} mono />
                              </Grid3>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Section 2: Provision Reversal Journal */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                    Provision Reversal Journal ({filteredRevJournals.length} Records)
                  </h3>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                    Reversal accrual mappings and credit notes associated with initial provisions.
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
                      placeholder="Search reversal..."
                      value={revJournalSearchQuery}
                      onChange={(e) => setRevJournalSearchQuery(e.target.value)}
                      className="pl-8 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        width: 180,
                        background: "var(--secondary)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        height: 30
                      }}
                    />
                  </div>
                  {/* Expand / Collapse Actions */}
                  <button
                    onClick={() => setExpandedRevJournal(filteredRevJournals.map(l => l.reversalDocNumber))}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedRevJournal([])}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* List of provision reversals */}
              <div className="flex flex-col gap-3">
                {filteredRevJournals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No reversals match the search criteria.</p>
                  </div>
                ) : (
                  filteredRevJournals.map(rec => {
                    const isExpanded = expandedRevJournal.includes(rec.reversalDocNumber);
                    return (
                      <div 
                        key={rec.reversalDocNumber}
                        className="rounded-xl overflow-hidden transition-all duration-200" 
                        style={{ 
                          background: "var(--card)", 
                          border: "1px solid var(--border)"
                        }}
                      >
                        <button 
                          className="w-full flex items-center justify-between px-5 py-3 text-left focus:outline-none select-none transition-colors"
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedRevJournal(prev => prev.filter(id => id !== rec.reversalDocNumber));
                            } else {
                              setExpandedRevJournal(prev => [...prev, rec.reversalDocNumber]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            <div className="flex flex-col min-w-0">
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                                {rec.reversalDocNumber}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                                Date: {rec.reversalDocDate} • Type: {rec.reversalAccountType}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 flex-shrink-0">
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>ACCOUNT CODE</span>
                              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>{rec.reversalAccountCode}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>AMOUNT</span>
                              <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>{rec.reversalAmountLcl}</span>
                            </div>
                            <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                            {/* Sub Section 1: General Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GENERAL INFORMATION</h4>
                              <Grid3>
                                <ViewField label="Reversal Accounting Document Number" value={rec.reversalDocNumber} mono />
                                <ViewField label="Reversal Accounting Date" value={rec.reversalDocDate} mono />
                                <ViewField label="Reversal Account Type" value={rec.reversalAccountType} />
                                <ViewField label="Reversal Item Type" value={rec.reversalItemType} />
                                <ViewField label="Reversal Account Group" value={rec.reversalAccountGroup} />
                                <ViewField label="Reversal Account Class" value={rec.reversalAccountClass} />
                                <ViewField label="Reversal MIS Grouping" value={rec.reversalMisGrouping} />
                              </Grid3>
                            </div>

                            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                            {/* Sub Section 2: Ledger Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>LEDGER INFORMATION</h4>
                              <Grid3>
                                <ViewField label="Reversal Ledger Name" value={rec.reversalLedgerName} />
                                <ViewField label="Reversal Sub Ledger Name" value={rec.reversalSubLedgerName} />
                                <ViewField label="Chart of Accounts (COA)" value={rec.coa} />
                                <ViewField label="Reversal Account Code" value={rec.reversalAccountCode} mono />
                              </Grid3>
                            </div>

                            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                            {/* Sub Section 3: Financial Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>FINANCIAL INFORMATION</h4>
                              <Grid2>
                                <ViewField label="Reversal Amount (Local Currency)" value={rec.reversalAmountLcl} mono />
                                <ViewField label="Reversal Amount (Transaction Currency)" value={rec.reversalAmountTxn} mono />
                              </Grid2>
                            </div>

                            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                            {/* Sub Section 4: Reference Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>REFERENCE INFORMATION</h4>
                              <Grid3>
                                <ViewField label="PO/IP Number" value={rec.poIpNumber} mono />
                                <ViewField label="Item ID" value={rec.itemId} mono />
                                <ViewField label="From Date" value={rec.fromDate} mono />
                                <ViewField label="To Date" value={rec.toDate} mono />
                              </Grid3>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Section 3: Expenses Amortization Schedule */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                    Expenses Amortization Schedule ({filteredAmortizations.length} Records)
                  </h3>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                    Expense scheduling and depreciation targets structured across unit periods.
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
                      placeholder="Search schedule..."
                      value={amortSearchQuery}
                      onChange={(e) => setAmortSearchQuery(e.target.value)}
                      className="pl-8 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        width: 180,
                        background: "var(--secondary)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        height: 30
                      }}
                    />
                  </div>
                  {/* Expand / Collapse Actions */}
                  <button
                    onClick={() => setExpandedAmort(filteredAmortizations.map(l => l.lineId))}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedAmort([])}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* List of amortization schedules */}
              <div className="flex flex-col gap-3">
                {filteredAmortizations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No amortization records match the search criteria.</p>
                  </div>
                ) : (
                  filteredAmortizations.map(rec => {
                    const isExpanded = expandedAmort.includes(rec.lineId);
                    return (
                      <div 
                        key={rec.lineId}
                        className="rounded-xl overflow-hidden transition-all duration-200" 
                        style={{ 
                          background: "var(--card)", 
                          border: "1px solid var(--border)"
                        }}
                      >
                        <button 
                          className="w-full flex items-center justify-between px-5 py-3 text-left focus:outline-none select-none transition-colors"
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedAmort(prev => prev.filter(id => id !== rec.lineId));
                            } else {
                              setExpandedAmort(prev => [...prev, rec.lineId]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            <span 
                              className="flex items-center justify-center rounded-lg flex-shrink-0 px-2"
                              style={{ 
                                height: 28, 
                                background: "var(--secondary)", 
                                fontSize: 10, 
                                fontWeight: 700, 
                                color: "var(--foreground)", 
                                fontFamily: "var(--font-mono)",
                                border: "1px solid var(--border)"
                              }}
                            >
                              {rec.lineId}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                                {rec.itemName}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                                Item Ref: {rec.poIpItemReference}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 flex-shrink-0">
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>AMORTIZATION DATE</span>
                              <span style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>{rec.amortizationDate}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>BASE VALUE</span>
                              <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>{rec.baseValue}</span>
                            </div>
                            <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                            {/* Sub Section 1: Item Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ITEM INFORMATION</h4>
                              <Grid3>
                                <ViewField label="Line ID" value={rec.lineId} mono />
                                <ViewField label="PO/IP Item Reference" value={rec.poIpItemReference} mono />
                                <ViewField label="Item ID" value={rec.itemId} mono />
                                <ViewField label="Item Name" value={rec.itemName} />
                              </Grid3>
                            </div>

                            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                            {/* Sub Section 2: Schedule Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>SCHEDULE INFORMATION</h4>
                              <Grid3>
                                <ViewField label="From Date" value={rec.fromDate} mono />
                                <ViewField label="To Date" value={rec.toDate} mono />
                                <ViewField label="Unit Period" value={rec.unitPeriod} />
                                <ViewField label="Expense Amortization Date" value={rec.amortizationDate} mono />
                              </Grid3>
                            </div>

                            <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                            {/* Sub Section 3: Financial Information */}
                            <div className="flex flex-col gap-2">
                              <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>FINANCIAL INFORMATION</h4>
                              <Grid2>
                                <ViewField label="Base Value" value={rec.baseValue} mono />
                                <ViewField label="Base Value Per Unit" value={rec.baseValuePerUnit} mono />
                              </Grid2>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── WORKFLOW ─────────────────────────────────────────────────────────── */}
        {activeTab === "Workflow" && (
          <div className="flex flex-col gap-4 animate-fadeIn" style={{ maxWidth: 900 }}>
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  Workflow ({filteredWorkflow.length} Activities)
                </p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  Task statuses and logs for multi-level department routing.
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
                    placeholder="Search activity, status..."
                    value={workflowSearchQuery}
                    onChange={(e) => setWorkflowSearchQuery(e.target.value)}
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
                  onClick={() => setExpandedWorkflow(filteredWorkflow.map(l => l.code))}
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
                  onClick={() => setExpandedWorkflow([])}
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
                
                {/* Edit statuses buttons */}
                {isDraft && (
                  <div className="flex items-center gap-2">
                    {!isEditingWorkflow ? (
                      <button 
                        onClick={() => {
                          setWorkflowDrafts(workflowActivities);
                          setIsEditingWorkflow(true);
                        }} 
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                        style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)", height: 32 }}
                      >
                        <Edit3 size={12} /> Edit Statuses
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setIsEditingWorkflow(false)} 
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                          style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)", height: 32 }}
                        >
                          <X size={12} /> Cancel
                        </button>
                        <button 
                          onClick={() => {
                            setWorkflowActivities(workflowDrafts);
                            setIsEditingWorkflow(false);
                          }} 
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer border"
                          style={{ background: "var(--foreground)", borderColor: "var(--foreground)", color: "var(--background)", height: 32 }}
                        >
                          <Check size={12} /> Save
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* List of workflow activity cards */}
            <div className="flex flex-col gap-3">
              {filteredWorkflow.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No activities match the search criteria.</p>
                </div>
              ) : (
                filteredWorkflow.map(rec => {
                  const isExpanded = expandedWorkflow.includes(rec.code);
                  return (
                    <div 
                      key={rec.code}
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
                            setExpandedWorkflow(prev => prev.filter(id => id !== rec.code));
                          } else {
                            setExpandedWorkflow(prev => [...prev, rec.code]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                          <span 
                            className="flex items-center justify-center rounded-lg flex-shrink-0 px-2"
                            style={{ 
                              height: 28, 
                              background: "var(--secondary)", 
                              fontSize: 10, 
                              fontWeight: 700, 
                              color: "var(--foreground)", 
                              fontFamily: "var(--font-mono)",
                              border: "1px solid var(--border)"
                            }}
                          >
                            {rec.code}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                              {rec.name}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                              Dept: {rec.department}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8 flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>DUE DATE</span>
                            <span style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>{rec.dueDate}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>STATUS</span>
                            <span 
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                              style={{ 
                                fontSize: 11, 
                                fontWeight: 500, 
                                background: "var(--secondary)", 
                                color: statusColor[rec.status] || "var(--foreground)" 
                              }}
                            >
                              <span 
                                className="rounded-full" 
                                style={{ 
                                  width: 5, 
                                  height: 5, 
                                  background: statusColor[rec.status] || "var(--foreground)", 
                                  display: "inline-block" 
                                }} 
                              />
                              {rec.status}
                            </span>
                          </div>
                          <span style={{ color: "var(--muted-foreground)", width: 16, display: "flex", justifySelf: "center" }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Content Section */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)/5" }}>
                          
                          {/* General Information */}
                          <div className="flex flex-col gap-2">
                            <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GENERAL INFORMATION</h4>
                            <Grid3>
                              <ViewField label="LOB" value={rec.lob} />
                              <ViewField label="Activity Code" value={rec.code} mono />
                              <ViewField label="Activity Name" value={rec.name} />
                              <ViewField label="Department" value={rec.department} />
                              <ViewField label="Dependency" value={rec.dependency} />
                            </Grid3>
                          </div>

                          <hr style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                          {/* Workflow Details */}
                          <div className="flex flex-col gap-3">
                            <h4 style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>WORKFLOW DETAILS</h4>
                            <Grid3>
                              <div className="flex flex-col gap-1">
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATUS</span>
                                {isEditingWorkflow && rec.isEditable ? (
                                  <select
                                    value={rec.status}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setWorkflowDrafts(prev => prev.map(p => p.code === rec.code ? { ...p, status: val } : p));
                                    }}
                                    className="px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    style={{
                                      background: "var(--secondary)",
                                      borderColor: "var(--border)",
                                      color: "var(--foreground)",
                                      height: 34,
                                      width: "100%"
                                    }}
                                  >
                                    <option value="Reset">Reset</option>
                                    <option value="Approve">Approve</option>
                                    <option value="Reject">Reject</option>
                                  </select>
                                ) : (
                                  <div className="mt-0.5">
                                    <span 
                                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                                      style={{ 
                                        fontSize: 11, 
                                        fontWeight: 500, 
                                        background: "var(--secondary)", 
                                        color: statusColor[rec.status] || "var(--foreground)" 
                                      }}
                                    >
                                      <span 
                                        className="rounded-full" 
                                        style={{ 
                                          width: 5, 
                                          height: 5, 
                                          background: statusColor[rec.status] || "var(--foreground)", 
                                          display: "inline-block" 
                                        }} 
                                      />
                                      {rec.status}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <ViewField label="Reason" value={rec.reason} />
                              <ViewField label="Due Date" value={rec.dueDate} mono />
                            </Grid3>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
