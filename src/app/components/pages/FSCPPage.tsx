import { useState, useEffect } from "react";
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
  ArrowDown
} from "lucide-react";

// Types
export type FSCPIssueType = "No Issue" | "Moderate Issue" | "Close Blocker";
export type FSCPViewMode = "View 1" | "View 2" | "View 3";

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
          const codeIdx = (i + typeIdx) % companyCodes.length;

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

export function FSCPPage() {
  const [issues, setIssues] = useState<FSCPIssue[]>(INITIAL_ISSUES);
  const [selectedKPI, setSelectedKPI] = useState<FSCPIssueType | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<FSCPViewMode>("View 1");

  // New View 3 States
  const [view3Domain, setView3Domain] = useState<string | null>(null);
  const [view3KPI, setView3KPI] = useState<FSCPIssueType | null>(null);
  
  // Modals state
  const [showIssueList, setShowIssueList] = useState(false);
  const [showDetails, setShowDetails] = useState<FSCPIssue | null>(null);
  const [noActiveIssuesContext, setNoActiveIssuesContext] = useState<{
    title: string;
    message: string;
  } | null>(null);
  
  // Resolution Assignment Form fields
  const [assignActionType, setAssignActionType] = useState("");
  const [assignOwner, setAssignOwner] = useState("");
  const [assignDept, setAssignDept] = useState("");
  const [assignPriority, setAssignPriority] = useState("Medium");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  // Communication fields
  const [mailTo, setMailTo] = useState("");
  const [mailCc, setMailCc] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Prefill forms when details overlay loads
  useEffect(() => {
    if (showDetails) {
      const actions = getActionTypes(showDetails.process);
      setAssignActionType(actions[0] || "Master Data Correction");
      setAssignOwner(showDetails.ownerRole);
      setAssignDept(showDetails.domain);
      setAssignPriority(showDetails.severity === "Critical" || showDetails.severity === "High" ? "High" : "Medium");
      
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setAssignDueDate(defaultDate.toISOString().substring(0, 10));
      setAssignNotes("");

      setMailTo(showDetails.ownerRole.toLowerCase().replace(/[^a-z]/g, "") + "@datatwin.ai");
      setMailCc("finance-close-control@datatwin.ai");
      setMailSubject(`[Action Required] Close Blocker ID: ${showDetails.id} - ${showDetails.name}`);
      
      const body = `Dear Team,

Please review the following Close Blocker issue identified on the closing dashboard.

- Blocker ID: ${showDetails.id}
- Domain: ${showDetails.domain}
- Process: ${showDetails.process}
- Financial Impact: $${showDetails.impact.toLocaleString()}

AI Smart Recommendation Checklist:
${showDetails.suggestedAction.map((act, i) => `- ${act}`).join("\n")}

Please assign resolution immediately.

Regards,
Close Control Monitor`;
      setMailBody(body);
    }
  }, [showDetails]);

  // Calculations
  const counts = {
    "No Issue": issues.filter(i => i.type === "No Issue").length,
    "Moderate Issue": issues.filter(i => i.type === "Moderate Issue").length,
    "Close Blocker": issues.filter(i => i.type === "Close Blocker").length,
    "Total": 0
  };
  counts.Total = counts["No Issue"] + counts["Moderate Issue"] + counts["Close Blocker"];

  const getDomainCount = (domain: string, type: FSCPIssueType | null): number => {
    if (!type) return 0;
    return issues.filter(i => i.domain === domain && i.type === type).length;
  };

  const getProcessCount = (process: string, type: FSCPIssueType | null): number => {
    if (!type) return 0;
    return issues.filter(i => i.process === process && i.type === type).length;
  };

  const activeKPIFilter = viewMode === "View 3" ? view3KPI : selectedKPI;

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

  const handleOpenProcess = (process: string) => {
    setActiveProcess(process);
    setShowIssueList(true);
  };

  const handleDrillAction = (issue: FSCPIssue) => {
    setShowDetails(issue);
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

  const handleAssignAction = () => {
    if (!showDetails) return;

    setIssues(prev => prev.map(issue => {
      if (issue.id === showDetails.id) {
        return {
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
      }
      return issue;
    }));

    setShowDetails(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: "In Progress" as const,
        timeline: [
          ...prev.timeline,
          {
            dateLabel: "Today",
            description: `Resolution assigned to ${assignOwner}`
          }
        ]
      };
    });

    triggerToast(`Resolution corrective actions successfully assigned to ${assignOwner}.`);
  };

  const handleSendMailCommunication = () => {
    if (!showDetails) return;

    setIssues(prev => prev.map(issue => {
      if (issue.id === showDetails.id) {
        return {
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
      }
      return issue;
    }));

    setShowDetails(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: "In Progress" as const,
        timeline: [
          ...prev.timeline,
          {
            dateLabel: "Today",
            description: `Communication sent to Asset Owner`
          }
        ]
      };
    });

    triggerToast(`Remediation notification email successfully dispatched to ${mailTo}.`);
  };

  const filteredIssues = issues.filter(
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
    <main className="flex-1 overflow-y-auto px-8 py-6 relative" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      
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

      {/* Header Info with Segmented View Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Financial Statement Close Process
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
            Real-time Financial Close Command Center • P06 Closing Period
          </p>
        </div>

        {/* 3-Option Segmented Toggle */}
        <div 
          className="p-1 rounded-lg flex items-center border"
          style={{ 
            background: "var(--secondary)", 
            borderColor: "var(--border)"
          }}
        >
          {(["View 1", "View 2", "View 3"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setViewMode(view)}
              className="px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 border-none cursor-pointer"
              style={{
                background: viewMode === view ? "var(--card)" : "transparent",
                color: viewMode === view ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: viewMode === view ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none"
              }}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* ─── View 3 Layout (Domain-Centric Workflow) ─── */}
      {viewMode === "View 3" ? (
        <div className="animate-fadeIn">
          
          {/* Informational Summary Cards (Click disabled) */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl p-4 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>Close Blockers</span>
                <ShieldAlert size={18} style={{ color: "#ef4444" }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: "#ef4444" }}>
                {counts["Close Blocker"]}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Close Blocker Count</p>
            </div>

            <div className="rounded-xl p-4 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Moderate Issues</span>
                <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: "#f59e0b" }}>
                {counts["Moderate Issue"]}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Moderate Issue Count</p>
            </div>

            <div className="rounded-xl p-4 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>No Issues</span>
                <CheckCircle size={18} style={{ color: "#10b981" }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: "#10b981" }}>
                {counts["No Issue"]}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Reconciled Item Count</p>
            </div>

            <div className="rounded-xl p-4 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Monitor Points</span>
                <FileText size={18} style={{ color: "var(--muted-foreground)" }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
                {counts.Total}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Standard FSCP Scope</p>
            </div>
          </div>

          {/* 9 Finance Domains selection grid */}
          <div className="rounded-xl border p-5 mb-8" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                Finance Domains Selection
              </h2>
              {view3Domain && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-semibold animate-fadeIn">
                  Active Domain: {view3Domain}
                </span>
              )}
            </div>

            <div className="grid grid-cols-9 gap-3 w-full py-3 select-none">
              {Object.keys(FINANCE_DOMAINS).map((domain) => {
                const isActive = view3Domain === domain;
                const count = getDomainCount(domain, view3KPI || "Close Blocker");
                const IconComponent = DOMAIN_ICONS[domain] || DollarSign;

                return (
                  <div
                    key={domain}
                    onClick={() => {
                      setView3Domain(isActive ? null : domain);
                      setView3KPI(null); // Reset selected issue type when changing domain
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
                    {/* Render badge on domains if count exists */}
                    {renderIssueBadge(count, view3KPI || "Close Blocker")}

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

                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--foreground)", lineHeight: "1.1", wordBreak: "break-word" }}>
                      {domain}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <hr className="my-6" style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

            {/* Dynamic Drilldowns Below */}
            {!view3Domain ? (
              <div className="text-center py-8">
                <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                  Select a Finance Domain to view domain-specific issues.
                </p>
              </div>
            ) : (
              <div className="animate-fadeIn">
                
                {/* Domain-specific issue cards */}
                <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4">
                  {view3Domain} • Select Issue Type
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  
                  {/* Blocker Card */}
                  <div
                    onClick={() => {
                      const count = getDomainCount(view3Domain, "Close Blocker");
                      if (count === 0) {
                        setNoActiveIssuesContext({
                          title: "No Active Issues",
                          message: `No Close Blocker issues were identified for ${view3Domain} during the current financial close cycle.`
                        });
                        setView3KPI(null);
                        return;
                      }
                      setView3KPI("Close Blocker");
                    }}
                    className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${view3KPI === "Close Blocker" ? "shadow-md" : ""}`}
                    style={{
                      background: "var(--card)",
                      border: view3KPI === "Close Blocker" ? "1px solid #ef4444" : "1px solid var(--border)",
                      boxShadow: view3KPI === "Close Blocker" ? "0 4px 15px rgba(239, 68, 68, 0.12)" : "none"
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase" }}>Close Blockers</span>
                      <ShieldAlert size={16} style={{ color: "#ef4444" }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                      {getDomainCount(view3Domain, "Close Blocker")}
                    </div>
                  </div>

                  {/* Moderate Card */}
                  <div
                    onClick={() => {
                      const count = getDomainCount(view3Domain, "Moderate Issue");
                      if (count === 0) {
                        setNoActiveIssuesContext({
                          title: "No Active Issues",
                          message: `No Moderate Issues were identified for ${view3Domain} during the current financial close cycle.`
                        });
                        setView3KPI(null);
                        return;
                      }
                      setView3KPI("Moderate Issue");
                    }}
                    className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${view3KPI === "Moderate Issue" ? "shadow-md" : ""}`}
                    style={{
                      background: "var(--card)",
                      border: view3KPI === "Moderate Issue" ? "1px solid #f59e0b" : "1px solid var(--border)",
                      boxShadow: view3KPI === "Moderate Issue" ? "0 4px 15px rgba(245, 158, 11, 0.12)" : "none"
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>Moderate Issues</span>
                      <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
                      {getDomainCount(view3Domain, "Moderate Issue")}
                    </div>
                  </div>

                  {/* No Issue Card */}
                  <div
                    onClick={() => {
                      const count = getDomainCount(view3Domain, "No Issue");
                      if (count === 0) {
                        setNoActiveIssuesContext({
                          title: "No Active Issues",
                          message: `No items categorized as "No Issues" were found for ${view3Domain} during the current close cycle.`
                        });
                        setView3KPI(null);
                        return;
                      }
                      setView3KPI("No Issue");
                    }}
                    className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${view3KPI === "No Issue" ? "shadow-md" : ""}`}
                    style={{
                      background: "var(--card)",
                      border: view3KPI === "No Issue" ? "1px solid #10b981" : "1px solid var(--border)",
                      boxShadow: view3KPI === "No Issue" ? "0 4px 15px rgba(16, 185, 129, 0.12)" : "none"
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase" }}>No Issues</span>
                      <CheckCircle size={16} style={{ color: "#10b981" }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: "#10b981" }}>
                      {getDomainCount(view3Domain, "No Issue")}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <hr className="my-6" style={{ borderColor: "var(--border)", borderTopWidth: 1, borderBottomWidth: 0 }} />

                {!view3KPI ? (
                  <div className="text-center py-4">
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                      Select Close Blockers, Moderate Issues or No Issues above to view business processes.
                    </p>
                  </div>
                ) : (
                  <div className="animate-fadeIn">
                    <h4 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4">
                      {view3Domain} • {view3KPI} Business Processes
                    </h4>

                    <div className="grid grid-cols-4 gap-4">
                      {FINANCE_DOMAINS[view3Domain].map((process) => {
                        const count = getProcessCount(process, view3KPI);
                        const isEmphasized = count > 0;
                        const themeColor = view3KPI === "Close Blocker" ? "#ef4444" : view3KPI === "Moderate Issue" ? "#f59e0b" : "#10b981";
                        const themeBg = view3KPI === "Close Blocker" ? "rgba(239, 68, 68, 0.03)" : view3KPI === "Moderate Issue" ? "rgba(245, 158, 11, 0.03)" : "rgba(16, 185, 129, 0.03)";

                        return (
                          <div
                            key={process}
                            onClick={() => {
                              if (count === 0) {
                                setNoActiveIssuesContext({
                                  title: "No Active Issues",
                                  message: `No ${view3KPI}s were identified for the business process: ${process}.`
                                });
                                return;
                              }
                              handleOpenProcess(process);
                            }}
                            className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 animate-fadeIn"
                            style={{
                              position: "relative",
                              background: isEmphasized ? themeBg : "var(--secondary)",
                              borderColor: isEmphasized ? themeColor : "var(--border)",
                              boxShadow: isEmphasized ? `0 2px 8px ${themeColor}15` : "none"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = themeColor;
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = `0 4px 12px ${themeColor}20`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = isEmphasized ? themeColor : "var(--border)";
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = isEmphasized ? `0 2px 8px ${themeColor}15` : "none";
                            }}
                          >
                            {/* Render overlapping badge */}
                            {renderIssueBadge(count, view3KPI)}

                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", paddingRight: "16px" }}>
                              {process}
                            </span>

                            <ChevronRight size={14} style={{ color: isEmphasized ? themeColor : "var(--muted-foreground)" }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      ) : (
        /* ─── View 1 and View 2 Layout ─── */
        <>
          {/* Executive Close Overview Dashboard (KPI Cards) */}
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

          {/* KPI Drilldown Section */}
          {selectedKPI && (
            <div className="rounded-xl border p-5 mb-8 animate-fadeIn" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                  Domain Breakdown: {selectedKPI} List ({viewMode})
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
                      onClick={() => {
                        if (count === 0) {
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
                        setSelectedDomain(isActive ? null : domain);
                        setActiveProcess(null);
                      }}
                      className="p-2.5 rounded-xl border cursor-pointer transition-all duration-200 animate-fadeIn"
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
                      {/* Overlapping badge */}
                      {renderIssueBadge(count)}

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

                  <div className="grid grid-cols-4 gap-4">
                    {getProcessesToRender(selectedDomain).map((process) => {
                      const count = getProcessCount(process, selectedKPI);
                      const isEmphasized = count > 0;
                      const themeColor = selectedKPI === "Close Blocker" ? "#ef4444" : selectedKPI === "Moderate Issue" ? "#f59e0b" : "#10b981";
                      const themeBg = selectedKPI === "Close Blocker" ? "rgba(239, 68, 68, 0.03)" : selectedKPI === "Moderate Issue" ? "rgba(245, 158, 11, 0.03)" : "rgba(16, 185, 129, 0.03)";

                      return (
                        <div
                          key={process}
                          onClick={() => {
                            if (count === 0) {
                              let msg = "";
                              if (selectedKPI === "Close Blocker") {
                                msg = "No Close Blocker issues were identified for the selected business process during the current financial close cycle.";
                              } else if (selectedKPI === "Moderate Issue") {
                                msg = "No Moderate Issues were identified for the selected business process during the current financial close cycle.";
                              } else {
                                msg = "This business process currently has no reconciled items under the 'No Issues' category.";
                              }

                              setNoActiveIssuesContext({
                                title: "No Active Issues",
                                message: msg
                              });
                              setActiveProcess(null);
                              return;
                            }
                            handleOpenProcess(process);
                          }}
                          className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 animate-fadeIn"
                          style={{
                            position: "relative",
                            background: isEmphasized ? themeBg : "var(--secondary)",
                            borderColor: isEmphasized ? themeColor : "var(--border)",
                            boxShadow: isEmphasized ? `0 2px 8px ${themeColor}15` : "none"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = themeColor;
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = `0 4px 12px ${themeColor}20`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isEmphasized ? themeColor : "var(--border)";
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = isEmphasized ? `0 2px 8px ${themeColor}15` : "none";
                          }}
                        >
                          {/* Overlapping badge */}
                          {renderIssueBadge(count)}

                          {/* Business Process Name */}
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", paddingRight: "16px" }}>
                            {process}
                          </span>

                          {/* Right Chevron indicating drilldown */}
                          <ChevronRight size={14} style={{ color: isEmphasized ? themeColor : "var(--muted-foreground)" }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* ─── 3. Issue List Popup ─── */}
      {showIssueList && activeProcess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="w-full max-w-3xl rounded-xl border flex flex-col max-h-[85vh] shadow-2xl"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-base font-bold">{activeProcess} Close Issues</h3>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  {viewMode === "View 3" ? view3Domain : selectedDomain} • Level: {activeKPIFilter}
                </p>
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
                    No {activeKPIFilter === "Close Blocker" ? "Close Blocker" : activeKPIFilter === "Moderate Issue" ? "Moderate Issue" : "No Issue"} issues were identified for the selected business process during the current financial close cycle.
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
                          <td className="py-3 text-right font-semibold text-foreground">
                            ${issue.impact.toLocaleString()}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDrillAction(issue)}
                              className="px-2.5 py-1 rounded bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer hover:bg-blue-600 transition-colors"
                            >
                              View Details
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

            {/* Footer with actions limited to Download & Close per requirements */}
            <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
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

      {/* ─── 4. Issue Resolution Workspace Modal ─── */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="w-full max-w-5xl rounded-xl border flex flex-col h-[90vh] shadow-2xl overflow-hidden"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: showDetails.type === "Close Blocker" ? "#ef4444" : showDetails.type === "Moderate Issue" ? "#f59e0b" : "#10b981" }} />
                  Issue Resolution Workspace — {showDetails.id}
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

            {/* Split Columns Grid Container */}
            <div className="flex-1 overflow-hidden flex">
              
              {/* Left Column (2/3 width) - Scrollable working area */}
              <div className="w-2/3 overflow-y-auto p-6 flex flex-col gap-6 border-r" style={{ borderColor: "var(--border)" }}>
                
                {/* 1. Issue Information */}
                <div className="rounded-xl border p-4" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 12 }}>Issue Information</h4>
                  <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Blocker ID</span>
                      <strong className="font-semibold text-foreground">{showDetails.id}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Company Code</span>
                      <strong className="font-semibold text-foreground">{showDetails.companyCode}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Fiscal Year / Period</span>
                      <strong className="font-semibold text-foreground">{showDetails.fiscalYear} / {showDetails.period}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Asset / Document Number</span>
                      <strong className="font-semibold text-foreground font-mono">{showDetails.assetNumber}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Business Process</span>
                      <strong className="font-semibold text-foreground">{showDetails.process}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Blocker Type</span>
                      <strong className="font-semibold text-foreground">{showDetails.blockerType}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Severity</span>
                      <strong className="font-semibold" style={{ color: showDetails.severity === "Critical" ? "#ef4444" : showDetails.severity === "High" ? "#f59e0b" : "var(--foreground)" }}>{showDetails.severity}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Status</span>
                      <strong className="font-semibold" style={{ color: showDetails.status === "In Progress" ? "#3b82f6" : "#f59e0b" }}>{showDetails.status}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Financial Impact</span>
                      <strong className="font-semibold text-red-500">${showDetails.impact.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Source File</span>
                      <strong className="font-semibold text-foreground font-mono text-[11px] truncate block">{showDetails.sourceFile}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Owner Role</span>
                      <strong className="font-semibold text-foreground">{showDetails.ownerRole}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ageing Days</span>
                      <strong className="font-semibold text-foreground">{showDetails.ageingDays} Days</strong>
                    </div>
                  </div>
                  <div className="border-t pt-3 mt-3 text-xs" style={{ borderColor: "var(--border)" }}>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Reason for outstanding issue</span>
                    <p style={{ color: "var(--foreground)", lineHeight: 1.5 }}>{showDetails.reason}</p>
                  </div>
                </div>

                {/* 2. Resolution Assignment */}
                <div className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <h4 className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--foreground)", marginBottom: 12 }}>
                    <Layers size={14} style={{ color: "#3b82f6" }} />
                    Resolution Assignment
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Action Type</label>
                      <select 
                        value={assignActionType}
                        onChange={(e) => setAssignActionType(e.target.value)}
                        className="w-full rounded p-2 border outline-none bg-secondary"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      >
                        {getActionTypes(showDetails.process).map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Responsible Person</label>
                      <input 
                        type="text"
                        value={assignOwner}
                        onChange={(e) => setAssignOwner(e.target.value)}
                        className="w-full rounded p-2 border outline-none bg-secondary text-xs"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                        placeholder="Assign Owner"
                      />
                    </div>

                    <div>
                      <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Department</label>
                      <input 
                        type="text"
                        value={assignDept}
                        onChange={(e) => setAssignDept(e.target.value)}
                        className="w-full rounded p-2 border outline-none bg-secondary text-xs"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Priority</label>
                        <select 
                          value={assignPriority}
                          onChange={(e) => setAssignPriority(e.target.value)}
                          className="w-full rounded p-2 border outline-none bg-secondary text-xs"
                          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Due Date</label>
                        <input 
                          type="date"
                          value={assignDueDate}
                          onChange={(e) => setAssignDueDate(e.target.value)}
                          className="w-full rounded p-2 border outline-none bg-secondary text-xs"
                          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs">
                    <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Resolution Notes</label>
                    <textarea 
                      rows={2}
                      value={assignNotes}
                      onChange={(e) => setAssignNotes(e.target.value)}
                      placeholder="Add corrective instructions, adjustment keys, or override details..."
                      className="w-full rounded p-2 border outline-none bg-secondary text-xs"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  <button
                    onClick={handleAssignAction}
                    className="mt-3 px-4 py-2 rounded text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 transition-colors"
                    style={{ background: "#3b82f6", color: "#fff" }}
                  >
                    Assign Resolution
                  </button>
                </div>

                {/* 3. Communication */}
                <div className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <h4 className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--foreground)", marginBottom: 12 }}>
                    <Mail size={14} style={{ color: "#3b82f6" }} />
                    Communication
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">To</label>
                      <input 
                        type="text"
                        value={mailTo}
                        onChange={(e) => setMailTo(e.target.value)}
                        className="w-full rounded p-2 border outline-none bg-secondary text-xs"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">CC</label>
                      <input 
                        type="text"
                        value={mailCc}
                        onChange={(e) => setMailCc(e.target.value)}
                        className="w-full rounded p-2 border outline-none bg-secondary text-xs"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>

                  <div className="text-xs mb-3">
                    <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Subject</label>
                    <input 
                      type="text"
                      value={mailSubject}
                      onChange={(e) => setMailSubject(e.target.value)}
                      className="w-full rounded p-2 border outline-none bg-secondary text-xs font-semibold"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  <div className="text-xs">
                    <label className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">Message Body</label>
                    <textarea 
                      rows={5}
                      value={mailBody}
                      onChange={(e) => setMailBody(e.target.value)}
                      className="w-full rounded p-2 border outline-none bg-secondary text-xs font-mono"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", lineHeight: 1.4 }}
                    />
                  </div>

                  <button
                    onClick={handleSendMailCommunication}
                    className="mt-3 px-4 py-2 rounded text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 transition-colors"
                    style={{ background: "var(--foreground)", color: "var(--background)" }}
                  >
                    <Send size={12} />
                    Send Communication
                  </button>
                </div>

              </div>

              {/* Right Column (1/3 width) - Sticky container for AI Suggestions & Activity Timeline */}
              <div className="w-1/3 overflow-y-auto p-6 flex flex-col gap-6 bg-secondary/20">
                <div className="flex flex-col gap-6">
                  
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
                      {showDetails.suggestedAction.map((action, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-blue-500 font-bold" style={{ fontSize: 12 }}>{i + 1}.</span>
                          <p style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.4 }}>{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issue Activity Timeline */}
                  <div className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <h4 className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 16 }}>
                      <Calendar size={14} style={{ color: "#3b82f6" }} />
                      Issue Activity Timeline
                    </h4>

                    {/* Timeline items rendered in REVERSE chronological order */}
                    <div className="flex flex-col gap-5 pl-4 relative border-l" style={{ borderColor: "var(--border)" }}>
                      {[...showDetails.timeline].reverse().map((event, idx) => (
                        <div key={idx} className="relative text-xs animate-fadeIn pb-1">
                          {/* Dot Circle wrapper containing matching context icon */}
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
                          
                          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", display: "block", textTransform: "uppercase" }}>
                            {event.dateLabel}
                          </span>
                          
                          <p className="mt-0.5 text-foreground font-medium text-[11px] leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-shrink-0 items-center justify-between px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => handleDownloadReport(showDetails)}
                className="px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border"
                style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)", cursor: "pointer" }}
              >
                <Download size={13} />
                Download Report
              </button>
              
              <button
                onClick={() => setShowDetails(null)}
                className="px-5 py-1.5 rounded text-xs font-bold border-none cursor-pointer"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── 5. No Active Issues Dialog Overlay ─── */}
      {noActiveIssuesContext && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div 
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

    </main>
  );
}
