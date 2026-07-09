import { createContext, useContext } from "react";

export interface ActivityRecord {
  type: string;
  id: string;
  status?: string;
  createdBy?: string;
  createdDate?: string;
  completion?: number;
}

export interface CollaborationEntry {
  id: string;
  actionId: string;
  type: "discussion" | "task" | "info_request" | "approval_request";
  author: string;
  owner: string;
  timestamp: Date;
  content: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "waiting" | "completed" | "approved" | "rejected" | "cancelled";
  dueDate?: string;
  historyLog?: {
    user: string;
    action: string;
    timestamp: Date;
    note?: string;
  }[];
}

export interface RecordCollabData {
  entries: CollaborationEntry[];
  systemLogs: { text: string; timestamp: Date; stage: string; actor: string }[];
}

export const sessionCache: Record<string, RecordCollabData> = {};

export interface NotificationItem {
  recordId: string;
  recordType: string;
  actionId: string;
  type: string;
  content: string;
  owner: string;
  status: string;
}

export interface PanelContextType {
  activePanel: "ai" | "activity" | null;
  setActivePanel: (panel: "ai" | "activity" | null) => void;
  activeRecord: ActivityRecord | null;
  openActivity: (record: ActivityRecord) => void;
  closeActivity: () => void;
  logout?: () => void;
  pendingNotifications?: NotificationItem[];
  refreshNotifications?: () => void;
  navigateToRecord?: (type: string, id: string) => void;
  activePage?: string;
  setActivePage?: (page: string) => void;
  unreadInboxCount?: number;
  navigationContext?: {
    previousModule: string | null;
    currentModule: string;
    detailPageOrigin: string | null;
  };
  setNavigationContext?: (ctx: { previousModule: string | null; currentModule: string; detailPageOrigin: string | null }) => void;
  activeDetailRecord?: { type: string; id: string; status?: string } | null;
  setActiveDetailRecord?: (record: { type: string; id: string; status?: string } | null) => void;
  headerAction?: React.ReactNode;
  setHeaderAction?: (action: React.ReactNode) => void;
}

