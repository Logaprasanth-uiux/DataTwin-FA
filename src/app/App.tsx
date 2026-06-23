import { useState, useEffect, useRef } from "react";
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
};

const ALL_CARDS = [
  { id: "po",       label: "Purchase Order" },
  { id: "invoice",  label: "Invoice" },
  { id: "approval", label: "Approvals" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  });
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
  const hasOwnHeader = ["Approvals"].includes(active);

  return (
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
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 30, height: 30, background: "var(--accent)", fontSize: 11, fontWeight: 600, color: "var(--foreground)", flexShrink: 0 }}
              >
                AJ
              </div>
              <div className="flex flex-col">
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>Alex Johnson</span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Admin</span>
              </div>
            </div>
          </header>
        )}


        <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {renderContent()}
          </div>
          <AIAssistant onNavigate={handleNavigate} hasHeaderOffset={isListPage || hasOwnHeader} activePage={active} />
        </div>
      </div>
    </div>
  );
}
