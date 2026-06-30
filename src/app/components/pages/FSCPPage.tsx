import { useState } from "react";
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
  Activity
} from "lucide-react";

// Types
export type FSCPIssueType = "No Issue" | "Moderate Issue" | "Close Blocker";

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
}

// Initial mockup data
const INITIAL_ISSUES: FSCPIssue[] = [
  {
    id: "BLK-FA-2026-001",
    name: "Fixed Asset Depreciation Mismatch",
    domain: "Core Finance",
    process: "Fixed Assets",
    impact: 145000,
    type: "Close Blocker",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "AST-9812-A",
    subAssetNumber: "0000",
    assetDescription: "HQ Server Hardware Rack Blade 4",
    blockerType: "Depreciation Discrepancy",
    severity: "Critical",
    reason: "The physical server asset tag does not match the active ledger inventory due to an unposted retirement event in P05. This discrepancy blocks standard month-end deprecation journal generation.",
    sourceFile: "fixed_assets_ledger_v2.xlsx",
    suggestedAction: [
      "Update the asset tag and assign the responsible owner.",
      "Validate the physical existence of the asset.",
      "Complete the required master data corrections.",
      "Re-run the validation before financial close."
    ],
    ownerRole: "Fixed Asset Manager",
    status: "Open",
    ageingDays: 5
  },
  {
    id: "BLK-AP-2026-003",
    name: "High Value Goods Receipt Invoice Unmatched",
    domain: "Core Finance",
    process: "Accounts Payable",
    impact: 890000,
    type: "Close Blocker",
    companyCode: "EU02",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "GRN-2026-5541",
    subAssetNumber: "N/A",
    assetDescription: "Bulk Steel Shipment Inbound",
    blockerType: "Three-way Match Lock",
    severity: "High",
    reason: "A purchase order invoice was loaded without matching a signed goods receipt note (GRN). Due to the high value threshold limit, the system placed a strict hard-block on the close subledger.",
    sourceFile: "grn_matching_ledger.csv",
    suggestedAction: [
      "Retrieve the signed paper GRN from the logistics vault.",
      "Verify the quantity differences with the supplier.",
      "Force-clear the match code status after senior management sign-off."
    ],
    ownerRole: "Accounts Payable Lead",
    status: "Open",
    ageingDays: 7
  },
  {
    id: "BLK-IA-2026-005",
    name: "Inventory Valuation Discrepancy",
    domain: "Transaction Finance",
    process: "Inventory Accounting",
    impact: 670000,
    type: "Close Blocker",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "INV-RACK-B",
    subAssetNumber: "0012",
    assetDescription: "Finished Goods Stored in Warehouse A",
    blockerType: "Valuation Mismatch",
    severity: "High",
    reason: "A system sync lag led to a cost mismatch between the warehouse log (WMS) and the core general ledger. Standard inventory write-downs cannot be processed.",
    sourceFile: "inventory_wms_reconciliation.xlsx",
    suggestedAction: [
      "Trigger manual synchronization on the warehouse database gateway.",
      "Audit physical storage racks for goods category variance.",
      "Update system unit costs manually."
    ],
    ownerRole: "Inventory Accountant",
    status: "Open",
    ageingDays: 4
  },
  {
    id: "BLK-IC-2026-006",
    name: "Intercompany Trade Balance Variance",
    domain: "Intercompany Finance",
    process: "Advances, Receivables & Confirmation",
    impact: 1250000,
    type: "Close Blocker",
    companyCode: "GL-US / GL-EU",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "IC-TR-991",
    subAssetNumber: "0000",
    assetDescription: "Cross-border component sales",
    blockerType: "Intercompany Out-of-Balance",
    severity: "Critical",
    reason: "Transaction US-0182 was recorded as revenue in GL-US but was not posted as a liability in GL-EU due to a currency conversion difference. The group-level close is blocked.",
    sourceFile: "intercompany_recon_sheet_june.csv",
    suggestedAction: [
      "Post missing intercompany journal voucher in GL-EU.",
      "Adjust exchange rates in line with standard group directives.",
      "Run the balance validation scripts."
    ],
    ownerRole: "Group Treasury Director",
    status: "Open",
    ageingDays: 8
  },
  {
    id: "BLK-GA-2026-007",
    name: "Accrual Ledger Database Read Failure",
    domain: "General Accounting",
    process: "Accrual Journals",
    impact: 450000,
    type: "Close Blocker",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "ACR-SYS-99",
    subAssetNumber: "0000",
    assetDescription: "Oracle Cloud Accrual Subsystem",
    blockerType: "Ledger Read Variance",
    severity: "High",
    reason: "Standard accrual routines locked after a transaction database timeout. The subledger has not yet been rolled into the general ledger.",
    sourceFile: "accruals_database_log.txt",
    suggestedAction: [
      "Contact IT DBA to clear transaction locks.",
      "Run database rebuild script on target subledger tables.",
      "Manually trigger month-end consolidation."
    ],
    ownerRole: "Accounting Systems Manager",
    status: "Open",
    ageingDays: 3
  },
  {
    id: "MOD-GL-2026-010",
    name: "Fixed Assets Suspense Account Balance",
    domain: "Core Finance",
    process: "General Ledger",
    impact: 34000,
    type: "Moderate Issue",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "N/A",
    subAssetNumber: "N/A",
    assetDescription: "FA Suspense Clearing Accounts",
    blockerType: "Suspense Cleardown Variance",
    severity: "Medium",
    reason: "A small transaction flow was routed to a suspense account pending identification of the correct cost center.",
    sourceFile: "gl_suspense_reconciled.xlsx",
    suggestedAction: [
      "Identify correct department mapping.",
      "Post correcting clearing journal entry."
    ],
    ownerRole: "General Accounting Lead",
    status: "Open",
    ageingDays: 14
  },
  {
    id: "MOD-AP-2026-011",
    name: "Vendor Invoice Missing Tax Certificate",
    domain: "Core Finance",
    process: "Accounts Payable",
    impact: 78000,
    type: "Moderate Issue",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "N/A",
    subAssetNumber: "N/A",
    assetDescription: "Invoice from Green Facilities",
    blockerType: "Compliance Audit Hold",
    severity: "Medium",
    reason: "Invoice payment is currently on hold as the vendor has not provided an updated tax compliance exemption form.",
    sourceFile: "compliance_checklist_v1.xlsx",
    suggestedAction: [
      "Request tax exemption form from Green Facilities account lead.",
      "Temporarily release hold if formal waiver is provided."
    ],
    ownerRole: "Accounts Payable Clerk",
    status: "Open",
    ageingDays: 10
  },
  {
    id: "MOD-AR-2026-012",
    name: "Aging Collections Exception Credit",
    domain: "Core Finance",
    process: "Accounts Receivable",
    impact: 120000,
    type: "Moderate Issue",
    companyCode: "IN02",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "CUST-8022",
    subAssetNumber: "N/A",
    assetDescription: "Acme Asia Outstanding Invoice Balance",
    blockerType: "Aging Debt Dispute",
    severity: "Medium",
    reason: "Customer requested clarification on raw freight pricing before clearing invoice payment. Pending resolution.",
    sourceFile: "outstanding_receivables_aging.csv",
    suggestedAction: [
      "Send updated freight breakdown sheet.",
      "Agree on partial settlement."
    ],
    ownerRole: "Collections Manager",
    status: "Open",
    ageingDays: 20
  },
  {
    id: "MOD-IA-2026-015",
    name: "Inventory Cost Model Recalculation Hold",
    domain: "Transaction Finance",
    process: "Inventory Accounting",
    impact: 55000,
    type: "Moderate Issue",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "FIFO-MOD-1",
    subAssetNumber: "N/A",
    assetDescription: "Cost recalculation models",
    blockerType: "Cost Revaluation Delay",
    severity: "Medium",
    reason: "The FIFO pricing routine flagged a single component cost outlier which needs manual override review.",
    sourceFile: "inventory_fifo_cost.xlsx",
    suggestedAction: [
      "Override cost outlier flags in system console.",
      "Recalculate cost totals."
    ],
    ownerRole: "Inventory Accountant",
    status: "Open",
    ageingDays: 5
  },
  {
    id: "MOD-P2P-2026-018",
    name: "Supplier Invoice Batch Approval Delay",
    domain: "Transaction Finance",
    process: "Procure-to-Pay",
    impact: 195000,
    type: "Moderate Issue",
    companyCode: "EU02",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "BATCH-890",
    subAssetNumber: "N/A",
    assetDescription: "Batch Invoices from SwiftCargo",
    blockerType: "Batch Approval Delay",
    severity: "Medium",
    reason: "A cargo transit delay triggered an invoice dispute, holding up standard batch approvals.",
    sourceFile: "p2p_invoice_disputes.csv",
    suggestedAction: [
      "Verify delivery sign-off records.",
      "Release undisputed invoices in batch."
    ],
    ownerRole: "Procurement Auditor",
    status: "Open",
    ageingDays: 6
  },
  {
    id: "MOD-IC-2026-020",
    name: "Intercompany Booking Discrepancy",
    domain: "Intercompany Finance",
    process: "AP Booking",
    impact: 60000,
    type: "Moderate Issue",
    companyCode: "GL-EU",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "N/A",
    subAssetNumber: "N/A",
    assetDescription: "Services Intercompany Allocations",
    blockerType: "Unbooked Intercompany Charge",
    severity: "Medium",
    reason: "A monthly management fee invoice was loaded under the wrong cost center in GL-EU.",
    sourceFile: "intercompany_bookings.csv",
    suggestedAction: [
      "Re-allocate charge to correct management cost center.",
      "Clear discrepancies."
    ],
    ownerRole: "Intercompany Specialist",
    status: "Open",
    ageingDays: 4
  },
  {
    id: "MOD-GA-2026-022",
    name: "Month-End Allocation Variance",
    domain: "General Accounting",
    process: "Allocations",
    impact: 85000,
    type: "Moderate Issue",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "ALLOC-R-12",
    subAssetNumber: "N/A",
    assetDescription: "Corporate Overhead Allocation Rollup",
    blockerType: "Allocation Run Variance",
    severity: "Medium",
    reason: "Overhead expense allocation rules did not balance to zero due to a newly added business unit without a designated driver.",
    sourceFile: "allocation_rules_ledger.xlsx",
    suggestedAction: [
      "Assign correct driver allocation rules for the new business unit.",
      "Execute cost rollup simulation."
    ],
    ownerRole: "Corporate Controller",
    status: "Open",
    ageingDays: 5
  },
  {
    id: "MOD-RC-2026-025",
    name: "Balance Sheet Schedule Variance",
    domain: "Reporting & Compliance",
    process: "Balance Sheet Notes / Schedules",
    impact: 95000,
    type: "Moderate Issue",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "SCH-BS-8",
    subAssetNumber: "N/A",
    assetDescription: "Notes on Deferred Income Taxes",
    blockerType: "Schedule Audit Variance",
    severity: "Medium",
    reason: "Audit schedule template had formula error in line 12 leading to minor variance against reported balances.",
    sourceFile: "bs_schedule_notes.xlsx",
    suggestedAction: [
      "Correct formula in audit schedule template.",
      "Validate balance sheet outputs."
    ],
    ownerRole: "Reporting Manager",
    status: "Open",
    ageingDays: 3
  },
  {
    id: "MOD-FP-2026-028",
    name: "Budget Roll Forward Validation Hold",
    domain: "Financial Planning",
    process: "Final Budget / Forecast Sign-Off",
    impact: 110000,
    type: "Moderate Issue",
    companyCode: "US01",
    fiscalYear: "2026",
    period: "P06 (June)",
    assetNumber: "N/A",
    subAssetNumber: "N/A",
    assetDescription: "OpEx forecast model roll forward",
    blockerType: "Roll Forward Hold",
    severity: "Medium",
    reason: "A division lead is currently out of office, holding up the final sign-off validation checklist for Q3 forecasts.",
    sourceFile: "forecast_signoff_log.txt",
    suggestedAction: [
      "Request temporary delegation authority from secondary lead.",
      "Mark Q3 checklist as provisionally approved."
    ],
    ownerRole: "Planning Director",
    status: "Open",
    ageingDays: 4
  }
];

