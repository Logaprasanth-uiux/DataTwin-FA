import { X, FileDown, Eye } from "lucide-react";
import { FSCPAttachment } from "./mockUploadHistory";

interface FSCPAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: FSCPAttachment[];
  transactionId: string;
}

export function FSCPAttachmentModal({ isOpen, onClose, attachments, transactionId }: FSCPAttachmentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 250,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl flex-shrink-0"
        style={{
          width: "min(560px, 95vw)",
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex flex-col gap-0.5">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
              Attachments
            </h3>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
              {transactionId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[350px] flex flex-col gap-2">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border transition-colors"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  title={file.name}
                >
                  {file.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                  {file.size}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => alert(`Viewing file: ${file.name}`)}
                  className="flex items-center gap-1 rounded px-2.5 py-1.5 transition-colors"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    color: "var(--foreground)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--secondary)")}
                >
                  <Eye size={11} /> View
                </button>
                <button
                  onClick={() => alert(`Downloading file: ${file.name}`)}
                  className="flex items-center gap-1 rounded px-2.5 py-1.5 transition-colors"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    color: "var(--foreground)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--secondary)")}
                >
                  <FileDown size={11} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-end flex-shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer hover:bg-muted/50 transition-colors"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
