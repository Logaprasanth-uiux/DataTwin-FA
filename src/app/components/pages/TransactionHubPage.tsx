import { useState, useMemo, useEffect } from "react";
import { ReconciliationCanvas } from "./ReconciliationCanvas";
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
  ChevronLeft,
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
  CheckSquare,
  Upload,
  Download,
  Plus
} from "lucide-react";
import { CompanySwitch } from "../CompanySwitch";
import { UserProfile } from "../UserProfile";

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
  parentId?: string;    // Links invoices to a specific payment receipt
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
  },
  act_clear_bill2_remaining: {
    id: "act_clear_bill2_remaining",
    label: "Apply Receipt JPMNH261510930 to Invoice BILL2",
    description: "Apply the remaining credit balance of ₹50,000 from NEFT Receipt UTR: JPMNH261510930 to clear Invoice BILL2.",
    confidence: 99,
    plan: [
      "Allocate UTR JPMNH261510930 credit balance of ₹50,000.",
      "Clear outstanding balance of invoice BILL2 (reconcile remaining ₹50,000).",
      "Post allocation clearing record in ledger."
    ],
    expectedResult: "Invoice BILL2 fully cleared and marked Resolved."
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
      { id: "TXN-502", type: "Invoice / Bill", ref: "Ref: MI3130009788", docNum: "MI3130009788", amount: 578200.00, appliedAmount: 578200.00, remainingBalance: 0.00, status: "Resolved", postingDate: "15-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-503", type: "Invoice / Bill", ref: "Ref: MI3130009787", docNum: "MI3130009787", amount: 392350.00, appliedAmount: 392350.00, remainingBalance: 0.00, status: "Resolved", postingDate: "16-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-504", type: "Invoice / Bill", ref: "Ref: MI3130009801", docNum: "MI3130009801", amount: 18408.00, appliedAmount: 18408.00, remainingBalance: 0.00, status: "Resolved", postingDate: "17-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-505", type: "Invoice / Bill", ref: "Ref: MI3130009803", docNum: "MI3130009803", amount: 288805.00, appliedAmount: 288805.00, remainingBalance: 0.00, status: "Resolved", postingDate: "18-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-506", type: "Invoice / Bill", ref: "Ref: MI3130009800", docNum: "MI3130009800", amount: 813020.00, appliedAmount: 813020.00, remainingBalance: 0.00, status: "Resolved", postingDate: "19-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-507", type: "Invoice / Bill", ref: "Ref: MI3130010035", docNum: "MI3130010035", amount: 280987.50, appliedAmount: 280987.50, remainingBalance: 0.00, status: "Resolved", postingDate: "20-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-508", type: "Invoice / Bill", ref: "Ref: MI3130010200", docNum: "MI3130010200", amount: 675432.00, appliedAmount: 675432.00, remainingBalance: 0.00, status: "Resolved", postingDate: "21-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-509", type: "Invoice / Bill", ref: "Ref: MI3130009784", docNum: "MI3130009784", amount: 20650.00, appliedAmount: 20650.00, remainingBalance: 0.00, status: "Resolved", postingDate: "22-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-510", type: "Invoice / Bill", ref: "Ref: MI3130009799", docNum: "MI3130009799", amount: 75048.00, appliedAmount: 75048.00, remainingBalance: 0.00, status: "Resolved", postingDate: "23-Mar-2026", parentId: "TXN-501" },
      { id: "TXN-511", type: "Invoice / Bill", ref: "Ref: MI3130009802", docNum: "MI3130009802", amount: 12272.00, appliedAmount: 12272.00, remainingBalance: 0.00, status: "Resolved", postingDate: "24-Mar-2026", parentId: "TXN-501" }
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
      { id: "TXN-402", type: "Invoice / Bill", ref: "Ref: MI3130009788", docNum: "MI3130009788", amount: 578200.00, appliedAmount: 578200.00, remainingBalance: 0.00, status: "Resolved", postingDate: "15-03-2026", parentId: "TXN-401" },
      { id: "TXN-403", type: "Invoice / Bill", ref: "Ref: MI3130009787", docNum: "MI3130009787", amount: 392350.00, appliedAmount: 392350.00, remainingBalance: 0.00, status: "Resolved", postingDate: "16-03-2026", parentId: "TXN-401" },
      { id: "TXN-404", type: "Invoice / Bill", ref: "Ref: MI3130009801", docNum: "MI3130009801", amount: 18408.00, appliedAmount: 18408.00, remainingBalance: 0.00, status: "Resolved", postingDate: "17-03-2026", parentId: "TXN-401" },
      { id: "TXN-405", type: "Invoice / Bill", ref: "Ref: MI3130009803", docNum: "MI3130009803", amount: 288805.00, appliedAmount: 288805.00, remainingBalance: 0.00, status: "Resolved", postingDate: "18-03-2026", parentId: "TXN-401" },
      { id: "TXN-406", type: "Invoice / Bill", ref: "Ref: MI3130009800", docNum: "MI3130009800", amount: 813020.00, appliedAmount: 0.00, remainingBalance: 813020.00, status: "Outstanding", postingDate: "19-03-2026", parentId: "TXN-401" },
      { id: "TXN-407", type: "Invoice / Bill", ref: "Ref: MI3130010035", docNum: "MI3130010035", amount: 280987.50, appliedAmount: 280987.50, remainingBalance: 0.00, status: "Resolved", postingDate: "20-03-2026", parentId: "TXN-401" },
      { id: "TXN-408", type: "Invoice / Bill", ref: "Ref: MI3130010200", docNum: "MI3130010200", amount: 675432.00, appliedAmount: 675432.00, remainingBalance: 0.00, status: "Resolved", postingDate: "21-03-2026", parentId: "TXN-401" },
      { id: "TXN-409", type: "Invoice / Bill", ref: "Ref: MI3130009784", docNum: "MI3130009784", amount: 20650.00, appliedAmount: 20650.00, remainingBalance: 0.00, status: "Resolved", postingDate: "22-03-2026", parentId: "TXN-401" },
      { id: "TXN-410", type: "Invoice / Bill", ref: "Ref: MI3130009799", docNum: "MI3130009799", amount: 75048.00, appliedAmount: 75048.00, remainingBalance: 0.00, status: "Resolved", postingDate: "23-03-2026", parentId: "TXN-401" },
      { id: "TXN-411", type: "Invoice / Bill", ref: "Ref: MI3130009802", docNum: "MI3130009802", amount: 12272.00, appliedAmount: 12272.00, remainingBalance: 0.00, status: "Resolved", postingDate: "24-03-2026", parentId: "TXN-401" },
      { id: "TXN-412", type: "Refund Entry", ref: "Doc Ref: REF-9921", docNum: "REF-9921", amount: 75000, appliedAmount: 0, remainingBalance: 75000, status: "Pending Review", postingDate: "29-05-2026", parentId: "TXN-401" }
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
    subject: "Remittance Advice: Consolidated Payment Run (3 Receipts)",
    amount: 200000,
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
Consolidated Settled Amount: ₹2,00,000.00 (split across 3 payment runs)

Breakdown Details:
1. NEFT Receipt (UTR: JPMNH261510928) for ₹95,000 is partially allocated to Invoice BILL2 (Invoice Total: ₹150,000, leaving a remaining balance of ₹55,000).
2. Receipt Voucher (Ref: RCPT1) for ₹75,000 allocates ₹30,000 to Invoice BILL2 and ₹20,000 to Invoice BILL3 (unallocated balance of ₹25,000 remaining).
3. NEFT Receipt (UTR: JPMNH261510930) for ₹30,000 allocates ₹30,000 to Invoice BILL1 after applying Credit Note CN-002 (value ₹5,000) for returned goods.

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
    threadSummary: "Consolidated J.P. Morgan remittance for Acme Systems (₹200,000). Demonstrates receipt-centric allocation: Invoice BILL2 (₹150,000) is partially allocated by NEFT Receipt UTR: JPMNH261510928 (₹95,000) and Receipt RCPT1 (₹30,000), leaving a ₹25,000 open advance on RCPT1 to clear the remaining balance.",
    activityTimeline: [
      { id: "ACT-001", type: "Communication", title: "Email Received", details: "Remittance alert received from statements_and_alerts@jpmchase.com via secure channel.", actor: "System", timestamp: "May 31, 10:15 AM" },
      { id: "ACT-002", type: "AI Processing", title: "Attachment Parsed", details: "PDS_RD_30052026.pdf parsed successfully using OCR semantic extraction.", actor: "AI Agent", timestamp: "May 31, 10:16 AM" },
      { id: "ACT-003", type: "AI Processing", title: "Transaction Parsed", details: "Extracted UTR JPMNH261510928, UTR JPMNH261510930, and Receipt RCPT1.", actor: "AI Agent", timestamp: "May 31, 10:17 AM" },
      { id: "ACT-004", type: "AI Processing", title: "Exception Detected", details: "Credit Note CN-002 not found in system ledger. Minor difference of ₹15 logged.", actor: "System", timestamp: "May 31, 10:17 AM" },
      { id: "ACT-005", type: "AI Processing", title: "Suggested Actions Generated", details: "Reconciliation recommendations compiled based on matching confidence.", actor: "AI Agent", timestamp: "May 31, 10:18 AM" }
    ],
    transactions: [
      // NEFT Receipt (UTR: JPMNH261510928) - ₹95,000
      { id: "TXN-001", type: "NEFT Payment", ref: "UTR JPMNH261510928", docNum: "RCPT-MAIN-1", amount: 95000, appliedAmount: 95000, remainingBalance: 0, status: "Resolved", postingDate: "30-05-2026", valueDate: "31-05-2026", remitter: "Acme Systems India Pvt Ltd", beneficiary: "Finance Plus India Ltd" },
      { id: "TXN-002", type: "Invoice / Bill", ref: "Ref: INV-2026-008", docNum: "BILL2", amount: 150000, appliedAmount: 95000, remainingBalance: 55000, status: "Outstanding", postingDate: "20-05-2026", customerRef: "CUST-ACME-90", parentId: "TXN-001" },
      
      // Receipt Voucher (Doc Ref: RCPT1) - ₹75,000
      { id: "TXN-003", type: "Receipt Voucher", ref: "Doc Ref: RCPT1", docNum: "RCPT1", amount: 75000, appliedAmount: 50000, remainingBalance: 25000, status: "Available Credit", postingDate: "30-05-2026", parentId: "TXN-003" },
      { id: "TXN-004", type: "Invoice / Bill", ref: "Ref: INV-2026-008", docNum: "BILL2", amount: 150000, appliedAmount: 30000, remainingBalance: 25000, status: "Outstanding", postingDate: "20-05-2026", customerRef: "CUST-ACME-90", parentId: "TXN-003" },
      { id: "TXN-006", type: "Invoice / Bill", ref: "Ref: INV-2026-009", docNum: "BILL3", amount: 20000, appliedAmount: 20000, remainingBalance: 0, status: "Resolved", postingDate: "22-05-2026", parentId: "TXN-003" },
      
      // NEFT Receipt (UTR: JPMNH261510930) - ₹30,000
      { id: "PAY-103", type: "NEFT Payment", ref: "UTR JPMNH261510930", docNum: "RCPT-MAIN-2", amount: 30000, appliedAmount: 30000, remainingBalance: 0, status: "Resolved", postingDate: "30-05-2026", valueDate: "31-05-2026", remitter: "Acme Systems India Pvt Ltd", beneficiary: "Finance Plus India Ltd" },
      { id: "INV-103", type: "Invoice / Bill", ref: "Ref: INV-2026-004", docNum: "BILL1", amount: 35000, appliedAmount: 30000, remainingBalance: 5000, status: "Outstanding", postingDate: "10-05-2026", parentId: "PAY-103" },
      { id: "TXN-005", type: "Credit Note", ref: "CN Ref: CN-002", docNum: "CN-002", amount: 5000, appliedAmount: 0, remainingBalance: 5000, status: "Available Credit", postingDate: "25-05-2026", parentId: "PAY-103" }
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
        relatedTxnIds: ["TXN-005", "INV-103"]
      },
      {
        id: "EXP-002",
        type: "Minor Diff",
        refNum: "BILL1",
        amount: 15,
        priority: "Low",
        status: "Unresolved",
        confidence: 99,
        explanation: "Bank transaction record shows ₹29,985 settled against BILL1 instead of the ₹30,000 remittance claim, leaving ₹15 difference.",
        suggestedActions: ["act_post_crco_bill1"],
        relatedTxnIds: ["INV-103", "PAY-103"]
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
    subject: "Consolidated Wire Notification: 4 Receipts",
    amount: 137000,
    processingStatus: "Unresolved Exceptions",
    aiConfidence: 92,
    exceptionCount: 1,
    date: "Jun 24, 2026, 02:40 PM",
    recipients: "PaymentAdviceIndia@financeplusindia.com",
    body: `Hi Team,

We have consolidated our accounts and wired 4 separate payments totaling ₹1,37,000 to clear our outstanding invoice groups:
1. ₹50,000 (UTR HDFCN9812A) for Bill-2026-012.
2. ₹25,000 (UTR HDFCN9812B) for Bill-2026-013.
3. ₹12,000 (UTR HDFCN9812C) for Bill-2026-014.
4. ₹50,000 (Ref#9812) for Bill-2026-015.

Please confirm receipt and adjust our account.

Thanks,
TechSupply Receivables Team`,
    attachments: [
      { name: "wire_receipt_9812.png", size: "380 KB", type: "image/png" }
    ],
    longEmailThread: [],
    threadSummary: "Consolidated wire notification for TechSupply Co (Consolidated ₹137,000). Automated matching identified 4 source payment receipts, mapping them to BILL-202, BILL-203, BILL-204, and BILL-205 respectively. Outstanding exception: Ref#9812 not cleared in bank ledger feed.",
    activityTimeline: [
      { id: "ACT-101", type: "Communication", title: "Email Received", details: "Wire slip received from ar@techsupply.com.", actor: "System", timestamp: "Jun 24, 02:40 PM" },
      { id: "ACT-102", type: "AI Processing", title: "Attachment Parsed", details: "Parsed payment receipt Ref#9812 details via image OCR.", actor: "AI Agent", timestamp: "Jun 24, 02:42 PM" },
      { id: "ACT-103", type: "AI Processing", title: "Transaction Parsed", details: "Matched billing account references for Bill-2026-012.", actor: "AI Agent", timestamp: "Jun 24, 02:43 PM" },
      { id: "ACT-104", type: "AI Processing", title: "Exception Detected", details: "Ref#9812 has not cleared bank ledger feeds yet.", actor: "System", timestamp: "Jun 24, 02:43 PM" }
    ],
    transactions: [
      { id: "PAY-201", type: "NEFT Payment", ref: "UTR HDFCN9812A", docNum: "RCPT-201", amount: 50000, appliedAmount: 50000, remainingBalance: 0, status: "Resolved", postingDate: "24-06-2026", remitter: "TechSupply Co" },
      { id: "INV-201", type: "Invoice / Bill", ref: "Ref: Bill-2026-012", docNum: "BILL-202", amount: 50000, appliedAmount: 50000, remainingBalance: 0, status: "Resolved", postingDate: "25-05-2026", customerRef: "CUST-TECH-01", parentId: "PAY-201" },
      
      { id: "PAY-202", type: "NEFT Payment", ref: "UTR HDFCN9812B", docNum: "RCPT-202", amount: 25000, appliedAmount: 25000, remainingBalance: 0, status: "Resolved", postingDate: "24-06-2026", remitter: "TechSupply Co" },
      { id: "INV-202", type: "Invoice / Bill", ref: "Ref: Bill-2026-013", docNum: "BILL-203", amount: 25000, appliedAmount: 25000, remainingBalance: 0, status: "Resolved", postingDate: "25-05-2026", customerRef: "CUST-TECH-01", parentId: "PAY-202" },
      
      { id: "PAY-203", type: "NEFT Payment", ref: "UTR HDFCN9812C", docNum: "RCPT-203", amount: 12000, appliedAmount: 12000, remainingBalance: 0, status: "Resolved", postingDate: "24-06-2026", remitter: "TechSupply Co" },
      { id: "INV-203", type: "Invoice / Bill", ref: "Ref: Bill-2026-014", docNum: "BILL-204", amount: 12000, appliedAmount: 12000, remainingBalance: 0, status: "Resolved", postingDate: "25-05-2026", customerRef: "CUST-TECH-01", parentId: "PAY-203" },
      
      { id: "PAY-204", type: "Receipt Voucher", ref: "UTR/Ref: Ref#9812", docNum: "RCPT-204", amount: 50000, appliedAmount: 0, remainingBalance: 50000, status: "Available Credit", postingDate: "24-06-2026", remitter: "TechSupply Co" },
      { id: "INV-204", type: "Invoice / Bill", ref: "Ref: Bill-2026-015", docNum: "BILL-205", amount: 50000, appliedAmount: 0, remainingBalance: 50000, status: "Outstanding", postingDate: "25-05-2026", customerRef: "CUST-TECH-01", parentId: "PAY-204" }
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
        relatedTxnIds: ["PAY-204"]
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
      { id: "TXN-301", type: "Invoice / Bill", ref: "Ref: INV-2026-011", docNum: "BILL-301", amount: 75000, appliedAmount: 75000, remainingBalance: 0, status: "Resolved", postingDate: "15-05-2026", parentId: "TXN-302" },
      { id: "TXN-302", type: "Receipt Voucher", ref: "Ref: RCPT-8871", docNum: "RCPT-302", amount: 150000, appliedAmount: 75000, remainingBalance: 75000, status: "Available Credit", postingDate: "10-06-2026" },
      { id: "TXN-303", type: "Refund Entry", ref: "Doc Ref: REF-9921", docNum: "REF-9921", amount: 75000, appliedAmount: 0, remainingBalance: 75000, status: "Pending Review", postingDate: "22-06-2026", parentId: "TXN-302" }
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

// Extra generated emails helper
const generateExtraEmails = (): EmailQueueItem[] => {
  const list: EmailQueueItem[] = [];
  const subjects = [
    "Wire Settlement Advice - Munich Region",
    "Customer Remittance: June Inbound Cleared",
    "Payment Confirmation for Invoice MI-980",
    "Dispute resolved: Credit note applied",
    "Consolidated Payment Receipt from WPP Group",
    "Chase Auto-credit notification",
    "TechSupply Account Balance Statement",
    "RTGS Transfer confirmation: €12,500",
    "Remittance receipt: INV-2026-092",
    "Client Payment Slip: Acme Systems",
    "Lockbox Inbound Transaction log",
    "Payment matching alert: Invoice mismatch",
    "Accounts Receivables Reconciliation report"
  ];
  const senders = [
    "ar-finance@munich.de",
    "receivables@wppmedia.com",
    "billing-support@jpmchase.com",
    "disputes@techsupply.com",
    "cash-operations@wpp.com",
    "alerts@chaseonline.com",
    "treasury@techsupply.com",
    "banking@euroclearing.eu",
    "billing@clientcorp.com",
    "acme-payables@acme.com",
    "lockbox-ops@chase.com",
    "alerts@datatwin.ai",
    "receivables-monitor@financeplus.com"
  ];

  for (let i = 0; i < 13; i++) {
    const id = `TXN-EMAIL-EXT-${String(i + 1).padStart(3, '0')}`;
    list.push({
      id,
      sender: senders[i % senders.length],
      subject: subjects[i % subjects.length],
      amount: 45000 + (i * 12500),
      processingStatus: i % 3 === 0 ? "Resolved" : i % 3 === 1 ? "Requires Review" : "Exceptions Detected",
      aiConfidence: 90 + (i % 10),
      exceptionCount: i % 3 === 2 ? 1 : 0,
      date: `May ${28 - i}, 2026, 09:00 AM`,
      recipients: "PaymentAdviceIndia@financeplusindia.com",
      body: `Dear Cash Ops,\n\nReconciliation statement for payment reference ${id} has been processed.\nTotal cleared amount: ₹${(45000 + (i * 12500)).toLocaleString()}.\nValue date: 2026-05-${28-i}.\n\nBest regards,\nOperations Desk`,
      attachments: [{ name: `advice_run_${id.toLowerCase()}.pdf`, size: "45 KB", type: "application/pdf" }],
      longEmailThread: [],
      threadSummary: `Reconciliation sheet for ${subjects[i % subjects.length]}`,
      activityTimeline: [
        { id: `ACT-EXT-${i}-1`, type: "Communication", title: "Email Received", actor: "System", timestamp: "1 day ago" }
      ],
      transactions: [
        { id: `TXN-EXT-${i}-PAY`, type: "NEFT Payment", ref: `UTR-EXT-${i}`, docNum: `RCPT-EXT-${i}`, amount: 45000 + (i * 12500), appliedAmount: i % 3 === 0 ? 45000 + (i * 12500) : 0, remainingBalance: i % 3 === 0 ? 0 : 45000 + (i * 12500), status: i % 3 === 0 ? "Resolved" : "Pending Review", postingDate: "15-06-2026" },
        { id: `TXN-EXT-${i}-INV`, type: "Invoice / Bill", ref: `Ref: INV-EXT-${i}`, docNum: `BILL-EXT-${i}`, amount: 45000 + (i * 12500), appliedAmount: i % 3 === 0 ? 45000 + (i * 12500) : 0, remainingBalance: i % 3 === 0 ? 0 : 45000 + (i * 12500), status: i % 3 === 0 ? "Resolved" : "Outstanding", postingDate: "10-06-2026", parentId: i % 3 === 0 ? `TXN-EXT-${i}-PAY` : undefined }
      ],
      outstandingItems: i % 3 === 2 ? [
        {
          id: `EXP-EXT-${i}-1`,
          type: "Invoice not found",
          refNum: `BILL-EXT-${i}`,
          amount: 45000 + (i * 12500),
          priority: "Medium",
          status: "Unresolved",
          confidence: 92,
          explanation: "System subledger is missing matching invoice record for the payment received.",
          suggestedActions: ["act_raise_inv_rcpt1"],
          relatedTxnIds: [`TXN-EXT-${i}-PAY`]
        }
      ] : []
    });
  }
  return list;
};

// 7 Manual Upload items definition
const MANUAL_UPLOAD_MOCKS: EmailQueueItem[] = [
  {
    id: "MAN-AR-001",
    sender: "system_upload@datatwin.ai",
    subject: "Manual Upload: Bank Statement (June Statement)",
    amount: 450000,
    processingStatus: "Exceptions Detected",
    aiConfidence: 95,
    exceptionCount: 1,
    date: "Jun 28, 2026, 10:15 AM",
    recipients: "Manual Ingestion Portal",
    body: "Source Type: Bank Statement\nReference Name: June Statement\nUploaded file processed by AI reconciliation engine.",
    attachments: [{ name: "June_Bank_Statement.pdf", size: "124 KB", type: "application/pdf" }],
    longEmailThread: [],
    threadSummary: "Manual upload of Bank Statement for period Jun 01, 2026 to Jun 25, 2026.",
    activityTimeline: [
      { id: "ACT-MAN-001-1", type: "User Action", title: "Document Manually Uploaded", details: "File June_Bank_Statement.pdf uploaded by Loga.", actor: "Loga", timestamp: "Jun 28, 10:15 AM" },
      { id: "ACT-MAN-001-2", type: "AI Processing", title: "AI Parsing Completed", details: "Extracted statement values and identified discrepancies.", actor: "AI Agent", timestamp: "Jun 28, 10:16 AM" }
    ],
    transactions: [
      { id: "TXN-MAN-001-PAY", type: "NEFT Payment", ref: "UTR CHASNBS60628001", docNum: "RCPT-M001", amount: 450000, appliedAmount: 0, remainingBalance: 450000, status: "Pending Review", postingDate: "28-06-2026", remitter: "Acme Systems India Pvt Ltd" },
      { id: "TXN-MAN-001-INV1", type: "Invoice / Bill", ref: "Ref: INV-2026-901", docNum: "BILL-M001", amount: 400000, appliedAmount: 0, remainingBalance: 400000, status: "Outstanding", postingDate: "15-06-2026" },
      { id: "TXN-MAN-001-INV2", type: "Invoice / Bill", ref: "Ref: INV-2026-902", docNum: "BILL-M002", amount: 50000, appliedAmount: 0, remainingBalance: 50000, status: "Outstanding", postingDate: "16-06-2026" }
    ],
    outstandingItems: [
      {
        id: "EXP-MAN-001-1",
        type: "Execute Clearing",
        refNum: "BILL-M001",
        amount: 450000,
        priority: "High",
        status: "Unresolved",
        confidence: 95,
        explanation: "Statement matches two open invoice balances but requires manual allocation clearance.",
        suggestedActions: ["act_clear_bill1"],
        relatedTxnIds: ["TXN-MAN-001-PAY", "TXN-MAN-001-INV1", "TXN-MAN-001-INV2"]
      }
    ]
  },
  {
    id: "MAN-AR-002",
    sender: "system_upload@datatwin.ai",
    subject: "Manual Upload: Collections Report (Q2 Collections)",
    amount: 125000,
    processingStatus: "Requires Review",
    aiConfidence: 92,
    exceptionCount: 0,
    date: "Jun 29, 2026, 09:30 AM",
    recipients: "Manual Ingestion Portal",
    body: "Source Type: Collections Report\nReference Name: Q2 Collections\nUploaded file processed by AI reconciliation engine.",
    attachments: [{ name: "Collections_Report_Q2.xlsx", size: "85 KB", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }],
    longEmailThread: [],
    threadSummary: "Manual upload of Collections Report for period Apr 01, 2026 to Jun 30, 2026.",
    activityTimeline: [
      { id: "ACT-MAN-002-1", type: "User Action", title: "Document Manually Uploaded", details: "File Collections_Report_Q2.xlsx uploaded by Loga.", actor: "Loga", timestamp: "Jun 29, 09:30 AM" }
    ],
    transactions: [
      { id: "TXN-MAN-002-PAY", type: "NEFT Payment", ref: "UTR CHASNBS60629002", docNum: "RCPT-M002", amount: 125000, appliedAmount: 0, remainingBalance: 125000, status: "Pending Review", postingDate: "29-06-2026" },
      { id: "TXN-MAN-002-INV", type: "Invoice / Bill", ref: "Ref: INV-2026-903", docNum: "BILL-M003", amount: 125000, appliedAmount: 0, remainingBalance: 125000, status: "Outstanding", postingDate: "20-06-2026" }
    ],
    outstandingItems: []
  },
  {
    id: "MAN-AR-003",
    sender: "system_upload@datatwin.ai",
    subject: "Manual Upload: Payment Gateway (Stripe Payout)",
    amount: 80000,
    processingStatus: "Requires Review",
    aiConfidence: 94,
    exceptionCount: 0,
    date: "Jun 26, 2026, 04:15 PM",
    recipients: "Manual Ingestion Portal",
    body: "Source Type: Payment Gateway\nReference Name: Stripe Payout\nUploaded file processed by AI reconciliation engine.",
    attachments: [{ name: "Stripe_Payout_May.csv", size: "42 KB", type: "text/csv" }],
    longEmailThread: [],
    threadSummary: "Manual upload of Stripe Payout for period May 01, 2026 to May 31, 2026.",
    activityTimeline: [
      { id: "ACT-MAN-003-1", type: "User Action", title: "Document Manually Uploaded", details: "File Stripe_Payout_May.csv uploaded by Loga.", actor: "Loga", timestamp: "Jun 26, 04:15 PM" }
    ],
    transactions: [
      { id: "TXN-MAN-003-PAY", type: "NEFT Payment", ref: "UTR CHASNBS60626003", docNum: "RCPT-M003", amount: 80000, appliedAmount: 0, remainingBalance: 80000, status: "Pending Review", postingDate: "26-06-2026" },
      { id: "TXN-MAN-003-INV", type: "Invoice / Bill", ref: "Ref: INV-2026-904", docNum: "BILL-M004", amount: 80000, appliedAmount: 0, remainingBalance: 80000, status: "Outstanding", postingDate: "22-06-2026" }
    ],
    outstandingItems: []
  },
  {
    id: "MAN-AR-004",
    sender: "system_upload@datatwin.ai",
    subject: "Manual Upload: Sales Report (Mid-June Sales)",
    amount: 300000,
    processingStatus: "Resolved",
    aiConfidence: 96,
    exceptionCount: 0,
    date: "Jun 25, 2026, 01:20 PM",
    recipients: "Manual Ingestion Portal",
    body: "Source Type: Sales Report\nReference Name: Mid-June Sales\nUploaded file processed by AI reconciliation engine.",
    attachments: [{ name: "Sales_Ledger_Extract.xlsx", size: "150 KB", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }],
    longEmailThread: [],
    threadSummary: "Manual upload of Sales Report for period Jun 10, 2026 to Jun 20, 2026.",
    activityTimeline: [
      { id: "ACT-MAN-004-1", type: "User Action", title: "Document Manually Uploaded", details: "File Sales_Ledger_Extract.xlsx uploaded by Loga.", actor: "Loga", timestamp: "Jun 25, 01:20 PM" },
      { id: "ACT-MAN-004-2", type: "AI Processing", title: "Reconciliation Succeeded", details: "Records matches and auto-cleared.", actor: "AI Agent", timestamp: "Jun 25, 01:21 PM" }
    ],
    transactions: [
      { id: "TXN-MAN-004-PAY", type: "NEFT Payment", ref: "UTR CHASNBS60625004", docNum: "RCPT-M004", amount: 300000, appliedAmount: 300000, remainingBalance: 0, status: "Resolved", postingDate: "25-06-2026" },
      { id: "TXN-MAN-004-INV", type: "Invoice / Bill", ref: "Ref: INV-2026-905", docNum: "BILL-M005", amount: 300000, appliedAmount: 300000, remainingBalance: 0, status: "Resolved", postingDate: "18-06-2026", parentId: "TXN-MAN-004-PAY" }
    ],
    outstandingItems: []
  },
  {
    id: "MAN-AR-005",
    sender: "system_upload@datatwin.ai",
    subject: "Manual Upload: CRM Services & Revenue Operations (Salesforce closed won)",
    amount: 500000,
    processingStatus: "Requires Review",
    aiConfidence: 91,
    exceptionCount: 0,
    date: "Jun 30, 2026, 05:00 PM",
    recipients: "Manual Ingestion Portal",
    body: "Source Type: CRM Services & Revenue Operations\nReference Name: Salesforce closed won\nUploaded file processed by AI reconciliation engine.",
    attachments: [{ name: "CRM_Revenue_Inbound.xlsx", size: "95 KB", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }],
    longEmailThread: [],
    threadSummary: "Manual upload of CRM Services for period Jun 01, 2026 to Jun 30, 2026.",
    activityTimeline: [
      { id: "ACT-MAN-005-1", type: "User Action", title: "Document Manually Uploaded", details: "File CRM_Revenue_Inbound.xlsx uploaded by Loga.", actor: "Loga", timestamp: "Jun 30, 05:00 PM" }
    ],
    transactions: [
      { id: "TXN-MAN-005-PAY", type: "NEFT Payment", ref: "UTR CHASNBS60630005", docNum: "RCPT-M005", amount: 500000, appliedAmount: 0, remainingBalance: 500000, status: "Pending Review", postingDate: "30-06-2026" },
      { id: "TXN-MAN-005-INV", type: "Invoice / Bill", ref: "Ref: INV-2026-906", docNum: "BILL-M006", amount: 500000, appliedAmount: 0, remainingBalance: 500000, status: "Outstanding", postingDate: "25-06-2026" }
    ],
    outstandingItems: []
  },
  {
    id: "MAN-AR-006",
    sender: "system_upload@datatwin.ai",
    subject: "Manual Upload: Cash Deposit (Safe Deposit)",
    amount: 650000,
    processingStatus: "Processed",
    aiConfidence: 97,
    exceptionCount: 0,
    date: "Jun 29, 2026, 03:00 PM",
    recipients: "Manual Ingestion Portal",
    body: "Source Type: Cash Deposit\nReference Name: Safe Deposit\nUploaded file processed by AI reconciliation engine.",
    attachments: [{ name: "Cash_Deposit_Summary_June.pdf", size: "50 KB", type: "application/pdf" }],
    longEmailThread: [],
    threadSummary: "Manual upload of Cash Deposit for period Jun 01, 2026 to Jun 28, 2026.",
    activityTimeline: [
      { id: "ACT-MAN-006-1", type: "User Action", title: "Document Manually Uploaded", details: "File Cash_Deposit_Summary_June.pdf uploaded by Loga.", actor: "Loga", timestamp: "Jun 29, 03:00 PM" },
      { id: "ACT-MAN-006-2", type: "System Event", title: "Record Posting Succeeded", details: "Cash deposit matches and posted to bank ledger.", actor: "System", timestamp: "Jun 29, 03:01 PM" }
    ],
    transactions: [
      { id: "TXN-MAN-006-PAY", type: "Receipt Voucher", ref: "DEP CHASNBS60629006", docNum: "RCPT-M006", amount: 650000, appliedAmount: 650000, remainingBalance: 0, status: "Resolved", postingDate: "29-06-2026" },
      { id: "TXN-MAN-006-INV", type: "Invoice / Bill", ref: "Ref: INV-2026-907", docNum: "BILL-M007", amount: 650000, appliedAmount: 650000, remainingBalance: 0, status: "Resolved", postingDate: "24-06-2026", parentId: "TXN-MAN-006-PAY" }
    ],
    outstandingItems: []
  },
  {
    id: "MAN-AR-007",
    sender: "system_upload@datatwin.ai",
    subject: "Manual Upload: Online Transactions (Netbanking Log)",
    amount: 220000,
    processingStatus: "Requires Review",
    aiConfidence: 93,
    exceptionCount: 0,
    date: "Jun 29, 2026, 04:30 PM",
    recipients: "Manual Ingestion Portal",
    body: "Source Type: Online Transactions\nReference Name: Netbanking Log\nUploaded file processed by AI reconciliation engine.",
    attachments: [{ name: "Netbanking_Log_Q2.txt", size: "30 KB", type: "text/plain" }],
    longEmailThread: [],
    threadSummary: "Manual upload of Online Transactions for period Jun 15, 2026 to Jun 30, 2026.",
    activityTimeline: [
      { id: "ACT-MAN-007-1", type: "User Action", title: "Document Manually Uploaded", details: "File Netbanking_Log_Q2.txt uploaded by Loga.", actor: "Loga", timestamp: "Jun 29, 04:30 PM" }
    ],
    transactions: [
      { id: "TXN-MAN-007-PAY", type: "NEFT Payment", ref: "UTR CHASNBS60629007", docNum: "RCPT-M007", amount: 220000, appliedAmount: 0, remainingBalance: 220000, status: "Pending Review", postingDate: "29-06-2026" },
      { id: "TXN-MAN-007-INV", type: "Invoice / Bill", ref: "Ref: INV-2026-908", docNum: "BILL-M008", amount: 220000, appliedAmount: 0, remainingBalance: 220000, status: "Outstanding", postingDate: "27-06-2026" }
    ],
    outstandingItems: []
  }
];

// Set properties
(MANUAL_UPLOAD_MOCKS[0] as any).manualStatus = "Exception Found";
(MANUAL_UPLOAD_MOCKS[0] as any).manualSourceType = "Bank Statement";
(MANUAL_UPLOAD_MOCKS[0] as any).periodFrom = "2026-06-01";
(MANUAL_UPLOAD_MOCKS[0] as any).periodTo = "2026-06-25";

(MANUAL_UPLOAD_MOCKS[1] as any).manualStatus = "Processing";
(MANUAL_UPLOAD_MOCKS[1] as any).manualSourceType = "Collections Report";
(MANUAL_UPLOAD_MOCKS[1] as any).periodFrom = "2026-04-01";
(MANUAL_UPLOAD_MOCKS[1] as any).periodTo = "2026-06-30";

(MANUAL_UPLOAD_MOCKS[2] as any).manualStatus = "AI Parsing";
(MANUAL_UPLOAD_MOCKS[2] as any).manualSourceType = "Payment Gateway";
(MANUAL_UPLOAD_MOCKS[2] as any).periodFrom = "2026-05-01";
(MANUAL_UPLOAD_MOCKS[2] as any).periodTo = "2026-05-31";

(MANUAL_UPLOAD_MOCKS[3] as any).manualStatus = "Matched";
(MANUAL_UPLOAD_MOCKS[3] as any).manualSourceType = "Sales Report";
(MANUAL_UPLOAD_MOCKS[3] as any).periodFrom = "2026-06-10";
(MANUAL_UPLOAD_MOCKS[3] as any).periodTo = "2026-06-20";

(MANUAL_UPLOAD_MOCKS[4] as any).manualStatus = "Needs Review";
(MANUAL_UPLOAD_MOCKS[4] as any).manualSourceType = "CRM Services & Revenue Operations";
(MANUAL_UPLOAD_MOCKS[4] as any).periodFrom = "2026-06-01";
(MANUAL_UPLOAD_MOCKS[4] as any).periodTo = "2026-06-30";

(MANUAL_UPLOAD_MOCKS[5] as any).manualStatus = "Completed";
(MANUAL_UPLOAD_MOCKS[5] as any).manualSourceType = "Cash Deposit";
(MANUAL_UPLOAD_MOCKS[5] as any).periodFrom = "2026-06-01";
(MANUAL_UPLOAD_MOCKS[5] as any).periodTo = "2026-06-28";

(MANUAL_UPLOAD_MOCKS[6] as any).manualStatus = "Uploaded";
(MANUAL_UPLOAD_MOCKS[6] as any).manualSourceType = "Online Transactions";
(MANUAL_UPLOAD_MOCKS[6] as any).periodFrom = "2026-06-15";
(MANUAL_UPLOAD_MOCKS[6] as any).periodTo = "2026-06-30";

function parseNarration(narration: string) {
  let remitter = "--";
  let beneficiary = "--";
  let txnRef = "--";
  let bankRef = "--";
  let bankDesc = "--";

  if (narration) {
    let clean = narration;
    if (narration.startsWith("NEFT Cr-")) {
      clean = narration.substring("NEFT Cr-".length);
    } else if (narration.startsWith("RTGS Cr-")) {
      clean = narration.substring("RTGS Cr-".length);
    }
    const parts = clean.split("--");
    if (parts.length >= 3) {
      beneficiary = parts[1].trim();
      bankDesc = parts[2].trim();
      
      const subparts = parts[0].split("-");
      if (subparts.length >= 3) {
        txnRef = subparts[0].trim();
        bankRef = subparts[1].trim();
        remitter = subparts.slice(2).join("-").trim();
      }
    }
  }
  return {
    remitter: remitter || "--",
    beneficiary: beneficiary || "--",
    txnRef: txnRef || "--",
    bankRef: bankRef || "--",
    bankDesc: bankDesc || "--"
  };
}

export function TransactionHubPage() {
  const [queue, setQueue] = useState<EmailQueueItem[]>(() => {
    return [...INITIAL_QUEUE_DATA, ...generateExtraEmails(), ...MANUAL_UPLOAD_MOCKS];
  });
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  
  // New States for Canvas architecture
  const [expandedReceipts, setExpandedReceipts] = useState<Record<string, boolean>>({});
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<"receipt" | "invoice" | null>(null);
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal" | "stack">("vertical");
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  
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
  const [expandedCardThreads, setExpandedCardThreads] = useState<Record<string, boolean>>({});
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);

  // Manual Upload States
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadSourceType, setUploadSourceType] = useState<string>("Bank Statement");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPeriodFrom, setUploadPeriodFrom] = useState<string>("");
  const [uploadPeriodTo, setUploadPeriodTo] = useState<string>("");
  const [uploadRefName, setUploadRefName] = useState<string>("");
  const [uploadDescription, setUploadDescription] = useState<string>("");
  const [queueTab, setQueueTab] = useState<"email" | "manual">("email");
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadAttachment = (item: EmailQueueItem) => {
    const file = item.attachments && item.attachments[0];
    if (!file) return;

    const fileContent = `DataTwin AI Reconciliation Engine - Exported Document
===========================================================
Source Reference:   ${item.id}
Uploaded File:      ${file.name}
File Size:          ${file.size}
Source Type:        ${(item as any).manualSourceType || "Bank Statement"}
For Period:         ${(item as any).periodFrom || "--"} to ${(item as any).periodTo || "--"}
Ingestion Mode:     Manual Upload Ingestion
AI Parsing Status:  ${(item as any).manualStatus || "Completed"}
===========================================================
Processed successfully.
`;

    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddManualUpload = () => {
    if (!uploadSourceType || !uploadFile) {
      alert("Please select a source type and upload a file.");
      return;
    }

    const nextIdx = queue.filter((i) => i.id.startsWith("MAN-")).length + 1;
    const newId = `MAN-AR-${String(nextIdx).padStart(3, "0")}`;
    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    }) + ", " + new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const newUploadItem: EmailQueueItem = {
      id: newId,
      sender: "system_upload@datatwin.ai",
      subject: `Manual Upload: ${uploadSourceType} (${uploadRefName || "No Ref"})`,
      amount: 150000,
      processingStatus: "Requires Review",
      aiConfidence: 95,
      exceptionCount: 1,
      date: formattedDate,
      recipients: "Manual Ingestion Portal",
      body: `Source Type: ${uploadSourceType}\nReference Name: ${uploadRefName || "N/A"}\nDescription: ${uploadDescription || "N/A"}`,
      attachments: [
        { name: uploadFile.name, size: "124 KB", type: "application/pdf" }
      ],
      longEmailThread: [],
      threadSummary: `Manual ingestion of ${uploadSourceType} for period ${uploadPeriodFrom || "--"} to ${uploadPeriodTo || "--"}.`,
      activityTimeline: [
        { id: `ACT-${Date.now()}-1`, type: "User Action", title: "Document Manually Uploaded", details: `File ${uploadFile.name} uploaded successfully.`, actor: "Loga", timestamp: "Just now" },
        { id: `ACT-${Date.now()}-2`, type: "AI Processing", title: "AI Parsing Completed", details: "Ingested structure metadata extracted.", actor: "AI Agent", timestamp: "Just now" }
      ],
      transactions: [
        { id: `TXN-${newId}-1`, type: "Receipt Voucher", ref: `REF-${uploadRefName || "MANUAL"}`, docNum: "RCPT-M1", amount: 150000, appliedAmount: 0, remainingBalance: 150000, status: "Available Credit", postingDate: new Date().toLocaleDateString("en-GB") },
        { id: `TXN-${newId}-2`, type: "Invoice / Bill", ref: "Ref: INV-2026-901", docNum: "BILL-M1", amount: 150000, appliedAmount: 0, remainingBalance: 150000, status: "Outstanding", postingDate: new Date().toLocaleDateString("en-GB") }
      ],
      outstandingItems: [
        {
          id: `EXP-${newId}-1`,
          type: "Manual Entries",
          refNum: "BILL-M1",
          amount: 150000,
          priority: "Medium",
          status: "Unresolved",
          confidence: 95,
          explanation: `Manually uploaded statement contains an open payment of ₹150,000 mapping to invoice BILL-M1.`,
          suggestedActions: ["act_clear_bill1"],
          relatedTxnIds: [`TXN-${newId}-1`, `TXN-${newId}-2`]
        }
      ]
    };

    // Store custom manual properties on the object
    (newUploadItem as any).manualStatus = "Uploaded";
    (newUploadItem as any).manualSourceType = uploadSourceType;
    (newUploadItem as any).periodFrom = uploadPeriodFrom || "2026-06-01";
    (newUploadItem as any).periodTo = uploadPeriodTo || "2026-06-30";
    (newUploadItem as any).attachmentName = uploadFile.name;

    setQueue(prev => [newUploadItem, ...prev]);
    setShowUploadModal(false);
    
    // Reset form
    setUploadFile(null);
    setUploadPeriodFrom("");
    setUploadPeriodTo("");
    setUploadRefName("");
    setUploadDescription("");
  };

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
    if (!selectedEmailId) return null;
    return queue.find((e) => e.id === selectedEmailId) || null;
  }, [queue, selectedEmailId]);

  // Extract all payment receipt cards for the active email
  const payments = useMemo(() => {
    if (!activeEmail) return [];
    return activeEmail.transactions.filter(
      (t) => t.type === "NEFT Payment" || t.type === "Receipt Voucher"
    );
  }, [activeEmail]);

  // Handle auto-expanding all receipts by default on canvas load, but do NOT auto-select
  useEffect(() => {
    if (payments.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      payments.forEach((p) => {
        initialExpanded[p.id] = true;
      });
      setExpandedReceipts(initialExpanded);
    }
    
    // Always reset selection states on canvas load or payments change
    setSelectedReceiptId(null);
    setSelectedEntityId(null);
    setSelectedEntityType(null);
    setSelectedTxnIds([]);
  }, [payments]);

  // Handle email click
  const handleEmailSelect = (id: string) => {
    setSelectedEmailId(id);
    setSelectedTxnIds([]);
    setActiveExceptionId(null);
    setActivePlanAction(null);
    setThreadSearchQuery("");
    setSelectedEntityId(null);
    setSelectedEntityType(null);
  };

  // Simulate Posting an individual Invoice to ERP
  const handlePostInvoiceToERP = (invId: string) => {
    setQueue((prevQueue) => {
      return prevQueue.map((email) => {
        if (email.id !== selectedEmailId) return email;

        const now = new Date();
        const nowStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        
        const updatedTxns = email.transactions.map((t) => {
          if (t.id === invId) {
            return {
              ...t,
              status: "Resolved" as const,
              remainingBalance: 0,
              appliedAmount: t.amount
            };
          }
          return t;
        });

        const target = email.transactions.find((t) => t.id === invId);
        const docNum = target ? target.docNum : invId;

        const updatedTimeline = [...email.activityTimeline];
        updatedTimeline.push({
          id: `TL-ERP-${Date.now()}`,
          type: "User Action",
          title: "ERP Posting Succeeded",
          details: `Invoice ${docNum} successfully posted and cleared in ERP ledger.`,
          actor: "Alex Johnson",
          timestamp: `Today, ${nowStr}`
        });

        // Resolve any outstanding exception linked to this invoice
        const updatedExceptions = email.outstandingItems.map((ex) => {
          if (ex.relatedTxnIds.includes(invId)) {
            return { ...ex, status: "Resolved" as const };
          }
          return ex;
        });

        return {
          ...email,
          transactions: updatedTxns,
          outstandingItems: updatedExceptions,
          activityTimeline: updatedTimeline,
          exceptionCount: updatedExceptions.filter((e) => e.status !== "Resolved").length,
          processingStatus: updatedExceptions.filter((e) => e.status !== "Resolved").length === 0 ? "Resolved" as const : email.processingStatus
        };
      });
    });
  };

  // Simulate Posting an individual Receipt to ERP
  const handlePostReceiptToERP = (rcptId: string) => {
    setQueue((prevQueue) => {
      return prevQueue.map((email) => {
        if (email.id !== selectedEmailId) return email;

        const now = new Date();
        const nowStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const updatedTxns = email.transactions.map((t) => {
          if (t.id === rcptId) {
            return {
              ...t,
              status: "Resolved" as const
            };
          }
          return t;
        });

        const target = email.transactions.find((t) => t.id === rcptId);
        const ref = target ? target.ref : rcptId;

        const updatedTimeline = [...email.activityTimeline];
        updatedTimeline.push({
          id: `TL-ERP-RCPT-${Date.now()}`,
          type: "User Action",
          title: "ERP Receipt Posting Succeeded",
          details: `Receipt reference ${ref} successfully posted to ERP ledger.`,
          actor: "Alex Johnson",
          timestamp: `Today, ${nowStr}`
        });

        return {
          ...email,
          transactions: updatedTxns,
          activityTimeline: updatedTimeline
        };
      });
    });
  };

  // Simulate Posting all eligible invoices under selected receipt
  const handlePostAllEligible = (rcptId: string) => {
    setQueue((prevQueue) => {
      return prevQueue.map((email) => {
        if (email.id !== selectedEmailId) return email;

        const now = new Date();
        const nowStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        
        const eligibleInvoices = email.transactions.filter(
          (t) => t.parentId === rcptId && (t.type === "Invoice / Bill" || t.type === "Debit Note") && t.status !== "Resolved"
        );

        if (eligibleInvoices.length === 0) return email;

        const updatedTxns = email.transactions.map((t) => {
          if (t.parentId === rcptId && (t.type === "Invoice / Bill" || t.type === "Debit Note")) {
            return {
              ...t,
              status: "Resolved" as const,
              remainingBalance: 0
            };
          }
          if (t.id === rcptId) {
            return {
              ...t,
              status: "Resolved" as const,
              remainingBalance: 0
            };
          }
          return t;
        });

        const updatedTimeline = [...email.activityTimeline];
        updatedTimeline.push({
          id: `TL-ERP-ALL-${Date.now()}`,
          type: "User Action",
          title: "Bulk ERP Clearing Posted",
          details: `Posted clearing matching documents for all ${eligibleInvoices.length} eligible invoices under Receipt ${rcptId}.`,
          actor: "Alex Johnson",
          timestamp: `Today, ${nowStr}`
        });

        const invIds = eligibleInvoices.map((i) => i.id);
        const updatedExceptions = email.outstandingItems.map((ex) => {
          if (ex.relatedTxnIds.includes(rcptId) || ex.relatedTxnIds.some((id) => invIds.includes(id))) {
            return { ...ex, status: "Resolved" as const };
          }
          return ex;
        });

        return {
          ...email,
          transactions: updatedTxns,
          outstandingItems: updatedExceptions,
          activityTimeline: updatedTimeline,
          exceptionCount: updatedExceptions.filter((e) => e.status !== "Resolved").length,
          processingStatus: updatedExceptions.filter((e) => e.status !== "Resolved").length === 0 ? "Resolved" as const : email.processingStatus
        };
      });
    });
  };

  // Filtered and Sorted Email List (Work Queue)
  const filteredQueue = useMemo(() => {
    return queue
      .filter((item) => {
        const isManual = item.id.startsWith("MAN-");
        if (queueTab === "email" && isManual) return false;
        if (queueTab === "manual" && !isManual) return false;

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
  }, [queue, searchQuery, statusFilter, sortBy, sortOrder, queueTab]);

  // Handle transaction card selection click (sets single active entity and highlights)
  const handleTxnCardClick = (id: string, type: "receipt" | "invoice") => {
    setActiveExceptionId(null); // Clear exception highlight on direct card click
    setSelectedEntityId(id);
    setSelectedEntityType(type);
    setSelectedTxnIds([id]);
    if (type === "receipt") {
      setSelectedReceiptId(id);
    } else if (type === "invoice") {
      if (activeEmail) {
        const selectedInvoice = activeEmail.transactions.find((t) => t.id === id);
        if (selectedInvoice && selectedInvoice.parentId) {
          setSelectedReceiptId(selectedInvoice.parentId);
        }
      }
    }
  };

  // Toggle expand/collapse state for receipts on canvas
  const toggleReceiptExpand = (receiptId: string) => {
    setExpandedReceipts((prev) => ({
      ...prev,
      [receiptId]: !prev[receiptId]
    }));
  };

  // Handle Outstanding item selection click
  const handleExceptionClick = (exception: OutstandingItem) => {
    if (activeExceptionId === exception.id) {
      setActiveExceptionId(null);
      setSelectedTxnIds([]);
      if (selectedReceiptId) {
        setSelectedEntityId(selectedReceiptId);
        setSelectedEntityType("receipt");
        setSelectedTxnIds([selectedReceiptId]);
      }
    } else {
      setActiveExceptionId(exception.id);
      setSelectedTxnIds(exception.relatedTxnIds); // Highlight associated cards
      
      // Try to select the first related invoice or receipt
      const relatedInv = activeEmail.transactions.find(
        (t) => exception.relatedTxnIds.includes(t.id) && (t.type === "Invoice / Bill" || t.type === "Debit Note" || t.type === "Credit Note" || t.type === "Refund Entry")
      );
      if (relatedInv) {
        setSelectedEntityId(relatedInv.id);
        setSelectedEntityType("invoice");
      } else {
        const relatedRcpt = activeEmail.transactions.find(
          (t) => exception.relatedTxnIds.includes(t.id) && (t.type === "NEFT Payment" || t.type === "Receipt Voucher")
        );
        if (relatedRcpt) {
          setSelectedEntityId(relatedRcpt.id);
          setSelectedEntityType("receipt");
          setSelectedReceiptId(relatedRcpt.id);
        }
      }
    }
  };

  // Determine dynamic suggested actions based on selected transaction cards & active exceptions
  const dynamicSuggestedActions = useMemo(() => {
    if (!activeEmail) return [];
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
        if (selectedEmailId === "TXN-EMAIL-001" && card.docNum === "BILL2") {
          return [DYNAMIC_ACTIONS_CATALOG.act_connect_receipt_bill2];
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
    if (!activeEmail) return { text: "", confidence: 0 };
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
            if (t.parentId === "TXN-003" && t.docNum === "BILL2") {
              return { ...t, appliedAmount: 55000, remainingBalance: 0, status: "Resolved" as const };
            }
            if (t.id === "TXN-003") {
              return { ...t, appliedAmount: 75000, remainingBalance: 0, status: "Resolved" as const };
            }
            if (t.docNum === "MI3130010200") {
              return { ...t, appliedAmount: 675432, remainingBalance: 0, status: "Resolved" as const };
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

  const paymentGroups = useMemo(() => {
    if (!activeEmail) return [];
    return payments.map((payment) => {
      const relatedInvoices = activeEmail.transactions.filter(
        (t) => t.parentId === payment.id && (t.type === "Invoice / Bill" || t.type === "Debit Note")
      );
      const relatedAdjustments = activeEmail.transactions.filter(
        (t) => t.parentId === payment.id && (t.type === "Credit Note" || t.type === "Refund Entry")
      );
      return {
        payment,
        invoices: relatedInvoices,
        adjustments: relatedAdjustments
      };
    });
  }, [payments, activeEmail]);

  const activeGroup = useMemo(() => {
    if (paymentGroups.length === 0) return null;
    return paymentGroups.find((g) => g.payment.id === selectedReceiptId) || paymentGroups[0] || null;
  }, [paymentGroups, selectedReceiptId]);

  const unlinkedCards = useMemo(() => {
    if (!activeEmail) return [];
    return activeEmail.transactions.filter(
      (t) =>
        t.type !== "NEFT Payment" &&
        t.type !== "Receipt Voucher" &&
        !t.parentId
    );
  }, [activeEmail]);

  const isAnyInvoiceSelected = useMemo(() => {
    if (!activeEmail) return false;
    return selectedTxnIds.some((id) => {
      const card = activeEmail.transactions.find((t) => t.id === id);
      return card && (card.type === "Invoice / Bill" || card.type === "Debit Note");
    });
  }, [selectedTxnIds, activeEmail]);

  // Session Summary Memos for Column 3 overview dashboard
  const totalCredit = useMemo(() => {
    return payments.reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const matchedAmount = useMemo(() => {
    return paymentGroups.reduce((acc, g) => {
      const invTotal = g.invoices.reduce((sum, inv) => sum + inv.appliedAmount, 0);
      const adjTotal = g.adjustments.reduce((sum, adj) => sum + adj.appliedAmount, 0);
      return acc + invTotal + adjTotal;
    }, 0);
  }, [paymentGroups]);

  const pendingAllocation = useMemo(() => {
    return Math.max(0, totalCredit - matchedAmount);
  }, [totalCredit, matchedAmount]);

  const clarificationCount = useMemo(() => {
    if (!activeEmail) return 0;
    return activeEmail.outstandingItems.filter(e => e.status !== "Resolved").length;
  }, [activeEmail]);

  const totalReceiptsCount = useMemo(() => {
    return payments.length;
  }, [payments]);

  const totalLinkedInvoicesCount = useMemo(() => {
    if (!activeEmail) return 0;
    return activeEmail.transactions.filter((t) => t.type === "Invoice / Bill" || t.type === "Debit Note").length;
  }, [activeEmail]);

  const totalExceptionsCount = useMemo(() => {
    if (!activeEmail) return 0;
    return activeEmail.outstandingItems.length;
  }, [activeEmail]);

  const overallProgressPercent = useMemo(() => {
    if (totalCredit === 0) return 0;
    return Math.min(100, Math.round((matchedAmount / totalCredit) * 100));
  }, [matchedAmount, totalCredit]);


  // Helper to render a receipt card
  const renderReceiptCard = (payment: TransactionCard, group: { payment: TransactionCard; invoices: TransactionCard[]; adjustments: TransactionCard[] }, layoutMode: "vertical" | "horizontal" = "vertical") => {
    const isSelected = selectedEntityId === payment.id;
    const { invoices, adjustments } = group;
    const progressPercent = Math.min(100, Math.round((
      (invoices.reduce((acc, c) => acc + c.appliedAmount, 0) + adjustments.reduce((acc, c) => acc + c.appliedAmount, 0)) / 
      (payment.amount || 1)
    ) * 100));
    const statusLabel = progressPercent === 100 ? "Fully Allocated" : `${progressPercent}% Mapped`;

    let receiptLabel = "Payment Receipt";
    if (payment.type === "NEFT Payment") {
      receiptLabel = "NEFT Receipt";
    } else if (payment.type === "Receipt Voucher") {
      if (payment.ref.toLowerCase().includes("wire") || payment.ref.toLowerCase().includes("hdfc") || payment.ref.toLowerCase().includes("9812")) {
        receiptLabel = "Wire Transfer";
      } else {
        receiptLabel = "Receipt Voucher";
      }
    } else if (payment.type === "Refund Entry") {
      receiptLabel = "Refund Receipt";
    } else if (payment.type === "Credit Note") {
      receiptLabel = "Credit Receipt";
    }

    return (
      <div className="flex flex-col text-left w-full">
        {/* Receipt Header & Expand/Collapse Toggle */}
        <div className="flex items-center justify-between w-full mb-3 border-b border-border/40 pb-2.5">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {receiptLabel}
            </span>
            <span className="text-[11px] font-mono text-foreground font-semibold truncate max-w-[180px] mt-0.5">
              {payment.ref}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                background: progressPercent === 100 ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
                color: progressPercent === 100 ? "#22c55e" : "#f59e0b"
              }}
            >
              {statusLabel}
            </span>
            <button
              onClick={() => toggleReceiptExpand(payment.id)}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer border border-border flex items-center justify-center bg-card interactive-card"
              style={{ width: 24, height: 24 }}
              title={expandedReceipts[payment.id] ? "Collapse receipt flow" : "Expand receipt flow"}
            >
              {layoutMode === "vertical" ? (
                expandedReceipts[payment.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />
              ) : (
                expandedReceipts[payment.id] ? <ChevronLeft size={13} /> : <ChevronRight size={13} />
              )}
            </button>
          </div>
        </div>

        {/* Source Payment Receipt Card */}
        <div
          onClick={() => handleTxnCardClick(payment.id, "receipt")}
          className="rounded-xl p-4 flex flex-col justify-between text-left transition-all hover:scale-[1.01] border select-none w-full min-h-[150px] interactive-card"
          style={{
            background: isSelected ? "var(--secondary)" : "var(--card)",
            borderColor: isSelected ? "rgba(107,140,255,0.8)" : "var(--border)",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
          }}
        >
          <div className="flex items-center justify-between w-full">
            <span style={{ fontSize: 9.5, fontWeight: 750, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {payment.type}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[8.5px] font-bold"
              style={{
                background: payment.status === "Resolved" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
                color: payment.status === "Resolved" ? "#22c55e" : "#f59e0b"
              }}
            >
              {payment.status}
            </span>
          </div>

          <div className="my-1">
            <span className="text-[9px] text-muted-foreground block font-medium">Receipt Amount</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
              ₹{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-[10px] text-muted-foreground border-t border-border/40 pt-2 w-full">
            <div className="flex justify-between items-center w-full">
              <span>Context ID</span>
              <span className="text-foreground font-mono font-semibold">{payment.docNum}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span>Transaction Date</span>
              <span className="text-foreground">{payment.postingDate}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span>SAP Document Number</span>
              <span className="text-foreground font-mono">{payment.sapDocNum || "10008746"}</span>
            </div>
            {(() => {
              const descVal = payment.description || `NEFT Cr-CHASH00017679291-CHASOINBX01-${payment.remitter || "WPP MEDIA INDIA PRIVATE LIMITED"}--${payment.beneficiary || "TV TODAY NETWORK LTD"}--RE-${payment.ref.replace("UTR ", "")}`;
              const parsed = parseNarration(descVal);
              return (
                <>
                  <div className="flex justify-between items-center w-full">
                    <span>Payer / Remitter</span>
                    <span className="text-foreground font-semibold truncate max-w-[150px]" title={parsed.remitter}>{parsed.remitter}</span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <span>Beneficiary</span>
                    <span className="text-foreground font-semibold truncate max-w-[150px]" title={parsed.beneficiary}>{parsed.beneficiary}</span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <span>Transaction Reference</span>
                    <span className="text-foreground font-mono truncate max-w-[150px]" title={parsed.txnRef}>{parsed.txnRef}</span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <span>Bank Reference / Channel</span>
                    <span className="text-foreground font-mono truncate max-w-[150px]" title={parsed.bankRef}>{parsed.bankRef}</span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <span>Bank Description</span>
                    <span className="text-foreground truncate max-w-[150px]" title={parsed.bankDesc}>{parsed.bankDesc}</span>
                  </div>
                </>
              );
            })()}
            <div className="flex justify-between items-center w-full">
              <span>Branch Code</span>
              <span className="text-foreground font-mono">{payment.branchCode || "CHASOINBX01"}</span>
            </div>
            <div className="flex justify-between items-center w-full border-t border-border/20 pt-1 mt-1">
              <span className="font-semibold text-foreground">Credit Amount</span>
              <span className="text-foreground font-semibold font-mono">₹{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {payment.status !== "Resolved" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePostReceiptToERP(payment.id);
              }}
              className="mt-3 w-full py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer border-none shadow-sm hover:shadow"
            >
              <span>Post to ERP</span>
              <ArrowRight size={10} />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Helper to render an invoice card
  const renderInvoiceCard = (txn: TransactionCard) => {
    const isInvSelected = selectedEntityId === txn.id;
    
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

    if (isInvSelected) {
      cardBorderColor = "rgba(107,140,255,0.8)";
    }

    return (
      <div
        key={txn.id}
        onClick={() => handleTxnCardClick(txn.id, "invoice")}
        className="rounded-xl p-3.5 flex flex-col justify-between text-left transition-all hover:scale-[1.01] border select-none w-full min-h-[180px] interactive-card bg-card"
        style={{
          borderColor: cardBorderColor,
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
          background: isInvSelected ? "var(--secondary)" : "var(--card)"
        }}
      >
        <div className="flex items-center justify-between w-full">
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Invoice
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[8px] font-bold"
            style={{ background: statusBg, color: statusColor }}
          >
            {txn.status}
          </span>
        </div>

        <div className="my-1">
          <span className="text-[9px] text-muted-foreground block font-medium">Invoice Total</span>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
            ₹{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex flex-col gap-1 text-[9.5px] text-muted-foreground border-t border-border/40 pt-2.5 w-full">
          <div className="flex justify-between items-center w-full">
            <span>SAP Doc Number</span>
            <strong className="text-foreground font-mono">{txn.sapDocNum || `2000${txn.id.replace("TXN-", "4928")}`}</strong>
          </div>
          <div className="flex justify-between items-center w-full">
            <span>Bill Reference</span>
            <strong className="text-foreground font-mono">{txn.docNum}</strong>
          </div>
          <div className="flex justify-between items-center w-full">
            <span>Bill Date</span>
            <span className="text-foreground">{txn.postingDate}</span>
          </div>
          <div className="flex justify-between items-center w-full">
            <span>Bill Amount</span>
            <span className="text-foreground font-semibold font-mono">₹{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center w-full">
            <span>TDS</span>
            <span className="text-foreground font-mono">₹{(txn.tds || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center w-full">
            <span>Advance Adjustment</span>
            <span className="text-foreground font-mono">₹{(txn.advanceAdjustment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center w-full">
            <span>Paid Amount</span>
            <span className="text-foreground font-mono">₹{(txn.status === "Resolved" ? txn.appliedAmount : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          
          <div className="border-t border-border/20 my-1 pt-1">
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold">Allocation</span>
              <span className="font-mono text-foreground font-semibold">
                ₹{txn.appliedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold">Remaining Amount</span>
              <span
                className="font-mono font-semibold"
                style={{
                  color: txn.remainingBalance > 0 ? "#ef4444" : "var(--muted-foreground)"
                }}
              >
                ₹{txn.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {txn.status !== "Resolved" && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePostInvoiceToERP(txn.id);
            }}
            className="mt-2.5 w-full py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-semibold text-[10px] border border-indigo-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer interactive-card"
          >
            <span>Post to ERP</span>
            <ArrowRight size={10} />
          </div>
        )}
      </div>
    );
  };

  // Helper to render an adjustment card
  const renderAdjustmentCard = (txn: TransactionCard) => {
    const isAdjSelected = selectedEntityId === txn.id;
    let borderCol = "var(--border)";
    if (isAdjSelected) borderCol = "rgba(107,140,255,0.8)";

    return (
      <div
        key={txn.id}
        onClick={() => handleTxnCardClick(txn.id, "invoice")}
        className="rounded-xl p-3.5 flex flex-col justify-between text-left transition-all hover:scale-[1.01] border select-none min-h-[140px] interactive-card bg-card"
        style={{
          borderColor: borderCol,
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
          background: isAdjSelected ? "var(--secondary)" : "var(--card)"
        }}
      >
        <div className="flex items-center justify-between w-full">
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {txn.type}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[8px] font-bold"
            style={{
              background: txn.status === "Resolved" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
              color: txn.status === "Resolved" ? "#22c55e" : "#f59e0b"
            }}
          >
            {txn.status}
          </span>
        </div>

        <div className="my-1">
          <span className="text-[9px] text-muted-foreground block font-medium">Value</span>
          <span style={{ fontSize: 13.5, fontStyle: "normal", fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
            ₹{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex flex-col gap-1 text-[9.5px] text-muted-foreground border-t border-border/40 pt-2 w-full">
          <div className="flex justify-between items-center w-full">
            <span>Ref</span>
            <strong className="font-mono text-foreground truncate max-w-[120px]">{txn.docNum}</strong>
          </div>
          <div className="flex justify-between items-center w-full">
            <span>Remaining Balance</span>
            <span className="font-mono text-foreground font-semibold">
              ₹{txn.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render allocation summary
  const renderAllocationSummary = (payment: TransactionCard, invoices: TransactionCard[], adjustments: TransactionCard[]) => {
    const totalApplied = invoices.reduce((acc, c) => acc + c.appliedAmount, 0) + adjustments.reduce((acc, c) => acc + c.appliedAmount, 0);
    const progressPercent = Math.min(100, Math.round((totalApplied / (payment.amount || 1)) * 100));

    return (
      <div className="w-full bg-card border border-border/40 rounded-xl p-3.5 flex flex-col gap-2 mt-4 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-emerald-500" />
            Allocation Status
          </span>
          <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
            {progressPercent}%
          </span>
        </div>

        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9.5px] mt-0.5">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[8px]">Receipt Value</span>
            <strong className="font-mono text-foreground">₹{payment.amount.toLocaleString()}</strong>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground text-[8px]">Allocated</span>
            <strong className="font-mono text-emerald-500">₹{totalApplied.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* 1. Page Header (styled consistently with ListPage, customized for Accounts Receivable) */}
      <div
        className="flex items-center justify-between px-8"
        style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0, background: "var(--card)" }}
      >
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
            Accounts Receivable
          </h1>
          <span style={{ color: "var(--border)", fontSize: 18 }}>/</span>
          <CompanySwitch />
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: "var(--foreground)",
              color: "var(--background)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Upload size={13} />
            Upload Manually
          </button>
          <UserProfile size="md" />
        </div>
      </div>

      <main
        className="flex-1 flex flex-row h-full overflow-hidden w-full"
        style={{ background: "var(--background)", fontFamily: "var(--font-family)" }}
      >
        {/* ─── COLUMN 1: WORK QUEUE (EMAIL LIST / MANUAL UPLOADS) ─── */}
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
                {queue.filter((e) => {
                  const isManual = e.id.startsWith("MAN-");
                  const matchesTab = queueTab === "email" ? !isManual : isManual;
                  return matchesTab && e.processingStatus !== "Resolved" && e.processingStatus !== "Processed";
                }).length} Pending
              </span>
            </div>

            {/* Remediation Queue Tabs */}
            <div 
              className="flex items-center p-0.5 rounded-lg border"
              style={{ background: "var(--secondary)", borderColor: "var(--border)" }}
            >
              <button
                onClick={() => setQueueTab("email")}
                className="flex-1 py-1 rounded-md text-[11px] font-semibold border-none cursor-pointer transition-all"
                style={{
                  background: queueTab === "email" ? "var(--card)" : "transparent",
                  color: queueTab === "email" ? "var(--foreground)" : "var(--muted-foreground)",
                  boxShadow: queueTab === "email" ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Email Inbox ({queue.filter(i => !i.id.startsWith("MAN-")).length})
              </button>
              <button
                onClick={() => setQueueTab("manual")}
                className="flex-1 py-1 rounded-md text-[11px] font-semibold border-none cursor-pointer transition-all"
                style={{
                  background: queueTab === "manual" ? "var(--card)" : "transparent",
                  color: queueTab === "manual" ? "var(--foreground)" : "var(--muted-foreground)",
                  boxShadow: queueTab === "manual" ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Manual Uploads ({queue.filter(i => i.id.startsWith("MAN-")).length})
              </button>
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
                placeholder="Search remediation records…"
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
            {queueTab === "email" ? (
              filteredQueue.length === 0 ? (
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
                  const sourcePaymentsCount = item.transactions.filter(t => t.type === "NEFT Payment" || t.type === "Receipt Voucher").length;
                  const linkedInvoicesCount = item.transactions.filter(t => t.type === "Invoice / Bill" || t.type === "Debit Note").length;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleEmailSelect(item.id)}
                      className={`flex flex-col gap-3 rounded-2xl p-4 text-left w-full transition-all duration-200 cursor-pointer relative ${
                        isSelected
                          ? "bg-[var(--accent)] border-[1.8px] border-indigo-500/40 shadow-[0_6px_16px_rgba(107,140,255,0.08)]"
                          : "bg-white border border-[var(--border)] shadow-none hover:border-[var(--muted-foreground)]/70"
                      }`}
                      style={{}}
                    >
                      {/* Status & Confidence Header */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="rounded-full px-2 py-0.5 font-bold text-[9px]"
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
                        
                        {/* Source Ingestion Badge */}
                        <span className="text-[8.5px] font-bold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded flex items-center gap-1 border border-border/30">
                          📧 Email
                        </span>
                      </div>

                      {/* Subject & Summary */}
                      <div className="flex flex-col gap-1">
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--foreground)",
                            lineHeight: 1.3
                          }}
                        >
                          {item.subject}
                        </span>
                        <p
                          className="m-0 text-muted-foreground"
                          style={{
                            fontSize: 10.5,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                        >
                          {item.threadSummary}
                        </p>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] border-t border-border/40 pt-2.5">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Amt:</span>
                          <strong style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                            ₹{item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </strong>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-muted-foreground">Payments:</span>
                          <strong style={{ color: "var(--foreground)" }}>{sourcePaymentsCount}</strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Invoices:</span>
                          <strong style={{ color: "var(--foreground)" }}>{linkedInvoicesCount}</strong>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-muted-foreground">Exceptions:</span>
                          <strong style={{ color: openExps.length > 0 ? "#ef4444" : "var(--foreground)" }}>
                            {openExps.length}
                          </strong>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2 mt-1.5 pt-2 border-t border-border/40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmailSelect(item.id);
                            setShowEmailModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1 hover:bg-secondary/60 hover:text-foreground border border-transparent transition-colors cursor-pointer text-[10px] font-medium text-muted-foreground bg-transparent"
                        >
                          <Mail size={11} />
                          <span>View Email</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCardThreads((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id]
                            }));
                          }}
                          className="flex items-center justify-center p-1 rounded hover:bg-secondary border cursor-pointer text-muted-foreground bg-card border-border"
                          title="Toggle Thread History"
                        >
                          <History size={11} />
                          <span className="text-[9px] ml-0.5 font-bold">({item.longEmailThread.length + 1})</span>
                        </button>
                      </div>

                      {/* Compact Collapsible Email Thread History */}
                      {expandedCardThreads[item.id] && (
                        <div
                          className="flex flex-col gap-1.5 mt-2 p-2 rounded-xl bg-secondary/30 border border-border/40 text-[9.5px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="font-bold text-[8.5px] text-muted-foreground tracking-wider uppercase border-b border-border/30 pb-0.5">
                            Email Thread History
                          </div>
                          
                          <div className="flex flex-col gap-0.5 pb-1 border-b border-border/20 last:border-none last:pb-0">
                            <div className="flex justify-between items-center text-[8.5px]">
                              <strong className="text-foreground">{item.sender.split("@")[0]}</strong>
                              <span className="text-muted-foreground">{item.date.split(",")[0]}</span>
                            </div>
                            <p className="m-0 text-muted-foreground truncate leading-normal">
                              {item.body}
                            </p>
                          </div>

                          {item.longEmailThread.map((thread, thIdx) => (
                            <div key={thIdx} className="flex flex-col gap-0.5 pb-1 border-b border-border/20 last:border-none last:pb-0">
                              <div className="flex justify-between items-center text-[8.5px]">
                                <strong className="text-foreground">{thread.sender.split("@")[0]}</strong>
                                <span className="text-muted-foreground">{thread.date.split(",")[0]}</span>
                              </div>
                              <p className="m-0 text-muted-foreground truncate leading-normal">
                                {thread.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : (
              // Reusing Remediation Queue Card component for Manual Upload Ingestion mode
              filteredQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
                  <FileText size={24} style={{ color: "var(--muted-foreground)" }} />
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No manual upload records found.</p>
                </div>
              ) : (
                filteredQueue.map((item) => {
                  const isSelected = selectedEmailId === item.id;
                  const manualStatus = (item as any).manualStatus || "Uploaded";
                  const manualSource = (item as any).manualSourceType || "Bank Statement";
                  const isResolved = manualStatus === "Completed" || manualStatus === "Matched" || manualStatus === "Processed";
                  const hasExceptions = manualStatus === "Exception Found";
                  const openExps = item.outstandingItems.filter(e => e.status !== "Resolved");
                  const sourcePaymentsCount = item.transactions.filter(t => t.type === "NEFT Payment" || t.type === "Receipt Voucher").length;
                  const linkedInvoicesCount = item.transactions.filter(t => t.type === "Invoice / Bill" || t.type === "Debit Note").length;

                  let badgeBg = "rgba(245,158,11,0.08)";
                  let badgeColor = "#f59e0b";

                  if (isResolved) {
                    badgeBg = "rgba(34,197,94,0.08)";
                    badgeColor = "#22c55e";
                  } else if (hasExceptions) {
                    badgeBg = "rgba(239,68,68,0.08)";
                    badgeColor = "#ef4444";
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleEmailSelect(item.id)}
                      className={`flex flex-col gap-3 rounded-2xl p-4 text-left w-full transition-all duration-200 cursor-pointer relative ${
                        isSelected
                          ? "bg-[var(--accent)] border-[1.8px] border-indigo-500/40 shadow-[0_6px_16px_rgba(107,140,255,0.08)]"
                          : "bg-white border border-[var(--border)] shadow-none hover:border-[var(--muted-foreground)]/70"
                      }`}
                      style={{}}
                    >
                      {/* Status & Confidence Header */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="rounded-full px-2 py-0.5 font-bold text-[9px]"
                          style={{
                            background: badgeBg,
                            color: badgeColor
                          }}
                        >
                          {manualStatus}
                        </span>
                        
                        {/* Source Ingestion Badge */}
                        <span className="text-[8.5px] font-bold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded flex items-center gap-1 border border-border/30">
                          ⬆ Manual Upload
                        </span>
                      </div>

                      {/* Source Title & Summary */}
                      <div className="flex flex-col gap-1">
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--foreground)",
                            lineHeight: 1.3
                          }}
                        >
                          {manualSource}
                        </span>
                        <p
                          className="m-0 text-muted-foreground"
                          style={{
                            fontSize: 10.5,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                        >
                          {item.threadSummary}
                        </p>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] border-t border-border/40 pt-2.5">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Amt:</span>
                          <strong style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                            ₹{item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </strong>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-muted-foreground">Payments:</span>
                          <strong style={{ color: "var(--foreground)" }}>{sourcePaymentsCount}</strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Invoices:</span>
                          <strong style={{ color: "var(--foreground)" }}>{linkedInvoicesCount}</strong>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-muted-foreground">Exceptions:</span>
                          <strong style={{ color: openExps.length > 0 ? "#ef4444" : "var(--foreground)" }}>
                            {openExps.length}
                          </strong>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2 mt-1.5 pt-2 border-t border-border/40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAttachment(item);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1 hover:bg-secondary/60 hover:text-foreground border border-transparent transition-colors cursor-pointer text-[10px] font-medium text-muted-foreground bg-transparent"
                        >
                          <Download size={11} />
                          <span>Download Attachment</span>
                        </button>

                        <div 
                          className="flex items-center justify-center p-1 rounded border text-muted-foreground bg-secondary/40 border-border"
                          style={{ fontSize: 9, fontWeight: 700 }}
                          title="Uploaded Attachments"
                        >
                          <Paperclip size={11} />
                          <span className="ml-0.5">({item.attachments ? item.attachments.length : 1})</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

      {/* ─── COLUMN 2: WORKSPACE PANEL (INTERACTIVE CANVAS) ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative" style={{ background: "var(--secondary)" }}>
        {!activeEmail ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none bg-card/20">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-sm mb-4">
              <Building size={28} className="opacity-60 text-indigo-500" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1.5">Select a Remediation Item</h3>
            <p className="text-xs text-muted-foreground max-w-[320px] leading-relaxed">
              Choose a payment reconciliation item from the Remediation Queue to begin reviewing receipts, invoice allocations, and ERP posting actions.
            </p>
          </div>
        ) : (
          <>
            {/* Workspace Top Toolbar */}
            <header
              className="flex items-center justify-between px-6 bg-card"
              style={{ height: 48, borderBottom: "1px solid var(--border)", flexShrink: 0 }}
            >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center">
              <Building size={13} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
              Payment Allocation Workspace
            </span>
            <span className="font-mono ml-1.5 opacity-60 text-muted-foreground tracking-wide" style={{ fontSize: "9.5px", fontWeight: 500 }}>
              QUEUE REF: {activeEmail.id}
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            <div 
              className="relative flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1"
              onMouseEnter={() => setShowHelpTooltip(true)}
              onMouseLeave={() => setShowHelpTooltip(false)}
              onClick={() => setShowHelpTooltip(prev => !prev)}
              title="Canvas Help"
            >
              <Info size={14} />
              
              {showHelpTooltip && (
                <div 
                  className="absolute right-0 top-6 rounded-lg p-3 flex flex-col gap-1.5 transition-all duration-200 z-[110] text-left"
                  style={{
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
                    width: "190px",
                    color: "#f8fafc",
                    fontSize: "10.5px"
                  }}
                >
                  <div className="font-bold border-b border-slate-700/50 pb-1.5 mb-1 text-slate-300 tracking-wide uppercase font-sans" style={{ fontSize: "9px" }}>
                    Canvas Shortcuts
                  </div>
                  <div className="flex items-center justify-between font-sans">
                    <span>Drag to Pan</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] border border-slate-700 font-mono">Drag</kbd>
                  </div>
                  <div className="flex items-center justify-between font-sans">
                    <span>Ctrl + Scroll to Zoom</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] border border-slate-700 font-mono">Ctrl + Scroll</kbd>
                  </div>
                  <div className="flex items-center justify-between font-sans">
                    <span>Double Click to Fit View</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] border border-slate-700 font-mono">DbClick</kbd>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Payment Allocation Interactive Canvas */}
        <ReconciliationCanvas
          key={activeEmail.id}
          topLeftControls={
            <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-medium text-foreground text-left">
              <span className="text-muted-foreground font-semibold">Flow View:</span>
              <div className="flex rounded-lg bg-secondary p-0.5 border border-border/40">
                <button
                  onClick={() => setViewMode("vertical")}
                  className={`px-3 py-1 rounded-md transition-all font-bold border cursor-pointer text-[10px] ${
                    viewMode === "vertical"
                      ? "bg-card text-indigo-600 border-indigo-500/20 shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-transparent border-transparent"
                  }`}
                >
                  Vertical
                </button>
                <button
                  onClick={() => setViewMode("horizontal")}
                  className={`px-3 py-1 rounded-md transition-all font-bold border cursor-pointer text-[10px] ${
                    viewMode === "horizontal"
                      ? "bg-card text-indigo-600 border-indigo-500/20 shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-transparent border-transparent"
                  }`}
                >
                  Horizontal
                </button>
                <button
                  onClick={() => {
                    setViewMode("stack");
                    setExpandedReceipts({});
                    setSelectedEntityId(null);
                    setSelectedEntityType(null);
                  }}
                  className={`px-3 py-1 rounded-md transition-all font-bold border cursor-pointer text-[10px] ${
                    viewMode === "stack"
                      ? "bg-card text-indigo-600 border-indigo-500/20 shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-transparent border-transparent"
                  }`}
                >
                  Stack
                </button>
              </div>
            </div>
          }
        >
          {viewMode === "vertical" ? (
            <div className="flex flex-row items-start gap-8 p-6 select-none" style={{ minWidth: "max-content", minHeight: "100%" }}>
              {/* Parallel Receipt Lanes */}
              {paymentGroups.map((group) => {
                const { payment, invoices, adjustments } = group;
                const isExpanded = !!expandedReceipts[payment.id];
                const isSelected = selectedEntityId === payment.id;
                
                return (
                  <div 
                    key={payment.id} 
                    className="flex flex-col items-center flex-shrink-0 w-[380px] bg-card/45 border border-border/65 rounded-2xl p-5 shadow-sm animate-in fade-in duration-200"
                    style={{
                      borderColor: isSelected ? "rgba(107,140,255,0.6)" : "var(--border)",
                      boxShadow: isSelected ? "0 4px 20px rgba(107,140,255,0.06)" : "none"
                    }}
                  >
                    {renderReceiptCard(payment, group)}

                    {isExpanded && (
                      <>
                        {/* Vertical Connector Line */}
                        <div className="w-px h-6 bg-border relative my-1">
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                        </div>

                        {/* Linked Invoices */}
                        <div className="w-full flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-left">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                              Linked Invoices ({invoices.length})
                            </span>
                          </div>
                          <div className="flex flex-col gap-3 w-full">
                            {invoices.map((txn) => renderInvoiceCard(txn))}
                          </div>
                        </div>

                        {/* Related Adjustments */}
                        {adjustments.length > 0 && (
                          <>
                            <div className="w-px h-6 bg-border relative my-1">
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                            </div>

                            <div className="w-full flex flex-col gap-2">
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider text-left w-full">
                                Adjustments / Credits ({adjustments.length})
                              </span>
                              <div className="flex flex-col gap-3.5 w-full">
                                {adjustments.map((txn) => renderAdjustmentCard(txn))}
                              </div>
                            </div>
                          </>
                        )}

                        {renderAllocationSummary(payment, invoices, adjustments)}

                        {/* Bulk ERP Posting Action */}
                        {invoices.some((inv) => inv.status !== "Resolved") && (
                          <div className="w-full mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePostAllEligible(payment.id);
                              }}
                              className="w-full rounded-xl py-2.5 font-semibold transition-all hover:scale-[1.01] cursor-pointer text-xs flex items-center justify-center gap-2 text-white border-none shadow-sm hover:shadow-md interactive-card"
                              style={{
                                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                              }}
                            >
                              <Sparkles size={11} />
                              <span>Post All Eligible to SAP ERP</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : viewMode === "horizontal" ? (
            /* Horizontal Flow View */
            <div className="flex flex-col items-start gap-8 p-6 select-none animate-in fade-in duration-200" style={{ minWidth: "max-content", minHeight: "100%" }}>
              {paymentGroups.map((group) => {
                const { payment, invoices, adjustments } = group;
                const isExpanded = !!expandedReceipts[payment.id];
                const isSelected = selectedEntityId === payment.id;

                return (
                  <div
                    key={payment.id}
                    className="flex flex-row items-center bg-card/30 border border-border/50 rounded-2xl p-5 shadow-sm transition-all"
                    style={{
                      borderColor: isSelected ? "rgba(107,140,255,0.6)" : "var(--border)",
                      boxShadow: isSelected ? "0 4px 20px rgba(107,140,255,0.06)" : "none"
                    }}
                  >
                    {/* Left Receipt Column */}
                    <div className="flex flex-col items-center flex-shrink-0 w-[380px]">
                      {renderReceiptCard(payment, group, "horizontal")}
                      
                      {isExpanded && (
                        <>
                          {renderAllocationSummary(payment, invoices, adjustments)}

                          {/* Bulk ERP Posting Action */}
                          {invoices.some((inv) => inv.status !== "Resolved") && (
                            <div className="w-full mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePostAllEligible(payment.id);
                                }}
                                className="w-full rounded-xl py-2.5 font-semibold transition-all hover:scale-[1.01] cursor-pointer text-xs flex items-center justify-center gap-2 text-white border-none shadow-sm hover:shadow-md interactive-card"
                                style={{
                                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                                }}
                              >
                                <Sparkles size={11} />
                                <span>Post All Eligible to SAP ERP</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Horizontal Connector and Invoices Container */}
                    {isExpanded && (
                      <div className="flex flex-row items-center">
                        {/* Horizontal Connector Line */}
                        <div className="flex items-center justify-center w-12 flex-shrink-0">
                          <div className="h-[1.5px] w-full bg-border relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-border" />
                          </div>
                        </div>

                        {/* Side-by-Side Invoices and Adjustments */}
                        <div className="flex flex-col gap-5 border-l border-border/40 pl-6 text-left">
                          {/* Invoices Title & Row */}
                          <div className="flex flex-col gap-2.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                              Linked Invoices ({invoices.length})
                            </span>
                            <div className="flex flex-row items-start gap-4">
                              {invoices.map((txn) => (
                                <div key={txn.id} className="w-[300px] flex-shrink-0">
                                  {renderInvoiceCard(txn)}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Adjustments Row */}
                          {adjustments.length > 0 && (
                            <div className="flex flex-col gap-2 mt-1">
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
                                Adjustments / Credits ({adjustments.length})
                              </span>
                              <div className="flex flex-row items-start gap-4">
                                {adjustments.map((txn) => (
                                  <div key={txn.id} className="w-[280px] flex-shrink-0">
                                    {renderAdjustmentCard(txn)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Stack Flow View */
            <div className="flex justify-center items-center p-6 w-full" style={{ minWidth: "100%", minHeight: "680px" }}>
              {(() => {
                const hasExpanded = Object.values(expandedReceipts).some(Boolean);
                const stackWidth = (paymentGroups.length - 1) * 80 + 280;
                const stackHeight = (paymentGroups.length - 1) * 50 + 80;
                
                // Center the stack if nothing is expanded, otherwise drift stack left to leave room for the expanded card on the right
                const stackBaseX = hasExpanded ? 10 : Math.max(10, (860 - stackWidth) / 2);
                const stackBaseY = hasExpanded ? 40 : Math.max(40, (620 - stackHeight) / 2);

                return (
                  <div className="relative" style={{ width: "860px", height: "620px" }}>
                    {/* Canvas Empty State Overlay */}
                    {!hasExpanded && (
                      <div 
                        className="absolute left-1/2 bottom-4 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed select-none bg-card text-muted-foreground shadow-sm animate-fadeIn"
                        style={{
                          borderColor: "var(--border)",
                          zIndex: 5
                        }}
                      >
                        <Info size={13} className="text-indigo-500" />
                        <span style={{ fontSize: "11px", fontWeight: 550 }} className="font-sans">
                          Click a receipt to expand and review allocation details.
                        </span>
                      </div>
                    )}
                    {paymentGroups.map((group, idx) => {
                      const { payment, invoices, adjustments } = group;
                      const isExpanded = !!expandedReceipts[payment.id];
                      const isSelected = selectedEntityId === payment.id;

                      // Receipt Type label helper
                      let receiptLabel = "Payment Receipt";
                      if (payment.type === "NEFT Payment") {
                        receiptLabel = "NEFT Receipt";
                      } else if (payment.type === "Receipt Voucher") {
                        if (payment.ref.toLowerCase().includes("wire") || payment.ref.toLowerCase().includes("hdfc") || payment.ref.toLowerCase().includes("9812")) {
                          receiptLabel = "Wire Transfer";
                        } else {
                          receiptLabel = "Receipt Voucher";
                        }
                      } else if (payment.type === "Refund Entry") {
                        receiptLabel = "Refund Receipt";
                      } else if (payment.type === "Credit Note") {
                        receiptLabel = "Credit Receipt";
                      }

                      // Dynamic offsets to show headers of cards underneath clearly
                      const xOffset = stackBaseX + idx * 80;
                      const yOffset = stackBaseY + idx * 50;

                      // Stack visuals
                      const scale = 0.93 + idx * 0.02; // progression from back to front
                      const elevationShadow = `0 ${1 + idx * 3}px ${3 + idx * 6}px rgba(0,0,0,${0.03 + idx * 0.02})`;

                      return (
                        <div
                          key={payment.id}
                          onClick={() => {
                            if (!isExpanded) {
                              setExpandedReceipts({ [payment.id]: true });
                              setSelectedEntityId(payment.id);
                              setSelectedEntityType("receipt");
                            }
                          }}
                          className="absolute bg-card border rounded-2xl shadow-sm transition-all select-none flex flex-col items-center animate-in fade-in duration-200"
                          style={{
                            width: isExpanded ? "380px" : "280px",
                            minHeight: isExpanded ? "180px" : "80px",
                            height: isExpanded ? "auto" : "80px",
                            left: isExpanded ? "450px" : `${xOffset}px`,
                            top: isExpanded ? "0px" : `${yOffset}px`,
                            zIndex: isExpanded ? 100 : idx + 10,
                            borderColor: isExpanded 
                              ? "rgba(107,140,255,0.6)" 
                              : isSelected 
                                ? "rgba(107,140,255,0.5)" 
                                : "var(--border)",
                            boxShadow: isExpanded 
                              ? "0 15px 35px rgba(0,0,0,0.15)" 
                              : isSelected
                                ? "0 4px 12px rgba(107,140,255,0.08)"
                                : elevationShadow,
                            padding: isExpanded ? "20px" : "14px",
                            cursor: isExpanded ? "default" : "pointer",
                            overflow: isExpanded ? "visible" : "hidden",
                            transform: isExpanded ? "scale(1)" : `scale(${scale})`,
                            transition: "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                          }}
                        >
                          {!isExpanded ? (
                            <div className="w-full flex flex-col justify-center h-full text-left">
                              <div className="font-bold text-xs text-foreground uppercase tracking-wider mb-1">
                                {receiptLabel}
                              </div>
                              <div className="text-[10.5px] text-muted-foreground font-mono truncate">
                                UTR: {payment.ref}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full animate-fadeIn flex flex-col items-center">
                              {renderReceiptCard(payment, group, "vertical")}

                              {/* Vertical Connector Line */}
                              <div className="w-px h-6 bg-border relative my-1">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                              </div>

                              {/* Linked Invoices */}
                              <div className="w-full flex flex-col gap-2.5">
                                <div className="flex items-center justify-between text-left">
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Linked Invoices ({invoices.length})
                                  </span>
                                </div>
                                <div className="flex flex-col gap-3 w-full">
                                  {invoices.map((txn) => renderInvoiceCard(txn))}
                                </div>
                              </div>

                              {/* Related Adjustments */}
                              {adjustments.length > 0 && (
                                <>
                                  <div className="w-px h-6 bg-border relative my-1">
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                                  </div>

                                  <div className="w-full flex flex-col gap-2">
                                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider text-left w-full">
                                      Adjustments / Credits ({adjustments.length})
                                    </span>
                                    <div className="flex flex-col gap-3.5 w-full">
                                      {adjustments.map((txn) => renderAdjustmentCard(txn))}
                                    </div>
                                  </div>
                                </>
                              )}

                              {renderAllocationSummary(payment, invoices, adjustments)}

                              {/* Bulk ERP Posting Action */}
                              {invoices.some((inv) => inv.status !== "Resolved") && (
                                <div className="w-full mt-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePostAllEligible(payment.id);
                                    }}
                                    className="w-full rounded-xl py-2.5 font-semibold transition-all hover:scale-[1.01] cursor-pointer text-xs flex items-center justify-center gap-2 text-white border-none shadow-sm hover:shadow-md interactive-card"
                                    style={{
                                      background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                                    }}
                                  >
                                    <Sparkles size={11} />
                                    <span>Post All Eligible to SAP ERP</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </ReconciliationCanvas>

        {/* AI EXECUTION PREVIEW (SLIDER FOOTER CARD) */}
        {activePlanAction && (
          <div
            className="absolute inset-x-4 bottom-4 p-5 rounded-2xl flex flex-col gap-3.5 border z-30 animate-in slide-in-from-bottom duration-200 bg-card"
            style={{
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

            <div className="flex flex-col gap-2 bg-secondary/60 p-3.5 rounded-xl text-xs border border-border">
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
      </>
    )}
  </div>

      {/* ─── COLUMN 3: THREAD ACTIVITY & SUMMARY DRAWER ─── */}
      {activeEmail && (
        <div
          className="flex flex-col h-full flex-shrink-0 font-sans"
          style={{
            width: 340,
            minWidth: 340,
            borderLeft: "1px solid var(--border)",
            background: "var(--card)"
          }}
        >
        {/* Header */}
        <div
          className="flex flex-col justify-center px-6 py-2 text-left"
          style={{ borderBottom: "1px solid var(--border)", height: 48, flexShrink: 0 }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 22, height: 22, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}
            >
              <Sparkles size={11} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
              AI Reconciliation Workspace
            </span>
          </div>
        </div>

        {/* Column 3 Body: Single scrollable panel */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 min-h-0 relative">
          
          {/* Top Contextual Details Section */}
          <div className="flex flex-col gap-4">
            {(() => {
              const selectedReceipt = activeEmail.transactions.find((t) => t.id === selectedEntityId);
              const selectedGroup = paymentGroups.find((g) => g.payment.id === selectedEntityId);

              if (selectedEntityType === "receipt" && selectedReceipt && selectedGroup) {
                const totalApplied = selectedGroup.invoices.reduce((acc, c) => acc + c.appliedAmount, 0) + selectedGroup.adjustments.reduce((acc, c) => acc + c.appliedAmount, 0);
                const balance = selectedReceipt.amount - totalApplied;
                const progressPercent = Math.min(100, Math.round((totalApplied / (selectedReceipt.amount || 1)) * 100));

                let receiptLabel = "Payment Receipt";
                if (selectedReceipt.type === "NEFT Payment") {
                  receiptLabel = "NEFT Receipt";
                } else if (selectedReceipt.type === "Receipt Voucher") {
                  if (selectedReceipt.ref.toLowerCase().includes("wire") || selectedReceipt.ref.toLowerCase().includes("hdfc") || selectedReceipt.ref.toLowerCase().includes("9812")) {
                    receiptLabel = "Wire Transfer";
                  } else {
                    receiptLabel = "Receipt Voucher";
                  }
                } else if (selectedReceipt.type === "Refund Entry") {
                  receiptLabel = "Refund Receipt";
                } else if (selectedReceipt.type === "Credit Note") {
                  receiptLabel = "Credit Receipt";
                }

                return (
                  <div className="flex flex-col gap-4 text-left animate-in fade-in duration-200">
                    {/* Entity Details Header */}
                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Selection</span>
                      <h3 className="m-0 text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Receipt size={14} className="text-indigo-500" />
                        {receiptLabel} Details
                      </h3>
                    </div>

                    {/* Receipt Summary Info Card */}
                    <div className="rounded-xl p-3.5 bg-secondary/40 border border-border flex flex-col gap-2.5 text-[11px] w-full bg-card">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Reference:</span>
                        <span className="font-mono font-semibold text-foreground truncate max-w-[170px]">{selectedReceipt.ref}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Receipt Value:</span>
                        <span className="font-mono font-semibold text-foreground">₹{selectedReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-semibold">Allocated Value:</span>
                        <span className="font-mono font-semibold text-emerald-500">₹{totalApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Unallocated Balance:</span>
                        <span className="font-mono font-semibold text-amber-500">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Posting Date:</span>
                        <span className="font-semibold text-foreground">{selectedReceipt.postingDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Reconciliation Status:</span>
                        <span
                          className="rounded px-1.5 py-0.2 text-[9px] font-bold"
                          style={{
                            background: progressPercent === 100 ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
                            color: progressPercent === 100 ? "#22c55e" : "#f59e0b"
                          }}
                        >
                          {progressPercent === 100 ? "Fully Reconciled" : `${progressPercent}% Mapped`}
                        </span>
                      </div>
                    </div>

                    {/* AI Matching Insight */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">AI Matching Insight</span>
                      <div className="rounded-xl p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/15 text-[11px] leading-relaxed text-foreground">
                        <p className="m-0">
                          {`The AI agent matched reference ${selectedReceipt.ref} with ${selectedGroup.invoices.length} billing items in local books. Suggested actions below represent optimal clearing sequences.`}
                        </p>
                      </div>
                    </div>

                    {/* Suggested Actions for Receipt */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Suggested Actions ({dynamicSuggestedActions.length})</span>
                      <div className="flex flex-col gap-2 w-full">
                        {dynamicSuggestedActions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => setActivePlanAction(action)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-accent transition-all text-left border border-border interactive-card cursor-pointer"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex items-center justify-center rounded-lg mt-0.5 flex-shrink-0" style={{ width: 20, height: 20, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}>
                                <Info size={11} />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2 }}>
                                  {action.label}
                                </span>
                                <p className="m-0 text-[10px] text-muted-foreground leading-normal">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <div className="p-1 rounded bg-foreground text-background">
                                <ArrowRight size={10} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (selectedEntityType === "invoice") {
                const selectedInvoice = activeEmail.transactions.find((t) => t.id === selectedEntityId);
                const parentReceipt = selectedInvoice ? activeEmail.transactions.find((t) => t.id === selectedInvoice.parentId) : null;
                const relatedExceptions = activeEmail.outstandingItems.filter((ex) => ex.relatedTxnIds.includes(selectedEntityId!));

                if (selectedInvoice) {
                  return (
                    <div className="flex flex-col gap-4 text-left animate-in fade-in duration-200">
                      {/* Entity Details Header */}
                      <div className="flex flex-col gap-1 border-b border-border pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Selection</span>
                        <h3 className="m-0 text-sm font-bold text-foreground flex items-center gap-1.5">
                          <FileText size={14} className="text-indigo-500" />
                          Invoice Details ({selectedInvoice.docNum})
                        </h3>
                      </div>

                      {/* Invoice Details Card */}
                      <div className="rounded-xl p-3.5 bg-secondary/40 border border-border flex flex-col gap-2.5 text-[11px] w-full bg-card">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Invoice Reference:</span>
                          <span className="font-semibold text-foreground font-mono">{selectedInvoice.docNum}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Original Invoice Total:</span>
                          <span className="font-mono font-semibold text-foreground">₹{selectedInvoice.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">Allocated Inward:</span>
                          <span className="font-mono font-semibold text-emerald-500">₹{selectedInvoice.appliedAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Remaining Balance:</span>
                          <span className="font-mono font-semibold text-red-500">₹{selectedInvoice.remainingBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Posting Date:</span>
                          <span className="font-semibold text-foreground">{selectedInvoice.postingDate}</span>
                        </div>
                        {parentReceipt && (
                          <div className="flex justify-between items-center border-t border-border/40 pt-2 mt-1">
                            <span className="text-muted-foreground">Parent Receipt:</span>
                            <span className="font-mono text-indigo-500 font-semibold truncate max-w-[150px]">{parentReceipt.ref}</span>
                          </div>
                        )}
                      </div>

                      {/* Related Exceptions Alert box */}
                      {relatedExceptions.map((ex) => (
                        <div key={ex.id} className="rounded-xl p-3 border border-red-500/20 bg-red-500/5 text-[10.5px] leading-relaxed text-foreground flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-red-500 font-bold uppercase text-[9px] tracking-wider">
                            <AlertTriangle size={11} />
                            <span>Exception Alert: {ex.type}</span>
                          </div>
                          <p className="m-0 text-muted-foreground leading-normal">{ex.explanation}</p>
                        </div>
                      ))}

                      {/* AI Matching Insight */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">AI Reconciliation Insight</span>
                        <div className="rounded-xl p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/15 text-[11px] leading-relaxed text-foreground">
                          <p className="m-0">
                            {dynamicAIInsight.text}
                          </p>
                        </div>
                      </div>

                      {/* Suggested Actions for Invoice */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Suggested Actions ({dynamicSuggestedActions.length})</span>
                        <div className="flex flex-col gap-2 w-full">
                          {dynamicSuggestedActions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => setActivePlanAction(action)}
                              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-accent transition-all text-left border border-border interactive-card cursor-pointer"
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex items-center justify-center rounded-lg mt-0.5 flex-shrink-0" style={{ width: 20, height: 20, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}>
                                  <Info size={11} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2 }}>
                                    {action.label}
                                  </span>
                                  <p className="m-0 text-[10px] text-muted-foreground leading-normal">
                                    {action.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                <div className="p-1 rounded bg-foreground text-background flex items-center justify-center">
                                  <ArrowRight size={10} />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ERP Posting Context */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">SAP ERP Posting Context</span>
                        <div className="rounded-xl p-3 bg-secondary/30 border border-border flex flex-col gap-2 text-[10.5px]">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Target System:</span>
                            <span className="font-medium text-foreground">SAP S/4HANA Finance</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Clearing Key:</span>
                            <span className="font-mono text-foreground">01 (Debit Cust Account)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ledger Mapping:</span>
                            <span className="text-emerald-500 font-semibold">{selectedInvoice.status === "Resolved" ? "Posted & Cleared" : "Draft Allocation Document Ready"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              // Fallback / No selection state (Reconciliation Session Summary)
              return (
                <div className="flex flex-col gap-4 text-left animate-in fade-in duration-200">
                  {/* Header */}
                  <div className="flex flex-col gap-1 border-b border-border pb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reconciliation Summary</span>
                    <h3 className="m-0 text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-500" />
                      Session Overview
                    </h3>
                  </div>

                  {/* Summary Cards Grid */}
                  <div className="grid grid-cols-2 gap-3.5 w-full">
                    <div className="rounded-xl p-3 border border-border/80 flex flex-col gap-1 text-[11px] bg-card">
                      <span className="text-muted-foreground text-[10px] font-medium">Total Credit</span>
                      <span className="text-sm font-bold text-foreground font-mono">₹{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="rounded-xl p-3 border border-border/80 flex flex-col gap-1 text-[11px] bg-card">
                      <span className="text-muted-foreground text-[10px] font-medium">Matched Amount</span>
                      <span className="text-sm font-bold text-emerald-500 font-mono">₹{matchedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="rounded-xl p-3 border border-border/80 flex flex-col gap-1 text-[11px] bg-card">
                      <span className="text-muted-foreground text-[10px] font-medium">Pending Allocation</span>
                      <span className="text-sm font-bold text-amber-500 font-mono">₹{pendingAllocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="rounded-xl p-3 border border-border/80 flex flex-col gap-1 text-[11px] bg-card">
                      <span className="text-muted-foreground text-[10px] font-medium">Needing Clarification</span>
                      <span className="text-sm font-bold text-red-500 font-mono">{clarificationCount} Items</span>
                    </div>
                  </div>

                  {/* Overall Session Progress */}
                  <div className="rounded-xl p-3.5 bg-secondary/30 border border-border flex flex-col gap-2 bg-card">
                    <div className="flex items-center justify-between text-[10.5px] font-medium text-muted-foreground">
                      <span>Reconciliation Progress</span>
                      <span className="text-foreground font-bold">{overallProgressPercent}% Complete</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${overallProgressPercent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-1 border-t border-border/40 pt-2 text-[9.5px]">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[9px]">Total Receipts</span>
                        <span className="text-foreground font-semibold font-mono">{totalReceiptsCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[9px]">Linked Invoices</span>
                        <span className="text-foreground font-semibold font-mono">{totalLinkedInvoicesCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[9px]">Total Exceptions</span>
                        <span className="text-foreground font-semibold font-mono text-red-500">{totalExceptionsCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Matching Overview */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">AI Matching Overview</span>
                    <div className="rounded-xl p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/15 text-[11px] leading-relaxed text-foreground bg-card">
                      <p className="m-0">
                        {`The AI agent has pre-analyzed UTR banking references and matched them with outstanding local book items. Reconciled values are prepared for ledger posting. Please review exception items and apply corrections as needed.`}
                      </p>
                    </div>
                  </div>

                  {/* Suggested Global Actions */}
                  {dynamicSuggestedActions.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Suggested Global Actions ({dynamicSuggestedActions.length})</span>
                      <div className="flex flex-col gap-2 w-full">
                        {dynamicSuggestedActions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => setActivePlanAction(action)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-accent transition-all text-left border border-border interactive-card cursor-pointer bg-card"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex items-center justify-center rounded-lg mt-0.5 flex-shrink-0" style={{ width: 20, height: 20, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}>
                                <Info size={11} />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2 }}>
                                  {action.label}
                                </span>
                                <p className="m-0 text-[10px] text-muted-foreground leading-normal">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <div className="p-1 rounded bg-foreground text-background flex items-center justify-center">
                                <ArrowRight size={10} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Bottom Timeline Section (Continuous Flow) */}
          <div className="flex flex-col gap-3 border-t border-border pt-4 select-text">
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
              UNIFIED ACTIVITY TIMELINE
            </span>

            <div className="flex flex-col pl-2.5 relative text-left">
              {activeEmail.activityTimeline.map((event, eIdx) => {
                const isLast = eIdx === activeEmail.activityTimeline.length - 1;
                
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
                    {!isLast && (
                      <div className="absolute w-0.5" style={{ left: 10, top: 20, bottom: 0, background: "var(--border)" }} />
                    )}

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

                    <div className="flex flex-col gap-0.5 flex-1 min-w-0 font-sans">
                      <div className="flex items-center justify-between gap-1 w-full text-left">
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }} className="truncate">
                          {event.title}
                        </span>
                        <span style={{ fontSize: 8.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                          {event.timestamp.split(",")[1] || event.timestamp}
                        </span>
                      </div>
                      {event.details && (
                        <p className="m-0 text-muted-foreground text-[10.5px] leading-normal mt-0.5 text-left font-sans">
                          {event.details}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 text-[8.5px] text-muted-foreground text-left">
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
        <div className="p-3 border-t border-border flex justify-center bg-secondary/10 flex-shrink-0">
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
    )}

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

      {/* ─── EMAIL DETAILS MODAL ─── */}
      {showEmailModal && activeEmail && (
        <div
          className="flex items-center justify-center animate-in fade-in duration-200"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 190,
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setShowEmailModal(false)}
        >
          <div
            className="flex flex-col rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            style={{
              width: 720,
              height: "85vh",
              maxHeight: "85vh",
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
              style={{ background: "var(--secondary)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 28, height: 28, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}
                >
                  <Mail size={14} />
                </div>
                <div className="flex flex-col text-left">
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                    Email Correspondence
                  </span>
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                    Reconciliation Source Reference
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex items-center justify-center p-1.5 rounded-lg hover:bg-accent cursor-pointer border-none"
                style={{ background: "none", color: "var(--muted-foreground)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-left" style={{ background: "var(--background)" }}>
              {/* Email Metadata Grid */}
              <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="flex items-start justify-between text-xs">
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <span className="text-muted-foreground mr-1">From:</span>
                      <strong className="text-foreground font-semibold">{activeEmail.sender}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground mr-1">To:</span>
                      <span className="text-foreground font-medium">{activeEmail.recipients}</span>
                    </div>
                  </div>
                  <div className="text-right text-muted-foreground font-mono text-[10px]">
                    {activeEmail.date}
                  </div>
                </div>
                <hr className="border-t border-border my-1" />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Subject</span>
                  <span className="text-sm font-bold text-foreground">{activeEmail.subject}</span>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Message Body</span>
                <div className="p-4 rounded-xl border border-border bg-card/50 text-xs text-foreground whitespace-pre-line leading-relaxed font-sans min-h-[120px]">
                  {activeEmail.body}
                </div>
              </div>

              {/* Attachments Section */}
              {activeEmail.attachments && activeEmail.attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Attachments ({activeEmail.attachments.length})
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {activeEmail.attachments.map((file, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => {
                          setPreviewFile(file);
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent transition-all text-left cursor-pointer hover:scale-[1.01]"
                        style={{ minWidth: 200 }}
                      >
                        <div
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 32, height: 32, background: "rgba(107,140,255,0.08)", color: "#6b8cff" }}
                        >
                          <FileText size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground truncate max-w-[140px]">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{file.size}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Thread History */}
              {activeEmail.longEmailThread && activeEmail.longEmailThread.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Prior Correspondence ({activeEmail.longEmailThread.length})
                  </span>
                  <div className="flex flex-col gap-4 border-l-2 border-border pl-4 ml-2">
                    {activeEmail.longEmailThread.map((thread, tIdx) => (
                      <div key={tIdx} className="flex flex-col gap-2 relative">
                        {/* Thread dot indicator */}
                        <div
                          className="absolute rounded-full border border-border"
                          style={{
                            width: 8,
                            height: 8,
                            left: -21,
                            top: 4,
                            background: "var(--background)"
                          }}
                        />
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-foreground font-semibold">{thread.sender}</strong>
                          <span className="text-muted-foreground font-mono text-[9.5px]">{thread.date}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-border bg-card/30 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                          {thread.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="px-6 py-4 border-t border-border flex justify-end gap-2.5 flex-shrink-0"
              style={{ background: "var(--secondary)" }}
            >
              <button
                onClick={() => setShowEmailModal(false)}
                className="rounded-lg px-4 py-2 hover:bg-accent border cursor-pointer font-semibold transition-colors"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 12 }}
              >
                Return to Workspace
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── UPLOAD MANUALLY MODAL ─── */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            setShowUploadModal(false);
            setUploadFile(null);
          }}
        >
          <div 
            className="w-full max-w-3xl rounded-xl border flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-base font-bold">Upload Reconciliation Data</h3>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  Add manual statements or operational logs
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-left" style={{ background: "var(--card)" }}>
              {/* Subtitle */}
              <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--muted-foreground)", margin: 0 }}>
                Upload statements or operational reports that were not received through email. Uploaded records will be processed by the AI reconciliation engine and added to the Manual Uploads queue.
              </p>

              <hr className="border-t border-border my-1" />

              {/* Source Type Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Source Type *
                </label>
                <select
                  value={uploadSourceType}
                  onChange={(e) => setUploadSourceType(e.target.value)}
                  className="w-full rounded-lg p-2 border outline-none bg-secondary text-xs font-semibold"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)", height: 36 }}
                >
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="CRM Services & Revenue Operations">CRM Services & Revenue Operations</option>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="Cheque Deposit">Cheque Deposit</option>
                  <option value="Collections Report">Collections Report</option>
                  <option value="Online Transactions">Online Transactions</option>
                  <option value="Payment Gateway">Payment Gateway</option>
                  <option value="Payment Proof">Payment Proof</option>
                  <option value="Sales Report">Sales Report</option>
                </select>
              </div>

              {/* Upload File Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Upload File *
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-upload-input-modal")?.click()}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed text-center transition-all cursor-pointer"
                  style={{
                    background: dragActive ? "rgba(107,140,255,0.06)" : "var(--secondary)",
                    borderColor: dragActive ? "#6b8cff" : "var(--border)",
                    minHeight: 100
                  }}
                >
                  <input 
                    id="file-upload-input-modal"
                    type="file"
                    accept=".pdf,.csv,.xlsx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Paperclip size={18} className="text-indigo-500 mb-2" />
                  {uploadFile ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[280px]">
                        {uploadFile.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {(uploadFile.size / 1024).toFixed(1)} KB • Click to replace
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                        Drag & Drop file here, or <span className="text-indigo-500">Browse</span>
                      </p>
                      <p style={{ fontSize: 9, color: "var(--muted-foreground)", marginTop: 4 }}>
                        Accepted formats: PDF, CSV, Excel (.xlsx), TXT
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Period inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={uploadPeriodFrom}
                    onChange={(e) => setUploadPeriodFrom(e.target.value)}
                    className="w-full rounded-lg p-2 border outline-none bg-secondary text-xs font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)", height: 36 }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={uploadPeriodTo}
                    onChange={(e) => setUploadPeriodTo(e.target.value)}
                    className="w-full rounded-lg p-2 border outline-none bg-secondary text-xs font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)", height: 36 }}
                  />
                </div>
              </div>

              {/* Reference Name */}
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Reference Name (Optional)
                </label>
                <input
                  type="text"
                  value={uploadRefName}
                  onChange={(e) => setUploadRefName(e.target.value)}
                  placeholder="e.g. June Collections"
                  className="w-full rounded-lg p-2 border outline-none bg-secondary text-xs font-semibold"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)", height: 36 }}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Add details regarding this upload statement..."
                  className="w-full rounded-lg p-2 border outline-none bg-secondary text-xs font-semibold"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t gap-2.5 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="rounded-lg px-4 py-2 hover:bg-accent border cursor-pointer font-semibold transition-colors text-xs"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddManualUpload}
                disabled={!uploadFile}
                className="rounded-lg px-4 py-2 cursor-pointer font-semibold transition-colors border-none text-xs"
                style={{
                  background: uploadFile ? "var(--foreground)" : "var(--muted)",
                  color: uploadFile ? "var(--background)" : "var(--muted-foreground)",
                  cursor: uploadFile ? "pointer" : "not-allowed"
                }}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
  );
}
