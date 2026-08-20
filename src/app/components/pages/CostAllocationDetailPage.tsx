import { useState, useEffect } from "react";
import { X, Plus, Trash2, Copy, Check, CheckCircle2, Edit3, Lock } from "lucide-react";
import { useActivity } from "../../contexts";

const statusColor: Record<string, string> = {
  Active: "#4ade80",
  Validated: "#4ade80",
  Approved: "#4ade80",
  Pending: "#fbbf24",
  Inactive: "#888896"
};

const orgIdMap: Record<string, string> = {
  "Demo Industrial Works Pvt Ltd": "OM0000000002",
  "Global BioPharma Ingredients Inc.": "OM0000000001",
  "ABC Chemicals Ltd": "OM0000000003",
  "HealthLogistics Pvt Ltd": "OM0000000004",
  "EuroLab Compliance Services GmbH": "OM0000000005"
};

const methodOptions = [
  "Admin-Dept",
  "B2B",
  "B2C",
  "Maintenance-Dept",
  "Marketing-Dept",
  "Production-Dept",
  "Staff-Welfare",
  "Staff-Welfare and Maintenance-Dept"
];

const orgOptions = [
  "Demo Industrial Works Pvt Ltd",
  "Global BioPharma Ingredients Inc.",
  "ABC Chemicals Ltd",
  "HealthLogistics Pvt Ltd",
  "EuroLab Compliance Services GmbH"
];

interface CostAllocationValueRow {
  lineId: string;
  category: "Plan" | "Actual";
  lob: string;
  value: string;
}

interface CostAllocationDetailPageProps {
  record: {
    id: string;
    costAllocMethod: string;
    orgName: string;
    forPeriodFrom: string;
    forPeriodTo: string;
    allocType: string;
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

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-4">{children}</div>;
}

export function CostAllocationDetailPage({ record, onClose }: CostAllocationDetailPageProps) {
  const { openActivity } = useActivity();
  const [activeTab, setActiveTab] = useState<"Cost Allocation Info" | "Cost Allocation Value">("Cost Allocation Info");
  const [status, setStatus] = useState("Active");

  // Editable statuses
  const isEditable = status === "Active" || status === "Pending" || status === "Rejected" || status === "Draft";

  // Section edit states
  const [editingOrg, setEditingOrg] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);

  // Field values
  const [orgName, setOrgName] = useState(record.orgName || "Demo Industrial Works Pvt Ltd");
  const [orgId, setOrgId] = useState(orgIdMap[record.orgName] || "OM0000000002");
  const [method, setMethod] = useState(record.costAllocMethod || "B2B");
  const [description, setDescription] = useState(`${record.costAllocMethod || "B2B"} Cost Allocation Pool Distribution`);
  const [forPeriodFrom, setForPeriodFrom] = useState(record.forPeriodFrom || "01-03-2026");
  const [forPeriodTo, setForPeriodTo] = useState(record.forPeriodTo || "");
  const [allocType, setAllocType] = useState(record.allocType || "%");
  const [characteristics, setCharacteristics] = useState("Standard Operational Cost Pool");

  // Draft edits for Org
  const [draftOrgName, setDraftOrgName] = useState(orgName);
  const [draftOrgId, setDraftOrgId] = useState(orgId);

  // Draft edits for Info
  const [draftMethod, setDraftMethod] = useState(method);
  const [draftDescription, setDraftDescription] = useState(description);
  const [draftForPeriodFrom, setDraftForPeriodFrom] = useState(forPeriodFrom);
  const [draftForPeriodTo, setDraftForPeriodTo] = useState(forPeriodTo);
  const [draftAllocType, setDraftAllocType] = useState(allocType);
  const [draftCharacteristics, setDraftCharacteristics] = useState(characteristics);

  // Tab 2: Cost Allocation Values
  const [valueRows, setValueRows] = useState<CostAllocationValueRow[]>([
    { lineId: "1", category: "Plan", lob: method, value: "100" },
    { lineId: "2", category: "Actual", lob: method, value: "100" }
  ]);

