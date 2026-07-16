// deployment trigger 2026-07-03-v3
import { useState, useEffect, useRef } from "react";
import { FSCPUploadDocumentsModal } from "./fscp/FSCPUploadDocumentsModal";
import { 
  Sparkles, 
  Download, 
  Send, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  FileText, 
  Mail,
  DollarSign,
  ArrowLeftRight,
  Link2,
  BookOpen,
  FileCheck,
  TrendingUp,
  Percent,
  Sliders,
  Activity,
  ChevronRight,
  User,
  Calendar,
  Layers,
  ArrowDown,
  CreditCard,
  Wallet,
  Users,
  Calculator,
  Clock,
  Scale,
  UserCheck,
  History,
  FileSpreadsheet,
  SquareArrowOutUpRight,
  Upload,
  Plus,
  Paperclip
} from "lucide-react";

// Types
export type FSCPIssueType = "No Issue" | "Moderate Issue" | "Close Blocker";
export type FSCPViewMode = "View 1" | "View 2";

export interface CompanyGroup {
  id: string;
  name: string;
  code: string;
  type: string;
  domainsCount: number;
  region: string;
}

const COMPANY_GROUPS: CompanyGroup[] = [
  { id: "global-holdings", name: "Global Holdings Group", code: "GH-001", type: "Global", domainsCount: 6, region: "Global" },
  { id: "north-america", name: "North America Operations", code: "NA-002", type: "Regional", domainsCount: 4, region: "North America" },
  { id: "apac-shared", name: "APAC Shared Services", code: "AP-003", type: "Shared Services", domainsCount: 3, region: "APAC" },
  { id: "europe-finance", name: "Europe Finance Group", code: "EU-004", type: "Regional", domainsCount: 4, region: "Europe" },
  { id: "contoso-mfg", name: "Contoso Manufacturing", code: "CO-005", type: "Operational", domainsCount: 3, region: "North America" },
  { id: "fabrikam-retail", name: "Fabrikam Retail", code: "FR-006", type: "Operational", domainsCount: 2, region: "Global" }
];

export interface TimelineEvent {
  dateLabel: string;
  description: string;
}

export interface FSCPIssue {
  id: string;
  name: string;
  domain: string;
  process: string;
  impact: number;
  type: FSCPIssueType;
  companyCode: string;
  fiscalYear: string;
  period: string;
  assetNumber: string;
  subAssetNumber: string;
  assetDescription: string;
  blockerType: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  reason: string;
  sourceFile: string;
  suggestedAction: string[];
  ownerRole: string;
  status: "Open" | "In Progress" | "Resolved";
  ageingDays: number;
  timeline: TimelineEvent[];
}

const FINANCE_DOMAINS: Record<string, string[]> = {
  "Core Finance": ["General Ledger", "Accounts Payable", "Accounts Receivable", "Fixed Assets", "Bank & Cash"],
  "Transaction Finance": ["Inventory Accounting", "CRM Service & Revenue Operations", "Procure-to-Pay", "Order-to-Cash", "Payroll"],
  "Intercompany Finance": ["Advances, Receivables & Confirmation", "AP Booking", "AR Billing", "AR Confirmation & Reporting", "AR Reconciliation, Confirmation & Reporting", "Cash Applications", "Settlement of AP"],
  "General Accounting": ["Accrual Journals", "Allocations", "Manual Allocations", "MTM & EGA Provisions", "Month-End Close Monitoring", "Other Manual Journals", "P&L Preparation", "P&L Review", "Provision Journals", "Reclass & Recharge Journals", "Revenue Review", "Subledger Close", "Tax Provision Journals"],
  "Reporting & Compliance": ["Balance Sheet Notes / Schedules", "Consolidation Package Corrections", "Consolidation Package Preparation & Upload", "GAAP Adjustments", "Eliminations & Top Entries", "Internal Control Checklists", "Management Sign-Off", "Post-Close Financial Analysis", "Post-Close Reporting"],
  "Financial Planning": ["Final Budget / Forecast Sign-Off", "P&L Budget Preparation", "P&L Budget Review", "P&L Budget Submission", "P&L Re-Forecast", "Revenue Budget Preparation", "Revenue Budget Review", "Revenue Re-Forecast"],
  "Tax & Compliance": ["GST Compliance", "TDS Compliance", "Statutory Returns", "Audit Support", "Tax Provisioning", "Transfer Pricing"],
  "Planning & Control": ["Cost Accounting", "Profit Center Analysis", "FP&A Benchmarking"],
  "Intelligence & Risk": ["Anomaly Detection", "Finance Recovery", "Audit Trail"]
};

const DOMAIN_ICONS: Record<string, React.ComponentType<any>> = {
  "Core Finance": DollarSign,
  "Transaction Finance": ArrowLeftRight,
  "Intercompany Finance": Link2,
  "General Accounting": BookOpen,
  "Reporting & Compliance": FileCheck,
  "Financial Planning": TrendingUp,
  "Tax & Compliance": Percent,
  "Planning & Control": Sliders,
  "Intelligence & Risk": Activity
};

const PROCESS_ICONS: Record<string, React.ComponentType<any>> = {
  // Core Finance
  "General Ledger": BookOpen,
  "Accounts Payable": CreditCard,
  "Accounts Receivable": CreditCard,
  "Fixed Assets": Layers,
  "Bank & Cash": Wallet,

  // Transaction Finance
  "Inventory Accounting": Sliders,
  "CRM Service & Revenue Operations": DollarSign,
  "Procure-to-Pay": ArrowLeftRight,
  "Order-to-Cash": ArrowLeftRight,
  "Payroll": Users,

  // Intercompany Finance
  "Advances, Receivables & Confirmation": Link2,
  "AP Booking": FileCheck,
  "AR Billing": FileCheck,
  "AR Confirmation & Reporting": FileCheck,
  "AR Reconciliation, Confirmation & Reporting": FileCheck,
  "Cash Applications": DollarSign,
  "Settlement of AP": CreditCard,

  // General Accounting
  "Accrual Journals": BookOpen,
  "Allocations": Calculator,
  "Manual Allocations": Calculator,
  "Month-End Close Monitoring": Clock,
  "P&L Preparation": FileSpreadsheet,
  "P&L Review": FileSpreadsheet,

  // Reporting & Compliance
  "Balance Sheet Notes / Schedules": FileSpreadsheet,
  "GAAP Adjustments": Scale,
  "Eliminations & Top Entries": FileCheck,
  "Internal Control Checklists": FileCheck,
  "Management Sign-Off": UserCheck,

  // Financial Planning
  "Final Budget / Forecast Sign-Off": UserCheck,
  "P&L Budget Preparation": TrendingUp,

  // Tax & Compliance
  "GST Compliance": Scale,
  "TDS Compliance": Scale,
  "Statutory Returns": FileCheck,
  "Audit Support": Scale,

  // Planning & Control
  "Cost Accounting": Calculator,
  "Profit Center Analysis": TrendingUp,

  // Intelligence & Risk
  "Anomaly Detection": AlertTriangle,
  "Finance Recovery": Activity,
  "Audit Trail": History
};


const getActionTypes = (process: string): string[] => {
  if (process.includes("Asset")) {
    return ["Asset Tag Update", "Physical Inventory Audit", "Ledger Correction", "Depreciation Re-run"];
  } else if (process.includes("Payable") || process.includes("AP") || process.includes("Procure")) {
    return ["PO Matching Review", "Supplier Dispute Log", "Payment Release", "Vendor Account Hold"];
  } else if (process.includes("Receivable") || process.includes("AR") || process.includes("Order")) {
    return ["Credit Note Issue", "Customer Remittance Match", "Dispute Resolution", "Invoice Re-send"];
  } else if (process.includes("Bank") || process.includes("Cash") || process.includes("Settlement")) {
    return ["Reconcile Bank Transactions", "Review Cash Application", "Verify Conversion Rates", "Adjust Bank Fees"];
  } else {
    return ["Master Data Correction", "Manual Reconciliation", "Manager Sign-Off", "Accrual Adjusted"];
  }
};

const detailsOwner = (process: string) => {
  if (process.includes("Asset")) return "Fixed Asset Lead";
  if (process.includes("Payable") || process.includes("AP")) return "AP Supervisor";
  if (process.includes("Receivable") || process.includes("AR")) return "AR Supervisor";
  return "General Accounting Lead";
};

// Target Issue count configurations per request.
// Configured to ensure some domains and some business processes are completely empty (0 issues),
// allowing View 2 ("Exceptions Only") to filter them out accurately.
const PROCESS_COUNTS: Record<string, number> = {
  // Core Finance (AR is empty)
  "General Ledger": 6,
  "Accounts Payable": 8,
  "Accounts Receivable": 0,
  "Fixed Assets": 7,
  "Bank & Cash": 4,

  // Transaction Finance (CRM, Order-to-Cash, Payroll are empty)
  "Inventory Accounting": 5,
  "CRM Service & Revenue Operations": 0,
  "Procure-to-Pay": 4,
  "Order-to-Cash": 0,
  "Payroll": 0,

  // Intercompany Finance (only AP Booking and AR Billing have issues)
  "AP Booking": 4,
  "AR Billing": 5,
  "Advances, Receivables & Confirmation": 0,
  "AR Confirmation & Reporting": 0,
  "AR Reconciliation, Confirmation & Reporting": 0,
  "Cash Applications": 0,
  "Settlement of AP": 0,

  // General Accounting (only Allocations, Manual Allocations, P&L Prep have issues)
  "Allocations": 6,
  "Manual Allocations": 5,
  "P&L Preparation": 8,
  "Accrual Journals": 0,
  "MTM & EGA Provisions": 0,
  "Month-End Close Monitoring": 0,
  "Other Manual Journals": 0,
  "P&L Review": 0,
  "Provision Journals": 0,
  "Reclass & Recharge Journals": 0,
  "Revenue Review": 0,
  "Subledger Close": 0,
  "Tax Provision Journals": 0,

  // Reporting & Compliance (only GAAP Adjustments has issues)
  "GAAP Adjustments": 4,
  "Balance Sheet Notes / Schedules": 0,
  "Consolidation Package Corrections": 0,
  "Consolidation Package Preparation & Upload": 0,
  "Eliminations & Top Entries": 0,
  "Internal Control Checklists": 0,
  "Management Sign-Off": 0,
  "Post-Close Financial Analysis": 0,
  "Post-Close Reporting": 0,

  // Financial Planning (Entire Domain is empty)
  "Final Budget / Forecast Sign-Off": 0,
  "P&L Budget Preparation": 0,
  "P&L Budget Review": 0,
  "P&L Budget Submission": 0,
  "P&L Re-Forecast": 0,
  "Revenue Budget Preparation": 0,
  "Revenue Budget Review": 0,
  "Revenue Re-Forecast": 0,

  // Tax & Compliance (Entire Domain is empty)
  "GST Compliance": 0,
  "TDS Compliance": 0,
  "Statutory Returns": 0,
  "Audit Support": 0,
  "Tax Provisioning": 0,
  "Transfer Pricing": 0,

  // Planning & Control (only Cost Accounting has issues)
  "Cost Accounting": 4,
  "Profit Center Analysis": 0,
  "FP&A Benchmarking": 0,

  // Intelligence & Risk (Entire Domain is empty)
  "Anomaly Detection": 0,
  "Finance Recovery": 0,
  "Audit Trail": 0
};

