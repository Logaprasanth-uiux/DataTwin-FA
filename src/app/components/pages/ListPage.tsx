import { useState } from "react";
import { Search, Plus, ChevronDown, SlidersHorizontal, BotMessageSquare } from "lucide-react";
import { useActivity } from "../../contexts";

export interface Column {
  key: string;
  colId?: string; // unique id for React key when multiple cols share the same data key
  label: string;
  mono?: boolean;
  render?: (val: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: string[];
}

interface ListPageProps {
  title: string;
  addLabel: string;
  columns: Column[];
  rows: Record<string, unknown>[];
  filters: FilterConfig[];
  onAdd: () => void;
  highlightId?: string;
  idKey?: string;
  titleSlot?: React.ReactNode;   // rendered next to title (e.g. CompanySwitch)
  filterSlot?: React.ReactNode;  // extra filter controls (e.g. DateRangeFilter)
}

const PAGE_SIZE = 10;

export function ListPage({ title, addLabel, columns, rows, filters, onAdd, highlightId, idKey = "id", titleSlot, filterSlot }: ListPageProps) {
  const { openActivity } = useActivity();

  // Determine actual columns to render
  let renderedColumns = [...columns];
  const actionColIndex = columns.findIndex(
    (c) => c.colId === "show_po" || c.colId === "view_bill" || c.label.toLowerCase().includes("action")
  );

  if (actionColIndex !== -1) {
    const originalCol = columns[actionColIndex];
    renderedColumns[actionColIndex] = {
      ...originalCol,
      label: originalCol.label.toLowerCase().includes("action") ? originalCol.label : "Actions"
    };
  }

  // Always append a dedicated Activity column
  renderedColumns.push({
    key: "activity",
    colId: "activity_col",
    label: "Activity",
    render: (_, row) => {
      const recordId = String(row[idKey] ?? "");
      const recordType = title.includes("Purchase") ? "Purchase Order" :
                         title.includes("Bill") ? "Bill" :
                         title.includes("Vendor") ? "Vendor" : "Organization";
      
      return (
        <button
          onClick={() => openActivity({
            type: recordType,
            id: recordId,
            status: String(row.status ?? ""),
            createdBy: "Alex Johnson",
            createdDate: String(row.date ?? row.created ?? row.createdAt ?? "")
          })}
          className="flex items-center justify-center rounded p-1.5 hover:bg-accent transition-colors"
          style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
          title="Open Activity Workspace"
        >
          <BotMessageSquare size={13} />
        </button>
      );
    }
  });

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [shown, setShown] = useState(PAGE_SIZE);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const filtered = rows.filter((row) => {
    const matchSearch = Object.values(row).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase())
    );
    const matchFilters = Object.entries(filterValues).every(
      ([k, v]) => !v || String(row[k]) === v
    );
    return matchSearch && matchFilters;
  });

  const visible = filtered.slice(0, shown);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div
        className="flex items-center justify-between px-8"
        style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}
      >
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>{title}</h1>
          {titleSlot && <>{titleSlot}</>}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: "var(--foreground)",
              color: "var(--background)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={13} />
            {addLabel}
          </button>
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 30, height: 30, background: "var(--accent)", fontSize: 11, fontWeight: 600, color: "var(--foreground)", flexShrink: 0 }}
            >
              AJ
            </div>
            <div className="flex flex-col">
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>Alex Johnson</span>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-lg px-3"
            style={{
              height: 34,
              background: "var(--card)",
              border: "1px solid var(--border)",
              minWidth: 200,
            }}
          >
            <Search size={13} style={{ color: "var(--muted-foreground)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "var(--foreground)",
                width: "100%",
              }}
            />
          </div>

          {/* Dropdown filters */}
          {filters.map((f) => (
            <div key={f.key} style={{ position: "relative" }}>
              <button
                onClick={() => setOpenFilter(openFilter === f.key ? null : f.key)}
                className="flex items-center gap-1.5 rounded-lg px-3 transition-colors"
                style={{
                  height: 34,
                  background: filterValues[f.key] ? "var(--foreground)" : "var(--card)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: filterValues[f.key] ? "var(--background)" : "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <SlidersHorizontal size={12} />
                {filterValues[f.key] || f.label}
                <ChevronDown size={12} style={{ opacity: 0.6 }} />
              </button>
              {openFilter === f.key && (
                <div
                  className="absolute rounded-lg overflow-hidden"
                  style={{
                    top: "calc(100% + 4px)",
                    left: 0,
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    zIndex: 40,
                    minWidth: 160,
                  }}
                >
                  <button
                    onClick={() => { setFilterValues((p) => ({ ...p, [f.key]: "" })); setOpenFilter(null); }}
                    className="w-full px-3 py-2 text-left transition-colors"
                    style={{ fontSize: 12, color: "var(--muted-foreground)", border: "none", background: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    All
                  </button>
                  {f.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setFilterValues((p) => ({ ...p, [f.key]: opt })); setOpenFilter(null); }}
                      className="w-full px-3 py-2 text-left transition-colors"
                      style={{ fontSize: 12, color: "var(--foreground)", border: "none", background: "none", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filterSlot && <>{filterSlot}</>}
          <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: "auto" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div
          className="rounded-lg overflow-x-auto"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {renderedColumns.map((col) => (
                  <th
                    key={col.colId ?? col.key}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--muted-foreground)",
                      letterSpacing: "0.06em",
                      fontFamily: "var(--font-mono)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={renderedColumns.length}
                    style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: "var(--muted-foreground)" }}
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                visible.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < visible.length - 1 ? "1px solid var(--border)" : "none",
                      background: highlightId && row[idKey] === highlightId ? "rgba(107,140,255,0.08)" : "transparent",
                      outline: highlightId && row[idKey] === highlightId ? "1px solid rgba(107,140,255,0.4)" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = highlightId && row[idKey] === highlightId ? "rgba(107,140,255,0.08)" : "transparent")}
                  >
                    {renderedColumns.map((col) => (
                      <td
                        key={col.colId ?? col.key}
                        style={{
                          padding: "12px 20px",
                          fontSize: 13,
                          color: "var(--foreground)",
                          fontFamily: col.mono ? "var(--font-mono)" : undefined,
                        }}
                      >
                        {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {shown < filtered.length && (
          <button
            onClick={() => setShown((s) => s + PAGE_SIZE)}
            className="w-full rounded-lg py-2.5 transition-colors"
            style={{
              fontSize: 13,
              fontWeight: 500,
              background: "var(--card)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              color: "var(--foreground)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card)")}
          >
            Load more ({filtered.length - shown} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