  // AI Workspace Activity sync
  useEffect(() => {
    openActivity({
      type: "Cost Allocation",
      id: record.id || method,
      status: status,
      createdBy: "Alex Johnson",
      createdDate: forPeriodFrom
    });

    return () => {
      openActivity(null as any);
    };
  }, [record, method, forPeriodFrom, status, openActivity]);

  const tabs: ("Cost Allocation Info" | "Cost Allocation Value")[] = [
    "Cost Allocation Info",
    "Cost Allocation Value"
  ];

  // Handlers for Org Edit
  const handleStartEditOrg = () => {
    setDraftOrgName(orgName);
    setDraftOrgId(orgId);
    setEditingOrg(true);
  };
  const handleSaveOrg = () => {
    setOrgName(draftOrgName);
    setOrgId(draftOrgId);
    setEditingOrg(false);
  };
  const handleCancelOrg = () => {
    setEditingOrg(false);
  };

  // Handlers for Info Edit
  const handleStartEditInfo = () => {
    setDraftMethod(method);
    setDraftDescription(description);
    setDraftForPeriodFrom(forPeriodFrom);
    setDraftForPeriodTo(forPeriodTo);
    setDraftAllocType(allocType);
    setDraftCharacteristics(characteristics);
    setEditingInfo(true);
  };
  const handleSaveInfo = () => {
    setMethod(draftMethod);
    setDescription(draftDescription);
    setForPeriodFrom(draftForPeriodFrom);
    setForPeriodTo(draftForPeriodTo);
    setAllocType(draftAllocType);
    setCharacteristics(draftCharacteristics);
    setEditingInfo(false);
  };
  const handleCancelInfo = () => {
    setEditingInfo(false);
  };

  // Value Row Actions
  const handleAddRow = () => {
    const nextLineId = String(valueRows.length + 1);
    setValueRows(prev => [
      ...prev,
      { lineId: nextLineId, category: "Plan", lob: method, value: "100" }
    ]);
  };

