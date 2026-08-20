import { useState, useEffect } from "react";
import { X, Check, Plus, Trash2, Copy } from "lucide-react";

interface NewAllocationPageProps {
  onClose: () => void;
  onCreate: (allocation: any) => void;
}

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

function SectionCard({ title, rightAction, children }: { title: string; rightAction?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden w-full" style={{ background: "var(--card)", border: "1px solid var(--border)", flexShrink: 0 }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
        {rightAction}
      </div>
      <div className="p-5">{children}</div>
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

export function CostAllocationNewPage({ onClose, onCreate }: NewAllocationPageProps) {
  const [activeTab, setActiveTab] = useState<"Cost Allocation Info" | "Cost Allocation Value">("Cost Allocation Info");

  // Organization Information fields
  const [orgName, setOrgName] = useState(orgOptions[0]);
  const [orgId, setOrgId] = useState(orgIdMap[orgOptions[0]] || "OM0000000002");

  // Cost Allocation Information fields
  const [method, setMethod] = useState("B2B");
  const [description, setDescription] = useState("B2B Cost Allocation Model for Inter-division Distribution");
  const [forPeriodFrom, setForPeriodFrom] = useState("2026-03-01");
  const [forPeriodTo, setForPeriodTo] = useState("");
  const [allocType, setAllocType] = useState("%");
  const [characteristics, setCharacteristics] = useState("Standard Operational Cost Pool");

  // Tab 2: Cost Allocation Values initialized with 1 row
  const [valueRows, setValueRows] = useState<CostAllocationValueRow[]>([
    { lineId: "1", category: "Plan", lob: "B2B", value: "100" }
  ]);

  // Update Org ID when Org Name changes
  const handleOrgChange = (newOrg: string) => {
    setOrgName(newOrg);
    setOrgId(orgIdMap[newOrg] || "OM0000000002");
  };

  // Update Description and LOB default when Method changes
  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    setDescription(`${newMethod} Cost Allocation Model for Inter-division Distribution`);
    setValueRows(prev => prev.map(r => ({ ...r, lob: newMethod })));
  };

  // Tab 2: Row Actions
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim() || !method.trim() || !description.trim() || !forPeriodFrom.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    // Format display date
    const formatDate = (d: string) => {
      if (!d) return "";
      const parts = d.split("-");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return d;
    };

    const newId = `CA-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const newRecord = {
      id: newId,
      costAllocMethod: method,
      orgName: orgName,
      forPeriodFrom: formatDate(forPeriodFrom),
      forPeriodTo: formatDate(forPeriodTo),
      allocType: allocType || "%",
      description,
      characteristics,
      values: valueRows
    };

    onCreate(newRecord);
    alert(`Cost Allocation "${newId}" created successfully.`);
  };

  const tabs: ("Cost Allocation Info" | "Cost Allocation Value")[] = [
    "Cost Allocation Info",
    "Cost Allocation Value"
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background w-full" style={{ background: "var(--background)" }}>
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-lg cursor-pointer"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            title="Cancel"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>New Allocation</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: "#fbbf24" }}>
              <span className="rounded-full" style={{ width: 5, height: 5, background: "#fbbf24", display: "inline-block" }} />
              Draft
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer"
            style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer"
            style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none" }}
          >
            <Check size={13} /> Create Allocation
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex px-8 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
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

      {/* Form Content Scroll View */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 w-full">
        
        {/* Tab 1: Cost Allocation Info */}
        {activeTab === "Cost Allocation Info" && (
          <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 1000 }}>
            
            {/* Organization Information Card */}
            <SectionCard title="Organization Information">
              <Grid2>
                <ELabelSelect
                  label="Organization Name"
                  value={orgName}
                  onChange={handleOrgChange}
                  options={orgOptions}
                  required
                />
                <ELabelInput
                  label="Organization ID"
                  value={orgId}
                  disabled
                  mono
                  placeholder="Auto-populated on selection"
                />
              </Grid2>
            </SectionCard>

            {/* Cost Allocation Information Card */}
            <SectionCard title="Cost Allocation Information">
              <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                <ELabelSelect
                  label="Cost Allocation Method"
                  value={method}
                  onChange={handleMethodChange}
                  options={methodOptions}
                  required
                />
                <ELabelInput
                  label="Cost Allocation Description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Enter allocation description..."
                  required
                />
                <ELabelInput
                  label="For Period From"
                  value={forPeriodFrom}
                  onChange={setForPeriodFrom}
                  type="date"
                  mono
                  required
                />
                <ELabelInput
                  label="For Period To"
                  value={forPeriodTo}
                  onChange={setForPeriodTo}
                  type="date"
                  mono
                />
                <ELabelSelect
                  label="Allocation Type"
                  value={allocType}
                  onChange={setAllocType}
                  options={["%"]}
                  required
                />
                <ELabelInput
                  label="Characteristics"
                  value={characteristics}
                  onChange={setCharacteristics}
                  placeholder="e.g. Standard Operational Cost Pool"
                />
              </div>
            </SectionCard>

          </div>
        )}

        {/* Tab 2: Cost Allocation Value */}
        {activeTab === "Cost Allocation Value" && (
          <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 1000 }}>
            <SectionCard 
              title="Cost Allocation Values"
              rightAction={
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
                      <th style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase", width: 140, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>
                          {row.lineId}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13 }}>
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
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--foreground)" }}>
                          <select
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
                              width: 180,
                              cursor: "pointer"
                            }}
                          >
                            {methodOptions.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--foreground)" }}>
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
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

      </div>
    </form>
  );
}
