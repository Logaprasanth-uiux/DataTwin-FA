import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  Mail,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  Receipt,
  CornerDownRight,
  Sparkles,
  History,
  Info,
  ChevronRight,
  RotateCcw,
  User,
  ShieldCheck,
  Calendar,
  CheckSquare
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type TransactionType =
  | "NEFT Payment"
  | "Invoice / Bill"
  | "Receipt Voucher"
  | "Credit Note"
  | "Refund Entry"
  | "Debit Note"
  | "Adjustment Journal"
  | "Advance Allocation";

export interface TransactionCard {
  id: string;
  type: TransactionType;
  ref: string;          // Invoice Ref or UTR number
  docNum: string;       // BILL1, RCPT1, etc.
  amount: number;
  appliedAmount: number;
  remainingBalance: number;
  status: "Outstanding" | "Available Credit" | "Pending Review" | "Resolved";
  postingDate: string;
  valueDate?: string;
  remitter?: string;
  beneficiary?: string;
  customerRef?: string;
}

export interface OutstandingItem {
  id: string;
  type:
    | "Execute Clearing"
    | "Execute CN Clearing"
    | "Minor Diff"
    | "Open CN"
    | "Open Advance"
    | "Refund Entries"
    | "DZ Entry Issue"
    | "Manual Entries"
    | "Receipts not found"
    | "Invoice not found"
    | "CN Not Found"
    | "Adv Not Found";
  refNum: string;
  amount: number;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Unresolved" | "Requires Review" | "Resolved";
  confidence: number;
  explanation: string;
  suggestedActions: string[]; // references dynamic actions catalog keys
  relatedTxnIds: string[];
}

export interface SuggestedAction {
  id: string;
  label: string;
  description: string;
  confidence: number;
  plan: string[];
  expectedResult: string;
}

export interface EmailThreadItem {
  sender: string;
  date: string;
  body: string;
}

export interface UnifiedTimelineEvent {
  id: string;
  type: "Communication" | "AI Processing" | "User Action" | "System Event";
  title: string;
  details?: string;
  actor: string;
  timestamp: string;
}

export interface EmailQueueItem {
  id: string;
  sender: string;
  subject: string;
  amount: number;
  processingStatus: "Exceptions Detected" | "Unresolved Exceptions" | "Requires Review" | "Resolved" | "Processed";
  aiConfidence: number;
  exceptionCount: number;
  date: string;
  recipients: string;
  body: string;
  attachments: { name: string; size: string; type: string }[];
  longEmailThread: EmailThreadItem[];
  threadSummary: string;
  
  // Unified chronological timeline for Column 3
  activityTimeline: UnifiedTimelineEvent[];
  
  // Transaction Workspace
  transactions: TransactionCard[];
  outstandingItems: OutstandingItem[];
}

// ─── ACTIONS CATALOG ─────────────────────────────────────────────────────────

const DYNAMIC_ACTIONS_CATALOG: Record<string, SuggestedAction> = {
  act_connect_refund_mi9788: {
    id: "act_connect_refund_mi9788",
    label: "Connect Refund REF-9921 to Invoice MI3130009788",
    description: "Reconcile double payment credit refund REF-9921 against outstanding invoice reference MI3130009788.",
    confidence: 98,
    plan: [
      "Fetch credit refund voucher REF-9921 from cash records.",
      "Link REF-9921 to invoice record MI3130009788.",
      "Clear open ledger allocation flags."
    ],
    expectedResult: "Refund connected. Double paid records reconciled."
  },
  act_clear_mi9800: {
    id: "act_clear_mi9800",
    label: "Execute Clearing for Invoice MI3130009800",
    description: "Apply remaining NEFT payment receipt value of ₹813,020.00 to fully clear invoice MI3130009800.",
    confidence: 95,
    plan: [
      "Allocate UTR CHASN52026053017679344 credit balance.",
      "Debit customer billing account with ₹813,020.00.",
      "Generate ledger clearing document reference."
    ],
    expectedResult: "Cleared Invoice MI3130009800 balance to ₹0."
  },
  act_connect_cn_bill1: {
    id: "act_connect_cn_bill1",
    label: "Connect Credit Note CN-002 to Invoice BILL1",
    description: "Link the unallocated credit note record CN-002 to invoice reference BILL1 to allocate the credit amount.",
    confidence: 98,
    plan: [
      "Retrieve Credit Note CN-002 reference mapping.",
      "Associate CN-002 with open debit items on invoice BILL1.",
      "Clear CN-002 available credit balance."
    ],
    expectedResult: "Credit Note CN-002 linked. Invoice BILL1 remaining balance reduced from ₹5,000 to ₹0."
  },
  act_clear_bill1: {
    id: "act_clear_bill1",
    label: "Execute Clearing for Invoice BILL1",
    description: "Post the final clearing document in the ledger to mark invoice BILL1 as fully settled and closed.",
    confidence: 97,
    plan: [
      "Allocate receipt payment voucher RCPT1 to invoice BILL1.",
      "Apply the resolved CN-002 credit of ₹5,000.",
      "Generate ledger clearing document entries."
    ],
    expectedResult: "Invoice BILL1 status updated to Resolved. Balance fully settled."
  },
  act_post_crco_bill1: {
    id: "act_post_crco_bill1",
    label: "Post CRCO Adjustment for Invoice BILL1",
    description: "Write-off the variance of ₹15 under invoice BILL1 to the Corporate Cost Center (CRCO) minor difference account.",
    confidence: 99,
    plan: [
      "Debit CRCO minor variance write-off GL account.",
      "Credit invoice BILL1 outstanding balance with ₹15.",
      "Match and clear billing difference."
    ],
    expectedResult: "Minor variance cleared. Invoice BILL1 remaining balance reconciled to ₹0."
  },
  act_post_cash_rcpt1: {
    id: "act_post_cash_rcpt1",
    label: "Post Bank/Cash GL for Receipt RCPT1",
    description: "Post the NEFT payment receipt value directly into the general cash ledger to resolve statement feed mismatch.",
    confidence: 91,
    plan: [
      "Debit Bank Clearing cash ledger account with ₹75,000.",
      "Credit Customer Receivables account.",
      "Flag cash ledger item as manually reconciled."
    ],
    expectedResult: "Bank cash ledger posted manually. Mismatch resolved."
  },
  act_raise_inv_rcpt1: {
    id: "act_raise_inv_rcpt1",
    label: "Raise Investigation for Transaction Ref#9812",
    description: "Flag statement Ref#9812 to bank operations team regarding transaction feed delays.",
    confidence: 94,
    plan: [
      "Generate bank query trace ticket.",
      "Flag UTR transaction code to accounts receivable review queue.",
      "Notify corporate cash controller."
    ],
    expectedResult: "Bank operations ticket created. Status: In Progress."
  },
  act_connect_refund_bill2: {
    id: "act_connect_refund_bill2",
    label: "Connect Refund REF-9921 to Invoice BILL2",
    description: "Link the cash refund voucher REF-9921 to the outstanding invoice ref BILL2 to allocate refund credit.",
    confidence: 96,
    plan: [
      "Match refund reference code REF-9921 to BILL2 record.",
      "Create ledger matching references in ERP database."
    ],
    expectedResult: "Refund connected. Invoice BILL2 remaining balance adjusted."
  },
  act_group_bills: {
    id: "act_group_bills",
    label: "Group Transactions",
    description: "Group the selected bills under a common payment run reference for batch clearing.",
    confidence: 95,
    plan: [
      "Bind outstanding bills under batch ref GRP1.",
      "Update billing record status to grouped."
    ],
    expectedResult: "Grouped batch reference GRP1 generated in ledger."
  },
  act_disconnect: {
    id: "act_disconnect",
    label: "Disconnect Transactions",
    description: "Sever the clearing allocation reference link between selected records.",
    confidence: 98,
    plan: [
      "Delete matching references between cards in ERP.",
      "Restore outstanding and available credit balances."
    ],
    expectedResult: "Ledger link severed. Balances restored to open state."
  },
  act_connect_receipt_bill2: {
    id: "act_connect_receipt_bill2",
    label: "Connect Receipt RCPT1 to Invoice BILL2",
    description: "Apply the remaining credit balance from payment receipt RCPT1 to open invoice BILL2.",
    confidence: 95,
    plan: [
      "Link receipt voucher RCPT1 balance to invoice BILL2.",
      "Post allocation record."
    ],
    expectedResult: "Receipt balance applied. BILL2 outstanding balance reduced by ₹25,000."
  }
};

// ─── INITIAL MOCK QUEUE ──────────────────────────────────────────────────────

