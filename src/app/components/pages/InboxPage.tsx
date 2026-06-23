import { useState, useEffect } from "react";
import { ShoppingCart, Receipt, Store, Building2, RefreshCw, FileSearch, Inbox } from "lucide-react";

export type InboxItemType = "Purchase Order" | "Invoice" | "Vendor" | "Bill";

export interface InboxItem {
  id: string;
  type: InboxItemType;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
}

export const initialItems: InboxItem[] = [
  { id: "1", type: "Vendor", title: "New Vendor Created", description: "TechSupply Co has been onboarded as an active vendor.", timestamp: "2 min ago", unread: true },
  { id: "2", type: "Purchase Order", title: "PO Approved", description: "PO-2026-006 approved by Sundar Rajan — ₹11,20,660", timestamp: "18 min ago", unread: true },
  { id: "3", type: "Invoice", title: "Invoice Received", description: "INV-2026-011 from NextLevel IT submitted for review.", timestamp: "45 min ago", unread: true },
  { id: "4", type: "Bill", title: "Bill Validated", description: "INV-2026-004 from Green Facilities has been validated.", timestamp: "1 hr ago", unread: true },
  { id: "5", type: "Purchase Order", title: "PO Rejected", description: "PO-2026-005 rejected — SafeLogistics compliance check failed.", timestamp: "2 hr ago", unread: false },
  { id: "6", type: "Vendor", title: "Vendor Updated", description: "CloudNet Solutions GSTIN updated to 29AABCC1429B1ZP.", timestamp: "3 hr ago", unread: false },
  { id: "7", type: "Purchase Order", title: "PO Pending Approval", description: "PO-2026-009 from MediaBridge is awaiting CFO sign-off.", timestamp: "4 hr ago", unread: false },
  { id: "8", type: "Invoice", title: "Invoice In Progress", description: "INV-2026-007 from SwiftCargo is being verified.", timestamp: "5 hr ago", unread: false },
  { id: "9", type: "Bill", title: "Bill Rejected", description: "INV-2026-005 from SafeLogistics has been rejected due to discrepancy.", timestamp: "6 hr ago", unread: false },
  { id: "10", type: "Vendor", title: "Vendor Suspended", description: "PrintHouse Ltd has been suspended pending audit.", timestamp: "Yesterday", unread: false },
  { id: "11", type: "Purchase Order", title: "New PO Draft", description: "PO-2026-011 created as draft for NextLevel IT.", timestamp: "Yesterday", unread: false },
  { id: "12", type: "Invoice", title: "Invoice Validated", description: "INV-2026-006 from DataVault Inc has been validated and processed.", timestamp: "2 days ago", unread: false },
];

const typeIcon: Record<InboxItemType, React.ReactNode> = {
  "Purchase Order": <ShoppingCart size={16} />,
  "Invoice": <Receipt size={16} />,
  "Vendor": <Store size={16} />,
  "Bill": <Building2 size={16} />,
};

const typeColor: Record<InboxItemType, string> = {
  "Purchase Order": "#6b8cff",
  "Invoice": "#fbbf24",
  "Vendor": "#4ade80",
  "Bill": "#c084fc",
};

const vendorNameToId: Record<string, string> = {
  "TechSupply Co": "VND-001",
  "OfficeMax Pro": "VND-002",
  "CloudNet Solutions": "VND-003",
  "Green Facilities": "VND-004",
  "SafeLogistics": "VND-005",
  "PrintHouse Ltd": "VND-006",
  "DataVault Inc": "VND-007",
  "Cleanroom Services": "VND-008",
  "MediaBridge": "VND-009",
  "SwiftCargo": "VND-010",
  "NextLevel IT": "VND-011",
  "FoodFirst Corp": "VND-012",
};

const tabs = ["All", "Purchase Order", "Invoice", "Vendor", "Bill"] as const;
type Tab = typeof tabs[number];

interface InboxPageProps {
  items: InboxItem[];
  setItems: React.Dispatch<React.SetStateAction<InboxItem[]>>;
  onNavigate?: (page: string, id?: string, mode?: string) => void;
}

