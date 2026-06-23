import { useState, useRef } from "react";

if (typeof document !== "undefined" && !document.getElementById("__hide_scrollbar_style")) {
  const s = document.createElement("style");
  s.id = "__hide_scrollbar_style";
  s.textContent = `
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
  `;
  document.head.appendChild(s);
}
import { X, BotMessageSquare, CheckCircle2, Circle, Clock, FileText, User, Building, Receipt, ShoppingCart, AlertCircle, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useActivity } from "../contexts";

interface ActivityWorkspaceProps {
  hasHeaderOffset?: boolean;
}

interface Participant {
  initials: string;
  name: string;
  role: string;
  team: string;
}

const participantsData: Participant[] = [
  { initials: "LO", name: "Loga", role: "Procurement Lead", team: "Procurement" },
  { initials: "KU", name: "Kunal", role: "Finance Controller", team: "Finance" },
  { initials: "PR", name: "Priya", role: "Legal Counsel", team: "Legal" },
  { initials: "FI", name: "Finance Team", role: "AP Specialist", team: "Accounts Payable" },
  { initials: "AM", name: "Amit Patel", role: "Purchasing Officer", team: "Procurement" },
  { initials: "SJ", name: "Sarah Jenkins", role: "Chief Compliance Officer", team: "Compliance" },
];

