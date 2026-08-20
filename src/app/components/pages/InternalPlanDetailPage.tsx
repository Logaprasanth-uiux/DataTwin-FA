import { useState, useEffect } from "react";
import { X, Check, CheckCircle2, Plus, Trash2, Copy, Download, Edit3, Lock } from "lucide-react";
import { useActivity } from "../../contexts";

const statusColor: Record<string, string> = {
  Active: "#4ade80",
  Validated: "#4ade80",
  Activated: "#4ade80",
  Pending: "#fbbf24",
  Rejected: "#f87171"
};

const orgDetailsMap: Record<string, { id: string; pan: string; pos: string; address: string; costCentre: string }> = {
  "ABC Chemicals Ltd": {
    id: "OM0000000003",
    pan: "AAACB1234F",
    pos: "27-Maharashtra",
    address: "Plot 42, MIDC Chemical Zone, Tarapur, Maharashtra 401506",
    costCentre: "CC-CHEM-2026"
  },
  "Demo Industrial Works Pvt Ltd": {
    id: "OM0000000002",
    pan: "AABCD5678G",
    pos: "27-Maharashtra",
    address: "Survey No. 118/2, Industrial Estate, Pune, Maharashtra 411018",
    costCentre: "CC-OPS-2026"
  },
  "Global BioPharma Ingredients Inc.": {
    id: "OM0000000001",
    pan: "AABCG9012H",
    pos: "33-Tamil Nadu",
    address: "TechBio Park, Phase II, Chennai, Tamil Nadu 600113",
    costCentre: "CC-PHARMA-2026"
  },
  "HealthLogistics Pvt Ltd": {
    id: "OM0000000004",
    pan: "AABCH3456J",
    pos: "29-Karnataka",
    address: "Plot 12, Logistic Hub, Peenya, Bengaluru, Karnataka 560058",
    costCentre: "CC-LOG-2026"
  },
  "EuroLab Compliance Services GmbH": {
    id: "OM0000000005",
    pan: "AABCJ7890K",
    pos: "36-Telangana",
    address: "HITEC City, Madhapur, Hyderabad, Telangana 500081",
    costCentre: "CC-COMP-2026"
  }
};

const orgOptions = [
  "ABC Chemicals Ltd",
  "Demo Industrial Works Pvt Ltd",
  "Global BioPharma Ingredients Inc.",
  "HealthLogistics Pvt Ltd",
  "EuroLab Compliance Services GmbH"
];

interface SummaryRow {
  lineId: string;
  subPlanningElementName: string;
  baseValue: string;
}

interface DetailsRow {
  lineId: string;
  speNumber: string;
  speName: string;
  level: string;
}

interface InternalPlanDetailPageProps {
  record: {
    id: string;
    orgName: string;
    date: string;
    vendorId: string;
    vendorName: string;
    status: string;
  };
  onClose: () => void;
}

