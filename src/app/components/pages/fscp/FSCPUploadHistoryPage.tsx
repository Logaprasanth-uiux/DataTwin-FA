import { useState } from "react";
import { ListPage } from "../ListPage";
import { DateRangeFilter } from "../../DateRangeFilter";
import { FSCPAttachmentModal } from "./FSCPAttachmentModal";
import { FSCPUploadDocumentsModal } from "./FSCPUploadDocumentsModal";
import { initialUploadHistory, FSCPUploadRecord } from "./mockUploadHistory";
import { CheckCircle, AlertCircle, FileSearch, FileDown, MoreHorizontal, X } from "lucide-react";

interface FSCPUploadHistoryPageProps {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  onNavigateToCockpit: (result: {
    company?: string;
    financialPeriod?: string;
    kpi?: string;
    domain?: string;
    process?: string;
    issueId?: string;
  }) => void;
}

const statusColors: Record<string, string> = {
  Completed: "#4ade80",
  Processing: "#6b8cff",
  Failed: "#f87171",
  Draft: "#fbbf24",
};

function defaultMonthRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

export function FSCPUploadHistoryPage({ showUploadModal, setShowUploadModal, onNavigateToCockpit }: FSCPUploadHistoryPageProps) {
  const [rows, setRows] = useState<FSCPUploadRecord[]>(initialUploadHistory);
  const [selectedRecord, setSelectedRecord] = useState<FSCPUploadRecord | null>(null);
  const [dateRange, setDateRange] = useState(defaultMonthRange);
  const [successNotification, setSuccessNotification] = useState<{ show: boolean; record: FSCPUploadRecord } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Columns Configuration
  const columns = [
    {
      key: "id",
      label: "Transaction ID",
      mono: true,
      render: (val: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => setSelectedRecord(row as unknown as FSCPUploadRecord)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            color: "#6b8cff",
            textDecoration: "none",
            padding: 0,
            textAlign: "left",
          }}
          className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {String(val)}
        </button>
      ),
    },
    {
      key: "uploadDate",
      label: "Upload Date",
      render: (val: unknown) => {
        const str = String(val);
        const parts = str.split(" ");
        if (parts.length >= 3) {
          const dateStr = `${parts[0]} ${parts[1]} ${parts[2]}`;
          const timeStr = parts.slice(3).join(" ");
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">{dateStr}</span>
              <span className="text-[11px] text-muted-foreground">{timeStr}</span>
            </div>
          );
        }
        return String(val);
      },
    },
    { key: "company", label: "Company" },
    { key: "prdFrom", label: "For PRD From", mono: true },
    { key: "prdTo", label: "For PRD To", mono: true },
    { key: "type", label: "Type" },
    {
      key: "status",
      label: "Status",
      render: (val: unknown) => (
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: statusColors[String(val)] }}>
          <span
            className="rounded-full animate-pulse"
            style={{
              width: 6,
              height: 6,
              background: statusColors[String(val)],
              display: "inline-block",
            }}
          />
          {String(val)}
        </span>
      ),
    },
    {
      key: "attachments",
      label: "Attachments",
      render: (val: unknown, row: Record<string, unknown>) => {
        const count = Array.isArray(val) ? val.length : 0;
        return (
          <button
            onClick={() => setSelectedRecord(row as unknown as FSCPUploadRecord)}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-muted border border-transparent transition-all cursor-pointer text-blue-500"
            style={{ background: "rgba(107, 140, 255, 0.1)" }}
          >
            📎 {count} File{count !== 1 ? "s" : ""}
          </button>
        );
      },
    },
    {
      key: "actions",
      colId: "upload_actions",
      label: "Actions",
      render: (_, row: Record<string, unknown>) => {
        const isDropdownOpen = openDropdownId === String(row.id);
        const record = row as unknown as FSCPUploadRecord;

        return (
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() =>
                onNavigateToCockpit({
                  company: record.company,
                  financialPeriod: record.prdFrom,
                  kpi: "Close Blocker",
                  domain: "Core Finance",
                  process: "General Ledger",
                  issueId: "BLK-GEN-201",
                })
              }
              className="flex items-center gap-1 rounded px-2.5 py-1.5 transition-colors"
              style={{
                fontSize: 11,
                fontWeight: 500,
                background: "var(--foreground)",
                color: "var(--background)",
                border: "none",
                cursor: "pointer",
              }}
            >
              View Results
            </button>
            <button
              onClick={() => alert(`Downloading Report for transaction: ${record.id}`)}
              className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-accent border"
              style={{
                background: "var(--secondary)",
                borderColor: "var(--border)",
                cursor: "pointer",
                color: "var(--foreground)",
              }}
              title="Download Report"
            >
              <FileDown size={12} />
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdownId(isDropdownOpen ? null : String(record.id))}
                className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-accent border"
                style={{
                  background: "var(--secondary)",
                  borderColor: "var(--border)",
                  cursor: "pointer",
                  color: "var(--foreground)",
                }}
              >
                <MoreHorizontal size={12} />
              </button>
              {isDropdownOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 100 }}
                    onClick={() => setOpenDropdownId(null)}
                  />
                  <div
                    className="absolute right-0 mt-1 rounded-lg border shadow-lg flex flex-col py-1 min-w-[120px]"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      zIndex: 101,
                    }}
                  >
                    <button
                      onClick={() => {
                        setOpenDropdownId(null);
                        alert(`Audit history details for ${record.id}`);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors border-none cursor-pointer"
                      style={{ color: "var(--foreground)", background: "none" }}
                    >
                      Audit Trail
                    </button>
                    <button
                      onClick={() => {
                        setOpenDropdownId(null);
                        alert(`Retry processing for ${record.id}`);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors border-none cursor-pointer"
                      style={{ color: "var(--foreground)", background: "none" }}
                    >
                      Retry Processing
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  // Filters Configuration
  const filterConfig = [
    {
      key: "company",
      label: "Company",
      options: [
        "Global Holdings Group",
        "North America Operations",
        "Europe Finance Group",
        "APAC Shared Services",
        "Fabrikam Retail",
        "Contoso Manufacturing",
      ],
    },
    {
      key: "status",
      label: "Status",
      options: ["Completed", "Processing", "Failed", "Draft"],
    },
  ];

  const handleUploadSuccess = (files: Array<{ name: string; size: string }>, result: any) => {
    const nextId = `FSCP-2026-${String(rows.length + 125).padStart(6, "0")}`;
    const now = new Date();
    const uploadDateStr =
      now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " " +
      now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const newRecord: FSCPUploadRecord = {
      id: nextId,
      uploadDate: uploadDateStr,
      company: result.company || "Global Holdings Group",
      prdFrom: result.financialPeriod || "01-Jun-2026",
      prdTo: "30-Jun-2026",
      type: "Monthly Close",
      status: "Completed",
      attachments: files,
      createdBy: "Alex Johnson",
      lastUpdated: uploadDateStr,
      reportAvailable: true,
    };

    setRows((prev) => [newRecord, ...prev]);
    setShowUploadModal(false);
    setSuccessNotification({ show: true, record: newRecord });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Upload Success Banner */}
      {successNotification && (
        <div
          className="flex items-center justify-between mx-8 mt-4 p-4 rounded-xl border animate-fadeIn z-50 flex-shrink-0"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            borderColor: "rgba(16, 185, 129, 0.2)",
          }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-500 flex-shrink-0" size={18} />
            <div className="flex flex-col text-left gap-0.5">
              <span className="text-xs font-semibold text-foreground">
                Reconciliation Complete
              </span>
              <span className="text-[11px] text-muted-foreground">
                New package for {successNotification.record.company} uploaded successfully.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const rec = successNotification.record;
                onNavigateToCockpit({
                  company: rec.company,
                  financialPeriod: rec.prdFrom,
                  kpi: "Close Blocker",
                  domain: "Core Finance",
                  process: "General Ledger",
                  issueId: "BLK-GEN-201",
                });
                setSuccessNotification(null);
              }}
              className="text-xs font-bold text-blue-500 hover:underline border-none cursor-pointer bg-none"
              style={{ background: "none" }}
            >
              View Results
            </button>
            <button
              onClick={() => setSuccessNotification(null)}
              className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer border-none bg-none"
              style={{ background: "none" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Attachment detail modal */}
      {selectedRecord && (
        <FSCPAttachmentModal
          isOpen={true}
          onClose={() => setSelectedRecord(null)}
          attachments={selectedRecord.attachments}
          transactionId={selectedRecord.id}
        />
      )}

      {/* Upload Documents modal */}
      <FSCPUploadDocumentsModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        isHistoryPage={true}
      />

      <ListPage
        title="Upload History"
        addLabel="Upload Documents"
        columns={columns}
        rows={rows as unknown as Record<string, unknown>[]}
        filters={filterConfig}
        onAdd={() => setShowUploadModal(true)}
        filterSlot={
          <DateRangeFilter
            from={dateRange.from}
            to={dateRange.to}
            onChange={(f, t) => setDateRange({ from: f, to: t })}
          />
        }
      />
    </div>
  );
}