export function ActivityWorkspace({ hasHeaderOffset = false }: ActivityWorkspaceProps) {
  const { activeRecord, closeActivity } = useActivity();
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [hoveredParticipant, setHoveredParticipant] = useState<Participant | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const stepperRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (stepperRef.current) {
      stepperRef.current.scrollBy({ left: -100, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (stepperRef.current) {
      stepperRef.current.scrollBy({ left: 100, behavior: "smooth" });
    }
  };

  if (!activeRecord) return null;

  const { type, id, status = "Approved", createdBy = "Alex Johnson", createdDate = "Jun 01, 2026" } = activeRecord;

  // Visual content mapping for different types
  const getRecordTitle = () => {
    switch (type) {
      case "Purchase Order":
        return "PURCHASE ORDER";
      case "Bill":
        return "BILL / INVOICE";
      case "Vendor":
        return "VENDOR RECORD";
      case "Organization":
        return "ORGANIZATION";
      default:
        return type.toUpperCase();
    }
  };

  const getRecordEntityName = () => {
    if (type === "Purchase Order") return "TechSupply Co";
    if (type === "Bill") return "OfficeMax Pro";
    if (type === "Vendor") return activeRecord.id === "VND-001" ? "TechSupply Co" : "OfficeMax Pro";
    return "Acme Corp";
  };

  const getRecordIcon = () => {
    switch (type) {
      case "Purchase Order":
        return <ShoppingCart size={14} />;
      case "Bill":
        return <Receipt size={14} />;
      case "Vendor":
        return <User size={14} />;
      case "Organization":
        return <Building size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, p: Participant) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 8,
    });
    setHoveredParticipant(p);
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
      {/* Drawer Header */}
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
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-20 flex flex-col gap-5">
        
        {/* Compact Header Area */}
        <div className="flex flex-col relative">
          {/* Close button top right */}
          <button
            onClick={closeActivity}
            style={{
              position: "absolute",
              top: -4,
              right: -4,
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

          {/* Record type + Status Badge */}
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

          {/* Record Number */}
          <h1 style={{ fontSize: 17, fontWeight: 750, color: "var(--foreground)", margin: "4px 0 2px 0", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
            {id}
          </h1>

          {/* Entity Name / Vendor Name */}
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--foreground)" }}>
            {getRecordEntityName()}
          </div>

          {/* Creation detail lines */}
          <div className="flex items-center gap-2 mt-3" style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            <span>Created by <strong style={{ color: "var(--foreground)", fontWeight: 650 }}>{createdBy}</strong></span>
            <span>·</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{createdDate}</span>
          </div>

          {/* Dotted divider */}
          <div style={{ borderTop: "1px dashed var(--border)", margin: "12px 0" }} />

          {/* Participants */}
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
              PARTICIPANTS
            </span>
            <div className="flex items-center gap-1">
              {(showAllParticipants ? participantsData : participantsData.slice(0, 4)).map((p, idx) => (
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
              {!showAllParticipants && (
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
                  title="Show all participants"
                >
                  +2
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
                    fontSize: 8,
                    fontWeight: 700,
                    padding: 0,
                  }}
                  title="Collapse"
                >
                  -
                </button>
              )}
            </div>
          </div>

          {/* Section Divider */}
          <div style={{ borderBottom: "1px solid var(--border)", margin: "14px -16px 0 -16px" }} />
        </div>

        {/* 1. Workflow Tracker Stepper */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
              Workflow Tracker
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={scrollLeft}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}
                title="Scroll Left"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={scrollRight}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}
                title="Scroll Right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Steps Stepper */}
          <div className="relative w-full overflow-hidden">
            <div
              ref={stepperRef}
              className="flex items-center overflow-x-auto scrollbar-none"
              style={{
                padding: "6px 2px",
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {[
                { label: "Draft", status: "done", id: 1 },
                { label: "Data Collection", status: "done", id: 2 },
                { label: "Review", status: "done", id: 3 },
                { label: "Approval", status: "done", id: 4 },
                { label: "Issued", status: "pending", id: 5 },
                { label: "Ackr", status: "pending", id: 6 },
              ].map((step, idx, arr) => {
                const isDone = step.status === "done";
                const nextStepIsDone = idx < arr.length - 1 && arr[idx + 1].status === "done";
                
                return (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center gap-1" style={{ width: 50 }}>
                      {isDone ? (
                        <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#4ade80", color: "#fff" }}>
                          <CheckCircle2 size={11} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "var(--card)", border: "1.5px solid var(--border)", color: "var(--muted-foreground)" }}>
                          <span style={{ fontSize: 8, fontWeight: 750 }}>{step.id}</span>
                        </div>
                      )}
                      <span style={{ fontSize: 8, color: isDone ? "var(--foreground)" : "var(--muted-foreground)", fontWeight: isDone ? 600 : 500, whiteSpace: "nowrap", textAlign: "center" }}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div
                        className="h-0.5"
                        style={{
                          width: 12,
                          background: isDone && nextStepIsDone ? "#4ade80" : "var(--border)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border)", margin: "8px -16px 0 -16px" }} />
        </div>

        {/* 2. Completion Summary & 3. Blockers */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
              Completion Summary
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)" }}>
              82%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full" style={{ background: "var(--secondary)", overflow: "hidden" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: "82%",
                background: "#6b8cff",
              }}
            />
          </div>

          {/* Side-by-side lists */}
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            {/* Completed */}
            <div className="flex flex-col gap-2">
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>
                COMPLETED (3)
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  "Vendor Details",
                  "Financial Details",
                  "Commercial Details",
                ].map(item => (
                  <div key={item} className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
                    <CheckCircle2 size={12} style={{ color: "#4ade80", flexShrink: 0 }} />
                    <span style={{ color: "var(--foreground)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending */}
            <div className="flex flex-col gap-2">
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>
                PENDING (2)
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  "Delivery Details",
                  "Supporting Documents",
                ].map(item => (
                  <div key={item} className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
                    <Circle size={12} style={{ color: "var(--border)", flexShrink: 0 }} />
                    <span style={{ color: "var(--muted-foreground)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blockers Alert Box */}
          <div
            className="rounded-lg p-3 flex flex-col gap-1 mt-2"
            style={{
              background: "#fff1f2",
              border: "1px solid #ffe4e6",
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#ef4444", fontSize: 9.5, letterSpacing: "0.04em" }}>
              <AlertCircle size={12} />
              BLOCKERS
            </div>
            <div style={{ fontSize: 11, color: "#f43f5e", fontWeight: 500, paddingLeft: 18 }}>
              Missing delivery schedule approval
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border)", margin: "8px -16px 0 -16px" }} />
        </div>

        {/* 4. Assigned Work */}
        <div className="flex flex-col gap-2.5">
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
            Assigned Work
          </span>
          
          <div
            className="rounded-xl p-3.5 flex flex-col gap-2.5"
            style={{
              background: "#f8fafc",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex justify-between items-center">
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--foreground)" }}>
                Delivery Details
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  fontSize: 9.5,
                  background: "rgba(30,41,59,0.06)",
                  color: "var(--muted-foreground)",
                }}
              >
                Pending
              </span>
            </div>
            
            <div className="flex justify-between items-center mt-1.5">
              <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                Assigned to: <strong style={{ color: "var(--foreground)", fontWeight: 650 }}>Kumar</strong>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 10.5 }}>
                <Clock size={11} style={{ opacity: 0.6 }} />
                <span style={{ fontFamily: "var(--font-mono)" }}>25-Jun</span>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border)", margin: "8px -16px 0 -16px" }} />
        </div>

        {/* 5. Audit & Activity Feed */}
        <div className="flex flex-col gap-3.5">
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)" }}>
            Audit & Activity Feed
          </span>
          
          <div className="flex flex-col relative pl-2 gap-5 mt-1">
            {/* Timeline vertical connector axis line */}
            <div
              className="absolute left-4.5 top-3 bottom-3 w-0.5"
              style={{ background: "var(--border)" }}
            />

            {/* Event 1: Loga created the record */}
            <div className="flex items-start gap-3 relative">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 z-10"
                style={{
                  width: 24,
                  height: 24,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                LO
              </div>
              <div className="flex flex-col">
                <div style={{ fontSize: 11.5, color: "var(--foreground)" }}>
                  <strong style={{ fontWeight: 700 }}>Loga</strong> created the record
                </div>
                <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                  <span>2 days ago</span>
                  <span>·</span>
                  <span>Stage: Draft</span>
                </div>
              </div>
            </div>

            {/* Event 2: Priya uploaded supporting documents */}
            <div className="flex items-start gap-3 relative">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 z-10"
                style={{
                  width: 24,
                  height: 24,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                PR
              </div>
              <div className="flex flex-col">
                <div style={{ fontSize: 11.5, color: "var(--foreground)" }}>
                  <strong style={{ fontWeight: 700 }}>Priya</strong> uploaded supporting documents
                </div>
                <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                  <span>1 day ago</span>
                  <span>·</span>
                  <span>Stage: Data Collection</span>
                </div>
              </div>
            </div>

            {/* Event 3: Kumar completed Tax Information */}
            <div className="flex items-start gap-3 relative">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 z-10"
                style={{
                  width: 24,
                  height: 24,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                KU
              </div>
              <div className="flex flex-col">
                <div style={{ fontSize: 11.5, color: "var(--foreground)" }}>
                  <strong style={{ fontWeight: 700 }}>Kumar</strong> completed Tax Information
                </div>
                <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                  <span>5 hours ago</span>
                  <span>·</span>
                  <span>Stage: Review</span>
                </div>
              </div>
            </div>

            {/* Event 4: System moved status from Review to Validation */}
            <div className="flex items-start gap-3 relative">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 z-10"
                style={{
                  width: 24,
                  height: 24,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                SY
              </div>
              <div className="flex flex-col">
                <div style={{ fontSize: 11.5, color: "var(--foreground)" }}>
                  <strong style={{ fontWeight: 700 }}>System</strong> moved status from Review to Validation
                </div>
                <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: 9.5, color: "var(--muted-foreground)" }}>
                  <span>2 hours ago</span>
                  <span>·</span>
                  <span>Stage: Validation</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 7. Footer / Input Box Mock */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3"
        style={{
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          zIndex: 30,
        }}
      >
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <input
            type="text"
            placeholder="Type @ to assign or collaborate..."
            disabled
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "var(--muted-foreground)",
            }}
          />
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "not-allowed",
              color: "var(--muted-foreground)",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            disabled
          >
            <Send size={13} />
          </button>
        </div>
      </div>

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