export function getInitialMockData(id: string, type: string, status: string): RecordCollabData {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  const entries: CollaborationEntry[] = [];
  const systemLogs: { text: string; timestamp: Date; stage: string; actor: string }[] = [
    { text: "Item Creation: Record initialized in procurement database", timestamp: new Date(now.getTime() - 4 * oneDay), stage: "Draft", actor: "System" },
    { text: "AI Analysis: Document parsed and key fields extracted", timestamp: new Date(now.getTime() - 3.8 * oneDay), stage: "Draft", actor: "AI Agent" },
    { text: "Dependency Identification: Multi-tier matching references identified", timestamp: new Date(now.getTime() - 3.5 * oneDay), stage: "Draft", actor: "AI Agent" },
    { text: "Action Generation: Automated tasks and approval routing generated", timestamp: new Date(now.getTime() - 3.4 * oneDay), stage: "Draft", actor: "AI Agent" },
    { text: "Participant Assignment: Collaboration group defined with Loga, Priya, and Kunal", timestamp: new Date(now.getTime() - 3 * oneDay), stage: "Draft", actor: "System" },
    { text: "Data Collection: Compliance registry status check completed successfully", timestamp: new Date(now.getTime() - 2 * oneDay), stage: "Data Collection", actor: "System" },
    { text: "Verification: Document checklist matching verified by automated compliance check", timestamp: new Date(now.getTime() - 1.5 * oneDay), stage: "Review", actor: "System" },
  ];

  if (type === "Purchase Order") {
    entries.push(
      {
        id: "dsc-1",
        actionId: "DSC-0001",
        type: "discussion",
        author: "Loga",
        owner: "Procurement Team",
        timestamp: new Date(now.getTime() - 2 * oneDay),
        content: "Reviewing delivery terms for Acme Corp. Standard PO template applied with 30-day payment cycle.",
        priority: "low",
        status: "completed"
      },
      {
        id: "tsk-1",
        actionId: "TSK-0001",
        type: "task",
        author: "AI Agent",
        owner: "Priya",
        timestamp: new Date(now.getTime() - oneDay),
        content: "Upload legal commercial specs and vendor schedule verification sheet.",
        priority: "high",
        status: "completed",
        historyLog: [
          { user: "Priya", action: "Uploaded documents and marked task completed", timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), note: "SLA schedule attached to record." }
        ]
      },
      {
        id: "inf-1",
        actionId: "INF-0001",
        type: "info_request",
        author: "AI Agent",
        owner: "Priya",
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        content: "Verify PAN and GST details match registration record for Acme Corp.",
        priority: "medium",
        status: "completed",
        historyLog: [
          { user: "Priya", action: "Submitted Tax registration data", timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), note: "Verified PAN AABCA1234B. Matching active registry status." }
        ]
      },
      {
        id: "apr-1",
        actionId: "APR-0001",
        type: "approval_request",
        author: "AI Agent",
        owner: "Kunal",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        content: "Approve budget allocation of IT-02 hardware upgrades.",
        priority: "critical",
        status: "waiting"
      }
    );
  } else if (type === "Vendor") {
    entries.push(
      {
        id: "tsk-1",
        actionId: "TSK-0001",
        type: "task",
        author: "AI Agent",
        owner: "Kunal",
        timestamp: new Date(now.getTime() - 2 * oneDay),
        content: "Verify bank routing numbers and IFSC code matches bank guarantee document.",
        priority: "critical",
        status: "completed",
        dueDate: "Jun 24, 2026",
        historyLog: [
          { user: "Kunal", action: "Verified bank details", timestamp: new Date(now.getTime() - oneDay), note: "IFSC and branch code match SBI Corporate account." }
        ]
      },
      {
        id: "inf-1",
        actionId: "INF-0001",
        type: "info_request",
        author: "AI Agent",
        owner: "Priya",
        timestamp: new Date(now.getTime() - oneDay),
        content: "Verify MSME registration certificate classification validity.",
        priority: "high",
        status: "waiting"
      },
      {
        id: "apr-1",
        actionId: "APR-0001",
        type: "approval_request",
        author: "AI Agent",
        owner: "Loga",
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        content: "Approve vendor onboarding credential verification.",
        priority: "critical",
        status: "waiting"
      }
    );
  } else if (type === "Bill" || type === "Invoice") {
    entries.push(
      {
        id: "tsk-1",
        actionId: "TSK-0001",
        type: "task",
        author: "AI Agent",
        owner: "Kunal",
        timestamp: new Date(now.getTime() - oneDay),
        content: "Perform validation review on 3-way mismatch flags (quantity variance +/- 2%).",
        priority: "high",
        status: "waiting",
        dueDate: "Jun 25, 2026"
      },
      {
        id: "inf-1",
        actionId: "INF-0001",
        type: "info_request",
        author: "AI Agent",
        owner: "Priya",
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        content: "Provide explanation for quantity mismatch (+2.5%) in line item #4.",
        priority: "medium",
        status: "waiting"
      },
      {
        id: "apr-1",
        actionId: "APR-0001",
        type: "approval_request",
        author: "AI Agent",
        owner: "Loga",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        content: "Approve payment override for 3-way mismatch flags.",
        priority: "critical",
        status: "waiting"
      }
    );
  } else if (type === "Contract") {
    entries.push(
      {
        id: "tsk-1",
        actionId: "TSK-0001",
        type: "task",
        author: "AI Agent",
        owner: "Priya",
        timestamp: new Date(now.getTime() - oneDay),
        content: "Review non-compete clause compliance with regional guidelines.",
        priority: "high",
        status: "waiting"
      },
      {
        id: "apr-1",
        actionId: "APR-0001",
        type: "approval_request",
        author: "AI Agent",
        owner: "Kunal",
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        content: "Approve liability indemnity clause exception.",
        priority: "critical",
        status: "waiting"
      }
    );
  } else {
    entries.push(
      {
        id: "tsk-1",
        actionId: "TSK-0001",
        type: "task",
        author: "AI Agent",
        owner: "Kunal",
        timestamp: new Date(now.getTime() - oneDay),
        content: "Onboard corporate registry tax certificates and audit trail verification.",
        priority: "medium",
        status: "waiting"
      }
    );
  }

  return { entries, systemLogs };
}

export function initializeDefaultCache() {
  const defaults = [
    { id: "PO-2026-001", type: "Purchase Order", status: "Approved" },
    { id: "PO-2026-002", type: "Purchase Order", status: "Sent" },
    { id: "PO-2026-003", type: "Purchase Order", status: "Draft" },
    { id: "VND-001", type: "Vendor", status: "Active" },
    { id: "VND-002", type: "Vendor", status: "Active" },
    { id: "PO-2026-009", type: "Purchase Order", status: "Pending Approval" },
    { id: "PO-2026-012", type: "Purchase Order", status: "Approved" }
  ];
  
  defaults.forEach(item => {
    if (!sessionCache[item.id]) {
      sessionCache[item.id] = getInitialMockData(item.id, item.type, item.status);
    }
  });
}

export const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function useActivity() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error("useActivity must be used within a PanelProvider");
  }
  return context;
}
