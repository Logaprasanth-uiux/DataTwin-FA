import { useState, useRef, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Send, ChevronRight, ChevronLeft, Check, Clock, Bell, ArrowLeft, Bot, MessageSquare, Plus, UserPlus } from "lucide-react";
import { ActivityRecord } from "../contexts";

interface Props {
  record: ActivityRecord;
  onClose: () => void;
  hasHeaderOffset?: boolean;
}

interface TaskItem {
  id: number;
  user: string;
  task: string;
  status: "Assigned" | "Viewed" | "In Progress" | "Submitted" | "Reviewed" | "Approved" | "Rejected";
  readStatus: "Unread" | "Viewed" | "Acknowledged";
  reminderCount: number;
  lastReminder: string | null;
  thread: { id: number; user: string; text: string; time: string; system?: boolean }[];
}

const PARTICIPANTS = [
  { name: "Loga", role: "Owner", team: "Finance", resp: "Record Owner" },
  { name: "Kumar", role: "Contributor", team: "Procurement", resp: "Vendor Coordination" },
  { name: "Priya", role: "Reviewer", team: "Legal", resp: "Contract Validation" },
  { name: "Finance Team", role: "Approver", team: "Finance", resp: "Budget Approval" },
  { name: "Procurement Team", role: "Approver", team: "Procurement", resp: "Final Sign-off" },
];

const STAGES = ["Draft", "Data Collection", "Review", "Validation", "Approval", "Processed", "Paid"];

function mapStatusToStage(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("draft")) return "Draft";
  if (s.includes("received") || s.includes("registered")) return "Data Collection";
  if (s.includes("sent") || s.includes("progress") || s.includes("risk")) return "Review";
  if (s.includes("validation") || s.includes("compliance") || s.includes("hold") || s.includes("rejected")) return "Validation";
  if (s.includes("approval") || s.includes("validated") || s.includes("financial")) return "Approval";
  if (s.includes("processed") || s.includes("approved")) return "Processed";
  if (s.includes("paid") || s.includes("active") || s.includes("issued") || s.includes("acknowledged")) return "Paid";
  return "Draft";
}

const getInitialFeed = (initialStage: string) => {
  const steps = [
    { id: 1, user: "Loga", action: "created the record", time: "2 days ago", stage: "Draft" },
    { id: 2, user: "Priya", action: "uploaded supporting documents", time: "1 day ago", stage: "Data Collection" },
    { id: 3, user: "Kumar", action: "completed Tax Information", time: "5 hours ago", stage: "Review" },
    { id: 4, user: "System", action: "moved status to Validation", time: "2 hours ago", stage: "Validation" },
    { id: 5, user: "Finance Team", action: "signed off review checklist", time: "1 hour ago", stage: "Approval" },
    { id: 6, user: "System", action: "synced with ERP ledger", time: "30 mins ago", stage: "Processed" },
  ];
  const stageIndex = STAGES.indexOf(initialStage);
  return steps.filter(s => STAGES.indexOf(s.stage) <= stageIndex);
};

const getTasksForStage = (stage: string): TaskItem[] => {
  const t1Status = 
    stage === "Draft" ? "Assigned" :
    stage === "Data Collection" ? "Viewed" :
    stage === "Review" ? "In Progress" :
    stage === "Validation" ? "Submitted" :
    stage === "Approval" ? "Reviewed" : "Approved";

  const t2Status =
    stage === "Draft" ? "Assigned" :
    stage === "Data Collection" ? "Assigned" :
    stage === "Review" ? "Viewed" :
    stage === "Validation" ? "In Progress" :
    stage === "Approval" ? "Submitted" : "Approved";

  return [
    {
      id: 1, user: "Kumar", task: "Delivery Details", status: t1Status, readStatus: (t1Status !== "Assigned" ? "Acknowledged" : "Unread") as TaskItem["readStatus"], reminderCount: 0, lastReminder: null,
      thread: [{ id: 1, user: "Loga", text: "Please update delivery commitments.", time: "1 day ago" }]
    },
    {
      id: 2, user: "Priya", task: "Commercial Details", status: t2Status, readStatus: (t2Status !== "Assigned" ? "Acknowledged" : "Unread") as TaskItem["readStatus"], reminderCount: 1, lastReminder: "1 day ago",
      thread: [
        { id: 1, user: "Loga", text: "Please update pricing and commercial terms.", time: "2 days ago" },
        { id: 2, user: "Priya", text: "Will do. Waiting on supplier confirmation.", time: "1 day ago" }
      ]
    }
  ];
};