interface SectionCardProps {
  title: string;
  isEditable?: boolean;
  editing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, isEditable, editing, onEdit, onSave, onCancel, rightAction, children }: SectionCardProps) {
  return (
    <div className="rounded-xl overflow-hidden w-full" style={{ background: "var(--card)", border: "1px solid var(--border)", flexShrink: 0 }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
        <div className="flex items-center gap-2">
          {rightAction}
          {onEdit !== undefined && (
            !editing ? (
              isEditable ? (
                <button 
                  type="button"
                  onClick={onEdit}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 cursor-pointer transition-colors"
                  style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
                >
                  <Edit3 size={11} /> Edit
                </button>
              ) : (
                <div 
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                  style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--muted)", border: "1px solid var(--border)", cursor: "not-allowed", opacity: 0.6 }}
                >
                  <Lock size={10} /> Edit
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 cursor-pointer"
                  style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                >
                  <X size={11} /> Cancel
                </button>
                <button 
                  type="button"
                  onClick={onSave}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 cursor-pointer"
                  style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none" }}
                >
                  <Check size={11} /> Save
                </button>
              </div>
            )
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ViewField({ label, value, mono, required }: { label: string; value: string; mono?: boolean; required?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>
        {label.toUpperCase()} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </span>
      <span style={{ fontSize: 13, color: value ? "var(--foreground)" : "var(--muted-foreground)", fontFamily: mono ? "var(--font-mono)" : undefined, lineHeight: 1.5 }}>
        {value || "—"}
      </span>
    </div>
  );
}

function ELabelInput({ label, value, onChange, placeholder, required, type = "text", disabled, mono }: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; required?: boolean; type?: string; disabled?: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>
        {label.toUpperCase()} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={disabled ? "cursor-not-allowed opacity-80" : ""}
        style={{
          height: 34,
          background: disabled ? "var(--muted)" : "var(--secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          outline: "none",
          fontSize: 13,
          fontFamily: mono ? "var(--font-mono)" : undefined,
          color: "var(--foreground)",
          padding: "0 10px",
          width: "100%"
        }}
      />
    </div>
  );
}

function ELabelSelect({ label, value, onChange, options, required, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>
        {label.toUpperCase()} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        style={{
          height: 34,
          background: disabled ? "var(--muted)" : "var(--secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          outline: "none",
          fontSize: 13,
          color: "var(--foreground)",
          padding: "0 10px",
          width: "100%",
          cursor: disabled ? "not-allowed" : "pointer"
        }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export function InternalPlanDetailPage({ record, onClose }: InternalPlanDetailPageProps) {
  const { openActivity } = useActivity();
  const [activeTab, setActiveTab] = useState<"Organization Info" | "Internal Plan Summary" | "Internal Plan Details">("Organization Info");
  const [status, setStatus] = useState(record.status || "Active");

  // Status-based editability
  const isEditable = status === "Active" || status === "Pending" || status === "Rejected" || status === "Draft";

  // Section edit states
  const [editingOrg, setEditingOrg] = useState(false);

  // Field values
  const [orgName, setOrgName] = useState(record.orgName || "ABC Chemicals Ltd");
  const initialOrgDetails = orgDetailsMap[record.orgName] || {
    id: "OM0000000003",
    pan: "AAACB1234F",
    pos: "27-Maharashtra",
    address: "Plot 42, MIDC Chemical Zone, Tarapur, Maharashtra 401506",
    costCentre: "CC-CHEM-2026"
  };
  const [orgId, setOrgId] = useState(initialOrgDetails.id);
  const [orgPan, setOrgPan] = useState(initialOrgDetails.pan);
  const [orgPos, setOrgPos] = useState(initialOrgDetails.pos);
  const [orgAddress, setOrgAddress] = useState(initialOrgDetails.address);
  const [peDate, setPeDate] = useState(record.date || "11-07-2026");
  const [costCentre, setCostCentre] = useState(initialOrgDetails.costCentre);

  // Draft edits for Org
  const [draftOrgName, setDraftOrgName] = useState(orgName);
  const [draftOrgId, setDraftOrgId] = useState(orgId);
  const [draftOrgPan, setDraftOrgPan] = useState(orgPan);
  const [draftOrgPos, setDraftOrgPos] = useState(orgPos);
  const [draftOrgAddress, setDraftOrgAddress] = useState(orgAddress);
  const [draftPeDate, setDraftPeDate] = useState(peDate);
  const [draftCostCentre, setDraftCostCentre] = useState(costCentre);

  // Tab 2: Summary rows
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([
    { lineId: "1", subPlanningElementName: "Ashok Rai Commerc", baseValue: "130000000" }
  ]);

  // Tab 3: Details rows
  const [detailsRows, setDetailsRows] = useState<DetailsRow[]>([
    { lineId: "1", speNumber: "SPE0226270001", speName: "Ashok Rai Commercial Construction & Procurement", level: "Level 1" }
  ]);

  // AI Workspace Activity Context Sync
  useEffect(() => {
    openActivity({
      type: "Internal Plan",
      id: record.id,
      status: status,
      createdBy: "Alex Johnson",
      createdDate: record.date
    });

    return () => {
      openActivity(null as any);
    };
  }, [record, status, openActivity]);

  const tabs: ("Organization Info" | "Internal Plan Summary" | "Internal Plan Details")[] = [
    "Organization Info",
    "Internal Plan Summary",
    "Internal Plan Details"
  ];

  // Org Edit Handlers
  const handleStartEditOrg = () => {
    setDraftOrgName(orgName);
    setDraftOrgId(orgId);
    setDraftOrgPan(orgPan);
    setDraftOrgPos(orgPos);
    setDraftOrgAddress(orgAddress);
    setDraftPeDate(peDate);
    setDraftCostCentre(costCentre);
    setEditingOrg(true);
  };

  const handleSaveOrg = () => {
    setOrgName(draftOrgName);
    setOrgId(draftOrgId);
    setOrgPan(draftOrgPan);
    setOrgPos(draftOrgPos);
    setOrgAddress(draftOrgAddress);
    setPeDate(draftPeDate);
    setCostCentre(draftCostCentre);
    setEditingOrg(false);
  };

  const handleCancelOrg = () => {
    setEditingOrg(false);
  };

  // Actions for Summary Rows
  const handleAddSummaryRow = () => {
    const nextLineId = String(summaryRows.length + 1);
    setSummaryRows(prev => [
      ...prev,
      { lineId: nextLineId, subPlanningElementName: "Operations & Supply Element", baseValue: "50000000" }
    ]);
  };

  const handleDuplicateSummaryRow = (idx: number) => {
    const target = summaryRows[idx];
    const nextLineId = String(summaryRows.length + 1);
    setSummaryRows(prev => [...prev, { ...target, lineId: nextLineId }]);
  };

  const handleDeleteSummaryRow = (idx: number) => {
    if (summaryRows.length <= 1) return;
    setSummaryRows(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((row, i) => ({ ...row, lineId: String(i + 1) }));
    });
  };

  const updateSummaryField = (idx: number, field: keyof SummaryRow, val: string) => {
    setSummaryRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Actions for Details Rows
  const handleAddDetailsRow = () => {
    const nextLineId = String(detailsRows.length + 1);
    setDetailsRows(prev => [
      ...prev,
      { lineId: nextLineId, speNumber: `SPE022627000${nextLineId}`, speName: "General Project Materials & Consumables", level: "Level 2" }
    ]);
  };

  const handleDuplicateDetailsRow = (idx: number) => {
    const target = detailsRows[idx];
    const nextLineId = String(detailsRows.length + 1);
    setDetailsRows(prev => [...prev, { ...target, lineId: nextLineId, speNumber: `SPE022627000${nextLineId}` }]);
  };

  const handleDeleteDetailsRow = (idx: number) => {
    if (detailsRows.length <= 1) return;
    setDetailsRows(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((row, i) => ({ ...row, lineId: String(i + 1) }));
    });
  };

  const updateDetailsField = (idx: number, field: keyof DetailsRow, val: string) => {
    setDetailsRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleValidate = () => {
    setStatus("Validated");
    setEditingOrg(false);
    alert(`Internal Plan "${record.id}" has been validated.`);
  };

  const handleActivate = () => {
    setStatus("Activated");
    setEditingOrg(false);
    alert(`Internal Plan "${record.id}" has been activated.`);
  };

  return (
    <div className="flex flex-col h-full bg-background w-full" style={{ background: "var(--background)" }}>
      {/* Detail Page Header */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg cursor-pointer"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            title="Back to Internal Plan List"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", fontFamily: "var(--font-mono)" }}>
              {record.id}
            </h1>
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
              {orgName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[status] || statusColor.Active }}>
              <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[status] || statusColor.Active, display: "inline-block" }} />
              {status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleValidate}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: "var(--foreground)",
              color: "var(--background)",
              border: "none",
            }}
            title="Validate Internal Plan"
          >
            <Check size={13} />
            Validate
          </button>
          <button
            type="button"
            onClick={handleActivate}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            title="Activate Internal Plan"
          >
            <CheckCircle2 size={13} />
            Activate
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex px-8 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "11px 16px",
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid var(--foreground)" : "2px solid transparent",
              marginBottom: -1,
              whiteSpace: "nowrap",
              transition: "color 0.15s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content View */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 w-full">
        
        {/* Tab 1: Organization Info */}
        {activeTab === "Organization Info" && (
          <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 1000 }}>
            <SectionCard 
              title="Organization Information"
              isEditable={isEditable}
              editing={editingOrg}
              onEdit={handleStartEditOrg}
              onSave={handleSaveOrg}
              onCancel={handleCancelOrg}
            >
              {!editingOrg ? (
                <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                  <ViewField label="Organization ID" value={orgId} mono />
                  <ViewField label="Organization Name" value={orgName} />
                  <ViewField label="Organization PAN" value={orgPan} mono />
                  <ViewField label="Organization Place of Supply" value={orgPos} />
                  <ViewField label="Delivery Address" value={orgAddress} />
                  <ViewField label="PE Date" value={peDate} mono />
                  <ViewField label="Cost Centre" value={costCentre} mono />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                  <ELabelSelect
                    label="Organization Name"
                    value={draftOrgName}
                    onChange={v => {
                      setDraftOrgName(v);
                      const d = orgDetailsMap[v];
                      if (d) {
                        setDraftOrgId(d.id);
                        setDraftOrgPan(d.pan);
                        setDraftOrgPos(d.pos);
                        setDraftOrgAddress(d.address);
                        setDraftCostCentre(d.costCentre);
                      }
                    }}
                    options={orgOptions}
                    required
                  />
                  <ELabelInput
                    label="Organization ID"
                    value={draftOrgId}
                    disabled
                    mono
                  />
                  <ELabelInput
                    label="Organization PAN"
                    value={draftOrgPan}
                    onChange={setDraftOrgPan}
                    mono
                  />
                  <ELabelInput
                    label="Organization Place of Supply"
                    value={draftOrgPos}
                    onChange={setDraftOrgPos}
                  />
                  <ELabelInput
                    label="Delivery Address"
                    value={draftOrgAddress}
                    onChange={setDraftOrgAddress}
                  />
                  <ELabelInput
                    label="PE Date"
                    value={draftPeDate}
                    onChange={setDraftPeDate}
                    mono
                  />
                  <ELabelInput
                    label="Cost Centre"
                    value={draftCostCentre}
                    onChange={setDraftCostCentre}
                    mono
                  />
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Tab 2: Internal Plan Summary */}
        {activeTab === "Internal Plan Summary" && (
          <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 1000 }}>
            <SectionCard 
              title="Internal Plan Summary"
              rightAction={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alert("Exporting summary data...")}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--muted-foreground)",
                      height: 30,
                      width: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Download / Export"
                  >
                    <Download size={13} />
                  </button>
                  {isEditable && (
                    <button
                      type="button"
                      onClick={handleAddSummaryRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                      style={{
                        background: "var(--secondary)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        height: 30
                      }}
                    >
                      <Plus size={13} /> Add Row
                    </button>
                  )}
                </div>
              }
            >
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 80 }}>Line ID</th>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>SubPlanningElementName</th>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Base Value</th>
                      {isEditable && <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 120, textAlign: "right" }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>
                          {row.lineId}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--foreground)" }}>
                          {isEditable ? (
                            <input
                              value={row.subPlanningElementName}
                              onChange={e => updateSummaryField(idx, "subPlanningElementName", e.target.value)}
                              style={{
                                height: 32,
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: 6,
                                padding: "0 8px",
                                fontSize: 12,
                                color: "var(--foreground)",
                                outline: "none",
                                width: "100%",
                                maxWidth: 300
                              }}
                            />
                          ) : (
                            <span>{row.subPlanningElementName}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 500 }}>
                          {isEditable ? (
                            <input
                              value={row.baseValue}
                              onChange={e => updateSummaryField(idx, "baseValue", e.target.value)}
                              style={{
                                height: 32,
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: 6,
                                padding: "0 8px",
                                fontSize: 12,
                                color: "var(--foreground)",
                                outline: "none",
                                width: 160,
                                fontFamily: "var(--font-mono)"
                              }}
                            />
                          ) : (
                            <span>₹ {Number(row.baseValue || 0).toLocaleString("en-IN")}</span>
                          )}
                        </td>
                        {isEditable && (
                          <td style={{ padding: "10px 16px", textAlign: "right" }}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDuplicateSummaryRow(idx)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer border"
                                style={{
                                  background: "var(--secondary)",
                                  borderColor: "var(--border)",
                                  color: "var(--muted-foreground)"
                                }}
                                title="Duplicate row"
                              >
                                <Copy size={13} />
                              </button>
                              {summaryRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSummaryRow(idx)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer border"
                                  style={{
                                    background: "var(--secondary)",
                                    borderColor: "var(--border)",
                                    color: "var(--muted-foreground)"
                                  }}
                                  title="Delete row"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Tab 3: Internal Plan Details */}
        {activeTab === "Internal Plan Details" && (
          <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 1000 }}>
            <SectionCard 
              title="Internal Plan Details"
              rightAction={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alert("Exporting details data...")}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--muted-foreground)",
                      height: 30,
                      width: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Download / Export"
                  >
                    <Download size={13} />
                  </button>
                  {isEditable && (
                    <button
                      type="button"
                      onClick={handleAddDetailsRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                      style={{
                        background: "var(--secondary)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        height: 30
                      }}
                    >
                      <Plus size={13} /> Add Item
                    </button>
                  )}
                </div>
              }
            >
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 80 }}>Line ID</th>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>SPE Number</th>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>SPE Name</th>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 120 }}>Level</th>
                      {isEditable && <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 120, textAlign: "right" }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {detailsRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>
                          {row.lineId}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                          {isEditable ? (
                            <input
                              value={row.speNumber}
                              onChange={e => updateDetailsField(idx, "speNumber", e.target.value)}
                              style={{
                                height: 32,
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: 6,
                                padding: "0 8px",
                                fontSize: 12,
                                color: "var(--foreground)",
                                outline: "none",
                                width: 140,
                                fontFamily: "var(--font-mono)"
                              }}
                            />
                          ) : (
                            <span>{row.speNumber}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--foreground)" }}>
                          {isEditable ? (
                            <input
                              value={row.speName}
                              onChange={e => updateDetailsField(idx, "speName", e.target.value)}
                              style={{
                                height: 32,
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: 6,
                                padding: "0 8px",
                                fontSize: 12,
                                color: "var(--foreground)",
                                outline: "none",
                                width: "100%",
                                maxWidth: 300
                              }}
                            />
                          ) : (
                            <span>{row.speName}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--foreground)" }}>
                          {isEditable ? (
                            <select
                              value={row.level}
                              onChange={e => updateDetailsField(idx, "level", e.target.value)}
                              style={{
                                height: 32,
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: 6,
                                padding: "0 8px",
                                fontSize: 12,
                                color: "var(--foreground)",
                                outline: "none",
                                cursor: "pointer"
                              }}
                            >
                              <option value="Level 1">Level 1</option>
                              <option value="Level 2">Level 2</option>
                              <option value="Level 3">Level 3</option>
                            </select>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                              {row.level}
                            </span>
                          )}
                        </td>
                        {isEditable && (
                          <td style={{ padding: "10px 16px", textAlign: "right" }}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDuplicateDetailsRow(idx)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer border"
                                style={{
                                  background: "var(--secondary)",
                                  borderColor: "var(--border)",
                                  color: "var(--muted-foreground)"
                                }}
                                title="Duplicate row"
                              >
                                <Copy size={13} />
                              </button>
                              {detailsRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDetailsRow(idx)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer border"
                                  style={{
                                    background: "var(--secondary)",
                                    borderColor: "var(--border)",
                                    color: "var(--muted-foreground)"
                                  }}
                                  title="Delete row"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

      </div>
    </div>
  );
}