const INITIAL_QUEUE_DATA: EmailQueueItem[] = [
  {
    id: "TXN-EMAIL-005",
    sender: "statements_and_alerts@jpmchase.com",
    subject: "Remittance Advice for Payment Transferred",
    amount: 3155172.50,
    processingStatus: "Processed",
    aiConfidence: 98,
    exceptionCount: 0,
    date: "May 30, 2026, 12:00 PM",
    recipients: "PaymentAdviceIndia@financeplusindia.com",
    body: `J.P. Morgan Chase & Co.
Automated Remittance Notification Service

Dear Finance Team,

Please be advised that an automated NEFT bank transfer has been successfully settled for TV TODAY NETWORK LTD. Below are the transaction details:

Remitter Details:
Company Name: WPP MEDIA INDIA PRIVATE LIMITED
Customer Account: XXXXXXX8890

Payment Reference:
Transaction Type: NEFT
UTR Number: CHASN52026053017679344
Value Date: 30-May-2026
Settled Amount: ₹3,155,172.50

Beneficiary:
TV TODAY NETWORK LTD

Customer Reference:
MHMJ26050715

This remittance payment has been allocated across 10 open invoice references listed in the attached advice. All allocations have been successfully processed.

Sincerely,
Global Cash Operations
J.P. Morgan Chase Bank, N.A.`,
    attachments: [
      { name: "PDS_RD_30052026.pdf", size: "185 KB", type: "application/pdf" }
    ],
    longEmailThread: [
      {
        sender: "PaymentAdviceIndia@financeplusindia.com",
        date: "May 29, 2026, 03:20 PM",
        body: "Hi WPP Media accounts team, we are awaiting allocation sheets for the pending RTGS payment run due for TV Today Network. Please expedite."
      }
    ],
    threadSummary: "NEFT Payment of ₹3,155,172.50 from WPP Media India to TV Today Network. Automated matching distributed the payment across 10 invoices. All allocations have been successfully posted and cleared, leaving no exceptions.",
    activityTimeline: [
      { id: "ACT-501", type: "Communication", title: "Email Received", details: "Remittance advice notification received from statements_and_alerts@jpmchase.com.", actor: "System", timestamp: "May 30, 12:00 PM" },
      { id: "ACT-502", type: "AI Processing", title: "Attachment Parsed", details: "PDS_RD_30052026.pdf parsed successfully using OCR semantic extraction.", actor: "AI Agent", timestamp: "May 30, 12:01 PM" },
      { id: "ACT-503", type: "AI Processing", title: "Transaction Parsed", details: "Extracted UTR CHASN52026053017679344 and matched 10 invoice cards.", actor: "AI Agent", timestamp: "May 30, 12:02 PM" },
      { id: "ACT-504", type: "System Event", title: "Clearings Settled", details: "All 10 matched invoices cleared successfully. No outstanding exceptions logged.", actor: "System", timestamp: "May 30, 12:03 PM" }
    ],
    transactions: [
      { id: "TXN-501", type: "NEFT Payment", ref: "UTR CHASN52026053017679344", docNum: "RCPT-MAIN", amount: 3155172.50, appliedAmount: 3155172.50, remainingBalance: 0.00, status: "Resolved", postingDate: "30-05-2026", remitter: "WPP MEDIA INDIA PRIVATE LIMITED", beneficiary: "TV TODAY NETWORK LTD", customerRef: "MHMJ26050715", valueDate: "30-May-2026" },
      { id: "TXN-502", type: "Invoice / Bill", ref: "Ref: MI3130009788", docNum: "MI3130009788", amount: 578200.00, appliedAmount: 578200.00, remainingBalance: 0.00, status: "Resolved", postingDate: "15-Mar-2026" },
      { id: "TXN-503", type: "Invoice / Bill", ref: "Ref: MI3130009787", docNum: "MI3130009787", amount: 392350.00, appliedAmount: 392350.00, remainingBalance: 0.00, status: "Resolved", postingDate: "16-Mar-2026" },
      { id: "TXN-504", type: "Invoice / Bill", ref: "Ref: MI3130009801", docNum: "MI3130009801", amount: 18408.00, appliedAmount: 18408.00, remainingBalance: 0.00, status: "Resolved", postingDate: "17-Mar-2026" },
      { id: "TXN-505", type: "Invoice / Bill", ref: "Ref: MI3130009803", docNum: "MI3130009803", amount: 288805.00, appliedAmount: 288805.00, remainingBalance: 0.00, status: "Resolved", postingDate: "18-Mar-2026" },
      { id: "TXN-506", type: "Invoice / Bill", ref: "Ref: MI3130009800", docNum: "MI3130009800", amount: 813020.00, appliedAmount: 813020.00, remainingBalance: 0.00, status: "Resolved", postingDate: "19-Mar-2026" },
      { id: "TXN-507", type: "Invoice / Bill", ref: "Ref: MI3130010035", docNum: "MI3130010035", amount: 280987.50, appliedAmount: 280987.50, remainingBalance: 0.00, status: "Resolved", postingDate: "20-Mar-2026" },
      { id: "TXN-508", type: "Invoice / Bill", ref: "Ref: MI3130010200", docNum: "MI3130010200", amount: 675432.00, appliedAmount: 675432.00, remainingBalance: 0.00, status: "Resolved", postingDate: "21-Mar-2026" },
      { id: "TXN-509", type: "Invoice / Bill", ref: "Ref: MI3130009784", docNum: "MI3130009784", amount: 20650.00, appliedAmount: 20650.00, remainingBalance: 0.00, status: "Resolved", postingDate: "22-Mar-2026" },
      { id: "TXN-510", type: "Invoice / Bill", ref: "Ref: MI3130009799", docNum: "MI3130009799", amount: 75048.00, appliedAmount: 75048.00, remainingBalance: 0.00, status: "Resolved", postingDate: "23-Mar-2026" },
      { id: "TXN-511", type: "Invoice / Bill", ref: "Ref: MI3130009802", docNum: "MI3130009802", amount: 12272.00, appliedAmount: 12272.00, remainingBalance: 0.00, status: "Resolved", postingDate: "24-Mar-2026" }
    ],
    outstandingItems: []
  },
  {
    id: "TXN-EMAIL-004",
    sender: "statements_and_alerts@jpmchase.com",
    subject: "Remittance Advice for Payment Transferred",
    amount: 3155172.50,
    processingStatus: "Exceptions Detected",
    aiConfidence: 98,
    exceptionCount: 2,
    date: "May 30, 2026, 11:45 AM",
    recipients: "PaymentAdviceIndia@financeplusindia.com",
    body: `J.P. Morgan Chase & Co.
Automated Remittance Notification Service

Dear Finance Team,

Please be advised that an automated NEFT bank transfer has been successfully settled for TV TODAY NETWORK LTD. Below are the transaction details:

Remitter Details:
Company Name: WPP MEDIA INDIA PRIVATE LIMITED
Customer Account: XXXXXXX8890

Payment Reference:
Transaction Type: NEFT
UTR Number: CHASN52026053017679344
Value Date: 30-May-2026
Settled Amount: ₹3,155,172.50

Beneficiary:
TV TODAY NETWORK LTD

Customer Reference:
MHMJ26050715

This remittance payment has been allocated across 10 open invoice references listed in the attached advice. Exceptions have been detected on Invoice MI3130009800 and Refund Voucher REF-9921.

Sincerely,
Global Cash Operations
J.P. Morgan Chase Bank, N.A.`,
    attachments: [
      { name: "PDS_RD_30052026.pdf", size: "185 KB", type: "application/pdf" }
    ],
    longEmailThread: [
      {
        sender: "PaymentAdviceIndia@financeplusindia.com",
        date: "May 29, 2026, 03:20 PM",
        body: "Hi WPP Media accounts team, we are awaiting allocation sheets for the pending RTGS payment run due for TV Today Network. Please expedite."
      }
    ],
    threadSummary: "NEFT Payment of ₹3,155,172.50 from WPP Media India to TV Today Network. Automated matching distributed the payment across 10 invoices. Exceptions detected: Invoice MI3130009800 remains uncleared in ledger, and refund REF-9921 is unlinked to invoice MI3130009788.",
    activityTimeline: [
      { id: "ACT-401", type: "Communication", title: "Email Received", details: "Remittance notification received from statements_and_alerts@jpmchase.com.", actor: "System", timestamp: "May 30, 11:45 AM" },
      { id: "ACT-402", type: "AI Processing", title: "Attachment Parsed", details: "PDS_RD_30052026.pdf metadata extracted via OCR parser.", actor: "AI Agent", timestamp: "May 30, 11:46 AM" },
      { id: "ACT-403", type: "AI Processing", title: "Transaction Parsed", details: "Extracted UTR CHASN52026053017679344 and matched 10 invoice cards.", actor: "AI Agent", timestamp: "May 30, 11:47 AM" },
      { id: "ACT-404", type: "AI Processing", title: "Exception Detected", details: "Refund reference REF-9921 unmatched. Invoice MI3130009800 remains outstanding.", actor: "System", timestamp: "May 30, 11:47 AM" }
    ],
    transactions: [
      { id: "TXN-401", type: "NEFT Payment", ref: "UTR CHASN52026053017679344", docNum: "RCPT-MAIN", amount: 3155172.50, appliedAmount: 2342152.50, remainingBalance: 813020.00, status: "Pending Review", postingDate: "30-05-2026", remitter: "WPP MEDIA INDIA PRIVATE LIMITED", beneficiary: "TV TODAY NETWORK LTD", customerRef: "MHMJ26050715" },
      { id: "TXN-402", type: "Invoice / Bill", ref: "Ref: MI3130009788", docNum: "MI3130009788", amount: 578200.00, appliedAmount: 578200.00, remainingBalance: 0.00, status: "Resolved", postingDate: "15-03-2026" },
      { id: "TXN-403", type: "Invoice / Bill", ref: "Ref: MI3130009787", docNum: "MI3130009787", amount: 392350.00, appliedAmount: 392350.00, remainingBalance: 0.00, status: "Resolved", postingDate: "16-03-2026" },
      { id: "TXN-404", type: "Invoice / Bill", ref: "Ref: MI3130009801", docNum: "MI3130009801", amount: 18408.00, appliedAmount: 18408.00, remainingBalance: 0.00, status: "Resolved", postingDate: "17-03-2026" },
      { id: "TXN-405", type: "Invoice / Bill", ref: "Ref: MI3130009803", docNum: "MI3130009803", amount: 288805.00, appliedAmount: 288805.00, remainingBalance: 0.00, status: "Resolved", postingDate: "18-03-2026" },
      { id: "TXN-406", type: "Invoice / Bill", ref: "Ref: MI3130009800", docNum: "MI3130009800", amount: 813020.00, appliedAmount: 0.00, remainingBalance: 813020.00, status: "Outstanding", postingDate: "19-03-2026" },
      { id: "TXN-407", type: "Invoice / Bill", ref: "Ref: MI3130010035", docNum: "MI3130010035", amount: 280987.50, appliedAmount: 280987.50, remainingBalance: 0.00, status: "Resolved", postingDate: "20-03-2026" },
      { id: "TXN-408", type: "Invoice / Bill", ref: "Ref: MI3130010200", docNum: "MI3130010200", amount: 675432.00, appliedAmount: 675432.00, remainingBalance: 0.00, status: "Resolved", postingDate: "21-03-2026" },
      { id: "TXN-409", type: "Invoice / Bill", ref: "Ref: MI3130009784", docNum: "MI3130009784", amount: 20650.00, appliedAmount: 20650.00, remainingBalance: 0.00, status: "Resolved", postingDate: "22-03-2026" },
      { id: "TXN-410", type: "Invoice / Bill", ref: "Ref: MI3130009799", docNum: "MI3130009799", amount: 75048.00, appliedAmount: 75048.00, remainingBalance: 0.00, status: "Resolved", postingDate: "23-03-2026" },
      { id: "TXN-411", type: "Invoice / Bill", ref: "Ref: MI3130009802", docNum: "MI3130009802", amount: 12272.00, appliedAmount: 12272.00, remainingBalance: 0.00, status: "Resolved", postingDate: "24-03-2026" },
      { id: "TXN-412", type: "Refund Entry", ref: "Doc Ref: REF-9921", docNum: "REF-9921", amount: 75000, appliedAmount: 0, remainingBalance: 75000, status: "Pending Review", postingDate: "29-05-2026" }
    ],
    outstandingItems: [
      {
        id: "EXP-401",
        type: "Refund Entries",
        refNum: "REF-9921",
        amount: 75000,
        priority: "High",
        status: "Unresolved",
        confidence: 98,
        explanation: "Unmatched refund REF-9921 of ₹75,000 matches invoice MI3130009788 double-payment values. Allocation connection recommended.",
        suggestedActions: ["act_connect_refund_mi9788"],
        relatedTxnIds: ["TXN-412", "TXN-402"]
      },
      {
        id: "EXP-402",
        type: "Execute Clearing",
        refNum: "MI3130009800",
        amount: 813020,
        priority: "High",
        status: "Unresolved",
        confidence: 95,
        explanation: "Invoice MI3130009800 shows as open. Recommending applying the unallocated NEFT cash receipt balance of ₹813,020.00.",
        suggestedActions: ["act_clear_mi9800"],
        relatedTxnIds: ["TXN-406", "TXN-401"]
      }
    ]
  },
  {
    id: "TXN-EMAIL-001",
    sender: "statements_and_alerts@jpmchase.com",
    subject: "Remittance Advice: INV-2026-004 & INV-2026-008",
    amount: 150000,
    processingStatus: "Exceptions Detected",
    aiConfidence: 98,
    exceptionCount: 3,
    date: "May 31, 2026, 10:15 AM",
    recipients: "PaymentAdviceIndia@financeplusindia.com",
    body: `J.P. Morgan Chase & Co.
Automated Remittance Notification Service

Dear Finance Team,

Please be advised that an automated NEFT bank transfer has been successfully initiated and settled. Below are the transaction details:

Remitter Details:
Company Name: Acme Systems India Pvt Ltd
Customer Account: XXXXXXX1082 (JPM Client Account)

Payment Reference:
Transaction Type: NEFT
UTR Number: JPMNH261510928
Posting Date: 30-05-2026
Value Date: 31-05-2026
Settled Amount: ₹1,50,000.00

Breakdown Details:
We have allocated ₹95,000 against invoice reference INV-2026-004 (Doc: BILL1) after applying Credit Note CN-002 (value ₹5,000) for returned goods.
Additionally, we have authorized a receipt entry of ₹75,000 (Doc: RCPT1), leaving an available credit of ₹25,000.
We have also matched ₹20,000 to invoice INV-2026-008 (Doc: BILL2) which currently has a discrepancy of ₹15 in bank transmission fees.

Please refer to the attached PDF advice for complete invoice line details and credit ledger notes.

Sincerely,
Global Cash Operations
J.P. Morgan Chase Bank, N.A.`,
    attachments: [
      { name: "PDS_RD_30052026.pdf", size: "185 KB", type: "application/pdf" }
    ],
    longEmailThread: [
      {
        sender: "PaymentAdviceIndia@financeplusindia.com",
        date: "May 30, 2026, 04:30 PM",
        body: "Hello Acme Finance, we notice that invoice INV-2026-004 (Doc: BILL1) remains uncleared. Please confirm payment dispatch or UTR details."
      },
      {
        sender: "statements_and_alerts@jpmchase.com",
        date: "May 30, 2026, 11:20 AM",
        body: "Remittance notification queued: Cash allocation program matched returned goods credit note to invoice INV-2026-004. Awaiting NEFT clearing."
      }
    ],
    threadSummary: "J.P. Morgan remittance for Acme Systems Pvt Ltd (₹1,50,000). Automated matching identified invoice references BILL1 and BILL2, and receipt voucher RCPT1. Mismatches include an unregistered Credit Note CN-002, a minor variance of ₹15, and an open receipt credit allocation of ₹25,000.",
    activityTimeline: [
      { id: "ACT-001", type: "Communication", title: "Email Received", details: "Remittance alert received from statements_and_alerts@jpmchase.com via secure channel.", actor: "System", timestamp: "May 31, 10:15 AM" },
      { id: "ACT-002", type: "AI Processing", title: "Attachment Parsed", details: "PDS_RD_30052026.pdf parsed successfully using OCR semantic extraction.", actor: "AI Agent", timestamp: "May 31, 10:16 AM" },
      { id: "ACT-003", type: "AI Processing", title: "Transaction Parsed", details: "Extracted UTR JPMNH261510928, references BILL1, RCPT1, and BILL2.", actor: "AI Agent", timestamp: "May 31, 10:17 AM" },
      { id: "ACT-004", type: "AI Processing", title: "Exception Detected", details: "Credit Note CN-002 not found in system ledger. Minor difference of ₹15 logged.", actor: "System", timestamp: "May 31, 10:17 AM" },
      { id: "ACT-005", type: "AI Processing", title: "Suggested Actions Generated", details: "Reconciliation recommendations compiled based on matching confidence.", actor: "AI Agent", timestamp: "May 31, 10:18 AM" }
    ],
    transactions: [
      { id: "TXN-001", type: "NEFT Payment", ref: "UTR JPMNH261510928", docNum: "RCPT-MAIN", amount: 150000, appliedAmount: 115000, remainingBalance: 35000, status: "Available Credit", postingDate: "30-05-2026", valueDate: "31-05-2026", remitter: "Acme Systems India Pvt Ltd", beneficiary: "Finance Plus India Ltd" },
      { id: "TXN-002", type: "Invoice / Bill", ref: "Ref: INV-2026-004", docNum: "BILL1", amount: 100000, appliedAmount: 95000, remainingBalance: 5000, status: "Outstanding", postingDate: "15-05-2026", customerRef: "CUST-ACME-90" },
      { id: "TXN-003", type: "Receipt Voucher", ref: "Doc Ref: RCPT1", docNum: "RCPT1", amount: 75000, appliedAmount: 50000, remainingBalance: 25000, status: "Available Credit", postingDate: "30-05-2026" },
      { id: "TXN-004", type: "Invoice / Bill", ref: "Ref: INV-2026-008", docNum: "BILL2", amount: 200000, appliedAmount: 100000, remainingBalance: 100000, status: "Outstanding", postingDate: "20-05-2026", customerRef: "CUST-ACME-90" },
      { id: "TXN-005", type: "Credit Note", ref: "CN Ref: CN-002", docNum: "CN-002", amount: 5000, appliedAmount: 0, remainingBalance: 5000, status: "Available Credit", postingDate: "25-05-2026" }
    ],
    outstandingItems: [
      {
        id: "EXP-001",
        type: "CN Not Found",
        refNum: "CN-002",
        amount: 5000,
        priority: "High",
        status: "Unresolved",
        confidence: 94,
        explanation: "Credit Note CN-002 is mentioned in remittance breakdown details but does not exist in local ERP databases. Auto-generation recommended.",
        suggestedActions: ["act_connect_cn_bill1"],
        relatedTxnIds: ["TXN-005", "TXN-002"]
      },
      {
        id: "EXP-002",
        type: "Minor Diff",
        refNum: "BILL1",
        amount: 15,
        priority: "Low",
        status: "Unresolved",
        confidence: 99,
        explanation: "Bank transaction record shows ₹94,985 settled against BILL1 instead of the ₹95,000 remittance claim, leaving ₹15 difference.",
        suggestedActions: ["act_post_crco_bill1"],
        relatedTxnIds: ["TXN-002", "TXN-001"]
      },
      {
        id: "EXP-003",
        type: "Open Advance",
        refNum: "RCPT1",
        amount: 25000,
        priority: "Medium",
        status: "Unresolved",
        confidence: 95,
        explanation: "Receipt voucher RCPT1 has an unallocated balance of ₹25,000. Recommending applying credit to outstanding BILL2.",
        suggestedActions: ["act_connect_receipt_bill2"],
        relatedTxnIds: ["TXN-003", "TXN-004"]
      }
    ]
  },
  {
    id: "TXN-EMAIL-002",
    sender: "ar@techsupply.com",
    subject: "Wire Transfer Receipt: Bank Reference Ref#9812",
    amount: 50000,
    processingStatus: "Unresolved Exceptions",
    aiConfidence: 92,
    exceptionCount: 1,
    date: "Jun 24, 2026, 02:40 PM",
    recipients: "PaymentAdviceIndia@financeplusindia.com",
    body: `Hi Team,

We have wired ₹50,000 to clear our outstanding dues for Bill-2026-012. Please find the bank transaction advice copy attached. Please confirm receipt and adjust our account.

Thanks,
TechSupply Receivables Team`,
    attachments: [
      { name: "wire_receipt_9812.png", size: "380 KB", type: "image/png" }
    ],
    longEmailThread: [],
    threadSummary: "Reconciliation of TechSupply Co wire transfer. Vendor claims they paid ₹50,000 to clear Bill-2026-012. Transaction Ref#9812 is not yet reflected in the bank ledger feed.",
    activityTimeline: [
      { id: "ACT-101", type: "Communication", title: "Email Received", details: "Wire slip received from ar@techsupply.com.", actor: "System", timestamp: "Jun 24, 02:40 PM" },
      { id: "ACT-102", type: "AI Processing", title: "Attachment Parsed", details: "Parsed payment receipt Ref#9812 details via image OCR.", actor: "AI Agent", timestamp: "Jun 24, 02:42 PM" },
      { id: "ACT-103", type: "AI Processing", title: "Transaction Parsed", details: "Matched billing account references for Bill-2026-012.", actor: "AI Agent", timestamp: "Jun 24, 02:43 PM" },
      { id: "ACT-104", type: "AI Processing", title: "Exception Detected", details: "Ref#9812 has not cleared bank ledger feeds yet.", actor: "System", timestamp: "Jun 24, 02:43 PM" }
    ],
    transactions: [
      { id: "TXN-201", type: "Invoice / Bill", ref: "Ref: Bill-2026-012", docNum: "BILL-202", amount: 50000, appliedAmount: 0, remainingBalance: 50000, status: "Outstanding", postingDate: "25-05-2026", customerRef: "CUST-TECH-01" },
      { id: "TXN-202", type: "Receipt Voucher", ref: "UTR/Ref: Ref#9812", docNum: "RCPT-202", amount: 50000, appliedAmount: 0, remainingBalance: 50000, status: "Available Credit", postingDate: "24-06-2026" }
    ],
    outstandingItems: [
      {
        id: "EXP-201",
        type: "Receipts not found",
        refNum: "Ref#9812",
        amount: 50000,
        priority: "Critical",
        status: "Unresolved",
        confidence: 88,
        explanation: "The transaction Ref#9812 is not yet cleared or found on the HDFC bank account statement feed.",
        suggestedActions: ["act_post_cash_rcpt1", "act_raise_inv_rcpt1"],
        relatedTxnIds: ["TXN-202"]
      }
    ]
  },
  {
    id: "TXN-EMAIL-003",
    sender: "refunds@nextlevelit.com",
    subject: "Refund Advice: Double Payment on INV-2026-011",
    amount: 75000,
    processingStatus: "Requires Review",
    aiConfidence: 96,
    exceptionCount: 1,
    date: "Jun 23, 2026, 11:05 AM",
    recipients: "PaymentAdviceIndia@financeplusindia.com",
    body: `Dear Accounts Team,

We confirmed that invoice INV-2026-011 (₹75,000) was double paid by your team. We have processed a credit refund of ₹75,000 back to your account.

Attached is the refund transaction sheet REF-9921 for your records. Please apply this refund against our account.

Regards,
Refunds Dept`,
    attachments: [
      { name: "refund_sheet_ref9921.pdf", size: "88 KB", type: "application/pdf" }
    ],
    longEmailThread: [],
    threadSummary: "Processing of a refund advice from NextLevel IT. A refund of ₹75,000 has been issued due to double payment of INV-2026-011. Recommending matching refund to double payment.",
    activityTimeline: [
      { id: "ACT-201", type: "Communication", title: "Email Received", details: "Refund note received from NextLevel IT.", actor: "System", timestamp: "Jun 23, 11:05 AM" },
      { id: "ACT-202", type: "AI Processing", title: "Attachment Parsed", details: "refund_sheet_ref9921.pdf data fields ingested.", actor: "AI Agent", timestamp: "Jun 23, 11:06 AM" },
      { id: "ACT-203", type: "AI Processing", title: "Transaction Parsed", details: "Identified billing matching keys: INV-2026-011 double payment.", actor: "AI Agent", timestamp: "Jun 23, 11:07 AM" }
    ],
    transactions: [
      { id: "TXN-301", type: "Invoice / Bill", ref: "Ref: INV-2026-011", docNum: "BILL-301", amount: 75000, appliedAmount: 75000, remainingBalance: 0, status: "Resolved", postingDate: "15-05-2026" },
      { id: "TXN-302", type: "Receipt Voucher", ref: "Ref: RCPT-8871", docNum: "RCPT-302", amount: 150000, appliedAmount: 75000, remainingBalance: 75000, status: "Available Credit", postingDate: "10-06-2026" },
      { id: "TXN-303", type: "Refund Entry", ref: "Doc Ref: REF-9921", docNum: "REF-9921", amount: 75000, appliedAmount: 0, remainingBalance: 75000, status: "Pending Review", postingDate: "22-06-2026" }
    ],
    outstandingItems: [
      {
        id: "EXP-301",
        type: "Refund Entries",
        refNum: "REF-9921",
        amount: 75000,
        priority: "High",
        status: "Unresolved",
        confidence: 96,
        explanation: "Refund voucher REF-9921 has been dispatch-cleared in ERP but is unassigned to original double-payment cash receipts.",
        suggestedActions: ["act_connect_refund_bill2"],
        relatedTxnIds: ["TXN-303", "TXN-302"]
      }
    ]
  }
];

