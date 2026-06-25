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
  RotateCcw
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type TransactionType =
  | "Bill"
  | "Receipt"
  | "Credit Note"
  | "Debit Note"
  | "Refund"
  | "Adjustment"
  | "Journal"
  | "Advance"
  | "Payment"
  | "Settlement";

export interface TransactionCard {
  id: string;
  type: TransactionType;
  ref: string;
  amount: number;
  appliedAmount: number;
  remainingBalance: number;
  status: "Outstanding" | "Available Credit" | "Pending Review" | "Resolved";
  date: string;
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
  amount: number;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Unresolved" | "Requires Review" | "Resolved";
  confidence: number;
  insight: string;
  suggestedActions: string[]; // references dynamic suggested actions
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

export interface EmailQueueItem {
  id: string;
  sender: string;
  subject: string;
  amount: number;
  processingStatus: "Exceptions Detected" | "Unresolved Exceptions" | "Requires Review" | "Resolved";
  aiConfidence: number;
  exceptionCount: number;
  date: string;
  recipients: string;
  body: string;
  attachments: { name: string; size: string; type: string }[];
  longEmailThread: EmailThreadItem[];
  threadSummary: string;
  
  // Timeline events for Column 3 (Thread Activity)
  threadActivity: { type: string; title: string; timestamp: string }[];
  
  // Audit logs for Column 3 (Audit Timeline)
  auditLogs: { event: string; actor: string; timestamp: string; details?: string }[];
  
  // Transaction cards
  transactions: TransactionCard[];
  
