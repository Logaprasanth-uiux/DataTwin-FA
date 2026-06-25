import { useState, useEffect, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
import { PanelContext, ActivityRecord, NotificationItem, sessionCache, initializeDefaultCache } from "./contexts";
import { ActivityWorkspace } from "./components/ActivityWorkspace";
import { Sidebar } from "./components/Sidebar";
import { StatusCard } from "./components/StatusCard";
import { CompanySwitch } from "./components/CompanySwitch";
import { DateRangeFilter } from "./components/DateRangeFilter";
import { AIAssistant } from "./components/AIAssistant";
import { OrganizationPage } from "./components/pages/OrganizationPage";
import { VendorPage } from "./components/pages/VendorPage";
import { PurchaseOrderPage } from "./components/pages/PurchaseOrderPage";
import { BillPage } from "./components/pages/BillPage";
import { InboxPage, initialItems, InboxItem } from "./components/pages/InboxPage";
import { ApprovalsPage } from "./components/pages/ApprovalsPage";
import { OverviewPage } from "./components/pages/OverviewPage";
import { LoginPage } from "./components/pages/LoginPage";
import { UserProfile } from "./components/UserProfile";
import { TransactionHubPage } from "./components/pages/TransactionHubPage";

function currentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from, to };
}

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

const pageTitles: Record<string, string> = {
  Overview: "Overview",
  Approvals: "Approvals",
  Inbox: "Inbox",
  Report: "Report",
  Organization: "Organization",
  Vendor: "Vendor",
  "Purchase Order": "Purchase Order",
  Bill: "Bill",
  "Transaction Hub": "Transaction Hub",
};

const ALL_CARDS = [
  { id: "po",       label: "Purchase Order" },
  { id: "invoice",  label: "Invoice" },
  { id: "approval", label: "Approvals" },
];