// Domains mapping to their processes list
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

// Domain Icons lookup
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

export function FSCPPage() {
  const [issues, setIssues] = useState<FSCPIssue[]>(INITIAL_ISSUES);
  const [selectedKPI, setSelectedKPI] = useState<FSCPIssueType | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  
  // Modals state
  const [showIssueList, setShowIssueList] = useState(false);
  const [showDetails, setShowDetails] = useState<FSCPIssue | null>(null);
  const [showComposer, setShowComposer] = useState<FSCPIssue | null>(null);
  
  // Email template state
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  // Success banner / toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // KPI Calculations
  const counts = {
    "No Issue": issues.filter(i => i.type === "No Issue").length + 45, // Add offset to simulate realistic counts
    "Moderate Issue": issues.filter(i => i.type === "Moderate Issue").length,
    "Close Blocker": issues.filter(i => i.type === "Close Blocker").length,
    "Total": 0
  };
  counts.Total = counts["No Issue"] + counts["Moderate Issue"] + counts["Close Blocker"];

  // Domain Calculations
  const getDomainCount = (domain: string, type: FSCPIssueType | null): number => {
    if (!type) return 0;
    if (type === "No Issue") {
      const distributions: Record<string, number> = {
        "Core Finance": 10,
        "Transaction Finance": 8,
        "Intercompany Finance": 7,
        "General Accounting": 5,
        "Reporting & Compliance": 6,
        "Financial Planning": 4,
        "Tax & Compliance": 3,
        "Planning & Control": 1,
        "Intelligence & Risk": 1
      };
      return distributions[domain] || 0;
    }
    return issues.filter(i => i.domain === domain && i.type === type).length;
  };

  // Process Calculations
  const getProcessCount = (process: string, type: FSCPIssueType | null): number => {
    if (!type) return 0;
    if (type === "No Issue") {
      return process === "Bank & Cash" ? 2 : 1;
    }
    return issues.filter(i => i.process === process && i.type === type).length;
  };

  // Handlers
  const handleSelectKPI = (kpi: FSCPIssueType) => {
    setSelectedKPI(kpi);
    setSelectedDomain(null); // Clear active domain upon KPI type switch to avoid mismatch
    setActiveProcess(null);
  };

  const handleOpenProcess = (process: string) => {
    setActiveProcess(process);
    setShowIssueList(true);
  };

  const handleDrillAction = (issue: FSCPIssue) => {
    setShowDetails(issue);
    setShowIssueList(false);
  };

  const handleDownloadReport = (issue: FSCPIssue) => {
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
Sub Asset Number:    ${issue.subAssetNumber}
Asset Description:   ${issue.assetDescription}
Blocker Type:        ${issue.blockerType}
Source File:         ${issue.sourceFile}
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

  const handleOpenComposer = (issue: FSCPIssue) => {
    setEmailTo("finance-close-control@datatwin.ai");
    setEmailSubject(`[FSCP Action Required] Issue ${issue.id} - ${issue.name}`);
    setEmailBody(`Hello Team,

Please find the details of the close issue identified for the current financial cycle.

- Issue ID: ${issue.id}
- Summary: ${issue.name}
- Financial Impact: $${issue.impact.toLocaleString()}
- Assigned Owner: ${issue.ownerRole}

Suggested Remediation Action:
${issue.suggestedAction.map((act) => `- ${act}`).join("\n")}

Please review and confirm remediation steps as soon as possible to prevent close delays.

Regards,
Finance Close Command Center`);
    setShowComposer(issue);
  };

  const handleSendEmail = () => {
    if (!showComposer) return;
    
    setIssues(prev => prev.map(issue => {
      if (issue.id === showComposer.id) {
        return {
          ...issue,
          status: "In Progress" as const
        };
      }
      return issue;
    }));

    if (showDetails && showDetails.id === showComposer.id) {
      setShowDetails(prev => prev ? { ...prev, status: "In Progress" } : null);
    }

    setShowComposer(null);
    triggerToast(`Notification email successfully dispatched. Status updated to 'In Progress'.`);
  };

  const filteredIssues = issues.filter(
    i => i.process === activeProcess && i.type === selectedKPI
  );

  const totalImpact = filteredIssues.reduce((sum, i) => sum + i.impact, 0);

  return (
    <main className="flex-1 overflow-y-auto px-8 py-6 relative" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      
      {/* Dynamic Action Toast Alert */}
      {toastMessage && (
        <div 
          className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform translate-y-0"
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

      {/* Header Close Command Info */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Financial Statement Close Process
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
            Real-time Financial Close Command Center • P06 Closing Period
          </p>
        </div>
      </div>

      {/* ─── 1. Executive Close Overview Dashboard (KPI Cards) ─── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        
        {/* Card: Close Blockers */}
        <div 
          onClick={() => handleSelectKPI("Close Blocker")}
          className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${selectedKPI === "Close Blocker" ? "shadow-md" : ""}`}
          style={{
            background: "var(--card)",
            border: selectedKPI === "Close Blocker" ? "1px solid #ef4444" : "1px solid var(--border)",
            boxShadow: selectedKPI === "Close Blocker" ? "0 4px 20px rgba(239, 68, 68, 0.15)" : "none"
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>Close Blockers</span>
            <ShieldAlert size={18} style={{ color: "#ef4444" }} />
          </div>
          <div className="text-3xl font-extrabold" style={{ color: "#ef4444" }}>
            {counts["Close Blocker"]}
          </div>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Requires Immediate Resolution</p>
        </div>

        {/* Card: Moderate Issues */}
        <div 
          onClick={() => handleSelectKPI("Moderate Issue")}
          className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${selectedKPI === "Moderate Issue" ? "shadow-md" : ""}`}
          style={{
            background: "var(--card)",
            border: selectedKPI === "Moderate Issue" ? "1px solid #f59e0b" : "1px solid var(--border)",
            boxShadow: selectedKPI === "Moderate Issue" ? "0 4px 20px rgba(245, 158, 11, 0.15)" : "none"
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Moderate Issues</span>
            <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
          </div>
          <div className="text-3xl font-extrabold" style={{ color: "#f59e0b" }}>
            {counts["Moderate Issue"]}
          </div>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Warning Status • Track Closely</p>
        </div>

        {/* Card: No Issues */}
        <div 
          onClick={() => handleSelectKPI("No Issue")}
          className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${selectedKPI === "No Issue" ? "shadow-md" : ""}`}
          style={{
            background: "var(--card)",
            border: selectedKPI === "No Issue" ? "1px solid #10b981" : "1px solid var(--border)",
            boxShadow: selectedKPI === "No Issue" ? "0 4px 20px rgba(16, 185, 129, 0.15)" : "none"
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>No Issues</span>
            <CheckCircle size={18} style={{ color: "#10b981" }} />
          </div>
          <div className="text-3xl font-extrabold" style={{ color: "#10b981" }}>
            {counts["No Issue"]}
          </div>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Processes fully reconciled</p>
        </div>

        {/* Card: Total */}
        <div 
          className="rounded-xl p-4 border"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Monitor Points</span>
            <FileText size={18} style={{ color: "var(--muted-foreground)" }} />
          </div>
          <div className="text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
            {counts.Total}
          </div>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Standard FSCP scope</p>
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

      {/* ─── 2. KPI Drilldown Section (Domains Row + Divider + Dynamic Area) ─── */}
      {selectedKPI && (
        <div className="rounded-xl border p-5 mb-8 animate-fadeIn" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
              Domain Breakdown: {selectedKPI} List
            </h2>
            <span 
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{
                background: selectedKPI === "Close Blocker" ? "rgba(239, 68, 68, 0.1)" : selectedKPI === "Moderate Issue" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                color: selectedKPI === "Close Blocker" ? "#ef4444" : selectedKPI === "Moderate Issue" ? "#f59e0b" : "#10b981"
              }}
            >
              Active Filter: {selectedKPI}s
            </span>
          </div>

          {/* Compact horizontal row grid (9 cols) */}
          <div className="grid grid-cols-9 gap-3 w-full py-3 select-none">
            {Object.keys(FINANCE_DOMAINS).map((domain) => {
              const count = getDomainCount(domain, selectedKPI);
              const isActive = selectedDomain === domain;
              const IconComponent = DOMAIN_ICONS[domain] || DollarSign;
              return (
                <div
                  key={domain}
                  onClick={() => {
                    setSelectedDomain(isActive ? null : domain);
                    setActiveProcess(null);
                  }}
                  className="p-2.5 rounded-xl border cursor-pointer transition-all duration-200"
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
                  {/* Overlapping badge: 50% in, 50% out */}
                  <span 
                    className="absolute rounded-full font-bold px-1.5 py-0.5"
                    style={{
                      top: "-6px",
                      right: "-6px",
                      transform: "translate(25%, -25%)",
                      fontSize: "9px",
                      fontWeight: 800,
                      border: "2px solid var(--card)",
                      background: count > 0 ? (selectedKPI === "Close Blocker" ? "#ef4444" : "#f59e0b") : "var(--border)",
                      color: count > 0 ? "#fff" : "var(--muted-foreground)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
                      zIndex: 5
                    }}
                  >
                    {count}
                  </span>

                  {/* Centered icon */}
                  <div 
                    className="p-1.5 rounded-lg mb-2" 
                    style={{ 
                      background: isActive ? "rgba(59, 130, 246, 0.1)" : "var(--border)", 
                      color: isActive ? "#3b82f6" : "var(--muted-foreground)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <IconComponent size={16} />
                  </div>

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
            <div className="animate-fadeIn">
              <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4">
                {selectedDomain} • Business Processes
              </h2>

              <div className="grid grid-cols-4 gap-3">
                {FINANCE_DOMAINS[selectedDomain].map((process) => {
                  const count = getProcessCount(process, selectedKPI);
                  return (
                    <div
                      key={process}
                      onClick={() => handleOpenProcess(process)}
                      className="flex flex-col justify-between p-3.5 rounded-lg border cursor-pointer transition-all duration-150"
                      style={{
                        background: "var(--secondary)",
                        borderColor: "var(--border)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#3b82f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                          {process}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Selected Issues</span>
                        <span 
                          className="px-1.5 py-0.5 rounded text-xs font-bold"
                          style={{
                            background: count > 0 ? (selectedKPI === "Close Blocker" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)") : "rgba(255,255,255,0.05)",
                            color: count > 0 ? (selectedKPI === "Close Blocker" ? "#ef4444" : "#f59e0b") : "var(--muted-foreground)"
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─── 4. Issue List Modal ─── */}
      {showIssueList && activeProcess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-3xl rounded-xl border flex flex-col max-h-[85vh] shadow-2xl"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-base font-bold">{activeProcess} Close Issues</h3>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{selectedDomain} • Level: {selectedKPI}</p>
              </div>
              <button 
                onClick={() => { setShowIssueList(false); setActiveProcess(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              
              {filteredIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                    <CheckCircle size={24} />
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>No Active Issues</h4>
                  <p className="max-w-md mt-2" style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                    No {selectedKPI === "Close Blocker" ? "Close Blocker" : selectedKPI === "Moderate Issue" ? "Moderate Issue" : "No Issue"} issues were identified for the selected business process during the current financial close cycle.
                  </p>
                </div>
              ) : (
                <div>
                  <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border)", fontSize: 11, color: "var(--muted-foreground)" }}>
                        <th className="py-2.5 font-bold">Issue Name</th>
                        <th className="py-2.5 font-bold text-right">Financial Impact</th>
                        <th className="py-2.5 font-bold text-center w-28">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.map((issue) => (
                        <tr 
                          key={issue.id} 
                          className="border-b" 
                          style={{ borderColor: "var(--border)", fontSize: 12 }}
                        >
                          <td className="py-3">
                            <div className="font-semibold text-foreground">{issue.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{issue.id} • Status: <span style={{ color: issue.status === "In Progress" ? "#3b82f6" : "#f59e0b", fontWeight: 600 }}>{issue.status}</span></div>
                          </td>
                          <td className="py-3 text-right font-semibold">
                            ${issue.impact.toLocaleString()}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDrillAction(issue)}
                              className="px-2.5 py-1 rounded bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer hover:bg-blue-600 transition-colors"
                            >
                              Drill Action
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between items-center mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                      Total Impact: <span style={{ color: "#ef4444" }}>${totalImpact.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex gap-2">
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
                  Download
                </button>
                <button
                  disabled={filteredIssues.length === 0}
                  onClick={() => triggerToast("View reported file is available inside individual issue details.")}
                  className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border"
                  style={{ 
                    background: "var(--secondary)", 
                    borderColor: "var(--border)", 
                    color: filteredIssues.length === 0 ? "var(--muted-foreground)" : "var(--foreground)",
                    cursor: filteredIssues.length === 0 ? "not-allowed" : "pointer" 
                  }}
                >
                  <FileText size={13} />
                  View Reported File
                </button>
              </div>
              <button
                onClick={() => { setShowIssueList(false); setActiveProcess(null); }}
                className="px-4 py-1.5 rounded text-xs font-bold border-none cursor-pointer"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. Issue Details & AI Smart Suggestions ─── */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-4xl rounded-xl border flex flex-col max-h-[90vh] shadow-2xl overflow-hidden"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: showDetails.type === "Close Blocker" ? "#ef4444" : "#f59e0b" }} />
                  Issue Details — {showDetails.id}
                </h3>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{showDetails.domain} • {showDetails.process}</p>
              </div>
              <button 
                onClick={() => setShowDetails(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
              
              <div className="col-span-2 flex flex-col gap-5">
                
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl border" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Company Code</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>{showDetails.companyCode}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Fiscal Year</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>{showDetails.fiscalYear}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Period</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>{showDetails.period}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Asset Number</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1, fontFamily: "var(--font-mono)" }}>{showDetails.assetNumber}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Sub Asset</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>{showDetails.subAssetNumber}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Blocker Type</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>{showDetails.blockerType}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Severity</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: showDetails.severity === "Critical" ? "#ef4444" : "#f59e0b" }}>{showDetails.severity}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Status</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: showDetails.status === "In Progress" ? "#3b82f6" : "#f59e0b" }}>{showDetails.status}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Ageing Days</span>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>{showDetails.ageingDays} Days</p>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>Asset Description</h4>
                  <p style={{ fontSize: 13, color: "var(--foreground)" }}>{showDetails.assetDescription}</p>
                </div>

                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>Reason for blocker</h4>
                  <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>{showDetails.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>Financial Impact</h4>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#ef4444" }}>${showDetails.impact.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>Source File</h4>
                    <p style={{ fontSize: 12, color: "var(--foreground)", fontFamily: "var(--font-mono)" }} className="flex items-center gap-1.5">
                      <FileText size={13} style={{ color: "#3b82f6" }} />
                      {showDetails.sourceFile}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>Owner Role</h4>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{showDetails.ownerRole}</p>
                </div>

              </div>

              <div 
                className="rounded-xl p-5 border flex flex-col gap-4 self-start"
                style={{ 
                  background: "rgba(59, 130, 246, 0.04)", 
                  borderColor: "rgba(59, 130, 246, 0.2)",
                  boxShadow: "inset 0 0 20px rgba(59, 130, 246, 0.02)"
                }}
              >
                <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "rgba(59, 130, 246, 0.15)" }}>
                  <Sparkles size={16} style={{ color: "#3b82f6" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Smart Suggestion</span>
                </div>

                <div className="flex flex-col gap-3">
                  {showDetails.suggestedAction.map((action, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-blue-500 font-bold" style={{ fontSize: 12 }}>{i + 1}.</span>
                      <p style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.4 }}>{action}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadReport(showDetails)}
                  className="px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border"
                  style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)", cursor: "pointer" }}
                >
                  <Download size={13} />
                  Download Report
                </button>
                <button
                  onClick={() => handleOpenComposer(showDetails)}
                  className="px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border"
                  style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)", cursor: "pointer" }}
                >
                  <Mail size={13} />
                  Report Issue
                </button>
              </div>
              <button
                onClick={() => setShowDetails(null)}
                className="px-4 py-1.5 rounded text-xs font-bold border-none cursor-pointer"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── 6. Prefilled Email Composer Modal ─── */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-xl rounded-xl border flex flex-col shadow-2xl"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Mail size={15} style={{ color: "#3b82f6" }} />
                Send Close Notification
              </h3>
              <button 
                onClick={() => setShowComposer(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="w-16 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>To:</span>
                <input 
                  type="text" 
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs" 
                  style={{ color: "var(--foreground)" }}
                />
              </div>

              <div className="flex items-center border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="w-16 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Subject:</span>
                <input 
                  type="text" 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs" 
                  style={{ color: "var(--foreground)", fontWeight: 600 }}
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[10px] text-muted-foreground" style={{ fontWeight: 600, textTransform: "uppercase" }}>Email Body</span>
                <textarea 
                  rows={14} 
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-lg p-3 text-xs outline-none" 
                  style={{ 
                    background: "var(--secondary)", 
                    border: "1px solid var(--border)", 
                    color: "var(--foreground)",
                    fontFamily: "var(--font-family)",
                    lineHeight: 1.5
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowComposer(null)}
                className="px-4 py-1.5 rounded text-xs font-semibold border cursor-pointer"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-1.5 rounded text-xs font-bold border-none cursor-pointer flex items-center gap-1.5"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
              >
                <Send size={12} />
                Send Email
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