export function InboxPage({ items, setItems, onNavigate }: InboxPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [selectedId, setSelectedId] = useState<string>(() => {
    return items.length > 0 ? items[0].id : "";
  });

  const filtered = activeTab === "All" ? items : items.filter(item => item.type === activeTab);
  const activeItem = items.find(i => i.id === selectedId) || filtered[0] || null;

  // Mark as read when active item changes or loads
  useEffect(() => {
    if (activeItem && activeItem.unread) {
      setItems(prev => prev.map(item => item.id === activeItem.id ? { ...item, unread: false } : item));
    }
  }, [activeItem?.id]);

  function toggleRead(id: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, unread: !item.unread } : item));
  }

  function markAllRead() {
    setItems(prev => prev.map(item => ({ ...item, unread: false })));
  }

  const unreadCount = items.filter(i => i.unread).length;

  // Extract ID from title/description
  const idRegex = /(PO-\d{4}-\d{3}|INV-\d{4}-\d{3}|VND-\d{3})/i;
  let matchedId = activeItem ? (activeItem.title.match(idRegex) || activeItem.description.match(idRegex))?.[0] : undefined;

  if (activeItem && !matchedId) {
    // Check if vendor name is mentioned
    const content = `${activeItem.title} ${activeItem.description}`;
    for (const name of Object.keys(vendorNameToId)) {
      if (content.includes(name)) {
        matchedId = vendorNameToId[name];
        break;
      }
    }
  }

  let pageName = "";
  let actionText = "";
  if (matchedId) {
    const cleanId = matchedId.toUpperCase();
    if (cleanId.startsWith("PO-")) {
      pageName = "Purchase Order";
      actionText = "View Purchase Order";
    } else if (cleanId.startsWith("INV-")) {
      pageName = "Bill";
      actionText = "View Invoice / Bill";
    } else if (cleanId.startsWith("VND-")) {
      pageName = "Vendor";
      actionText = "View Vendor";
    }
  }

  return (
    <main className="flex-1 flex flex-row h-full overflow-hidden w-full" style={{ background: "var(--background)" }}>
      {/* Left List Pane */}
      <div
        className="flex flex-col h-full flex-shrink-0"
        style={{
          width: 380,
          minWidth: 380,
          borderRight: "1px solid var(--border)",
          background: "var(--card)",
        }}
      >

        {/* List Tabs */}
        <div className="px-3 py-2 flex-shrink-0" style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex gap-0.5 rounded-lg p-0.5 overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)", width: "100%" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "Purchase Order" ? "PO" : tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    // Select first item of new category
                    const newFiltered = tab === "All" ? items : items.filter(i => i.type === tab);
                    if (newFiltered.length > 0) setSelectedId(newFiltered[0].id);
                  }}
                  className="flex-1 text-center py-1 transition-colors rounded"
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? "var(--foreground)" : "transparent",
                    color: isActive ? "var(--background)" : "var(--muted-foreground)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <RefreshCw size={24} style={{ color: "var(--muted-foreground)" }} />
              <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No notifications.</p>
            </div>
          ) : (
            filtered.map(item => {
              const isSelected = activeItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="flex items-start gap-3 rounded-xl p-3 text-left w-full transition-colors"
                  style={{
                    background: isSelected ? "var(--accent)" : "transparent",
                    border: `1px solid ${isSelected ? "var(--border)" : "transparent"}`,
                    cursor: "pointer",
                  }}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 28, height: 28, background: `${typeColor[item.type]}18`, color: typeColor[item.type], marginTop: 2 }}>
                    {typeIcon[item.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span style={{ fontSize: 13, fontWeight: item.unread || isSelected ? 600 : 400, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0 }}>{item.timestamp}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Unread indicator dot */}
                  {item.unread && (
                    <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: "#f87171", marginTop: 6 }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Reading Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0" style={{ background: "var(--card)" }}>

        {/* Pane Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          {activeItem ? (
            <div className="flex flex-col gap-4">
              {/* Category, Status & Timestamp Row */}
              <div className="flex items-center justify-between">
                <span className="rounded-full px-2.5 py-0.5"
                  style={{ fontSize: 11, fontWeight: 600, background: `${typeColor[activeItem.type]}18`, color: typeColor[activeItem.type] }}>
                  {activeItem.type.toUpperCase()}
                </span>
                <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{activeItem.timestamp}</span>
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                {activeItem.title}
              </h2>

              <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

              {/* Description */}
              <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.6 }}>
                {activeItem.description}
              </p>

              {/* Action/Linked Document Card */}
              {matchedId && (
                <div className="mt-4 rounded-xl p-4 flex items-center justify-between" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}>
                      <FileSearch size={18} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Linked Document</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{matchedId}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate?.(pageName, matchedId, "from_inbox")}
                    className="rounded-lg px-3.5 py-1.5 transition-colors"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      background: "var(--foreground)",
                      color: "var(--background)",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    {actionText}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Inbox size={48} style={{ color: "var(--muted-foreground)" }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>No notification selected</h3>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Choose an item from the inbox pane on the left to read its full details.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
