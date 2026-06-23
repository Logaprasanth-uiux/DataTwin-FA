import { useState, useRef, useEffect, useContext } from "react";
import { UserProfileMenu } from "../UserProfileMenu";
import { Edit3, Check, X, FileText, Download, Calendar, Mail, Building, Plus, Trash2, HelpCircle, Save, Lock, Copy, Eye, Send, File, Link, Clock, MapPin, Hash, User, Phone, Globe, UploadCloud, Shield, Users, CreditCard, ExternalLink, RefreshCw, MessageSquare, X as XIcon } from "lucide-react";
import { AIVendorScanner, type ScannedVendorData } from "../../components/AIVendorScanner";
import { ActivityContext } from "../../contexts";
const tabs = ["General", "Registration & Tax", "Billing", "Certificates", "Bank Details", "Workflow"];

const statusColor: Record<string, string> = {
  Active: "#4ade80", Hold: "#fbbf24", Suspended: "#f87171", Inactive: "#888896",
};

interface CertFile { name: string; size: string; objectUrl?: string; type?: string; }
interface CertField { label: string; number: string; file: CertFile | null; }

interface VendorData {
  vendorId: string; status: string; vendorName: string; vendorType: string; vendorGroup: string;
  contactPerson: string; emailPrimary: string; emailSecondary: string;
  mobilePrimary: string; mobileSecondary: string; website: string; landline: string; characteristics: string;
  address: string; city: string; state: string; country: string; pincode: string;
  gstTreatment: string; taxClassification: string; taxPreferences: string; currency: string;
  gstin: string; sourceOfSupply: string; tan: string;
  accountRef: string; deliveryTerms: string; paymentTerms: string; shippingMethod: string; paymentMode: string;
  bankName: string; accountHolder: string; accountNumber: string; ifsc: string; bankBranch: string; accountType: string;
  selectedWorkflow: string; createdAt?: string;
}

function makeEmpty(): VendorData {
  return {
    vendorId: "", status: "Active",
    vendorName: "", vendorType: "Non MSME", vendorGroup: "", contactPerson: "",
    emailPrimary: "", emailSecondary: "",
    mobilePrimary: "", mobileSecondary: "",
    website: "", landline: "", characteristics: "",
    address: "", city: "", state: "", country: "India", pincode: "",
    gstTreatment: "GST Registered", taxClassification: "Regular", taxPreferences: "Taxable", currency: "INR",
    gstin: "", sourceOfSupply: "Tamil Nadu", tan: "",
    accountRef: "", deliveryTerms: "Ex-Works", paymentTerms: "Net 30",
    shippingMethod: "Courier", paymentMode: "NEFT",
    bankName: "", accountHolder: "", accountNumber: "", ifsc: "", bankBranch: "", accountType: "Current",
    selectedWorkflow: "Standard Approval Flow",
  };
}

function makeDefault(id: string): VendorData {
  return {
    vendorId: id, status: "Active",
    vendorName: id === "VND-001" ? "TechSupply Co" : id === "VND-002" ? "OfficeMax Pro" : "Vendor Co",
    vendorType: "Non MSME", vendorGroup: "IT Suppliers", contactPerson: "Rajesh Kumar",
    emailPrimary: "rajesh@vendor.com", emailSecondary: "accounts@vendor.com",
    mobilePrimary: "+91 98765 43210", mobileSecondary: "+91 91234 56789",
    website: "https://vendor.com", landline: "+91 44 2345 6789",
    characteristics: "Preferred supplier for IT hardware and software licensing.",
    address: "Plot 12, Industrial Area Phase II",
    city: "Chennai", state: "Tamil Nadu", country: "India", pincode: "600058",
    gstTreatment: "GST Registered", taxClassification: "Regular", taxPreferences: "Taxable", currency: "INR",
    gstin: "33AABCT1332L1ZC", sourceOfSupply: "Tamil Nadu", tan: "CHEN12345A",
    accountRef: "ACC-2026-001", deliveryTerms: "Ex-Works", paymentTerms: "Net 30",
    shippingMethod: "Courier", paymentMode: "NEFT",
    bankName: "HDFC Bank", accountHolder: "TechSupply Co Pvt Ltd",
    accountNumber: "50200012345678", ifsc: "HDFC0001234",
    bankBranch: "Anna Nagar, Chennai", accountType: "Current",
    selectedWorkflow: "Standard Approval Flow",
    createdAt: "Jan 10, 2026"
  };
}