// Dynamic Mock Issue Generator
const generateMockIssues = (): FSCPIssue[] => {
  const list: FSCPIssue[] = [];
  const companyCodes = ["US01", "EU02", "IN02", "APAC09", "UK03"];
  const severities = ["Critical" as const, "High" as const, "Medium" as const, "Low" as const];
  const types: FSCPIssueType[] = ["Close Blocker", "Moderate Issue", "No Issue"];

  const getProcessDetails = (process: string, index: number, type: FSCPIssueType) => {
    const apNames = [
      "Duplicate Vendor Invoice Posted",
      "Stale Purchase Order Outstanding Balance",
      "AP Invoice Price Variance Limit Exceeded",
      "Unmatched Freight Expense Accrual",
      "Vendor Profile Bank Data Discrepancy",
      "High Value Material Receipt Missing Inbound Voucher",
      "AP Payment Run Bank Discrepancy",
      "Overdue Supplier Liability Aging Block"
    ];
    const faNames = [
      "Asset Acquisition Depreciation Mismatch",
      "HQ Hardware Server Blade Unposted Retirement",
      "Munich Hub Capitalized Lease Valuation Variance",
      "Impairment Adjustment Journal Blocked",
      "Fixed Asset Disposal Calculation Discrepancy",
      "Asset Useful Life Classification Error",
      "Unmatched CIP Balance in Capital Projects",
      "Asset Cost Pool Allocation Difference",
      "Tax vs Book Depreciation Variance"
    ];
    const glNames = [
      "Month-end Consolidation Rate Mismatch",
      "Manual Accrual Rule Misalignment",
      "Subledger Balance Sync Failure",
      "Unposted Corporate Allocations Entry",
      "Trial Balance Account Mapping Exception",
      "Consolidation Elimination Entry Deficit",
      "Intercompany Balance Discrepancy"
    ];
    const bcNames = [
      "Chase Operating Account Balance Discrepancy",
      "Wire Transfer Clearing Synch Delay",
      "Foreign Cash Translation Difference",
      "Stale Outbound Check Listing Out-of-Sync",
      "Cash Ledger Posting Rule Violation",
      "Bank Charge Fee Verification Variance",
      "Lockbox Cash Application Variance"
    ];
    const arNames = [
      "Unallocated Customer Collections Cash Match",
      "Billing Dispute Credit Note Hold",
      "Stale Customer Debit Invoice Validation Failure",
      "Bad Debt Reserve Allocation Variance",
      "Credit Limit Limit Exceeded Authorization Variance"
    ];
    const invNames = [
      "Inventory WMS to GL Sync Variance",
      "Finished Goods Write-Down Adjustment Lock",
      "Standard Cost Rollup Calculation Exception",
      "Physical Count Valuation Variance",
      "Consigned Stock Balance Discrepancy"
    ];

    let name = `${process} Verification Exception #${index}`;
    let reason = `Standard month-end check flagged discrepancy #${index} in ${process} transaction logs.`;
    let suggestedAction = ["Correct master data", "Review allocation drivers", "Re-run validations."];
    let blockerType = "Closing Discrepancy";
    let ownerRole = "General Accounting Lead";

    if (process.includes("Asset")) {
      const idx = (index - 1) % faNames.length;
      name = faNames[idx];
      reason = `Depreciation subledger runs do not align with asset register records for line item #${index} due to unposted capital changes.`;
      suggestedAction = ["Update asset master information", "Complete retirement posting", "Validate the physical existence of the asset."];
      blockerType = "Depreciation Variance";
      ownerRole = "Fixed Asset Lead";
    } else if (process.includes("Payable") || process.includes("AP") || process.includes("Procure")) {
      const idx = (index - 1) % apNames.length;
      name = apNames[idx];
      reason = `Three-way matching process locked transaction voucher #${index} due to shipping rate variances between purchase order and supplier statement.`;
      suggestedAction = ["Verify three-way match", "Validate supplier confirmation", "Hold unapproved payment batch."];
      blockerType = "Three-way Match Error";
      ownerRole = "AP Supervisor";
    } else if (process.includes("Receivable") || process.includes("AR") || process.includes("Order")) {
      const idx = (index - 1) % arNames.length;
      name = arNames[idx];
      reason = `Subledger reconciliation identified unmatched cash allocations on account entry #${index} from local collections.`;
      suggestedAction = ["Reconcile customer collections", "Issue billing dispute credit note", "Check invoice delivery status."];
      blockerType = "Receivables Variance";
      ownerRole = "AR Supervisor";
    } else if (process.includes("Bank") || process.includes("Cash") || process.includes("Settlement")) {
      const idx = (index - 1) % bcNames.length;
      name = bcNames[idx];
      reason = `Reconciliation balance variance found between subledger cash account and banking report #${index}.`;
      suggestedAction = ["Reconcile bank transactions", "Review ledger cash applications", "Verify currency translation rates."];
      blockerType = "Cash Book Variance";
      ownerRole = "Treasury Manager";
    } else if (process.includes("General Ledger") || process.includes("Accrual") || process.includes("Allocation")) {
      const idx = (index - 1) % glNames.length;
      name = glNames[idx];
      reason = `Re-run checks failed for general ledger adjustments #${index} due to inactive profit centers reference codes.`;
      suggestedAction = ["Correct master data", "Review manual journal allocation drivers", "Re-run consolidation package checks."];
      blockerType = "Closing Discrepancy";
      ownerRole = "General Accounting Lead";
    } else if (process.includes("Inventory")) {
      const idx = (index - 1) % invNames.length;
      name = invNames[idx];
      reason = `Inventory ledger variance detected in warehouse balance upload v${index} compared to general ledger totals.`;
      suggestedAction = ["Verify inventory cost rollup", "Update warehouse ledger costings", "Complete write-down adjustment."];
      blockerType = "Inventory Valuation mismatch";
      ownerRole = "Inventory Controller";
    }

    return { name, reason, suggestedAction, blockerType, ownerRole };
  };

  Object.keys(FINANCE_DOMAINS).forEach((domain) => {
    FINANCE_DOMAINS[domain].forEach((process) => {
      let numIssues = 4; // default
      if (PROCESS_COUNTS[process] !== undefined) {
        numIssues = PROCESS_COUNTS[process];
      } else {
        // Natural variation count
        numIssues = (process.length % 3) + 4; // 4, 5, or 6
      }

      if (numIssues === 0) return;

      types.forEach((type, typeIdx) => {
        for (let i = 1; i <= numIssues; i++) {
          const details = getProcessDetails(process, i, type);
          const typeOffset = type === "Close Blocker" ? 1 : type === "Moderate Issue" ? 3 : 0;
          const processSalt = process.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const codeIdx = (i + typeOffset + processSalt) % companyCodes.length;

          list.push({
            id: `${type === "Close Blocker" ? "BLK" : type === "Moderate Issue" ? "MOD" : "OK"}-${process.substring(0, 3).toUpperCase()}-2026-${type.substring(0, 2).toUpperCase()}-${String(i).padStart(2, '0')}`,
            name: type === "No Issue" ? `${process} Balanced Ledger Verification #${i}` : details.name,
            domain,
            process,
            impact: type === "No Issue" ? 0 : Math.floor(15000 + Math.random() * (type === "Close Blocker" ? 420000 : 70000) + (i * 6500)),
            type,
            companyCode: companyCodes[codeIdx],
            fiscalYear: "2026",
            period: "P06",
            assetNumber: `DOC-${type.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000 + (i * 12))}`,
            subAssetNumber: type === "Close Blocker" ? "0000" : "N/A",
            assetDescription: `${process} transaction ledger balance audit #${i}`,
            blockerType: type === "No Issue" ? "None" : details.blockerType,
            severity: type === "Close Blocker" ? (i % 2 === 0 ? "Critical" : "High") : type === "Moderate Issue" ? "Medium" : "Low",
            reason: type === "No Issue" ? `Trial balance confirmation for ${process} completed validation check #${i}.` : details.reason,
            sourceFile: `${process.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${type.toLowerCase().substring(0, 3)}_june_${i}.xlsx`,
            suggestedAction: type === "No Issue" ? ["No actions required."] : details.suggestedAction,
            ownerRole: details.ownerRole,
            status: type === "No Issue" ? "Resolved" : "Open",
            ageingDays: type === "No Issue" ? 1 : Math.floor(3 + Math.random() * 12 + i),
            timeline: type === "No Issue" ? [
              { dateLabel: "3 days ago", description: "Standard balance validation completed" },
              { dateLabel: "2 days ago", description: "Discrepancy resolved successfully" }
            ] : [
              { dateLabel: "3 days ago", description: `${type} detected in source ledger` },
              { dateLabel: "2 days ago", description: "AI recommendation checklist generated" },
              { dateLabel: "Yesterday", description: "Status initialized as Open" }
            ]
          });
        }
      });
    });
  });

  return list;
};