  // Outstanding items
  outstandingItems: OutstandingItem[];
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const INITIAL_QUEUE_DATA: EmailQueueItem[] = [
  {
    id: "TXN-EMAIL-001",
    sender: "finance@acmecorp.com",
    subject: "Remittance Advice: INV-2026-004 & INV-2026-008",
    amount: 150000,
    processingStatus: "Exceptions Detected",
    aiConfidence: 98,
    exceptionCount: 2,
    date: "Jun 25, 2026, 09:15 AM",
    recipients: "billing@datatwin.ai",
    body: `Dear Team,

Please find attached our payment advice and remittance breakdown for our pending invoices. We have cleared ₹95,000 against INV-2026-004 (Base Value: ₹1,00,000) after applying our Credit Note CN-002 (value ₹5,000) which was issued for returned goods.

Additionally, we have sent ₹20,000 to apply to INV-2026-008. The remaining balance of INV-2026-008 will be paid in our next cycle.

Please reconcile this at your end.

Best regards,
Acme Finance Team`,
    attachments: [
      { name: "remittance_breakdown_acme.pdf", size: "142 KB", type: "application/pdf" }
    ],
    longEmailThread: [
      {
        sender: "billing@datatwin.ai",
        date: "Jun 24, 2026, 04:10 PM",
        body: "Hello Acme Finance, we notice that INV-2026-004 (₹1,00,000) and INV-2026-008 (₹30,000) are currently overdue. Please share the payment schedule or transaction slips if processed."
      },
      {
        sender: "finance@acmecorp.com",
        date: "Jun 24, 2026, 11:30 AM",
        body: "Hi DataTwin Billing, we are compiling our weekly payment runs today. We will include both invoices in the batch. Let us know if you need to adjust any credit balances beforehand."
      }
    ],
    threadSummary: "Reconciliation of Acme Corp's payment of ₹1,15,000. Customer claims to have applied a ₹5,000 Credit Note CN-002 to clear INV-2026-004 and paid ₹20,000 against INV-2026-008. There is a ₹15 variance in the bank transmission.",
    threadActivity: [
      { type: "Email Received", title: "Incoming remittance email received from finance@acmecorp.com", timestamp: "Today, 09:15 AM" },
      { type: "Attachment Parsed", title: "remittance_breakdown_acme.pdf parsed successfully by AI Agent", timestamp: "Today, 09:16 AM" },
      { type: "Transaction Parsed", title: "Identified billing records: BILL-004 (INV-2026-004) & BILL-008 (INV-2026-008)", timestamp: "Today, 09:17 AM" },
      { type: "Exception Detected", title: "Unregistered Credit Note CN-002 detected in remittance breakdown", timestamp: "Today, 09:17 AM" },
      { type: "Suggested Actions Generated", title: "Generated AI clearing recommendations", timestamp: "Today, 09:18 AM" }
    ],
    auditLogs: [
      { event: "Email Received", actor: "System", timestamp: "Jun 25, 2026, 09:15 AM", details: "Ingested via billing channel." },
      { event: "Attachment Parsed", actor: "AI Agent", timestamp: "Jun 25, 2026, 09:16 AM", details: "Mapped remittance data fields to standard ERP schemas." },
      { event: "Transaction Created", actor: "AI Agent", timestamp: "Jun 25, 2026, 09:17 AM", details: "Parsed Bill references. Unapplied Receipt mapping created." },
      { event: "Exception Detected", actor: "System", timestamp: "Jun 25, 2026, 09:17 AM", details: "CN Not Found (CN-002) and Minor Difference (₹15) logged as outstanding." }
    ],
    transactions: [
      { id: "TXN-001", type: "Bill", ref: "INV-2026-004", amount: 100000, appliedAmount: 95000, remainingBalance: 5000, status: "Outstanding", date: "May 30, 2026" },
      { id: "TXN-002", type: "Receipt", ref: "RCPT-1082", amount: 115000, appliedAmount: 95000, remainingBalance: 20000, status: "Available Credit", date: "Jun 25, 2026" },
      { id: "TXN-003", type: "Bill", ref: "INV-2026-008", amount: 30000, appliedAmount: 20000, remainingBalance: 10000, status: "Outstanding", date: "Jun 02, 2026" },
      { id: "TXN-004", type: "Credit Note", ref: "CN-002", amount: 5000, appliedAmount: 0, remainingBalance: 5000, status: "Available Credit", date: "Jun 15, 2026" }
    ],
    outstandingItems: [
      {
        id: "EXP-001",
        type: "CN Not Found",
        amount: 5000,
        priority: "High",
        status: "Unresolved",
        confidence: 94,
        insight: "Credit Note CN-002 was mentioned in the email remittance but does not exist in the ERP ledger. AI suggests generating CN-002 matching internal returned goods ticket GRN-998.",
        suggestedActions: ["act_create_cn", "act_raise_inv"],
        relatedTxnIds: ["TXN-004", "TXN-001"]
      },
      {
        id: "EXP-002",
        type: "Minor Diff",
        amount: 15,
        priority: "Low",
        status: "Unresolved",
        confidence: 99,
        insight: "Acme Corp remittance claims ₹95,000 + CN-002 cleared INV-2026-004, but bank transmission records show ₹94,985. A minor discrepancy of ₹15 remains.",
        suggestedActions: ["act_post_crco", "act_post_bank"],
        relatedTxnIds: ["TXN-001", "TXN-002"]
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
    exceptionCount: 2,
    date: "Jun 24, 2026, 02:40 PM",
    recipients: "billing@datatwin.ai",
    body: `Hi Team,

We have wired ₹50,000 to clear our outstanding dues for Bill-2026-012. Please find the bank transaction advice copy attached. Please confirm receipt and adjust our account.

Thanks,
TechSupply Receivables Team`,
    attachments: [
      { name: "wire_receipt_9812.png", size: "380 KB", type: "image/png" }
    ],
    longEmailThread: [],
    threadSummary: "Reconciliation of TechSupply Co wire transfer. Vendor claims they paid ₹50,000 to clear Bill-2026-012. Transaction Ref#9812 is not yet reflected in the bank ledger feed.",
    threadActivity: [
      { type: "Email Received", title: "Incoming transaction email received from ar@techsupply.com", timestamp: "Yesterday, 02:40 PM" },
      { type: "Attachment Parsed", title: "wire_receipt_9812.png image parsed via OCR reader", timestamp: "Yesterday, 02:42 PM" },
      { type: "Transaction Parsed", title: "Identified target Bill-2026-012 outstanding balance", timestamp: "Yesterday, 02:43 PM" },
      { type: "Exception Detected", title: "Bank transaction Ref#9812 not found in cash ledger", timestamp: "Yesterday, 02:43 PM" }
    ],
    auditLogs: [
      { event: "Email Received", actor: "System", timestamp: "Jun 24, 2026, 02:40 PM" },
      { event: "Attachment Parsed", actor: "AI Agent", timestamp: "Jun 24, 2026, 02:42 PM" },
      { event: "Transaction Created", actor: "AI Agent", timestamp: "Jun 24, 2026, 02:43 PM" }
    ],
    transactions: [
      { id: "TXN-201", type: "Bill", ref: "Bill-2026-012", amount: 50000, appliedAmount: 0, remainingBalance: 50000, status: "Outstanding", date: "May 25, 2026" },
      { id: "TXN-202", type: "Receipt", ref: "Ref#9812", amount: 50000, appliedAmount: 0, remainingBalance: 50000, status: "Available Credit", date: "Jun 24, 2026" }
    ],
    outstandingItems: [
      {
        id: "EXP-201",
        type: "Receipts not found",
        amount: 50000,
        priority: "Critical",
        status: "Unresolved",
        confidence: 88,
        insight: "Bank transmission Ref#9812 is missing from our current bank feed statements. Recommending manual Cash GL booking or raising an investigation with bank operations.",
        suggestedActions: ["act_post_bank", "act_raise_inv"],
        relatedTxnIds: ["TXN-202"]
      },
      {
        id: "EXP-202",
        type: "Open Advance",
        amount: 50000,
        priority: "High",
        status: "Unresolved",
        confidence: 95,
        insight: "A ₹50,000 cash receipt is unapplied to the outstanding invoice. Recommending connecting the Receipt to Bill-2026-012.",
        suggestedActions: ["act_connect", "act_clearing"],
        relatedTxnIds: ["TXN-201", "TXN-202"]
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
    recipients: "billing@datatwin.ai",
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
    threadActivity: [
      { type: "Email Received", title: "Incoming refund notice received from refunds@nextlevelit.com", timestamp: "Jun 23, 11:05 AM" },
      { type: "Attachment Parsed", title: "refund_sheet_ref9921.pdf parsed successfully by AI Agent", timestamp: "Jun 23, 11:06 AM" },
      { type: "Transaction Parsed", title: "Identified Bill INV-2026-011 (Fully Cleared) and double payment", timestamp: "Jun 23, 11:07 AM" },
      { type: "Exception Detected", title: "Unallocated Refund entry REF-9921 found", timestamp: "Jun 23, 11:07 AM" }
    ],
    auditLogs: [
      { event: "Email Received", actor: "System", timestamp: "Jun 23, 11:05 AM" },
      { event: "Attachment Parsed", actor: "AI Agent", timestamp: "Jun 23, 11:06 AM" },
      { event: "Transaction Created", actor: "AI Agent", timestamp: "Jun 23, 11:07 AM" }
    ],
    transactions: [
      { id: "TXN-301", type: "Bill", ref: "INV-2026-011", amount: 75000, appliedAmount: 75000, remainingBalance: 0, status: "Resolved", date: "May 15, 2026" },
      { id: "TXN-302", type: "Receipt", ref: "RCPT-8871", amount: 150000, appliedAmount: 75000, remainingBalance: 75000, status: "Available Credit", date: "Jun 10, 2026" },
      { id: "TXN-303", type: "Refund", ref: "REF-9921", amount: 75000, appliedAmount: 0, remainingBalance: 75000, status: "Pending Review", date: "Jun 22, 2026" }
    ],
    outstandingItems: [
      {
        id: "EXP-301",
        type: "Refund Entries",
        amount: 75000,
        priority: "High",
        status: "Unresolved",
        confidence: 96,
        insight: "A credit refund of ₹75,000 was posted in the ledger but is unmatched to the original double-payment receipt. Recommending clearing and connecting the cards.",
        suggestedActions: ["act_clearing", "act_connect"],
        relatedTxnIds: ["TXN-302", "TXN-303"]
      }
    ]
  }
];

const DYNAMIC_ACTIONS_CATALOG: Record<string, SuggestedAction> = {
  act_create_cn: {
    id: "act_create_cn",
    label: "Create Credit Note CN-002",
    description: "Auto-generate the missing Credit Note CN-002 record in the system based on matching GRN-998 returned goods logs.",
    confidence: 98,
    plan: [
      "Fetch Returned Goods Voucher GRN-998.",
      "Verify returned quantities and values match ₹5,000.",
      "Auto-generate Credit Note CN-002 in ERP Ledger.",
      "Update remittance matching state to matched."
    ],
    expectedResult: "Remittance credit card state updated. Credit Note CN-002 created in database."
  },
  act_connect: {
    id: "act_connect",
    label: "Connect Selected Transactions",
    description: "Create a reference link between the selected transaction cards in the database to record allocations.",
    confidence: 95,
    plan: [
      "Bind target transaction IDs together.",
      "Create matching trace record in audit ledger.",
      "Update reference flags on selected transactions."
    ],
    expectedResult: "Reference links updated. Selected cards linked."
  },
  act_clearing: {
    id: "act_clearing",
    label: "Execute Clearing",
    description: "Reconcile outstanding balances by clearing matching debit/credit cards.",
    confidence: 97,
    plan: [
      "Allocate available credit to outstanding invoices.",
      "Reduce outstanding balances.",
      "Post clearing document record in ledger."
    ],
    expectedResult: "Outstanding balances cleared/reduced based on allocation."
  },
  act_post_crco: {
    id: "act_post_crco",
    label: "Post CRCO Adjustment",
    description: "Write-off minor financial variance (₹15) to the Corporate Cost Center (CRCO) ledger write-off account.",
    confidence: 99,
    plan: [
      "Debit CRCO Write-off account with ₹15.",
      "Credit Outstanding Invoice INV-2026-004 with ₹15.",
      "Clear invoice status to fully paid."
    ],
    expectedResult: "Outstanding invoice balance reduced to ₹0. Discrepancy resolved."
  },
  act_post_bank: {
    id: "act_post_bank",
    label: "Post Bank/Cash GL",
    description: "Post bank receipt amount directly into the general cash ledger to bypass statement feeds.",
    confidence: 90,
    plan: [
      "Debit Bank Clearing Account.",
      "Credit Customer Receivables Account.",
      "Flag cash ledger item as manually booked."
    ],
    expectedResult: "Manual bank ledger booking completed. Cash matching state resolved."
  },
  act_raise_inv: {
    id: "act_raise_inv",
    label: "Raise Investigation",
    description: "Flag transactions to Accounts Receivable (AR) team to query bank operations regarding statement delays.",
    confidence: 94,
    plan: [
      "Mark item as Under Investigation.",
      "Dispatch automated email log to bank support.",
      "Notify Account Manager."
    ],
    expectedResult: "Dispatched ticket. Ticket status: Open."
  },
  act_group: {
    id: "act_group",
    label: "Group Transactions",
    description: "Combine multiple outstanding bills into a single grouped payment batch for clearing.",
    confidence: 96,
    plan: [
      "Link outstanding bills under a common payment reference.",
      "Update status fields of transactions to grouped."
    ],
    expectedResult: "Grouped batch reference generated."
  },
  act_disconnect: {
    id: "act_disconnect",
    label: "Disconnect Transactions",
    description: "Sever the clearing allocation reference link between transactions.",
    confidence: 98,
    plan: [
      "Unlink allocations between transactions.",
      "Restore outstanding and available credit balances."
    ],
    expectedResult: "Reconciliation link severed. Balances restored."
  },
  act_apply_credit: {
    id: "act_apply_credit",
    label: "Apply Credit Balance",
    description: "Allocate available credit amounts to outstanding invoice balances.",
    confidence: 97,
    plan: [
      "Reduce available credit card balance.",
      "Apply allocation credit to target bill."
    ],
    expectedResult: "Credit allocated. Outstanding balance reduced."
  }
};

export function TransactionHubPage() {
  const [queue, setQueue] = useState<EmailQueueItem[]>(INITIAL_QUEUE_DATA);
  const [selectedEmailId, setSelectedEmailId] = useState<string>("TXN-EMAIL-001");
  
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

  // Filtered and Sorted Email List
  const filteredQueue = useMemo(() => {
    return queue
      .filter((item) => {
        const matchesSearch =
          item.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.body.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter =
          statusFilter === "All" || item.processingStatus === statusFilter;

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

  // Handle transaction card selection click
  const handleTxnCardClick = (id: string) => {
    setActiveExceptionId(null); // Clear exception selection when directly clicking cards
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
      setSelectedTxnIds(exception.relatedTxnIds); // Automatically highlight related transaction cards
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
      // Return default actions based on unallocated exceptions of active email
      const unresolvedExceptions = activeEmail.outstandingItems.filter(e => e.status !== "Resolved");
      if (unresolvedExceptions.length > 0) {
        const allActIds = Array.from(new Set(unresolvedExceptions.flatMap(e => e.suggestedActions)));
        return allActIds.map(id => DYNAMIC_ACTIONS_CATALOG[id]).filter(Boolean);
      }
      return [DYNAMIC_ACTIONS_CATALOG.act_raise_inv]; // Default fallback
    }

    const selectedCards = activeEmail.transactions.filter((t) => selectedTxnIds.includes(t.id));
    
    // 1. Bill + Receipt selected
    const hasBill = selectedCards.some((c) => c.type === "Bill");
    const hasReceipt = selectedCards.some((c) => c.type === "Receipt");
    const hasRefund = selectedCards.some((c) => c.type === "Refund");
    const hasCN = selectedCards.some((c) => c.type === "Credit Note");

    if (selectedCards.length === 2) {
      if (hasBill && hasReceipt) {
        return [DYNAMIC_ACTIONS_CATALOG.act_connect, DYNAMIC_ACTIONS_CATALOG.act_clearing];
      }
      if (hasBill && hasCN) {
        return [DYNAMIC_ACTIONS_CATALOG.act_connect, DYNAMIC_ACTIONS_CATALOG.act_clearing];
      }
      if (hasReceipt && hasRefund) {
        return [DYNAMIC_ACTIONS_CATALOG.act_connect, DYNAMIC_ACTIONS_CATALOG.act_clearing];
      }
    }

    // 2. Two Bills selected
    if (selectedCards.length >= 2 && selectedCards.every((c) => c.type === "Bill")) {
      return [DYNAMIC_ACTIONS_CATALOG.act_group, DYNAMIC_ACTIONS_CATALOG.act_connect];
    }

    // 3. Outstanding balance only
    if (selectedCards.length === 1 && selectedCards[0].status === "Outstanding") {
      return [DYNAMIC_ACTIONS_CATALOG.act_clearing, DYNAMIC_ACTIONS_CATALOG.act_post_bank];
    }

    // 4. Credit available only
    if (selectedCards.length === 1 && selectedCards[0].status === "Available Credit") {
      return [DYNAMIC_ACTIONS_CATALOG.act_apply_credit, DYNAMIC_ACTIONS_CATALOG.act_post_crco];
    }

    // 5. Connected or resolved selected
    if (selectedCards.some(c => c.status === "Resolved")) {
      return [DYNAMIC_ACTIONS_CATALOG.act_disconnect];
    }

    return [DYNAMIC_ACTIONS_CATALOG.act_connect, DYNAMIC_ACTIONS_CATALOG.act_raise_inv];
  }, [selectedTxnIds, activeExceptionId, activeEmail]);

  // Dynamic AI Insight text explanation
  const dynamicAIInsight = useMemo(() => {
    if (activeExceptionId) {
      const activeExc = activeEmail.outstandingItems.find((e) => e.id === activeExceptionId);
      if (activeExc) {
        return {
          text: activeExc.insight,
          confidence: activeExc.confidence
        };
      }
    }

    if (selectedTxnIds.length === 0) {
      return {
        text: `Remittance data processed with ${activeEmail.aiConfidence}% matching confidence. AI detected ${activeEmail.outstandingItems.filter(e => e.status !== "Resolved").length} open exceptions requiring clearing adjustments.`,
        confidence: activeEmail.aiConfidence
      };
    }

    const selectedCards = activeEmail.transactions.filter((t) => selectedTxnIds.includes(t.id));
    if (selectedCards.length === 2) {
      const types = selectedCards.map(c => c.type);
      if (types.includes("Bill") && types.includes("Receipt")) {
        const bill = selectedCards.find(c => c.type === "Bill")!;
        const receipt = selectedCards.find(c => c.type === "Receipt")!;
        return {
          text: `Invoice ${bill.ref} has ₹${bill.remainingBalance} outstanding. Receipt ${receipt.ref} contains ₹${receipt.remainingBalance} unapplied. They share matching reference tags in Acme's remittance record. Recommending connecting the cards to apply available credit.`,
          confidence: 98
        };
      }
      if (types.includes("Bill") && types.includes("Credit Note")) {
        const bill = selectedCards.find(c => c.type === "Bill")!;
        const cn = selectedCards.find(c => c.type === "Credit Note")!;
        return {
          text: `Outstanding invoice ${bill.ref} and unlinked Credit Note ${cn.ref} both relate to returned goods batch ref. Matching confidence is high. Recommending executing clearing to apply Credit Note.`,
          confidence: 97
        };
      }
    }

    if (selectedCards.every(c => c.type === "Bill")) {
      return {
        text: `${selectedCards.length} outstanding invoices selected. Total balance due: ₹${selectedCards.reduce((acc, c) => acc + c.remainingBalance, 0)}. Recommending grouping them for a single batch allocation or wire instruction.`,
        confidence: 94
      };
    }

    return {
      text: "Reconciliation engine parsed selected cards. Recommended remedial cash GL posting or transaction allocations can be initialized below.",
      confidence: 91
    };
  }, [selectedTxnIds, activeExceptionId, activeEmail]);

  // Execute Action callback (remediates mock data)
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
        let newAuditLogs = [...email.auditLogs];

        if (actionId === "act_create_cn") {
          // Resolve CN Not Found exception
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "CN Not Found" ? { ...ex, status: "Resolved" as const } : ex
          );
          // Set credit note applied
          updatedTxns = updatedTxns.map((t) => {
            if (t.type === "Credit Note") {
              return { ...t, appliedAmount: 5000, remainingBalance: 0, status: "Resolved" as const };
            }
            if (t.ref === "INV-2026-004") {
              return { ...t, appliedAmount: 100000, remainingBalance: 0, status: "Resolved" as const };
            }
            return t;
          });
          newAuditLogs.push({
            event: "User Connected Transactions",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`,
            details: "Generated CN-002 (₹5,000) and applied to clear balance of INV-2026-004."
          });
        } else if (actionId === "act_post_crco") {
          // Resolve Minor Diff
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "Minor Diff" ? { ...ex, status: "Resolved" as const } : ex
          );
          newAuditLogs.push({
            event: "Execute Clearing",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`,
            details: "Posted CRCO write-off adjustment of ₹15 to invoice INV-2026-004 balance."
          });
        } else if (actionId === "act_clearing") {
          if (email.id === "TXN-EMAIL-001") {
            // Apply available credit to INV-2026-008
            updatedTxns = updatedTxns.map((t) => {
              if (t.ref === "INV-2026-008") {
                return { ...t, appliedAmount: 30000, remainingBalance: 0, status: "Resolved" as const };
              }
              if (t.ref === "RCPT-1082") {
                return { ...t, appliedAmount: 115000, remainingBalance: 10000, status: "Available Credit" as const };
              }
              return t;
            });
            newAuditLogs.push({
              event: "Execute Clearing",
              actor: "Alex Johnson",
              timestamp: `Today, ${nowStr}`,
              details: "Executed clearing: Applied ₹10,000 credit to clear outstanding INV-2026-008."
            });
          } else if (email.id === "TXN-EMAIL-002") {
            updatedExceptions = updatedExceptions.map((ex) =>
              ex.type === "Open Advance" ? { ...ex, status: "Resolved" as const } : ex
            );
            updatedTxns = updatedTxns.map((t) => {
              if (t.type === "Bill") {
                return { ...t, appliedAmount: 50000, remainingBalance: 0, status: "Resolved" as const };
              }
              if (t.type === "Receipt") {
                return { ...t, appliedAmount: 50000, remainingBalance: 0, status: "Resolved" as const };
              }
              return t;
            });
            newAuditLogs.push({
              event: "Execute Clearing",
              actor: "Alex Johnson",
              timestamp: `Today, ${nowStr}`,
              details: "Executed clearing of Bill-2026-012 using cash transfer receipt Ref#9812."
            });
          } else if (email.id === "TXN-EMAIL-003") {
            updatedExceptions = updatedExceptions.map((ex) =>
              ex.type === "Refund Entries" ? { ...ex, status: "Resolved" as const } : ex
            );
            updatedTxns = updatedTxns.map((t) => {
              if (t.type === "Refund") {
                return { ...t, appliedAmount: 75000, remainingBalance: 0, status: "Resolved" as const };
              }
              if (t.type === "Receipt") {
                return { ...t, appliedAmount: 150000, remainingBalance: 0, status: "Resolved" as const };
              }
              return t;
            });
            newAuditLogs.push({
              event: "Execute Clearing",
              actor: "Alex Johnson",
              timestamp: `Today, ${nowStr}`,
              details: "Executed refund matching clearance. Applied REF-9921 to double receipt balance."
            });
          }
        } else if (actionId === "act_post_bank") {
          updatedExceptions = updatedExceptions.map((ex) =>
            ex.type === "Receipts not found" ? { ...ex, status: "Resolved" as const } : ex
          );
          newAuditLogs.push({
            event: "Post Bank/Cash GL",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`,
            details: "Manually booked Cash Receipt Ref#9812 to clear AR ledger mismatch."
          });
        } else if (actionId === "act_connect") {
          newAuditLogs.push({
            event: "User Connected Transactions",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`,
            details: "Connected and bound selected card references for matching review."
          });
        } else if (actionId === "act_group") {
          newAuditLogs.push({
            event: "Group Transactions",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`,
            details: "Grouped outstanding invoices for collective settlement reconciliation."
          });
        } else if (actionId === "act_disconnect") {
          newAuditLogs.push({
            event: "Disconnect Transaction",
            actor: "Alex Johnson",
            timestamp: `Today, ${nowStr}`,
            details: "Severed transaction allocation links. Balances restored to uncleared state."
          });
        }

        // Re-calculate exception counts and processing status
        const openExps = updatedExceptions.filter((ex) => ex.status !== "Resolved");
        const resolved = openExps.length === 0;

        return {
          ...email,
          transactions: updatedTxns,
          outstandingItems: updatedExceptions,
          auditLogs: newAuditLogs,
          exceptionCount: openExps.length,
          processingStatus: resolved ? "Resolved" : email.processingStatus
        };
      });
    });

    // Close preview panel and clear selections
    setActivePlanAction(null);
    setSelectedTxnIds([]);
    setActiveExceptionId(null);
  };

  // Keyword highlighting helper inside email body
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

  // Toggle collapsible email rows
  const toggleThreadCollapse = (idx: number) => {
    setCollapsedThreadIds((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

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
                <option value="Resolved">Resolved</option>
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
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <Mail size={24} style={{ color: "var(--muted-foreground)" }} />
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No transaction items in queue.</p>
            </div>
          ) : (
            filteredQueue.map((item) => {
              const isSelected = selectedEmailId === item.id;
              const hasExceptions = item.exceptionCount > 0;
              const isResolved = item.processingStatus === "Resolved";

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
                    <span style={{ fontSize: 12.5, fontWeight: 650, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.sender.split("@")[0].toUpperCase()}
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
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {item.subject}
                  </span>

                  {/* Summary Badges Row */}
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    <span
                      className="rounded-full px-2 py-0.5 font-semibold font-mono"
                      style={{
                        fontSize: 9.5,
                        background: "rgba(107,140,255,0.08)",
                        color: "#6b8cff",
                        border: "1px solid rgba(107,140,255,0.12)"
                      }}
                    >
                      ₹{item.amount.toLocaleString()}
                    </span>

                    {/* Status Badge */}
                    <span
                      className="rounded-full px-2 py-0.5 font-semibold"
                      style={{
                        fontSize: 9,
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

                    {/* AI Confidence */}
                    <span style={{ fontSize: 9.5, color: "var(--muted-foreground)", alignSelf: "center" }}>
                      {item.aiConfidence}% AI
                    </span>
                  </div>

                  {/* Open Exceptions / Allocations Summary */}
                  {!isResolved && (
                    <div
                      className="rounded-lg p-2 flex flex-col gap-1 mt-1 bg-secondary/60 w-full"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      {hasExceptions && (
                        <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-red-500">
                          <AlertTriangle size={11} />
                          <span>{item.exceptionCount} OUTSTANDING ITEMS</span>
                        </div>
                      )}
                      
                      {/* Sub list of outstanding items */}
                      <div className="flex flex-wrap gap-1">
                        {item.outstandingItems.map((ex) => (
                          <span
                            key={ex.id}
                            className="rounded px-1.5 py-0.5 text-[8.5px] font-semibold border"
                            style={{
                              borderColor: ex.status === "Resolved" ? "#22c55e" : ex.priority === "Critical" || ex.priority === "High" ? "#ef4444" : "#f59e0b",
                              background: ex.status === "Resolved" ? "rgba(34,197,94,0.03)" : "transparent",
                              color: ex.status === "Resolved" ? "#22c55e" : ex.priority === "Critical" || ex.priority === "High" ? "#ef4444" : "#f59e0b"
                            }}
                          >
                            {ex.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isResolved && (
                    <div className="flex items-center gap-1 mt-1 text-emerald-500 font-semibold" style={{ fontSize: 10.5 }}>
                      <CheckCircle2 size={12} />
                      <span>Reconciled & Cleared</span>
                    </div>
                  )}
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
              Communication Thread
            </span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
              ID: {activeEmail.id}
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
              onChange={(e) => setThreadSearchQuery(e.target.value)}
              placeholder="Search text in thread…"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 11.5,
                color: "var(--foreground)"
              }}
            />
            {threadSearchQuery && (
              <button onClick={() => setThreadSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={10} />
              </button>
            )}
          </div>
        </header>

        {/* Column 2 Inner Split Pane */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 gap-4">
          
          {/* TOP HALF: Email Viewer Card */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 bg-card"
            style={{ border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}
          >
            <div className="flex flex-col gap-2">
              <h2 style={{ fontSize: 15, fontWeight: 750, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                {highlightEmailText(activeEmail.subject, threadSearchQuery)}
              </h2>
              
              <div className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground mt-1">
                <div>From: <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>{activeEmail.sender}</strong></div>
                <div className="text-right">Date: <span style={{ fontFamily: "var(--font-mono)" }}>{activeEmail.date}</span></div>
                <div>To: <span style={{ color: "var(--foreground)" }}>{activeEmail.recipients}</span></div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

            {/* Email Body */}
            <div
              className="text-sm text-foreground overflow-y-auto max-h-[160px] whitespace-pre-wrap leading-relaxed"
              style={{ color: "var(--foreground)", fontFamily: "inherit" }}
            >
              {highlightEmailText(activeEmail.body, threadSearchQuery)}
            </div>

            {/* Attachments list with preview triggers */}
            {activeEmail.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-2 border-t border-border">
                {activeEmail.attachments.map((file, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => setPreviewFile(file)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left bg-secondary hover:bg-accent border transition-colors cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
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

            {/* Collapsible long email thread chain */}
            {activeEmail.longEmailThread.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border">
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                  EMAIL CHAIN ({activeEmail.longEmailThread.length} PREVIOUS MESSAGES)
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
                        style={{ cursor: "pointer", fontSize: 11.5 }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <strong style={{ color: "var(--foreground)" }}>{history.sender}</strong>
                          <span style={{ color: "var(--muted-foreground)" }}>·</span>
                          <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{history.date}</span>
                        </div>
                        {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
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
            className="rounded-2xl p-5 flex flex-col gap-4 bg-card relative"
            style={{ border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
                  <Sparkles size={14} />
                </span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                  Reconciliation Workspace
                </h3>
              </div>
              <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>
                Select cards to dynamically construct AI actions
              </span>
            </div>

            {/* A. TRANSACTION TIMELINE (CONNECTED CARDS) */}
            <div className="flex flex-col gap-2.5">
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                TRANSACTION TIMELINE (DATA-DRIVEN CONNECTED FLOW)
              </span>

              <div
                className="flex items-center gap-4 overflow-x-auto py-3 px-2 rounded-xl bg-secondary/40"
                style={{ border: "1px solid var(--border)" }}
              >
                {activeEmail.transactions.map((txn, idx) => {
                  const isSelected = selectedTxnIds.includes(txn.id);
                  const isBill = txn.type === "Bill" || txn.type === "Debit Note";
                  
                  // Color statuses
                  let statusBg = "rgba(136,136,150,0.08)";
                  let statusColor = "var(--muted-foreground)";
                  let cardBorderColor = "var(--border)";

                  if (txn.status === "Outstanding") {
                    statusBg = "rgba(239,68,68,0.08)";
                    statusColor = "#ef4444";
                  } else if (txn.status === "Available Credit") {
                    statusBg = "rgba(34,197,94,0.08)";
                    statusColor = "#22c55e";
                  } else if (txn.status === "Pending Review") {
                    statusBg = "rgba(245,158,11,0.08)";
                    statusColor = "#f59e0b";
                  } else if (txn.status === "Resolved") {
                    statusBg = "rgba(34,197,94,0.12)";
                    statusColor = "#22c55e";
                  }

                  if (isSelected) {
                    cardBorderColor = "rgba(107,140,255,0.8)";
                  }

                  return (
                    <div key={txn.id} className="flex items-center flex-shrink-0">
                      {/* connected card */}
                      <button
                        onClick={() => handleTxnCardClick(txn.id)}
                        className="rounded-xl p-3 flex flex-col gap-2.5 text-left transition-all hover:scale-[1.01] border-none select-none"
                        style={{
                          width: 145,
                          background: isSelected ? "var(--secondary)" : "var(--card)",
                          border: `2px solid ${cardBorderColor}`,
                          cursor: "pointer",
                          boxShadow: isSelected ? "0 4px 14px rgba(107,140,255,0.08)" : "0 2px 4px rgba(0,0,0,0.01)"
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }}>
                            {txn.type}
                          </span>
                          <span
                            className="rounded px-1.5 py-0.5 text-[8.5px] font-bold"
                            style={{ background: statusBg, color: statusColor }}
                          >
                            {txn.status}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span style={{ fontSize: 13, fontWeight: 750, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                            ₹{txn.amount.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 9.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                            Ref: {txn.ref}
                          </span>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: 0 }} />

                        <div className="flex flex-col gap-1 text-[9.5px] text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Allocated:</span>
                            <span style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>₹{txn.appliedAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Remaining:</span>
                            <span
                              style={{
                                color: txn.remainingBalance > 0 ? (isBill ? "#ef4444" : "#22c55e") : "var(--muted-foreground)",
                                fontWeight: txn.remainingBalance > 0 ? 600 : 400,
                                fontFamily: "var(--font-mono)"
                              }}
                            >
                              ₹{txn.remainingBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* arrow connector */}
                      {idx < activeEmail.transactions.length - 1 && (
                        <div className="flex items-center justify-center text-muted-foreground/60 px-1">
                          <ChevronRight size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B. OUTSTANDING ITEMS (EXCEPTIONS CARDS) */}
            <div className="flex flex-col gap-2.5">
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                OUTSTANDING ITEMS (RECONCILIATION FLAGS)
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
                      className="rounded-xl p-3 flex flex-col gap-2 text-left transition-all hover:scale-[1.01] border-none"
                      style={{
                        background: isSelected ? bg : "var(--card)",
                        border: `1.5px solid ${borderColor}`,
                        cursor: isResolved ? "default" : "pointer",
                        opacity: isResolved ? 0.6 : 1,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
                      }}
                    >
                      <div className="flex items-center justify-between w-full text-xs">
                        <span style={{ fontWeight: 700, color }}>{ex.type}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="rounded px-1 text-[8.5px] font-bold"
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

                      <p className="m-0" style={{ fontSize: 11, color: "var(--foreground)", lineHeight: 1.45 }}>
                        {ex.insight}
                      </p>

                      <div className="flex justify-between items-baseline mt-1">
                        <span style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>Impact Amount:</span>
                        <strong style={{ fontSize: 12, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
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
              <div className="flex items-center gap-1.5 text-indigo-500 font-bold" style={{ fontSize: 10, letterSpacing: "0.04em" }}>
                <Sparkles size={12} />
                <span>AI RECONCILIATION INSIGHT ({dynamicAIInsight.confidence}% CONFIDENCE)</span>
              </div>
              <p className="m-0 text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                {dynamicAIInsight.text}
              </p>
            </div>

            {/* D. SUGGESTED ACTIONS (AI RECOMMENDATIONS) */}
            <div className="flex flex-col gap-2.5">
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
                SUGGESTED ACTIONS (RECOMMENDED CLEARANCES)
              </span>

              <div className="flex flex-col gap-2">
                {dynamicSuggestedActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setActivePlanAction(action)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-accent hover:scale-[1.005] transition-all text-left border border-border"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="flex items-center justify-center rounded-lg mt-0.5"
                        style={{ width: 26, height: 26, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}
                      >
                        <Info size={13} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                          {action.label}
                        </span>
                        <p className="m-0" style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                          {action.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                        {action.confidence}% Confidence
                      </span>
                      <div className="p-1 rounded bg-foreground text-background">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* E. AI EXECUTION PREVIEW (SLIDER FOOTER CARD) */}
            {activePlanAction && (
              <div
                className="absolute inset-x-0 bottom-0 p-5 rounded-2xl flex flex-col gap-3.5 border z-30"
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
            Thread Audit & Timeline
          </span>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          
          {/* Section 1: Thread Summary */}
          <div className="flex flex-col gap-2">
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
              AI CONCISE THREAD SUMMARY
            </span>
            <div
              className="rounded-xl p-3 bg-secondary/50 text-xs border leading-relaxed"
              style={{ color: "var(--foreground)" }}
            >
              {activeEmail.threadSummary}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: 0 }} />

          {/* Section 2: Thread Communication Timeline */}
          <div className="flex flex-col gap-3">
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
              COMMUNICATION TIMELINE
            </span>

            <div className="flex flex-col pl-2.5 relative">
              {activeEmail.threadActivity.map((event, eIdx) => {
                const isLast = eIdx === activeEmail.threadActivity.length - 1;
                return (
                  <div key={eIdx} className="flex items-start gap-3 relative pb-4 text-left">
                    {/* Vertical connector line */}
                    {!isLast && (
                      <div className="absolute w-0.5" style={{ left: 10, top: 18, bottom: 0, background: "var(--border)" }} />
                    )}

                    {/* Timeline dot icon */}
                    <div
                      className="flex items-center justify-center rounded-full z-10 flex-shrink-0"
                      style={{
                        width: 20,
                        height: 20,
                        background: event.type.includes("Exception") ? "rgba(239,68,68,0.08)" : "rgba(107,140,255,0.08)",
                        color: event.type.includes("Exception") ? "#ef4444" : "#6b8cff",
                        border: "1px solid var(--border)"
                      }}
                    >
                      <span style={{ fontSize: 8.5, fontWeight: 800 }}>{eIdx + 1}</span>
                    </div>

                    {/* Timeline Event Details */}
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 11.5, fontWeight: 650, color: "var(--foreground)" }}>
                        {event.type}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.35 }}>
                        {event.title}
                      </span>
                      <span style={{ fontSize: 9.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", marginTop: 1 }}>
                        {event.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: 0 }} />

          {/* Section 3: Action Audit Timeline */}
          <div className="flex flex-col gap-3">
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
              AUDIT TRAIL LOGS
            </span>

            <div className="flex flex-col pl-2.5 relative">
              {activeEmail.auditLogs.map((log, lIdx) => {
                const isLast = lIdx === activeEmail.auditLogs.length - 1;
                return (
                  <div key={lIdx} className="flex items-start gap-3 relative pb-4 text-left">
                    {/* Vertical connector line */}
                    {!isLast && (
                      <div className="absolute w-0.5" style={{ left: 10, top: 18, bottom: 0, background: "var(--border)" }} />
                    )}

                    {/* Timeline Check icon */}
                    <div
                      className="flex items-center justify-center rounded-full z-10 flex-shrink-0"
                      style={{
                        width: 20,
                        height: 20,
                        background: log.actor === "System" ? "var(--secondary)" : "rgba(34,197,94,0.08)",
                        color: log.actor === "System" ? "var(--muted-foreground)" : "#22c55e",
                        border: "1px solid var(--border)"
                      }}
                    >
                      <CheckCircle2 size={11} />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div style={{ fontSize: 11, fontWeight: 650, color: "var(--foreground)" }}>
                        {log.event}{" "}
                        <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>
                          by {log.actor}
                        </span>
                      </div>
                      {log.details && (
                        <p className="m-0" style={{ fontSize: 10.5, color: "var(--secondary-foreground)", lineHeight: 1.35 }}>
                          {log.details}
                        </p>
                      )}
                      <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", marginTop: 1 }}>
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Refresh mock state helper button */}
        <div className="p-3 border-t border-border flex justify-center bg-secondary/10">
          <button
            onClick={() => {
              setQueue(INITIAL_QUEUE_DATA);
              setSelectedTxnIds([]);
              setActiveExceptionId(null);
              setActivePlanAction(null);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-secondary hover:bg-accent transition-colors border text-xs cursor-pointer text-muted-foreground"
            title="Reset queue state"
          >
            <RotateCcw size={11} /> Reset Demonstration State
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
                {/* Simulated doc details based on preview file name */}
                {previewFile.name.includes("remittance") ? (
                  <div className="flex flex-col gap-4 text-left">
                    <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 m-0">REMITTANCE ADVICE DETAILS</h4>
                        <span className="text-[10px] text-gray-400 font-mono">Doc ref: REM-ACME-0021</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-base text-gray-900 font-bold font-mono">₹1,15,000.00</strong>
                        <p className="text-[10px] text-emerald-500 font-semibold m-0">Paid via NEFT</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase m-0">Payer Information</p>
                        <p className="font-semibold text-gray-800 m-0">Acme Corp</p>
                        <p className="text-gray-500 m-0">Plot 5, SIPCOT, Chennai</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase m-0">Beneficiary</p>
                        <p className="font-semibold text-gray-800 m-0">DataTwin AI Ltd</p>
                        <p className="text-gray-500 m-0">billing@datatwin.ai</p>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse mt-4">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="p-2 text-[9px] font-bold text-gray-400 uppercase">Invoice Reference</th>
                          <th className="p-2 text-[9px] font-bold text-gray-400 uppercase text-right">Invoice Amt</th>
                          <th className="p-2 text-[9px] font-bold text-gray-400 uppercase text-right">Credit Used</th>
                          <th className="p-2 text-[9px] font-bold text-gray-400 uppercase text-right">Net Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100 text-gray-700">
                          <td className="p-2 font-mono">INV-2026-004</td>
                          <td className="p-2 text-right font-mono">₹1,00,000.00</td>
                          <td className="p-2 text-right font-mono text-emerald-500">-₹5,000.00 (CN-002)</td>
                          <td className="p-2 text-right font-mono font-semibold">₹95,000.00</td>
                        </tr>
                        <tr className="border-b border-gray-100 text-gray-700">
                          <td className="p-2 font-mono">INV-2026-008</td>
                          <td className="p-2 text-right font-mono">₹30,000.00</td>
                          <td className="p-2 text-right font-mono">₹0.00</td>
                          <td className="p-2 text-right font-mono font-semibold">₹20,000.00</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex flex-col gap-1 text-[10px] text-gray-400 leading-normal border-t border-gray-100 pt-4">
                      <span>Remittance breakdown note:</span>
                      <span className="italic text-gray-500">"CN-002 generated internally for returned defective monitors from Order SO-1004. Total wire transaction: ₹1,15,000.00"</span>
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

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase m-0">Originating Account</p>
                        <p className="font-semibold text-gray-800 m-0">TechSupply Co Receivables</p>
                        <p className="text-gray-500 m-0">State Bank of India · XXXXX1902</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase m-0">Target Bank Account</p>
                        <p className="font-semibold text-gray-800 m-0">DataTwin Operating Cash</p>
                        <p className="text-gray-500 m-0">HDFC Corporate · XXXXX8871</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2 p-3 bg-gray-50 rounded-xl border text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transaction ID:</span>
                        <span className="font-mono text-gray-700">SBI9981277321</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date/Time Processed:</span>
                        <span className="font-mono text-gray-700">24 Jun 2026, 14:15:02</span>
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

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase m-0">Issued By (Vendor)</p>
                        <p className="font-semibold text-gray-800 m-0">NextLevel IT Corp</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase m-0">Issued To (Buyer)</p>
                        <p className="font-semibold text-gray-800 m-0">DataTwin AI Ltd</p>
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
                      <div className="flex justify-between">
                        <span className="text-gray-400">Refund Method:</span>
                        <span className="text-gray-700">Bank Credit Transfer (RTGS)</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center border-t border-gray-100 pt-4 mt-6">
                  <span className="text-[10px] text-gray-400 font-mono">
                    Security verified · DataTwin OCR Parser
                  </span>
                </div>
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