// ─── View-only field display ──────────────────────────────────────────────────

function ViewField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>
        {label.toUpperCase()}
      </span>
      <span
        style={{
          fontSize: 13,
          color: value ? "var(--foreground)" : "var(--muted-foreground)",
          fontFamily: mono ? "var(--font-mono)" : undefined,
          lineHeight: 1.5,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Editable field inputs ────────────────────────────────────────────────────

function EInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={false}
      style={{
        height: 34, background: "var(--secondary)", border: "1px solid var(--border)",
        borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)",
        padding: "0 10px", width: "100%",
      }}
    />
  );
}

function ETextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      rows={2}
      onChange={e => onChange(e.target.value)}
      style={{
        background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 8,
        outline: "none", fontSize: 13, color: "var(--foreground)", padding: "8px 10px",
        width: "100%", resize: "vertical", lineHeight: 1.5,
      }}
    />
  );
}

function ESelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        height: 34, background: "var(--secondary)", border: "1px solid var(--border)",
        borderRadius: 8, outline: "none", fontSize: 13, color: "var(--foreground)",
        padding: "0 10px", width: "100%", cursor: "pointer",
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ─── Section card with inline edit toggle ─────────────────────────────────────

interface SectionProps {
  title: string;
  children: (editing: boolean, draft: VendorData, setDraft: (k: keyof VendorData, v: string) => void) => React.ReactNode;
  data: VendorData;
  onSave: (d: VendorData) => void;
  defaultEditing?: boolean;
}

