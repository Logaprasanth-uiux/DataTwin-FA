import { useState, useEffect } from "react";
import { X, Paperclip, Plus, CheckCircle } from "lucide-react";

interface FSCPUploadDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (
    uploadedFiles: Array<{ name: string; size: string }>,
    result: { company?: string; financialPeriod?: string; kpi?: string; domain?: string; process?: string; issueId?: string }
  ) => void;
  isHistoryPage?: boolean;
}

export function FSCPUploadDocumentsModal({ isOpen, onClose, onUploadSuccess, isHistoryPage = false }: FSCPUploadDocumentsModalProps) {
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; name: string | null; size: string }>>([
    { id: String(Date.now()), name: null, size: "" }
  ]);
  const [reconciliationState, setReconciliationState] = useState<"idle" | "processing" | "complete">("idle");
  const [reconcileProgress, setReconcileProgress] = useState(0);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);

  // Focus Trap & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Track previous focus
    const prevActiveElement = document.activeElement as HTMLElement | null;

    // Auto-focus first focusable element
    setTimeout(() => {
      const container = document.getElementById("upload-documents-dialog");
      if (container) {
        const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
        const firstFocusable = container.querySelector(focusableSelectors) as HTMLElement | null;
        firstFocusable?.focus();
      }
    }, 80);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. ESCAPE handler
      if (e.key === "Escape") {
        if (reconciliationState !== "processing" && !handoffMessage) {
          e.preventDefault();
          handleModalClose();
        }
        return;
      }

      // 2. FOCUS TRAP handler
      if (e.key === "Tab") {
        const container = document.getElementById("upload-documents-dialog");
        if (!container) return;

        const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
        const focusables = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
        if (focusables.length === 0) return;

        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }

        // Keep focus strictly within container if activeElement wanders off
        if (!container.contains(document.activeElement)) {
          firstEl.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
      // Restore focus
      prevActiveElement?.focus();
    };
  }, [isOpen, reconciliationState, handoffMessage, uploadedDocs]);

  if (!isOpen) return null;

  const handleStartReconciliation = () => {
    setReconciliationState("processing");
    setReconcileProgress(0);

    const duration = Math.floor(Math.random() * 2000) + 2000; // 2 to 4 seconds
    const intervalTime = 50;
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setReconcileProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setReconciliationState("complete");

        // If it is the Upload History page, complete the flow immediately
        if (isHistoryPage) {
          const validDocs = uploadedDocs
            .filter((d) => d.name !== null)
            .map((d) => ({ name: d.name!, size: d.size || "1.2 MB" }));
          
          setTimeout(() => {
            // Reset modal state
            setUploadedDocs([{ id: String(Date.now()), name: null, size: "" }]);
            setReconciliationState("idle");
            setReconcileProgress(0);
            onUploadSuccess(validDocs, {
              company: "Global Holdings Group",
              financialPeriod: "01-Jun-2026",
              kpi: "Close Blocker",
              domain: "Core Finance",
              process: "General Ledger",
              issueId: "BLK-GEN-201"
            });
          }, 300);
        }
      }
    }, intervalTime);
  };

  const handleViewResults = () => {
    setHandoffMessage("Opening Investigation Workspace...");
    setTimeout(() => {
      setHandoffMessage(null);
      const validDocs = uploadedDocs
        .filter((d) => d.name !== null)
        .map((d) => ({ name: d.name!, size: d.size || "1.2 MB" }));

      // Reset modal state
      setUploadedDocs([{ id: String(Date.now()), name: null, size: "" }]);
      setReconciliationState("idle");
      setReconcileProgress(0);
      onClose();

      onUploadSuccess(validDocs, {
        company: "Global Holdings Group",
        financialPeriod: "01-Jun-2026",
        kpi: "Close Blocker",
        domain: "Core Finance",
        process: "General Ledger",
        issueId: "BLK-GEN-201"
      });
    }, 600);
  };

  function handleModalClose() {
    if (reconciliationState !== "processing" && !handoffMessage) {
      setUploadedDocs([{ id: String(Date.now()), name: null, size: "" }]);
      setReconciliationState("idle");
      setReconcileProgress(0);
      onClose();
    }
  }

  const progressMessage = reconcileProgress < 35 
    ? "Reading uploaded documents..." 
    : reconcileProgress < 70 
    ? "Matching financial records..." 
    : "Detecting reconciliation exceptions...";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleModalClose}
    >
      <div
        id="upload-documents-dialog"
        className="w-full max-w-md rounded-xl border flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="text-base font-bold text-foreground">Upload Documents</h3>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
              Upload one or more documents to begin the reconciliation process.
            </p>
          </div>
          {reconciliationState !== "processing" && !handoffMessage && (
            <button
              onClick={handleModalClose}
              className="p-1 rounded-lg hover:bg-muted/50 transition-colors border-none cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
              style={{ background: "none", color: "var(--muted-foreground)" }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-left" style={{ background: "var(--card)" }}>
          {handoffMessage ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4 animate-fadeIn">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                {handoffMessage}
              </p>
            </div>
          ) : (
            <>
              {reconciliationState === "idle" && (
                <>
                  <div className="flex flex-col gap-3">
                    {uploadedDocs.map((doc, idx) => {
                      if (doc.name) {
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border text-xs font-semibold"
                            style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle size={14} className="text-emerald-500" />
                              <span className="truncate max-w-[280px]">{doc.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                setUploadedDocs((prev) => {
                                  const filtered = prev.filter((d) => d.id !== doc.id);
                                  return filtered.length === 0 ? [{ id: String(Date.now()), name: null, size: "" }] : filtered;
                                });
                              }}
                              className="text-xs border-none cursor-pointer p-1 rounded hover:bg-muted transition-colors flex items-center justify-center"
                              style={{ background: "none", color: "var(--destructive)" }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={doc.id} className="flex flex-col gap-1.5">
                          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Upload Document
                          </label>
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                const file = e.dataTransfer.files[0];
                                const sizeStr = file.size > 1024 * 1024
                                  ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                  : `${Math.round(file.size / 1024)} KB`;
                                setUploadedDocs((prev) =>
                                  prev.map((d) => (d.id === doc.id ? { ...d, name: file.name, size: sizeStr } : d))
                                );
                              }
                            }}
                            onClick={() => document.getElementById(`file-upload-input-${doc.id}`)?.click()}
                            className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed text-center transition-all cursor-pointer hover:bg-muted/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                            style={{
                              background: "var(--secondary)",
                              borderColor: "var(--border)",
                              minHeight: 90
                            }}
                          >
                            <input
                              id={`file-upload-input-${doc.id}`}
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const sizeStr = file.size > 1024 * 1024
                                    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                    : `${Math.round(file.size / 1024)} KB`;
                                  setUploadedDocs((prev) =>
                                    prev.map((d) => (d.id === doc.id ? { ...d, name: file.name, size: sizeStr } : d))
                                  );
                                }
                              }}
                            />
                            <Paperclip size={18} className="text-blue-500 mb-1.5" />
                            <span className="text-xs font-semibold text-foreground">
                              Drag & Drop or Browse Files
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {uploadedDocs.some((d) => d.name !== null) && !uploadedDocs.some((d) => d.name === null) && (
                    <button
                      onClick={() => {
                        setUploadedDocs((prev) => [...prev, { id: String(Date.now()), name: null, size: "" }]);
                      }}
                      className="flex items-center gap-1.5 self-start text-xs font-bold border-none cursor-pointer p-1.5 rounded transition-all text-blue-500 hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                      style={{ background: "none" }}
                    >
                      <Plus size={14} />
                      Add Another Document
                    </button>
                  )}
                </>
              )}

              {reconciliationState === "processing" && (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-4 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />

                  <div className="flex flex-col gap-1">
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                      {progressMessage}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                      Estimated processing time: 1–2 minutes
                    </p>
                  </div>

                  <div className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden mt-2" style={{ background: "var(--secondary)" }}>
                    <div
                      className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${reconcileProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {reconciliationState === "complete" && (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-3 animate-fadeIn">
                  <div className="flex items-center justify-center rounded-full bg-emerald-500/10 p-2.5 text-emerald-500 mb-1">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-base font-bold text-foreground">Reconciliation Complete</h4>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                      Your reconciliation data is ready.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3 flex-shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          {reconciliationState === "idle" && !handoffMessage && (
            <>
              <button
                onClick={handleModalClose}
                className="px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                disabled={!uploadedDocs.some((d) => d.name !== null)}
                onClick={handleStartReconciliation}
                className="px-4 py-2 rounded-lg text-xs font-bold border-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
                style={{
                  background: uploadedDocs.some((d) => d.name !== null) ? "var(--foreground)" : "var(--muted)",
                  color: uploadedDocs.some((d) => d.name !== null) ? "var(--background)" : "var(--muted-foreground)",
                  cursor: uploadedDocs.some((d) => d.name !== null) ? "pointer" : "not-allowed",
                  opacity: uploadedDocs.some((d) => d.name !== null) ? 1 : 0.5
                }}
              >
                Start Reconciliation
              </button>
            </>
          )}

          {reconciliationState === "complete" && !handoffMessage && (
            <button
              onClick={handleViewResults}
              className="px-5 py-2 rounded-lg text-xs font-bold border-none cursor-pointer w-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
              style={{ background: "var(--foreground)", color: "var(--background)" }}
            >
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
