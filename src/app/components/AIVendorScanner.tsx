import { useState, useRef } from "react";
import { Upload, Sparkles, CheckCircle2, AlertCircle, XCircle, FileText, X, RefreshCw } from "lucide-react";

export interface ScannedVendorData {
  vendorName?: string;
  emailPrimary?: string;
  mobilePrimary?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  website?: string;
  landline?: string;
  contactPerson?: string;
}

interface ScanField {
  key: keyof ScannedVendorData;
  label: string;
  required: boolean;
}

const SCAN_FIELDS: ScanField[] = [
  { key: "vendorName",    label: "Vendor Name",      required: true },
  { key: "gstin",         label: "GSTIN",             required: true },
  { key: "pan",           label: "PAN",               required: true },
  { key: "emailPrimary",  label: "Email",             required: true },
  { key: "mobilePrimary", label: "Mobile",            required: false },
  { key: "address",       label: "Address",           required: false },
  { key: "city",          label: "City",              required: false },
  { key: "state",         label: "State",             required: false },
  { key: "pincode",       label: "Pincode",           required: false },
  { key: "contactPerson", label: "Contact Person",    required: false },
  { key: "website",       label: "Website",           required: false },
];

// Simulated extraction — in production this calls a real AI API
function simulateScan(fileName: string): ScannedVendorData {
  const isPdf = /\.pdf$/i.test(fileName);
  // Richer mock for PDFs, partial mock for images
  if (isPdf) {
    return {
      vendorName: "Sunrise Tech Solutions Pvt Ltd",
      emailPrimary: "billing@sunrisetech.in",
      mobilePrimary: "+91 98400 12345",
      gstin: "29AABCS1429B1ZP",
      pan: "AABCS1429B",
      address: "No. 14, 3rd Cross, HSR Layout",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560102",
      country: "India",
      contactPerson: "Suresh Nair",
      website: "https://sunrisetech.in",
    };
  }
  // Image — partial extraction
  return {
    vendorName: "Sunrise Tech Solutions Pvt Ltd",
    gstin: "29AABCS1429B1ZP",
    emailPrimary: "billing@sunrisetech.in",
    // missing pan, address, contact, etc.
  };
}

type ScanState = "idle" | "scanning" | "done" | "dismissed";

interface Props {
  onApply: (data: ScannedVendorData) => void;
}

