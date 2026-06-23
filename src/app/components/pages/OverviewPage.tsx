import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
  ShoppingCart,
  Receipt,
  Download,
  Eye,
  Activity,
  History,
  PlusCircle,
  TrendingUp,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Building
} from "lucide-react";
import { DateRangeFilter } from "../DateRangeFilter";
import { StatusCard } from "../StatusCard";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface InvoiceNode {
  id: string;
  date: string;
  amount: number;
  status: "Received" | "In Progress" | "Validated" | "Rejected" | "Paid";
  dueDate: string;
  paymentStatus: "Paid" | "Unpaid" | "Overdue";
}

interface PONode {
  id: string;
  date: string;
  value: number;
  consumedAmount: number;
  status: "Draft" | "Sent" | "Approved" | "Closed";
  invoices: InvoiceNode[];
}

interface ContractNode {
  id: string;
  name: string;
  vendorName: string;
  value: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Expiring Soon" | "Closed";
  pos: PONode[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_CONTRACTS: ContractNode[] = [
  {
    id: "CT-001",
    name: "Enterprise IT Hardware Agreement",
    vendorName: "TechSupply Co",
    value: 2500000,
    startDate: "01 Jan 2026",
    endDate: "31 Dec 2026",
    status: "Active",
    pos: [
      {
        id: "PO-2026-001",
        date: "01 Jun 2026",
        value: 850000,
        consumedAmount: 850000,
        status: "Approved",
        invoices: [
          {
            id: "INV-2026-001",
            date: "01 Jun 2026",
            amount: 850000,
            status: "Paid",
            dueDate: "01 Jul 2026",
            paymentStatus: "Paid"
          }
        ]
      },
      {
        id: "PO-2026-006",
        date: "08 Jun 2026",
        value: 1120660,
        consumedAmount: 1120660,
        status: "Approved",
        invoices: [
          {
            id: "INV-2026-006",
            date: "08 Jun 2026",
            amount: 1120660,
            status: "Validated",
            dueDate: "08 Jul 2026",
            paymentStatus: "Paid"
          }
        ]
      },
      {
        id: "PO-2026-012",
        date: "16 Jun 2026",
        value: 500000,
        consumedAmount: 0,
        status: "Approved",
        invoices: []
      }
    ]
  },
  {
    id: "CT-002",
    name: "SaaS Licenses & Hosting SLA",
    vendorName: "NextLevel IT",
    value: 1500000,
    startDate: "01 Feb 2026",
    endDate: "31 Jan 2027",
    status: "Active",
    pos: [
      {
        id: "PO-2026-011",
        date: "14 Jun 2026",
        value: 450000,
        consumedAmount: 200000,
        status: "Draft",
        invoices: [
          {
            id: "INV-2026-011",
            date: "14 Jun 2026",
            amount: 200000,
            status: "Received",
            dueDate: "14 Jul 2026",
            paymentStatus: "Unpaid"
          }
        ]
      }
    ]
  },
  {
    id: "CT-003",
    name: "Office Consumables Agreement",
    vendorName: "OfficeMax Pro",
    value: 500000,
    startDate: "01 Mar 2026",
    endDate: "30 Jun 2026",
    status: "Expiring Soon",
    pos: [
      {
        id: "PO-2026-002",
        date: "03 Jun 2026",
        value: 150000,
        consumedAmount: 150000,
        status: "Sent",
        invoices: [
          {
            id: "INV-2026-002",
            date: "03 Jun 2026",
            amount: 150000,
            status: "In Progress",
            dueDate: "03 Jul 2026",
            paymentStatus: "Unpaid"
          }
        ]
      }
    ]
  },
  {
    id: "CT-004",
    name: "Logistics & Delivery Master SLA",
    vendorName: "SafeLogistics",
    value: 1200000,
    startDate: "10 Jan 2026",
    endDate: "31 Dec 2026",
    status: "Closed",
    pos: [
      {
        id: "PO-2026-005",
        date: "07 Jun 2026",
        value: 300000,
        consumedAmount: 300000,
        status: "Closed",
        invoices: [
          {
            id: "INV-2026-005",
            date: "07 Jun 2026",
            amount: 300000,
            status: "Rejected",
            dueDate: "07 Jul 2026",
            paymentStatus: "Unpaid"
          }
        ]
      }
    ]
  }
];

// Helper to format currency
function formatINR(val: number) {
  return "₹ " + val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface OverviewPageProps {
  onNavigate: (page: string, id?: string, mode?: string) => void;
  dateRange: { from: Date; to: Date };
  setDateRange: React.Dispatch<React.SetStateAction<{ from: Date; to: Date }>>;
  visibleCards: string[];
  setVisibleCards: React.Dispatch<React.SetStateAction<string[]>>;
  customizeOpen: boolean;
  setCustomizeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dark: boolean;
}

export function OverviewPage({
  onNavigate,
  dateRange,
  setDateRange,
  visibleCards,
  setVisibleCards,
  customizeOpen,
  setCustomizeOpen,
}: OverviewPageProps) {
  const [currentMode, setCurrentMode] = useState<"dashboard" | "tree">(() => {
    return (sessionStorage.getItem("tree_view_current_mode") as "dashboard" | "tree") || "dashboard";
  });
  const [contractsData, setContractsData] = useState<ContractNode[]>(INITIAL_CONTRACTS);

  // Expanded Nodes state (stores IDs of collapsed/expanded nodes)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    const saved = sessionStorage.getItem("tree_view_expanded_nodes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    const initial: Record<string, boolean> = {};
    INITIAL_CONTRACTS.forEach(c => {
      initial[c.id] = true; // contracts default expanded
      c.pos.forEach(p => {
        initial[p.id] = true; // POs default expanded
      });
    });
    return initial;
  });

  // Tree filters state
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem("tree_view_search_query") || "";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    return sessionStorage.getItem("tree_view_status_filter") || "";
  });
  const [vendorFilter, setVendorFilter] = useState(() => {
    return sessionStorage.getItem("tree_view_vendor_filter") || "";
  });
  const [contractFilter, setContractFilter] = useState(() => {
    return sessionStorage.getItem("tree_view_contract_filter") || "";
  });
  const [poFilter, setPoFilter] = useState(() => {
    return sessionStorage.getItem("tree_view_po_filter") || "";
  });

  const [activeOpenFilter, setActiveOpenFilter] = useState<string | null>(null);

  // Sync to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("tree_view_current_mode", currentMode);
  }, [currentMode]);

  useEffect(() => {
    sessionStorage.setItem("tree_view_expanded_nodes", JSON.stringify(expandedNodes));
  }, [expandedNodes]);

  useEffect(() => {
    sessionStorage.setItem("tree_view_search_query", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("tree_view_status_filter", statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    sessionStorage.setItem("tree_view_vendor_filter", vendorFilter);
  }, [vendorFilter]);

  useEffect(() => {
    sessionStorage.setItem("tree_view_contract_filter", contractFilter);
  }, [contractFilter]);

  useEffect(() => {
    sessionStorage.setItem("tree_view_po_filter", poFilter);
  }, [poFilter]);

  const mainRef = useRef<HTMLDivElement>(null);

  // Restore scroll top
  useEffect(() => {
    const savedScrollTop = sessionStorage.getItem("tree_view_scroll_top");
    if (savedScrollTop && mainRef.current) {
      const top = parseInt(savedScrollTop, 10);
      if (!isNaN(top)) {
        const timer = setTimeout(() => {
          if (mainRef.current) {
            mainRef.current.scrollTop = top;
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentMode]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    sessionStorage.setItem("tree_view_scroll_top", String(e.currentTarget.scrollTop));
  };

  // Dynamic dialog states
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<{ type: "contract" | "po" | "invoice"; data: any } | null>(null);
  const [spendAnalysisData, setSpendAnalysisData] = useState<ContractNode | null>(null);
  const [approvalHistoryPo, setApprovalHistoryPo] = useState<PONode | null>(null);
  const [trackInvoice, setTrackInvoice] = useState<InvoiceNode | null>(null);
  const [invoiceCreatePo, setInvoiceCreatePo] = useState<PONode | null>(null);
  const [newInvoiceData, setNewInvoiceData] = useState({ id: "", date: "", amount: "", status: "Received" as const, dueDate: "" });

  const customizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customizeRef.current && !customizeRef.current.contains(e.target as Node)) {
        setCustomizeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setCustomizeOpen]);

  // Expand/collapse helper
  function toggleNode(id: string) {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function expandAll() {
    const updated: Record<string, boolean> = {};
    contractsData.forEach(c => {
      updated[c.id] = true;
      c.pos.forEach(p => {
        updated[p.id] = true;
      });
    });
    setExpandedNodes(updated);
  }

  // Collapse all contracts AND POs
  function collapseAll() {
    const updated: Record<string, boolean> = {};
    contractsData.forEach(c => {
      updated[c.id] = false;
      c.pos.forEach(p => {
        updated[p.id] = false;
      });
    });
    setExpandedNodes(updated);
  }

  // ─── Filter Logic ───────────────────────────────────────────────────────────

  // Unique vendors for filter selection
  const allVendors = Array.from(new Set(contractsData.map(c => c.vendorName)));

  // Date range checking helper
  function isDateInRange(dateStr: string) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return true;
    return date >= dateRange.from && date <= dateRange.to;
  }

  // Filtering contracts hierarchy
  const filteredContracts = contractsData
    .map(c => {
      // Filter POs
      const matchedPOs = c.pos
        .map(p => {
          // Filter Invoices
          const matchedInvoices = p.invoices.filter(inv => {
            const matchesQuery =
              !searchQuery ||
              inv.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus =
              !statusFilter ||
              inv.status === statusFilter ||
              inv.paymentStatus === statusFilter;
            const matchesDate = isDateInRange(inv.date);

            return matchesQuery && matchesStatus && matchesDate;
          });

          const hasMatchedInvoices = matchedInvoices.length > 0;
          const matchesPoFilter = !poFilter || p.id === poFilter;
          const matchesStatusFilter = !statusFilter || p.status === statusFilter;
          const matchesDate = isDateInRange(p.date);

          const matchesQuery =
            !searchQuery ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase());

          // A PO is included if it directly matches constraints, OR has matched child invoices
          const shouldIncludePO =
            (matchesPoFilter &&
              matchesStatusFilter &&
              matchesDate &&
              (matchesQuery || searchQuery === "")) ||
            hasMatchedInvoices;

          if (shouldIncludePO) {
            return {
              ...p,
              invoices: searchQuery ? matchedInvoices : p.invoices
            };
          }
          return null;
        })
        .filter((p): p is PONode => p !== null);

      const hasMatchedPOs = matchedPOs.length > 0;
      const matchesContractFilter = !contractFilter || c.id === contractFilter;
      const matchesVendorFilter = !vendorFilter || c.vendorName === vendorFilter;
      const matchesStatusFilter = !statusFilter || c.status === statusFilter;

      const matchesQuery =
        !searchQuery ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      // A Contract is included if it directly matches constraints, OR has matching POs
      const shouldIncludeContract =
        (matchesContractFilter &&
          matchesVendorFilter &&
          matchesStatusFilter &&
          (matchesQuery || searchQuery === "")) ||
        hasMatchedPOs;

      if (shouldIncludeContract) {
        return {
          ...c,
          pos: matchedPOs
        };
      }
      return null;
    })
    .filter((c): c is ContractNode => c !== null);

  // ─── Metrics Calculation (Reactive to filters) ────────────────────────────────

  let totalContracts = 0;
  let totalContractValue = 0;
  let totalPOValue = 0;
  let totalInvoiceValue = 0;
  let paidAmount = 0;

  filteredContracts.forEach(c => {
    totalContracts++;
    totalContractValue += c.value;
    c.pos.forEach(p => {
      totalPOValue += p.value;
      p.invoices.forEach(inv => {
        totalInvoiceValue += inv.amount;
        if (inv.status === "Paid" || inv.paymentStatus === "Paid") {
          paidAmount += inv.amount;
        }
      });
    });
  });

  const remainingLiability = Math.max(0, totalPOValue - paidAmount);

  // ─── Actions Execution ───────────────────────────────────────────────────────

  function triggerDownload(fileName: string) {
    alert(`Downloading ${fileName}...`);
  }

  function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceCreatePo) return;
    const amountNum = parseFloat(newInvoiceData.amount) || 0;
    if (!newInvoiceData.id || amountNum <= 0) {
      alert("Please fill in a valid Invoice Number and Amount.");
      return;
    }

    const newInvoice: InvoiceNode = {
      id: newInvoiceData.id,
      date: newInvoiceData.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      amount: amountNum,
      status: newInvoiceData.status,
      dueDate: newInvoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      paymentStatus: newInvoiceData.status === "Paid" ? "Paid" : "Unpaid"
    };

    setContractsData(prev =>
      prev.map(c => ({
        ...c,
        pos: c.pos.map(po => {
          if (po.id !== invoiceCreatePo.id) return po;
          const updatedInvoices = [...po.invoices, newInvoice];
          const newConsumed = po.consumedAmount + amountNum;
          return {
            ...po,
            invoices: updatedInvoices,
            consumedAmount: Math.min(po.value, newConsumed)
          };
        })
      }))
    );

    setInvoiceCreatePo(null);
    setNewInvoiceData({ id: "", date: "", amount: "", status: "Received", dueDate: "" });
    alert(`Invoice ${newInvoice.id} created and linked to ${invoiceCreatePo.id}.`);
  }

  // ─── Status Colors Dictionary ────────────────────────────────────────────────

  const statusColorMap: Record<string, string> = {
    // Contract
    Active: "#4ade80",
    "Expiring Soon": "#fbbf24",
    Closed: "#888896",
    // PO
    Draft: "#888896",
    Sent: "#6b8cff",
    Approved: "#4ade80",
    // Invoice
    Received: "#6b8cff",
    "In Progress": "#fbbf24",
    Validated: "#4ade80",
    Rejected: "#f87171",
    Paid: "#10b981",
    Overdue: "#f87171",
    Unpaid: "#fbbf24"
  };

  // Dashboard Data source items matching inline values
  const purchaseOrderData = {
    title: "Purchase Order",
    items: [
      { label: "Draft", value: 24, color: "#888896" },
      { label: "Sent", value: 18, color: "#6b8cff" },
      { label: "Approved", value: 41, color: "#4ade80" },
      { label: "Rejected", value: 7, color: "#f87171" },
    ],
  };

  const invoiceData = {
    title: "Invoice",
    items: [
      { label: "Received", value: 33, color: "#6b8cff" },
      { label: "In Progress", value: 15, color: "#fbbf24" },
      { label: "Validated", value: 29, color: "#4ade80" },
      { label: "Rejected", value: 5, color: "#f87171" },
    ],
  };

  const approvalData = {
    title: "Approvals",
    items: [
      { label: "Awaiting Approval", value: 12, color: "#fbbf24" },
      { label: "Validated", value: 38, color: "#4ade80" },
      { label: "Change Request", value: 6, color: "#6b8cff" },
      { label: "Rejected", value: 4, color: "#f87171" },
    ],
  };

  return (
    <main
      ref={mainRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5 min-w-0"
    >
      
      {/* ── Contextual Dialog Popups ── */}

      {/* Node Details Sheet */}
      {selectedNodeDetails && (
        <div
          className="flex items-center justify-center"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedNodeDetails(null)}
        >
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ width: 500, background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <FileText size={15} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  {selectedNodeDetails.type.toUpperCase()} DETAILS
                </span>
              </div>
              <button onClick={() => setSelectedNodeDetails(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {Object.entries(selectedNodeDetails.data).map(([key, val]) => {
                if (key === "pos" || key === "invoices") return null;
                return (
                  <div key={key} className="flex flex-col gap-1 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em" }}>
                      {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                      {typeof val === "number" ? formatINR(val) : String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Spend Analysis Chart Modal */}
      {spendAnalysisData && (
        <div
          className="flex items-center justify-center"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={() => setSpendAnalysisData(null)}
        >
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ width: 600, background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <TrendingUp size={15} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  SPEND ANALYSIS: {spendAnalysisData.id}
                </span>
              </div>
              <button onClick={() => setSpendAnalysisData(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{spendAnalysisData.name}</h4>
                <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Vendor: {spendAnalysisData.vendorName}</p>
              </div>

              {/* Progress Chart */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between" style={{ fontSize: 11, fontWeight: 500 }}>
                  <span style={{ color: "var(--muted-foreground)" }}>UTILIZATION BREAKDOWN</span>
                  <span style={{ color: "var(--foreground)" }}>
                    {((spendAnalysisData.pos.reduce((acc, curr) => acc + curr.value, 0) / spendAnalysisData.value) * 100).toFixed(1)}% Allocated
                  </span>
                </div>
                <div className="h-5 rounded-lg overflow-hidden flex" style={{ background: "var(--secondary)" }}>
                  {spendAnalysisData.pos.map((po, index) => {
                    const pct = (po.value / spendAnalysisData.value) * 100;
                    return (
                      <div
                        key={po.id}
                        style={{
                          width: `${pct}%`,
                          background: index === 0 ? "#6b8cff" : index === 1 ? "#4ade80" : "#c084fc",
                        }}
                        title={`${po.id}: ${formatINR(po.value)}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
                  <div className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
                    <span className="rounded-full" style={{ width: 8, height: 8, background: "var(--secondary)" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>Contract Limit ({formatINR(spendAnalysisData.value)})</span>
                  </div>
                  {spendAnalysisData.pos.map((po, index) => (
                    <div key={po.id} className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
                      <span className="rounded-full" style={{ width: 8, height: 8, background: index === 0 ? "#6b8cff" : index === 1 ? "#4ade80" : "#c084fc" }} />
                      <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{po.id} ({formatINR(po.value)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Values grid */}
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="rounded-xl p-3" style={{ background: "var(--secondary)" }}>
                  <p style={{ fontSize: 10, color: "var(--muted-foreground)" }}>TOTAL LIMIT</p>
                  <p style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{formatINR(spendAnalysisData.value)}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--secondary)" }}>
                  <p style={{ fontSize: 10, color: "var(--muted-foreground)" }}>ALLOCATED PO VALUE</p>
                  <p style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                    {formatINR(spendAnalysisData.pos.reduce((acc, curr) => acc + curr.value, 0))}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--secondary)" }}>
                  <p style={{ fontSize: 10, color: "var(--muted-foreground)" }}>INVOICED SPEND</p>
                  <p style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                    {formatINR(spendAnalysisData.pos.reduce((acc, po) => acc + po.invoices.reduce((s, inv) => s + inv.amount, 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval History Modal */}
      {approvalHistoryPo && (
        <div
          className="flex items-center justify-center"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={() => setApprovalHistoryPo(null)}
        >
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ width: 450, background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <History size={15} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  APPROVAL HISTORY: {approvalHistoryPo.id}
                </span>
              </div>
              <button onClick={() => setApprovalHistoryPo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {[
                { step: "Requestor Submission", user: "Kiran Nair (IT Ops)", date: "May 28, 2026", status: "Approved", notes: "PO Draft created and submitted for Q2 supplies." },
                { step: "Budget Verification", user: "Finance Officer", date: "May 30, 2026", status: "Approved", notes: "IT budget clearance confirmed." },
                { step: "Head of Procurement Approval", user: "Sundar Rajan (CPO)", date: "Jun 01, 2026", status: "Approved", notes: "Approved based on negotiated SLA prices." },
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: "rgba(74,222,128,0.15)", border: "1px solid #4ade80", fontSize: 10, fontWeight: 700, color: "#4ade80" }}>
                      ✓
                    </div>
                    {idx < 2 && <div className="w-0.5 bg-border flex-1 my-1" style={{ minHeight: 20 }} />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{step.step}</p>
                    <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{step.user} · {step.date}</p>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>{step.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Status Tracking Timeline Modal */}
      {trackInvoice && (
        <div
          className="flex items-center justify-center"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={() => setTrackInvoice(null)}
        >
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ width: 450, background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Activity size={15} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  INVOICE TRACKING: {trackInvoice.id}
                </span>
              </div>
              <button onClick={() => setTrackInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {[
                { status: "Received", label: "Invoice Uploaded", desc: "Successfully imported system logs.", date: trackInvoice.date, completed: true },
                { status: "In Progress", label: "Verification Checks", desc: "Matching against linked PO quantity and pricing.", date: "Processing complete", completed: trackInvoice.status !== "Received" },
                { status: "Validated", label: "Validation Approved", desc: "Tax rates and compliance guidelines confirmed.", date: "Success", completed: ["Validated", "Paid"].includes(trackInvoice.status) },
                { status: "Paid", label: "Payment Processed", desc: "Bank clearance successfully settled.", date: trackInvoice.status === "Paid" ? "Cleared" : "Pending execution", completed: trackInvoice.status === "Paid" }
              ].map((step, idx) => {
                const color = step.completed ? "#4ade80" : "var(--border)";
                return (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: step.completed ? "rgba(74,222,128,0.1)" : "transparent", border: `2px solid ${color}`, fontSize: 10, fontWeight: 700, color: step.completed ? "#4ade80" : "var(--muted-foreground)" }}>
                        {idx + 1}
                      </div>
                      {idx < 3 && <div className="w-0.5 flex-1 my-1" style={{ background: color, minHeight: 20 }} />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{step.label}</p>
                      <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{step.desc}</p>
                      <p style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{step.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Dialog Form */}
      {invoiceCreatePo && (
        <div
          className="flex items-center justify-center"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={() => setInvoiceCreatePo(null)}
        >
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ width: 500, background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <PlusCircle size={15} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  CREATE INVOICE FOR {invoiceCreatePo.id}
                </span>
              </div>
              <button onClick={() => setInvoiceCreatePo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)" }}>INVOICE NUMBER</label>
                <input
                  required
                  placeholder="e.g. INV-2026-999"
                  value={newInvoiceData.id}
                  onChange={e => setNewInvoiceData(prev => ({ ...prev, id: e.target.value }))}
                  style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)" }}>AMOUNT (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={newInvoiceData.amount}
                    onChange={e => setNewInvoiceData(prev => ({ ...prev, amount: e.target.value }))}
                    style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)" }}>INVOICE DATE</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.date}
                    onChange={e => setNewInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                    style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)" }}>DUE DATE</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.dueDate}
                    onChange={e => setNewInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)" }}>STATUS</label>
                  <select
                    value={newInvoiceData.status}
                    onChange={e => setNewInvoiceData(prev => ({ ...prev, status: e.target.value as any }))}
                    style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px", cursor: "pointer" }}
                  >
                    <option value="Received">Received</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Validated">Validated</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
              
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInvoiceCreatePo(null)}
                  className="rounded-lg px-4 py-2 transition-colors"
                  style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg px-4 py-2"
                  style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
                >
                  Create & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ── Dashboard Mode vs Tree View Mode Header Toggle ── */}

      <div className="flex items-center justify-between pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
        
        {/* Switch View Tabs */}
        <div className="flex gap-0.5 rounded-lg p-0.5 overflow-hidden" style={{ background: "var(--secondary)", border: "1px solid var(--border)", width: "fit-content" }}>
          <button
            onClick={() => setCurrentMode("dashboard")}
            className="px-4 py-1.5 transition-colors rounded-md"
            style={{
              fontSize: 12,
              fontWeight: currentMode === "dashboard" ? 600 : 400,
              background: currentMode === "dashboard" ? "var(--card)" : "transparent",
              color: currentMode === "dashboard" ? "var(--foreground)" : "var(--muted-foreground)",
              border: "none",
              cursor: "pointer",
              minWidth: 100,
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentMode("tree")}
            className="px-4 py-1.5 transition-colors rounded-md"
            style={{
              fontSize: 12,
              fontWeight: currentMode === "tree" ? 600 : 400,
              background: currentMode === "tree" ? "var(--card)" : "transparent",
              color: currentMode === "tree" ? "var(--foreground)" : "var(--muted-foreground)",
              border: "none",
              cursor: "pointer",
              minWidth: 100,
            }}
          >
            Tree View
          </button>
        </div>

        {/* Global Date Filter for Dashboard Mode */}
        {currentMode === "dashboard" && (
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontWeight: 500 }}>Period</span>
            <DateRangeFilter
              from={dateRange.from}
              to={dateRange.to}
              onChange={(from, to) => setDateRange({ from, to })}
            />
            
            {/* Customize button */}
            <div ref={customizeRef} style={{ position: "relative" }}>
              <button
                onClick={() => setCustomizeOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors"
                style={{ fontSize: 12, fontWeight: 500, background: customizeOpen ? "var(--foreground)" : "var(--card)", color: customizeOpen ? "var(--background)" : "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer" }}
              >
                <SlidersHorizontal size={13} /> Customize
              </button>
              {customizeOpen && (
                <div className="absolute rounded-xl overflow-hidden" style={{ top: "calc(100% + 6px)", right: 0, width: 220, background: "var(--popover)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", padding: "10px 14px 6px" }}>VISIBLE CARDS</p>
                  {[
                    { id: "po",       label: "Purchase Order" },
                    { id: "invoice",  label: "Invoice" },
                    { id: "approval", label: "Approvals" },
                  ].map(card => (
                    <button
                      key={card.id}
                      onClick={() => setVisibleCards(v => v.includes(card.id) ? v.filter(x => x !== card.id) : [...v, card.id])}
                      className="flex items-center justify-between w-full px-4 py-2.5 transition-colors"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--foreground)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      {card.label}
                      {visibleCards.includes(card.id) && <span style={{ color: "#4ade80", fontSize: 11 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODE 1: Standard Dashboard ── */}
      {currentMode === "dashboard" && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {visibleCards.includes("po") && <StatusCard {...purchaseOrderData} onClick={() => onNavigate("Purchase Order")} />}
            {visibleCards.includes("invoice") && <StatusCard {...invoiceData} onClick={() => onNavigate("Bill")} />}
            {visibleCards.includes("approval") && <StatusCard {...approvalData} onClick={() => onNavigate("Approvals")} />}
          </div>

          {visibleCards.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No cards visible. Click <strong>Customize</strong> to add cards.</p>
            </div>
          )}
        </div>
      )}


      {/* ── MODE 2: Financial Tree View ── */}
      {currentMode === "tree" && (
        <div className="flex flex-col gap-6">

          {/* dynamic summary panel */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            {[
              { label: "TOTAL CONTRACTS", value: totalContracts, suffix: "" },
              { label: "CONTRACT VALUE", value: totalContractValue, prefix: "₹ " },
              { label: "COMMIT PO VALUE", value: totalPOValue, prefix: "₹ " },
              { label: "INVOICED VALUE", value: totalInvoiceValue, prefix: "₹ " },
              { label: "PAID AMOUNT", value: paidAmount, prefix: "₹ ", color: "#4ade80" },
              { label: "REMAINING LIABILITY", value: remainingLiability, prefix: "₹ ", color: "#6b8cff" },
            ].map(card => (
              <div
                key={card.label}
                className="rounded-xl flex flex-col gap-1.5 px-4 py-3.5"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>
                  {card.label}
                </span>
                <span
                  style={{
                    fontSize: typeof card.value === "number" && card.value > 99999 ? 14 : 20,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: card.color || "var(--foreground)",
                    lineHeight: 1,
                  }}
                >
                  {card.prefix || ""}{typeof card.value === "number" ? card.value.toLocaleString("en-IN") : card.value}
                </span>
              </div>
            ))}
          </div>

          {/* Filter and Search Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div
              className="flex items-center gap-2 rounded-lg px-3 flex-1"
              style={{
                height: 34,
                background: "var(--card)",
                border: "1px solid var(--border)",
                minWidth: 240,
                maxWidth: 400
              }}
            >
              <Search size={13} style={{ color: "var(--muted-foreground)" }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Contracts, Vendors, POs, Invoices…"
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "var(--foreground)",
                  width: "100%",
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dropdown selectors */}
            
            {/* Status Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setActiveOpenFilter(activeOpenFilter === "status" ? null : "status")}
                className="flex items-center gap-1.5 rounded-lg px-3 transition-colors text-xs font-semibold"
                style={{
                  height: 34,
                  background: statusFilter ? "var(--foreground)" : "var(--card)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: statusFilter ? "var(--background)" : "var(--foreground)",
                }}
              >
                <SlidersHorizontal size={11} />
                {statusFilter ? `Status: ${statusFilter}` : "Status"}
                <ChevronDown size={11} />
              </button>
              {activeOpenFilter === "status" && (
                <div className="absolute rounded-lg overflow-hidden flex flex-col shadow-lg" style={{ top: "calc(100% + 4px)", left: 0, background: "var(--popover)", border: "1px solid var(--border)", zIndex: 40, minWidth: 160 }}>
                  <button onClick={() => { setStatusFilter(""); setActiveOpenFilter(null); }} className="px-3 py-2 text-left text-xs transition-colors hover:bg-accent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>All Statuses</button>
                  {["Active", "Expiring Soon", "Closed", "Approved", "Draft", "Sent", "Received", "In Progress", "Validated", "Paid"].map(opt => (
                    <button key={opt} onClick={() => { setStatusFilter(opt); setActiveOpenFilter(null); }} className="px-3 py-2 text-left text-xs transition-colors hover:bg-accent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>{opt}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Vendor Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setActiveOpenFilter(activeOpenFilter === "vendor" ? null : "vendor")}
                className="flex items-center gap-1.5 rounded-lg px-3 transition-colors text-xs font-semibold"
                style={{
                  height: 34,
                  background: vendorFilter ? "var(--foreground)" : "var(--card)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: vendorFilter ? "var(--background)" : "var(--foreground)",
                }}
              >
                <Building size={11} />
                {vendorFilter ? `Vendor: ${vendorFilter}` : "Vendor"}
                <ChevronDown size={11} />
              </button>
              {activeOpenFilter === "vendor" && (
                <div className="absolute rounded-lg overflow-hidden flex flex-col shadow-lg" style={{ top: "calc(100% + 4px)", left: 0, background: "var(--popover)", border: "1px solid var(--border)", zIndex: 40, minWidth: 160 }}>
                  <button onClick={() => { setVendorFilter(""); setActiveOpenFilter(null); }} className="px-3 py-2 text-left text-xs transition-colors hover:bg-accent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>All Vendors</button>
                  {allVendors.map(v => (
                    <button key={v} onClick={() => { setVendorFilter(v); setActiveOpenFilter(null); }} className="px-3 py-2 text-left text-xs transition-colors hover:bg-accent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>{v}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Contract Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setActiveOpenFilter(activeOpenFilter === "contract" ? null : "contract")}
                className="flex items-center gap-1.5 rounded-lg px-3 transition-colors text-xs font-semibold"
                style={{
                  height: 34,
                  background: contractFilter ? "var(--foreground)" : "var(--card)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: contractFilter ? "var(--background)" : "var(--foreground)",
                }}
              >
                <FileText size={11} />
                {contractFilter ? `Contract: ${contractFilter}` : "Contract"}
                <ChevronDown size={11} />
              </button>
              {activeOpenFilter === "contract" && (
                <div className="absolute rounded-lg overflow-hidden flex flex-col shadow-lg" style={{ top: "calc(100% + 4px)", left: 0, background: "var(--popover)", border: "1px solid var(--border)", zIndex: 40, minWidth: 160 }}>
                  <button onClick={() => { setContractFilter(""); setActiveOpenFilter(null); }} className="px-3 py-2 text-left text-xs transition-colors hover:bg-accent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>All Contracts</button>
                  {contractsData.map(c => (
                    <button key={c.id} onClick={() => { setContractFilter(c.id); setActiveOpenFilter(null); }} className="px-3 py-2 text-left text-xs transition-colors hover:bg-accent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>{c.id}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Order Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setActiveOpenFilter(activeOpenFilter === "po" ? null : "po")}
                className="flex items-center gap-1.5 rounded-lg px-3 transition-colors text-xs font-semibold"
                style={{
                  height: 34,
                  background: poFilter ? "var(--foreground)" : "var(--card)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: poFilter ? "var(--background)" : "var(--foreground)",
                }}
              >
                <ShoppingCart size={11} />
                {poFilter ? `PO: ${poFilter}` : "PO"}
                <ChevronDown size={11} />
              </button>
              {activeOpenFilter === "po" && (
                <div className="absolute rounded-lg overflow-hidden flex flex-col shadow-lg" style={{ top: "calc(100% + 4px)", left: 0, background: "var(--popover)", border: "1px solid var(--border)", zIndex: 40, minWidth: 160 }}>
                  <button onClick={() => { setPoFilter(""); setActiveOpenFilter(null); }} className="px-3 py-2 text-left text-xs transition-colors hover:bg-accent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>All POs</button>
                  {contractsData.reduce((acc, curr) => [...acc, ...curr.pos], [] as PONode[]).map(po => (
                    <button key={po.id} onClick={() => { setPoFilter(po.id); setActiveOpenFilter(null); }} className="px-3 py-2 text-left text-xs transition-colors hover:bg-accent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>{po.id}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Filter Button */}
            {(searchQuery || statusFilter || vendorFilter || contractFilter || poFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                  setVendorFilter("");
                  setContractFilter("");
                  setPoFilter("");
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-accent text-red-500 font-semibold animate-pulse"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Clear Filters
              </button>
            )}

            {/* Toggle All Expand/Collapse buttons */}
            <div className="flex gap-1 ml-auto">
              <button
                onClick={expandAll}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", cursor: "pointer" }}
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", cursor: "pointer" }}
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Interactive Hierarchical Trees Panel */}
          <div className="flex flex-col gap-6">
            {filteredContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 border rounded-2xl" style={{ borderStyle: "dashed", borderColor: "var(--border)" }}>
                <SlidersHorizontal size={36} style={{ color: "var(--muted-foreground)" }} />
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>No matches found</h4>
                <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Try broadening your search criteria or resetting filters.</p>
              </div>
            ) : (
              filteredContracts.map(c => {
                const isContractExpanded = expandedNodes[c.id];
                const totalAllocated = c.pos.reduce((acc, curr) => acc + curr.value, 0);
                const utilizationPct = Math.min(100, Math.round((totalAllocated / c.value) * 100));

                return (
                  <div key={c.id} className="flex flex-col gap-3">
                    
                    {/* ──── Contract parent Card (Level 1) ──── */}
                    <div
                      className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-4 pl-5 pr-4 py-4 text-left">
                        {/* Expand Collapse Chevron */}
                        <button
                          onClick={() => toggleNode(c.id)}
                          className="flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
                          style={{ width: 24, height: 24, background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}
                        >
                          {isContractExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <div className="flex items-center gap-2 flex-grow min-w-0 flex-1">
                          <div className="rounded-lg p-2 flex-shrink-0" style={{ background: "rgba(107,140,255,0.1)", color: "#6b8cff" }}>
                            <FileText size={18} />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--foreground)",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: "1.3"
                              }}
                            >
                              {c.id} · {c.name}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              Vendor: <strong style={{ color: "var(--foreground)" }}>{c.vendorName}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Middle stats & progress bar */}
                        <div className="flex items-center gap-5 ml-auto flex-shrink-0">
                          
                          {/* Utilization Bar */}
                          <div style={{ width: 100, flexShrink: 0 }} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs" style={{ fontSize: 9, color: "var(--muted-foreground)", fontWeight: 600 }}>
                              <span>UTILIZATION</span>
                              <span style={{ color: "var(--foreground)" }}>{utilizationPct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full" style={{ background: "var(--secondary)" }}>
                              <div className="h-full rounded-full" style={{ width: `${utilizationPct}%`, background: "var(--foreground)" }} />
                            </div>
                          </div>

                          <div style={{ width: 110, flexShrink: 0 }} className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>LIMIT</span>
                            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>{formatINR(c.value)}</span>
                          </div>

                          <div style={{ width: 110, flexShrink: 0 }} className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>REMAINING</span>
                            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>{formatINR(c.value - totalAllocated)}</span>
                          </div>

                          <div style={{ width: 140, flexShrink: 0 }} className="flex flex-col items-end">
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>TIMELINE</span>
                            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{c.startDate} - {c.endDate}</span>
                          </div>

                          {/* Status Badge */}
                          <div style={{ width: 120, flexShrink: 0 }} className="flex justify-end">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                              style={{ background: `${statusColorMap[c.status]}12`, color: statusColorMap[c.status], whiteSpace: "nowrap" }}
                            >
                              <span className="rounded-full" style={{ width: 5, height: 5, background: statusColorMap[c.status], display: "inline-block" }} />
                              {c.status}
                            </span>
                          </div>

                        </div>

                        {/* Action buttons */}
                        <div style={{ width: 230, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
                          <button
                            onClick={() => setSelectedNodeDetails({ type: "contract", data: c })}
                            className="rounded px-2.5 py-1 text-xs transition-colors hover:bg-accent"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 11, fontWeight: 600 }}
                            title="View Details"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => triggerDownload(`${c.id}_Agreement.pdf`)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs border transition-colors hover:bg-accent"
                            style={{ background: "none", borderColor: "var(--border)", cursor: "pointer", color: "var(--foreground)", fontSize: 11 }}
                          >
                            <Download size={11} /> Download
                          </button>
                          <button
                            onClick={() => setSpendAnalysisData(c)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-foreground text-background transition-opacity hover:opacity-90"
                            style={{ border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                          >
                            <Activity size={11} /> Spend Analysis
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ──── Nesting Container for POs (Level 2) ──── */}
                    {isContractExpanded && c.pos.length > 0 && (
                      <div className="flex flex-col gap-3 pl-8 relative">
                        {/* Tree Line Connector */}
                        <div className="absolute left-3.5 top-0 bottom-6 w-0.5" style={{ background: "var(--border)" }} />

                        {c.pos.map(p => {
                          const isPoExpanded = expandedNodes[p.id];
                          const poRemaining = Math.max(0, p.value - p.consumedAmount);
                          const poConsumedPct = Math.min(100, Math.round((p.consumedAmount / p.value) * 100));

                          return (
                            <div key={p.id} className="flex flex-col gap-2 relative">
                              {/* Horizontal connector line */}
                              <div className="absolute -left-4 top-5 w-4 h-0.5" style={{ background: "var(--border)" }} />
                              
                              {/* PO Card */}
                              <div
                                className="rounded-lg overflow-hidden border hover:border-foreground/45 transition-colors"
                                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                              >
                                <div className="flex items-center gap-3 pl-4 pr-4 py-3 text-left">
                                  {/* Expand/Collapse Chevron */}
                                  <button
                                    onClick={() => toggleNode(p.id)}
                                    className="flex items-center justify-center rounded hover:bg-accent transition-colors"
                                    style={{ width: 22, height: 22, background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}
                                  >
                                    {isPoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>

                                  <div className="flex items-center gap-2 flex-grow min-w-0 flex-1">
                                    <div className="rounded p-1.5 flex-shrink-0" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                                      <ShoppingCart size={15} />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.id}</span>
                                      <span style={{ fontSize: 10, color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Issued: {p.date}</span>
                                    </div>
                                  </div>

                                  {/* Middle PO stats */}
                                  <div className="flex items-center gap-5 ml-auto flex-shrink-0">
                                    
                                    {/* PO consumed progress bar */}
                                    <div style={{ width: 100, flexShrink: 0 }} className="flex flex-col gap-0.5">
                                      <div className="flex items-center justify-between text-xs" style={{ fontSize: 8, color: "var(--muted-foreground)", fontWeight: 600 }}>
                                        <span>CONSUMED</span>
                                        <span style={{ color: "var(--foreground)" }}>{poConsumedPct}%</span>
                                      </div>
                                      <div className="h-1.5 w-full rounded-full" style={{ background: "var(--secondary)" }}>
                                        <div className="h-full rounded-full" style={{ width: `${poConsumedPct}%`, background: "#4ade80" }} />
                                      </div>
                                    </div>

                                    <div style={{ width: 110, flexShrink: 0 }} className="flex flex-col items-end">
                                      <span style={{ fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>VALUE</span>
                                      <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>{formatINR(p.value)}</span>
                                    </div>

                                    <div style={{ width: 110, flexShrink: 0 }} className="flex flex-col items-end">
                                      <span style={{ fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>REMAINING</span>
                                      <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>{formatINR(poRemaining)}</span>
                                    </div>

                                    <div style={{ width: 140, flexShrink: 0 }} className="flex flex-col items-end">
                                      <span style={{ fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>ISSUED</span>
                                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{p.date}</span>
                                    </div>

                                    <div style={{ width: 120, flexShrink: 0 }} className="flex justify-end">
                                      <span
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                        style={{ background: `${statusColorMap[p.status]}12`, color: statusColorMap[p.status], whiteSpace: "nowrap" }}
                                      >
                                        {p.status}
                                      </span>
                                    </div>

                                  </div>

                                  {/* PO action buttons */}
                                  <div style={{ width: 230, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
                                    <button
                                      onClick={() => onNavigate("Purchase Order", p.id, "from_tree")}
                                      className="rounded px-2 py-1 text-xs transition-colors hover:bg-accent"
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}
                                    >
                                      Details
                                    </button>
                                    <button
                                      onClick={() => setApprovalHistoryPo(p)}
                                      className="flex items-center gap-1 rounded px-2 py-1 text-xs border transition-colors hover:bg-accent"
                                      style={{ background: "none", borderColor: "var(--border)", cursor: "pointer", color: "var(--foreground)", fontSize: 10 }}
                                    >
                                      <History size={10} /> History
                                    </button>
                                    {p.status === "Approved" && (
                                      <button
                                        onClick={() => {
                                          setInvoiceCreatePo(p);
                                          setNewInvoiceData(d => ({ ...d, date: new Date().toISOString().split("T")[0] }));
                                        }}
                                        className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-foreground text-background transition-opacity hover:opacity-90"
                                        style={{ border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600 }}
                                      >
                                        <PlusCircle size={10} /> Create Invoice
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* ──── Nesting Container for Invoices (Level 3) ──── */}
                              {isPoExpanded && p.invoices.length > 0 && (
                                <div className="flex flex-col gap-2 pl-8 relative">
                                  {/* Secondary connector line */}
                                  <div className="absolute left-3.5 top-0 bottom-4 w-0.5" style={{ background: "var(--border)", borderStyle: "dashed" }} />

                                  {p.invoices.map(inv => (
                                    <div key={inv.id} className="relative flex items-center animate-fade-in">
                                      {/* Horizontal connector link */}
                                      <div className="absolute -left-4 top-4.5 w-4 h-0.5" style={{ background: "var(--border)", borderStyle: "dashed" }} />
                                      
                                      {/* Invoice Card */}
                                      <div
                                        className="rounded-lg w-full border hover:border-foreground/35 transition-colors"
                                        style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                                      >
                                        <div className="flex items-center justify-between pl-4 pr-4 py-2.5 text-left">
                                          <div className="flex items-center gap-2.5 flex-grow min-w-0 flex-1">
                                            <div className="rounded p-1 flex-shrink-0" style={{ background: "rgba(192,132,252,0.1)", color: "#c084fc" }}>
                                              <Receipt size={13} />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inv.id}</span>
                                              <span style={{ fontSize: 9, color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Invoiced: {inv.date}</span>
                                            </div>
                                          </div>

                                          {/* Middle Invoice stats */}
                                          <div className="flex items-center gap-5 ml-auto flex-shrink-0">
                                            {/* Col 1: Progress Spacer */}
                                            <div style={{ width: 100, flexShrink: 0 }} />

                                            {/* Col 2: Amount */}
                                            <div style={{ width: 110, flexShrink: 0 }} className="flex flex-col items-end">
                                              <span style={{ fontSize: 7, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>AMOUNT</span>
                                              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>{formatINR(inv.amount)}</span>
                                            </div>

                                            {/* Col 3: Due */}
                                            <div style={{ width: 110, flexShrink: 0 }} className="flex flex-col items-end">
                                              <span style={{ fontSize: 7, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>DUE</span>
                                              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{inv.dueDate}</span>
                                            </div>

                                            {/* Col 4: Date Invoiced */}
                                            <div style={{ width: 140, flexShrink: 0 }} className="flex flex-col items-end">
                                              <span style={{ fontSize: 7, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>INVOICED</span>
                                              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{inv.date}</span>
                                            </div>

                                            {/* Col 5: Badges */}
                                            <div style={{ width: 120, flexShrink: 0 }} className="flex justify-end items-center gap-1">
                                              <span
                                                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold"
                                                style={{ fontSize: 10, background: `${statusColorMap[inv.status]}10`, color: statusColorMap[inv.status], whiteSpace: "nowrap" }}
                                              >
                                                {inv.status}
                                              </span>
                                              <span
                                                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold"
                                                style={{ fontSize: 10, background: `${statusColorMap[inv.paymentStatus]}10`, color: statusColorMap[inv.paymentStatus], whiteSpace: "nowrap" }}
                                              >
                                                {inv.paymentStatus}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Invoice action buttons */}
                                          <div style={{ width: 230, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
                                            <button
                                              onClick={() => onNavigate("Bill", inv.id, "from_tree")}
                                              className="rounded px-1 py-0.5 text-xs transition-colors hover:bg-accent"
                                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 9, fontWeight: 600 }}
                                            >
                                              Details
                                            </button>
                                              <button
                                                onClick={() => triggerDownload(`${inv.id}.pdf`)}
                                                className="flex items-center gap-1 rounded px-1 py-0.5 text-xs border transition-colors hover:bg-accent"
                                                style={{ background: "none", borderColor: "var(--border)", cursor: "pointer", color: "var(--foreground)", fontSize: 9 }}
                                                title="Download PDF"
                                              >
                                                <Download size={9} /> PDF
                                              </button>
                                              <button
                                                onClick={() => setTrackInvoice(inv)}
                                                className="flex items-center gap-1 rounded px-1 py-0.5 text-xs bg-foreground text-background transition-opacity hover:opacity-90"
                                                style={{ border: "none", cursor: "pointer", fontSize: 9, fontWeight: 600 }}
                                              >
                                                Track
                                              </button>
                                            </div>

                                          </div>
                                        </div>
                                      </div>
                                  ))}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </main>
  );
}