export default function App() {
  const [activePanel, setActivePanel] = useState<"ai" | "activity" | null>("ai");
  const [activeRecord, setActiveRecord] = useState<ActivityRecord | null>(null);

  const openActivity = (record: ActivityRecord) => {
    setActiveRecord(record);
    setActivePanel("activity");
  };

  const closeActivity = () => {
    setActivePanel(null);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  });

  const [showLoginToast, setShowLoginToast] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshNotifications = () => {
    initializeDefaultCache();
    const items: NotificationItem[] = [];
    Object.entries(sessionCache).forEach(([recordId, data]) => {
      let recordType = "Organization";
      if (recordId.startsWith("PO-")) recordType = "Purchase Order";
      else if (recordId.startsWith("VND-")) recordType = "Vendor";
      else if (recordId.startsWith("Bill-") || recordId.startsWith("INV-")) recordType = "Bill";
      else if (recordId.startsWith("CT-")) recordType = "Contract";
      
      data.entries.forEach(entry => {
        if (entry.status === "open" || entry.status === "waiting") {
          items.push({
            recordId,
            recordType,
            actionId: entry.actionId,
            type: entry.type,
            content: entry.content,
            owner: entry.owner,
            status: entry.status
          });
        }
      });
    });
    setNotifications(items);
  };

  useEffect(() => {
    initializeDefaultCache();
    refreshNotifications();
  }, []);

  const navigateToRecord = (recordType: string, recordId: string) => {
    let pageName = "Overview";
    if (recordType === "Purchase Order") pageName = "Purchase Order";
    else if (recordType === "Bill") pageName = "Bill";
    else if (recordType === "Vendor") pageName = "Vendor";
    else if (recordType === "Organization") pageName = "Organization";
    
    handleNavigate(pageName, recordId, "from_inbox");
    openActivity({
      type: recordType,
      id: recordId,
      status: "Approved",
      createdBy: "Alex Johnson",
      createdDate: "Jun 01, 2026"
    });
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    setActivePanel(null);
    setActiveRecord(null);
    setActive("Overview");
    setHighlightId(undefined);
    setPoPrefill(undefined);
    setNavReferrer(undefined);
    setCustomizeOpen(false);
  };
  const [dark, setDark] = useState(() => {
    document.documentElement.classList.remove("dark");
    return false;
  });
  const [active, setActive] = useState("Overview");
  const [highlightId, setHighlightId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState(currentMonthRange);
  const [visibleCards, setVisibleCards] = useState<string[]>(["po", "invoice", "approval"]);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [poPrefill, setPoPrefill] = useState<Record<string, string> | undefined>();
  const customizeRef = useRef<HTMLDivElement>(null);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(initialItems);
  const [navReferrer, setNavReferrer] = useState<string | undefined>();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customizeRef.current && !customizeRef.current.contains(e.target as Node)) setCustomizeOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={() => {
          setIsLoggedIn(true);
          sessionStorage.setItem("isLoggedIn", "true");
          setShowLoginToast(true);
          setTimeout(() => setShowLoginToast(false), 8000);
        }}
      />
    );
  }

  function handleNavigate(page: string, id?: string, mode?: string) {
    setActive(page);
    setHighlightId(id);
    setNavReferrer(mode);
    if (mode?.startsWith("new_prefill:")) {
      try {
        const parsed = JSON.parse(mode.slice("new_prefill:".length)) as Record<string, string>;
        setPoPrefill(parsed);
      } catch { /* ignore */ }
    } else if (mode === "new") {
      setPoPrefill(undefined);
    }
  }



  function renderContent() {
    switch (active) {
      case "Organization":
        return <OrganizationPage />;
      case "Vendor":
        return <VendorPage highlightId={highlightId} prefill={poPrefill} navReferrer={navReferrer} onBackToInbox={() => handleNavigate("Inbox")} />;
      case "Purchase Order":
        return (
          <PurchaseOrderPage
            highlightId={highlightId}
            prefill={poPrefill}
            navReferrer={navReferrer}
            onBackToInbox={() => handleNavigate("Inbox")}
            onBackToOverview={() => handleNavigate("Overview", undefined, "from_tree")}
          />
        );
      case "Bill":
        return (
          <BillPage
            highlightId={highlightId}
            prefill={poPrefill}
            navReferrer={navReferrer}
            onBackToInbox={() => handleNavigate("Inbox")}
            onBackToOverview={() => handleNavigate("Overview", undefined, "from_tree")}
          />
        );
      case "Inbox":
        return <InboxPage items={inboxItems} setItems={setInboxItems} onNavigate={handleNavigate} />;
      case "Transaction Hub":
        return <TransactionHubPage />;
      case "Approvals":
        return <ApprovalsPage />;
      case "Overview":
        return (
          <OverviewPage
            onNavigate={handleNavigate}
            dateRange={dateRange}
            setDateRange={setDateRange}
            visibleCards={visibleCards}
            setVisibleCards={setVisibleCards}
            customizeOpen={customizeOpen}
            setCustomizeOpen={setCustomizeOpen}
            dark={dark}
          />
        );
      default:
        return (
          <main className="flex-1 overflow-y-auto px-8 py-6 flex items-center justify-center">
            <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{active} — coming soon.</p>
          </main>
        );
    }
  }

  const isListPage = ["Organization", "Vendor", "Purchase Order", "Bill"].includes(active);
  // Inbox and Approvals have their own inner layout (full page with header inside)
  const hasOwnHeader = ["Approvals", "Transaction Hub"].includes(active);

  return (
    <PanelContext.Provider value={{ 
      activePanel, 
      setActivePanel, 
      activeRecord, 
      openActivity, 
      closeActivity, 
      logout: handleLogout,
      pendingNotifications: notifications,
      refreshNotifications,
      navigateToRecord
    }}>
      <div
        className="flex h-screen w-full overflow-hidden"
        style={{ background: "var(--background)", fontFamily: "var(--font-family)" }}
      >
        <Sidebar
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          active={active}
          onSetActive={(l) => { setActive(l); setHighlightId(undefined); }}
          inboxItems={inboxItems}
          setInboxItems={setInboxItems}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar — hidden for list pages and pages with their own header */}
          {!isListPage && !hasOwnHeader && (
            <header
              className="flex items-center justify-between px-8"
              style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}
            >
              <div className="flex items-center gap-3">
                <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                  {pageTitles[active]}
                </h1>
                {(active === "Overview" || active === "Inbox") && (
                  <>
                    <span style={{ color: "var(--border)", fontSize: 18 }}>/</span>
                    <CompanySwitch />
                  </>
                )}
              </div>
              <UserProfile size="md" />
            </header>
          )}


          <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
              {renderContent()}
            </div>
            {active !== "Transaction Hub" && (
              <AIAssistant onNavigate={handleNavigate} hasHeaderOffset={isListPage || hasOwnHeader} activePage={active} />
            )}
            {active !== "Transaction Hub" && activePanel === "activity" && (
              <ActivityWorkspace hasHeaderOffset={isListPage || hasOwnHeader} />
            )}
          </div>
        </div>
        {/* Floating Welcome Toast on Login */}
        {showLoginToast && (
          <div
            className="fixed bottom-6 right-6 rounded-xl p-4 flex flex-col gap-2 transition-all duration-300"
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--border)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              zIndex: 1000,
              maxWidth: 320,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                <AlertCircle size={16} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>Welcome back, Alex!</span>
              <button onClick={() => setShowLoginToast(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={12} />
              </button>
            </div>
            <p className="m-0" style={{ fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
              You have {notifications.length} pending procurement items requiring your attention. Check the notification bell for details.
            </p>
          </div>
        )}
      </div>
    </PanelContext.Provider>
  );
}
