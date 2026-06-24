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

interface TimelineItem {
  id: string;
  timestamp: Date;
  isSystem: boolean;
  systemText?: string;
  systemActor?: string;
  systemStage?: string;
  collabEntry?: CollaborationEntry;
}

export function ActivityWorkspace({ hasHeaderOffset = false }: ActivityWorkspaceProps) {
  const { activeRecord, closeActivity, refreshNotifications } = useActivity();
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [hoveredParticipant, setHoveredParticipant] = useState<Participant | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const stepperRef = useRef<HTMLDivElement>(null);
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

  // Derived Stepper values
  const openTasks = collabData.entries.filter(e => e.type === "task" && e.status === "open");
  const pendingApprovals = collabData.entries.filter(e => e.type === "approval_request" && e.status === "waiting");
  const openInfoRequests = collabData.entries.filter(e => e.type === "info_request" && e.status === "waiting");

  const getDerivedWorkflowStage = () => {
    if (status === "Draft") return 1;
    if (openTasks.length > 0) return 2;
    if (openInfoRequests.length > 0) return 3;
    if (pendingApprovals.length > 0) return 4;
    return 5;
  };

  const derivedStage = getDerivedWorkflowStage();

  // Completion Summary dynamic calculations
  const totalChecklistCount = 3 + collabData.entries.filter(e => e.type !== "discussion").length;
  const completedChecklistCount = 2 + collabData.entries.filter(e => e.type !== "discussion" && (e.status === "completed" || e.status === "approved")).length;
  const completionPercentage = Math.round((completedChecklistCount / totalChecklistCount) * 100);

  // Unified chronological feed assembly
  const timelineItems: TimelineItem[] = [];

  collabData.systemLogs.forEach((log, index) => {
    timelineItems.push({
      id: `sys-${index}-${log.timestamp.getTime()}`,
      timestamp: log.timestamp,
      isSystem: true,
      systemText: log.text,
      systemActor: log.actor,
      systemStage: log.stage
    });
  });

  collabData.entries.forEach(entry => {
    timelineItems.push({
      id: `collab-${entry.id}`,
      timestamp: entry.timestamp,
      isSystem: false,
      collabEntry: entry
    });
  });

  timelineItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

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

  const handleActionSubmit = (type: "task" | "info" | "approval") => {
    if (!selectedMentionUser) return;

    const timestamp = new Date();
    const uniqueId = `action-${Date.now()}`;
    let newEntry: CollaborationEntry;

    if (type === "task") {
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
    } else if (type === "info") {
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
      // Add timeline card
      const updatedEntries = [...prev.entries, newEntry];

      // Add system transition log
      const newSysLog = {
        text: `Alex Johnson initialized collaboration ${newEntry.actionId} assigned to ${newEntry.owner}`,
        timestamp: new Date(),
        stage: derivedStage === 1 ? "Draft" : derivedStage === 2 ? "Data Collection" : derivedStage === 3 ? "Review" : derivedStage === 4 ? "Approval" : "Issued",
        actor: "System"
      };

      return {
        entries: updatedEntries,
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
      const stageName = ["Draft", "Data Collection", "Review", "Approval", "Issued"][transitionStage - 1];

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

  const scrollLeft = () => {
    if (stepperRef.current) {
      stepperRef.current.scrollBy({ left: -80, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (stepperRef.current) {
      stepperRef.current.scrollBy({ left: 80, behavior: "smooth" });
    }
  };

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
      {/* ─── DRAWER HEADER ─── */}
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

        {/* 1. Workflow Tracker (Derived Read-Only) */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
              Workflow Tracker
            </span>
            <div className="flex items-center gap-1">
              <button onClick={scrollLeft} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={scrollRight} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="relative w-full overflow-hidden">
            <div ref={stepperRef} className="flex items-center overflow-x-auto scrollbar-none py-1">
              {[
                { label: "Draft", stepId: 1 },
                { label: "Data Collection", stepId: 2 },
                { label: "Review", stepId: 3 },
                { label: "Approval", stepId: 4 },
                { label: "Issued", stepId: 5 }
              ].map((step, idx, arr) => {
                const isDone = derivedStage > step.stepId;
                const isActive = derivedStage === step.stepId;
                const nextIsDone = idx < arr.length - 1 && derivedStage > arr[idx + 1].stepId;

                return (
                  <div key={step.stepId} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center gap-1" style={{ width: 60 }}>
                      {isDone ? (
                        <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#4ade80", color: "#fff" }}>
                          <CheckCircle2 size={11} strokeWidth={3} />
                        </div>
                      ) : isActive ? (
                        <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#6b8cff", color: "#fff" }}>
                          <Circle size={10} fill="#fff" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "var(--card)", border: "1.5px solid var(--border)", color: "var(--muted-foreground)" }}>
                          <span style={{ fontSize: 8, fontWeight: 750 }}>{step.stepId}</span>
                        </div>
                      )}
                      <span style={{ fontSize: 8.5, color: isDone || isActive ? "var(--foreground)" : "var(--muted-foreground)", fontWeight: isDone || isActive ? 600 : 500, whiteSpace: "nowrap", textAlign: "center" }}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="h-0.5" style={{ width: 18, background: isDone && nextIsDone ? "#4ade80" : "var(--border)", flexShrink: 0 }} />
                    )}
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
            <span style={{ fontSize: 16, fontWeight: 800, color: "#6b8cff" }}>
              {completionPercentage}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full" style={{ background: "var(--secondary)", overflow: "hidden" }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${completionPercentage}%`, background: "#6b8cff" }} />
          </div>

          <span style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
            {completedChecklistCount} of {totalChecklistCount} business checkpoints completed.
          </span>

          <div style={{ borderBottom: "1px solid var(--border)", margin: "8px -16px 0 -16px" }} />
        </div>

        {/* 3. Unified Activity & Collaboration Feed */}
        <div className="flex flex-col gap-3.5">
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
            Audit & Collaboration History
          </span>

          <div className="flex flex-col gap-4 relative pl-1.5">
            {/* Timeline vertical connector axis line */}
            <div className="absolute left-[13px] top-2 bottom-2 w-0.5" style={{ background: "var(--border)" }} />

            {timelineItems.map((item) => {
              if (item.isSystem) {
                // Render System Audit Messages
                return (
                  <div key={item.id} className="flex items-start gap-2.5 relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-border border-2 border-card mt-1.5 z-10 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                        {item.systemText}
                      </span>
                      <span style={{ fontSize: 8.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", marginTop: 1 }}>
                        {item.systemActor} · {item.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              }

              // Render Structured Collaboration cards (TSK, INF, APR, DSC)
              const entry = item.collabEntry!;
              const isResolved = ["completed", "approved", "rejected"].includes(entry.status);

              const badgeColor = {
                completed: "#4ade80",
                approved: "#4ade80",
                rejected: "#ef4444",
                waiting: "#eab308",
                open: "#6b8cff"
              }[entry.status] || "var(--muted-foreground)";

              const priorityColor = {
                critical: "#ef4444",
                high: "#f97316",
                medium: "#eab308",
                low: "var(--muted-foreground)"
              }[entry.priority];

              return (
                <div key={item.id} className="flex items-start gap-2.5 relative">
                  {/* Visual Node */}
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0 z-10"
                    style={{
                      width: 22,
                      height: 22,
                      background: "var(--secondary)",
                      border: `1.5px solid ${priorityColor}`,
                      fontSize: 8.5,
                      fontWeight: 700,
                      color: "var(--foreground)"
                    }}
                  >
                    {entry.actionId.slice(0, 3)}
                  </div>

                  {/* Structured Card */}
                  <div
                    className="flex-1 rounded-xl p-3 flex flex-col gap-2 relative bg-card border border-border transition-all"
                    style={{
                      boxShadow: "0 1px 4px rgba(0,0,0,0.01)"
                    }}
                  >
                    {/* Header bar */}
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[9px] font-bold text-foreground">{entry.actionId}</span>
                        <span className="text-[8px] font-semibold rounded px-1" style={{ border: `1px solid ${badgeColor}`, color: badgeColor }}>
                          {entry.status.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: 8.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                        {entry.timestamp.toLocaleDateString()}
                      </span>
                    </div>

                    {/* Description Body */}
                    <p className="m-0 text-foreground" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                      {entry.content}
                    </p>

                    {/* Task Info */}
                    {entry.type === "task" && entry.dueDate && (
                      <span style={{ fontSize: 10, color: "var(--muted-foreground)", display: "flex", items: "center", gap: 3 }}>
                        <Clock size={10} /> Due Date: <span className="font-mono text-foreground font-semibold">{entry.dueDate}</span>
                      </span>
                    )}

                    {/* Action Roles */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-1.5" style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                      <span>Auth: <strong>{entry.author}</strong></span>
                      <span>·</span>
                      <span>Resp: <strong>{entry.owner}</strong></span>
                    </div>

                    {/* Threaded Audit logs in historyLog */}
                    {entry.historyLog && entry.historyLog.length > 0 && (
                      <div className="rounded bg-secondary p-2 flex flex-col gap-1.5 mt-1 border border-border">
                        {entry.historyLog.map((log, lIdx) => (
                          <div key={lIdx} className="flex flex-col gap-0.5 border-l border-border pl-1.5">
                            <span style={{ fontSize: 10, color: "var(--foreground)" }}>
                              <strong>{log.user}</strong> {log.action.toLowerCase()}
                            </span>
                            {log.note && (
                              <span style={{ fontSize: 9.5, color: "var(--muted-foreground)", fontStyle: "italic" }}>
                                &quot;{log.note}&quot;
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Operational Action Controls */}
                    {!isResolved && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {entry.type === "task" && (
                          <button
                            onClick={() => setPendingResolution({ entryId: entry.id, type: "complete" })}
                            className="rounded px-2.5 py-1 bg-secondary hover:bg-accent border border-border transition-colors cursor-pointer"
                            style={{ fontSize: 10, fontWeight: 650, color: "var(--foreground)" }}
                          >
                            Mark Complete
                          </button>
                        )}
                        {entry.type === "info_request" && (
                          <button
                            onClick={() => setPendingResolution({ entryId: entry.id, type: "info" })}
                            className="rounded px-2.5 py-1 bg-secondary hover:bg-accent border border-border transition-colors cursor-pointer"
                            style={{ fontSize: 10, fontWeight: 650, color: "var(--foreground)" }}
                          >
                            Provide Info
                          </button>
                        )}
                        {entry.type === "approval_request" && (
                          <>
                            <button
                              onClick={() => setPendingResolution({ entryId: entry.id, type: "approve" })}
                              className="rounded px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 transition-colors cursor-pointer"
                              style={{ fontSize: 10, fontWeight: 650 }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setPendingResolution({ entryId: entry.id, type: "reject" })}
                              className="rounded px-2 py-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-500 transition-colors cursor-pointer"
                              style={{ fontSize: 10, fontWeight: 650 }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