export function ActivityWorkspace({ record, onClose, hasHeaderOffset }: Props) {
  const [input, setInput] = useState("");
  const initialStage = mapStatusToStage(record.status);
  const [simulatedStatus, setSimulatedStatus] = useState(initialStage);
  const [feed, setFeed] = useState(() => getInitialFeed(initialStage));
  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  const [tasks, setTasks] = useState<TaskItem[]>(() => getTasksForStage(initialStage));

  const [showAiDetection, setShowAiDetection] = useState(false);
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll feed
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feed, activeTask?.thread]);

  const stages = STAGES.map((label, idx) => {
    const activeIdx = STAGES.indexOf(simulatedStatus);
    return {
      label,
      done: idx < activeIdx,
    };
  });

  const getCompletionPercentage = (stage: string) => {
    switch (stage) {
      case "Draft": return 10;
      case "Data Collection": return 30;
      case "Review": return 50;
      case "Validation": return 70;
      case "Approval": return 85;
      case "Processed": return 95;
      case "Paid": return 100;
      default: return 10;
    }
  };

  const basePct = getCompletionPercentage(simulatedStatus);
  const completedTasks = tasks.filter(t => t.status === "Approved").length;
  const totalTasks = tasks.length + 3; // +3 mock completed sections
  const completionPercentage = simulatedStatus === "Paid" ? 100 : Math.min(99, basePct + completedTasks * 2);

  const handleStageClick = (newStage: string) => {
    setSimulatedStatus(newStage);
    setFeed(prev => [
      ...prev,
      {
        id: Date.now(),
        user: "System",
        action: `moved workflow stage to ${newStage}`,
        time: "Just now",
        stage: newStage
      }
    ]);

    // Update tasks for that stage
    setTasks(getTasksForStage(newStage));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    
    // AI Intent Check
    if (val.toLowerCase().includes("assign") || val.toLowerCase().includes("please complete") || val.toLowerCase().includes("approve")) {
      setShowAiDetection(true);
    } else {
      setShowAiDetection(false);
    }

    // Mention Menu Check
    if (val.includes("@")) {
      setMentionMenuOpen(true);
    } else {
      setMentionMenuOpen(false);
    }
  };

  const handleMentionSelect = (action: string) => {
    setInput(prev => prev.replace(/@\w*$/, `[${action}] `));
    setMentionMenuOpen(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    if (activeTask) {
      const newMsg = { id: Date.now(), user: "Loga", text: input, time: "Just now" };
      setTasks(tasks.map(t => t.id === activeTask.id ? { ...t, thread: [...t.thread, newMsg] } : t));
      setActiveTask({ ...activeTask, thread: [...activeTask.thread, newMsg] });
    } else {
      setFeed(prev => [...prev, { id: Date.now(), user: "Loga", action: `posted a message: "${input}"`, time: "Just now", stage: simulatedStatus }]);
    }
    setInput("");
    setShowAiDetection(false);
    setMentionMenuOpen(false);
  };

  const confirmAiActions = () => {
    setShowAiDetection(false);
    setInput("");
    
    // Add new task
    const newTask: TaskItem = {
      id: Date.now(), user: "Priya", task: "Supplier Agreement", status: "Assigned", readStatus: "Unread", reminderCount: 0, lastReminder: null,
      thread: [{ id: Date.now(), user: "Loga", text: "Please upload supplier agreement.", time: "Just now" }]
    };
    setTasks([...tasks, newTask]);

    setFeed(prev => [
      ...prev,
      { id: Date.now() + 1, user: "System", action: "assigned Supplier Agreement to Priya", time: "Just now", stage: simulatedStatus },
      { id: Date.now() + 2, user: "System", action: "routed to Finance Approval", time: "Just now", stage: simulatedStatus }
    ]);
  };

  const handleNotifyUser = (task: TaskItem) => {
    setFeed(prev => [...prev, { id: Date.now(), user: "System", action: `notified ${task.user} regarding ${task.task}`, time: "Just now", stage: simulatedStatus }]);
    alert(`Notification sent to ${task.user}`);
  };

  const handleSendReminder = (task: TaskItem) => {
    setTasks(tasks.map(t => t.id === task.id ? { ...t, reminderCount: t.reminderCount + 1, lastReminder: "Just now" } : t));
    setFeed(prev => [...prev, { id: Date.now(), user: "System", action: `sent reminder to ${task.user} for ${task.task}`, time: "Just now", stage: simulatedStatus }]);
  };

  const updateTaskStatus = (task: TaskItem, newStatus: TaskItem["status"]) => {
    const updatedTask = { 
      ...task, 
      status: newStatus, 
      readStatus: (newStatus !== "Assigned" ? "Acknowledged" : "Unread") as TaskItem["readStatus"] 
    };
    const newTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
    setTasks(newTasks);
    if (activeTask?.id === task.id) setActiveTask(updatedTask);
    
    setFeed(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        user: task.user, 
        action: `updated task "${task.task}" to ${newStatus}`, 
        time: "Just now", 
        stage: simulatedStatus 
      }
    ]);

    // Auto-advance stage based on task completion
    const allApproved = newTasks.every(t => t.status === "Approved");
    const anyRejected = newTasks.some(t => t.status === "Rejected");
    
    if (allApproved && (simulatedStatus !== "Processed" && simulatedStatus !== "Paid")) {
      setSimulatedStatus("Processed");
      setFeed(prev => [...prev, { id: Date.now() + 1, user: "System", action: "moved status to Processed (all tasks approved)", time: "Just now", stage: "Processed" }]);
    } else if (anyRejected && simulatedStatus !== "Validation") {
      setSimulatedStatus("Validation");
      setFeed(prev => [...prev, { id: Date.now() + 1, user: "System", action: "moved status to Validation (task rejected)", time: "Just now", stage: "Validation" }]);
    }
  };

  const advanceTaskState = (task: TaskItem) => {
    const states: TaskItem["status"][] = ["Assigned", "Viewed", "In Progress", "Submitted", "Reviewed", "Approved"];
    const idx = states.indexOf(task.status);
    if (idx < states.length - 1) {
      updateTaskStatus(task, states[idx + 1]);
    }
  };

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  }

  return (
    <div
      className="flex flex-col shadow-xl"
      style={{
        width: 440,
        height: hasHeaderOffset ? "calc(100% - 56px)" : "100%",
        marginTop: hasHeaderOffset ? 56 : 0,
        background: "var(--background)",
        borderLeft: "1px solid var(--border)",
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
        <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "var(--foreground)", color: "var(--background)" }}>
          <MessageSquare size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Activity Workspace
          </p>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Collaboration & Audit History</p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-md transition-colors"
          style={{ width: 32, height: 32, background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--secondary)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        
        {/* Thread View vs Main View */}
        {activeTask ? (
          <div className="flex flex-col">
            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
              <button 
                onClick={() => setActiveTask(null)}
                className="flex items-center justify-center rounded p-1"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{activeTask.task}</p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Assigned to {activeTask.user}</p>
              </div>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2 p-3 rounded-lg w-full" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Lifecycle Status</p>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold mt-1 inline-block" style={{ background: "var(--card)", border: "1px solid var(--border)", color: activeTask.status === "Approved" ? "#4ade80" : activeTask.status === "Rejected" ? "#f87171" : "var(--foreground)" }}>
                      {activeTask.status}
                    </span>
                  </div>
                  {activeTask.status === "Submitted" || activeTask.status === "Reviewed" ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateTaskStatus(activeTask, "Approved")}
                        className="rounded px-2.5 py-1 text-white bg-green-500 hover:bg-green-600 transition-colors"
                        style={{ fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => updateTaskStatus(activeTask, "Rejected")}
                        className="rounded px-2.5 py-1 text-white bg-red-500 hover:bg-red-600 transition-colors"
                        style={{ fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : activeTask.status === "Approved" || activeTask.status === "Rejected" ? (
                    <button 
                      onClick={() => updateTaskStatus(activeTask, "Assigned")}
                      className="rounded px-2 py-1 hover:bg-accent transition-colors"
                      style={{ fontSize: 11, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
                    >
                      Reset to Assigned
                    </button>
                  ) : (
                    <button 
                      onClick={() => advanceTaskState(activeTask)}
                      className="rounded px-2 py-1 hover:bg-accent transition-colors"
                      style={{ fontSize: 11, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
                    >
                      Simulate Next Stage
                    </button>
                  )}
                </div>
              </div>

              {activeTask.thread.map((msg, i) => (
                <div key={i} className="flex flex-col gap-1" style={{ alignItems: msg.user === "Loga" ? "flex-end" : "flex-start" }}>
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{msg.user} • {msg.time}</span>
                  <div className="rounded-xl px-3 py-2" style={{ maxWidth: "85%", fontSize: 13, background: msg.user === "Loga" ? "var(--foreground)" : "var(--secondary)", color: msg.user === "Loga" ? "var(--background)" : "var(--foreground)" }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            
            {/* Record Summary Card Header */}
            <div className="m-5 p-4 rounded-xl flex flex-col gap-3 relative overflow-visible" style={{ background: "var(--secondary)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.5 }}>{record.type}</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", marginTop: 2 }}>{record.id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: "var(--card)", border: "1px solid var(--border)" }}>
                    {simulatedStatus}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p style={{ fontSize: 12, color: "var(--foreground)" }}>{record.name}</p>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Created by {record.createdBy} on {record.createdDate}</p>
                </div>
              </div>
            </div>

            {/* Participants (Chips + Hover Cards) */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" }}>Participants</p>
              <div className="flex items-center flex-wrap gap-2 relative">
                {(participantsExpanded ? PARTICIPANTS : PARTICIPANTS.slice(0, 4)).map((p, i) => (
                  <div key={i} className="relative group">
                    <div 
                      className="flex items-center justify-center rounded-full text-xs font-semibold cursor-pointer"
                      style={{ 
                        width: 32, height: 32, 
                        background: i === 0 ? "var(--foreground)" : "var(--secondary)", 
                        color: i === 0 ? "var(--background)" : "var(--foreground)", 
                        border: i !== 0 ? "1px solid var(--border)" : "none" 
                      }}
                      onMouseEnter={() => setHoveredParticipant(p.name)}
                      onMouseLeave={() => setHoveredParticipant(null)}
                    >
                      {getInitials(p.name)}
                    </div>
                    {hoveredParticipant === p.name && (
                      <div className="absolute z-50 top-full left-1/2 mt-2 -translate-x-1/2 p-3 rounded-xl shadow-lg w-48" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 6 }}>{p.role}</p>
                        <div className="flex flex-col gap-1">
                          <p style={{ fontSize: 11, color: "var(--foreground)" }}><span style={{ color: "var(--muted-foreground)" }}>Team:</span> {p.team}</p>
                          <p style={{ fontSize: 11, color: "var(--foreground)" }}><span style={{ color: "var(--muted-foreground)" }}>Task:</span> {p.resp}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {!participantsExpanded && PARTICIPANTS.length > 4 && (
                  <button 
                    onClick={() => setParticipantsExpanded(true)}
                    className="flex items-center justify-center rounded-full text-xs font-semibold"
                    style={{ width: 32, height: 32, background: "var(--secondary)", color: "var(--foreground)", border: "1px dashed var(--border)", cursor: "pointer" }}
                  >
                    +{PARTICIPANTS.length - 4}
                  </button>
                )}
              </div>
            </div>

            {/* Workflow Tracker (Interactive) */}
            <div className="px-5 pb-5">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 12 }}>Workflow Tracker</p>
              <div className="flex items-center justify-between relative px-2">
                <div style={{ position: "absolute", top: 12, left: 16, right: 16, height: 2, background: "var(--border)", zIndex: 0 }} />
                <div style={{ position: "absolute", top: 12, left: 16, width: `${(STAGES.indexOf(simulatedStatus) / Math.max(1, STAGES.length - 1)) * 100}%`, height: 2, background: "#4ade80", zIndex: 1, transition: "width 0.3s ease" }} />
                
                {stages.map((stage, i) => {
                  const isActive = stage.label === simulatedStatus;
                  const isDone = stage.done || STAGES.indexOf(simulatedStatus) > i;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group" style={{ zIndex: 2 }} onClick={() => handleStageClick(stage.label)}>
                      <div 
                        className="flex items-center justify-center rounded-full transition-all duration-200 group-hover:scale-110"
                        style={{ 
                          width: 24, height: 24, 
                          background: isActive ? "#4ade80" : isDone ? "var(--secondary)" : "var(--card)", 
                          border: isDone || isActive ? "none" : "2px solid var(--border)",
                          color: isActive ? "#fff" : isDone ? "#4ade80" : "transparent"
                        }}
                      >
                        {(isDone || isActive) && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? "var(--foreground)" : "var(--muted-foreground)", textAlign: "center", width: 48 }}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion Progress Block */}
            <div className="px-5 pb-5">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 8 }}>Completion Progress</p>
              <div className="p-4 rounded-xl flex flex-col gap-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{completionPercentage}% Complete</span>
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{3 + completedTasks} of {totalTasks} sections</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full transition-all duration-500" style={{ width: `${completionPercentage}%`, background: completionPercentage === 100 ? "#4ade80" : "#6b8cff" }} />
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>✓ General, Tax, Banking (Completed)</p>
                  {tasks.filter(t => t.status !== "Approved").map(t => (
                    <p key={t.id} style={{ fontSize: 11, color: "var(--foreground)" }}>• Pending: {t.task} ({t.user})</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Blockers Block */}
            <div className="px-5 pb-5">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 8 }}>Pending Blockers</p>
              {(() => {
                const getBlockerInfo = (stage: string) => {
                  switch (stage) {
                    case "Draft":
                      return {
                        severity: "high",
                        title: "Critical Blocker",
                        text: "Awaiting record completion and submission of primary fields."
                      };
                    case "Data Collection":
                      return {
                        severity: "high",
                        title: "Critical Blocker",
                        text: "Missing partner tax compliance forms and verified bank details."
                      };
                    case "Review":
                      return {
                        severity: "medium",
                        title: "Attention Required",
                        text: "Standard compliance verification of agreement clauses in progress."
                      };
                    case "Validation":
                      return {
                        severity: "high",
                        title: "Critical Blocker",
                        text: "Mismatch of GST details on record versus master registry."
                      };
                    case "Approval":
                      return {
                        severity: "medium",
                        title: "Attention Required",
                        text: "Awaiting final authorization sign-off from Finance Board."
                      };
                    case "Processed":
                      return {
                        severity: "low",
                        title: "Process Pending",
                        text: "ERP synchronization in queue, pending banking ledger update."
                      };
                    case "Paid":
                      return {
                        severity: "none",
                        title: "Clear",
                        text: "No pending blockers. Record workflow completed successfully."
                      };
                    default:
                      return {
                        severity: "none",
                        title: "Clear",
                        text: "No pending blockers."
                      };
                  }
                };
                const blocker = getBlockerInfo(simulatedStatus);
                if (blocker.severity === "none") {
                  return (
                    <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                      <CheckCircle size={16} className="mt-0.5" style={{ color: "#4ade80", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{blocker.title}</p>
                        <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{blocker.text}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="p-4 rounded-xl flex items-start gap-3" style={{ 
                    background: blocker.severity === "high" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)", 
                    border: "1px solid",
                    borderColor: blocker.severity === "high" ? "rgba(248,113,113,0.2)" : "rgba(251,191,36,0.2)"
                  }}>
                    <AlertCircle size={16} className="mt-0.5" style={{ 
                      color: blocker.severity === "high" ? "#f87171" : "#fbbf24",
                      flexShrink: 0
                    }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{blocker.title}</p>
                      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{blocker.text}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Assigned Work */}
            {tasks.length > 0 && (
              <div className="px-5 pb-5 flex flex-col gap-3">
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" }}>Assigned Work</p>
                {tasks.map(task => (
                  <div key={task.id} className="p-4 rounded-xl flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={() => setActiveTask(task)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>{getInitials(task.user)}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{task.task}</p>
                          <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Assigned to {task.user}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded flex items-center gap-1" style={{ fontSize: 10, fontWeight: 600, background: "var(--secondary)", color: "var(--foreground)" }}>
                        {task.status === "Approved" ? <CheckCircle size={10} className="text-green-500"/> : <Clock size={10} />}
                        {task.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span style={{ fontSize: 11, color: task.readStatus === "Unread" ? "#f87171" : "var(--muted-foreground)" }}>
                        {task.readStatus}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleNotifyUser(task); }} className="p-1.5 rounded-md hover:bg-accent" title="Send Notification">
                          <Bell size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSendReminder(task); }} className="p-1.5 rounded-md hover:bg-accent flex items-center gap-1" title="Send Follow-up Reminder">
                          <Clock size={12} />
                          <span style={{ fontSize: 10 }}>{task.reminderCount}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Audit History / Feed */}
            <div className="px-5 pb-5">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 12 }}>Activity History</p>
              <div className="flex flex-col gap-4 relative">
                <div style={{ position: "absolute", top: 10, bottom: 10, left: 15, width: 1, background: "var(--border)" }} />
                {feed.map((item, i) => (
                  <div key={i} className="flex gap-4 relative z-10">
                    <div className="flex items-center justify-center rounded-full mt-1" style={{ width: 30, height: 30, background: "var(--card)", border: "1px solid var(--border)", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {item.user === "System" ? <Bot size={14} /> : getInitials(item.user)}
                    </div>
                    <div className="flex flex-col">
                      <p style={{ fontSize: 13, color: "var(--foreground)" }}><span style={{ fontWeight: 600 }}>{item.user}</span> {item.action}</p>
                      <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{item.time} • Stage: {item.stage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Input Box with Overlays */}
      <div className="p-4" style={{ borderTop: "1px solid var(--border)", background: "var(--card)" }}>
        
        {/* Mention Overlay */}
        {mentionMenuOpen && (
          <div className="absolute bottom-20 left-4 right-4 rounded-xl shadow-xl p-2 flex flex-col gap-1" style={{ background: "var(--card)", border: "1px solid var(--border)", zIndex: 100 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", padding: "4px 8px" }}>Select Action</p>
            {["Assign Task", "Request Information", "Request Approval"].map((act, i) => (
              <button 
                key={i} 
                onClick={() => handleMentionSelect(act)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
                style={{ fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {act === "Assign Task" ? <CheckCircle size={14}/> : act === "Request Approval" ? <Check size={14}/> : <MessageSquare size={14}/>}
                {act}
              </button>
            ))}
          </div>
        )}

        {/* AI Action Detection Overlay */}
        {showAiDetection && !mentionMenuOpen && (
          <div className="absolute bottom-20 left-4 right-4 rounded-xl shadow-xl p-4 flex flex-col gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)", zIndex: 100 }}>
            <div className="flex items-center gap-2 text-[#6b8cff]">
              <Bot size={16} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Detected Actions</span>
            </div>
            <div className="p-3 rounded-lg flex flex-col gap-2" style={{ background: "var(--secondary)" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Assign Task</span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Priya</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--foreground)" }}>Supplier Agreement</span>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={confirmAiActions} className="flex-1 rounded-lg py-2" style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>Confirm & Route</button>
              <button onClick={() => setShowAiDetection(false)} className="rounded-lg px-3 py-2" style={{ fontSize: 12, fontWeight: 600, background: "var(--secondary)", color: "var(--foreground)", border: "none", cursor: "pointer" }}>Dismiss</button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--secondary)", position: "relative" }}>
          <input
            value={input}
            onChange={handleInput}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder={activeTask ? `Reply in thread...` : "Type a message, @mention or request..."}
            className="flex-1 bg-transparent border-none outline-none"
            style={{ fontSize: 13, color: "var(--foreground)" }}
          />
          <button
            onClick={handleSend}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 32, height: 32, background: input.trim() ? "var(--foreground)" : "transparent", color: input.trim() ? "var(--background)" : "var(--muted-foreground)", border: "none", cursor: "pointer" }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
