import { useState, useEffect } from "react";
import { X, Edit3, Check, X as XIcon, Lock } from "lucide-react";
import { AIOrganizationScanner, type ScannedOrgData } from "../../components/AIOrganizationScanner";
import { UserProfile } from "../UserProfile";
import { useActivity } from "../../contexts";

const tabs = ["General", "Registration & Tax", "Workflow"];

const statusColor: Record<string, string> = { Active: "#4ade80", Inactive: "#f87171", Pending: "#fbbf24" };

const ORG_WORKFLOWS = [
  { id: "standard",   name: "Standard Org Approval",     description: "Two-level review for new organization registration.", steps: ["Org Manager Review", "Admin Sign-off"] },
  { id: "fast_track", name: "Fast Track Approval",       description: "Single-step approval for pre-verified organizations.", steps: ["Admin Direct Approval"] },
  { id: "compliance", name: "Compliance Review Flow",    description: "Four-level process for regulated industries.", steps: ["Compliance Check", "Legal Review", "Finance Concurrence", "Director Approval"] },
  { id: "auto",       name: "Auto Approve",              description: "Bypass manual steps for trusted/internal organizations.", steps: [] },
];

// ─── Shared field data type ───────────────────────────────────────────────────

interface OrgData {
  id: string; name: string; type: string; status: string; country: string;
  emailPrimary: string; emailSecondary: string; phonePrimary: string; phoneSecondary: string;
  website: string; contactPerson: string;
  address: string; city: string; state: string; pincode: string;
  pan: string; gst: string; taxReg: string; currency: string; localCurrency: string;
  selectedWorkflow: string;
}

function makeEmpty(): OrgData {
  return {
    id: "", name: "", type: "Corporation", status: "Active", country: "India",
    emailPrimary: "", emailSecondary: "", phonePrimary: "", phoneSecondary: "",
    website: "", contactPerson: "",
    address: "", city: "", state: "", pincode: "",
    pan: "", gst: "", taxReg: "", currency: "INR", localCurrency: "INR",
    selectedWorkflow: "",
  };
}

function makeFromRecord(r: { id: string; name: string; type: string; country: string; contact: string; status: string }): OrgData {
  return {
    id: r.id, name: r.name, type: r.type, status: r.status, country: r.country,
    emailPrimary: r.contact, emailSecondary: "", phonePrimary: "", phoneSecondary: "",
    website: "", contactPerson: "",
    address: "", city: "", state: "", pincode: "",
    pan: "", gst: "", taxReg: "", currency: "INR", localCurrency: "INR",
    selectedWorkflow: "standard",
  };
}

// ─── Primitive field components ───────────────────────────────────────────────

function ViewField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 13, color: value ? "var(--foreground)" : "var(--muted-foreground)", fontFamily: mono ? "var(--font-mono)" : undefined, lineHeight: 1.5 }}>{value || "—"}</span>
    </div>
  );
}

function EInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px", width: "100%" }} />
  );
}

function ETextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea value={value} rows={2} onChange={e => onChange(e.target.value)}
      style={{ background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "8px 10px", width: "100%", resize: "vertical", lineHeight: 1.5 }} />
  );
}

function ESelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ height: 34, background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)", padding: "0 10px", width: "100%", cursor: "pointer" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr" }}>{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>{children}</div>;
}

// ─── Section card with per-section edit toggle ────────────────────────────────

interface SectionProps {
  title: string;
  defaultEditing?: boolean;
  children: (editing: boolean, draft: OrgData, set: (k: keyof OrgData, v: string) => void) => React.ReactNode;
  data: OrgData;
  onSave: (d: OrgData) => void;
}

function Section({ title, defaultEditing = false, children, data, onSave }: SectionProps) {
  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState<OrgData>(data);

  useEffect(() => {
    if (!editing) setDraft(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function set(k: keyof OrgData, v: string) { setDraft(d => ({ ...d, [k]: v })); }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1"
            style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}>
            <Edit3 size={11} /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setDraft(data); setEditing(false); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}>
              <XIcon size={11} /> Cancel
            </button>
            <button onClick={() => { onSave(draft); setEditing(false); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
              <Check size={11} /> Save
            </button>
          </div>
        )}
      </div>
      <div className="p-5">{children(editing, draft, set)}</div>
    </div>
  );
}

// ─── Workflow section (same radio-card pattern as PO/Vendor) ──────────────────