export function AIVendorScanner({ onApply }: Props) {
  const [state, setState] = useState<ScanState>("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [result, setResult] = useState<ScannedVendorData | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function startScan(file: File) {
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(0)} KB`);
    setState("scanning");
    setProgress(0);

    // Animate progress bar
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) { p = 100; clearInterval(iv); }
      setProgress(Math.min(p, 100));
    }, 180);

    setTimeout(() => {
      const scanned = simulateScan(file.name);
      setResult(scanned);
      setState("done");
    }, 2600);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) startScan(file);
  }

  function reset() {
    setState("idle");
    setFileName("");
    setResult(null);
    setProgress(0);
  }

  if (state === "dismissed") return null;

  // ── Idle ────────────────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <div
        className="rounded-xl flex flex-col gap-3 p-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 28, height: 28, background: "var(--foreground)" }}
            >
              <Sparkles size={13} style={{ color: "var(--background)" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>AI Auto-fill</p>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Upload an invoice or bill to extract vendor details automatically</p>
            </div>
          </div>
          <button onClick={() => setState("dismissed")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
            <X size={14} />
          </button>
        </div>

        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg cursor-pointer transition-colors"
          style={{ border: "1.5px dashed var(--border)", padding: "28px 0", background: "var(--secondary)" }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--foreground)"; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
          onDrop={e => { e.currentTarget.style.borderColor = "var(--border)"; handleDrop(e); }}
        >
          <Upload size={22} style={{ color: "var(--muted-foreground)" }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Drop file here or click to upload</p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Supported: PDF, JPEG, PNG · Max 10 MB</p>
        </div>

        <input
          ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) startScan(f); e.target.value = ""; }}
        />
      </div>
    );
  }

  // ── Scanning ────────────────────────────────────────────────────────────────
  if (state === "scanning") {
    return (
      <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: "var(--foreground)" }}>
            <Sparkles size={13} style={{ color: "var(--background)" }} className="animate-spin" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Scanning document…</p>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Extracting vendor details from {fileName}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: "var(--secondary)" }}>
          <div
            className="rounded-full transition-all"
            style={{ height: "100%", width: `${progress}%`, background: "var(--foreground)", transition: "width 0.18s ease" }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["Reading document structure", "Identifying vendor info", "Extracting tax numbers", "Parsing address fields"].map((step, i) => (
            <span
              key={step}
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{
                fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)",
                color: progress > i * 25 ? "var(--foreground)" : "var(--muted-foreground)",
                transition: "color 0.3s",
              }}
            >
              {progress > i * 25 + 20
                ? <CheckCircle2 size={10} style={{ color: "#4ade80" }} />
                : <span style={{ width: 10, height: 10, display: "inline-block" }} />}
              {step}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  const found = SCAN_FIELDS.filter(f => result?.[f.key]);
  const missing = SCAN_FIELDS.filter(f => !result?.[f.key]);
  const missingRequired = missing.filter(f => f.required);
  const allRequiredFound = missingRequired.length === 0;

  return (
    <div className="rounded-xl flex flex-col gap-0 overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background: allRequiredFound ? "rgba(74,222,128,0.06)" : "rgba(251,191,36,0.06)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {allRequiredFound
            ? <CheckCircle2 size={18} style={{ color: "#4ade80", flexShrink: 0 }} />
            : <AlertCircle size={18} style={{ color: "#fbbf24", flexShrink: 0 }} />}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
              {allRequiredFound ? "All required fields extracted" : "Scan complete — some fields need manual input"}
            </p>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              {found.length} fields found from <span style={{ fontFamily: "var(--font-mono)" }}>{fileName}</span> ({fileSize})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
            style={{ fontSize: 11, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
          >
            <RefreshCw size={11} /> Rescan
          </button>
        </div>
      </div>

      {/* Extracted fields preview */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Found */}
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>EXTRACTED</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {found.map(f => (
            <div key={f.key} className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <CheckCircle2 size={12} style={{ color: "#4ade80", marginTop: 2, flexShrink: 0 }} />
              <div className="flex flex-col min-w-0">
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>{f.label.toUpperCase()}</span>
                <span style={{ fontSize: 12, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {String(result?.[f.key] ?? "")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Missing */}
        {missing.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", marginTop: 4 }}>
              NOT FOUND — FILL MANUALLY
            </p>
            <div className="flex flex-wrap gap-2">
              {missing.map(f => (
                <span
                  key={f.key}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{
                    fontSize: 11,
                    background: f.required ? "rgba(248,113,113,0.08)" : "var(--secondary)",
                    border: `1px solid ${f.required ? "rgba(248,113,113,0.3)" : "var(--border)"}`,
                    color: f.required ? "#f87171" : "var(--muted-foreground)",
                  }}
                >
                  {f.required ? <XCircle size={10} /> : <AlertCircle size={10} />}
                  {f.label}
                  {f.required && <span style={{ fontSize: 9, opacity: 0.8 }}>required</span>}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action footer */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderTop: "1px solid var(--border)", background: "var(--secondary)" }}
      >
        <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
          {allRequiredFound
            ? "Ready to apply. Review the form below before creating the vendor."
            : "Apply what was found, then fill in the highlighted missing fields."}
        </p>
        <button
          onClick={() => { if (result) onApply(result); }}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-colors"
          style={{
            fontSize: 12, fontWeight: 600,
            background: "var(--foreground)", color: "var(--background)",
            border: "none", cursor: "pointer",
          }}
        >
          <Sparkles size={12} />
          {allRequiredFound ? "Apply & Confirm" : "Apply Extracted Fields"}
        </button>
      </div>
    </div>
  );
}
