import { useState, useRef, useEffect } from "react";
import { 
  X, 
  BotMessageSquare, 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  User, 
  Building, 
  Receipt, 
  ShoppingCart, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Send,
  HelpCircle,
  ShieldCheck,
  Plus
} from "lucide-react";
import { 
  useActivity, 
  sessionCache, 
  getInitialMockData, 
  CollaborationEntry, 
  RecordCollabData 
} from "../contexts";

interface ActivityWorkspaceProps {
  hasHeaderOffset?: boolean;
  isEmbedded?: boolean;
}

interface Participant {
  initials: string;
  name: string;
  role: string;
  team: string;
}

const getRecordParticipants = (type: string): Participant[] => {
  if (type === "Purchase Order") {
    return [
      { initials: "LO", name: "Loga", role: "Procurement Lead", team: "Procurement" },
      { initials: "KU", name: "Kunal", role: "Finance Controller", team: "Finance" },
      { initials: "PR", name: "Priya", role: "Legal Counsel", team: "Legal" },
      { initials: "FI", name: "Finance Team", role: "Operations Group", team: "Finance" },
    ];
  } else if (type === "Bill" || type === "Invoice") {
    return [
      { initials: "KU", name: "Kunal", role: "Finance Controller", team: "Finance" },
      { initials: "OP", name: "Operations", role: "Fulfillment Team", team: "Operations" },
      { initials: "FI", name: "Finance Team", role: "Operations Group", team: "Finance" },
    ];
  } else if (type === "Vendor") {
    return [
      { initials: "LO", name: "Loga", role: "Procurement Lead", team: "Procurement" },
      { initials: "PR", name: "Priya", role: "Legal Counsel", team: "Legal" },
      { initials: "OP", name: "Operations", role: "Fulfillment Team", team: "Operations" },
    ];
  } else {
    return [
      { initials: "PR", name: "Priya", role: "Legal Counsel", team: "Legal" },
      { initials: "KU", name: "Kunal", role: "Finance Controller", team: "Finance" },
      { initials: "AJ", name: "Alex Johnson", role: "Admin", team: "Management" },
    ];
  }
};

const getInitials = (name: string): string => {
  if (name.includes("Loga")) return "LO";
  if (name.includes("Kumar") || name.includes("Kunal")) return "KU";
  if (name.includes("Priya")) return "PR";
  if (name.includes("System")) return "SY";
  if (name.includes("AI Agent") || name === "AI") return "AI";
  if (name.includes("Alex Johnson")) return "AJ";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  if (name.includes("Loga")) {
    return { bg: "rgba(74,222,128,0.12)", text: "#16a34a" };
  }
  if (name.includes("Kumar") || name.includes("Kunal")) {
    return { bg: "rgba(251,191,36,0.12)", text: "#d97706" };
  }
  if (name.includes("Priya")) {
    return { bg: "rgba(192,132,252,0.12)", text: "#9333ea" };
  }
  if (name.includes("System")) {
    return { bg: "rgba(107,140,255,0.12)", text: "#2563eb" };
  }
  if (name.includes("AI Agent") || name === "AI") {
    return { bg: "rgba(139,92,246,0.12)", text: "#7c3aed" };
  }
  if (name.includes("Alex Johnson")) {
    return { bg: "rgba(239,68,68,0.12)", text: "#ef4444" };
  }
  return { bg: "var(--secondary)", text: "var(--foreground)" };
};

const formatTimestamp = (date: Date): string => {
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1 && now.getDate() === date.getDate()) {
    return `Today at ${timeStr}`;
  } else if (diffDays <= 2) {
    return `Yesterday at ${timeStr}`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` at ${timeStr}`;
  }
};

const ActionTypeBadge = ({ type }: { type: string }) => {
  let label = "";
  let color = "var(--muted-foreground)";
  let bg = "var(--secondary)";
  
  if (type === "task") {
    label = "Task Assigned";
    color = "#f97316";
    bg = "rgba(249,115,22,0.08)";
  } else if (type === "info_request") {
    label = "Information Request";
    color = "#3b82f6";
    bg = "rgba(59,130,246,0.08)";
  } else if (type === "approval_request") {
    label = "Approval Request";
    color = "#8b5cf6";
    bg = "rgba(139,92,246,0.08)";
  } else if (type === "discussion") {
    label = "Discussion";
    color = "var(--muted-foreground)";
    bg = "var(--secondary)";
  } else if (type === "system_event") {
    label = "System Event";
    color = "#2563eb";
    bg = "rgba(37,99,235,0.08)";
  } else if (type === "ai_analysis") {
    label = "AI Analysis";
    color = "#7c3aed";
    bg = "rgba(124,58,237,0.08)";
  } else if (type === "workflow_update") {
    label = "Workflow Update";
    color = "#0891b2";
    bg = "rgba(8,145,178,0.08)";
  }

  if (!label) return null;

  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[8.5px] font-bold border"
      style={{ borderColor: color, color, background: bg }}
    >
      {label}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  let color = "var(--muted-foreground)";
  let bg = "var(--secondary)";
  
  if (status === "open" || status === "waiting") {
    color = "#eab308";
    bg = "rgba(234,179,8,0.08)";
  } else if (status === "completed" || status === "approved") {
    color = "#10b981";
    bg = "rgba(16,185,129,0.08)";
  } else if (status === "rejected") {
    color = "#ef4444";
    bg = "rgba(239,68,68,0.08)";
  }

  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[8.5px] font-bold"
      style={{ background: bg, color }}
    >
      {status.toUpperCase()}
    </span>
  );
};

