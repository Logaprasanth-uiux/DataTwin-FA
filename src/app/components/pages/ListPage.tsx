import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Search, Plus, ChevronDown, SlidersHorizontal, BotMessageSquare, Upload } from "lucide-react";
import { useActivity } from "../../contexts";
import { UserProfile } from "../UserProfile";

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
  isBillTable?: boolean;
  tableId?: "bill" | "organization" | "vendor" | "po";
}

const PAGE_SIZE = 10;

export function ListPage({ 
  title, 
  addLabel, 
  columns, 
  rows, 
  filters, 
  onAdd, 
  highlightId, 
  idKey = "id", 
  titleSlot, 
  filterSlot,
  isBillTable = false,
  tableId
}: ListPageProps) {
  const { openActivity, setHeaderAction } = useActivity();

  const onAddRef = useRef(onAdd);
  useEffect(() => {
    onAddRef.current = onAdd;
  }, [onAdd]);

  useEffect(() => {
    if (setHeaderAction) {
      const isUpload = addLabel.toLowerCase().includes("upload");
      const Icon = isUpload ? Upload : Plus;

      setHeaderAction(
        <button
          onClick={() => onAddRef.current?.()}
          className="page-header-action flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
          style={{
            fontSize: 12,
            fontWeight: 500,
            background: "var(--foreground)",
            color: "var(--background)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Icon size={13} />
          {addLabel}
        </button>
      );
    }
    return () => {
      if (setHeaderAction) {
        setHeaderAction(null);
      }
    };
  }, [addLabel, setHeaderAction]);

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

  const isActualBillTable = tableId === "bill" || isBillTable;
  const isOrgTable = tableId === "organization";
  const isVendorTable = tableId === "vendor";
  const isPOTable = tableId === "po";
  const isResponsiveTable = isActualBillTable || isOrgTable || isVendorTable || isPOTable;

  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  useEffect(() => {
    if (!tableContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setContainerWidth(width);
    });
    observer.observe(tableContainerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Filter columns based on available width and business priority rules
  let columnsToRender = renderedColumns;
  if (isResponsiveTable) {
    columnsToRender = renderedColumns.filter((col) => {
      if (isActualBillTable) {
        if (col.colId === "activity_col" && containerWidth < 900) return false;
        if (col.key === "vendorId" && containerWidth < 800) return false;
        if (col.key === "interimId" && containerWidth < 700) return false;
      }
      if (isOrgTable) {
        if (col.colId === "activity_col" && containerWidth < 900) return false;
        if (col.key === "contact" && containerWidth < 800) return false;
        if (col.key === "created" && containerWidth < 750) return false;
        if (col.key === "country" && containerWidth < 700) return false;
      }
      if (isVendorTable) {
        if (col.colId === "activity_col" && containerWidth < 900) return false;
        if (col.key === "createdAt" && containerWidth < 800) return false;
        if (col.key === "state" && containerWidth < 700) return false;
        if (col.key === "memberType" && containerWidth < 600) return false;
      }
      if (isPOTable) {
        if (col.colId === "activity_col" && containerWidth < 900) return false;
        if (col.key === "vendorId" && containerWidth < 800) return false;
        if (col.key === "date" && containerWidth < 700) return false;
      }
      return true;
    });
  }

  const userClickedLoadMore = useRef(false);
  const previousShown = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const firstNewRowRef = useRef<HTMLTableRowElement | null>(null);

  useLayoutEffect(() => {
    if (userClickedLoadMore.current && firstNewRowRef.current) {
      userClickedLoadMore.current = false;
      const el = firstNewRowRef.current;
      const container = scrollContainerRef.current;
      if (container) {
        let offsetTop = 0;
        let curr: HTMLElement | null = el;
        while (curr && curr !== container) {
          offsetTop += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement | null;
        }
        container.scrollTo({
          top: Math.max(0, offsetTop - 50),
          behavior: "smooth"
        });
      }
    }
  }, [shown]);

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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
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
          ref={tableContainerRef}
          className="rounded-lg overflow-x-auto"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {columnsToRender.map((col) => {
                  const paddingStyleTh = isResponsiveTable
                    ? (containerWidth < 650 ? "10px 6px" : containerWidth < 700 ? "10px 8px" : containerWidth < 800 ? "10px 12px" : containerWidth < 900 ? "10px 16px" : "10px 20px")
                    : "10px 20px";
                  return (
                    <th
                      key={col.colId ?? col.key}
                      style={{
                        padding: paddingStyleTh,
                        textAlign: "left",
                        fontSize: isResponsiveTable && containerWidth < 700 ? 11 : 11,
                        fontWeight: 500,
                        color: "var(--muted-foreground)",
                        letterSpacing: "0.06em",
                        fontFamily: "var(--font-mono)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label.toUpperCase()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnsToRender.length}
                    style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: "var(--muted-foreground)" }}
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                visible.map((row, i) => (
                  <tr
                    key={i}
                    ref={i === previousShown.current ? firstNewRowRef : undefined}
                    style={{
                      borderBottom: i < visible.length - 1 ? "1px solid var(--border)" : "none",
                      background: highlightId && row[idKey] === highlightId ? "rgba(107,140,255,0.08)" : "transparent",
                      outline: highlightId && row[idKey] === highlightId ? "1px solid rgba(107,140,255,0.4)" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = highlightId && row[idKey] === highlightId ? "rgba(107,140,255,0.08)" : "transparent")}
                  >
                    {columnsToRender.map((col) => {
                      const isNameCol = col.label === "Vendor Name" || col.label === "Name" || col.key === "vendor" || col.key === "vendorName" || col.key === "name";
                      const isCompact = containerWidth < 900;
                      
                      const paddingStyleTd = isResponsiveTable
                        ? (containerWidth < 650 ? "12px 6px" : containerWidth < 700 ? "12px 8px" : containerWidth < 800 ? "12px 12px" : containerWidth < 900 ? "12px 16px" : "12px 20px")
                        : "12px 20px";

                      let cellStyle: React.CSSProperties = {
                        padding: paddingStyleTd,
                        fontSize: isResponsiveTable && containerWidth < 700 ? 12.5 : 13,
                        color: "var(--foreground)",
                        fontFamily: col.mono ? "var(--font-mono)" : undefined,
                      };

                      if (isResponsiveTable) {
                        if (isNameCol) {
                          if (isCompact) {
                            const nameMaxWidth = containerWidth < 600 ? "90px" : containerWidth < 700 ? "120px" : containerWidth < 800 ? "160px" : "200px";
                            cellStyle = {
                              ...cellStyle,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: nameMaxWidth,
                            };
                          } else {
                            cellStyle = {
                              ...cellStyle,
                              whiteSpace: "normal",
                            };
                          }
                        } else {
                          cellStyle = {
                            ...cellStyle,
                            whiteSpace: "nowrap",
                          };
                        }
                      }

                      return (
                        <td
                          key={col.colId ?? col.key}
                          style={cellStyle}
                        >
                          {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {shown < filtered.length && (
          <button
            onClick={() => {
              userClickedLoadMore.current = true;
              previousShown.current = shown;
              setShown((s) => s + PAGE_SIZE);
            }}
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