export function TransactionHubPage() {
  const [queue, setQueue] = useState<EmailQueueItem[]>(INITIAL_QUEUE_DATA);
  const [selectedEmailId, setSelectedEmailId] = useState<string>("TXN-EMAIL-005");
  
  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "confidence">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection states
  const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([]);
  const [activeExceptionId, setActiveExceptionId] = useState<string | null>(null);

  // Email search within thread
  const [threadSearchQuery, setThreadSearchQuery] = useState("");

  // Attachment Preview Modal
  const [previewFile, setPreviewFile] = useState<{ name: string; size: string; type: string } | null>(null);

  // Collapsed states for email threads
  const [collapsedThreadIds, setCollapsedThreadIds] = useState<Record<number, boolean>>({});

  const toggleThreadCollapse = (idx: number) => {
    setCollapsedThreadIds((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // AI execution preview state
  const [activePlanAction, setActivePlanAction] = useState<SuggestedAction | null>(null);

  // Active email
  const activeEmail = useMemo(() => {
    return queue.find((e) => e.id === selectedEmailId) || queue[0];
  }, [queue, selectedEmailId]);

  // Handle email click
  const handleEmailSelect = (id: string) => {
    setSelectedEmailId(id);
    setSelectedTxnIds([]);
    setActiveExceptionId(null);
    setActivePlanAction(null);
    setThreadSearchQuery("");
  };

  // Filtered and Sorted Email List (Work Queue)
  const filteredQueue = useMemo(() => {
    return queue
      .filter((item) => {
        const matchesSearch =
          item.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.body.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter =
          statusFilter === "All" ||
          item.processingStatus === statusFilter ||
          (statusFilter === "Resolved" && item.processingStatus === "Processed");

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let valA: number | string = a.date;
        let valB: number | string = b.date;

        if (sortBy === "amount") {
          valA = a.amount;
          valB = b.amount;
        } else if (sortBy === "confidence") {
          valA = a.aiConfidence;
          valB = b.aiConfidence;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [queue, searchQuery, statusFilter, sortBy, sortOrder]);

  // Handle transaction card selection click (allows multi selection)
  const handleTxnCardClick = (id: string) => {
    setActiveExceptionId(null); // Clear exception highlight on direct card click
    setSelectedTxnIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle Outstanding item selection click
  const handleExceptionClick = (exception: OutstandingItem) => {
    if (activeExceptionId === exception.id) {
      setActiveExceptionId(null);
      setSelectedTxnIds([]);
    } else {
      setActiveExceptionId(exception.id);
      setSelectedTxnIds(exception.relatedTxnIds); // Highlight associated cards
    }
  };

  // Determine dynamic suggested actions based on selected transaction cards & active exceptions
  const dynamicSuggestedActions = useMemo(() => {
    if (activeExceptionId) {
      const activeExc = activeEmail.outstandingItems.find((e) => e.id === activeExceptionId);
      if (activeExc) {
        return activeExc.suggestedActions.map((actId) => DYNAMIC_ACTIONS_CATALOG[actId]).filter(Boolean);
      }
    }

    if (selectedTxnIds.length === 0) {
      // Default recommended actions based on open exceptions
      const unresolvedExceptions = activeEmail.outstandingItems.filter(e => e.status !== "Resolved");
      if (unresolvedExceptions.length > 0) {
        const allActIds = Array.from(new Set(unresolvedExceptions.flatMap(e => e.suggestedActions)));
        return allActIds.map(id => DYNAMIC_ACTIONS_CATALOG[id]).filter(Boolean);
      }
      return [DYNAMIC_ACTIONS_CATALOG.act_raise_inv_rcpt1];
    }

    const selectedCards = activeEmail.transactions.filter((t) => selectedTxnIds.includes(t.id));
    
    // Check references
    const hasBill = selectedCards.some((c) => c.type === "Invoice / Bill" || c.type === "Debit Note");
    const hasReceipt = selectedCards.some((c) => c.type === "Receipt Voucher" || c.type === "NEFT Payment");
    const hasRefund = selectedCards.some((c) => c.type === "Refund Entry");
    const hasCN = selectedCards.some((c) => c.type === "Credit Note");

    if (selectedCards.length === 2) {
      if (hasBill && hasReceipt) {
        // Contextual routing based on email data
        if (selectedEmailId === "TXN-EMAIL-004") {
          if (selectedTxnIds.includes("TXN-406")) { // MI3130009800
            return [DYNAMIC_ACTIONS_CATALOG.act_clear_mi9800];
          }
        }
        if (selectedEmailId === "TXN-EMAIL-001" && selectedTxnIds.includes("TXN-003")) {
          return [DYNAMIC_ACTIONS_CATALOG.act_connect_receipt_bill2];
        }
        return [DYNAMIC_ACTIONS_CATALOG.act_clear_bill1];
      }
      if (hasBill && hasCN) {
        return [DYNAMIC_ACTIONS_CATALOG.act_connect_cn_bill1];
      }
      if (hasReceipt && hasRefund) {
        return [DYNAMIC_ACTIONS_CATALOG.act_connect_refund_bill2];
      }
      if (hasRefund && hasBill) {
        if (selectedEmailId === "TXN-EMAIL-004") {
          return [DYNAMIC_ACTIONS_CATALOG.act_connect_refund_mi9788];
        }
      }
    }

    if (selectedCards.length >= 2 && selectedCards.every((c) => c.type === "Invoice / Bill")) {
      return [DYNAMIC_ACTIONS_CATALOG.act_group_bills];
    }

    if (selectedCards.length === 1) {
      const card = selectedCards[0];
      if (card.status === "Outstanding") {
        if (selectedEmailId === "TXN-EMAIL-004" && card.docNum === "MI3130009800") {
          return [DYNAMIC_ACTIONS_CATALOG.act_clear_mi9800];
        }
        return [DYNAMIC_ACTIONS_CATALOG.act_clear_bill1, DYNAMIC_ACTIONS_CATALOG.act_post_crco_bill1];
      }
      if (card.status === "Available Credit") {
        if (card.type === "Credit Note") return [DYNAMIC_ACTIONS_CATALOG.act_connect_cn_bill1];
        if (card.type === "Refund Entry") {
          if (selectedEmailId === "TXN-EMAIL-004") return [DYNAMIC_ACTIONS_CATALOG.act_connect_refund_mi9788];
          return [DYNAMIC_ACTIONS_CATALOG.act_connect_refund_bill2];
        }
        return [DYNAMIC_ACTIONS_CATALOG.act_connect_receipt_bill2];
      }
    }

    if (selectedCards.some(c => c.status === "Resolved")) {
      return [DYNAMIC_ACTIONS_CATALOG.act_disconnect];
    }

    return [DYNAMIC_ACTIONS_CATALOG.act_raise_inv_rcpt1];
  }, [selectedTxnIds, activeExceptionId, activeEmail, selectedEmailId]);

  // Dynamic AI Insight text explanation (Business language focus)
  const dynamicAIInsight = useMemo(() => {
    if (activeExceptionId) {
      const activeExc = activeEmail.outstandingItems.find((e) => e.id === activeExceptionId);
      if (activeExc) {
        return {
          text: `The remittance advice has been successfully parsed. Mapped exception '${activeExc.type}' impacts reference ${activeExc.refNum}. ${activeExc.explanation} AI recommends executing the actions listed below.`,
          confidence: activeExc.confidence
        };
      }
    }

    if (selectedTxnIds.length === 0) {
      const openCount = activeEmail.outstandingItems.filter(e => e.status !== "Resolved").length;
      return {
        text: `The remittance advice has been successfully parsed. Payment has been matched against multiple invoice references. ${
          openCount > 0
            ? `${openCount} transaction references require reconciliation before final settlement.`
            : "All matching references have been reconciled successfully."
        } Recommended actions are shown below based on detected relationships.`,
        confidence: activeEmail.aiConfidence
      };
    }

    const selectedCards = activeEmail.transactions.filter((t) => selectedTxnIds.includes(t.id));
    if (selectedCards.length === 2) {
      const types = selectedCards.map(c => c.type);
      if (types.includes("Invoice / Bill") && (types.includes("Receipt Voucher") || types.includes("NEFT Payment"))) {
        const bill = selectedCards.find(c => c.type === "Invoice / Bill")!;
        const receipt = selectedCards.find(c => c.type !== "Invoice / Bill")!;
        return {
          text: `Selected open invoice ${bill.docNum} (₹${bill.remainingBalance} outstanding) matches receipt voucher ${receipt.docNum} (₹${receipt.remainingBalance} available). Recommended clearing or matching actions will balance the records.`,
          confidence: 98
        };
      }
      if (types.includes("Invoice / Bill") && types.includes("Credit Note")) {
        const bill = selectedCards.find(c => c.type === "Invoice / Bill")!;
        const cn = selectedCards.find(c => c.type === "Credit Note")!;
        return {
          text: `Selected open invoice ${bill.docNum} and available Credit Note ${cn.docNum} correspond to a returned materials clearance request. Recommended actions will reconcile and close both cards.`,
          confidence: 97
        };
      }
      if (types.includes("Invoice / Bill") && types.includes("Refund Entry")) {
        const bill = selectedCards.find(c => c.type === "Invoice / Bill")!;
        const refund = selectedCards.find(c => c.type === "Refund Entry")!;
        return {
          text: `Selected invoice ${bill.docNum} shares billing incident codes with Refund ${refund.docNum}. Connecting these transaction records balances the ledger values.`,
          confidence: 98
        };
      }
    }

    if (selectedCards.every(c => c.type === "Invoice / Bill")) {
      return {
        text: `Grouped review of ${selectedCards.length} matching invoices. Combined outstanding value is ₹${selectedCards.reduce((acc, c) => acc + c.remainingBalance, 0).toLocaleString()}. Batch mapping reference GRP1 can clear these items together.`,
        confidence: 96
      };
    }

    return {
      text: "Parsed matching relationships for selected transaction records. Recommendations are generated based on chronological cash allocation models.",
      confidence: 93
    };
  }, [selectedTxnIds, activeExceptionId, activeEmail]);

  // Execute Action callback (remediates mock data locally)
  const handleExecuteActionConfirm = () => {
    if (!activePlanAction) return;

    const actionId = activePlanAction.id;
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Update queue records based on action type
    setQueue((prevQueue) => {
      return prevQueue.map((email) => {
        if (email.id !== selectedEmailId) return email;

        let updatedTxns = [...email.transactions];
        let updatedExceptions = [...email.outstandingItems];
        let updatedTimeline = [...email.activityTimeline];

        if (actionId === "act_connect_refund_mi9788") {
          // Resolve Refund Entries
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "Refund Entries" ? { ...ex, status: "Resolved" as const } : ex
          );
          // Update cards state
          updatedTxns = updatedTxns.map((t) => {
            if (t.docNum === "REF-9921") {
              return { ...t, appliedAmount: 75000, remainingBalance: 0, status: "Resolved" as const };
            }
            if (t.docNum === "MI3130009788") {
              return { ...t, status: "Resolved" as const };
            }
            return t;
          });
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "User Connected Transactions",
            details: "Associated double payment refund REF-9921 to invoice MI3130009788.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_clear_mi9800") {
          // Resolve Execute Clearing exception
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.refNum === "MI3130009800" ? { ...ex, status: "Resolved" as const } : ex
          );
          // Set invoice balance to 0 and payment applied amount
          updatedTxns = updatedTxns.map((t) => {
            if (t.docNum === "MI3130009800") {
              return { ...t, appliedAmount: 813020, remainingBalance: 0, status: "Resolved" as const };
            }
            if (t.docNum === "RCPT-MAIN") {
              return { ...t, appliedAmount: 3155172.50, remainingBalance: 0, status: "Resolved" as const };
            }
            return t;
          });
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "Execute Clearing",
            details: "Cleared and settled open ledger values for Invoice MI3130009800.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_connect_cn_bill1") {
          // Resolve CN Not Found
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "CN Not Found" ? { ...ex, status: "Resolved" as const } : ex
          );
          // Set credit note applied
          updatedTxns = updatedTxns.map((t) => {
            if (t.docNum === "CN-002") {
              return { ...t, appliedAmount: 5000, remainingBalance: 0, status: "Resolved" as const };
            }
            if (t.docNum === "BILL1") {
              return { ...t, appliedAmount: 100000, remainingBalance: 0, status: "Resolved" as const };
            }
            return t;
          });
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "User Connected Transactions",
            details: "Associated Credit Note CN-002 to Invoice BILL1 in cash clearing log.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_post_crco_bill1") {
          // Resolve Minor Diff
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "Minor Diff" ? { ...ex, status: "Resolved" as const } : ex
          );
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "System Event",
            title: "GL Posted",
            details: "Posted Cost Center (CRCO) minor variance adjustment of ₹15 to invoice BILL1 account.",
            actor: "System",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_clear_bill1") {
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "CN Not Found" || ex.type === "Minor Diff" ? { ...ex, status: "Resolved" as const } : ex
          );
          updatedTxns = updatedTxns.map((t) => {
            if (t.docNum === "BILL1") {
              return { ...t, appliedAmount: 100000, remainingBalance: 0, status: "Resolved" as const };
            }
            if (t.docNum === "CN-002") {
              return { ...t, appliedAmount: 5000, remainingBalance: 0, status: "Resolved" as const };
            }
            return t;
          });
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "Execute Clearing",
            details: "Cleared and posted balances for invoice BILL1.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_connect_receipt_bill2") {
          // Resolve Open Advance
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "Open Advance" ? { ...ex, status: "Resolved" as const } : ex
          );
          updatedTxns = updatedTxns.map((t) => {
            if (t.docNum === "BILL2") {
              return { ...t, appliedAmount: 125000, remainingBalance: 75000, status: "Outstanding" as const };
            }
            if (t.docNum === "RCPT1") {
              return { ...t, appliedAmount: 75000, remainingBalance: 0, status: "Resolved" as const };
            }
            return t;
          });
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "User Connected Transactions",
            details: "Allocated available Receipt RCPT1 balance (₹25,000) to Invoice BILL2 outstanding balance.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_connect_receipt_bill2") {
          updatedTxns = updatedTxns.map((t) => {
            if (t.docNum === "MI3130010200") {
              return { ...t, appliedAmount: 675432, remainingBalance: 0, status: "Resolved" as const };
            }
            return t;
          });
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "User Connected Transactions",
            details: "Linked cash receipt credit allocation details.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_post_cash_rcpt1") {
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "Receipts not found" ? { ...ex, status: "Resolved" as const } : ex
          );
          updatedTxns = updatedTxns.map((t) => {
            if (t.docNum === "RCPT-202") {
              return { ...t, status: "Resolved" as const, remainingBalance: 0, appliedAmount: 50000 };
            }
            if (t.docNum === "BILL-202") {
              return { ...t, status: "Resolved" as const, remainingBalance: 0, appliedAmount: 50000 };
            }
            return t;
          });
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "System Event",
            title: "GL Posted",
            details: "Manually posted bank ledger card Ref#9812 to clear AR invoices balance.",
            actor: "System",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_connect_refund_bill2") {
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "Refund Entries" ? { ...ex, status: "Resolved" as const } : ex
          );
          updatedTxns = updatedTxns.map((t) => {
            if (t.docNum === "REF-9921") {
              return { ...t, status: "Resolved" as const, remainingBalance: 0, appliedAmount: 75000 };
            }
            if (t.docNum === "RCPT-302") {
              return { ...t, status: "Resolved" as const, remainingBalance: 0, appliedAmount: 150000 };
            }
            return t;
          });
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "User Connected Transactions",
            details: "Associated Refund REF-9921 to match double receipt payments.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_group_bills") {
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "Grouping Completed",
            details: "Grouped outstanding invoice references under batch record GRP1.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_disconnect") {
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "User Action",
            title: "Disconnect Transaction",
            details: "Unlinked card allocation mappings.",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`
          });
        } else if (actionId === "act_raise_inv_rcpt1") {
          updatedTimeline.push({
            id: `TL-NEW-${Date.now()}`,
            type: "System Event",
            title: "Investigation Raised",
            details: "Dispatched automated discrepancy ticket to Chase Bank receivables query desks.",
            actor: "System",
            timestamp: `Today, ${nowStr}`
          });
        }

        // Re-calculate exceptions status
        const openExps = updatedExceptions.filter((ex) => ex.status !== "Resolved");
        const resolved = openExps.length === 0;

        return {
          ...email,
          transactions: updatedTxns,
          outstandingItems: updatedExceptions,
          activityTimeline: updatedTimeline,
          exceptionCount: openExps.length,
          processingStatus: resolved ? "Resolved" : email.processingStatus
        };
      });
    });

    // Close plan view and clear selections
    setActivePlanAction(null);
    setSelectedTxnIds([]);
    setActiveExceptionId(null);
  };

  // Keyword highlighting inside email body text
  const highlightEmailText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} style={{ background: "rgba(251,191,36,0.3)", color: "var(--foreground)", padding: "0 2px", borderRadius: 2 }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const paymentCard = activeEmail.transactions.find(
    (t) => t.type === "NEFT Payment" || t.type === "Receipt Voucher"
  ) || activeEmail.transactions[0];

  const invoiceCards = activeEmail.transactions.filter(
    (t) => (t.type === "Invoice / Bill" || t.type === "Debit Note") && t !== paymentCard
  );

  const otherCards = activeEmail.transactions.filter(
    (t) => t !== paymentCard && !invoiceCards.includes(t)
  );

  return (
    <main
      className="flex-1 flex flex-row h-full overflow-hidden w-full"
      style={{ background: "var(--background)", fontFamily: "var(--font-family)" }}
    >
      {/* ─── COLUMN 1: WORK QUEUE (EMAIL LIST) ─── */}
      <div
        className="flex flex-col h-full flex-shrink-0"
        style={{
          width: 320,
          minWidth: 320,
          borderRight: "1px solid var(--border)",
          background: "var(--card)"
        }}
      >
        {/* Search & Header */}
        <div className="px-4 py-3 border-b border-border flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
              Remediation Queue
            </span>
            <span
              className="rounded-full px-2 py-0.5 flex items-center justify-center font-mono"
              style={{ fontSize: 10, fontWeight: 700, background: "var(--secondary)", color: "var(--muted-foreground)" }}
            >
              {queue.filter((e) => e.processingStatus !== "Resolved").length} open
            </span>
          </div>

          {/* Search box */}
          <div
            className="flex items-center gap-2 rounded-lg px-2.5"
            style={{
              height: 32,
              background: "var(--secondary)",
              border: "1px solid var(--border)"
            }}
          >
            <Search size={13} style={{ color: "var(--muted-foreground)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communications…"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 12,
                color: "var(--foreground)",
                width: "100%"
              }}
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <SlidersHorizontal size={11} style={{ color: "var(--muted-foreground)" }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Exceptions Detected">Exceptions</option>
                <option value="Requires Review">Needs Review</option>
                <option value="Resolved">Resolved / Processed</option>
              </select>
            </div>

            <button
              onClick={() => {
                if (sortBy === "date") setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                else setSortBy("date");
              }}
              className="flex items-center gap-1 p-1 hover:bg-secondary rounded transition-colors border-none"
              style={{ background: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
              title="Sort items"
            >
              <ArrowUpDown size={11} />
              <span>{sortBy === "date" ? "Date" : sortBy === "amount" ? "Amount" : "Confidence"}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Work List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 animate-in fade-in duration-200">
          {filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <Mail size={24} style={{ color: "var(--muted-foreground)" }} />
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No transaction items in queue.</p>
            </div>
          ) : (
            filteredQueue.map((item) => {
              const isSelected = selectedEmailId === item.id;
              const hasExceptions = item.exceptionCount > 0;
              const isResolved = item.processingStatus === "Resolved" || item.processingStatus === "Processed";
              const openExps = item.outstandingItems.filter(e => e.status !== "Resolved");

              return (
                <button
                  key={item.id}
                  onClick={() => handleEmailSelect(item.id)}
                  className="flex flex-col gap-2 rounded-xl p-3 text-left w-full transition-all duration-200 border-none"
                  style={{
                    background: isSelected ? "var(--accent)" : "transparent",
                    border: `1.5px solid ${isSelected ? "var(--border)" : "transparent"}`,
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.02)" : "none"
                  }}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {item.sender.split("@")[0].replaceAll("_", " ")}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", flexShrink: 0 }}>
                      {item.date.split(",")[0]}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 500,
                      color: "var(--foreground)",
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {item.subject}
                  </span>

                  {/* Queue Details Grid */}
                  <div className="grid grid-cols-2 gap-y-1 mt-1 text-[10.5px]">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Amt:</span>
                      <strong style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                        ₹{item.amount.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-muted-foreground">AI:</span>
                      <strong style={{ color: "var(--foreground)" }}>{item.aiConfidence}%</strong>
                    </div>
                  </div>

                  {/* Summary Badges Row */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span
                      className="rounded-full px-2 py-0.5 font-semibold text-[9px]"
                      style={{
                        background: isResolved
                          ? "rgba(34,197,94,0.08)"
                          : hasExceptions
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(245,158,11,0.08)",
                        color: isResolved ? "#22c55e" : hasExceptions ? "#ef4444" : "#f59e0b"
                      }}
                    >
                      {item.processingStatus}
                    </span>

                    {openExps.length > 0 && (
                      <span className="rounded-full px-2 py-0.5 bg-red-100 dark:bg-red-950/20 text-red-500 font-semibold text-[9px]">
                        {openExps.length} Exceptions
                      </span>
                    )}

                    {/* Show credit indicators */}
                    {item.transactions.some(t => t.status === "Available Credit" && t.remainingBalance > 0) && (
                      <span className="rounded-full px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 font-semibold text-[9px]">
                        Credit Avail.
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── COLUMN 2: WORKSPACE PANEL ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0" style={{ background: "var(--secondary)" }}>
        {/* Workspace Top Toolbar */}
        <header
          className="flex items-center justify-between px-6 bg-card"
          style={{ height: 48, borderBottom: "1px solid var(--border)", flexShrink: 0 }}
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-secondary text-foreground">
              <Mail size={13} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
              Remittance Communication Viewer
            </span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
              QUEUE REF: {activeEmail.id}
            </span>
          </div>

          <div
            className="flex items-center gap-2 rounded px-2"
            style={{
              height: 28,
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              maxWidth: 220
            }}
          >
            <Search size={11} style={{ color: "var(--muted-foreground)" }} />
            <input
              value={threadSearchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search text in thread…"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 11.5,
                color: "var(--foreground)"
              }}
            />
          </div>
        </header>

        {/* Column 2 Inner Split Pane */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 gap-4">
          
          {/* TOP HALF: Outlook Visual Style Email Viewer */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 bg-card text-left"
            style={{ border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Remittance Advice Email Thread
                </span>
                <h2 style={{ fontSize: 15, fontWeight: 750, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                  {highlightEmailText(activeEmail.subject, threadSearchQuery)}
                </h2>
              </div>
              
              <div className="flex items-center gap-2 rounded px-2 py-1 bg-secondary text-muted-foreground text-[10.5px]">
                <Calendar size={12} />
                <span style={{ fontFamily: "var(--font-mono)" }}>{activeEmail.date}</span>
              </div>
            </div>

            {/* Outlook Metadata Card */}
            <div className="rounded-xl p-3 bg-secondary/60 flex flex-col gap-1.5 text-xs border border-border">
              <div className="flex justify-between">
                <div>From: <strong style={{ color: "var(--foreground)" }}>{activeEmail.sender}</strong></div>
                <div style={{ color: "var(--muted-foreground)" }}>NEFT Bank Transfer</div>
              </div>
              <div>To: <span style={{ color: "var(--foreground)" }}>{activeEmail.recipients}</span></div>
            </div>

            {/* Email Body */}
            <div
              className="text-sm text-foreground overflow-y-auto max-h-[180px] whitespace-pre-wrap leading-relaxed border-l-2 pl-4 border-indigo-500/20"
              style={{ color: "var(--foreground)", fontFamily: "inherit" }}
            >
              {highlightEmailText(activeEmail.body, threadSearchQuery)}
            </div>

            {/* Attachments */}
            {activeEmail.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-3 border-t border-border">
                {activeEmail.attachments.map((file, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => setPreviewFile(file)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left bg-secondary hover:bg-accent border transition-colors cursor-pointer border-border"
                  >
                    <Paperclip size={13} style={{ color: "var(--muted-foreground)" }} />
                    <div className="flex flex-col">
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--foreground)" }}>{file.name}</span>
                      <span style={{ fontSize: 9.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{file.size} · Preview available</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Collapsible previous email threads */}
            {activeEmail.longEmailThread.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                  EMAIL THREAD HISTORY ({activeEmail.longEmailThread.length})
                </span>
                
                {activeEmail.longEmailThread.map((history, hIdx) => {
                  const isCollapsed = collapsedThreadIds[hIdx] ?? true;
                  return (
                    <div
                      key={hIdx}
                      className="rounded-lg overflow-hidden border"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <button
                        onClick={() => toggleThreadCollapse(hIdx)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/80 hover:bg-secondary text-left border-none"
                        style={{ cursor: "pointer", fontSize: 11 }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <strong style={{ color: "var(--foreground)" }}>{history.sender}</strong>
                          <span style={{ color: "var(--muted-foreground)" }}>·</span>
                          <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{history.date}</span>
                        </div>
                        {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                      </button>

                      {!isCollapsed && (
                        <div className="p-3 bg-card text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--secondary-foreground)" }}>
                          {highlightEmailText(history.body, threadSearchQuery)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTTOM HALF: Transaction Workspace */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 bg-card relative text-left"
            style={{ border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
                  <Sparkles size={14} />
                </span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                  AI-First Reconciliation Workspace
                </h3>
              </div>
              <span className="text-muted-foreground text-[10.5px]">
                Double-click or select cards to resolve balances
              </span>
            </div>

            {/* A. RECONCILIATION FLOW DIAGRAM */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                  CONNECTED RECONCILIATION FLOW (MONEY DISTRIBUTION)
                </span>
                {paymentCard && (
                  <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded font-mono">
                    UTR: {paymentCard.ref.replace("UTR ", "")}
                  </span>
                )}
              </div>

              <div className="rounded-2xl p-6 bg-secondary/40 border border-border flex flex-col items-center gap-5">
                {/* 1. ROOT PAYMENT CARD */}
                {paymentCard && (
                  <div className="w-full max-w-md flex flex-col items-center">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">
                      Source Payment Receipt
                    </span>
                    <button
                      onClick={() => handleTxnCardClick(paymentCard.id)}
                      className="rounded-xl p-5 flex flex-col justify-between text-left transition-all hover:scale-[1.01] border select-none w-full animate-in fade-in duration-200 min-h-[220px]"
                      style={{
                        background: selectedTxnIds.includes(paymentCard.id) ? "var(--secondary)" : "var(--card)",
                        borderColor: selectedTxnIds.includes(paymentCard.id) ? "rgba(107,140,255,0.8)" : "var(--border)",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span style={{ fontSize: 11, fontWeight: 750, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Payment
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[8.5px] font-bold"
                          style={{
                            background: "rgba(34,197,94,0.12)",
                            color: "#22c55e"
                          }}
                        >
                          Completed
                        </span>
                      </div>

                      <div className="my-1.5">
                        <span className="text-[10px] text-muted-foreground block font-medium">Payment Amount</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                          ₹{paymentCard.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 text-[11px] text-muted-foreground border-t border-border pt-3 w-full">
                        <div className="flex justify-between items-center w-full gap-3">
                          <span className="flex-shrink-0">UTR</span>
                          <strong className="font-mono text-foreground text-right">{paymentCard.ref.replace("UTR ", "")}</strong>
                        </div>
                        <div className="flex justify-between items-center w-full gap-3">
                          <span className="flex-shrink-0">Transaction Type</span>
                          <span className="text-foreground font-semibold text-right">NEFT</span>
                        </div>
                        {paymentCard.customerRef && (
                          <div className="flex justify-between items-center w-full gap-3">
                            <span className="flex-shrink-0">Customer Ref</span>
                            <strong className="text-foreground font-mono text-right">{paymentCard.customerRef}</strong>
                          </div>
                        )}
                        {paymentCard.remitter && (
                          <div className="flex justify-between items-start w-full gap-3">
                            <span className="flex-shrink-0">Remitter</span>
                            <span className="text-foreground text-right" title={paymentCard.remitter}>{paymentCard.remitter}</span>
                          </div>
                        )}
                        {paymentCard.beneficiary && (
                          <div className="flex justify-between items-start w-full gap-3">
                            <span className="flex-shrink-0">Beneficiary</span>
                            <span className="text-foreground text-right" title={paymentCard.beneficiary}>{paymentCard.beneficiary}</span>
                          </div>
                        )}
                        {paymentCard.valueDate && (
                          <div className="flex justify-between items-center w-full gap-3">
                            <span className="flex-shrink-0">Value Date</span>
                            <strong className="text-foreground text-right">{paymentCard.valueDate}</strong>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                )}

                {/* Vertical Connector Arrow */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-border relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                  </div>
                </div>

                {/* 2. INVOICE REFERENCES (RESPONSIVE GRID) */}
                <div className="w-full flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">
                    Allocated Invoices ({invoiceCards.length})
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    {invoiceCards.map((txn) => {
                      const isSelected = selectedTxnIds.includes(txn.id);
                      
                      let statusBg = "rgba(136,136,150,0.08)";
                      let statusColor = "var(--muted-foreground)";
                      let cardBorderColor = "var(--border)";

                      if (txn.status === "Outstanding") {
                        statusBg = "rgba(239,68,68,0.08)";
                        statusColor = "#ef4444";
                      } else if (txn.status === "Available Credit") {
                        statusBg = "rgba(34,197,94,0.08)";
                        statusColor = "#22c55e";
                      } else if (txn.status === "Resolved") {
                        statusBg = "rgba(34,197,94,0.12)";
                        statusColor = "#22c55e";
                      }

                      if (isSelected) {
                        cardBorderColor = "rgba(107,140,255,0.8)";
                      }

                      return (
                        <button
                          key={txn.id}
                          onClick={() => handleTxnCardClick(txn.id)}
                          className="rounded-xl p-5 flex flex-col justify-between text-left transition-all hover:scale-[1.01] border select-none w-full animate-in fade-in duration-200 min-h-[210px]"
                          style={{
                            background: isSelected ? "var(--secondary)" : "var(--card)",
                            borderColor: cardBorderColor,
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Invoice
                            </span>
                            <span
                              className="rounded px-1.5 py-0.5 text-[8.5px] font-bold animate-pulse-subtle"
                              style={{ background: statusBg, color: statusColor }}
                            >
                              {txn.status}
                            </span>
                          </div>

                          <div className="my-1.5">
                            <span className="text-[9.5px] text-muted-foreground block font-medium">Invoice Amount</span>
                            <span style={{ fontSize: 16.5, fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
                              ₹{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 text-[11px] text-muted-foreground border-t border-border pt-3 w-full">
                            <div className="flex justify-between items-center w-full gap-2">
                              <span className="flex-shrink-0">Ref</span>
                              <strong className="text-foreground font-mono text-right">{txn.docNum}</strong>
                            </div>
                            <div className="flex justify-between items-center w-full gap-2">
                              <span className="flex-shrink-0">Applied</span>
                              <span className="font-mono text-foreground font-semibold text-right">
                                ₹{txn.appliedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center w-full gap-2">
                              <span className="flex-shrink-0">Remaining</span>
                              <span
                                className="font-mono font-semibold text-right"
                                style={{
                                  color: txn.remainingBalance > 0 ? "#ef4444" : "var(--muted-foreground)"
                                }}
                              >
                                ₹{txn.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center w-full gap-2 mt-0.5 text-[9.5px] text-gray-400">
                              <span className="flex-shrink-0">Posted</span>
                              <span className="text-right">{txn.postingDate}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vertical Connector Arrow */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-border relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                  </div>
                </div>

                {/* 3. APPLIED ALLOCATION LEVEL */}
                <div className="w-full max-w-lg bg-card border border-border rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      Applied Allocation
                    </span>
                    <span style={{ fontSize: 9.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                      Total Matched: {((invoiceCards.reduce((acc, c) => acc + c.appliedAmount, 0) / (paymentCard?.amount || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Allocation progress bar */}
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (invoiceCards.reduce((acc, c) => acc + c.appliedAmount, 0) / (paymentCard?.amount || 1)) * 100
                        )}%`
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10.5px] mt-0.5">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[8.5px]">Total Receipt</span>
                      <strong className="font-mono text-foreground">₹{paymentCard?.amount.toLocaleString()}</strong>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground text-[8.5px]">Total Distributed</span>
                      <strong className="font-mono text-emerald-500">₹{invoiceCards.reduce((acc, c) => acc + c.appliedAmount, 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. OUTSTANDING / EXCEPTIONS (IF ANY) */}
                {otherCards.length > 0 && (
                  <>
                    {/* Vertical Connector Arrow */}
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-6 bg-border relative">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                      </div>
                    </div>

                    <div className="w-full flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
                        Unmatched / Exception Entries ({otherCards.length})
                      </span>
                      <div className="flex flex-wrap justify-center gap-3 w-full max-w-4xl">
                        {otherCards.map((txn) => {
                          const isSelected = selectedTxnIds.includes(txn.id);
                          let borderCol = "var(--border)";
                          if (isSelected) borderCol = "rgba(107,140,255,0.8)";

                          return (
                            <button
                              key={txn.id}
                              onClick={() => handleTxnCardClick(txn.id)}
                              className="rounded-xl p-4 flex flex-col justify-between text-left transition-all hover:scale-[1.01] border select-none w-full animate-in fade-in duration-200 min-h-[190px]"
                              style={{
                                width: 220,
                                background: isSelected ? "var(--secondary)" : "var(--card)",
                                borderColor: borderCol,
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  {txn.type}
                                </span>
                                <span
                                  className="rounded px-1.5 py-0.5 text-[8.5px] font-bold"
                                  style={{
                                    background: "rgba(245,158,11,0.08)",
                                    color: "#f59e0b"
                                  }}
                                >
                                  {txn.status}
                                </span>
                              </div>

                              <div className="my-1">
                                <span className="text-[10px] text-muted-foreground block font-medium">Amount</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                                  ₹{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 text-[10.5px] text-muted-foreground border-t border-border pt-2 w-full">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', whiteSpace: 'nowrap' }}>
                                  <span>Doc Ref</span>
                                  <strong className="font-mono text-foreground truncate max-w-[120px]">{txn.docNum}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', whiteSpace: 'nowrap' }}>
                                  <span>Details</span>
                                  <span className="text-foreground truncate max-w-[120px]" title={txn.ref}>{txn.ref}</span>
                                </div>
                                {txn.postingDate && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', whiteSpace: 'nowrap' }} className="mt-0.5 text-[9px] text-gray-400">
                                    <span>Posted Date</span>
                                    <span>{txn.postingDate}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* B. OUTSTANDING ITEMS (RECONCILIATION FLAGS) */}
            <div className="flex flex-col gap-2">
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                OUTSTANDING ITEMS (REMEDIAL ACTION QUEUE)
              </span>

              <div className="grid grid-cols-2 gap-3">
                {activeEmail.outstandingItems.map((ex) => {
                  const isSelected = activeExceptionId === ex.id;
                  const isResolved = ex.status === "Resolved";

                  let color = "#f59e0b"; // amber
                  let bg = "rgba(245,158,11,0.05)";
                  let borderColor = "var(--border)";

                  if (isResolved) {
                    color = "#22c55e"; // green
                    bg = "rgba(34,197,94,0.05)";
                  } else if (ex.priority === "Critical" || ex.priority === "High") {
                    color = "#ef4444"; // red
                    bg = "rgba(239,68,68,0.05)";
                  }

                  if (isSelected) {
                    borderColor = color;
                  }

                  return (
                    <button
                      key={ex.id}
                      onClick={() => !isResolved && handleExceptionClick(ex)}
                      disabled={isResolved}
                      className="rounded-xl p-3.5 flex flex-col gap-2 text-left transition-all hover:scale-[1.01] border-none"
                      style={{
                        background: isSelected ? bg : "var(--card)",
                        border: `1.5px solid ${borderColor}`,
                        cursor: isResolved ? "default" : "pointer",
                        opacity: isResolved ? 0.6 : 1,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
                      }}
                    >
                      <div className="flex items-center justify-between w-full text-xs border-b border-border pb-1">
                        <span style={{ fontWeight: 700, color }}>{ex.type}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className="rounded px-1.5 py-0.5 text-[8.5px] font-bold"
                            style={{
                              background: ex.priority === "Critical" || ex.priority === "High" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                              color: ex.priority === "Critical" || ex.priority === "High" ? "#ef4444" : "#f59e0b"
                            }}
                          >
                            {ex.priority}
                          </span>
                          <span style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                            {ex.confidence}% AI
                          </span>
                        </div>
                      </div>

                      {/* Explanation */}
                      <p className="m-0" style={{ fontSize: 11, color: "var(--foreground)", lineHeight: 1.4 }}>
                        {ex.explanation}
                      </p>

                      <div className="flex justify-between items-baseline mt-1.5 pt-1.5 border-t border-border/40">
                        <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>
                          Ref Code: <span className="font-mono">{ex.refNum}</span>
                        </span>
                        <strong style={{ fontSize: 11.5, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                          ₹{ex.amount.toLocaleString()}
                        </strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* C. AI INSIGHT EXPLANATION */}
            <div
              className="rounded-xl p-3.5 flex flex-col gap-1 bg-indigo-50/30 dark:bg-indigo-950/10 border"
              style={{ borderColor: "rgba(107,140,255,0.15)" }}
            >
              <div className="flex items-center gap-1.5 text-indigo-500 font-bold" style={{ fontSize: 9.5, letterSpacing: "0.04em" }}>
                <Sparkles size={11} />
                <span>AI MATCHING RECONCILIATION INSIGHT</span>
              </div>
              <p className="m-0 text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                {dynamicAIInsight.text}
              </p>
            </div>

            {/* D. SUGGESTED ACTIONS (CONTEXTUAL RECOMMENDATIONS) */}
            <div className="flex flex-col gap-2.5">
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                SUGGESTED ACTIONS (RECOMMENDED REMEDIATIONS)
              </span>

              <div className="flex flex-col gap-2">
                {dynamicSuggestedActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setActivePlanAction(action)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-accent hover:scale-[1.002] transition-all text-left border border-border"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="flex items-center justify-center rounded-lg mt-0.5"
                        style={{ width: 24, height: 24, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}
                      >
                        <Info size={12} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
                          {action.label}
                        </span>
                        <p className="m-0" style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>
                          {action.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                        {action.confidence}% Confidence
                      </span>
                      <div className="p-1 rounded bg-foreground text-background">
                        <ArrowRight size={11} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* E. AI EXECUTION PREVIEW (SLIDER FOOTER CARD) */}
            {activePlanAction && (
              <div
                className="absolute inset-x-0 bottom-0 p-5 rounded-2xl flex flex-col gap-3.5 border z-30 animate-in slide-in-from-bottom duration-200"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.08)"
                }}
              >
                <div className="flex justify-between items-center pb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: "#6b8cff" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                      AI Execution Plan: {activePlanAction.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setActivePlanAction(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 bg-secondary/60 p-3.5 rounded-xl text-xs border">
                  <span style={{ fontWeight: 700, color: "var(--foreground)", fontSize: 10, letterSpacing: "0.04em" }}>
                    ACTIONS TO PERFORM
                  </span>
                  
                  <div className="flex flex-col gap-1.5">
                    {activePlanAction.plan.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2" style={{ color: "var(--secondary-foreground)" }}>
                        <span style={{ color: "#6b8cff" }}>·</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: "4px 0" }} />

                  <div className="flex items-center justify-between">
                    <span style={{ fontWeight: 700, color: "var(--foreground)", fontSize: 10 }}>EXPECTED OUTCOME:</span>
                    <span className="font-semibold text-emerald-500">{activePlanAction.expectedResult}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => setActivePlanAction(null)}
                    className="rounded-lg px-4 py-2 hover:bg-accent border cursor-pointer font-semibold transition-colors"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteActionConfirm}
                    className="rounded-lg px-4 py-2 cursor-pointer font-semibold transition-colors border-none"
                    style={{ background: "var(--foreground)", color: "var(--background)", fontSize: 12 }}
                  >
                    Execute Action
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── COLUMN 3: THREAD ACTIVITY & SUMMARY DRAWER ─── */}
      <div
        className="flex flex-col h-full flex-shrink-0"
        style={{
          width: 340,
          minWidth: 340,
          borderLeft: "1px solid var(--border)",
          background: "var(--card)"
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)", height: 48, flexShrink: 0 }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 24, height: 24, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}
          >
            <History size={13} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--foreground)" }}>
            Reconciliation Activity Workspace
          </span>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          
          {/* Section 1: Thread Summary */}
          <div className="flex flex-col gap-2 text-left">
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
              CONCISE THREAD SUMMARY
            </span>
            <div
              className="rounded-xl p-3.5 bg-secondary/50 text-xs border leading-relaxed"
              style={{ color: "var(--foreground)" }}
            >
              {activeEmail.threadSummary}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: 0 }} />

          {/* Section 2: Unified Chronological Activity Timeline */}
          <div className="flex flex-col gap-3 text-left">
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
              UNIFIED ACTIVITY TIMELINE
            </span>

            <div className="flex flex-col pl-2.5 relative">
              {activeEmail.activityTimeline.map((event, eIdx) => {
                const isLast = eIdx === activeEmail.activityTimeline.length - 1;
                
                // Color timeline markers by event type
                let markerBg = "rgba(136,136,150,0.08)";
                let markerColor = "var(--muted-foreground)";

                if (event.type === "Communication") {
                  markerBg = "rgba(107,140,255,0.08)";
                  markerColor = "#6b8cff";
                } else if (event.type === "AI Processing") {
                  markerBg = "rgba(139,92,246,0.08)";
                  markerColor = "#8b5cf6";
                } else if (event.type === "User Action") {
                  markerBg = "rgba(34,197,94,0.08)";
                  markerColor = "#22c55e";
                } else if (event.type === "System Event") {
                  markerBg = "rgba(245,158,11,0.08)";
                  markerColor = "#f59e0b";
                }

                return (
                  <div key={event.id} className="flex items-start gap-3 relative pb-5 text-left">
                    {/* Vertical line connector */}
                    {!isLast && (
                      <div className="absolute w-0.5" style={{ left: 10, top: 20, bottom: 0, background: "var(--border)" }} />
                    )}

                    {/* Timeline dot icon indicator */}
                    <div
                      className="flex items-center justify-center rounded-full z-10 flex-shrink-0"
                      style={{
                        width: 20,
                        height: 20,
                        background: markerBg,
                        color: markerColor,
                        border: "1px solid var(--border)",
                        fontSize: 8,
                        fontWeight: 700
                      }}
                      title={event.type}
                    >
                      {event.type[0]}
                    </div>

                    {/* Timeline Event Details */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }}>
                          {event.title}
                        </span>
                        <span style={{ fontSize: 8.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                          {event.timestamp.split(",")[1] || event.timestamp}
                        </span>
                      </div>
                      {event.details && (
                        <p className="m-0 text-muted-foreground text-[10.5px] leading-normal mt-0.5">
                          {event.details}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 text-[8.5px] text-muted-foreground">
                        <span className="font-semibold">{event.actor}</span>
                        <span>·</span>
                        <span>{event.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reset State Button */}
        <div className="p-3 border-t border-border flex justify-center bg-secondary/10">
          <button
            onClick={() => {
              setQueue(INITIAL_QUEUE_DATA);
              setSelectedTxnIds([]);
              setActiveExceptionId(null);
              setActivePlanAction(null);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-secondary hover:bg-accent transition-colors border text-xs cursor-pointer text-muted-foreground border-border"
            title="Reset queue state"
          >
            <RotateCcw size={11} /> Reset Reconciler Demo State
          </button>
        </div>
      </div>

      {/* ─── ATTACHMENT PREVIEW MODAL (REUSED STYLE) ─── */}
      {previewFile && (
        <div
          className="flex items-center justify-center"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 200,
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: 680,
              maxHeight: "85vh",
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0"
              style={{ background: "var(--secondary)" }}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                  {previewFile.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                  {previewFile.size}
                </span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="flex items-center justify-center p-1 rounded hover:bg-accent cursor-pointer border-none"
                style={{ background: "none", color: "var(--muted-foreground)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Document Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted flex justify-center items-start">
              <div
                style={{
                  width: "100%",
                  maxWidth: 600,
                  background: "#ffffff",
                  borderRadius: 12,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  padding: 24,
                  color: "#111113",
                  fontFamily: "var(--font-sans)",
                  border: "1px solid rgba(0,0,0,0.08)"
                }}
              >
                {previewFile.name.includes("PDS_RD") ? (
                  <div className="flex flex-col gap-4 text-left">
                    <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 m-0">CHASE PAYMENT ADVICE DETAILED BREAKDOWN</h4>
                        <span className="text-[10px] text-gray-400 font-mono">UTIN: JPMNH261510928</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-base text-gray-900 font-bold font-mono">
                          {selectedEmailId === "TXN-EMAIL-004" || selectedEmailId === "TXN-EMAIL-005" ? "₹3,155,172.50" : "₹1,50,000.00"}
                        </strong>
                        <p className="text-[10px] text-emerald-500 font-semibold m-0">Settled via NEFT</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase m-0">Remitter (Customer)</p>
                        <p className="font-semibold text-gray-800 m-0">
                          {selectedEmailId === "TXN-EMAIL-004" || selectedEmailId === "TXN-EMAIL-005" ? "WPP MEDIA INDIA PRIVATE LIMITED" : "Acme Systems India Pvt Ltd"}
                        </p>
                        <p className="text-gray-500 m-0">
                          JPM Corporate Client Ref: {selectedEmailId === "TXN-EMAIL-004" || selectedEmailId === "TXN-EMAIL-005" ? "MHMJ26050715" : "ACME-IN-10"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase m-0">Beneficiary Partner</p>
                        <p className="font-semibold text-gray-800 m-0">
                          {selectedEmailId === "TXN-EMAIL-004" || selectedEmailId === "TXN-EMAIL-005" ? "TV TODAY NETWORK LTD" : "Finance Plus India Ltd"}
                        </p>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse mt-4">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="p-2 text-[9px] font-bold text-gray-400 uppercase">Document ID</th>
                          <th className="p-2 text-[9px] font-bold text-gray-400 uppercase text-right">Settled Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmailId === "TXN-EMAIL-004" || selectedEmailId === "TXN-EMAIL-005" ? (
                          <>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130009788</td>
                              <td className="p-2 text-right font-mono font-semibold">₹578,200.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130009787</td>
                              <td className="p-2 text-right font-mono font-semibold">₹392,350.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130009801</td>
                              <td className="p-2 text-right font-mono font-semibold">₹18,408.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130009803</td>
                              <td className="p-2 text-right font-mono font-semibold">₹288,805.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130009800</td>
                              <td className="p-2 text-right font-mono font-semibold">₹813,020.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI313010035</td>
                              <td className="p-2 text-right font-mono font-semibold">₹280,987.50</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130010200</td>
                              <td className="p-2 text-right font-mono font-semibold">₹675,432.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130009784</td>
                              <td className="p-2 text-right font-mono font-semibold">₹20,650.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130009799</td>
                              <td className="p-2 text-right font-mono font-semibold">₹75,048.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">MI3130009802</td>
                              <td className="p-2 text-right font-mono font-semibold">₹12,272.00</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">BILL1</td>
                              <td className="p-2 text-right font-mono font-semibold">₹95,000.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">RCPT1</td>
                              <td className="p-2 text-right font-mono font-semibold">₹75,000.00</td>
                            </tr>
                            <tr className="border-b border-gray-100 text-gray-700">
                              <td className="p-2 font-mono">BILL2</td>
                              <td className="p-2 text-right font-mono font-semibold">₹20,000.00</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>

                    <div className="flex flex-col gap-1 text-[10px] text-gray-400 border-t border-gray-100 pt-4">
                      <span>Advice Ledger Note:</span>
                      <span className="italic text-gray-500 font-medium">
                        {selectedEmailId === "TXN-EMAIL-004" || selectedEmailId === "TXN-EMAIL-005"
                          ? "Payment distributed fully across 10 invoices. Settlement allocation verified by bank ledger."
                          : "₹5,000 returned goods Credit Note reference CN-002 has been deducted against BILL1 values."}
                      </span>
                    </div>
                  </div>
                ) : previewFile.name.includes("wire") ? (
                  <div className="flex flex-col gap-4 text-left">
                    <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 m-0">BANK TRANSACTION RECEIPT</h4>
                        <span className="text-[10px] text-gray-400 font-mono">Ref #9812-TX-LEDGER</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-base text-gray-900 font-bold font-mono">₹50,000.00</strong>
                        <p className="text-[10px] text-emerald-500 font-semibold m-0">Transfer Successful</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2 p-3 bg-gray-50 rounded-xl border text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transaction ID:</span>
                        <span className="font-mono text-gray-700">SBI9981277321</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment Reference:</span>
                        <span className="font-mono text-gray-700">Reconcile outstanding Bill-2026-012</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 text-left">
                    <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 m-0">REFUND ADVICE NOTE</h4>
                        <span className="text-[10px] text-gray-400 font-mono">Reference: REF-9921</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-base text-gray-900 font-bold font-mono">₹75,000.00</strong>
                        <p className="text-[10px] text-orange-500 font-semibold m-0">Refund Dispatch Card</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2 p-3 bg-gray-50 rounded-xl border text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trigger Incident:</span>
                        <span className="text-gray-700">Double billing detection</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Original Invoice Code:</span>
                        <span className="font-mono text-gray-700">INV-2026-011</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="px-5 py-3 border-t border-border flex justify-end flex-shrink-0"
              style={{ background: "var(--secondary)" }}
            >
              <button
                onClick={() => setPreviewFile(null)}
                className="rounded-lg px-4 py-1.5 hover:bg-accent border cursor-pointer font-semibold transition-colors"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 12 }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