const INITIAL_ISSUES: FSCPIssue[] = generateMockIssues();
class LocalIssueRepository {
  private subscribers: Set<(issues: FSCPIssue[]) => void> = new Set();
  private storageKey = "fscp_issues";

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === this.storageKey && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notify(parsed);
          } catch (err) {
            console.error("Failed to parse issues from storage event:", err);
          }
        }
      });
    }
  }

  loadIssues(): FSCPIssue[] {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored issues:", e);
      }
    }
    const initial = INITIAL_ISSUES;
    localStorage.setItem(this.storageKey, JSON.stringify(initial));
    return initial;
  }

  saveIssues(issues: FSCPIssue[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(issues));
    this.notify(issues);
  }

  subscribe(callback: (issues: FSCPIssue[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(issues: FSCPIssue[]): void {
    this.subscribers.forEach((cb) => cb(issues));
  }
}

export const IssueRepository = new LocalIssueRepository();


export interface InvestigationStageConfig {
  id: string;
  stageTitle: string;
  description: string;
  icon: any;
  columns: { key: string; label: string; type?: 'text' | 'currency' | 'number' | 'status'; align?: 'left' | 'right' | 'center' }[];
  searchFields: string[];
  filters: { label: string; key: string; options: string[] }[];
  defaultSort: { key: string; direction: 'asc' | 'desc' };
  exportFilename: string;
  emptyStateMessage: string;
  totalRecords: number;
  breadcrumbField: string;
}

export interface DetailedRecordsColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  type?: "text" | "number" | "currency" | "status";
}

export interface DetailedRecordMock {
  [key: string]: any;
}

export interface InvestigationConfig {
  processName: string;
  workspaceTitle: string;
  detailedRecordsTitle: string;
  detailedRecordsColumns: DetailedRecordsColumn[];
  detailedRecordsMockData: DetailedRecordMock[];
  stages: InvestigationStageConfig[];
}

export const INVESTIGATION_CONFIGS: Record<string, InvestigationConfig> = {
  "Fixed Assets": {
    processName: "Fixed Assets",
    workspaceTitle: "Capitalization Delay Review",
    detailedRecordsTitle: "Asset Line Items",
    detailedRecordsColumns: [
      { key: "tag", label: "Asset Tag" },
      { key: "name", label: "Asset Name" },
      { key: "life", label: "Useful Life (Yrs)", type: "number" },
      { key: "method", label: "Method" },
      { key: "value", label: "Net Value", align: "right", type: "currency" }
    ],
    detailedRecordsMockData: [
      { tag: "AST-0012", name: "Server Blade #12", life: 5, method: "Straight Line", value: 24000 },
      { tag: "AST-0013", name: "Generator #13", life: 7, method: "MACRS", value: 85000 },
      { tag: "AST-0014", name: "HVAC System #14", life: 10, method: "Double Declining", value: 110000 }
    ],
    stages: [
      {
        id: "companies",
        stageTitle: "LOB Units / Branch",
        description: "Review LOB units and branches impacted by capitalization delays or retirement variances.",
        icon: Layers,
        columns: [
          { key: "Company", label: "LOB Unit / Branch", type: "text" },
          { key: "Location", label: "Headquarters", type: "text" },
          { key: "Issue Count", label: "Issues", type: "number" },
          { key: "Financial Impact", label: "Financial Impact", type: "currency", align: "right" },
          { key: "Status", label: "Status", type: "status" }
        ],
        searchFields: ["Company", "Location"],
        filters: [
          { label: "Region", key: "Region", options: ["All Regions", "North America", "Europe", "Asia-Pacific", "South America"] },
          { label: "Company Type", key: "Company Type", options: ["All Types", "Subsidiary", "Parent", "Joint Venture", "Branch"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_FixedAssets_Companies",
        emptyStateMessage: "No affected companies matched your filters.",
        totalRecords: 5000,
        breadcrumbField: "Company"
      },
      {
        id: "warehouses",
        stageTitle: "Warehouses",
        description: "Drill down to physical locations housing capital assets and equipment inventory.",
        icon: Sliders,
        columns: [
          { key: "Warehouse", label: "Warehouse", type: "text" },
          { key: "Location", label: "Zone/Area", type: "text" },
          { key: "Issue Count", label: "Active Disputes", type: "number" },
          { key: "Financial Impact", label: "Book Value Impact", type: "currency", align: "right" },
          { key: "Status", label: "Status", type: "status" }
        ],
        searchFields: ["Warehouse", "Location"],
        filters: [
          { label: "Location", key: "Location", options: ["All Locations", "US East", "EU Central", "APAC South", "UK West"] },
          { label: "Warehouse Type", key: "Warehouse Type", options: ["All Types", "Distribution Center", "Cold Storage", "Fulfillment", "Cross-Dock"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_FixedAssets_Warehouses",
        emptyStateMessage: "No warehouses found matching search criteria.",
        totalRecords: 2000,
        breadcrumbField: "Warehouse"
      },
      {
        id: "categories",
        stageTitle: "Asset Categories",
        description: "Select asset classification tags to isolate capitalization or useful life errors.",
        icon: Layers,
        columns: [
          { key: "Category", label: "Asset Category", type: "text" },
          { key: "Issue Count", label: "Anomalies", type: "number" },
          { key: "Financial Impact", label: "Depreciation Impact", type: "currency", align: "right" }
        ],
        searchFields: ["Category"],
        filters: [
          { label: "Asset Class", key: "Asset Class", options: ["All Classes", "Machinery", "Equipment", "Vehicles", "Buildings"] },
          { label: "Depreciation Method", key: "Depreciation Method", options: ["All Methods", "Straight Line", "Double Declining", "MACRS"] }
        ],
        defaultSort: { key: "Issue Count", direction: "desc" },
        exportFilename: "FSCP_FixedAssets_Categories",
        emptyStateMessage: "No asset categories match your filter criteria.",
        totalRecords: 10000,
        breadcrumbField: "Category"
      }
    ]
  },
  "Accounts Payable": {
    processName: "Accounts Payable",
    workspaceTitle: "Invoice Discrepancies",
    detailedRecordsTitle: "Invoice Line Items",
    detailedRecordsColumns: [
      { key: "lineItem", label: "Line Item" },
      { key: "desc", label: "Description" },
      { key: "qty", label: "Qty", type: "number" },
      { key: "rate", label: "Unit Rate", align: "right", type: "currency" },
      { key: "amount", label: "Extended Amount", align: "right", type: "currency" }
    ],
    detailedRecordsMockData: [
      { lineItem: "Item Inspection Charges", desc: "Mock description for line entry detail #1", qty: 1, rate: 120, amount: 120 },
      { lineItem: "Maintenance Fee", desc: "Mock description for line entry detail #2", qty: 2, rate: 150, amount: 300 },
      { lineItem: "Freight Overcharge", desc: "Mock description for line entry detail #3", qty: 1, rate: 45, amount: 45 }
    ],
    stages: [
      {
        id: "companies",
        stageTitle: "LOB Units / Branch",
        description: "Select LOB units and branches experiencing vendor liability matching disputes.",
        icon: Layers,
        columns: [
          { key: "Company", label: "LOB Unit / Branch", type: "text" },
          { key: "Location", label: "Region", type: "text" },
          { key: "Issue Count", label: "Open Issues", type: "number" },
          { key: "Financial Impact", label: "Outstanding Liability", type: "currency", align: "right" }
        ],
        searchFields: ["Company", "Location"],
        filters: [
          { label: "Region", key: "Region", options: ["All Regions", "North America", "Europe", "Asia-Pacific"] },
          { label: "Company Type", key: "Company Type", options: ["All Types", "Subsidiary", "Parent", "Joint Venture"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_AP_Companies",
        emptyStateMessage: "No companies found.",
        totalRecords: 5000,
        breadcrumbField: "Company"
      },
      {
        id: "vendors",
        stageTitle: "Vendors",
        description: "Analyze supplier records with pending invoice or bank profile hold discrepancies.",
        icon: User,
        columns: [
          { key: "Vendor", label: "Supplier / Vendor", type: "text" },
          { key: "Business Unit", label: "Purchasing BU", type: "text" },
          { key: "Issue Count", label: "Pending Vouchers", type: "number" },
          { key: "Financial Impact", label: "Disputed Amount", type: "currency", align: "right" }
        ],
        searchFields: ["Vendor", "Business Unit"],
        filters: [
          { label: "Vendor Status", key: "Vendor Status", options: ["All Statuses", "Active", "On Hold", "Preferred"] },
          { label: "Payment Terms", key: "Payment Terms", options: ["All Terms", "Net 30", "Net 60", "Due on Receipt"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_AP_Vendors",
        emptyStateMessage: "No vendors match the search query.",
        totalRecords: 4500,
        breadcrumbField: "Vendor"
      },
      {
        id: "invoices",
        stageTitle: "Invoices",
        description: "Review individual disputed invoices held due to price or quantity matching limits.",
        icon: FileSpreadsheet,
        columns: [
          { key: "Invoice", label: "Invoice Number", type: "text" },
          { key: "Date", label: "Invoice Date", type: "text" },
          { key: "Ageing", label: "Hold Duration", type: "text" },
          { key: "Financial Impact", label: "Invoice Value", type: "currency", align: "right" }
        ],
        searchFields: ["Invoice"],
        filters: [
          { label: "Invoice Date", key: "Invoice Date", options: ["All Dates", "June 2026", "May 2026", "Q2 2026"] },
          { label: "Status", key: "Status", options: ["All Statuses", "Open", "On Hold", "Approved"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_AP_Invoices",
        emptyStateMessage: "No invoices match the filters.",
        totalRecords: 12000,
        breadcrumbField: "Invoice"
      }
    ]
  },
  "Accounts Receivable": {
    processName: "Accounts Receivable",
    workspaceTitle: "Disputed Customer Vouchers",
    detailedRecordsTitle: "Invoice Line Items",
    detailedRecordsColumns: [
      { key: "lineItem", label: "Line Item" },
      { key: "desc", label: "Description" },
      { key: "qty", label: "Qty", type: "number" },
      { key: "rate", label: "Unit Rate", align: "right", type: "currency" },
      { key: "amount", label: "Extended Amount", align: "right", type: "currency" }
    ],
    detailedRecordsMockData: [
      { lineItem: "Item Inspection Charges", desc: "Mock description for line entry detail #1", qty: 1, rate: 120, amount: 120 },
      { lineItem: "Maintenance Fee", desc: "Mock description for line entry detail #2", qty: 2, rate: 150, amount: 300 },
      { lineItem: "Freight Overcharge", desc: "Mock description for line entry detail #3", qty: 1, rate: 45, amount: 45 }
    ],
    stages: [
      {
        id: "companies",
        stageTitle: "LOB Units / Branch",
        description: "Identify LOB units and branches experiencing unallocated cash or customer disputes.",
        icon: Layers,
        columns: [
          { key: "Company", label: "LOB Unit / Branch", type: "text" },
          { key: "Location", label: "Region", type: "text" },
          { key: "Issue Count", label: "Disputes", type: "number" },
          { key: "Financial Impact", label: "Aging Receivable", type: "currency", align: "right" }
        ],
        searchFields: ["Company", "Location"],
        filters: [
          { label: "Region", key: "Region", options: ["All Regions", "North America", "Europe", "Asia-Pacific"] },
          { label: "Company Type", key: "Company Type", options: ["All Types", "Subsidiary", "Parent", "Joint Venture"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_AR_Companies",
        emptyStateMessage: "No companies found.",
        totalRecords: 5000,
        breadcrumbField: "Company"
      },
      {
        id: "customers",
        stageTitle: "Customers",
        description: "Analyze customer accounts with pending collection allocations.",
        icon: User,
        columns: [
          { key: "Customer", label: "Customer Name", type: "text" },
          { key: "Region", label: "Sales Region", type: "text" },
          { key: "Issue Count", label: "Unapplied Receipts", type: "number" },
          { key: "Financial Impact", label: "Unallocated Balance", type: "currency", align: "right" }
        ],
        searchFields: ["Customer", "Region"],
        filters: [
          { label: "Risk Level", key: "Risk Level", options: ["All Risks", "High", "Medium", "Low"] },
          { label: "Industry", key: "Industry", options: ["All Industries", "Technology", "Retail", "Manufacturing", "Healthcare"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_AR_Customers",
        emptyStateMessage: "No customers match the query.",
        totalRecords: 6000,
        breadcrumbField: "Customer"
      },
      {
        id: "invoices",
        stageTitle: "Invoices",
        description: "View customer invoice registers awaiting remittance advice matches.",
        icon: FileSpreadsheet,
        columns: [
          { key: "Invoice", label: "Invoice ID", type: "text" },
          { key: "Date", label: "Due Date", type: "text" },
          { key: "Ageing", label: "Overdue Ageing", type: "text" },
          { key: "Financial Impact", label: "Amount Due", type: "currency", align: "right" }
        ],
        searchFields: ["Invoice"],
        filters: [
          { label: "Invoice Date", key: "Invoice Date", options: ["All Dates", "June 2026", "May 2026", "Q2 2026"] },
          { label: "Status", key: "Status", options: ["All Statuses", "Open", "Overdue", "Paid"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_AR_Invoices",
        emptyStateMessage: "No matching invoices found.",
        totalRecords: 12000,
        breadcrumbField: "Invoice"
      }
    ]
  },
  "General Ledger": {
    processName: "General Ledger",
    workspaceTitle: "Accrual & Allocation Adjustments",
    detailedRecordsTitle: "Journal Entry Lines",
    detailedRecordsColumns: [
      { key: "acct", label: "Account" },
      { key: "name", label: "Account Name" },
      { key: "desc", label: "Description" },
      { key: "debit", label: "Debit", align: "right" },
      { key: "credit", label: "Credit", align: "right" }
    ],
    detailedRecordsMockData: [
      { acct: "11000", name: "Cash Ledger", desc: "Allocation adjustments #1", debit: "$45,000.00", credit: "-" },
      { acct: "21000", name: "Trade Payables", desc: "Allocation adjustments #2", debit: "-", credit: "$45,000.00" }
    ],
    stages: [
      {
        id: "companies",
        stageTitle: "LOB Units / Branch",
        description: "Identify LOB units and branches with manual allocation entry or rate translation issues.",
        icon: Layers,
        columns: [
          { key: "Company", label: "LOB Unit / Branch", type: "text" },
          { key: "Location", label: "Region", type: "text" },
          { key: "Issue Count", label: "Ledger Alerts", type: "number" },
          { key: "Financial Impact", label: "Total Exposure", type: "currency", align: "right" }
        ],
        searchFields: ["Company", "Location"],
        filters: [
          { label: "Region", key: "Region", options: ["All Regions", "North America", "Europe", "Asia-Pacific"] },
          { label: "Company Type", key: "Company Type", options: ["All Types", "Subsidiary", "Parent", "Joint Venture"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_GL_Companies",
        emptyStateMessage: "No entities found.",
        totalRecords: 3000,
        breadcrumbField: "Company"
      },
      {
        id: "business_units",
        stageTitle: "Business Units",
        description: "Drill into regional cost segments and corporate reporting entities.",
        icon: Sliders,
        columns: [
          { key: "Business Unit", label: "Business Unit", type: "text" },
          { key: "Issue Count", label: "Unposted Entries", type: "number" },
          { key: "Financial Impact", label: "Allocation Variance", type: "currency", align: "right" }
        ],
        searchFields: ["Business Unit"],
        filters: [
          { label: "Unit Type", key: "Unit Type", options: ["All Types", "Division", "Subsidiary", "Branch"] },
          { label: "Operating Region", key: "Operating Region", options: ["All Regions", "Domestic", "International"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_GL_BusinessUnits",
        emptyStateMessage: "No business units match criteria.",
        totalRecords: 400,
        breadcrumbField: "Business Unit"
      },
      {
        id: "cost_centers",
        stageTitle: "Cost Centers",
        description: "Select cost centers containing misaligned manual accrual journals.",
        icon: Activity,
        columns: [
          { key: "Cost Center", label: "Cost Center", type: "text" },
          { key: "Issue Count", label: "Blocked Items", type: "number" },
          { key: "Financial Impact", label: "Reclass Amount", type: "currency", align: "right" }
        ],
        searchFields: ["Cost Center"],
        filters: [
          { label: "Department", key: "Department", options: ["All Departments", "Administration", "Operations", "R&D", "Sales"] },
          { label: "CC Status", key: "CC Status", options: ["All Statuses", "Active", "Inactive"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_GL_CostCenters",
        emptyStateMessage: "No cost centers found.",
        totalRecords: 1500,
        breadcrumbField: "Cost Center"
      },
      {
        id: "accounts",
        stageTitle: "GL Accounts",
        description: "Review standard trial balance accounts for consolidation mismatches.",
        icon: Scale,
        columns: [
          { key: "GL Account", label: "General Ledger Account", type: "text" },
          { key: "Financial Impact", label: "Ledger Value", type: "currency", align: "right" },
          { key: "Status", label: "Status", type: "status" }
        ],
        searchFields: ["GL Account"],
        filters: [
          { label: "Account Class", key: "Account Class", options: ["All Classes", "Assets", "Liabilities", "Equity", "Revenue", "Expenses"] },
          { label: "Status", key: "Status", options: ["All Statuses", "Active", "Suspended"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_GL_Accounts",
        emptyStateMessage: "No general ledger accounts match your filters.",
        totalRecords: 8000,
        breadcrumbField: "GL Account"
      }
    ]
  },
  "Bank & Cash": {
    processName: "Bank & Cash",
    workspaceTitle: "Bank Reconciliation & Cash Applications",
    detailedRecordsTitle: "Statement Lines",
    detailedRecordsColumns: [
      { key: "date", label: "Date" },
      { key: "desc", label: "Description" },
      { key: "ref", label: "Reference" },
      { key: "withdrawal", label: "Withdrawal", align: "right" },
      { key: "deposit", label: "Deposit", align: "right" }
    ],
    detailedRecordsMockData: [
      { date: "2026-06-15", desc: "ACH Payment clearing #1", ref: "REF-98721", withdrawal: "-", deposit: "$12,500.00" },
      { date: "2026-06-16", desc: "Bank processing fees", ref: "REF-44211", withdrawal: "$150.00", deposit: "-" }
    ],
    stages: [
      {
        id: "companies",
        stageTitle: "LOB Units / Branch",
        description: "Select LOB units and branches experiencing currency translation or bank ledger discrepancies.",
        icon: Layers,
        columns: [
          { key: "Company", label: "LOB Unit / Branch", type: "text" },
          { key: "Location", label: "HQ", type: "text" },
          { key: "Issue Count", label: "Variance Alerts", type: "number" },
          { key: "Financial Impact", label: "Translation Impact", type: "currency", align: "right" }
        ],
        searchFields: ["Company", "Location"],
        filters: [
          { label: "Region", key: "Region", options: ["All Regions", "North America", "Europe", "Asia-Pacific"] },
          { label: "Company Type", key: "Company Type", options: ["All Types", "Subsidiary", "Parent", "Joint Venture"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_BankCash_Companies",
        emptyStateMessage: "No companies found.",
        totalRecords: 1200,
        breadcrumbField: "Company"
      },
      {
        id: "bank_accounts",
        stageTitle: "Bank Accounts",
        description: "Reconcile individual general ledger cash balance statements to bank feeds.",
        icon: Wallet,
        columns: [
          { key: "ID", label: "Account Number", type: "text" },
          { key: "Location", label: "Clearing Institution", type: "text" },
          { key: "Ageing", label: "Unmatched Ageing", type: "text" },
          { key: "Financial Impact", label: "Statement Variance", type: "currency", align: "right" }
        ],
        searchFields: ["ID", "Location"],
        filters: [
          { label: "Account Type", key: "Account Type", options: ["All Types", "Operating", "Savings", "Clearing", "Payroll"] },
          { label: "Currency", key: "Currency", options: ["All Currencies", "USD", "EUR", "INR", "GBP"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_BankCash_Accounts",
        emptyStateMessage: "No bank accounts found matching criteria.",
        totalRecords: 80,
        breadcrumbField: "ID"
      }
    ]
  },
  "Inventory Accounting": {
    processName: "Inventory Accounting",
    workspaceTitle: "Inventory Stock Valuation Review",
    detailedRecordsTitle: "Material Line Items",
    detailedRecordsColumns: [
      { key: "sku", label: "SKU ID" },
      { key: "name", label: "Material Name" },
      { key: "qty", label: "Stock Qty", type: "number" },
      { key: "uom", label: "UOM" },
      { key: "variance", label: "Valuation Diff", align: "right", type: "currency" }
    ],
    detailedRecordsMockData: [
      { sku: "MAT-0008", name: "Aluminum Ingot 6061", qty: 250, uom: "units", variance: 15200 },
      { sku: "MAT-0009", name: "Polyethylene Roll", qty: 400, uom: "meters", variance: 8400 }
    ],
    stages: [
      {
        id: "companies",
        stageTitle: "LOB Units / Branch",
        description: "Select LOB units and branches experiencing balance variance discrepancy blocks.",
        icon: Layers,
        columns: [
          { key: "Company", label: "LOB Unit / Branch", type: "text" },
          { key: "Location", label: "HQ Location", type: "text" },
          { key: "Issue Count", label: "Active Issues", type: "number" },
          { key: "Financial Impact", label: "Exposure Amount", type: "currency", align: "right" }
        ],
        searchFields: ["Company", "Location"],
        filters: [
          { label: "Region", key: "Region", options: ["All Regions", "North America", "Europe", "Asia-Pacific"] },
          { label: "Company Type", key: "Company Type", options: ["All Types", "Subsidiary", "Parent", "Joint Venture"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_Inventory_Companies",
        emptyStateMessage: "No companies match the filters.",
        totalRecords: 5000,
        breadcrumbField: "Company"
      },
      {
        id: "warehouses",
        stageTitle: "Warehouses",
        description: "Drill into distribution centers with WMS to ledger balance variances.",
        icon: Sliders,
        columns: [
          { key: "Warehouse", label: "Warehouse", type: "text" },
          { key: "Location", label: "Zone/Area", type: "text" },
          { key: "Issue Count", label: "Discrepancy Count", type: "number" },
          { key: "Financial Impact", label: "Write-down Value", type: "currency", align: "right" },
          { key: "Status", label: "Status", type: "status" }
        ],
        searchFields: ["Warehouse", "Location"],
        filters: [
          { label: "Location", key: "Location", options: ["All Locations", "US East", "EU Central", "APAC South", "UK West"] },
          { label: "Warehouse Type", key: "Warehouse Type", options: ["All Types", "Distribution Center", "Cold Storage", "Fulfillment", "Cross-Dock"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_Inventory_Warehouses",
        emptyStateMessage: "No warehouses match search criteria.",
        totalRecords: 2000,
        breadcrumbField: "Warehouse"
      },
      {
        id: "material_groups",
        stageTitle: "Material Groups",
        description: "Isolate valuation exception items by product material categories.",
        icon: Layers,
        columns: [
          { key: "Material Group", label: "Material Group", type: "text" },
          { key: "Issue Count", label: "Issues", type: "number" },
          { key: "Financial Impact", label: "Impacted Value", type: "currency", align: "right" }
        ],
        searchFields: ["Material Group"],
        filters: [
          { label: "Material Group Type", key: "Material Group Type", options: ["All Types", "Raw Material", "Packaging", "Electronics"] },
          { label: "Storage Requirement", key: "Storage Requirement", options: ["All Requirements", "Ambient", "Chilled", "Hazardous"] }
        ],
        defaultSort: { key: "Financial Impact", direction: "desc" },
        exportFilename: "FSCP_Inventory_MaterialGroups",
        emptyStateMessage: "No material groups found.",
        totalRecords: 1500,
        breadcrumbField: "Material Group"
      }
    ]
  }
};

export const getInvestigationConfig = (process: string): InvestigationConfig => {
  const lower = process.toLowerCase();
  if (lower.includes("asset")) {
    return INVESTIGATION_CONFIGS["Fixed Assets"];
  } else if (lower.includes("payable") || lower.includes("ap") || lower.includes("procure")) {
    return INVESTIGATION_CONFIGS["Accounts Payable"];
  } else if (lower.includes("receivable") || lower.includes("ar") || lower.includes("order")) {
    return INVESTIGATION_CONFIGS["Accounts Receivable"];
  } else if (lower.includes("bank") || lower.includes("cash")) {
    return INVESTIGATION_CONFIGS["Bank & Cash"];
  } else if (lower.includes("general ledger") || lower.includes("ledger") || lower.includes("allocations") || lower.includes("prepar")) {
    return INVESTIGATION_CONFIGS["General Ledger"];
  } else {
    return INVESTIGATION_CONFIGS["Inventory Accounting"];
  }
};



const getStagesConfigForIssue = (issue: FSCPIssue): InvestigationStageConfig[] => {
  const config = getInvestigationConfig(issue.process);
  return config.stages;
};

;

const generateMockRowsForStage = (
  stage: InvestigationStageConfig,
  issue: FSCPIssue,
  prevSelections: any[],
  searchQuery: string,
  activeFilters: Record<string, string>,
  page: number,
  pageSize: number,
  sortKey: string,
  sortDirection: 'asc' | 'desc'
): { rows: any[]; totalCount: number; filteredCount: number } => {
  const totalCount = stage.totalRecords;
  const recordsToGenerate = Math.min(totalCount, 1500);
  const items: any[] = [];

  for (let i = 0; i < recordsToGenerate; i++) {
    const seed = i + 1;
    const row: Record<string, any> = {};

    const regions = ["North America", "Europe", "Asia-Pacific", "South America"];
    const companyTypes = ["Subsidiary", "Parent", "Joint Venture", "Branch"];
    const locations = ["US East", "EU Central", "APAC South", "UK West"];
    const whTypes = ["Distribution Center", "Cold Storage", "Fulfillment", "Cross-Dock"];
    const assetClasses = ["Machinery", "Equipment", "Vehicles", "Buildings"];
    const depMethods = ["Straight Line", "Double Declining", "MACRS"];
    const ageingBuckets = ["New (< 1 yr)", "Medium (1-3 yrs)", "Old (> 3 yrs)"];
    const acqDates = ["Q1 2026", "Q2 2026", "2025", "2024"];
    const vendorStatuses = ["Active", "On Hold", "Preferred"];
    const payTerms = ["Net 30", "Net 60", "Due on Receipt"];
    const invoiceDates = ["June 2026", "May 2026", "Q2 2026"];
    const invoiceStatuses = ["Open", "On Hold", "Approved"];
    const lineTypes = ["Item", "Charge", "Tax", "Freight"];
    const variances = ["Price Variance", "Qty Variance", "No Variance"];
    const risks = ["High", "Medium", "Low"];
    const industries = ["Technology", "Retail", "Manufacturing", "Healthcare"];
    const prodCats = ["Software", "Hardware", "Services"];
    const disputeCodes = ["Price Match", "Tax Discrepancy", "Return Hold"];
    const bankAcctTypes = ["Operating", "Savings", "Clearing", "Payroll"];
    const currencies = ["USD", "EUR", "INR", "GBP"];
    const unitTypes = ["Division", "Subsidiary", "Branch"];
    const opRegions = ["Domestic", "International"];
    const depts = ["Administration", "Operations", "R&D", "Sales"];
    const ccStatuses = ["Active", "Inactive"];
    const acctClasses = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"];
    const glAcctStatuses = ["Active", "Suspended"];
    const entryTypes = ["Manual Accrual", "Consolidation", "Tax", "Intercompany"];
    const jeStatuses = ["Open", "Pending Review", "Posted"];
    const matGroupTypes = ["Raw Material", "Packaging", "Electronics"];
    const storageReqs = ["Ambient", "Chilled", "Hazardous"];
    const storageConds = ["Standard", "Refrigerated", "Dry"];
    const stockAvailabilities = ["In Stock", "Out of Stock"];

    row["Region"] = regions[seed % regions.length];
    row["Company Type"] = companyTypes[seed % companyTypes.length];
    row["Location"] = locations[seed % locations.length];
    row["Warehouse Type"] = whTypes[seed % whTypes.length];
    row["Asset Class"] = assetClasses[seed % assetClasses.length];
    row["Depreciation Method"] = depMethods[seed % depMethods.length];
    row["Ageing"] = ageingBuckets[seed % ageingBuckets.length];
    row["Acquisition Date"] = acqDates[seed % acqDates.length];
    row["Vendor Status"] = vendorStatuses[seed % vendorStatuses.length];
    row["Payment Terms"] = payTerms[seed % payTerms.length];
    row["Invoice Date"] = invoiceDates[seed % invoiceDates.length];
    row["Status"] = invoiceStatuses[seed % invoiceStatuses.length];
    row["Line Type"] = lineTypes[seed % lineTypes.length];
    row["Variance Status"] = variances[seed % variances.length];
    row["Risk Level"] = risks[seed % risks.length];
    row["Industry"] = industries[seed % industries.length];
    row["Product Category"] = prodCats[seed % prodCats.length];
    row["Dispute Code"] = disputeCodes[seed % disputeCodes.length];
    row["Account Type"] = bankAcctTypes[seed % bankAcctTypes.length];
    row["Currency"] = currencies[seed % currencies.length];
    row["Unit Type"] = unitTypes[seed % unitTypes.length];
    row["Operating Region"] = opRegions[seed % opRegions.length];
    row["Department"] = depts[seed % depts.length];
    row["CC Status"] = ccStatuses[seed % ccStatuses.length];
    row["Account Class"] = acctClasses[seed % acctClasses.length];
    row["GL Account Status"] = glAcctStatuses[seed % glAcctStatuses.length];
    row["Entry Type"] = entryTypes[seed % entryTypes.length];
    row["Journal Status"] = jeStatuses[seed % jeStatuses.length];
    row["Material Group Type"] = matGroupTypes[seed % matGroupTypes.length];
    row["Storage Requirement"] = storageReqs[seed % storageReqs.length];
    row["Storage Condition"] = storageConds[seed % storageConds.length];
    row["Stock Availability"] = stockAvailabilities[seed % stockAvailabilities.length];

    stage.columns.forEach((col) => {
      if (col.key === "Company" || col.key === "Affected Company" || col.key === "Entities / Companies") {
        const companyNames = ["Acme Corp", "Global Logistics", "Bharat Solutions", "Pacific Trade", "Royal Industries", "EuroTech Group", "AmeriSource", "Apex Enterprises", "Standard Finance", "United Services", "Pan-Atlantic Inc", "Hindustan Enterprises", "Nippon Corp", "SinoTech Co", "Munich Re", "Nordic Ventures", "Alpine Logistics", "Sydney Shipping", "Vanguard Industries", "Delta Services"];
        const code = `CO-${String(seed).padStart(4, '0')}`;
        row[col.key] = `${companyNames[i % companyNames.length]} (${code})`;
      } else if (col.key === "Warehouse") {
        const whNames = ["Cargo Center", "Main Hub-2", "Express Depot", "Central WH", "Terminal 3", "Metro Facility", "North Logistics Park", "East Coast Gate", "Inland Port Alpha", "South distribution Center"];
        row[col.key] = `${whNames[i % whNames.length]} #${seed}`;
      } else if (col.key === "Category" || col.key === "Asset Category") {
        const cats = ["Heavy Machinery", "IT Hardware", "Office Furniture", "Facility Infrastructure", "Industrial Tools", "Lab Equipment", "Fleet Vehicles", "Network Infrastructure", "Communication Systems"];
        row[col.key] = cats[i % cats.length] + ` (CAT-${seed})`;
      } else if (col.key === "Asset") {
        const assetTypes = ["Generator", "Server Blade", "Forklift", "Conveyor Belt", "HVAC System", "Workstation", "Hydraulic Press", "Packaging Line", "Pumping Unit", "Cargo Truck"];
        row[col.key] = `${assetTypes[i % assetTypes.length]} #${seed}`;
      } else if (col.key === "Vendor") {
        const vnames = ["Intel Corp", "Logitech Inc", "Apex Supplier Ltd", "Global Cargo Express", "Microsoft Corporation", "Oracle Corp", "Dell Technologies", "Sysco Foodservices", "Sumitomo Metals", "BASF Chemical", "Schneider Electric", "Siemens AG", "Maersk Shipping", "FedEx Supply Chain", "DHL Global Forwarding"];
        row[col.key] = `${vnames[i % vnames.length]} (VND-${seed})`;
      } else if (col.key === "Customer") {
        const cnames = ["Enterprise Corp", "SME Partners", "Acme Retail", "Interstate Wholesale", "Global Traders", "Local Distributors", "Allied Trading", "Beacon Enterprises", "Core Holdings", "Direct Supply Co"];
        row[col.key] = `${cnames[i % cnames.length]} (CST-${seed})`;
      } else if (col.key === "Invoice") {
        row[col.key] = `INV-2026-${String(seed).padStart(5, '0')}`;
      } else if (col.key === "Line Item" || col.key === "Invoice Line") {
        const itemsList = ["Item Inspection Charges", "Maintenance Fee", "Freight Overcharge", "Service Line Item #1", "Software Subscriptions", "Hardware Delivery Charge", "Consulting Fee Hours", "Licensing Surcharge", "Expedited Handling"];
        row[col.key] = itemsList[i % itemsList.length] + ` (LN-${seed})`;
      } else if (col.key === "Item" || col.key === "Invoice Item") {
        const itemsList = ["Product Licensing Fee", "Late Delivery Fee Charge", "Reconciled Tax Differential", "Freight Carrier Tariff", "Handling Charges", "Standard Product Unit A", "Service Charge Hours", "Custom Duty Clearance", "Export Administration Fee"];
        row[col.key] = itemsList[i % itemsList.length] + ` (ITM-${seed})`;
      } else if (col.key === "Business Unit") {
        const bus = ["Hardware Division", "Logistics", "Services", "Cloud Systems", "Office Supplies", "Enterprise Sales", "Regional Ops", "Global Transport"];
        row[col.key] = bus[i % bus.length];
      } else if (col.key === "GL Account") {
        const accounts = ["11000 - Cash Ledger", "12000 - Trade Receivables", "13000 - Inventory Raw Materials", "21000 - Trade Payables", "22000 - Accrued Liabilities", "41000 - Sales Revenue", "51000 - Cost of Goods Sold", "61000 - Operating Expenses"];
        row[col.key] = accounts[i % accounts.length];
      } else if (col.key === "Cost Center") {
        const cc = ["CC-100 - Admin", "CC-200 - Finance", "CC-300 - IT Support", "CC-400 - Operations", "CC-500 - Marketing", "CC-600 - Sales West", "CC-700 - Supply Chain", "CC-800 - R&D"];
        row[col.key] = cc[i % cc.length];
      } else if (col.key === "Journal Entry") {
        row[col.key] = `JE-2026-${String(seed).padStart(5, '0')}`;
      } else if (col.key === "Material Group") {
        const groups = ["Raw Metals", "Packaging Film", "Electronics Assembly", "Plastic Resins", "Chemical Additives", "Machined Components", "Safety Gear", "Office Stationary", "Fabricated Parts"];
        row[col.key] = groups[i % groups.length] + ` (GRP-${seed})`;
      } else if (col.key === "Material") {
        const parts = ["Aluminum Ingot 6061", "Polyethylene Roll", "PCB Controller Board", "Copper Wire Reel", "Silicon Sealant", "M8 Hex Screw", "Steel Sheet Grade B", "Fiberglass Core", "Lead Solder Alloy", "Nylon Fiber Thread"];
        row[col.key] = `${parts[i % parts.length]} #${seed}`;
      } else if (col.key === "ID") {
        row[col.key] = `${stage.id.substring(0, 3).toUpperCase()}-${String(seed).padStart(5, '0')}`;
      } else if (col.key === "Status") {
        // Fallback for visual display of Status column
        const statuses = ["Open", "In Progress", "Resolved"];
        row[col.key] = statuses[i % 3];
      } else if (col.key === "Location" || col.key === "Region") {
        const locs = ["New York, USA", "Frankfurt, Germany", "Mumbai, India", "Singapore", "London, UK", "Tokyo, Japan", "Sydney, Australia", "Paris, France", "São Paulo, Brazil", "Toronto, Canada"];
        row[col.key] = locs[i % locs.length];
      } else if (col.key === "Date") {
        row[col.key] = `2026-06-${String((i % 28) + 1).padStart(2, '0')}`;
      } else if (col.key === "Ageing" || col.key === "Ageing Days") {
        row[col.key] = `${(i % 45) + 1} Days`;
      } else if (col.key === "Issue Count") {
        row[col.key] = (i % 15) + 1;
      } else if (col.key === "Financial Impact") {
        row[col.key] = 3000 + (i % 30) * 1250;
      } else if (col.key === "Quantity") {
        row[col.key] = (i % 250) + 15;
      } else if (col.key === "UOM") {
        row[col.key] = ["units", "kg", "meters", "drums"][i % 4];
      } else if (col.key === "Rate") {
        row[col.key] = 150 + (i % 15) * 25;
      } else if (col.key === "Description") {
        row[col.key] = `Mock description for line entry detail #${seed}`;
      } else {
        row[col.key] = `Value #${seed}`;
      }
    });

    items.push(row);
  }

  let filtered = items.filter((row) => {
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch = stage.searchFields.some((field) => {
        const val = row[field];
        return val !== undefined && String(val).toLowerCase().includes(query);
      });
    }

    let matchesFilters = true;
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (val && !val.startsWith("All")) {
        const rowVal = row[key];
        if (rowVal !== undefined && String(rowVal).toLowerCase() !== val.toLowerCase()) {
          matchesFilters = false;
        }
      }
    });

    return matchesSearch && matchesFilters;
  });

  if (sortKey) {
    filtered.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  const filteredCount = filtered.length;
  let simulatedFilteredCount = filteredCount;
  const hasActiveFilters = Object.values(activeFilters).some(v => v && !v.startsWith("All"));
  if (!searchQuery && !hasActiveFilters) {
    simulatedFilteredCount = totalCount;
  } else {
    const ratio = filteredCount / recordsToGenerate;
    simulatedFilteredCount = Math.floor(totalCount * ratio);
  }

  const endIndex = Math.min(page * pageSize, filtered.length);
  const pageSlice = filtered.slice(0, endIndex);

  return {
    rows: pageSlice,
    totalCount: totalCount,
    filteredCount: simulatedFilteredCount
  };
};

interface IssueResolutionWorkspaceProps {
  issue: FSCPIssue;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  onUpdateIssue: (updated: FSCPIssue) => void;
}

function getTimelineIcon(desc: string) {
  const lower = desc.toLowerCase();
  if (lower.includes("assigned")) return <User size={10} className="text-blue-500" />;
  if (lower.includes("communication") || lower.includes("sent") || lower.includes("dispatched")) return <Send size={10} className="text-emerald-500" />;
  if (lower.includes("detected") || lower.includes("blocker")) return <AlertTriangle size={10} className="text-red-500" />;
  if (lower.includes("ai") || lower.includes("recommendation")) return <Sparkles size={10} className="text-purple-500" />;
  return <Activity size={10} className="text-slate-400" />;
}

function IssueResolutionWorkspace({
  issue,
  onClose,
  triggerToast,
  onUpdateIssue
}: IssueResolutionWorkspaceProps) {
  const [assignActionType, setAssignActionType] = useState("");
  const [assignOwner, setAssignOwner] = useState("");
  const [assignDept, setAssignDept] = useState("");
  const [assignPriority, setAssignPriority] = useState("Medium");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const [formBaseline, setFormBaseline] = useState<{
    actionType: string;
    owner: string;
    dept: string;
    priority: string;
    dueDate: string;
    notes: string;
  } | null>(null);

  const [mailTo, setMailTo] = useState("");
  const [mailCc, setMailCc] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");

  useEffect(() => {
    if (issue) {
      const actions = getActionTypes(issue.process);
      const initialActionType = actions[0] || "Master Data Correction";
      const initialOwner = issue.ownerRole;
      const initialDept = issue.domain;
      const initialPriority = issue.severity === "Critical" || issue.severity === "High" ? "High" : "Medium";
      
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      const initialDueDate = defaultDate.toISOString().substring(0, 10);
      const initialNotes = "";

      setAssignActionType(initialActionType);
      setAssignOwner(initialOwner);
      setAssignDept(initialDept);
      setAssignPriority(initialPriority);
      setAssignDueDate(initialDueDate);
      setAssignNotes(initialNotes);

      setFormBaseline({
        actionType: initialActionType,
        owner: initialOwner,
        dept: initialDept,
        priority: initialPriority,
        dueDate: initialDueDate,
        notes: initialNotes
      });

      setMailTo(issue.ownerRole.toLowerCase().replace(/[^a-z]/g, "") + "@datatwin.ai");
      setMailCc("finance-close-control@datatwin.ai");
      setMailSubject(`[Action Required] Close Blocker ID: ${issue.id} - ${issue.name}`);
      
      const body = `Dear Team,

Please review the following Close Blocker issue identified on the closing dashboard.

- Blocker ID: ${issue.id}
- Domain: ${issue.domain}
- Process: ${issue.process}
- Financial Impact: $${issue.impact.toLocaleString()}

AI Smart Recommendation Checklist:
${issue.suggestedAction.map((act, i) => `- ${act}`).join("\n")}

Please assign resolution immediately.

Regards,
Close Control Monitor`;
      setMailBody(body);
    }
  }, [issue]);

  const isFormModified = !!(
    formBaseline &&
    (assignActionType !== formBaseline.actionType ||
     assignOwner !== formBaseline.owner ||
     assignDept !== formBaseline.dept ||
     assignPriority !== formBaseline.priority ||
     assignDueDate !== formBaseline.dueDate ||
     assignNotes !== formBaseline.notes)
  );

  const handleDownloadReport = () => {
    const reportContent = `Financial Statement Close Process (FSCP) Workspace
======================================================================
ISSUE DETAIL REPORT - ${issue.id}
Generated on: ${new Date().toLocaleString()}
----------------------------------------------------------------------
Blocker ID:          ${issue.id}
Issue Name:          ${issue.name}
Domain:              ${issue.domain}
Process:             ${issue.process}
Financial Impact:    $${issue.impact.toLocaleString()}
Severity:            ${issue.severity}
Status:              ${issue.status}
Ageing Days:         ${issue.ageingDays}
Company Code:        ${issue.companyCode}
Fiscal Year:         ${issue.fiscalYear}
Period:              ${issue.period}
Asset Number:        ${issue.assetNumber}
Owner Role:          ${issue.ownerRole}

Reason for Blocker:
-------------------
${issue.reason}

AI Smart Suggestions:
---------------------
${issue.suggestedAction.map((action, i) => `${i + 1}. ${action}`).join("\n")}
======================================================================
`;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FSCP_Report_${issue.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Report report_${issue.id}.txt downloaded successfully!`);
  };

  const handleAssignAction = () => {
    const updated: FSCPIssue = {
      ...issue,
      status: "In Progress" as const,
      timeline: [
        ...issue.timeline,
        {
          dateLabel: "Today",
          description: `Resolution assigned to ${assignOwner}`
        }
      ]
    };

    onUpdateIssue(updated);
    triggerToast(`Resolution corrective actions successfully assigned to ${assignOwner}.`);

    setFormBaseline({
      actionType: assignActionType,
      owner: assignOwner,
      dept: assignDept,
      priority: assignPriority,
      dueDate: assignDueDate,
      notes: assignNotes
    });
  };

  const handleSendMailCommunication = () => {
    const updated: FSCPIssue = {
      ...issue,
      status: "In Progress" as const,
      timeline: [
        ...issue.timeline,
        {
          dateLabel: "Today",
          description: `Communication sent to Asset Owner`
        }
      ]
    };

    onUpdateIssue(updated);
    triggerToast(`Remediation notification email successfully dispatched to ${mailTo}.`);
  };

  const config = getInvestigationConfig(issue.process);

  return (
    <div 
      className="w-screen h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--card)", color: "var(--foreground)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center flex-wrap gap-1 text-[11px] text-muted-foreground font-medium mb-1.5 select-none">
            <span>Close Blockers</span>
            <span className="text-slate-400 font-normal">/</span>
            <span>{issue.domain}</span>
            <span className="text-slate-400 font-normal">/</span>
            <span>{issue.process}</span>
            <span className="text-slate-400 font-normal">/</span>
            <span className="text-foreground font-semibold">
              {issue.name}
            </span>
          </div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: issue.type === "Close Blocker" ? "#ef4444" : issue.type === "Moderate Issue" ? "#f59e0b" : "#10b981" }} />
            Issue Resolution Workspace — {issue.id}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadReport}
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/50 transition-colors"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", cursor: "pointer" }}
          >
            <Download size={13} />
            Download Report
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center font-bold"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
            title="Close Tab"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Split Columns Grid Container */}
      <div className="flex-1 overflow-hidden flex">
        
        {/* Left Column (2/3 width) - Scrollable working area */}
        <div className="w-2/3 overflow-y-auto p-6 flex flex-col gap-6 border-r h-full" style={{ borderColor: "var(--border)" }}>
          
          {/* 1. Issue Information */}
          <div className="rounded-xl border p-5 bg-secondary/15" style={{ borderColor: "var(--border)" }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 12 }}>Issue Information</h4>
            <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-[13px]">
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Blocker ID</span>
                <strong className="font-semibold text-foreground">{issue.id}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Company Code</span>
                <strong className="font-semibold text-foreground">{issue.companyCode}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Fiscal Year / Period</span>
                <strong className="font-semibold text-foreground">{issue.fiscalYear} / {issue.period}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Asset / Document Number</span>
                <strong className="font-semibold text-foreground font-mono">{issue.assetNumber}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Business Process</span>
                <strong className="font-semibold text-foreground">{issue.process}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Blocker Type</span>
                <strong className="font-semibold text-foreground">{issue.blockerType}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Severity</span>
                <strong className="font-semibold" style={{ color: issue.severity === "Critical" ? "#ef4444" : issue.severity === "High" ? "#f59e0b" : "var(--foreground)" }}>{issue.severity}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Status</span>
                <strong className="font-semibold" style={{ color: issue.status === "In Progress" ? "#3b82f6" : "#f59e0b" }}>{issue.status}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Financial Impact</span>
                <strong className="font-semibold text-red-500">${issue.impact.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Source File</span>
                <strong className="font-semibold text-foreground font-mono text-[11px] truncate block">{issue.sourceFile}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Owner Role</span>
                <strong className="font-semibold text-foreground">{issue.ownerRole}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Ageing Days</span>
                <strong className="font-semibold text-foreground">{issue.ageingDays} Days</strong>
              </div>
            </div>
            <div className="border-t pt-3 mt-3 text-xs" style={{ borderColor: "var(--border)" }}>
              <span className="text-muted-foreground block text-[11px] uppercase font-bold tracking-wider mb-1">Reason for outstanding issue</span>
              <p style={{ color: "var(--foreground)", fontSize: "13px", lineHeight: 1.5 }}>{issue.reason}</p>
            </div>
          </div>

          {/* Detailed Records Section */}
          <div className="rounded-xl border p-5 bg-card" style={{ borderColor: "var(--border)" }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 12 }}>
              Detailed Records — {config.detailedRecordsTitle}
            </h4>
            <div className="overflow-x-auto border rounded-lg animate-fadeIn" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-left font-sans text-[13px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="border-b bg-muted/15" style={{ borderColor: "var(--border)", fontSize: "11px", color: "var(--muted-foreground)" }}>
                    {config.detailedRecordsColumns.map((col) => (
                      <th key={col.key} className={`py-2 px-3 font-bold ${col.align === "right" ? "text-right" : "text-left"}`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.detailedRecordsMockData.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/5 transition-colors font-medium" style={{ borderColor: "var(--border)" }}>
                      {config.detailedRecordsColumns.map((col) => {
                        const val = row[col.key];
                        return (
                          <td key={col.key} className={`py-2 px-3 ${col.align === "right" ? "text-right font-semibold" : "text-left"}`}>
                            {col.type === "currency" ? `$${val.toLocaleString()}` : val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Resolution Assignment */}
          <div className="rounded-xl border p-5 bg-card" style={{ borderColor: "var(--border)" }}>
            <h4 className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--foreground)", marginBottom: 16 }}>
              <Layers size={14} style={{ color: "#3b82f6" }} />
              Resolution Assignment
            </h4>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Action Type</label>
                <select 
                  value={assignActionType}
                  onChange={(e) => setAssignActionType(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors h-[38px] text-foreground font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                >
                  {getActionTypes(issue.process).map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Responsible Person / Role</label>
                <input 
                  type="text" 
                  value={assignOwner}
                  onChange={(e) => setAssignOwner(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors h-[38px] text-foreground font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Department</label>
                <input 
                  type="text" 
                  value={assignDept}
                  onChange={(e) => setAssignDept(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors h-[38px] text-foreground font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Priority</label>
                <select 
                  value={assignPriority}
                  onChange={(e) => setAssignPriority(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors h-[38px] text-foreground font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Due Date</label>
                <input 
                  type="date" 
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors h-[38px] text-foreground font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Resolution Notes</label>
                <textarea 
                  rows={3} 
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Enter closing remediation instructions or action history..."
                  className="w-full rounded-lg p-3 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors resize-none text-foreground leading-relaxed font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </div>
          </div>

          {/* 3. Communications Hub */}
          <div className="rounded-xl border p-5 bg-card" style={{ borderColor: "var(--border)" }}>
            <h4 className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--foreground)", marginBottom: 16 }}>
              <Mail size={14} style={{ color: "#3b82f6" }} />
              Communications Hub
            </h4>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">To</label>
                <input 
                  type="text" 
                  value={mailTo} 
                  onChange={(e) => setMailTo(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors h-[38px] text-foreground font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Cc</label>
                <input 
                  type="text" 
                  value={mailCc} 
                  onChange={(e) => setMailCc(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors h-[38px] text-foreground font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Subject</label>
                <input 
                  type="text" 
                  value={mailSubject} 
                  onChange={(e) => setMailSubject(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors h-[38px] text-foreground font-medium text-[12px]"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider block mb-1.5">Email Body</label>
                <textarea 
                  rows={4} 
                  value={mailBody} 
                  onChange={(e) => setMailBody(e.target.value)}
                  className="w-full rounded-lg p-3 border outline-none bg-secondary/50 focus:border-blue-500/50 transition-colors font-mono text-[12px] leading-relaxed resize-y text-foreground font-medium"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div className="col-span-2 flex justify-end">
                <button
                  onClick={handleSendMailCommunication}
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 hover:bg-muted/10 border"
                  style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)", cursor: "pointer" }}
                >
                  <Send size={12} />
                  Send Remediation Notice
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width) - Fixed contextual sidebar */}
        <div className="w-1/3 p-6 flex flex-col gap-6 h-full overflow-hidden flex-shrink-0" style={{ background: "var(--card)" }}>
          
          {/* AI Smart Suggestion */}
          <div 
            className="rounded-xl p-5 border flex flex-col gap-4"
            style={{ 
              background: "rgba(59, 130, 246, 0.04)", 
              borderColor: "rgba(59, 130, 246, 0.25)",
              boxShadow: "inset 0 0 24px rgba(59, 130, 246, 0.03), 0 4px 20px rgba(59, 130, 246, 0.05)"
            }}
          >
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "rgba(59, 130, 246, 0.15)" }}>
              <Sparkles size={16} style={{ color: "#3b82f6" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Smart Suggestion</span>
            </div>

            <div className="flex flex-col gap-3">
              {issue.suggestedAction.map((action, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-blue-500 font-bold" style={{ fontSize: 12 }}>{i + 1}.</span>
                  <p style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.4 }}>{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Issue Activity Timeline */}
          <div className="rounded-xl border p-4 bg-card flex-1 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
            <h4 className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 16 }}>
              <Calendar size={14} style={{ color: "#3b82f6" }} />
              Issue Activity Timeline
            </h4>

            <div className="flex flex-col gap-5 pl-4 relative border-l" style={{ borderColor: "var(--border)" }}>
              {[...issue.timeline].reverse().map((event, idx) => (
                <div key={idx} className="relative text-xs animate-fadeIn pb-1">
                  <span 
                    className="absolute rounded-full flex items-center justify-center" 
                    style={{ 
                      width: 20, 
                      height: 20, 
                      left: "-25px", 
                      top: "-2px", 
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }} 
                  >
                    {getTimelineIcon(event.description)}
                  </span>
                  
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", display: "block", textTransform: "uppercase" }}>
                    {event.dateLabel}
                  </span>
                  
                  <p className="mt-0.5 text-foreground font-medium text-[12px] leading-relaxed">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="flex items-shrink-0 items-center justify-end px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <button
          disabled={!isFormModified}
          onClick={handleAssignAction}
          className="px-5 py-2 rounded-lg text-xs font-bold border-none transition-colors"
          style={{
            background: isFormModified ? "var(--foreground)" : "var(--muted)",
            color: isFormModified ? "var(--background)" : "var(--muted-foreground)",
            cursor: isFormModified ? "pointer" : "not-allowed",
            opacity: isFormModified ? 1 : 0.5
          }}
        >
          Save Action
        </button>
      </div>
    </div>
  );
}


export interface FSCPPageProps {
  workspaceIssueId?: string;
  showUploadModal?: boolean;
  setShowUploadModal?: (show: boolean) => void;
  initialReconResult?: {
    company?: string;
    financialPeriod?: string;
    kpi?: string;
    domain?: string;
    process?: string;
    issueId?: string;
  } | null;
  onResetInitialReconResult?: () => void;
}

const MOCK_RECONCILIATION_RESULT = {
  kpi: "Close Blocker" as const,
  domain: "Core Finance",
  process: "General Ledger"
};

export function FSCPPage({ 
  workspaceIssueId,
  showUploadModal = false,
  setShowUploadModal = () => {},
  initialReconResult = null,
  onResetInitialReconResult
}: FSCPPageProps = {}) {
  const [issues, setIssues] = useState<FSCPIssue[]>(() => IssueRepository.loadIssues());

  const [selectedKPI, setSelectedKPI] = useState<FSCPIssueType | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<FSCPViewMode>("View 2");
  const [selectedCompanyGroup, setSelectedCompanyGroup] = useState<string>("Global Holdings Group");
  const [companySearch, setCompanySearch] = useState<string>("");
  const [companyRegion, setCompanyRegion] = useState<string>("All Regions");
  const [companyType, setCompanyType] = useState<string>("All Types");

  // Modals state
  const [showDetails, setShowDetails] = useState<FSCPIssue | null>(null);
  const [activeIssueForInvestigation, setActiveIssueForInvestigation] = useState<FSCPIssue | null>(null);
  const [investigationPath, setInvestigationPath] = useState<Array<{ stageId: string; label: string; record: any }>>([]);
  const [isStageLoading, setIsStageLoading] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [modalSearch, setModalSearch] = useState("");
  const [modalFilters, setModalFilters] = useState<Record<string, string>>({});
  const [modalSortKey, setModalSortKey] = useState("");
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("desc");

  // Warnings context
  const [noActiveIssuesContext, setNoActiveIssuesContext] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lastFocusedLauncherRef = useRef<HTMLElement | null>(null);
  
  const mainContainerRef = useRef<HTMLElement | null>(null);
  const lastFocusedIssueRowRef = useRef<HTMLElement | null>(null);
  const lastFocusedEmptyCardRef = useRef<HTMLElement | null>(null);

  const userClickedDomain = useRef(false);
  const userClickedProcess = useRef(false);
  const userClickedIssue = useRef(false);
  const userClickedStage = useRef(false);

  const handleArrowNavigation = (e: React.KeyboardEvent<HTMLDivElement>, selectorClass: string) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    const key = e.key;
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown" && key !== "Enter" && key !== " ") return;

    if (key === "Enter" || key === " ") {
      e.preventDefault();
      e.currentTarget.click();
      return;
    }

    e.preventDefault();
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const cards = Array.from(parent.querySelectorAll(`.${selectorClass}`)) as HTMLElement[];
    const index = cards.indexOf(e.currentTarget);
    if (index === -1) return;

    let targetIndex = index;
    if (key === "ArrowLeft") {
      targetIndex = (index - 1 + cards.length) % cards.length;
    } else if (key === "ArrowRight") {
      targetIndex = (index + 1) % cards.length;
    } else if (key === "ArrowUp" || key === "ArrowDown") {
      if (selectorClass === "company-group-card-nav") {
        // Compute columns dynamically
        let cols = 1;
        const firstCardTop = cards[0]?.offsetTop;
        for (let i = 1; i < cards.length; i++) {
          if (cards[i].offsetTop === firstCardTop) {
            cols++;
          } else {
            break;
          }
        }
        if (key === "ArrowUp") {
          targetIndex = index - cols;
          if (targetIndex < 0) {
            targetIndex = Math.max(0, cards.length + targetIndex);
          }
        } else {
          targetIndex = index + cols;
          if (targetIndex >= cards.length) {
            targetIndex = targetIndex % cols;
          }
        }
      }
    }

    cards[targetIndex]?.focus();
  };

  const businessProcessRef = (el: HTMLDivElement | null) => {
    if (el && userClickedDomain.current && mainContainerRef.current) {
      userClickedDomain.current = false;
      const container = mainContainerRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elemRect = el.getBoundingClientRect();
      const isFullyVisible = (elemRect.top >= containerRect.top) && (elemRect.bottom <= containerRect.bottom);
      
      if (!isFullyVisible) {
        let offsetTop = 0;
        let curr: HTMLElement | null = el;
        while (curr && curr !== container) {
          offsetTop += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement | null;
        }
        container.scrollTo({
          top: Math.max(0, offsetTop - 30),
          behavior: "smooth"
        });
      }
    }
  };

  const activeIssuesRef = (el: HTMLDivElement | null) => {
    if (el && userClickedProcess.current && mainContainerRef.current) {
      userClickedProcess.current = false;
      const container = mainContainerRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elemRect = el.getBoundingClientRect();
      const isFullyVisible = (elemRect.top >= containerRect.top) && (elemRect.bottom <= containerRect.bottom);
      
      if (!isFullyVisible) {
        let offsetTop = 0;
        let curr: HTMLElement | null = el;
        while (curr && curr !== container) {
          offsetTop += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement | null;
        }
        container.scrollTo({
          top: Math.max(0, offsetTop - 30),
          behavior: "smooth"
        });
      }
    }
  };

  const modalScrollContainerRef = (el: HTMLDivElement | null) => {
    if (el) {
      if (userClickedIssue.current) {
        userClickedIssue.current = false;
        el.scrollTo({ top: 0, behavior: "smooth" });
      } else if (userClickedStage.current) {
        userClickedStage.current = false;
        el.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const userClickedLoadMore = useRef(false);

  const loadMoreRowRef = (el: HTMLTableRowElement | null) => {
    if (el && userClickedLoadMore.current) {
      userClickedLoadMore.current = false;
      const container = document.getElementById("modal-scroll-container");
      if (container) {
        let offsetTop = 0;
        let curr: HTMLElement | null = el;
        while (curr && curr !== container) {
          offsetTop += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement | null;
        }
        container.scrollTo({
          top: Math.max(0, offsetTop - 50),
          behavior: "smooth"
        });
      }
    }
  };

  useEffect(() => {
    if (!noActiveIssuesContext && !activeIssueForInvestigation) {
      return;
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. ESCAPE handler
      if (e.key === "Escape") {
        if (noActiveIssuesContext) {
          e.preventDefault();
          setNoActiveIssuesContext(null);
          setTimeout(() => {
            lastFocusedEmptyCardRef.current?.focus();
          }, 50);
        } else if (activeIssueForInvestigation) {
          e.preventDefault();
          handleCloseInvestigationExplorer();
          setTimeout(() => {
            lastFocusedIssueRowRef.current?.focus();
          }, 50);
        }
        return;
      }

      // 2. FOCUS TRAP handler
      if (e.key === "Tab") {
        let containerId = "";
        if (noActiveIssuesContext) {
          containerId = "no-active-issues-dialog";
        } else if (activeIssueForInvestigation) {
          containerId = "investigation-explorer-modal";
        }

        if (!containerId) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
        const focusables = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
        if (focusables.length === 0) return;

        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }

        // Keep focus strictly within container if activeElement wanders off
        if (!container.contains(document.activeElement)) {
          firstEl.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [noActiveIssuesContext, activeIssueForInvestigation]);
  // Auto-focus triggers when modal or dialog is opened
  useEffect(() => {
    if (activeIssueForInvestigation) {
      setTimeout(() => {
        const container = document.getElementById("investigation-explorer-modal");
        if (container) {
          const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
          const firstFocusable = container.querySelector(focusableSelectors) as HTMLElement | null;
          firstFocusable?.focus();
        }
      }, 80);
    }
  }, [activeIssueForInvestigation]);

  useEffect(() => {
    if (noActiveIssuesContext) {
      setTimeout(() => {
        const container = document.getElementById("no-active-issues-dialog");
        if (container) {
          const closeButton = container.querySelector('button') as HTMLElement | null;
          closeButton?.focus();
        }
      }, 80);
    }
  }, [noActiveIssuesContext]);

  useEffect(() => {
    console.log("FSCP Page initialized context");
    return IssueRepository.subscribe((updatedIssues) => {
      setIssues(updatedIssues);
    });
  }, []);

  // Listen for initialReconResult presets from the Upload History page
  useEffect(() => {
    if (initialReconResult) {
      if (initialReconResult.company) {
        setSelectedCompanyGroup(initialReconResult.company);
      }
      if (initialReconResult.kpi) {
        setSelectedKPI(initialReconResult.kpi as FSCPIssueType);
      }
      if (initialReconResult.domain) {
        setSelectedDomain(initialReconResult.domain);
      }
      if (initialReconResult.process) {
        setActiveProcess(initialReconResult.process);
      }
      
      // Trigger scroll and flag process selection
      userClickedProcess.current = true;
      
      // Reset preset so it doesn't fire again on subsequent views
      onResetInitialReconResult?.();
    }
  }, [initialReconResult, onResetInitialReconResult]);



  const handleClearCompanyFilters = () => {
    setCompanySearch("");
    setCompanyRegion("All Regions");
    setCompanyType("All Types");
  };

  const filteredCompanyGroups = COMPANY_GROUPS.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(companySearch.toLowerCase()) || 
                          group.code.toLowerCase().includes(companySearch.toLowerCase());
    const matchesRegion = companyRegion === "All Regions" || group.region === companyRegion;
    const matchesType = companyType === "All Types" || group.type === companyType;
    return matchesSearch && matchesRegion && matchesType;
  });

  const filteredCompanyIssues = issues.filter(issue => {
    if (selectedCompanyGroup === "Global Holdings Group") return true;
    if (selectedCompanyGroup === "North America Operations") return issue.companyCode === "US01";
    if (selectedCompanyGroup === "APAC Shared Services") return issue.companyCode === "APAC09" || issue.companyCode === "IN02";
    if (selectedCompanyGroup === "Europe Finance Group") return issue.companyCode === "EU02" || issue.companyCode === "UK03";
    if (selectedCompanyGroup === "Contoso Manufacturing") return issue.companyCode === "US01" || issue.companyCode === "IN02";
    if (selectedCompanyGroup === "Fabrikam Retail") return issue.companyCode === "EU02" || issue.companyCode === "APAC09";
    return true;
  });

  const handleSelectCompanyGroup = (groupName: string) => {
    setSelectedCompanyGroup(groupName);
    setSelectedDomain(null);
    setActiveProcess(null);
  };
  


  const handleStartInvestigation = (issue: FSCPIssue) => {
    console.log("FSCP Page investigation started:", issue.id);
    setActiveIssueForInvestigation(issue);
    setInvestigationPath([]); 
    setModalPage(1);
    setModalSearch("");
    setModalFilters({});
    
    const stages = getStagesConfigForIssue(issue);
    if (stages.length > 0) {
      setModalSortKey(stages[0].defaultSort.key);
      setModalSortDirection(stages[0].defaultSort.direction);
    }

    userClickedIssue.current = true;
  };

  const handleSelectStageRecord = (record: any, stage: InvestigationStageConfig) => {
    const label = String(record[stage.breadcrumbField] ?? "");
    
    const newPath = [...investigationPath, { stageId: stage.id, label, record }];
    const stages = activeIssueForInvestigation ? getStagesConfigForIssue(activeIssueForInvestigation) : [];
    
    setIsStageLoading(true);
    setTimeout(() => {
      setIsStageLoading(false);
      setInvestigationPath(newPath);
      setModalPage(1);
      setModalSearch("");
      setModalFilters({});
      
      const nextStageIndex = newPath.length;
      if (nextStageIndex < stages.length) {
        setModalSortKey(stages[nextStageIndex].defaultSort.key);
        setModalSortDirection(stages[nextStageIndex].defaultSort.direction);
      } else {
        const workspaceUrl = `${window.location.origin}${window.location.pathname}?mode=workspace&module=fscp&issueId=${activeIssueForInvestigation.id}`;
        window.open(workspaceUrl, "_blank", "noopener,noreferrer");
      }

      userClickedStage.current = true;
    }, 400);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    setIsStageLoading(true);
    setTimeout(() => {
      setIsStageLoading(false);
      const newPath = investigationPath.slice(0, index);
      setInvestigationPath(newPath);
      setModalPage(1);
      setModalSearch("");
      setModalFilters({});
      
      if (activeIssueForInvestigation) {
        const stages = getStagesConfigForIssue(activeIssueForInvestigation);
        if (index < stages.length) {
          setModalSortKey(stages[index].defaultSort.key);
          setModalSortDirection(stages[index].defaultSort.direction);
        }
      }

      userClickedStage.current = true;
    }, 400);
  };

  const handleCloseInvestigationExplorer = () => {
    setActiveIssueForInvestigation(null);
    setInvestigationPath([]);
  };

  const handleCloseWorkspace = () => {
    setShowDetails(null);
    if (activeIssueForInvestigation) {
      const stages = getStagesConfigForIssue(activeIssueForInvestigation);
      setInvestigationPath(investigationPath.slice(0, stages.length - 1));
    }
  };

  const handleDownloadSummary = (stage: InvestigationStageConfig) => {
    const timestamp = new Date().toLocaleString();
    const activeFiltersStr = Object.entries(modalFilters)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ") || "None";

    const alertMsg = `Download Successful!\n\n` +
      `File: ${stage.exportFilename}_summary.xlsx\n` +
      `Stage: ${stage.stageTitle}\n` +
      `Search Query: "${modalSearch || 'None'}"\n` +
      `Applied Filters: "${activeFiltersStr}"\n` +
      `Sorting: ${modalSortKey || 'Default'} (${modalSortDirection.toUpperCase()})\n` +
      `Records Loaded: ${modalPage * 10}\n` +
      `Timestamp: ${timestamp}\n\n` +
      `Simulated export of matching mock records.`;
    triggerToast(alertMsg);
  };



  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Dedicated workspace mode check
  if (workspaceIssueId) {
    const activeIssue = issues.find(i => i.id === workspaceIssueId);
    if (!activeIssue) {
      return (
        <div className="p-8 text-center text-muted-foreground text-sm font-sans">
          Issue {workspaceIssueId} not found.
        </div>
      );
    }

    return (
      <>
        <IssueResolutionWorkspace
          issue={activeIssue}
          onClose={() => window.close()}
          triggerToast={triggerToast}
          onUpdateIssue={(updated) => {
            const next = issues.map(x => x.id === updated.id ? updated : x);
            IssueRepository.saveIssues(next);
          }}
        />
        {toastMessage && (
          <div 
            className="fixed bottom-6 right-6 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-2 z-[9999] animate-fadeIn text-xs font-semibold"
            style={{ 
              background: "var(--card)", 
              borderColor: "var(--border)",
              color: "var(--foreground)" 
            }}
          >
            <CheckCircle size={15} style={{ color: "#10b981" }} />
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  // Calculations
  const counts = {
    "No Issue": filteredCompanyIssues.filter(i => i.type === "No Issue").length,
    "Moderate Issue": filteredCompanyIssues.filter(i => i.type === "Moderate Issue").length,
    "Close Blocker": filteredCompanyIssues.filter(i => i.type === "Close Blocker").length,
    "Total": 0
  };
  counts.Total = counts["No Issue"] + counts["Moderate Issue"] + counts["Close Blocker"];

  const getDomainCount = (domain: string, type: FSCPIssueType | null): number => {
    if (!type) return 0;
    return filteredCompanyIssues.filter(i => i.domain === domain && i.type === type).length;
  };

  const getProcessCount = (process: string, type: FSCPIssueType | null): number => {
    if (!type) return 0;
    return filteredCompanyIssues.filter(i => i.process === process && i.type === type).length;
  };

  const activeKPIFilter = selectedKPI;

  const getKPIThemeColors = (kpi: FSCPIssueType | null) => {
    if (kpi === "Close Blocker") {
      return { bg: "rgba(239, 68, 68, 0.1)", fg: "#ef4444" };
    }
    if (kpi === "Moderate Issue") {
      return { bg: "rgba(245, 158, 11, 0.1)", fg: "#f59e0b" };
    }
    if (kpi === "No Issue") {
      return { bg: "rgba(16, 185, 129, 0.1)", fg: "#10b981" };
    }
    return { bg: "rgba(107, 114, 128, 0.1)", fg: "#6b7280" };
  };

  const renderIssueBadge = (count: number, overrideKPI?: FSCPIssueType) => {
    const kpi = overrideKPI || activeKPIFilter;
    let badgeBg = "#6b7280"; // neutral grey
    if (count > 0) {
      if (kpi === "Close Blocker") {
        badgeBg = "#ef4444";
      } else if (kpi === "Moderate Issue") {
        badgeBg = "#f59e0b";
      } else if (kpi === "No Issue") {
        badgeBg = "#10b981";
      }
    }
    return (
      <span 
        className="absolute rounded-full font-bold flex items-center justify-center animate-fadeIn"
        style={{
          top: "-6px",
          right: "-6px",
          transform: "translate(25%, -25%)",
          fontSize: "9px",
          fontWeight: 800,
          background: badgeBg,
          color: "#fff",
          border: "none",
          outline: "none",
          boxShadow: "none",
          width: "18px",
          height: "18px",
          zIndex: 5
        }}
      >
        {count}
      </span>
    );
  };

  // Helper to render beautiful timeline icons dynamically
  const getTimelineIcon = (desc: string) => {
    const lower = desc.toLowerCase();
    if (lower.includes("assigned")) return <User size={10} className="text-blue-500" />;
    if (lower.includes("communication") || lower.includes("sent") || lower.includes("dispatched")) return <Send size={10} className="text-emerald-500" />;
    if (lower.includes("detected") || lower.includes("blocker")) return <AlertTriangle size={10} className="text-red-500" />;
    if (lower.includes("ai") || lower.includes("recommendation")) return <Sparkles size={10} className="text-purple-500" />;
    return <Activity size={10} className="text-slate-400" />;
  };

  const handleSelectKPI = (kpi: FSCPIssueType) => {
    setSelectedKPI(kpi);
    setSelectedDomain(null);
    setActiveProcess(null);
  };


  const handleDrillAction = (issue: FSCPIssue) => {
    const workspaceUrl = `${window.location.origin}${window.location.pathname}?mode=workspace&module=fscp&issueId=${issue.id}`;
    window.open(workspaceUrl, "_blank", "noopener,noreferrer");
  };

  const filteredIssues = filteredCompanyIssues.filter(
    i => i.process === activeProcess && i.type === activeKPIFilter
  );

  const totalImpact = filteredIssues.reduce((sum, i) => sum + i.impact, 0);

  // Domains & Processes Visibility Filtering based on View Mode (View 1 / View 2)
  const domainsToRender = Object.keys(FINANCE_DOMAINS).filter(domain => {
    if (viewMode === "View 1") return true;
    // View 2: Exceptions Only -> Only domains containing records with count > 0 for selected KPI
    return getDomainCount(domain, selectedKPI) > 0;
  });

  const getProcessesToRender = (domain: string) => {
    const allProcesses = FINANCE_DOMAINS[domain] || [];
    if (viewMode === "View 1") return allProcesses;
    // View 2: Exceptions Only -> Only processes containing records with count > 0 for selected KPI
    return allProcesses.filter(process => getProcessCount(process, selectedKPI) > 0);
  };


  return (
    <main ref={mainContainerRef} className="flex-1 overflow-y-auto px-8 py-6 relative" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div 
          className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform translate-y-0"
          style={{ 
            background: "rgba(10, 15, 30, 0.95)", 
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(100, 150, 255, 0.3)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
          }}
        >
          <div className="flex items-center justify-center rounded-full bg-blue-500/10 p-1.5" style={{ color: "#60a5fa" }}>
            <CheckCircle size={18} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          Workspace
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
          Real-time Financial Close Command Center • P06 Closing Period
        </p>
      </div>

      {/* ─── View 1 and View 2 Layout ─── */}
      <>
        {/* Choose Company / Group Context Selector (Rendered at the top for View 2) */}
        {viewMode === "View 2" && (
          <div className="rounded-xl border p-4 mb-6 animate-fadeIn" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="mb-3">
              <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Choose Company / Group
              </h2>
            </div>

            {/* Top Divider */}
            <hr className="mb-3" style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

            {/* Lightweight Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3 select-none">
              {/* Search Company */}
              <div className="relative flex-1 min-w-[200px] max-w-[320px]">
                <input
                  type="text"
                  placeholder="Search Company..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full pl-2.5 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>

              {/* Right side: Dropdown filters and clear action */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Region Filter */}
                <div className="min-w-[120px]">
                  <select
                    value={companyRegion}
                    onChange={(e) => setCompanyRegion(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)"
                    }}
                  >
                    <option value="All Regions">All Regions</option>
                    <option value="Global">Global</option>
                    <option value="North America">North America</option>
                    <option value="APAC">APAC</option>
                    <option value="Europe">Europe</option>
                  </select>
                </div>

                {/* Group Type Filter */}
                <div className="min-w-[120px]">
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)"
                    }}
                  >
                    <option value="All Types">All Types</option>
                    <option value="Global">Global</option>
                    <option value="Regional">Regional</option>
                    <option value="Shared Services">Shared Services</option>
                    <option value="Operational">Operational</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(companySearch || companyRegion !== "All Regions" || companyType !== "All Types") && (
                  <button
                    onClick={handleClearCompanyFilters}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)"
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Divider */}
            <hr className="mb-4" style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

            {filteredCompanyGroups.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                  No companies or groups match the selected filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {filteredCompanyGroups.map((group) => {
                  const isSelected = selectedCompanyGroup === group.name;
                  return (
                    <div
                      key={group.id}
                      tabIndex={0}
                      onClick={() => handleSelectCompanyGroup(group.name)}
                      onKeyDown={(e) => handleArrowNavigation(e, "company-group-card-nav")}
                      className={`company-group-card-nav rounded-lg p-3 transition-all duration-200 cursor-pointer relative border flex flex-col justify-between h-[84px] select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1 ${
                        isSelected ? "shadow-md bg-primary/5" : "hover:bg-muted/5 bg-secondary/10"
                      }`}
                      style={{
                        borderColor: isSelected ? "#3b82f6" : "var(--border)",
                        boxShadow: isSelected ? "0 2px 10px rgba(59, 130, 246, 0.15)" : "none"
                      }}
                    >
                      {/* Top Row: Code & Selection Indicator */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                          {group.code}
                        </span>
                        
                        {/* Selection Indicator Light */}
                        <span 
                          className="w-2.5 h-2.5 rounded-full border transition-all duration-200"
                          style={{
                            background: isSelected ? "#3b82f6" : "transparent",
                            borderColor: isSelected ? "#3b82f6" : "var(--border)",
                            boxShadow: isSelected ? "0 0 8px #3b82f6" : "none"
                          }}
                        />
                      </div>

                      {/* Middle Row: Name */}
                      <div className="text-[13px] font-bold text-foreground leading-snug line-clamp-2">
                        {group.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Executive Close Overview Dashboard (KPI Cards) */}
        <div className="grid grid-cols-4 gap-4 mb-8">
            
            {/* Card: Close Blockers */}
            <div 
              tabIndex={0}
              onClick={() => handleSelectKPI("Close Blocker")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectKPI("Close Blocker");
                }
              }}
              className={`rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1 ${selectedKPI === "Close Blocker" ? "shadow-md" : ""}`}
              style={{
                background: "var(--card)",
                border: selectedKPI === "Close Blocker" ? "1px solid #ef4444" : "1px solid var(--border)",
                boxShadow: selectedKPI === "Close Blocker" ? "0 4px 20px rgba(239, 68, 68, 0.15)" : "none"
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>Close Blockers</span>
                <ShieldAlert size={18} style={{ color: "#ef4444" }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: "#ef4444" }}>
                {counts["Close Blocker"]}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>Requires Immediate Resolution</p>
            </div>
 
            {/* Card: Moderate Issues */}
            <div 
              tabIndex={0}
              onClick={() => handleSelectKPI("Moderate Issue")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectKPI("Moderate Issue");
                }
              }}
              className={`rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1 ${selectedKPI === "Moderate Issue" ? "shadow-md" : ""}`}
              style={{
                background: "var(--card)",
                border: selectedKPI === "Moderate Issue" ? "1px solid #f59e0b" : "1px solid var(--border)",
                boxShadow: selectedKPI === "Moderate Issue" ? "0 4px 20px rgba(245, 158, 11, 0.15)" : "none"
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Moderate Issues</span>
                <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: "#f59e0b" }}>
                {counts["Moderate Issue"]}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>Warning Status • Track Closely</p>
            </div>
 
            {/* Card: No Issues */}
            <div 
              tabIndex={0}
              onClick={() => handleSelectKPI("No Issue")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectKPI("No Issue");
                }
              }}
              className={`rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1 ${selectedKPI === "No Issue" ? "shadow-md" : ""}`}
              style={{
                background: "var(--card)",
                border: selectedKPI === "No Issue" ? "1px solid #10b981" : "1px solid var(--border)",
                boxShadow: selectedKPI === "No Issue" ? "0 4px 20px rgba(16, 185, 129, 0.15)" : "none"
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>No Issues</span>
                <CheckCircle size={18} style={{ color: "#10b981" }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: "#10b981" }}>
                {counts["No Issue"]}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>Processes fully reconciled</p>
            </div>
 
            {/* Card: Total */}
            <div 
              className="rounded-xl px-4 py-2.5 border"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Monitor Points</span>
                <FileText size={18} style={{ color: "var(--muted-foreground)" }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
                {counts.Total}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>Standard FSCP scope</p>
            </div>
 
          </div>

          {/* Placeholder Overview when no KPI is selected */}
          {!selectedKPI && (
            <div className="text-center py-12 rounded-xl border border-dashed animate-fadeIn" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                Select Close Blockers, Moderate Issues or No Issues above to begin analysis.
              </p>
            </div>
          )}

          {/* KPI Drilldown Section */}
          {selectedKPI && (
            <>
              <div className="rounded-xl border p-5 mb-8 animate-fadeIn" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                  Domain Breakdown: {selectedKPI} List
                </h2>
                <span 
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{
                    background: getKPIThemeColors(selectedKPI).bg,
                    color: getKPIThemeColors(selectedKPI).fg
                  }}
                >
                  Active Filter: {selectedKPI}s
                </span>
              </div>

              {/* Compact horizontal row grid */}
              <div 
                className="w-full py-3 select-none"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${viewMode === "View 2" ? "auto-fill" : "9"}, minmax(${viewMode === "View 2" ? "105px" : "0px"}, 1fr))`,
                  gap: "12px"
                }}
              >
                {domainsToRender.map((domain) => {
                  const count = getDomainCount(domain, selectedKPI);
                  const isActive = selectedDomain === domain;
                  const IconComponent = DOMAIN_ICONS[domain] || DollarSign;
                  return (
                    <div
                      key={domain}
                      tabIndex={0}
                      onClick={(e) => {
                        if (count === 0) {
                          lastFocusedEmptyCardRef.current = e.currentTarget as HTMLElement;
                          let msg = "";
                          if (selectedKPI === "Close Blocker") {
                            msg = "No Close Blocker issues were identified for the selected finance domain during the current financial close cycle.";
                          } else if (selectedKPI === "Moderate Issue") {
                            msg = "No Moderate Issues were identified for the selected finance domain during the current financial close cycle.";
                          } else {
                            msg = "This finance domain currently has no reconciled items under the 'No Issues' category.";
                          }

                          setNoActiveIssuesContext({
                            title: "No Active Issues",
                            message: msg
                          });
                          setSelectedDomain(null);
                          setActiveProcess(null);
                          return;
                        }
                        const willBeActive = !isActive;
                        setSelectedDomain(willBeActive ? domain : null);
                        setActiveProcess(null);

                        if (willBeActive) {
                          userClickedDomain.current = true;
                        }
                      }}
                      onKeyDown={(e) => handleArrowNavigation(e, "finance-domain-card-nav")}
                      className={`finance-domain-card-nav p-2.5 rounded-xl border cursor-pointer transition-all duration-200 animate-fadeIn focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1`}
                      style={{
                        position: "relative",
                        background: isActive ? "var(--secondary)" : "var(--card)",
                        borderColor: isActive ? "#3b82f6" : "var(--border)",
                        boxShadow: isActive ? "0 4px 12px rgba(59, 130, 246, 0.12)" : "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center"
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = "var(--muted-foreground)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      {/* Centered count pill or spacer if zero */}
                      {count > 0 ? (
                        <div 
                          className="px-3 py-0.5 rounded-full mb-2 font-extrabold text-[13px]" 
                          style={{ 
                            background: getKPIThemeColors(selectedKPI).bg, 
                            color: getKPIThemeColors(selectedKPI).fg,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "32px",
                            height: "22px"
                          }}
                        >
                          {count}
                        </div>
                      ) : (
                        <div className="h-[22px] mb-2" />
                      )}

                      {/* Title below */}
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--foreground)", lineHeight: "1.1", wordBreak: "break-word" }}>
                        {domain}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <hr className="my-6" style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

              {/* Dynamic Area below divider */}
              {!selectedDomain ? (
                <div className="text-center py-8">
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                    Select a Finance Domain to view the business processes.
                  </p>
                </div>
              ) : (
                <div ref={businessProcessRef} id="business-process-section" className="animate-fadeIn">
                  <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4">
                    {selectedDomain} • Business Processes
                  </h2>
                  <div 
                    className="w-full py-3 select-none"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))",
                      gap: "12px"
                    }}
                  >
                    {getProcessesToRender(selectedDomain).map((process) => {
                      const count = getProcessCount(process, selectedKPI);
                      const isSelected = activeProcess === process;
                      
                      // Process icon logic: Use dedicated icon if available, fallback to Domain icon, fallback to FileText
                      const ProcessIcon = PROCESS_ICONS[process] || DOMAIN_ICONS[selectedDomain] || FileText;

                      return (
                        <div
                          key={process}
                          tabIndex={0}
                          onClick={(e) => {
                            if (count === 0) {
                              lastFocusedEmptyCardRef.current = e.currentTarget as HTMLElement;
                              let msg = "";
                              if (selectedKPI === "Close Blocker") {
                                msg = `No Close Blocker issues were identified for the selected business process: ${process} during the current financial close cycle.`;
                              } else if (selectedKPI === "Moderate Issue") {
                                msg = `No Moderate Issues were identified for the selected business process: ${process} during the current financial close cycle.`;
                              } else {
                                msg = `The business process: ${process} currently has no reconciled items under the 'No Issues' category.`;
                              }

                              setNoActiveIssuesContext({
                                title: "No Active Issues",
                                message: msg
                              });
                              setActiveProcess(null);
                              return;
                            }
                            const willBeActive = activeProcess !== process;
                            setActiveProcess(willBeActive ? process : null);

                            if (willBeActive) {
                              userClickedProcess.current = true;
                            }
                          }}
                          onKeyDown={(e) => handleArrowNavigation(e, "business-process-card-nav")}
                          className={`business-process-card-nav p-2.5 rounded-xl border cursor-pointer transition-all duration-200 animate-fadeIn focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1`}
                          style={{
                            position: "relative",
                            background: isSelected ? "var(--secondary)" : "var(--card)",
                            borderColor: isSelected ? "#3b82f6" : "var(--border)",
                            boxShadow: isSelected ? "0 4px 12px rgba(59, 130, 246, 0.12)" : "none",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = "var(--muted-foreground)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = "var(--border)";
                          }}
                        >
                          {/* Centered count pill or spacer if zero */}
                          {count > 0 ? (
                            <div 
                              className="px-3 py-0.5 rounded-full mb-2 font-extrabold text-[13px]" 
                              style={{ 
                                background: getKPIThemeColors(selectedKPI).bg, 
                                color: getKPIThemeColors(selectedKPI).fg,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: "32px",
                                height: "22px"
                              }}
                            >
                               {count}
                            </div>
                          ) : (
                            <div className="h-[22px] mb-2" />
                          )}

                          {/* Title below */}
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--foreground)", lineHeight: "1.1", wordBreak: "break-word" }}>
                            {process}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline Active Issues section */}
                  {!activeProcess ? (
                    <div 
                      className="rounded-xl border border-dashed p-8 mt-6 text-center animate-fadeIn animate-duration-300"
                      style={{ borderColor: "var(--border)", background: "var(--card)" }}
                    >
                      <FileText className="mx-auto text-muted-foreground mb-2 opacity-50" size={28} />
                      <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                        Select a Business Process to view active issues.
                      </p>
                    </div>
                  ) : (
                    <div 
                      ref={activeIssuesRef}
                      id="active-issues-section"
                      className="rounded-xl border p-6 mt-6 transition-all duration-300 ease-in-out animate-fadeIn animate-duration-300"
                      style={{
                        background: "#ffffff",
                        borderColor: "var(--border)",
                        borderLeft: `4px solid ${
                          selectedKPI === "Close Blocker" 
                            ? "#ef4444" 
                            : selectedKPI === "Moderate Issue" 
                              ? "#f59e0b" 
                              : "#10b981"
                        }`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                      }}
                    >
                      {/* Breadcrumb */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 font-medium">
                        <span>Close Blockers</span>
                        <span className="text-slate-400">›</span>
                        <span>{selectedDomain}</span>
                        <span className="text-slate-400">›</span>
                        <span>{activeProcess}</span>
                      </div>

                      {/* Header Title and Context Summary */}
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-bold text-foreground">Active Issues</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Showing {filteredIssues.length} {selectedKPI === "Close Blocker" ? "Close Blocker" : selectedKPI === "Moderate Issue" ? "Moderate Issue" : "No Issue"}{filteredIssues.length !== 1 ? "s" : ""} for {activeProcess}
                          </p>
                        </div>
                        <button
                          disabled={filteredIssues.length === 0}
                          onClick={() => triggerToast("Direct download is only available for individual issue reports.")}
                          className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border"
                          style={{ 
                            background: "var(--secondary)", 
                            borderColor: "var(--border)", 
                            color: filteredIssues.length === 0 ? "var(--muted-foreground)" : "var(--foreground)",
                            cursor: filteredIssues.length === 0 ? "not-allowed" : "pointer" 
                          }}
                        >
                          <Download size={13} />
                          Download Summary
                        </button>
                      </div>

                      {/* Issue Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans" style={{ borderCollapse: "collapse" }}>
                           <thead>
                            <tr className="border-b" style={{ borderColor: "var(--border)", fontSize: 11, color: "var(--muted-foreground)" }}>
                              <th className="py-2 font-bold">Issue Details</th>
                              <th className="py-2 font-bold">Status</th>
                              <th className="py-2 font-bold">Severity</th>
                              <th className="py-2 font-bold">Ageing</th>
                              <th className="py-2 font-bold text-right">Financial Impact</th>
                              <th className="py-2 font-bold text-right pr-4 w-32">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredIssues.map((issue) => (
                              <tr 
                                key={issue.id} 
                                tabIndex={0}
                                onClick={(e) => {
                                  lastFocusedIssueRowRef.current = e.currentTarget as HTMLElement;
                                  handleStartInvestigation(issue);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    lastFocusedIssueRowRef.current = e.currentTarget as HTMLElement;
                                    handleStartInvestigation(issue);
                                  }
                                }}
                                className="border-b hover:bg-muted/10 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:bg-muted/10" 
                                style={{ borderColor: "var(--border)", fontSize: 12 }}
                              >
                                <td className="py-2.5 pr-4">
                                  <div className="font-semibold text-foreground">{issue.name}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{issue.id}</div>
                                </td>
                                <td className="py-2.5">
                                  <span style={{ color: issue.status === "In Progress" ? "#3b82f6" : issue.status === "Resolved" ? "#10b981" : "#f59e0b", fontWeight: 600 }}>
                                    {issue.status}
                                  </span>
                                </td>
                                <td className="py-2.5">
                                  <span style={{ 
                                    color: issue.severity === "Critical" ? "#ef4444" : issue.severity === "High" ? "#f59e0b" : issue.severity === "Medium" ? "#3b82f6" : "var(--muted-foreground)", 
                                    fontWeight: 600 
                                  }}>
                                    {issue.severity}
                                  </span>
                                </td>
                                <td className="py-2.5 text-muted-foreground">
                                  {issue.ageingDays} Days
                                </td>
                                <td className="py-2.5 text-right font-semibold text-foreground">
                                  ${issue.impact.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-right pr-4 text-blue-500 font-semibold font-sans">
                                  <span className="inline-flex items-center justify-center p-1.5 rounded hover:bg-blue-500/10 transition-colors" title="Dive Deep">
                                    <SquareArrowOutUpRight size={14} />
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Info (Total Impact only) */}
                      <div className="flex justify-between items-center mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                          Total Impact: <span style={{ color: "#ef4444" }}>${totalImpact.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </>
          )}
      </>

      {activeIssueForInvestigation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div 
            id="investigation-explorer-modal"
            className="w-full max-w-5xl rounded-xl border flex flex-col h-[80vh] shadow-2xl overflow-hidden"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            {(() => {
              const stages = getStagesConfigForIssue(activeIssueForInvestigation);
              const currentStageIndex = investigationPath.length;
              const safeStageIndex = Math.min(currentStageIndex, stages.length - 1);
              const stage = stages[safeStageIndex];
              const IconComp = stage?.icon || FileText;

              const breadcrumbs = [
                "Close Blockers",
                activeIssueForInvestigation.domain,
                activeIssueForInvestigation.process,
                activeIssueForInvestigation.name,
                ...investigationPath.map(p => p.label)
              ];

              const pageSize = 10;
              const { rows, totalCount, filteredCount } = generateMockRowsForStage(
                stage,
                activeIssueForInvestigation,
                investigationPath,
                modalSearch,
                modalFilters,
                modalPage,
                pageSize,
                modalSortKey,
                modalSortDirection
              );

              return (
                <>
                  {/* Top Bar / Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
                    <div className="flex-1 min-w-0 pr-4">
                      {/* Breadcrumbs */}
                      <div className="flex items-center flex-wrap gap-1 text-[11px] text-muted-foreground font-medium mb-1.5 select-none">
                        {breadcrumbs.map((bc, idx) => {
                          const isLast = idx === breadcrumbs.length - 1;
                          return (
                            <span key={idx} className="flex items-center gap-1">
                              {idx > 0 && <span className="text-slate-400 font-normal">/</span>}
                              <span 
                                onClick={() => {
                                  if (isLast) return;
                                  if (idx === 3) {
                                    handleNavigateBreadcrumb(0);
                                  } else if (idx >= 4) {
                                    handleNavigateBreadcrumb(idx - 3);
                                  } else {
                                    handleCloseInvestigationExplorer();
                                  }
                                }}
                                className={`transition-colors ${isLast ? "text-foreground font-semibold" : "cursor-pointer hover:text-blue-500"}`}
                              >
                                {bc}
                              </span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Dynamic Title (Stage Title) */}
                      <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                        <IconComp size={18} className="text-blue-500" />
                        {stage?.stageTitle}
                      </h3>
                      <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 1 }}>
                        {stage?.description}
                      </p>
                    </div>

                    <button 
                      onClick={handleCloseInvestigationExplorer}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
                      className="p-1 rounded-full hover:bg-muted/50 transition-colors flex-shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Toolbar & Filter Actions row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-6 py-3 border-b flex-shrink-0 bg-muted/20" style={{ borderColor: "var(--border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
                      {isStageLoading ? (
                        <span>Simulating data retrieval...</span>
                      ) : (
                        <span>
                          Showing <strong className="text-foreground">{rows.length}</strong> of{" "}
                          <strong className="text-foreground">{filteredCount.toLocaleString()}</strong> {stage?.stageTitle === "LOB Units / Branch" ? "LOB Units / Branches" : stage?.stageTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={stage?.stageTitle === "LOB Units / Branch" ? "Search LOB Units / Branches..." : `Search ${stage?.stageTitle.toLowerCase()}...`}
                          value={modalSearch}
                          onChange={(e) => {
                            setModalSearch(e.target.value);
                            setModalPage(1);
                          }}
                          className="pl-2.5 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{
                            background: "var(--card)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                            width: "180px"
                          }}
                        />
                      </div>

                      {stage?.filters.map((filt) => {
                        const currentValue = modalFilters[filt.key] || filt.options[0];
                        return (
                          <select
                            key={filt.key}
                            value={currentValue}
                            onChange={(e) => {
                              setModalFilters(prev => ({
                                ...prev,
                                [filt.key]: e.target.value
                              }));
                              setModalPage(1);
                            }}
                            className="px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            style={{
                              background: "var(--card)",
                              borderColor: "var(--border)",
                              color: "var(--foreground)"
                            }}
                          >
                            {filt.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        );
                      })}

                      <button
                        onClick={() => handleDownloadSummary(stage)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/50 transition-colors"
                        style={{
                          background: "var(--card)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                          cursor: "pointer"
                        }}
                      >
                        <Download size={13} />
                        Download Summary
                      </button>
                    </div>
                  </div>

                  {/* Main Scrollable Working Table Area */}
                  <div ref={modalScrollContainerRef} id="modal-scroll-container" className="flex-1 overflow-y-auto p-6 relative">
                    {isStageLoading ? (
                      <div className="absolute inset-0 bg-card/65 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 animate-fadeIn">
                        <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <span className="text-xs font-semibold text-muted-foreground">Retrieving enterprise records...</span>
                      </div>
                    ) : null}

                    {rows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                          <Activity size={20} className="opacity-60" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground mb-1">No Records Found</h4>
                        <p style={{ fontSize: 11, color: "var(--muted-foreground)", maxWidth: "280px" }}>
                          {stage?.emptyStateMessage || "No records matched your search query or applied filters."}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border rounded-xl" style={{ borderColor: "var(--border)" }}>
                        <table className="w-full text-left font-sans" style={{ borderCollapse: "collapse" }}>
                          <thead>
                            <tr className="border-b bg-muted/10" style={{ borderColor: "var(--border)", fontSize: 11, color: "var(--muted-foreground)" }}>
                              {stage?.columns.map((col) => (
                                <th 
                                  key={col.key} 
                                  onClick={() => {
                                    if (modalSortKey === col.key) {
                                      setModalSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                    } else {
                                      setModalSortKey(col.key);
                                      setModalSortDirection("desc");
                                    }
                                  }}
                                  className={`py-3 px-4 font-bold select-none cursor-pointer hover:text-foreground transition-colors ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                                >
                                  <div className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                                    {col.label}
                                    {modalSortKey === col.key && (
                                      <span className="text-[10px] text-blue-500 font-mono">
                                        {modalSortDirection === "asc" ? "▲" : "▼"}
                                      </span>
                                    )}
                                  </div>
                                </th>
                              ))}
                              <th className="py-3 px-4 font-bold text-right pr-4 w-32">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, rIdx) => {
                              return (
                                <tr
                                  key={rIdx}
                                  ref={rIdx === (modalPage - 1) * pageSize ? loadMoreRowRef : undefined}
                                  tabIndex={0}
                                  onClick={() => handleSelectStageRecord(row, stage)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSelectStageRecord(row, stage);
                                    }
                                  }}
                                  className="border-b hover:bg-muted/20 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:bg-muted/10"
                                  style={{ borderColor: "var(--border)", fontSize: 12 }}
                                >
                                  {stage?.columns.map((col) => {
                                    const value = row[col.key];
                                    return (
                                      <td 
                                        key={col.key} 
                                        className={`py-3 px-4 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                                      >
                                        {col.type === "currency" ? (
                                          <span className="font-semibold text-foreground">
                                            ${typeof value === "number" ? value.toLocaleString() : value}
                                          </span>
                                        ) : col.type === "status" ? (
                                          <span style={{
                                            color: value === "Resolved" || value === "Closed" ? "#10b981" : value === "In Progress" ? "#3b82f6" : "#f59e0b",
                                            fontWeight: 600
                                          }}>
                                            {value}
                                          </span>
                                        ) : col.type === "number" ? (
                                          <span className="text-foreground">{value}</span>
                                        ) : (
                                          <span className="text-foreground">{value}</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                   <td className="py-3 px-4 text-right pr-4 text-blue-500 font-semibold font-sans">
                                     <span className="inline-flex items-center justify-center p-1.5 rounded hover:bg-blue-500/10 transition-colors" title="Dive Deep">
                                       <SquareArrowOutUpRight size={14} />
                                     </span>
                                   </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Table Footer with Load More */}
                  {!isStageLoading && rows.length > 0 && modalPage * pageSize < filteredCount && (
                    <div className="flex justify-center items-center px-6 py-4 border-t flex-shrink-0 bg-muted/5 font-sans" style={{ borderColor: "var(--border)" }}>
                      <button
                        onClick={() => {
                          userClickedLoadMore.current = true;
                          setModalPage(p => p + 1);
                        }}
                        className="px-6 py-2 rounded-lg border text-xs font-bold hover:bg-muted/50 transition-colors cursor-pointer"
                        style={{
                          background: "var(--card)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)"
                        }}
                      >
                        Load More
                      </button>
                    </div>
                  )}

                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── 5. No Active Issues Dialog Overlay ─── */}
      {noActiveIssuesContext && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div 
            id="no-active-issues-dialog"
            className="w-full max-w-md rounded-xl border p-6 flex flex-col items-center justify-center text-center shadow-2xl animate-fadeIn"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
              <CheckCircle size={24} />
            </div>
            
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>
              {noActiveIssuesContext.title}
            </h3>
            
            <p className="mt-2 mb-6 text-center text-xs" style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              {noActiveIssuesContext.message}
            </p>

            <button
              onClick={() => setNoActiveIssuesContext(null)}
              className="px-5 py-2 rounded text-xs font-bold border-none cursor-pointer w-full transition-colors"
              style={{ background: "var(--foreground)", color: "var(--background)" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── 6. Upload Documents Dialog Overlay ─── */}
      <FSCPUploadDocumentsModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={(uploadedFiles, result) => {
          if (result.company) {
            setSelectedCompanyGroup(result.company);
          }
          if (result.kpi) {
            setSelectedKPI(result.kpi as FSCPIssueType);
          }
          if (result.domain) {
            setSelectedDomain(result.domain);
          }
          if (result.process) {
            setActiveProcess(result.process);
          }
          userClickedProcess.current = true;
          setShowUploadModal(false);
        }}
      />

    </main>
  );
}
