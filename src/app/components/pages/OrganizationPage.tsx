import { useState, useContext } from "react";
import { ListPage } from "./ListPage";
import { OrganizationEditPanel } from "./OrganizationEditPanel";
import { ActivityContext } from "../../contexts";
import { MessageSquare } from "lucide-react";

type OrgRecord = {
  id: string; name: string; type: string; country: string;
  contact: string; status: string; created: string;
};

const statusColor: Record<string, string> = { Active: "#4ade80", Inactive: "#f87171", Pending: "#fbbf24" };

const initialRows: OrgRecord[] = [
  { id: "ORG-001", name: "Acme Corp",           type: "Corporation",  country: "USA",       contact: "john@acme.com",            status: "Active",   created: "Jan 10, 2026" },
  { id: "ORG-002", name: "Globex Ltd",           type: "LLC",          country: "UK",        contact: "info@globex.co.uk",        status: "Active",   created: "Feb 3, 2026" },
  { id: "ORG-003", name: "Initech Inc",          type: "Corporation",  country: "Canada",    contact: "hr@initech.ca",            status: "Active",   created: "Feb 18, 2026" },
  { id: "ORG-004", name: "Umbrella Co",          type: "Partnership",  country: "Germany",   contact: "ops@umbrella.de",          status: "Inactive", created: "Mar 5, 2026" },
  { id: "ORG-005", name: "Hooli",                type: "Corporation",  country: "USA",       contact: "legal@hooli.com",          status: "Active",   created: "Mar 12, 2026" },
  { id: "ORG-006", name: "Waystar Royco",        type: "LLC",          country: "USA",       contact: "contact@waystar.com",      status: "Pending",  created: "Mar 29, 2026" },
  { id: "ORG-007", name: "Sterling Cooper",      type: "Partnership",  country: "USA",       contact: "info@sterlingcooper.com",  status: "Active",   created: "Apr 7, 2026" },
  { id: "ORG-008", name: "Dunder Mifflin",       type: "Corporation",  country: "USA",       contact: "admin@dundermifflin.com",  status: "Active",   created: "Apr 14, 2026" },
  { id: "ORG-009", name: "Pied Piper",           type: "LLC",          country: "USA",       contact: "richard@piedpiper.com",    status: "Pending",  created: "May 2, 2026" },
  { id: "ORG-010", name: "Vandelay Industries",  type: "LLC",          country: "USA",       contact: "art@vandelay.com",         status: "Active",   created: "May 20, 2026" },
  { id: "ORG-011", name: "Prestige Worldwide",   type: "Partnership",  country: "Australia", contact: "info@prestige.au",         status: "Inactive", created: "Jun 1, 2026" },
  { id: "ORG-012", name: "Bluth Company",        type: "Corporation",  country: "USA",       contact: "lucille@bluth.com",        status: "Active",   created: "Jun 10, 2026" },
];

const filters = [
  { key: "type",    label: "Type",    options: ["Corporation", "LLC", "Partnership"] },
  { key: "country", label: "Country", options: ["USA", "UK", "Canada", "Germany", "Australia"] },
  { key: "status",  label: "Status",  options: ["Active", "Inactive", "Pending"] },
];

type View = "list" | "edit" | "new";

export function OrganizationPage() {
  const openActivity = useContext(ActivityContext);
  const [rows, setRows] = useState<OrgRecord[]>(initialRows);
  const [view, setView] = useState<View>("list");
  const [editingOrg, setEditingOrg] = useState<OrgRecord | null>(null);

  const columns = [
    {
      key: "id", label: "ID", mono: true,
      render: (val: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => { setEditingOrg(row as OrgRecord); setView("edit"); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-mono)", color: "#6b8cff", textDecoration: "none", padding: 0 }}
        >
          {String(val)}
        </button>
      ),
    },
    { key: "name",    label: "Name" },
    { key: "type",    label: "Type" },
    { key: "country", label: "Country" },
    { key: "contact", label: "Contact" },
    {
      key: "status", label: "Status",
      render: (val: unknown) => (
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: statusColor[String(val)] }}>
          <span className="rounded-full" style={{ width: 6, height: 6, background: statusColor[String(val)], display: "inline-block" }} />
          {String(val)}
        </span>
      ),
    },
    { key: "created", label: "Created", mono: true },
    {
      key: "completion", colId: "completion", label: "Completion",
      render: (val: unknown, row: Record<string, unknown>) => {
        const idStr = String(row.id);
        const pct = idStr.includes("001") ? 100 : idStr.includes("002") ? 82 : idStr.includes("003") ? 45 : 95;
        return (
          <div className="flex items-center gap-2">
             <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
               <div className="h-full" style={{ width: `${pct}%`, background: pct === 100 ? "#4ade80" : "#6b8cff" }}/>
             </div>
             <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{pct}%</span>
          </div>
        );
      }
    },
    {
      key: "id", colId: "activity", label: "Activity",
      render: (val: unknown, row: Record<string, unknown>) => {
        const activityRecord = {
          type: "Organization",
          id: String(val),
          name: String(row.name || "Organization"),
          status: String(row.status || "Active"),
          createdBy: "Alex Johnson",
          createdDate: String(row.created || "Jan 10, 2026")
        };
        return (
          <button
            onClick={() => openActivity(activityRecord)}
            className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-accent relative"
            style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
            title="Open Activity Workspace"
          >
            <MessageSquare size={14} />
            {(String(val) === "ORG-002" || String(val) === "ORG-006") && (
               <span className="absolute top-0 right-0 flex items-center justify-center rounded-full bg-red-500 text-white" style={{ width: 14, height: 14, fontSize: 9, transform: "translate(25%, -25%)" }}>
                 {String(val) === "ORG-006" ? 2 : 1}
               </span>
            )}
          </button>
        );
      }
    },
  ];

  if (view === "new") {
    return (
      <OrganizationEditPanel
        org={null}
        isNew
        onClose={() => setView("list")}
        onSave={(created) => {
          setRows(r => [created, ...r]);
          setView("list");
        }}
      />
    );
  }

  if (view === "edit" && editingOrg) {
    return (
      <OrganizationEditPanel
        org={editingOrg}
        onClose={() => setView("list")}
        onSave={(updated) => {
          setRows(r => r.map(x => x.id === updated.id ? updated : x));
          setView("list");
        }}
      />
    );
  }

  return (
    <ListPage
      title="Organizations"
      addLabel="New Organization"
      columns={columns}
      rows={rows as unknown as Record<string, unknown>[]}
      filters={filters}
      onAdd={() => setView("new")}
    />
  );
}