function Section({ title, children, data, onSave, defaultEditing = false }: SectionProps) {
  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState<VendorData>(data);

  function setField(k: keyof VendorData, v: string) {
    setDraft(d => ({ ...d, [k]: v }));
  }
  function handleSave() { onSave(draft); setEditing(false); }
  function handleCancel() { setDraft(data); setEditing(false); }

  // Sync draft when parent data changes (only while not editing)
  useEffect(() => {
    if (!editing) setDraft(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="rounded-xl flex flex-col gap-0" style={{ background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Section header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors"
            style={{
              fontSize: 11, fontWeight: 500,
              background: "var(--secondary)", border: "1px solid var(--border)",
              cursor: "pointer", color: "var(--muted-foreground)",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
          >
            <Edit3 size={11} /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
            >
              <XIcon size={11} /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
            >
              <Check size={11} /> Save
            </button>
          </div>
        )}
      </div>
      {/* Section body */}
      <div className="p-5">
        {children(editing, draft, setField)}
      </div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr" }}>{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>{children}</div>;
}

// ─── Document preview modal ──────────────────────────────────────────────────

function DocPreviewModal({ file, onClose }: { file: CertFile; onClose: () => void }) {
  const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png)$/i.test(file.name);
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{ width: 640, maxHeight: "85vh", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{file.name}</span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{file.size}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
            <XIcon size={16} />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6" style={{ minHeight: 320 }}>
          {file.objectUrl && isImage ? (
            <img src={file.objectUrl} alt={file.name} style={{ maxWidth: "100%", maxHeight: 480, borderRadius: 8, objectFit: "contain" }} />
          ) : file.objectUrl && isPdf ? (
            <iframe src={file.objectUrl} style={{ width: "100%", height: 440, border: "none", borderRadius: 8 }} title={file.name} />
          ) : (
            /* Mock placeholder for pre-seeded files (no real objectUrl) */
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center rounded-2xl" style={{ width: 80, height: 80, background: "var(--secondary)", border: "1px solid var(--border)" }}>
                <FileText size={36} style={{ color: "var(--muted-foreground)" }} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{file.name}</p>
                <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                  {isPdf ? "PDF document" : isImage ? "Image file" : "Document"} · {file.size}
                </p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8 }}>
                  Preview available after re-uploading the file.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Certificate row ─────────────────────────────────────────────────────────

const ACCEPTED_FORMATS = "PDF, JPEG, PNG";
const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png";

function CertRow({ label, cert, onChange }: { label: string; cert: CertField; onChange: (c: CertField) => void }) {
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasFile = !!cert.file;
  const isPdf = cert.file && (/\.pdf$/i.test(cert.file.name) || cert.file.type === "application/pdf");
  const isImage = cert.file && (/\.(jpg|jpeg|png)$/i.test(cert.file.name) || cert.file.type?.startsWith("image/"));
  const fileIcon = isPdf ? "📄" : isImage ? "🖼️" : "📎";

  return (
    <>
      {previewing && cert.file && (
        <DocPreviewModal file={cert.file} onClose={() => setPreviewing(false)} />
      )}

      <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        {/* Row header */}
        <div className="flex items-center justify-between">
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{label}</p>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 11 }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
            >
              <Edit3 size={11} /> Edit
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#4ade80", fontSize: 11 }}
            >
              <Check size={11} /> Done
            </button>
          )}
        </div>

        {/* Certificate number */}
        {editing ? (
          <input
            value={cert.number}
            onChange={e => onChange({ ...cert, number: e.target.value })}
            placeholder="Enter certificate / registration number"
            style={{
              height: 32, background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 6, outline: "none", fontSize: 12, color: "var(--foreground)", padding: "0 10px", width: "100%",
            }}
          />
        ) : (
          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: cert.number ? "var(--foreground)" : "var(--muted-foreground)" }}>
            {cert.number || "No number on record"}
          </span>
        )}

        {/* Document row */}
        {hasFile ? (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{fileIcon}</span>
            <span style={{ fontSize: 12, color: "var(--foreground)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cert.file!.name}
            </span>
            <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
              {cert.file!.size}
            </span>
            {/* View button — always shown when file exists */}
            <button
              onClick={() => setPreviewing(true)}
              className="flex items-center gap-1 rounded px-2 py-1 transition-colors"
              style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)", flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
            >
              <Eye size={11} /> View
            </button>
            {editing && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 rounded px-2 py-1 transition-colors"
                  style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted-foreground)", flexShrink: 0 }}
                  title="Replace document"
                >
                  <Edit3 size={11} /> Replace
                </button>
                <button
                  onClick={() => onChange({ ...cert, file: null })}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", flexShrink: 0 }}
                  title="Remove document"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        ) : editing ? (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors w-full justify-center"
              style={{ fontSize: 12, background: "var(--card)", border: "1px dashed var(--border)", cursor: "pointer", color: "var(--muted-foreground)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "var(--foreground)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <Upload size={13} />
              Click to upload document
            </button>
            <p className="flex items-center gap-1" style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
              <HelpCircle size={10} />
              Supported formats: {ACCEPTED_FORMATS} · Max 10 MB
            </p>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontStyle: "italic" }}>No document uploaded</span>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_ATTR}
          style={{ display: "none" }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            const objectUrl = URL.createObjectURL(f);
            onChange({ ...cert, file: { name: f.name, size: `${(f.size / 1024).toFixed(0)} KB`, objectUrl, type: f.type } });
            e.target.value = "";
          }}
        />
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { vendorId: string; onClose: () => void; isNew?: boolean; prefill?: Record<string, string>; }

export function VendorDetailPage({ vendorId, onClose, isNew = false, prefill }: Props) {
  const openActivity = useContext(ActivityContext);
  const [activeTab, setActiveTab] = useState("General");
  const [data, setData] = useState<VendorData>(() => {
    const base = isNew ? makeEmpty() : makeDefault(vendorId);
    if (!prefill) return base;
    return {
      ...base,
      ...(prefill.vendorName && { vendorName: prefill.vendorName }),
      ...(prefill.emailPrimary && { emailPrimary: prefill.emailPrimary }),
      ...(prefill.mobilePrimary && { mobilePrimary: prefill.mobilePrimary }),
      ...(prefill.address && { address: prefill.address }),
      ...(prefill.city && { city: prefill.city }),
      ...(prefill.state && { state: prefill.state }),
      ...(prefill.pincode && { pincode: prefill.pincode }),
      ...(prefill.gstin && { gstin: prefill.gstin }),
    };
  });
  const [certs, setCerts] = useState<Record<string, CertField>>(() => {
    const defaultCerts = isNew ? {
      CIN:             { label: "CIN", number: "", file: null },
      PAN:             { label: "PAN", number: "", file: null },
      MSME:            { label: "MSME / Udyam", number: "", file: null },
      IEC:             { label: "IEC (Import Export Code)", number: "", file: null },
      VAT:             { label: "VAT Registration", number: "", file: null },
      TRC:             { label: "TRC (Tax Residency Certificate)", number: "", file: null },
      NoPE:            { label: "No PE Declaration", number: "", file: null },
      Form10F:         { label: "Form 10F", number: "", file: null },
      PartnershipDeed: { label: "Partnership Deed", number: "", file: null },
      SignedAgreement: { label: "Signed Agreement", number: "", file: null },
    } : {
      CIN:             { label: "CIN", number: "U72200TN2010PTC076578", file: { name: "CIN_Certificate.pdf", size: "184 KB", type: "application/pdf" } },
      PAN:             { label: "PAN", number: "AABCT1332L",            file: { name: "PAN_Card_TechSupply.pdf", size: "96 KB", type: "application/pdf" } },
      MSME:            { label: "MSME / Udyam", number: "UDYAM-TN-12-0034521", file: { name: "Udyam_Registration.pdf", size: "210 KB", type: "application/pdf" } },
      IEC:             { label: "IEC (Import Export Code)", number: "", file: null },
      VAT:             { label: "VAT Registration", number: "", file: null },
      TRC:             { label: "TRC (Tax Residency Certificate)", number: "", file: null },
      NoPE:            { label: "No PE Declaration", number: "", file: null },
      Form10F:         { label: "Form 10F", number: "", file: null },
      PartnershipDeed: { label: "Partnership Deed", number: "", file: { name: "Partnership_Deed_Signed.pdf", size: "512 KB", type: "application/pdf" } },
      SignedAgreement: { label: "Signed Agreement", number: "AGR-2024-0089", file: { name: "Vendor_Agreement_2024.pdf", size: "340 KB", type: "application/pdf" } },
    };
    if (prefill && prefill.pan && isNew) {
      defaultCerts.PAN.number = prefill.pan;
    }
    return defaultCerts;
  });

  useEffect(() => {
    if (prefill) {
      setData(prev => ({
        ...prev,
        ...(prefill.vendorName && { vendorName: prefill.vendorName }),
        ...(prefill.emailPrimary && { emailPrimary: prefill.emailPrimary }),
        ...(prefill.mobilePrimary && { mobilePrimary: prefill.mobilePrimary }),
        ...(prefill.address && { address: prefill.address }),
        ...(prefill.city && { city: prefill.city }),
        ...(prefill.state && { state: prefill.state }),
        ...(prefill.pincode && { pincode: prefill.pincode }),
        ...(prefill.gstin && { gstin: prefill.gstin }),
      }));
      if (prefill.pan) {
        setCerts(c => ({
          ...c,
          PAN: { ...c.PAN, number: prefill.pan! }
        }));
      }
    }
  }, [prefill]);

  function handleSave(updated: VendorData) {
    setData(updated);
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Page header */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
          >
            <X size={14} />
          </button>
          {isNew ? (
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>New Vendor</h1>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5"
                style={{ fontSize: 11, fontWeight: 500, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}
              >
                Draft
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                {data.vendorName}
              </h1>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                {data.vendorId}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                style={{ fontSize: 11, fontWeight: 500, background: "var(--secondary)", color: statusColor[data.status] }}
              >
                <span className="rounded-full" style={{ width: 5, height: 5, background: statusColor[data.status], display: "inline-block" }} />
                {data.status}
              </span>
              {!isNew && (
                <div className="flex flex-col gap-1 ml-4 pl-4" style={{ borderLeft: "1px solid var(--border)", height: 28, justifyContent: "center" }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>COMPLETION</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }}>60%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 rounded-full h-1.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                      <div className="h-full rounded-full" style={{ width: "60%", background: "#fbbf24" }} />
                    </div>
                    <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>2/4 Sections</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isNew && (
            <button
              onClick={() => { alert(`Vendor "${data.vendorName || "New Vendor"}" created successfully.`); onClose(); }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2"
              style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
            >
              <Check size={13} /> Create Vendor
            </button>
          )}
          {!isNew && (
            <button
              onClick={() => openActivity({
                type: "Vendor",
                id: data.vendorId || "NEW",
                name: data.vendorName || "Vendor",
                status: data.status,
                createdBy: "Alex Johnson",
                createdDate: data.createdAt || "Jan 10, 2026"
              })}
              className="flex items-center justify-center rounded-lg transition-colors relative"
              style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--secondary)"}
              title="Open Activity Workspace"
            >
              <MessageSquare size={15} />
              <span className="absolute top-0 right-0 flex items-center justify-center rounded-full bg-red-500 text-white" style={{ width: 14, height: 14, fontSize: 9, transform: "translate(30%, -30%)" }}>2</span>
            </button>
          )}
          {/* User avatar */}
          <UserProfileMenu />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-8 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 18px", fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid var(--foreground)" : "2px solid transparent",
              marginBottom: -1, whiteSpace: "nowrap", transition: "color 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── GENERAL ─────────────────────────────────────────────────────── */}
        {activeTab === "General" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 780 }}>
            {isNew && (
              <AIVendorScanner
                onApply={(scanned: ScannedVendorData) => {
                  setData(prev => ({
                    ...prev,
                    ...(scanned.vendorName    && { vendorName:    scanned.vendorName }),
                    ...(scanned.emailPrimary  && { emailPrimary:  scanned.emailPrimary }),
                    ...(scanned.mobilePrimary && { mobilePrimary: scanned.mobilePrimary }),
                    ...(scanned.address       && { address:       scanned.address }),
                    ...(scanned.city          && { city:          scanned.city }),
                    ...(scanned.state         && { state:         scanned.state }),
                    ...(scanned.pincode       && { pincode:       scanned.pincode }),
                    ...(scanned.country       && { country:       scanned.country }),
                    ...(scanned.website       && { website:       scanned.website }),
                    ...(scanned.landline      && { landline:      scanned.landline }),
                    ...(scanned.contactPerson && { contactPerson: scanned.contactPerson }),
                    ...(scanned.gstin         && { gstin:         scanned.gstin }),
                  }));
                  if (scanned.pan) {
                    setCerts(c => ({ ...c, PAN: { ...c.PAN, number: scanned.pan! } }));
                  }
                }}
              />
            )}
            <Section title="Basic Information" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <div className="flex flex-col gap-4">
                  <Grid2>
                    <ViewField label="Vendor ID" value={data.vendorId} mono />
                    {editing
                      ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATUS</span><ESelect value={draft.status} onChange={v => setField("status", v)} options={["Active", "Hold", "Suspended", "Inactive"]} /></div>
                      : <ViewField label="Status" value={data.status} />}
                    {editing
                      ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR NAME</span><EInput value={draft.vendorName} onChange={v => setField("vendorName", v)} /></div>
                      : <ViewField label="Vendor Name" value={data.vendorName} />}
                    {editing
                      ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR TYPE</span><ESelect value={draft.vendorType} onChange={v => setField("vendorType", v)} options={["Non MSME", "MSME – Micro", "MSME – Small", "MSME – Medium", "Foreign Vendor"]} /></div>
                      : <ViewField label="Vendor Type" value={data.vendorType} />}
                    {editing
                      ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>VENDOR GROUP</span><EInput value={draft.vendorGroup} onChange={v => setField("vendorGroup", v)} /></div>
                      : <ViewField label="Vendor Group" value={data.vendorGroup} />}
                    {editing
                      ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>CONTACT PERSON</span><EInput value={draft.contactPerson} onChange={v => setField("contactPerson", v)} /></div>
                      : <ViewField label="Contact Person" value={data.contactPerson} />}
                  </Grid2>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>CHARACTERISTICS</span>
                    {editing
                      ? <ETextarea value={draft.characteristics} onChange={v => setField("characteristics", v)} />
                      : <span style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.6 }}>{data.characteristics || "—"}</span>}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Contact Details" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <Grid2>
                  {(["emailPrimary","emailSecondary","mobilePrimary","mobileSecondary","landline","website"] as (keyof VendorData)[]).map(key => {
                    const labels: Record<string, string> = { emailPrimary: "Email (Primary)", emailSecondary: "Email (Secondary)", mobilePrimary: "Mobile (Primary)", mobileSecondary: "Mobile (Secondary)", landline: "Landline", website: "Website" };
                    return editing
                      ? <div key={key} className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{labels[key].toUpperCase()}</span><EInput value={String(draft[key])} onChange={v => setField(key, v)} /></div>
                      : <ViewField key={key} label={labels[key]} value={String(data[key])} />;
                  })}
                </Grid2>
              )}
            </Section>

            <Section title="Address" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STREET ADDRESS</span>
                    {editing ? <ETextarea value={draft.address} onChange={v => setField("address", v)} /> : <span style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.6 }}>{data.address || "—"}</span>}
                  </div>
                  <Grid3>
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>CITY</span><EInput value={draft.city} onChange={v => setField("city", v)} /></div> : <ViewField label="City" value={data.city} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>STATE</span><EInput value={draft.state} onChange={v => setField("state", v)} /></div> : <ViewField label="State" value={data.state} />}
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PINCODE</span><EInput value={draft.pincode} onChange={v => setField("pincode", v)} /></div> : <ViewField label="Pincode" value={data.pincode} mono />}
                  </Grid3>
                  <div style={{ maxWidth: 260 }}>
                    {editing ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>COUNTRY</span><ESelect value={draft.country} onChange={v => setField("country", v)} options={["India", "USA", "UK", "Germany", "Singapore", "Australia", "Canada"]} /></div> : <ViewField label="Country" value={data.country} />}
                  </div>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── REGISTRATION & TAX ──────────────────────────────────────────── */}
        {activeTab === "Registration & Tax" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 780 }}>
            <Section title="Company Registration" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <Grid2>
                  {[
                    { key: "gstTreatment" as keyof VendorData, label: "GST Treatment", opts: ["GST Registered","Unregistered","Composition","Consumer","Overseas","Special Economic Zone","Deemed Export"] },
                    { key: "taxClassification" as keyof VendorData, label: "Tax Classification", opts: ["Regular","Composition","Exempt","Zero Rated"] },
                    { key: "taxPreferences" as keyof VendorData, label: "Tax Preferences", opts: ["Taxable","Exempt","Zero Rated","Out of Scope"] },
                    { key: "currency" as keyof VendorData, label: "Currency", opts: ["INR","USD","EUR","GBP","SGD","AED"] },
                  ].map(({ key, label, opts }) =>
                    editing
                      ? <div key={String(key)} className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>{label.toUpperCase()}</span><ESelect value={String(draft[key])} onChange={v => setField(key, v)} options={opts} /></div>
                      : <ViewField key={String(key)} label={label} value={String(data[key])} />
                  )}
                </Grid2>
              )}
            </Section>

            <Section title="Indirect Tax Settings" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <Grid2>
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>GSTIN</span><EInput value={draft.gstin} onChange={v => setField("gstin", v)} placeholder="e.g. 33AABCT1332L1ZC" /></div>
                    : <ViewField label="GSTIN" value={data.gstin} mono />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>SOURCE OF SUPPLY</span><ESelect value={draft.sourceOfSupply} onChange={v => setField("sourceOfSupply", v)} options={["Tamil Nadu","Maharashtra","Delhi","Karnataka","Gujarat","Telangana","West Bengal"]} /></div>
                    : <ViewField label="Source of Supply" value={data.sourceOfSupply} />}
                </Grid2>
              )}
            </Section>

            <Section title="Direct Tax Settings" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <div style={{ maxWidth: 340 }}>
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>TAN</span><EInput value={draft.tan} onChange={v => setField("tan", v)} placeholder="e.g. CHEN12345A" /></div>
                    : <ViewField label="TAN (Tax Deduction Account Number)" value={data.tan} mono />}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── BILLING ─────────────────────────────────────────────────────── */}
        {activeTab === "Billing" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 780 }}>
            <Section title="Billing Preferences" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <Grid2>
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT REFERENCE</span><EInput value={draft.accountRef} onChange={v => setField("accountRef", v)} /></div>
                    : <ViewField label="Account Reference" value={data.accountRef} mono />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PAYMENT MODE</span><ESelect value={draft.paymentMode} onChange={v => setField("paymentMode", v)} options={["NEFT","RTGS","IMPS","Cheque","DD","Cash","Credit Card"]} /></div>
                    : <ViewField label="Payment Mode" value={data.paymentMode} />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>PAYMENT TERMS</span><ESelect value={draft.paymentTerms} onChange={v => setField("paymentTerms", v)} options={["Net 7","Net 15","Net 30","Net 45","Net 60","Immediate","End of Month"]} /></div>
                    : <ViewField label="Payment Terms" value={data.paymentTerms} />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>DELIVERY TERMS</span><ESelect value={draft.deliveryTerms} onChange={v => setField("deliveryTerms", v)} options={["Ex-Works","FOB","CIF","DDP","DAP","FCA"]} /></div>
                    : <ViewField label="Delivery Terms" value={data.deliveryTerms} />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>SHIPPING METHOD</span><ESelect value={draft.shippingMethod} onChange={v => setField("shippingMethod", v)} options={["Courier","Surface","Air","Sea","Rail","Hand Delivery"]} /></div>
                    : <ViewField label="Shipping Method" value={data.shippingMethod} />}
                </Grid2>
              )}
            </Section>
          </div>
        )}

        {/* ── CERTIFICATES ────────────────────────────────────────────────── */}
        {activeTab === "Certificates" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 780 }}>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
              Click the pencil icon on any certificate to edit the number or upload/replace the document.
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {Object.entries(certs).map(([key, cert]) => (
                <CertRow
                  key={key}
                  label={cert.label}
                  cert={cert}
                  onChange={updated => setCerts(c => ({ ...c, [key]: updated }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── BANK DETAILS ────────────────────────────────────────────────── */}
        {activeTab === "Bank Details" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 780 }}>
            <Section title="Primary Bank Account" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <Grid2>
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BANK NAME</span><EInput value={draft.bankName} onChange={v => setField("bankName", v)} /></div>
                    : <ViewField label="Bank Name" value={data.bankName} />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT TYPE</span><ESelect value={draft.accountType} onChange={v => setField("accountType", v)} options={["Current","Savings","OD","CC"]} /></div>
                    : <ViewField label="Account Type" value={data.accountType} />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT HOLDER NAME</span><EInput value={draft.accountHolder} onChange={v => setField("accountHolder", v)} /></div>
                    : <ViewField label="Account Holder Name" value={data.accountHolder} />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACCOUNT NUMBER</span><EInput value={draft.accountNumber} onChange={v => setField("accountNumber", v)} /></div>
                    : <ViewField label="Account Number" value={data.accountNumber} mono />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>IFSC CODE</span><EInput value={draft.ifsc} onChange={v => setField("ifsc", v)} /></div>
                    : <ViewField label="IFSC Code" value={data.ifsc} mono />}
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>BRANCH</span><EInput value={draft.bankBranch} onChange={v => setField("bankBranch", v)} /></div>
                    : <ViewField label="Branch" value={data.bankBranch} />}
                </Grid2>
              )}
            </Section>
          </div>
        )}

        {/* ── WORKFLOW ────────────────────────────────────────────────────── */}
        {activeTab === "Workflow" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 640 }}>
            <Section title="Vendor Master Workflow" data={data} onSave={handleSave} defaultEditing={isNew}>
              {(editing, draft, setField) => (
                <div className="flex flex-col gap-4">
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                    Assign an approval workflow for this vendor. The selected workflow will be triggered when this vendor record is submitted for review or update.
                  </p>
                  {editing
                    ? <div className="flex flex-col gap-1"><span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>ACTIVE WORKFLOW</span><ESelect value={draft.selectedWorkflow} onChange={v => setField("selectedWorkflow", v)} options={["Standard Approval Flow","Two-Level Approval","Finance Controller Review","Director Sign-off","Auto Approve (Trusted Vendor)"]} /></div>
                    : <ViewField label="Active Workflow" value={data.selectedWorkflow} />}

                  <div className="rounded-lg p-4 flex flex-col gap-2" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{data.selectedWorkflow}</p>
                    {data.selectedWorkflow === "Standard Approval Flow" && (
                      <ol className="flex flex-col gap-1.5 mt-1" style={{ paddingLeft: 16, margin: 0 }}>
                        {["Vendor Manager Review", "Finance Team Approval", "Procurement Head Sign-off"].map((step, i) => (
                          <li key={i} style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                            <span style={{ fontWeight: 600, color: "var(--foreground)" }}>Step {i + 1}:</span> {step}
                          </li>
                        ))}
                      </ol>
                    )}
                    {data.selectedWorkflow === "Two-Level Approval" && (
                      <ol className="flex flex-col gap-1.5 mt-1" style={{ paddingLeft: 16, margin: 0 }}>
                        {["Department Head Review", "CFO Approval"].map((step, i) => (
                          <li key={i} style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                            <span style={{ fontWeight: 600, color: "var(--foreground)" }}>Step {i + 1}:</span> {step}
                          </li>
                        ))}
                      </ol>
                    )}
                    {data.selectedWorkflow === "Auto Approve (Trusted Vendor)" && (
                      <p style={{ fontSize: 12, color: "#4ade80" }}>✓ This workflow auto-approves without manual review steps.</p>
                    )}
                    {["Finance Controller Review", "Director Sign-off"].includes(data.selectedWorkflow) && (
                      <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Single-step approval by the assigned reviewer.</p>
                    )}
                  </div>
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