export function ActivityWorkspace({ hasHeaderOffset = false, isEmbedded = false }: ActivityWorkspaceProps) {
  const { activeRecord, closeActivity, refreshNotifications, navigateToRecord } = useActivity();
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [hoveredParticipant, setHoveredParticipant] = useState<Participant | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const timelineEndRef = useRef<HTMLDivElement>(null);

  // Chat input states
  const [inputText, setInputText] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [selectedMentionUser, setSelectedMentionUser] = useState<Participant | null>(null);

  // Actions menu toggles
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<"task" | "info" | "approval" | null>(null);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSection, setTaskSection] = useState("PO Information");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [infoSection, setInfoSection] = useState("PO Information");
  const [infoCustomNote, setInfoCustomNote] = useState("");
  const [approvalCategory, setApprovalCategory] = useState("PO Approval");
  const [approvalCustomNote, setApprovalCustomNote] = useState("");

  // Resolution Notes Overlay
  const [pendingResolution, setPendingResolution] = useState<{ entryId: string; type: "complete" | "approve" | "reject" | "info" } | null>(null);
  const [resolutionNote, setResponseNote] = useState("");

  // Parse active record details
  if (!activeRecord) return null;
  const { type, id, status = "Approved", createdBy = "Alex Johnson", createdDate = "Jun 01, 2026" } = activeRecord;

  const getRecordTitle = (): string => {
    if (!type) return "RECORD";
    return type.toUpperCase();
  };

  const getRecordEntityName = (): string => {
    if (!id) return "";
    
    // Purchase Orders mapping
    if (id === "PO-2026-001") return "TechSupply Co";
    if (id === "PO-2026-002") return "OfficeMax Pro";
    if (id === "PO-2026-003") return "CloudNet Solutions";
    if (id === "PO-2026-004") return "Green Facilities";
    if (id === "PO-2026-005") return "SafeLogistics";
    if (id === "PO-2026-006") return "TechSupply Co";
    if (id === "PO-2026-007") return "SwiftCargo";
    if (id === "PO-2026-008") return "PrintHouse Ltd";
    if (id === "PO-2026-009") return "MediaBridge";
    if (id === "PO-2026-010") return "FoodFirst Corp";
    if (id === "PO-2026-011") return "NextLevel IT";
    if (id === "PO-2026-012") return "TechSupply Co";

    // Vendors mapping
    if (id === "VND-001") return "TechSupply Co";
    if (id === "VND-002") return "OfficeMax Pro";
    if (id === "VND-003") return "CloudNet Solutions";
    if (id === "VND-004") return "Green Facilities";
    if (id === "VND-005") return "SafeLogistics";

    // Organizations
    if (id === "ORG-001") return "Acme Corp";
    if (id === "ORG-002") return "Globex Ltd";
    if (id === "ORG-003") return "Initech Inc";

    // Bills mapping
    if (id === "Bill-2026-001" || id === "INV-2026-001") return "TechSupply Co";
    if (id === "Bill-2026-002" || id === "INV-2026-002") return "OfficeMax Pro";

    // Fallbacks based on prefix/type
    if (id.startsWith("PO-")) return "Procurement Record";
    if (id.startsWith("VND-")) return "Partner Vendor";
    if (id.startsWith("ORG-")) return "Business Unit";
    if (id.startsWith("Bill-") || id.startsWith("INV-")) return "Supplier Invoice";
    if (type === "Contract") return "Legal Agreement";

    return "Finance Record";
  };


  // Initializing state using session cache
  const [collabData, setCollabData] = useState<RecordCollabData>(() => {
    if (!sessionCache[id]) {
      sessionCache[id] = getInitialMockData(id, type, status);
    }
    return sessionCache[id];
  });

  useEffect(() => {
    if (!sessionCache[id]) {
      sessionCache[id] = getInitialMockData(id, type, status);
    }
    setCollabData(sessionCache[id]);
  }, [id, type, status]);

  const updateCollabData = (updater: (prev: RecordCollabData) => RecordCollabData) => {
    setCollabData(prev => {
      const next = updater(prev);
      sessionCache[id] = next;
      
      // Push notifications updates live
      setTimeout(() => refreshNotifications?.(), 50);
      return next;
    });
  };

  // Scroll to bottom of timeline when feed size shifts
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [collabData]);

  const participants = getRecordParticipants(type);

  // Workflow stepper window state
  const [stepperWindowStart, setStepperWindowStart] = useState(0);
  const allWorkflowSteps = [
    { label: "Draft", stepId: 1 },
    { label: "Data Collection", stepId: 2 },
    { label: "Review", stepId: 3 },
    { label: "Verification", stepId: 4 },
    { label: "Approval", stepId: 5 },
    { label: "Issued", stepId: 6 },
    { label: "Completed", stepId: 7 }
  ];
  const VISIBLE_STEPS = 5;
  const visibleSteps = allWorkflowSteps.slice(stepperWindowStart, stepperWindowStart + VISIBLE_STEPS);
  const canScrollLeft = stepperWindowStart > 0;
  const canScrollRight = stepperWindowStart + VISIBLE_STEPS < allWorkflowSteps.length;

  const scrollStepperLeft = () => setStepperWindowStart(prev => Math.max(0, prev - 1));
  const scrollStepperRight = () => setStepperWindowStart(prev => Math.min(allWorkflowSteps.length - VISIBLE_STEPS, prev + 1));

  // Derived Stepper values
  const openTasks = collabData.entries.filter(e => e.type === "task" && (e.status === "open" || e.status === "waiting"));
  const pendingApprovals = collabData.entries.filter(e => e.type === "approval_request" && e.status === "waiting");
  const openInfoRequests = collabData.entries.filter(e => e.type === "info_request" && e.status === "waiting");

  const getDerivedWorkflowStage = () => {
    if (status === "Draft") return 1;
    if (openTasks.length > 0) return 2;
    if (openInfoRequests.length > 0) return 3;
    if (openInfoRequests.length === 0 && openTasks.length === 0 && pendingApprovals.length > 0) return 5;
    if (pendingApprovals.length === 0 && openTasks.length === 0 && openInfoRequests.length === 0) return 7;
    return 4;
  };

  const derivedStage = getDerivedWorkflowStage();

  // Completion Summary dynamic calculations
  const totalChecklistCount = 3 + collabData.entries.filter(e => e.type !== "discussion").length;
  const completedChecklistCount = 2 + collabData.entries.filter(e => e.type !== "discussion" && (e.status === "completed" || e.status === "approved")).length;
  const completionPercentage = Math.round((completedChecklistCount / totalChecklistCount) * 100);

  // Side-by-side checklists
  const baseCompleted = ["Vendor Details", "Financial Details", "Commercial Details"];
  const basePending: string[] = [];

  const completedItems = [...baseCompleted];
  collabData.entries.forEach(e => {
    if (e.type !== "discussion" && (e.status === "completed" || e.status === "approved")) {
      completedItems.push(e.content.split(" (")[0]);
    }
  });

  const pendingItems = [...basePending];
  collabData.entries.forEach(e => {
    if (e.type !== "discussion" && e.status !== "completed" && e.status !== "approved" && e.status !== "rejected" && e.status !== "cancelled") {
      pendingItems.push(e.content.split(" (")[0]);
    }
  });

  if (completedItems.length <= 3 && pendingItems.length === 0) {
    pendingItems.push("Delivery Details", "Supporting Documents");
  }

  // Blockers alert list
  const criticalPending = collabData.entries.find(e => e.priority === "critical" && !["completed", "approved"].includes(e.status));
  const blockersList = criticalPending 
    ? [criticalPending.content.split(" (")[0]] 
    : (pendingApprovals.length > 0 ? ["Missing approval sign-off"] : []);

  // Unified Timeline: merge collaboration entries + system logs into one chronological feed
  type UnifiedTimelineItem = 
    | { kind: "collab"; entry: typeof collabData.entries[0]; _ts: number }
    | { kind: "audit"; log: typeof collabData.systemLogs[0]; _ts: number };

  const unifiedTimeline: UnifiedTimelineItem[] = [
    ...collabData.entries.map(entry => ({ kind: "collab" as const, entry, _ts: entry.timestamp.getTime() })),
    ...collabData.systemLogs.map(log => ({ kind: "audit" as const, log, _ts: log.timestamp.getTime() }))
  ].sort((a, b) => a._ts - b._ts);

  // Input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.endsWith("@")) {
      setShowMentionList(true);
    } else if (!val.includes("@") || val.endsWith(" ")) {
      setShowMentionList(false);
    }
  };

  const handleSelectMention = (p: Participant) => {
    setSelectedMentionUser(p);
    setShowMentionList(false);
    setShowActionMenu(true);
  };

  const handleMentionOnly = () => {
    if (selectedMentionUser) {
      setInputText(prev => prev + `${selectedMentionUser.name} `);
      setSelectedMentionUser(null);
      setShowActionMenu(false);
    }
  };

  const handleActionSubmit = (actionType: "task" | "info" | "approval") => {
    if (!selectedMentionUser) return;

    const timestamp = new Date();
    const uniqueId = `action-${Date.now()}`;
    let newEntry: CollaborationEntry;

    // Preserve user's message as a separate discussion entry if there was text before the @mention
    const userMessage = inputText.replace(/@\S*\s?/g, "").trim();

    if (actionType === "task") {
      const typeCount = collabData.entries.filter(e => e.type === "task").length + 1;
      newEntry = {
        id: uniqueId,
        actionId: `TSK-${String(typeCount).padStart(4, "0")}`,
        type: "task",
        author: "Alex Johnson",
        owner: selectedMentionUser.name,
        timestamp,
        content: `${taskTitle || "Complete task item"} (${taskSection})`,
        priority: "high",
        status: "open",
        dueDate: taskDueDate || undefined
      };
      setTaskTitle("");
      setTaskDueDate("");
    } else if (actionType === "info") {
      const typeCount = collabData.entries.filter(e => e.type === "info_request").length + 1;
      newEntry = {
        id: uniqueId,
        actionId: `INF-${String(typeCount).padStart(4, "0")}`,
        type: "info_request",
        author: "Alex Johnson",
        owner: selectedMentionUser.name,
        timestamp,
        content: `Required: ${infoSection}${infoCustomNote ? ` - Note: ${infoCustomNote}` : ""}`,
        priority: "medium",
        status: "waiting"
      };
      setInfoCustomNote("");
    } else {
      const typeCount = collabData.entries.filter(e => e.type === "approval_request").length + 1;
      newEntry = {
        id: uniqueId,
        actionId: `APR-${String(typeCount).padStart(4, "0")}`,
        type: "approval_request",
        author: "Alex Johnson",
        owner: selectedMentionUser.name,
        timestamp,
        content: `Awaiting Sign-off: ${approvalCategory}${approvalCustomNote ? ` - Details: ${approvalCustomNote}` : ""}`,
        priority: "critical",
        status: "waiting"
      };
      setApprovalCustomNote("");
    }

    updateCollabData(prev => {
      const newEntries = [...prev.entries];

      // If user typed a message before triggering @mention, preserve it as a discussion
      if (userMessage) {
        const dscCount = prev.entries.filter(e => e.type === "discussion").length + 1;
        newEntries.push({
          id: `dsc-msg-${Date.now()}`,
          actionId: `DSC-${String(dscCount).padStart(4, "0")}`,
          type: "discussion",
          author: "Alex Johnson",
          owner: "Procurement Team",
          timestamp: new Date(timestamp.getTime() - 500),
          content: userMessage,
          priority: "low",
          status: "completed"
        });
      }

      newEntries.push(newEntry);

      // Add system transition log
      const stageNames = ["Draft", "Data Collection", "Review", "Verification", "Approval", "Issued", "Completed"];
      const newSysLog = {
        text: `Alex Johnson initialized collaboration ${newEntry.actionId} assigned to ${newEntry.owner}`,
        timestamp: new Date(),
        stage: stageNames[(derivedStage - 1)] || "Review",
        actor: "System"
      };

      return {
        entries: newEntries,
        systemLogs: [...prev.systemLogs, newSysLog]
      };
    });

    setInputText("");
    setSelectedMentionUser(null);
    setActiveModal(null);
    setShowActionMenu(false);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const uniqueId = `dsc-${Date.now()}`;
    const typeCount = collabData.entries.filter(e => e.type === "discussion").length + 1;
    const newEntry: CollaborationEntry = {
      id: uniqueId,
      actionId: `DSC-${String(typeCount).padStart(4, "0")}`,
      type: "discussion",
      author: "Alex Johnson",
      owner: "Procurement Team",
      timestamp: new Date(),
      content: inputText,
      priority: "low",
      status: "completed"
    };

    updateCollabData(prev => ({
      ...prev,
      entries: [...prev.entries, newEntry]
    }));

    setInputText("");
  };

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingResolution) return;

    const { entryId, type } = pendingResolution;

    updateCollabData(prev => {
      let resolvedActionId = "";
      let resolvedActionType = "";
      let resolvedOwner = "";

      const updatedEntries = prev.entries.map(entry => {
        if (entry.id !== entryId) return entry;

        resolvedActionId = entry.actionId;
        resolvedActionType = entry.type;
        resolvedOwner = entry.owner;

        let targetStatus: CollaborationEntry["status"] = entry.status;
        let actionString = "";

        if (type === "complete") {
          targetStatus = "completed";
          actionString = "Completed Task";
        } else if (type === "approve") {
          targetStatus = "approved";
          actionString = "Approved Request";
        } else if (type === "reject") {
          targetStatus = "rejected";
          actionString = "Rejected Request";
        } else if (type === "info") {
          targetStatus = "completed";
          actionString = "Submitted Information details";
        }

        const newLog = {
          user: "Alex Johnson",
          action: actionString,
          timestamp: new Date(),
          note: resolutionNote || undefined
        };

        return {
          ...entry,
          status: targetStatus,
          historyLog: [...(entry.historyLog || []), newLog]
        };
      });

      // System workflow progression transition message
      const transitionStage = getDerivedWorkflowStage();
      const stageName = ["Draft", "Data Collection", "Review", "Verification", "Approval", "Issued", "Completed"][transitionStage - 1];

      const newSysLog = {
        text: `System: Action ${resolvedActionId} resolved by Alex Johnson. Workflow derived status updated to ${stageName}.`,
        timestamp: new Date(),
        stage: stageName,
        actor: "System"
      };

      return {
        entries: updatedEntries,
        systemLogs: [...prev.systemLogs, newSysLog]
      };
    });

    setResponseNote("");
    setPendingResolution(null);
  };

  const handleMouseEnter = (e: React.MouseEvent, p: Participant) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 8,
    });
    setHoveredParticipant(p);
  };

  // Legacy scroll stubs removed — stepper uses windowed navigation now

  const innerContent = (
    <>
      {/* ─── DRAWER HEADER ─── */}
      {!isEmbedded && (
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 28, height: 28, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}
          >
            <BotMessageSquare size={14} />
          </div>
          <div className="flex flex-col">
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>Activity Workspace</div>
            <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{id}</div>
          </div>
          <button
            onClick={closeActivity}
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              width: 24,
              height: 24,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            title="Close Workspace"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── SCROLLABLE BODY ─── */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-24 flex flex-col gap-5">
        
        {/* Compact Header Area */}
        <div className="flex flex-col relative">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>
              {getRecordTitle()}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5"
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                background: "rgba(30,41,59,0.06)",
                color: "var(--foreground)",
              }}
            >
              {status}
            </span>
          </div>

          <h1 style={{ fontSize: 17, fontWeight: 750, color: "var(--foreground)", margin: "4px 0 2px 0", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
            {id}
          </h1>

          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--foreground)" }}>
            {getRecordEntityName()}
          </div>

          <div className="flex items-center gap-2 mt-3" style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            <span>Created by <strong style={{ color: "var(--foreground)", fontWeight: 650 }}>{createdBy}</strong></span>
            <span>·</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{createdDate}</span>
          </div>

          <div style={{ borderTop: "1px dashed var(--border)", margin: "12px 0" }} />

          {/* Predefined Collaboration Group Participants */}
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
              PARTICIPANTS
            </span>
            <div className="flex items-center gap-1">
              {(showAllParticipants ? participants : participants.slice(0, 3)).map((p) => (
                <div
                  key={p.initials}
                  className="flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-105"
                  style={{
                    width: 22,
                    height: 22,
                    background: "var(--secondary)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, p)}
                  onMouseLeave={() => setHoveredParticipant(null)}
                >
                  {p.initials}
                </div>
              ))}
              {participants.length > 3 && !showAllParticipants && (
                <button
                  onClick={() => setShowAllParticipants(true)}
                  className="flex items-center justify-center rounded-full cursor-pointer hover:bg-accent transition-colors"
                  style={{
                    width: 22,
                    height: 22,
                    background: "var(--secondary)",
                    color: "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  +{participants.length - 3}
                </button>
              )}
              {showAllParticipants && (
                <button
                  onClick={() => setShowAllParticipants(false)}
                  className="flex items-center justify-center rounded-full cursor-pointer hover:bg-accent transition-colors"
                  style={{
                    width: 22,
                    height: 22,
                    background: "var(--secondary)",
                    color: "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  -
                </button>
              )}
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border)", margin: "14px -16px 0 -16px" }} />
        </div>

        {/* 1. Workflow Tracker (Derived Read-Only) — 7 steps, windowed 5 at a time */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
              Workflow Tracker
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={scrollStepperLeft}
                disabled={!canScrollLeft}
                style={{ background: "none", border: "none", cursor: canScrollLeft ? "pointer" : "default", color: canScrollLeft ? "var(--foreground)" : "var(--border)", padding: 2 }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={scrollStepperRight}
                disabled={!canScrollRight}
                style={{ background: "none", border: "none", cursor: canScrollRight ? "pointer" : "default", color: canScrollRight ? "var(--foreground)" : "var(--border)", padding: 2 }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="relative w-full overflow-hidden px-1">
            {/* Background line connecting visible steps */}
            <div
              className="absolute left-4 right-4 h-0.5"
              style={{ top: 8, background: "var(--border)", zIndex: 0 }}
            />
            {/* Active/Completed filled line — computed relative to visible window */}
            {(() => {
              const firstVisible = visibleSteps[0].stepId;
              const lastVisible = visibleSteps[visibleSteps.length - 1].stepId;
              const clampedStage = Math.max(firstVisible, Math.min(derivedStage, lastVisible));
              const filledFraction = (clampedStage - firstVisible) / (lastVisible - firstVisible);
              return (
                <div
                  className="absolute left-4 h-0.5 transition-all duration-300"
                  style={{
                    top: 8,
                    width: `${Math.max(0, filledFraction) * 100}%`,
                    background: "#4ade80",
                    zIndex: 0,
                    maxWidth: "calc(100% - 32px)"
                  }}
                />
              );
            })()}

            <div className="relative flex justify-between items-start w-full z-10">
              {visibleSteps.map((step) => {
                const isDone = derivedStage > step.stepId;
                const isActive = derivedStage === step.stepId;

                return (
                  <div key={step.stepId} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    {isDone ? (
                      <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#4ade80", color: "#fff", flexShrink: 0 }}>
                        <CheckCircle2 size={11} strokeWidth={3} />
                      </div>
                    ) : isActive ? (
                      <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#6b8cff", color: "#fff", flexShrink: 0 }}>
                        <Circle size={10} fill="#fff" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "var(--card)", border: "1.5px solid var(--border)", color: "var(--muted-foreground)", flexShrink: 0 }}>
                        <span style={{ fontSize: 8, fontWeight: 750 }}>{step.stepId}</span>
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: 7.5,
                        color: isDone || isActive ? "var(--foreground)" : "var(--muted-foreground)",
                        fontWeight: isDone || isActive ? 700 : 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                        textAlign: "center"
                      }}
                      title={step.label}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border)", margin: "8px -16px 0 -16px" }} />
        </div>

        {/* 2. Completion Summary (Derived Read-Only Progress) */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
              Completion Summary
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)" }}>
              {completionPercentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full" style={{ background: "var(--secondary)", overflow: "hidden" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${completionPercentage}%`,
                background: "#6b8cff",
              }}
            />
          </div>

          {/* Side-by-side lists */}
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            {/* Completed */}
            <div className="flex flex-col gap-2">
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>
                COMPLETED ({completedItems.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {completedItems.map(item => (
                  <div key={item} className="flex items-center gap-1.5 text-left" style={{ fontSize: 11 }}>
                    <CheckCircle2 size={12} style={{ color: "#4ade80", flexShrink: 0 }} />
                    <span style={{ color: "var(--foreground)" }} className="truncate" title={item}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending */}
            <div className="flex flex-col gap-2">
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>
                PENDING ({pendingItems.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {pendingItems.map(item => (
                  <div key={item} className="flex items-center gap-1.5 text-left" style={{ fontSize: 11 }}>
                    <Circle size={12} style={{ color: "var(--border)", flexShrink: 0 }} />
                    <span style={{ color: "var(--muted-foreground)" }} className="truncate" title={item}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blockers Alert Box */}
          {blockersList.length > 0 && (
            <div
              className="rounded-lg p-3 flex flex-col gap-1 mt-2 text-left"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.12)",
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#ef4444", fontSize: 9.5, letterSpacing: "0.04em" }}>
                <AlertCircle size={12} />
                BLOCKERS
              </div>
              {blockersList.map((blocker, bIdx) => (
                <div key={bIdx} style={{ fontSize: 11, color: "#f43f5e", fontWeight: 500, paddingLeft: 18 }}>
                  {blocker}
                </div>
              ))}
            </div>
          )}

          <div style={{ borderBottom: "1px solid var(--border)", margin: "8px -16px 0 -16px" }} />
        </div>

        {/* 3. Unified Activity Timeline — collaboration + audit merged chronologically */}
        <div className="flex flex-col gap-3.5">
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
            Activity Timeline
          </span>

          <div className="flex flex-col relative" style={{ paddingLeft: 12 }}>
            {unifiedTimeline.length === 0 ? (
              <div className="pl-6 text-[11px] text-muted-foreground py-2 text-left">
                No activity yet.
              </div>
            ) : (
              unifiedTimeline.map((item, idx) => {
                const isLast = idx === unifiedTimeline.length - 1;

                if (item.kind === "audit") {
                  const log = item.log;
                  const initials = getInitials(log.actor);
                  const avatarColor = getAvatarColor(log.actor);
                  // Determine badge type
                  let badgeType = "system_event";
                  if (log.actor === "AI Agent" || log.text.startsWith("AI Analysis")) badgeType = "ai_analysis";
                  if (log.text.includes("Workflow") || log.text.includes("moved from")) badgeType = "workflow_update";

                  return (
                    <div key={`audit-${idx}`} className="flex items-start gap-3 relative text-left" style={{ paddingBottom: isLast ? 0 : 16 }}>
                      {/* Connector line below avatar — only if not last */}
                      {!isLast && (
                        <div className="absolute w-0.5" style={{ left: 11, top: 24, bottom: 0, background: "var(--border)" }} />
                      )}
                      {/* Avatar */}
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0 z-10 font-bold"
                        style={{ width: 24, height: 24, background: avatarColor.bg, border: "1px solid var(--border)", fontSize: 9, color: avatarColor.text }}
                        title={log.actor}
                      >
                        {initials}
                      </div>
                      {/* Content */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span style={{ fontSize: 11.5, color: "var(--foreground)", lineHeight: 1.4 }}>
                          <strong style={{ fontWeight: 700 }}>{log.actor}</strong> {log.text}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5" style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                          <span style={{ fontFamily: "var(--font-mono)" }}>{formatTimestamp(log.timestamp)}</span>
                          <span>·</span>
                          <ActionTypeBadge type={badgeType} />
                          {log.stage && (
                            <>
                              <span>·</span>
                              <span>Stage: {log.stage}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Collaboration entry
                const entry = item.entry;
                const initials = getInitials(entry.author);
                const isResolved = ["completed", "approved", "rejected"].includes(entry.status);
                const avatarColor = getAvatarColor(entry.author);

                let actionText = "";
                if (entry.type === "task") {
                  actionText = `assigned a task to ${entry.owner}: "${entry.content}"`;
                } else if (entry.type === "info_request") {
                  actionText = `requested information from ${entry.owner}: "${entry.content}"`;
                } else if (entry.type === "approval_request") {
                  actionText = `requested approval from ${entry.owner}: "${entry.content}"`;
                } else {
                  actionText = `posted: "${entry.content}"`;
                }

                return (
                  <div key={entry.id} className="flex flex-col relative text-left" style={{ paddingBottom: isLast ? 0 : 16 }}>
                    {/* Connector line below avatar — only if not last */}
                    {!isLast && (
                      <div className="absolute w-0.5" style={{ left: 11, top: 24, bottom: 0, background: "var(--border)" }} />
                    )}
                    <div className="flex items-start gap-3 relative">
                      {/* Avatar */}
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0 z-10 font-bold"
                        style={{ width: 24, height: 24, background: avatarColor.bg, border: "1px solid var(--border)", fontSize: 9, color: avatarColor.text }}
                        title={entry.author}
                      >
                        {initials}
                      </div>
                      {/* Content */}
                      <div className="flex flex-col flex-grow min-w-0">
                        <span style={{ fontSize: 11.5, color: "var(--foreground)", lineHeight: 1.45 }}>
                          <strong style={{ fontWeight: 700 }}>{entry.author}</strong> {actionText}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1" style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                          <span style={{ fontFamily: "var(--font-mono)" }}>{formatTimestamp(entry.timestamp)}</span>
                          <span>·</span>
                          <ActionTypeBadge type={entry.type} />
                          <StatusBadge status={entry.status} />
                          {entry.type === "task" && entry.dueDate && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-[9px]">Due: {entry.dueDate}</span>
                            </>
                          )}
                        </div>
                        {!isResolved && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {(entry.type === "task" || entry.type === "info_request" || entry.type === "approval_request") && (
                              <button
                                onClick={() => navigateToRecord?.(type, id)}
                                className="rounded-lg px-2.5 py-1 bg-secondary hover:bg-accent border border-border text-[9.5px] font-semibold text-foreground cursor-pointer transition-colors"
                              >
                                View Details
                              </button>
                            )}
                            {entry.type === "task" && (
                              <button
                                onClick={() => setPendingResolution({ entryId: entry.id, type: "complete" })}
                                className="rounded-lg px-2.5 py-1 bg-secondary hover:bg-accent border border-border text-[9.5px] font-semibold text-foreground cursor-pointer transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                            {entry.type === "info_request" && (
                              <button
                                onClick={() => setPendingResolution({ entryId: entry.id, type: "info" })}
                                className="rounded-lg px-2.5 py-1 bg-secondary hover:bg-accent border border-border text-[9.5px] font-semibold text-foreground cursor-pointer transition-colors"
                              >
                                Provide Info
                              </button>
                            )}
                            {entry.type === "approval_request" && (
                              <>
                                <button
                                  onClick={() => setPendingResolution({ entryId: entry.id, type: "approve" })}
                                  className="rounded-lg px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[9.5px] font-semibold text-emerald-600 cursor-pointer transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setPendingResolution({ entryId: entry.id, type: "reject" })}
                                  className="rounded-lg px-2.5 py-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-[9.5px] font-semibold text-red-500 cursor-pointer transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Threaded Replies */}
                    {entry.historyLog && entry.historyLog.map((log, lIdx) => {
                      const logInitials = getInitials(log.user);
                      const logAvatarColor = getAvatarColor(log.user);
                      return (
                        <div key={lIdx} className="flex items-start gap-2.5 mt-2 relative text-left" style={{ paddingLeft: 24 }}>
                          <div
                            className="flex items-center justify-center rounded-full flex-shrink-0 z-10 font-bold"
                            style={{ width: 18, height: 18, background: logAvatarColor.bg, border: "1px solid var(--border)", fontSize: 7.5, color: logAvatarColor.text }}
                            title={log.user}
                          >
                            {logInitials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span style={{ fontSize: 11, color: "var(--foreground)", lineHeight: 1.4 }}>
                              <strong style={{ fontWeight: 650 }}>{log.user}</strong> {log.action.toLowerCase()}
                              {log.note && <span style={{ fontStyle: "italic", color: "var(--muted-foreground)" }}> — &quot;{log.note}&quot;</span>}
                            </span>
                            <span style={{ fontSize: 8.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
            <div ref={timelineEndRef} />
          </div>
        </div>
      </div>

      {/* ─── CHAT FOOTER & MENTIONS DROPDOWN ─── */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3"
        style={{
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          zIndex: 30,
        }}
      >
        {/* Floating Mentions suggestions Dropdown list (Above input field) */}
        {showMentionList && (
          <div
            className="absolute rounded-lg border border-border overflow-hidden bg-popover shadow-lg flex flex-col"
            style={{
              bottom: "calc(100% + 4px)",
              left: 12,
              right: 12,
              maxHeight: 160,
              overflowY: "auto",
              zIndex: 100
            }}
          >
            <div className="px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-card">
              Mentions Participants Group
            </div>
            {participants.map((p) => (
              <button
                key={p.initials}
                onClick={() => handleSelectMention(p)}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent transition-colors border-none cursor-pointer"
                style={{ background: "transparent" }}
              >
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 18, height: 18, background: "var(--accent)", fontSize: 8.5, fontWeight: 700, color: "var(--foreground)" }}
                >
                  {p.initials}
                </div>
                <div className="flex flex-col">
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{p.role}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Enabled Input Box */}
        <form
          onSubmit={handleSendComment}
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type @ to assign or collaborate..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "var(--foreground)",
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              background: "none",
              border: "none",
              cursor: inputText.trim() ? "pointer" : "not-allowed",
              color: inputText.trim() ? "var(--foreground)" : "var(--muted-foreground)",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={13} />
          </button>
        </form>
      </div>

      {/* ─── ACTION TRIGGER FLOATING MODALS ─── */}

      {/* Mentions Action Picker Overlay */}
      {showActionMenu && selectedMentionUser && (
        <div
          onClick={() => { setShowActionMenu(false); setSelectedMentionUser(null); }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(2px)",
            zIndex: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 320,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
                Workflow Action for @{selectedMentionUser.name}
              </span>
              <button
                onClick={() => { setShowActionMenu(false); setSelectedMentionUser(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
              >
                <X size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleMentionOnly}
                className="w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11.5, fontWeight: 600, color: "var(--foreground)" }}
              >
                Mention Only
              </button>
              
              <button
                onClick={() => { setActiveModal("task"); setShowActionMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11.5, fontWeight: 600, color: "var(--foreground)" }}
              >
                Assign Task
              </button>

              <button
                onClick={() => { setActiveModal("info"); setShowActionMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11.5, fontWeight: 600, color: "var(--foreground)" }}
              >
                Request Information
              </button>

              <button
                onClick={() => { setActiveModal("approval"); setShowActionMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11.5, fontWeight: 600, color: "var(--foreground)" }}
              >
                Request Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {activeModal === "task" && selectedMentionUser && (
        <div
          onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 320,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>Assign Task</span>
              <button onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={13} />
              </button>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)" }}>TASK TITLE</label>
              <input
                type="text"
                placeholder="e.g. Audit pricing logs"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                style={{
                  height: 32,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "0 8px",
                  fontSize: 12,
                  color: "var(--foreground)",
                  outline: "none"
                }}
              />
            </div>

            {/* Business Sections Selector */}
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)" }}>REQUIRED SECTION</label>
              <select
                value={taskSection}
                onChange={e => setTaskSection(e.target.value)}
                style={{
                  height: 32,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "0 6px",
                  fontSize: 12,
                  color: "var(--foreground)",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="Vendor Information">Vendor Information</option>
                <option value="Invoice Information">Invoice Information</option>
                <option value="PO Information">PO Information</option>
                <option value="Contract Information">Contract Information</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)" }}>DUE DATE</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
                style={{
                  height: 32,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "0 8px",
                  fontSize: 12,
                  color: "var(--foreground)",
                  cursor: "pointer",
                  outline: "none"
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
              <button
                onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }}
                className="rounded px-3 py-1.5 bg-secondary hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSelectMention(selectedMentionUser)}
                className="rounded px-3 py-1.5 hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11, fontWeight: 600, display: !taskTitle.trim() ? "block" : "none", color: "var(--foreground)" }}
              >
                Back
              </button>
              <button
                disabled={!taskTitle.trim()}
                onClick={() => handleActionSubmit("task")}
                className="rounded px-3 py-1.5 transition-colors cursor-pointer"
                style={{
                  fontSize: 11,
                  fontWeight: 650,
                  background: taskTitle.trim() ? "var(--foreground)" : "var(--border)",
                  color: "var(--background)",
                  border: "none"
                }}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Selector Modal */}
      {activeModal === "info" && selectedMentionUser && (
        <div
          onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 320,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>Request Information</span>
              <button onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)" }}>REQUIRED DATA SECTION</label>
              <select
                value={infoSection}
                onChange={e => setInfoSection(e.target.value)}
                style={{
                  height: 32,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "0 6px",
                  fontSize: 12,
                  color: "var(--foreground)",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="Vendor Information">Vendor Information</option>
                <option value="Invoice Information">Invoice Information</option>
                <option value="PO Information">PO Information</option>
                <option value="Contract Information">Contract Information</option>
                <option value="Custom Request">Custom Request</option>
              </select>
            </div>

            {infoSection === "Custom Request" && (
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)" }}>CUSTOM REQUEST NOTE</label>
                <input
                  type="text"
                  placeholder="Enter needed information..."
                  value={infoCustomNote}
                  onChange={e => setInfoCustomNote(e.target.value)}
                  style={{
                    height: 32,
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "0 8px",
                    fontSize: 12,
                    color: "var(--foreground)",
                    outline: "none"
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
              <button
                onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }}
                className="rounded px-3 py-1.5 bg-secondary hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleActionSubmit("info")}
                className="rounded px-3 py-1.5 transition-colors cursor-pointer"
                style={{
                  fontSize: 11,
                  fontWeight: 650,
                  background: "var(--foreground)",
                  color: "var(--background)",
                  border: "none"
                }}
              >
                Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Approval Selector Modal */}
      {activeModal === "approval" && selectedMentionUser && (
        <div
          onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 320,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>Request Approval</span>
              <button onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)" }}>APPROVAL CATEGORY</label>
              <select
                value={approvalCategory}
                onChange={e => setApprovalCategory(e.target.value)}
                style={{
                  height: 32,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "0 6px",
                  fontSize: 12,
                  color: "var(--foreground)",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="Vendor Approval">Vendor Approval</option>
                <option value="Invoice Approval">Invoice Approval</option>
                <option value="PO Approval">PO Approval</option>
                <option value="Contract Approval">Contract Approval</option>
                <option value="Custom Approval">Custom Approval</option>
              </select>
            </div>

            {approvalCategory === "Custom Approval" && (
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)" }}>CUSTOM APPROVAL DETAIL</label>
                <input
                  type="text"
                  placeholder="Enter approval details..."
                  value={approvalCustomNote}
                  onChange={e => setApprovalCustomNote(e.target.value)}
                  style={{
                    height: 32,
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "0 8px",
                    fontSize: 12,
                    color: "var(--foreground)",
                    outline: "none"
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
              <button
                onClick={() => { setActiveModal(null); setSelectedMentionUser(null); }}
                className="rounded px-3 py-1.5 bg-secondary hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleActionSubmit("approval")}
                className="rounded px-3 py-1.5 transition-colors cursor-pointer"
                style={{
                  fontSize: 11,
                  fontWeight: 650,
                  background: "var(--foreground)",
                  color: "var(--background)",
                  border: "none"
                }}
              >
                Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enriched Card Response Notes Popup */}
      {pendingResolution && (
        <div
          onClick={() => setPendingResolution(null)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(2px)",
            zIndex: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <form
            onSubmit={handleResponseSubmit}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 320,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                {pendingResolution.type === "complete" && "Complete Task"}
                {pendingResolution.type === "approve" && "Approve Request"}
                {pendingResolution.type === "reject" && "Reject Request"}
                {pendingResolution.type === "info" && "Submit Response"}
              </span>
              <button type="button" onClick={() => setPendingResolution(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)" }}>AUDIT NOTES</label>
              <textarea
                required={pendingResolution.type === "info"}
                value={resolutionNote}
                onChange={e => setResponseNote(e.target.value)}
                placeholder="Enter audit logs details..."
                rows={2}
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 8px",
                  fontSize: 12,
                  color: "var(--foreground)",
                  outline: "none",
                  resize: "none"
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
              <button
                type="button"
                onClick={() => setPendingResolution(null)}
                className="rounded px-3 py-1.5 bg-secondary hover:bg-accent border border-border cursor-pointer transition-colors"
                style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded px-3 py-1.5 transition-colors cursor-pointer"
                style={{
                  fontSize: 11,
                  fontWeight: 650,
                  border: "none",
                  background: pendingResolution.type === "reject" ? "#ef4444" : "var(--foreground)",
                  color: "var(--background)"
                }}
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hover Tooltip Popup */}
      {hoveredParticipant && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(-50%, -100%)",
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 1000,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }}>
            {hoveredParticipant.name}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
            {hoveredParticipant.role}
          </div>
          <div style={{ fontSize: 9, color: "#6b8cff", fontWeight: 600 }}>
            {hoveredParticipant.team}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: "50%",
              marginLeft: -4,
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid var(--border)",
            }}
          />
        </div>
      )}
    </>
  );

  if (isEmbedded) {
    return (
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-card relative">
        {innerContent}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full relative"
      style={{
        width: 360,
        height: hasHeaderOffset ? "calc(100% - 56px)" : "100%",
        marginTop: hasHeaderOffset ? 56 : 0,
        background: "var(--card)",
        borderLeft: "1px solid var(--border)",
        flexShrink: 0,
        zIndex: 20,
        overflow: "hidden",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.04)",
      }}
    >
      {innerContent}
    </div>
  );
}