function WorkflowSection({ data, onSave, isNew }: { data: OrgData; onSave: (d: OrgData) => void; isNew: boolean }) {
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(data.selectedWorkflow);
  const activeTpl = ORG_WORKFLOWS.find(w => w.id === data.selectedWorkflow) ?? null;

  useEffect(() => { if (!editing) setDraft(data.selectedWorkflow); }, [data.selectedWorkflow, editing]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Assigned Workflow</p>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1"
            style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}>
            <Edit3 size={11} /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setDraft(data.selectedWorkflow); setEditing(false); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}>
              <XIcon size={11} /> Cancel
            </button>
            <button onClick={() => { onSave({ ...data, selectedWorkflow: draft }); setEditing(false); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
              <Check size={11} /> Save
            </button>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-4">
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
          Select a pre-defined approval workflow for this organization. This workflow will be triggered when the organization record is submitted for review.
        </p>
        {editing ? (
          <div className="flex flex-col gap-2">
            {ORG_WORKFLOWS.map(wf => (
              <button key={wf.id} onClick={() => setDraft(wf.id)}
                className="flex items-start gap-3 rounded-xl p-4 text-left transition-colors"
                style={{ background: draft === wf.id ? "var(--accent)" : "var(--secondary)", border: `1px solid ${draft === wf.id ? "var(--foreground)" : "var(--border)"}`, cursor: "pointer" }}>
                <div className="flex items-center justify-center rounded-full mt-0.5 flex-shrink-0"
                  style={{ width: 16, height: 16, border: `2px solid ${draft === wf.id ? "var(--foreground)" : "var(--muted-foreground)"}`, background: draft === wf.id ? "var(--foreground)" : "transparent" }}>
                  {draft === wf.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--background)" }} />}
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{wf.name}</span>
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{wf.description}</span>
                  {wf.steps.length > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {wf.steps.map((s, i) => (
                        <span key={s} className="flex items-center gap-1.5">
                          <span className="rounded-full px-2 py-0.5" style={{ fontSize: 10, fontWeight: 500, background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>{s}</span>
                          {i < wf.steps.length - 1 && <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>→</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>✓ Auto-approved, no manual steps</span>
                  )}
                </div>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", flexShrink: 0, marginTop: 2 }}>{wf.steps.length} step{wf.steps.length !== 1 ? "s" : ""}</span>
              </button>
            ))}
          </div>
        ) : activeTpl ? (
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{activeTpl.name}</p>
                <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{activeTpl.description}</p>
              </div>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{activeTpl.steps.length} step{activeTpl.steps.length !== 1 ? "s" : ""}</span>
            </div>
            {activeTpl.steps.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeTpl.steps.map((s, i) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="rounded-full px-2.5 py-1" style={{ fontSize: 11, fontWeight: 500, background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>{s}</span>
                    {i < activeTpl.steps.length - 1 && <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>→</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#4ade80" }}>✓ Auto-approved without manual steps.</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <span style={{ fontSize: 13, color: "var(--foreground)" }}>No workflow assigned. Click Edit to select one.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main detail page ─────────────────────────────────────────────────────────

interface Props {
  org: { id: string; name: string; type: string; country: string; contact: string; status: string } | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (updated: { id: string; name: string; type: string; country: string; contact: string; status: string; created: string }) => void;
}

export function OrganizationEditPanel({ org, isNew = false, onClose, onSave }: Props) {
  const { openActivity } = useActivity();
  const [activeTab, setActiveTab] = useState("General");
  const [data, setData] = useState<OrgData>(isNew ? makeEmpty() : makeFromRecord(org!));

  useEffect(() => {
    openActivity({
      type: "Organization",
      id: data.id || "NEW",
      status: data.status || "Active",
      createdBy: "Alex Johnson",
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    });
  }, [data.id, data.status, openActivity]);

  function handleSave(updated: OrgData) { setData(updated); }

  function handleCreate() {
    onSave({ id: data.id || `ORG-${Date.now()}`, name: data.name, type: data.type, country: data.country, contact: data.emailPrimary, status: data.status, created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) });
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}>
            <X size={14} />
          </button>
          {isNew ? (
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>New Organization</h1>
              <span className="rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}>Draft</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>{data.name}</h1>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{data.id}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[data.status] }}>
                <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[data.status], display: "inline-block" }} />
                {data.status}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isNew && (
            <button onClick={handleCreate}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2"
              style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}>
              <Check size={13} /> Create Organization
            </button>
          )}
          <UserProfile size="sm" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-8 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "11px 18px", fontSize: 13,
            fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === tab ? "2px solid var(--foreground)" : "2px solid transparent",
            marginBottom: -1, whiteSpace: "nowrap", transition: "color 0.15s",
          }}>{tab}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── GENERAL ─────────────────────────────────────────────────────── */}
        {activeTab === "General" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 780 }}>
            {isNew && (
              <AIOrganizationScanner onApply={(d: ScannedOrgData) => {
                setData(prev => ({
                  ...prev,
                  ...(d.name    && { name:    d.name }),
                  ...(d.email   && { emailPrimary: d.email }),
                  ...(d.phone   && { phonePrimary: d.phone }),
                  ...(d.address && { address: d.address }),
                  ...(d.city    && { city:    d.city }),
                  ...(d.state   && { state:   d.state }),
                  ...(d.pincode && { pincode: d.pincode }),
                  ...(d.country && { country: d.country }),
                  ...(d.website && { website: d.website }),
                  ...(d.pan     && { pan:     d.pan }),
                  ...(d.gst     && { gst:     d.gst }),
                  ...(d.taxReg  && { taxReg:  d.taxReg }),
                }));
              }} />
            )}

            <Section title="Basic Information" defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid2>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORGANIZATION ID</span><EInput value={draft.id} onChange={v => set("id", v)} placeholder="e.g. ORG-013" /></div> : <ViewField label="Organization ID" value={data.id} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATUS</span><ESelect value={draft.status} onChange={v => set("status", v)} options={["Active", "Inactive", "Pending"]} /></div> : <ViewField label="Status" value={data.status} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORGANIZATION NAME</span><EInput value={draft.name} onChange={v => set("name", v)} /></div> : <ViewField label="Organization Name" value={data.name} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ORGANIZATION TYPE</span><ESelect value={draft.type} onChange={v => set("type", v)} options={["Corporation", "LLC", "Partnership", "Sole Proprietorship", "Non-Profit", "Government"]} /></div> : <ViewField label="Organization Type" value={data.type} />}
                </Grid2>
              )}
            </Section>

            <Section title="Contact Details" defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid2>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>EMAIL (PRIMARY)</span><EInput value={draft.emailPrimary} onChange={v => set("emailPrimary", v)} /></div> : <ViewField label="Email (Primary)" value={data.emailPrimary} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>EMAIL (SECONDARY)</span><EInput value={draft.emailSecondary} onChange={v => set("emailSecondary", v)} /></div> : <ViewField label="Email (Secondary)" value={data.emailSecondary} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PHONE (PRIMARY)</span><EInput value={draft.phonePrimary} onChange={v => set("phonePrimary", v)} /></div> : <ViewField label="Phone (Primary)" value={data.phonePrimary} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PHONE (SECONDARY)</span><EInput value={draft.phoneSecondary} onChange={v => set("phoneSecondary", v)} /></div> : <ViewField label="Phone (Secondary)" value={data.phoneSecondary} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>CONTACT PERSON</span><EInput value={draft.contactPerson} onChange={v => set("contactPerson", v)} /></div> : <ViewField label="Contact Person" value={data.contactPerson} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>WEBSITE</span><EInput value={draft.website} onChange={v => set("website", v)} /></div> : <ViewField label="Website" value={data.website} />}
                </Grid2>
              )}
            </Section>

            <Section title="Address" defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STREET ADDRESS</span>
                    {editing ? <ETextarea value={draft.address} onChange={v => set("address", v)} /> : <span style={{ fontSize: 13, color: data.address ? "var(--foreground)" : "var(--muted-foreground)", lineHeight: 1.6 }}>{data.address || "—"}</span>}
                  </div>
                  <Grid3>
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>CITY</span><EInput value={draft.city} onChange={v => set("city", v)} /></div> : <ViewField label="City" value={data.city} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATE</span><EInput value={draft.state} onChange={v => set("state", v)} /></div> : <ViewField label="State" value={data.state} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PINCODE</span><EInput value={draft.pincode} onChange={v => set("pincode", v)} /></div> : <ViewField label="Pincode" value={data.pincode} mono />}
                  </Grid3>
                  <div style={{ maxWidth: 260 }}>
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>COUNTRY</span><ESelect value={draft.country} onChange={v => set("country", v)} options={["India", "USA", "UK", "Germany", "Canada", "Australia", "Singapore"]} /></div> : <ViewField label="Country" value={data.country} />}
                  </div>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── REGISTRATION & TAX ──────────────────────────────────────────── */}
        {activeTab === "Registration & Tax" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 780 }}>
            <Section title="Tax & Registration Details" defaultEditing={isNew} data={data} onSave={handleSave}>
              {(editing, draft, set) => (
                <Grid2>
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PAN</span><EInput value={draft.pan} onChange={v => set("pan", v)} placeholder="e.g. AABCA1234B" /></div> : <ViewField label="PAN" value={data.pan} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GSTIN</span><EInput value={draft.gst} onChange={v => set("gst", v)} placeholder="e.g. 33AABCA1234B1ZD" /></div> : <ViewField label="GSTIN" value={data.gst} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TAX REGISTRATION NO.</span><EInput value={draft.taxReg} onChange={v => set("taxReg", v)} placeholder="e.g. REG-TN-2020-00123" /></div> : <ViewField label="Tax Registration No." value={data.taxReg} mono />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>CURRENCY</span><ESelect value={draft.currency} onChange={v => set("currency", v)} options={["INR", "USD", "EUR", "GBP", "SGD", "AED"]} /></div> : <ViewField label="Currency" value={data.currency} />}
                  {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>LOCAL CURRENCY</span><ESelect value={draft.localCurrency} onChange={v => set("localCurrency", v)} options={["INR", "USD", "EUR", "GBP"]} /></div> : <ViewField label="Local Currency" value={data.localCurrency} />}
                </Grid2>
              )}
            </Section>
          </div>
        )}

        {/* ── WORKFLOW ─────────────────────────────────────────────────────── */}
        {activeTab === "Workflow" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 640 }}>
            <WorkflowSection data={data} onSave={handleSave} isNew={isNew} />
          </div>
        )}

      </div>
    </div>
  );
}