  const handleDuplicateRow = (index: number) => {
    const target = valueRows[index];
    const nextLineId = String(valueRows.length + 1);
    const newRow: CostAllocationValueRow = {
      ...target,
      lineId: nextLineId
    };
    setValueRows(prev => [...prev, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    if (valueRows.length <= 1) return;
    setValueRows(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((row, idx) => ({ ...row, lineId: String(idx + 1) }));
    });
  };

  const updateRowField = (index: number, field: keyof CostAllocationValueRow, val: string) => {
    setValueRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleValidate = () => {
    setStatus("Validated");
    setEditingOrg(false);
    setEditingInfo(false);
    alert(`Cost Allocation "${method}" has been validated.`);
  };

  const handleApprove = () => {
    setStatus("Approved");
    setEditingOrg(false);
    setEditingInfo(false);
    alert(`Cost Allocation "${method}" has been approved.`);
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
            title="Back to Cost Allocation List"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
              {method}
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
            title="Validate Cost Allocation"
          >
            <Check size={13} />
            Validate
          </button>
          <button
            type="button"
            onClick={handleApprove}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            title="Approve Cost Allocation"
          >
            <CheckCircle2 size={13} />
            Approve
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
        
        {/* Tab 1: Cost Allocation Info */}
        {activeTab === "Cost Allocation Info" && (
          <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 1000 }}>
            
            {/* Organization Information Card */}
            <SectionCard 
              title="Organization Information"
              isEditable={isEditable}
              editing={editingOrg}
              onEdit={handleStartEditOrg}
              onSave={handleSaveOrg}
              onCancel={handleCancelOrg}
            >
              {!editingOrg ? (
                <Grid2>
                  <ViewField label="Organization Name" value={orgName} required />
                  <ViewField label="Organization ID" value={orgId} mono required />
                </Grid2>
              ) : (
                <Grid2>
                  <ELabelSelect
                    label="Organization Name"
                    value={draftOrgName}
                    onChange={v => {
                      setDraftOrgName(v);
                      setDraftOrgId(orgIdMap[v] || "OM0000000002");
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
                </Grid2>
              )}
            </SectionCard>

            {/* Cost Allocation Information Card */}
            <SectionCard 
              title="Cost Allocation Information"
              isEditable={isEditable}
              editing={editingInfo}
              onEdit={handleStartEditInfo}
              onSave={handleSaveInfo}
              onCancel={handleCancelInfo}
            >
              {!editingInfo ? (
                <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                  <ViewField label="Cost Allocation Method" value={method} required />
                  <ViewField label="Cost Allocation Description" value={description} required />
                  <ViewField label="For Period From" value={forPeriodFrom} mono required />
                  <ViewField label="For Period To" value={forPeriodTo || "—"} mono />
                  <ViewField label="Allocation Type" value={allocType} mono required />
                  <ViewField label="Characteristics" value={characteristics} />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                  <ELabelSelect
                    label="Cost Allocation Method"
                    value={draftMethod}
                    onChange={setDraftMethod}
                    options={methodOptions}
                    required
                  />
                  <ELabelInput
                    label="Cost Allocation Description"
                    value={draftDescription}
                    onChange={setDraftDescription}
                    required
                  />
                  <ELabelInput
                    label="For Period From"
                    value={draftForPeriodFrom}
                    onChange={setDraftForPeriodFrom}
                    mono
                    required
                  />
                  <ELabelInput
                    label="For Period To"
                    value={draftForPeriodTo}
                    onChange={setDraftForPeriodTo}
                    mono
                  />
                  <ELabelSelect
                    label="Allocation Type"
                    value={draftAllocType}
                    onChange={setDraftAllocType}
                    options={["%"]}
                    required
                  />
                  <ELabelInput
                    label="Characteristics"
                    value={draftCharacteristics}
                    onChange={setDraftCharacteristics}
                  />
                </div>
              )}
            </SectionCard>

          </div>
        )}

        {/* Tab 2: Cost Allocation Value */}
        {activeTab === "Cost Allocation Value" && (
          <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 1000 }}>
            <SectionCard 
              title="Cost Allocation Values"
              rightAction={
                isEditable ? (
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      height: 30
                    }}
                  >
                    <Plus size={13} /> Add Value
                  </button>
                ) : undefined
              }
            >
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 80 }}>Line ID</th>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cost Allocation Category</th>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>LOB</th>
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cost Allocation Value</th>
                      {isEditable && <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 140, textAlign: "right" }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {valueRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>
                          {row.lineId}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13 }}>
                          {isEditable ? (
                            <select
                              value={row.category}
                              onChange={e => updateRowField(idx, "category", e.target.value as "Plan" | "Actual")}
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
                              <option value="Plan">Plan</option>
                              <option value="Actual">Actual</option>
                            </select>
                          ) : (
                            <span style={{ color: "var(--foreground)" }}>{row.category}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--foreground)" }}>
                          {isEditable ? (
                            <input
                              value={row.lob}
                              onChange={e => updateRowField(idx, "lob", e.target.value)}
                              style={{
                                height: 32,
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: 6,
                                padding: "0 8px",
                                fontSize: 12,
                                color: "var(--foreground)",
                                outline: "none",
                                width: 180
                              }}
                            />
                          ) : (
                            <span>{row.lob}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--foreground)" }}>
                          {isEditable ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                value={row.value}
                                onChange={e => updateRowField(idx, "value", e.target.value)}
                                style={{
                                  height: 32,
                                  background: "var(--secondary)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 6,
                                  padding: "0 8px",
                                  fontSize: 12,
                                  color: "var(--foreground)",
                                  outline: "none",
                                  width: 90,
                                  fontFamily: "var(--font-mono)"
                                }}
                              />
                              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" }}>%</span>
                            </div>
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)" }}>{row.value} %</span>
                          )}
                        </td>
                        {isEditable && (
                          <td style={{ padding: "10px 16px", textAlign: "right" }}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDuplicateRow(idx)}
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
                              {valueRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(idx)}
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
