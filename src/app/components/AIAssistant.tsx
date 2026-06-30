import { useState, useRef, useEffect, useContext } from "react";
import { PanelContext } from "../contexts";
import { Sparkles, X, Send, ArrowRight, CheckCircle, AlertCircle, Edit3, ChevronDown, ChevronUp, Mic, MicOff } from "lucide-react";

// Inject pulse keyframe once
if (typeof document !== "undefined" && !document.getElementById("__mic_pulse_style")) {
  const s = document.createElement("style");
  s.id = "__mic_pulse_style";
  s.textContent = `
    @keyframes micPulse {
      0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
      60%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
      100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
    }
    @keyframes micRing {
      0%   { transform: scale(1);   opacity: 1; }
      50%  { transform: scale(1.15); opacity: 0.7; }
      100% { transform: scale(1);   opacity: 1; }
    }
    .mic-listening {
      animation: micPulse 1.2s ease-in-out infinite, micRing 1.2s ease-in-out infinite;
      background: #ef4444 !important;
      color: #fff !important;
    }
    .mic-transcript-bar {
      animation: fadeSlideIn 0.2s ease;
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
}

type NavFn = (page: string, highlightId?: string, mode?: string) => void;

interface Message {
  role: "ai" | "user" | "context";
  text: string;
  reviewCard?: ExtractedDataModel;
}

interface TimelineItem {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
}

// ─── Semantic Extraction Types ───────────────────────────────────────────────

type ConfidenceLevel = "high" | "medium" | "low";

interface ExtractedField {
  value: string;
  confidence: ConfidenceLevel;
  source: "explicit" | "inferred" | "default";
  needsConfirmation?: boolean;
}

interface LineItem {
  name: string;
  description: string;
  qty: number;
  rate: number;
  confidence: ConfidenceLevel;
}

interface ExtractedDataModel {
  intent: string;
  // Common
  vendorName?: ExtractedField;
  org?: ExtractedField;
  // PO fields
  poTitle?: ExtractedField;
  department?: ExtractedField;
  costCenter?: ExtractedField;
  projectName?: ExtractedField;
  paymentTerms?: ExtractedField;
  amount?: ExtractedField;
  description?: ExtractedField;
  startDate?: ExtractedField;
  endDate?: ExtractedField;
  lineItems?: LineItem[];
  // Vendor fields
  emailPrimary?: ExtractedField;
  mobilePrimary?: ExtractedField;
  address?: ExtractedField;
  city?: ExtractedField;
  state?: ExtractedField;
  pincode?: ExtractedField;
  gstin?: ExtractedField;
  pan?: ExtractedField;
  contactPerson?: ExtractedField;
  // Invoice / Bill fields
  invoiceNumber?: ExtractedField;
  invoiceDate?: ExtractedField;
  dueDate?: ExtractedField;
  poReference?: ExtractedField;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const KNOWN_VENDORS = [
  "TechSupply Co", "OfficeMax Pro", "CloudNet Solutions", "Green Facilities",
  "SafeLogistics", "DataVault Inc", "SwiftCargo", "PrintHouse Ltd",
  "MediaBridge", "FoodFirst Corp",
];

const KNOWN_ORGS = ["Acme Corp", "Globex Ltd", "Initech Inc"];

const DEPARTMENTS = [
  "Engineering", "Marketing", "Sales", "Finance", "HR", "Operations",
  "IT", "Legal", "Procurement", "Design", "Product", "Customer Success",
];

const PAYMENT_TERMS_PATTERNS: Record<string, string> = {
  "net 30": "Net 30",
  "net 60": "Net 60",
  "net 90": "Net 90",
  "net30": "Net 30",
  "net60": "Net 60",
  "net90": "Net 90",
  "immediate": "Immediate",
  "advance": "Advance Payment",
  "milestone": "Milestone-based",
};

const SERVICE_KEYWORDS: Record<string, string> = {
  "ui": "UI/UX Design Services",
  "ux": "UI/UX Design Services",
  "design": "UI/UX Design Services",
  "frontend": "Front-End Development Services",
  "front-end": "Front-End Development Services",
  "front end": "Front-End Development Services",
  "backend": "Back-End Development Services",
  "back-end": "Back-End Development Services",
  "back end": "Back-End Development Services",
  "fullstack": "Full-Stack Development Services",
  "full stack": "Full-Stack Development Services",
  "testing": "Quality Assurance & Testing Services",
  "qa": "Quality Assurance & Testing Services",
  "accessibility": "Accessibility Testing Services",
  "cloud": "Cloud Infrastructure Services",
  "devops": "DevOps & CI/CD Services",
  "api": "API Development & Integration Services",
  "mobile": "Mobile Application Development Services",
  "consulting": "Business Consulting Services",
  "support": "Technical Support Services",
  "maintenance": "Software Maintenance Services",
  "security": "Cybersecurity Services",
  "data": "Data Analytics Services",
  "analytics": "Data Analytics Services",
  "marketing": "Digital Marketing Services",
  "seo": "SEO & Content Services",
  "training": "Training & Enablement Services",
  "implementation": "Implementation Services",
  "integration": "Systems Integration Services",
  "migration": "Data Migration Services",
  "branding": "Brand Identity & Design Services",
  "photography": "Photography & Media Services",
  "video": "Video Production Services",
  "audit": "Compliance & Audit Services",
  "legal": "Legal & Compliance Services",
  "hr": "HR & Staffing Services",
  "recruitment": "Recruitment Services",
};

// ─── Semantic Extraction Engine ───────────────────────────────────────────────

function extractSemanticFields(text: string, intent: string): ExtractedDataModel {
  const model: ExtractedDataModel = { intent };
  const lower = text.toLowerCase();

  // ── Vendor Name ──
  let vendorFound = false;
  for (const v of KNOWN_VENDORS) {
    if (lower.includes(v.toLowerCase()) || lower.includes(v.split(" ")[0].toLowerCase())) {
      model.vendorName = { value: v, confidence: "high", source: "inferred" };
      vendorFound = true;
      break;
    }
  }
  if (!vendorFound) {
    const vendorMatch = text.match(/(?:vendor|from|by|supplier)[:\s]+([A-Z][a-zA-Z\s&.]+?)(?:\s*,|\s*;|\s+for|\s+amount|\s+worth|\s+of|\s*$)/i);
    if (vendorMatch) {
      const val = vendorMatch[1].trim();
      if (val.length > 2 && val.split(" ").length <= 4) {
        model.vendorName = { value: val, confidence: "medium", source: "explicit" };
      }
    }
    if (!model.vendorName) {
      model.vendorName = { value: "", confidence: "low", source: "default", needsConfirmation: true };
    }
  }

  // ── Organization ──
  for (const o of KNOWN_ORGS) {
    if (lower.includes(o.toLowerCase()) || lower.includes(o.split(" ")[0].toLowerCase())) {
      model.org = { value: o, confidence: "high", source: "inferred" };
      break;
    }
  }
  if (!model.org) {
    const orgMatch = text.match(/(?:org|organization|company|entity)[:\s]+([A-Z][a-zA-Z\s&.]+?)(?:\s*,|\s*;|\s*$)/i);
    if (orgMatch) {
      const val = orgMatch[1].trim();
      if (val.length > 2) {
        model.org = { value: val, confidence: "medium", source: "explicit" };
      }
    }
    if (!model.org) {
      model.org = { value: "Acme Corp", confidence: "low", source: "default", needsConfirmation: true };
    }
  }

  // ── Amount ──
  const amtPatterns = [
    /(?:amount|total|worth|value|budget|cost|price|for)\s*(?:is|of|:)?\s*(?:₹|Rs\.?|\$|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:₹|\$|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\b([\d]{5,}(?:,\d{3})*(?:\.\d{1,2})?)\b/,
  ];
  for (const p of amtPatterns) {
    const m = text.match(p);
    if (m) {
      const rawVal = m[1].replace(/,/g, "");
      if (!isNaN(parseFloat(rawVal))) {
        const confidence: ConfidenceLevel = p.source.includes("amount|total") ? "high" : "medium";
        model.amount = { value: rawVal, confidence, source: "inferred" };
        break;
      }
    }
  }
  if (!model.amount) {
    model.amount = { value: "", confidence: "low", source: "default", needsConfirmation: true };
  }

  // ── Dates ──
  const datePattern = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:[,\s]+\d{4})?\b/gi;
  const allDates: string[] = [];
  let dm: RegExpExecArray | null;
  while ((dm = datePattern.exec(text)) !== null) {
    allDates.push(dm[0].replace(/(\d+)(st|nd|rd|th)/, "$1").trim());
  }

  // Also match DD/MM/YYYY or YYYY-MM-DD
  const numDatePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/g;
  while ((dm = numDatePattern.exec(text)) !== null) {
    allDates.push(dm[0]);
  }

  if (allDates.length >= 2) {
    model.startDate = { value: allDates[0], confidence: "medium", source: "inferred" };
    model.endDate = { value: allDates[1], confidence: "medium", source: "inferred" };
  } else if (allDates.length === 1) {
    if (intent === "create_invoice") {
      model.invoiceDate = { value: allDates[0], confidence: "medium", source: "inferred" };
    } else {
      model.startDate = { value: allDates[0], confidence: "medium", source: "inferred" };
    }
  }

  // ── Department ──
  for (const dept of DEPARTMENTS) {
    if (lower.includes(dept.toLowerCase())) {
      model.department = { value: dept, confidence: "high", source: "inferred" };
      break;
    }
  }
  if (!model.department) {
    const deptMatch = text.match(/(?:dept|department|team|division)[:\s]+([A-Za-z\s]+?)(?:\s*,|\s*;|\s+and|\s*$)/i);
    if (deptMatch) {
      model.department = { value: deptMatch[1].trim(), confidence: "medium", source: "explicit" };
    }
  }

  // ── Cost Center ──
  const ccMatch = text.match(/(?:cost\s*center|cc|cost\s*code)[:\s]+([A-Z0-9\-]+)/i);
  if (ccMatch) {
    model.costCenter = { value: ccMatch[1].trim(), confidence: "high", source: "explicit" };
  }

  // ── Project Name ──
  const projMatch = text.match(/(?:project|initiative|program)[:\s]+([A-Za-z0-9\s\-_]+?)(?:\s*,|\s*;|\s+for|\s+dept|\s*$)/i);
  if (projMatch) {
    const val = projMatch[1].trim();
    if (val.length > 2 && val.length < 60) {
      model.projectName = { value: val, confidence: "high", source: "explicit" };
    }
  }

  // ── Payment Terms ──
  for (const [pattern, label] of Object.entries(PAYMENT_TERMS_PATTERNS)) {
    if (lower.includes(pattern)) {
      model.paymentTerms = { value: label, confidence: "high", source: "inferred" };
      break;
    }
  }

  // ── PO Title ── (derive, NEVER use full text)
  if (intent === "create_po") {
    const titleParts: string[] = [];
    if (model.department?.value) titleParts.push(model.department.value);
    if (model.projectName?.value) titleParts.push(model.projectName.value);

    // Check if service type can be inferred
    let serviceName = "";
    for (const [kw, label] of Object.entries(SERVICE_KEYWORDS)) {
      if (lower.includes(kw)) {
        serviceName = label.replace(" Services", "");
        break;
      }
    }
    if (serviceName) titleParts.push(serviceName);

    if (titleParts.length > 0) {
      model.poTitle = {
        value: titleParts.join(" – ") + " PO",
        confidence: "medium",
        source: "inferred",
      };
    } else if (model.vendorName?.value) {
      model.poTitle = {
        value: `Services PO – ${model.vendorName.value}`,
        confidence: "medium",
        source: "inferred",
      };
    } else {
      model.poTitle = { value: "", confidence: "low", source: "default", needsConfirmation: true };
    }

    // ── Line Items ── (concise service-based)
    model.lineItems = generateLineItems(text, lower, model.amount?.value || "");
  }

  // ── Description ── (short, not full text)
  if (intent === "create_po" || intent === "create_invoice") {
    const descMatch = text.match(/(?:for|description|desc|regarding|purpose)[:\s]+([^,;.\n]+)/i);
    if (descMatch) {
      const candidate = descMatch[1].trim();
      if (candidate.length > 3 && candidate.length < 120) {
        model.description = { value: candidate, confidence: "medium", source: "explicit" };
      }
    }
    if (!model.description) {
      // Derive from service inference
      let svcDesc = "";
      for (const [kw, label] of Object.entries(SERVICE_KEYWORDS)) {
        if (lower.includes(kw)) { svcDesc = label; break; }
      }
      if (svcDesc) {
        model.description = { value: svcDesc, confidence: "medium", source: "inferred" };
      }
    }
  }

  // ── Vendor-specific fields ──
  if (intent === "create_vendor") {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      model.emailPrimary = { value: emailMatch[0], confidence: "high", source: "explicit" };
    }

    const phoneMatch = text.match(/(?:\+91|0)?[6-9]\d{9}/);
    if (phoneMatch) {
      model.mobilePrimary = { value: phoneMatch[0], confidence: "high", source: "explicit" };
    }

    const gstinMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}\b/);
    if (gstinMatch) {
      model.gstin = { value: gstinMatch[0], confidence: "high", source: "explicit" };
    } else {
      model.gstin = { value: "", confidence: "low", source: "default", needsConfirmation: true };
    }

    const panMatch = text.match(/\b[A-Z]{5}\d{4}[A-Z]{1}\b/);
    if (panMatch) {
      model.pan = { value: panMatch[0], confidence: "high", source: "explicit" };
    }

    const cityMatch = text.match(/(?:city|location)[:\s]+([A-Za-z\s]+?)(?:\s*,|\s*;|\s*$)/i);
    if (cityMatch) {
      model.city = { value: cityMatch[1].trim(), confidence: "high", source: "explicit" };
    }

    const contactMatch = text.match(/(?:contact|person|representative|poc|spoc)[:\s]+([A-Z][a-zA-Z\s]+?)(?:\s*,|\s*;|\s*$)/i);
    if (contactMatch) {
      model.contactPerson = { value: contactMatch[1].trim(), confidence: "medium", source: "explicit" };
    }
  }

  // ── Invoice-specific fields ──
  if (intent === "create_invoice") {
    const invNumMatch = text.match(/(?:INV|BILL|invoice\s*#?|bill\s*#?)[:\s\-]*([\w\-]+)/i) ||
      text.match(/\b(INV-\d{4}-\d{3}|\w{3}-\d{4}-\d{3})\b/i);
    if (invNumMatch) {
      model.invoiceNumber = { value: invNumMatch[1].toUpperCase(), confidence: "high", source: "explicit" };
    } else {
      model.invoiceNumber = { value: "", confidence: "low", source: "default", needsConfirmation: true };
    }

    const poRefMatch = text.match(/PO-\d{4}-\d{3}/i);
    if (poRefMatch) {
      model.poReference = { value: poRefMatch[0].toUpperCase(), confidence: "high", source: "explicit" };
    }

    if (!model.invoiceDate) {
      model.invoiceDate = { value: "", confidence: "low", source: "default", needsConfirmation: true };
    }
  }

  return model;
}

function generateLineItems(text: string, lower: string, totalAmount: string): LineItem[] {
  const items: LineItem[] = [];
  const detectedServices: string[] = [];

  // Detect services from keywords
  for (const [kw, label] of Object.entries(SERVICE_KEYWORDS)) {
    if (lower.includes(kw) && !detectedServices.includes(label)) {
      detectedServices.push(label);
    }
  }

  // Look for explicit line item patterns like "X service for Y amount"
  const linePattern = /([A-Z][a-zA-Z\s\/]+?)\s+(?:services?|work|deliverable)?\s*(?:at|for|worth|@)?\s*(?:₹|\$|Rs\.?)?\s*([\d,]+)/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linePattern.exec(text)) !== null) {
    const name = lm[1].trim();
    const amt = lm[2].replace(/,/g, "");
    if (name.split(" ").length <= 5 && !isNaN(parseFloat(amt))) {
      // Check if this matches a service keyword
      const matchedService = Object.entries(SERVICE_KEYWORDS).find(([kw]) =>
        name.toLowerCase().includes(kw)
      );
      items.push({
        name: matchedService ? matchedService[1] : name + " Services",
        description: matchedService ? matchedService[1] : name,
        qty: 1,
        rate: parseFloat(amt),
        confidence: "medium",
      });
    }
  }

  // If no explicit items found, use detected services
  if (items.length === 0 && detectedServices.length > 0) {
    const total = parseFloat(totalAmount) || 0;
    const perItem = detectedServices.length > 1 ? Math.round(total / detectedServices.length) : total;

    for (let i = 0; i < Math.min(detectedServices.length, 4); i++) {
      items.push({
        name: detectedServices[i],
        description: detectedServices[i],
        qty: 1,
        rate: perItem || 0,
        confidence: detectedServices.length === 1 ? "high" : "medium",
      });
    }
  }

  // If still nothing, create a generic item
  if (items.length === 0) {
    const total = parseFloat(totalAmount) || 0;
    items.push({
      name: "Professional Services",
      description: "Professional Services",
      qty: 1,
      rate: total,
      confidence: "low",
    });
  }

  return items;
}

// ─── Validation ──────────────────────────────────────────────────────────────

interface ValidationResult {
  missingFields: string[];
  lowConfidenceFields: string[];
}

function validateModel(model: ExtractedDataModel): ValidationResult {
  const missing: string[] = [];
  const lowConfidence: string[] = [];

  const checkField = (field: ExtractedField | undefined, key: string, required: boolean) => {
    if (!field || !field.value) {
      if (required) missing.push(key);
    } else if (field.confidence === "low" || field.needsConfirmation) {
      lowConfidence.push(key);
    }
  };

  if (model.intent === "create_po") {
    checkField(model.vendorName, "vendorName", true);
    checkField(model.org, "org", true);
    checkField(model.amount, "amount", true);
    checkField(model.poTitle, "poTitle", false);
  } else if (model.intent === "create_vendor") {
    checkField(model.vendorName, "vendorName", true);
    checkField(model.emailPrimary, "emailPrimary", true);
    checkField(model.gstin, "gstin", true);
  } else if (model.intent === "create_invoice") {
    checkField(model.vendorName, "vendorName", true);
    checkField(model.invoiceNumber, "invoiceNumber", true);
    checkField(model.amount, "amount", true);
    checkField(model.invoiceDate, "invoiceDate", true);
  }

  return { missingFields: missing, lowConfidenceFields: lowConfidence };
}

// ─── Field Label Map ──────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  vendorName: "Vendor Name",
  org: "Organization",
  amount: "Amount",
  poTitle: "PO Title",
  department: "Department",
  costCenter: "Cost Center",
  projectName: "Project Name",
  paymentTerms: "Payment Terms",
  startDate: "Start Date",
  endDate: "End Date",
  description: "Description",
  emailPrimary: "Primary Email",
  mobilePrimary: "Mobile",
  gstin: "GSTIN",
  pan: "PAN",
  city: "City",
  contactPerson: "Contact Person",
  invoiceNumber: "Invoice Number",
  invoiceDate: "Invoice Date",
  dueDate: "Due Date",
  poReference: "PO Reference",
};

// ─── Flat fields for form population ─────────────────────────────────────────

function flattenModel(model: ExtractedDataModel): Record<string, string> {
  const flat: Record<string, string> = {};
  const skip = new Set(["intent", "lineItems"]);

  for (const [key, val] of Object.entries(model)) {
    if (skip.has(key)) continue;
    if (val && typeof val === "object" && "value" in val) {
      flat[key] = (val as ExtractedField).value;
    }
  }

  // Vendor alias
  if (flat.vendorName) flat.vendor = flat.vendorName;

  // Line items as JSON
  if (model.lineItems) {
    flat._lineItems = JSON.stringify(model.lineItems.map(li => ({
      name: li.name,
      description: li.description,
      qty: li.qty,
      rate: li.rate,
    })));
  }

  return flat;
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: "#4ade80",
  medium: "#facc15",
  low: "#f87171",
};

const CONFIDENCE_BG: Record<ConfidenceLevel, string> = {
  high: "rgba(74,222,128,0.08)",
  medium: "rgba(250,204,21,0.08)",
  low: "rgba(248,113,113,0.12)",
};

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "1px 5px",
        borderRadius: 4,
        background: CONFIDENCE_BG[level],
        color: CONFIDENCE_COLORS[level],
        border: `1px solid ${CONFIDENCE_COLORS[level]}30`,
        letterSpacing: 0.5,
        textTransform: "uppercase",
      }}
    >
      {level}
    </span>
  );
}

interface ReviewCardProps {
  model: ExtractedDataModel;
  onConfirm: (model: ExtractedDataModel) => void;
  onEdit: (key: string, value: string) => void;
  onCancel: () => void;
}

function ReviewCard({ model, onConfirm, onEdit, onCancel }: ReviewCardProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [localModel, setLocalModel] = useState<ExtractedDataModel>(model);
  const [showLineItems, setShowLineItems] = useState(false);

  const validation = validateModel(localModel);
  const canConfirm = validation.missingFields.length === 0;

  function handleEditSave(key: string) {
    const updated = { ...localModel, [key]: { ...(localModel[key as keyof ExtractedDataModel] as ExtractedField), value: editValue, confidence: "high" as ConfidenceLevel, needsConfirmation: false } };
    setLocalModel(updated);
    onEdit(key, editValue);
    setEditingKey(null);
  }

  const displayFields: (keyof ExtractedDataModel)[] = (() => {
    if (model.intent === "create_po") return ["vendorName", "org", "poTitle", "department", "costCenter", "projectName", "amount", "paymentTerms", "startDate", "endDate", "description"];
    if (model.intent === "create_vendor") return ["vendorName", "emailPrimary", "mobilePrimary", "gstin", "pan", "city", "contactPerson"];
    if (model.intent === "create_invoice") return ["vendorName", "invoiceNumber", "invoiceDate", "dueDate", "amount", "poReference", "description"];
    return [];
  })();

  return (
    <div
      style={{
        background: "var(--secondary)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "12px",
        fontSize: 12,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={13} style={{ color: "#6b8cff", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 12, color: "var(--foreground)" }}>
          Extracted Data — Review Before Populating
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {displayFields.map((key) => {
          const field = localModel[key] as ExtractedField | undefined;
          if (!field) return null;
          const label = FIELD_LABELS[key as string] || String(key);
          const isEmpty = !field.value;
          const isEditing = editingKey === key;
          const isLow = field.confidence === "low" || field.needsConfirmation || isEmpty;

          return (
            <div
              key={String(key)}
              style={{
                background: isLow ? CONFIDENCE_BG.low : "var(--card)",
                borderRadius: 8,
                padding: "6px 8px",
                border: `1px solid ${isLow ? "#f8717140" : "var(--border)"}`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {isEmpty && <AlertCircle size={10} style={{ color: "#f87171", flexShrink: 0 }} />}
                  <span style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                    {label}
                  </span>
                  {!isEmpty && <ConfidenceBadge level={field.confidence} />}
                </div>
                <button
                  onClick={() => { setEditingKey(String(key)); setEditValue(field.value || ""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2, flexShrink: 0 }}
                >
                  <Edit3 size={10} />
                </button>
              </div>

              {isEditing ? (
                <div className="flex gap-1 mt-1">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(String(key)); if (e.key === "Escape") setEditingKey(null); }}
                    style={{
                      flex: 1,
                      background: "var(--background)",
                      border: "1px solid #6b8cff",
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontSize: 11,
                      color: "var(--foreground)",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => handleEditSave(String(key))}
                    style={{ background: "#6b8cff", border: "none", borderRadius: 4, padding: "2px 6px", color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 2, color: isEmpty ? "#f87171" : "var(--foreground)", fontWeight: isEmpty ? 500 : 400, fontSize: 11 }}>
                  {isEmpty ? "⚠ Required — click ✎ to enter" : field.value}
                </div>
              )}

              {isLow && !isEmpty && (
                <div style={{ color: "#f87171", fontSize: 9, marginTop: 2 }}>
                  Low confidence — please verify this value
                </div>
              )}
            </div>
          );
        })}

        {/* Line Items for PO */}
        {model.intent === "create_po" && localModel.lineItems && localModel.lineItems.length > 0 && (
          <div
            style={{
              background: "var(--card)",
              borderRadius: 8,
              padding: "6px 8px",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setShowLineItems(v => !v)}
              className="flex items-center justify-between w-full"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}>PO LINE ITEMS</span>
                <span style={{ fontSize: 9, background: "#6b8cff20", color: "#6b8cff", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                  {localModel.lineItems.length}
                </span>
              </div>
              {showLineItems ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showLineItems && (
              <div className="flex flex-col gap-1 mt-2">
                {localModel.lineItems.map((li, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
                    <ConfidenceBadge level={li.confidence} />
                    <span style={{ flex: 1, color: "var(--foreground)", fontWeight: 500 }}>{li.name}</span>
                    {li.rate > 0 && (
                      <span style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>
                        ₹{li.rate.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation warnings */}
      {validation.missingFields.length > 0 && (
        <div style={{ marginTop: 8, padding: "6px 8px", background: "rgba(248,113,113,0.08)", borderRadius: 8, border: "1px solid #f8717140" }}>
          <div style={{ fontSize: 10, color: "#f87171", fontWeight: 600 }}>
            ⚠ Required fields missing: {validation.missingFields.map(f => FIELD_LABELS[f] || f).join(", ")}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>
            Click the ✎ icon next to each field to enter a value.
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => canConfirm && onConfirm(localModel)}
          style={{
            flex: 1,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: canConfirm ? "pointer" : "not-allowed",
            background: canConfirm ? "var(--foreground)" : "var(--secondary)",
            color: canConfirm ? "var(--background)" : "var(--muted-foreground)",
            border: "none",
            opacity: canConfirm ? 1 : 0.6,
          }}
        >
          ✓ Confirm & Populate Form
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: "none",
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Intent Classification ────────────────────────────────────────────────────

// Top-level intent categories
type IntentCategory = "create_record" | "update_record" | "search_record" | "status_lookup" | "approval_action" | "general_question";

// Sub-intents for form routing
type IntentType =
  | "create_po" | "create_vendor" | "create_invoice"
  | "update_po" | "update_vendor" | "update_invoice"
  | "search_po" | "search_vendor" | "search_invoice" | "search_any"
  | "status_po" | "status_invoice" | "status_vendor"
  | "approve_po" | "approve_invoice" | "reject_po" | "reject_invoice"
  | "general_question";

interface IntentResult {
  type: IntentType;
  category: IntentCategory;
}

function classifyIntent(text: string): IntentResult | null {
  const lower = text.toLowerCase();

  // ── Create Record ──
  if ((lower.includes("raise") || lower.includes("create") || lower.includes("new") || lower.includes("add")) &&
    (lower.includes("po") || lower.includes("purchase order"))) {
    return { type: "create_po", category: "create_record" };
  }
  if ((lower.includes("create") || lower.includes("add") || lower.includes("new") || lower.includes("onboard")) &&
    lower.includes("vendor")) {
    return { type: "create_vendor", category: "create_record" };
  }
  if ((lower.includes("create") || lower.includes("add") || lower.includes("new") || lower.includes("raise") || lower.includes("submit")) &&
    (lower.includes("invoice") || lower.includes("bill"))) {
    return { type: "create_invoice", category: "create_record" };
  }

  // ── Update Record ──
  if ((lower.includes("update") || lower.includes("edit") || lower.includes("modify") || lower.includes("change")) &&
    (lower.includes("po") || lower.includes("purchase order"))) {
    return { type: "update_po", category: "update_record" };
  }
  if ((lower.includes("update") || lower.includes("edit") || lower.includes("modify")) && lower.includes("vendor")) {
    return { type: "update_vendor", category: "update_record" };
  }
  if ((lower.includes("update") || lower.includes("edit") || lower.includes("modify")) &&
    (lower.includes("invoice") || lower.includes("bill"))) {
    return { type: "update_invoice", category: "update_record" };
  }

  // ── Approval Action ──
  if ((lower.includes("approve") || lower.includes("approval")) &&
    (lower.includes("po") || lower.includes("purchase order"))) {
    return { type: "approve_po", category: "approval_action" };
  }
  if ((lower.includes("reject") || lower.includes("decline")) &&
    (lower.includes("po") || lower.includes("purchase order"))) {
    return { type: "reject_po", category: "approval_action" };
  }
  if ((lower.includes("approve") || lower.includes("approval")) &&
    (lower.includes("invoice") || lower.includes("bill"))) {
    return { type: "approve_invoice", category: "approval_action" };
  }
  if ((lower.includes("reject") || lower.includes("decline")) &&
    (lower.includes("invoice") || lower.includes("bill"))) {
    return { type: "reject_invoice", category: "approval_action" };
  }

  // ── Status Lookup ──
  if ((lower.includes("status") || lower.includes("check") || lower.includes("track") || lower.includes("where is") || lower.includes("what is")) &&
    (lower.includes("po") || lower.includes("purchase order"))) {
    return { type: "status_po", category: "status_lookup" };
  }
  if ((lower.includes("status") || lower.includes("check") || lower.includes("track")) &&
    (lower.includes("invoice") || lower.includes("bill"))) {
    return { type: "status_invoice", category: "status_lookup" };
  }
  if ((lower.includes("status") || lower.includes("check")) && lower.includes("vendor")) {
    return { type: "status_vendor", category: "status_lookup" };
  }

  // ── Search Record ──
  if ((lower.includes("find") || lower.includes("search") || lower.includes("lookup") || lower.includes("show me") || lower.includes("list") || lower.includes("get")) &&
    (lower.includes("po") || lower.includes("purchase order"))) {
    return { type: "search_po", category: "search_record" };
  }
  if ((lower.includes("find") || lower.includes("search") || lower.includes("lookup") || lower.includes("show me") || lower.includes("list") || lower.includes("get")) &&
    lower.includes("vendor")) {
    return { type: "search_vendor", category: "search_record" };
  }
  if ((lower.includes("find") || lower.includes("search") || lower.includes("lookup") || lower.includes("show me") || lower.includes("list") || lower.includes("get")) &&
    (lower.includes("invoice") || lower.includes("bill"))) {
    return { type: "search_invoice", category: "search_record" };
  }
  if (lower.includes("search") || lower.includes("find") || lower.includes("lookup")) {
    return { type: "search_any", category: "search_record" };
  }

  // ── General Question ──
  if (lower.includes("what") || lower.includes("how") || lower.includes("why") || lower.includes("when") ||
    lower.includes("who") || lower.includes("help") || lower.includes("explain") || lower.includes("tell me")) {
    return { type: "general_question", category: "general_question" };
  }

  return null;
}

function getCategoryLabel(category: IntentCategory): string {
  const map: Record<IntentCategory, string> = {
    create_record:    "Create Record",
    update_record:    "Update Record",
    search_record:    "Search Record",
    status_lookup:    "Status Lookup",
    approval_action:  "Approval Action",
    general_question: "General Question",
  };
  return map[category] || "Copilot";
}

function getCategoryIcon(category: IntentCategory): string {
  const map: Record<IntentCategory, string> = {
    create_record:    "➕",
    update_record:    "✏️",
    search_record:    "🔍",
    status_lookup:    "📊",
    approval_action:  "✅",
    general_question: "💬",
  };
  return map[category] || "⚡";
}

function getCategoryColor(category: IntentCategory): string {
  const map: Record<IntentCategory, string> = {
    create_record:    "#6b8cff",
    update_record:    "#facc15",
    search_record:    "#34d399",
    status_lookup:    "#a78bfa",
    approval_action:  "#4ade80",
    general_question: "#94a3b8",
  };
  return map[category] || "#6b8cff";
}

function getIntentLabel(intent: IntentType): string {
  const labels: Record<IntentType, string> = {
    create_po:       "Create Purchase Order",
    create_vendor:   "Create Vendor Record",
    create_invoice:  "Create Invoice / Bill",
    update_po:       "Update Purchase Order",
    update_vendor:   "Update Vendor Record",
    update_invoice:  "Update Invoice / Bill",
    search_po:       "Search Purchase Orders",
    search_vendor:   "Search Vendors",
    search_invoice:  "Search Invoices",
    search_any:      "Search Records",
    status_po:       "PO Status Lookup",
    status_invoice:  "Invoice Status Lookup",
    status_vendor:   "Vendor Status Lookup",
    approve_po:      "Approve Purchase Order",
    approve_invoice: "Approve Invoice",
    reject_po:       "Reject Purchase Order",
    reject_invoice:  "Reject Invoice",
    general_question:"General Question",
  };
  return labels[intent] || "AI Copilot";
}

function buildTimeline(category: IntentCategory, isUpdate: boolean): TimelineItem[] {
  switch (category) {
    case "create_record":
      return [
        { id: "extract",    label: "Extracting Fields",         status: "running" },
        { id: "review",     label: "Review & Confirmation",     status: "pending" },
        { id: "navigation", label: "Opening Screen",            status: "pending" },
        { id: "population", label: "Populating Fields",         status: "pending" },
        { id: "submission", label: "Saving Record",             status: "pending" },
      ];
    case "update_record":
      return [
        { id: "extract",    label: "Extracting Fields",         status: "running" },
        { id: "review",     label: "Review & Confirmation",     status: "pending" },
        { id: "navigation", label: "Opening Record",            status: "pending" },
        { id: "population", label: "Populating Changes",        status: "pending" },
        { id: "submission", label: "Saving Changes",            status: "pending" },
      ];
    case "search_record":
      return [
        { id: "searching",  label: "Searching Records",         status: "running" },
        { id: "fetching",   label: "Fetching Details",          status: "pending" },
        { id: "results",    label: "Results Retrieved",         status: "pending" },
      ];
    case "status_lookup":
      return [
        { id: "looking_up", label: "Looking Up Record",         status: "running" },
        { id: "fetching",   label: "Fetching Status",           status: "pending" },
        { id: "results",    label: "Status Retrieved",          status: "pending" },
      ];
    case "approval_action":
      return [
        { id: "finding",    label: "Finding Record",            status: "running" },
        { id: "authority",  label: "Checking Authority",        status: "pending" },
        { id: "applying",   label: "Applying Action",           status: "pending" },
      ];
    case "general_question":
      return [
        { id: "processing", label: "Processing Question",       status: "running" },
        { id: "answering",  label: "Generating Answer",         status: "pending" },
      ];
    default:
      return [];
  }
}

function getModuleName(intent: IntentType): string {
  if (intent.includes("po")) return "Purchase Order";
  if (intent.includes("vendor")) return "Vendor";
  if (intent.includes("invoice")) return "Bill";
  return "Overview";
}

function generateRecordId(intent: IntentType): string {
  const rand = Math.floor(Math.random() * 900) + 100;
  if (intent === "create_po") return `PO-2026-${rand}`;
  if (intent === "create_vendor") return `VND-${rand}`;
  if (intent === "create_invoice") return `INV-2026-${rand}`;
  return `REC-${rand}`;
}

function intentLabel(intent: IntentType): string {
  if (intent === "create_po") return "Purchase Order";
  if (intent === "create_vendor") return "Vendor";
  if (intent === "create_invoice") return "Invoice";
  return "Record";
}

// ─── Result Card Components ───────────────────────────────────────────────────

const MOCK_STATUSES: Record<string, { status: string; color: string; bg: string; steps: { label: string; done: boolean }[] }> = {
  po: {
    status: "Pending Approval",
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    steps: [
      { label: "Draft", done: true },
      { label: "Submitted", done: true },
      { label: "Pending Approval", done: false },
      { label: "Approved", done: false },
      { label: "PO Issued", done: false },
    ],
  },
  invoice: {
    status: "Under Review",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    steps: [
      { label: "Received", done: true },
      { label: "Under Review", done: false },
      { label: "Approved", done: false },
      { label: "Payment Scheduled", done: false },
      { label: "Paid", done: false },
    ],
  },
  vendor: {
    status: "Active",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    steps: [
      { label: "Onboarded", done: true },
      { label: "Verified", done: true },
      { label: "Active", done: true },
    ],
  },
};

const MOCK_SEARCH_RESULTS: Record<string, { id: string; label: string; meta: string; status: string; statusColor: string }[]> = {
  po: [
    { id: "PO-2026-001", label: "IT Procurement – TechSupply Co", meta: "₹1,50,000 · Engineering · Jun 2026", status: "Approved", statusColor: "#4ade80" },
    { id: "PO-2026-002", label: "Office Supplies – OfficeMax Pro", meta: "₹45,000 · Operations · Jun 2026", status: "Pending", statusColor: "#facc15" },
    { id: "PO-2026-003", label: "Cloud Infrastructure – CloudNet", meta: "₹2,50,000 · IT · May 2026", status: "Draft", statusColor: "#94a3b8" },
  ],
  vendor: [
    { id: "VND-101", label: "TechSupply Co", meta: "IT Hardware & Software · Mumbai", status: "Active", statusColor: "#4ade80" },
    { id: "VND-102", label: "CloudNet Solutions", meta: "Cloud Services · Bangalore", status: "Active", statusColor: "#4ade80" },
    { id: "VND-103", label: "OfficeMax Pro", meta: "Office Supplies · Delhi", status: "Inactive", statusColor: "#f87171" },
  ],
  invoice: [
    { id: "INV-2026-001", label: "TechSupply Co · Hardware Q2", meta: "₹80,000 · Due Jul 15", status: "Pending", statusColor: "#facc15" },
    { id: "INV-2026-002", label: "CloudNet Solutions · Cloud Svc", meta: "₹1,20,000 · Due Jul 20", status: "Approved", statusColor: "#4ade80" },
  ],
};

interface StatusCardProps { intentType: IntentType; query: string; onNavigate: NavFn; }
function StatusCard({ intentType, query, onNavigate }: StatusCardProps) {
  const key = intentType.includes("vendor") ? "vendor" : intentType.includes("invoice") ? "invoice" : "po";
  const info = MOCK_STATUSES[key];
  const idMatch = query.match(/(?:PO|INV|VND)-\d{4}-\d{3}|VND-\d{3}/i);
  const recordId = idMatch ? idMatch[0].toUpperCase() : (key === "po" ? "PO-2026-001" : key === "invoice" ? "INV-2026-001" : "VND-101");

  return (
    <div style={{ background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, fontSize: 12 }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: "var(--foreground)" }}>{recordId}</div>
          <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 1 }}>Last updated: Today, 2:30 PM</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: info.bg, color: info.color, border: `1px solid ${info.color}30` }}>
          {info.status}
        </span>
      </div>
      {/* Progress steps */}
      <div className="flex items-center gap-1 mb-3">
        {info.steps.map((step, i) => (
          <>
            <div key={step.label} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: step.done ? info.color : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: step.done ? "#000" : "var(--muted-foreground)", fontWeight: 700, flexShrink: 0 }}>
                {step.done ? "✓" : i + 1}
              </div>
              <div style={{ fontSize: 8, color: step.done ? "var(--foreground)" : "var(--muted-foreground)", textAlign: "center", lineHeight: 1.2, fontWeight: step.done ? 600 : 400 }}>{step.label}</div>
            </div>
            {i < info.steps.length - 1 && (
              <div key={`line-${i}`} style={{ height: 2, flex: 1, background: step.done && info.steps[i + 1].done ? info.color : "var(--border)", marginBottom: 14, flexShrink: 0 }} />
            )}
          </>
        ))}
      </div>
      <button
        onClick={() => onNavigate(key === "po" ? "Purchase Order" : key === "invoice" ? "Bill" : "Vendor", recordId)}
        style={{ width: "100%", padding: "6px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "var(--foreground)", color: "var(--background)", border: "none" }}
      >
        View Full Record →
      </button>
    </div>
  );
}

interface SearchResultsCardProps { intentType: IntentType; onNavigate: NavFn; }
function SearchResultsCard({ intentType, onNavigate }: SearchResultsCardProps) {
  const key = intentType.includes("vendor") ? "vendor" : intentType.includes("invoice") ? "invoice" : "po";
  const results = MOCK_SEARCH_RESULTS[key] || MOCK_SEARCH_RESULTS.po;
  const module = key === "po" ? "Purchase Order" : key === "invoice" ? "Bill" : "Vendor";

  return (
    <div style={{ background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, fontSize: 12 }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontWeight: 700, fontSize: 11, color: "var(--foreground)" }}>🔍 {results.length} Records Found</span>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Sorted by date</span>
      </div>
      <div className="flex flex-col gap-2">
        {results.map(r => (
          <button
            key={r.id}
            onClick={() => onNavigate(module, r.id)}
            className="text-left"
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", width: "100%" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6b8cff")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div style={{ fontWeight: 600, fontSize: 11, color: "var(--foreground)" }}>{r.id}</div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{r.label}</div>
                <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{r.meta}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${r.statusColor}15`, color: r.statusColor, border: `1px solid ${r.statusColor}30`, flexShrink: 0 }}>
                {r.status}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface ApprovalCardProps { intentType: IntentType; query: string; onAction: (action: "approve" | "reject") => void; }
function ApprovalCard({ intentType, query, onAction }: ApprovalCardProps) {
  const isInvoice = intentType.includes("invoice");
  const idMatch = query.match(/(?:PO|INV)-\d{4}-\d{3}/i);
  const recordId = idMatch ? idMatch[0].toUpperCase() : (isInvoice ? "INV-2026-001" : "PO-2026-001");
  const isReject = intentType.includes("reject");

  return (
    <div style={{ background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, fontSize: 12 }}>
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(250,204,21,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📋</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: "var(--foreground)" }}>{recordId}</div>
          <div style={{ fontSize: 10, color: "#facc15", fontWeight: 600 }}>Pending Approval</div>
        </div>
      </div>
      <div className="flex flex-col gap-1 mb-3">
        {[["Vendor", isInvoice ? "TechSupply Co" : "CloudNet Solutions"], ["Amount", isInvoice ? "₹80,000" : "₹2,50,000"], ["Submitted by", "Rohan Kumar"], ["Department", "Engineering"]].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span style={{ color: "var(--muted-foreground)", fontSize: 10 }}>{label}</span>
            <span style={{ color: "var(--foreground)", fontSize: 10, fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAction("approve")}
          style={{ flex: 1, padding: "6px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#4ade80", color: "#000", border: "none" }}
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onAction("reject")}
          style={{ flex: 1, padding: "6px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid #f8717140" }}
        >
          ✗ Reject
        </button>
      </div>
    </div>
  );
}

function generateGeneralAnswer(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("help") || lower.includes("what can you do") || lower.includes("menu")) {
    return "I am your Action-Oriented AI Copilot. Here are the tasks I can help you with:\n\n" +
      "1. **Raise a Purchase Order**: Type 'Raise a PO for TechSupply worth ₹150,000 for IT procurement...'\n" +
      "2. **Onboard a Vendor**: Type 'Onboard a vendor TechSupply Co, email contact@techsupply.com, GSTIN...'\n" +
      "3. **Add an Invoice**: Type 'Add an invoice INV-2026-099 from TechSupply Co for ₹80,000...'\n" +
      "4. **Check Status**: Type 'Check status of PO-2026-001' or 'Status of invoice INV-2026-002'\n" +
      "5. **Search Records**: Type 'Find all purchase orders' or 'Search vendors in Mumbai'\n" +
      "6. **Approvals**: Type 'Approve PO-2026-001' or 'Reject invoice INV-2026-001'";
  }
  if (lower.includes("po") || lower.includes("purchase order")) {
    return "To raise a Purchase Order, you can say something like:\n" +
      "*\"Raise a PO for CloudNet Solutions worth ₹250,000 for front-end development, Engineering dept, Net 30 payment terms.\"*\n\n" +
      "I will automatically extract the fields, let you review them, open the Purchase Order module, prefill the form, and save it.";
  }
  if (lower.includes("vendor")) {
    return "To onboard a vendor, you can say something like:\n" +
      "*\"Onboard vendor OfficeMax Pro, contact person Rahul, email sales@officemax.com, GSTIN 27AAAAA1111A1Z1.\"*\n\n" +
      "I will extract the contact details, open the Vendor Onboarding module, prefill the form, and save the record.";
  }
  if (lower.includes("invoice") || lower.includes("bill")) {
    return "To submit an invoice, you can say something like:\n" +
      "*\"Submit invoice INV-2026-101 from TechSupply Co for ₹85,000 dated today, due in 30 days.\"*\n\n" +
      "I will extract the invoice fields, open the Bill/Invoice module, prefill the form, and save the invoice.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm your DataTwin AI Copilot. How can I help you with your finance tasks today?";
  }
  return "I'm here to help you manage your finance workflows. You can ask me to raise a PO, onboard a vendor, submit an invoice, search for records, or check the status of any document. Try saying: \"Help\" to see all options.";
}

interface PageConfig {
  subtitle: string;
  welcome: string;
  suggestions: { id: string; label: string; icon: string }[];
}

function getContextTitle(page: string): string {
  if (page === "Purchase Order") return "Purchase Orders";
  if (page === "Bill") return "Bills";
  return page;
}

function getPageConfig(page: string): PageConfig {
  const p = page ? page.trim() : "Overview";
  
  switch (p) {
    case "Overview":
      return {
        subtitle: "Business Insights Assistant",
        welcome: "Hi! I'm your Business Insights AI Copilot. Ask about business performance, pending actions, dashboard metrics, or what needs your attention today.",
        suggestions: [
          { id: "summarize_perf", label: "Summarize business performance", icon: "📊" },
          { id: "pending_actions", label: "Show pending actions", icon: "⚡" },
          { id: "explain_metrics", label: "Explain dashboard metrics", icon: "💡" },
          { id: "needs_attention", label: "What needs my attention today?", icon: "❓" },
        ]
      };
    case "Approvals":
      return {
        subtitle: "Approvals • AI Assistant",
        welcome: "Hi! I'm your Approvals AI Copilot. Ask about pending approvals, aging, high priority approvals, or specific exceptions.",
        suggestions: [
          { id: "pending_approvals", label: "Show pending approvals", icon: "⏳" },
          { id: "why_rejected", label: "Why was this request rejected?", icon: "❌" },
          { id: "aging", label: "Approval aging", icon: "📅" },
          { id: "high_priority", label: "High priority approvals", icon: "🔥" },
        ]
      };
    case "Report":
      return {
        subtitle: "Reports • AI Assistant",
        welcome: "Hi! I'm your Financial Reports AI Copilot. I can help generate financial reports, explain metrics, export insights, or compare periods.",
        suggestions: [
          { id: "generate_report", label: "Generate financial report", icon: "📈" },
          { id: "explain_report", label: "Explain report", icon: "📑" },
          { id: "export_insights", label: "Export insights", icon: "📤" },
          { id: "compare_periods", label: "Compare periods", icon: "⚖️" },
        ]
      };
    case "Organization":
      return {
        subtitle: "Organization • AI Assistant",
        welcome: "Hi! I'm your Organization AI Copilot. Ask about business units, department hierarchies, approvers, or search employees.",
        suggestions: [
          { id: "find_unit", label: "Find business unit", icon: "🏢" },
          { id: "show_hierarchy", label: "Show department hierarchy", icon: "🌲" },
          { id: "find_approver", label: "Find approver", icon: "👤" },
          { id: "search_employee", label: "Search employee", icon: "🔍" },
        ]
      };
    case "Vendor":
      return {
        subtitle: "Vendor Intelligence • AI Assistant",
        welcome: "Hi! I'm your Vendor Intelligence AI Copilot. Ask about finding/creating vendors, payment histories, or risk summaries.",
        suggestions: [
          { id: "find_vendor", label: "Find vendor", icon: "🤝" },
          { id: "create_vendor", label: "Create vendor", icon: "➕" },
          { id: "vendor_history", label: "Vendor payment history", icon: "📜" },
          { id: "vendor_risk", label: "Vendor risk summary", icon: "⚠️" },
        ]
      };
    case "Purchase Order":
      return {
        subtitle: "Semantic Extraction • Purchase Order Assistant",
        welcome: "Hi! I'm your Purchase Order AI Copilot. I can help create POs, search purchase orders, explain statuses, and answer procurement questions.",
        suggestions: [
          { id: "raise_po", label: "Raise Purchase Order", icon: "📦" },
          { id: "find_po", label: "Find Purchase Order", icon: "🔍" },
          { id: "po_status", label: "Check PO Status", icon: "✅" },
          { id: "add_invoice", label: "Add Invoice", icon: "🧾" },
        ]
      };
    case "Bill":
      return {
        subtitle: "Bills • AI Assistant",
        welcome: "Hi! I'm your Bills AI Copilot. I can help create bills, search invoices, match POs, or summarize payment due info.",
        suggestions: [
          { id: "create_bill", label: "Create Bill", icon: "💵" },
          { id: "find_bill", label: "Find Bill", icon: "🔍" },
          { id: "match_bill", label: "Match Bill with PO", icon: "🧩" },
          { id: "due_summary", label: "Payment Due Summary", icon: "📊" },
        ]
      };
    case "Accounts Payable":
      return {
        subtitle: "Accounts Payable • Finance Assistant",
        welcome: "Hi! I'm your Accounts Payable AI Copilot. Ask about invoices, vendor balances, payment schedules, exceptions, or aging reports.",
        suggestions: [
          { id: "overdue_invoices", label: "Show overdue invoices", icon: "🚨" },
          { id: "outstanding_bal", label: "Vendor outstanding balance", icon: "💳" },
          { id: "payment_aging", label: "Explain payment aging", icon: "⏳" },
          { id: "payment_schedule", label: "Upcoming payment schedule", icon: "📅" },
        ]
      };
    case "Accounts Receivable":
      return {
        subtitle: "Receivables Intelligence • Finance Assistant",
        welcome: "Hi! I'm your Accounts Receivable AI Copilot. I can help track collections, outstanding invoices, payment predictions, and customer balances.",
        suggestions: [
          { id: "customer_outstanding", label: "Customer outstanding invoices", icon: "📈" },
          { id: "overdue_collections", label: "Show overdue collections", icon: "📞" },
          { id: "predict_delays", label: "Predict payment delays", icon: "🔮" },
          { id: "cash_collection", label: "Cash collection summary", icon: "💰" },
        ]
      };
    case "FSCP":
      return {
        subtitle: "Financial Close Assistant",
        welcome: "Hi! I'm your Financial Close AI Copilot. I can help monitor close activities, reconciliation progress, journal entries, and outstanding tasks.",
        suggestions: [
          { id: "close_checklist", label: "Show close checklist", icon: "📋" },
          { id: "close_progress", label: "Month-end progress", icon: "🔄" },
          { id: "close_tasks", label: "Outstanding close tasks", icon: "📌" },
          { id: "reconciliation_issues", label: "Explain reconciliation issues", icon: "🔍" },
        ]
      };
    default:
      return {
        subtitle: `${p} • AI Assistant`,
        welcome: `Hi! I'm your ${p} AI Copilot. I can help answer questions and process tasks for the ${p} module.`,
        suggestions: [
          { id: `${p.toLowerCase()}_summary`, label: `Show ${p} summary`, icon: "📋" },
          { id: `${p.toLowerCase()}_actions`, label: `List actions for ${p}`, icon: "⚡" },
        ]
      };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CopilotState {
  active: boolean;
  intent: IntentType | null;
  category: IntentCategory | null;
  mode: "review" | "execute";
  step: "idle" | "analyzing" | "navigating" | "populating" | "validating" | "waiting_review" | "saving" | "completed" | "searching" | "results_ready" | "approval_pending" | "approved" | "not_found" | "error";
  timeline: TimelineItem[];
  dataModel: ExtractedDataModel | null;
  createdId: string | null;
  createdPage: string | null;
  resultPayload?: { type: "status" | "search" | "approval" | "not_found"; intentType: IntentType; query: string; label?: string; };
}

const suggestions = [
  { id: "raise_po", label: "Raise a Purchase Order", icon: "📦" },
  { id: "add_invoice", label: "Add an Invoice", icon: "🧾" },
  { id: "find_po", label: "Find a Purchase Order", icon: "🔍" },
  { id: "check_invoice", label: "Check Invoice Status", icon: "✅" },
];

interface AIAssistantProps {
  onNavigate: NavFn;
  hasHeaderOffset?: boolean;
  activePage?: string;
}

export function AIAssistant({ onNavigate, hasHeaderOffset = false, activePage }: AIAssistantProps) {
  const panelCtx = useContext(PanelContext);
  const open = panelCtx ? panelCtx.activePanel === "ai" : true;
  const setOpen = (val: boolean) => {
    if (panelCtx) {
      panelCtx.setActivePanel(val ? "ai" : null);
    }
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [copilot, setCopilot] = useState<CopilotState>({
    active: false,
    intent: null,
    category: null,
    mode: "review",
    step: "idle",
    timeline: [],
    dataModel: null,
    createdId: null,
    createdPage: null,
  });

  // ── Error state ──
  const [globalError, setGlobalError] = useState<string | null>(null);

  function safeRun<T>(fn: () => T, fallback: T, label: string): T {
    try {
      return fn();
    } catch (err) {
      console.error(`[Copilot] Error in ${label}:`, err);
      setGlobalError("Unable to process your request right now. Please try again.");
      return fallback;
    }
  }

  const [pendingReviewModel, setPendingReviewModel] = useState<ExtractedDataModel | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, copilot]);

  useEffect(() => {
    if (activePage !== "Purchase Order" && activePage !== "Vendor" && activePage !== "Bill") {
      if (copilot.active && copilot.step === "completed") {
        setCopilot(prev => ({ ...prev, active: false }));
      }
    }
  }, [activePage, copilot.active, copilot.step]);

  useEffect(() => {
    if (!activePage) return;
    const config = getPageConfig(activePage);
    const title = getContextTitle(activePage);
    
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === "context" && last.text === title) {
        return prev;
      }
      return [
        ...prev,
        { role: "context", text: title },
        { role: "ai", text: config.welcome }
      ];
    });
  }, [activePage]);

  function addMessage(role: "ai" | "user", text: string, reviewCard?: ExtractedDataModel) {
    try {
      if (!text || typeof text !== "string") {
        console.warn("[Copilot] addMessage called with invalid text", text);
        return;
      }
      setMessages(m => [...m, { role, text: text.trim() || "…", reviewCard }]);
    } catch (err) {
      console.error("[Copilot] addMessage error:", err);
    }
  }

  function startCopilotWorkflow(intent: IntentResult, rawText: string) {
    try {
      if (intent.category !== "general_question") {
        addMessage("user", rawText);
      }

      setCopilot({
        active: true,
        intent: intent.type,
        category: intent.category,
        mode: copilot.mode,
        step: "analyzing",
        timeline: buildTimeline(intent.category, intent.category === "update_record"),
        dataModel: null,
        createdId: null,
        createdPage: null,
      });

      if (intent.category === "create_record" || intent.category === "update_record") {
        setTimeout(() => {
          try {
            const model = extractSemanticFields(rawText, intent.type);
            setPendingReviewModel(model);

            setCopilot(prev => ({
              ...prev,
              step: "waiting_review",
              timeline: prev.timeline.map(t =>
                t.id === "extract" ? { ...t, status: "done" } :
                t.id === "review" ? { ...t, status: "running" } : t
              ),
            }));

            addMessage(
              "ai",
              "I have performed semantic field extraction on your request. Please review the extracted details below. If confidence is low or fields are empty, you can edit them by clicking the ✎ icon.",
              model
            );
          } catch (err) {
            console.error("[Copilot] extraction error:", err);
            setCopilot(prev => ({
              ...prev,
              step: "error",
              timeline: prev.timeline.map(t => ({ ...t, status: "error" as const })),
            }));
            addMessage("ai", "⚠ An error occurred during semantic field extraction. Please try again.");
          }
        }, 1000);
      } else if (intent.category === "status_lookup" || intent.category === "search_record") {
        setTimeout(() => {
          try {
            setCopilot(prev => ({
              ...prev,
              step: "searching",
              timeline: prev.timeline.map(t =>
                t.id === "searching" || t.id === "looking_up" ? { ...t, status: "done" } :
                t.id === "fetching" ? { ...t, status: "running" } : t
              ),
            }));

            setTimeout(() => {
              try {
                const result = lookupRecord(intent.type, rawText);
                if (result.found) {
                  setCopilot(prev => ({
                    ...prev,
                    step: "results_ready",
                    timeline: prev.timeline.map(t => ({ ...t, status: "done" as const })),
                    resultPayload: {
                      type: intent.category === "status_lookup" ? "status" : "search",
                      intentType: intent.type,
                      query: rawText,
                      label: result.label,
                    },
                  }));
                  addMessage("ai", `I found the following matching record:`);
                } else {
                  setCopilot(prev => ({
                    ...prev,
                    step: "not_found",
                    timeline: prev.timeline.map(t =>
                      t.id === "fetching" ? { ...t, status: "error" } :
                      t.id === "results" ? { ...t, status: "error" } : t
                    ),
                    resultPayload: {
                      type: "not_found",
                      intentType: intent.type,
                      query: rawText,
                    },
                  }));
                  const displayId = result.recordId || "001";
                  const entity = intent.type.includes("vendor") ? "Vendor" : intent.type.includes("invoice") ? "Invoice" : "PO";
                  addMessage("ai", `${entity} ${displayId} was not found.`);
                }
              } catch (err) {
                console.error("[Copilot] lookup execute error:", err);
                setCopilot(prev => ({
                  ...prev,
                  step: "error",
                  timeline: prev.timeline.map(t => ({ ...t, status: "error" as const })),
                }));
                addMessage("ai", "⚠ An error occurred while searching for the record. Please try again.");
              }
            }, 800);
          } catch (err) {
            console.error("[Copilot] lookup start error:", err);
            setCopilot(prev => ({
              ...prev,
              step: "error",
              timeline: prev.timeline.map(t => ({ ...t, status: "error" as const })),
            }));
            addMessage("ai", "⚠ An error occurred while searching for the record. Please try again.");
          }
        }, 800);
      } else if (intent.category === "approval_action") {
        setTimeout(() => {
          try {
            setCopilot(prev => ({
              ...prev,
              timeline: prev.timeline.map(t =>
                t.id === "finding" ? { ...t, status: "done" } :
                t.id === "authority" ? { ...t, status: "running" } : t
              ),
            }));

            setTimeout(() => {
              try {
                const result = lookupRecord(intent.type, rawText);
                if (result.found) {
                  setCopilot(prev => ({
                    ...prev,
                    step: "approval_pending",
                    timeline: prev.timeline.map(t =>
                      t.id === "authority" ? { ...t, status: "done" } :
                      t.id === "applying" ? { ...t, status: "running" } : t
                    ),
                    resultPayload: {
                      type: "approval",
                      intentType: intent.type,
                      query: rawText,
                    },
                  }));
                  addMessage("ai", `Please confirm your approval action for the following record:`);
                } else {
                  setCopilot(prev => ({
                    ...prev,
                    step: "not_found",
                    timeline: prev.timeline.map(t =>
                      t.id === "authority" ? { ...t, status: "error" } :
                      t.id === "applying" ? { ...t, status: "error" } : t
                    ),
                    resultPayload: {
                      type: "not_found",
                      intentType: intent.type,
                      query: rawText,
                    },
                  }));
                  const displayId = result.recordId || "001";
                  const entity = intent.type.includes("vendor") ? "Vendor" : intent.type.includes("invoice") ? "Invoice" : "PO";
                  addMessage("ai", `${entity} ${displayId} was not found.`);
                }
              } catch (err) {
                console.error("[Copilot] approval execute error:", err);
                setCopilot(prev => ({ ...prev, step: "error", timeline: prev.timeline.map(t => ({ ...t, status: "error" as const })) }));
                addMessage("ai", "⚠ An error occurred while fetching details. Please try again.");
              }
            }, 800);
          } catch (err) { 
            console.error("[Copilot] approval start error:", err);
            setCopilot(prev => ({ ...prev, step: "error", timeline: prev.timeline.map(t => ({ ...t, status: "error" as const })) }));
            addMessage("ai", "⚠ An error occurred while fetching details. Please try again.");
          }
        }, 800);
      } else if (intent.category === "general_question") {
        setTimeout(() => {
          try {
            setCopilot(prev => ({
              ...prev,
              timeline: prev.timeline.map(t =>
                t.id === "processing" ? { ...t, status: "done" } :
                t.id === "answering" ? { ...t, status: "running" } : t
              ),
            }));

            setTimeout(() => {
              try {
                const answer = generateGeneralAnswer(rawText);
                setCopilot(prev => ({
                  ...prev,
                  active: false,
                  step: "idle",
                  timeline: [],
                }));
                addMessage("ai", answer);
              } catch (err) {
                console.error("[Copilot] general question answer error:", err);
                setCopilot(prev => ({ ...prev, active: false, step: "idle", timeline: [] }));
                addMessage("ai", "I'm sorry, I couldn't process that question. How else can I assist you?");
              }
            }, 800);
          } catch (err) {
            console.error("[Copilot] general question start error:", err);
            setCopilot(prev => ({ ...prev, active: false, step: "idle", timeline: [] }));
            addMessage("ai", "I'm sorry, I couldn't process that question. How else can I assist you?");
          }
        }, 600);
      }
    } catch (err) {
      console.error("[Copilot] startCopilotWorkflow error:", err);
      setGlobalError("Unable to start the workflow. Please try again.");
    }
  }

  function handleSend(overrideText?: string) {
    try {
      const val = (overrideText ?? input).trim();
      if (!val) return;
      setInput("");
      setGlobalError(null);
      setTimeout(() => inputRef.current?.focus(), 50);

      // ── Classify FIRST — before any workflow UI loads ──
      const detected = safeRun(() => classifyIntent(val), null, "classifyIntent");
      if (detected) {
        startCopilotWorkflow(detected, val);
        return;
      }

      // Fallback: treat as general question
      addMessage("user", val);
      startCopilotWorkflow({ type: "general_question", category: "general_question" }, val);
    } catch (err) {
      console.error("[Copilot] handleSend error:", err);
      setGlobalError("Unable to process your request right now. Please try again.");
    }
  }

  function handleMicToggle() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        addMessage("ai", "⚠ Voice input is not supported in this browser. Please use Chrome or Edge.");
        return;
      }

      if (isListening) {
        recognitionRef.current?.stop();
        return;
      }

      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false;

      let interimText = "";

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        interimText = "";
      };

      recognition.onresult = (event: any) => {
        try {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i]?.[0]?.transcript ?? "";
            if (event.results[i].isFinal) final += t;
            else interim += t;
          }
          // Show interim in input for visual feedback; keep final for dispatch
          const combined = (final || interim).trim();
          if (combined) {
            interimText = combined;
            setTranscript(combined);
            setInput(combined);
          }
        } catch (err) {
          console.error("[Mic] onresult error:", err);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[Mic] Speech recognition error:", event?.error);
        setIsListening(false);
        setTranscript("");
        if (event?.error === "not-allowed") {
          addMessage("ai", "⚠ Microphone access denied. Please allow microphone permissions in your browser settings.");
        } else if (event?.error === "no-speech") {
          addMessage("ai", "⚠ No speech detected. Please try speaking clearly closer to the microphone.");
        } else if (event?.error === "network") {
          addMessage("ai", "⚠ Speech recognition requires an internet connection. Please check your network.");
        } else {
          addMessage("ai", "⚠ Voice input encountered an error. Please try typing your request instead.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setTranscript("");

        const captured = interimText.trim();
        setInput("");

        if (!captured) return;

        try {
          const detected = classifyIntent(captured);
          if (detected) {
            startCopilotWorkflow(detected, captured);
          } else {
            addMessage("user", captured);
            startCopilotWorkflow({ type: "general_question", category: "general_question" }, captured);
          }
        } catch (err) {
          console.error("[Mic] Dispatch error:", err);
          setGlobalError("Unable to process your request right now. Please try again.");
        }
      };

      recognition.start();
    } catch (err) {
      console.error("[Mic] handleMicToggle error:", err);
      setIsListening(false);
      addMessage("ai", "⚠ Failed to start voice input. Please try again.");
    }
  }

  // ── Record Lookup Engine ────────────────────────────────────────────────────
  // Simulates a database lookup. Returns the found record or null.
  function lookupRecord(intentType: IntentType, query: string): { found: boolean; recordId: string; label: string; key: string } {
    try {
      const key = intentType.includes("vendor") ? "vendor" : intentType.includes("invoice") ? "invoice" : "po";
      const dataset = MOCK_SEARCH_RESULTS[key] ?? [];

      // Try to match an explicit ID in the query
      const idPatterns = [
        /\bPO-\d{4}-\d{3}\b/i,
        /\bINV-\d{4}-\d{3}\b/i,
        /\bVND-\d{3}\b/i,
        // Loose number patterns: "invoice 001", "po 002"
        /(?:invoice|inv|bill)\s*(\d{3,})/i,
        /(?:po|purchase\s*order)\s*(\d{3,})/i,
      ];

      let queriedId: string | null = null;
      for (const pat of idPatterns) {
        const m = query.match(pat);
        if (m) {
          queriedId = m[0].trim().toUpperCase();
          break;
        }
      }

      // If we have an explicit ID, find exact or fuzzy match
      if (queriedId) {
        // Try exact match first
        const exact = dataset.find(r => r.id.toUpperCase() === queriedId);
        if (exact) return { found: true, recordId: exact.id, label: exact.label, key };

        // Fuzzy: match trailing numbers e.g. "001" → "PO-2026-001"
        const numOnly = queriedId.replace(/\D/g, "");
        const fuzzy = dataset.find(r => r.id.replace(/\D/g, "").endsWith(numOnly));
        if (fuzzy) return { found: true, recordId: fuzzy.id, label: fuzzy.label, key };

        // Not found — return the queried ID so we can show a specific message
        const humanId = queriedId.replace(/^(INVOICE|BILL|PO|PURCHASE ORDER)\s*/i, "");
        return { found: false, recordId: humanId || queriedId, label: "", key };
      }

      // No ID specified — return all results (search mode)
      if (dataset.length > 0) {
        return { found: true, recordId: dataset[0].id, label: `${dataset.length} records found`, key };
      }

      return { found: false, recordId: "", label: "", key };
    } catch (err) {
      console.error("[Copilot] lookupRecord error:", err);
      return { found: false, recordId: "Unknown", label: "", key: "po" };
    }
  }



  function handleReviewConfirm(confirmedModel: ExtractedDataModel) {
    if (!copilot.intent) return;
    setPendingReviewModel(null);

    const flat = flattenModel(confirmedModel);

    setCopilot(prev => ({
      ...prev,
      dataModel: confirmedModel,
      step: "navigating",
      timeline: prev.timeline.map(t =>
        t.id === "review" ? { ...t, status: "done" } :
        t.id === "navigation" ? { ...t, status: "running" } : t
      ),
    }));

    addMessage("ai", "✓ Confirmed! Opening the form and populating fields now...");

    const targetModule = getModuleName(copilot.intent);
    onNavigate(targetModule, undefined, "new_prefill:" + JSON.stringify(flat));

    setTimeout(() => {
      setCopilot(prev => ({
        ...prev,
        step: "populating",
        timeline: prev.timeline.map(t =>
          t.id === "navigation" ? { ...t, status: "done" } :
          t.id === "population" ? { ...t, status: "running" } : t
        ),
      }));

      setTimeout(() => {
        if (copilot.mode === "execute") {
          setCopilot(prev => ({
            ...prev,
            step: "saving",
            timeline: prev.timeline.map(t =>
              t.id === "population" ? { ...t, status: "done" } :
              t.id === "submission" ? { ...t, status: "running" } : t
            ),
          }));

          setTimeout(() => {
            const newId = generateRecordId(copilot.intent!);
            const page = getModuleName(copilot.intent!);
            setCopilot(prev => ({
              ...prev,
              step: "completed",
              createdId: newId,
              createdPage: page,
              timeline: prev.timeline.map(t =>
                t.id === "submission" ? { ...t, status: "done" } : t
              ),
            }));
            addMessage("ai", `✓ ${intentLabel(copilot.intent!)} Created Successfully!\n\nRecord Number: **${newId}**`);
          }, 1200);
        } else {
          setCopilot(prev => ({
            ...prev,
            step: "waiting_review",
            timeline: prev.timeline.map(t =>
              t.id === "population" ? { ...t, status: "done" } : t
            ),
          }));
          addMessage("ai", "Form populated! Review the details on the left, then click **Confirm & Submit** to save the record.");
        }
      }, 1000);
    }, 700);
  }

  function handleReviewCancel() {
    setPendingReviewModel(null);
    setCopilot({
      active: false,
      intent: null,
      mode: copilot.mode,
      step: "idle",
      timeline: [],
      dataModel: null,
      createdId: null,
      createdPage: null,
    });
    addMessage("ai", "Cancelled. Let me know if you want to try again with a different description.");
  }

  function handleConfirmSubmit() {
    if (!copilot.intent || !copilot.dataModel) return;
    setCopilot(prev => ({
      ...prev,
      step: "saving",
      timeline: prev.timeline.map(t =>
        t.id === "submission" ? { ...t, status: "running" } : t
      ),
    }));

    setTimeout(() => {
      const newId = generateRecordId(copilot.intent!);
      const page = getModuleName(copilot.intent!);
      setCopilot(prev => ({
        ...prev,
        step: "completed",
        createdId: newId,
        createdPage: page,
        timeline: prev.timeline.map(t =>
          t.id === "submission" ? { ...t, status: "done" } : t
        ),
      }));
      addMessage("ai", `✓ ${intentLabel(copilot.intent!)} Created Successfully!\n\nRecord Number: **${newId}**`);
    }, 900);
  }

  function handleCancelCopilot() {
    setPendingReviewModel(null);
    setCopilot({
      active: false,
      intent: null,
      category: null,
      mode: copilot.mode,
      step: "idle",
      timeline: [],
      dataModel: null,
      createdId: null,
      createdPage: null,
    });
    addMessage("ai", "Cancelled. What else can I help you with?");
  }

  function handleApprovalAction(action: "approve" | "reject") {
    setCopilot(prev => ({
      ...prev,
      step: "approved",
      timeline: prev.timeline.map(t => ({ ...t, status: "done" as const })),
    }));
    setTimeout(() => {
      setCopilot(prev => ({ ...prev, active: false }));
      const id = copilot.resultPayload?.query.match(/(?:PO|INV)-\d{4}-\d{3}/i)?.[0].toUpperCase() || "PO-2026-001";
      addMessage("ai", action === "approve"
        ? `✓ ${id} has been approved successfully! The requester will be notified.`
        : `✗ ${id} has been rejected. The requester will be notified with your decision.`
      );
    }, 600);
  }

  function handleSuggestion(id: string) {
    const samples: Record<string, IntentResult & { text: string }> = {
      raise_po:      { type: "create_po",      category: "create_record",  text: "Raise a PO for TechSupply Co worth ₹150000 for IT procurement, Engineering department, Net 30 payment terms" },
      add_invoice:   { type: "create_invoice", category: "create_record",  text: "Create invoice INV-2026-099 from TechSupply Co for ₹80000, dated Jun 25 2026, due Jul 25 2026" },
      find_po:       { type: "search_po",      category: "search_record",  text: "Find all purchase orders" },
      check_invoice: { type: "status_invoice", category: "status_lookup",  text: "Check status of Invoice INV-2026-001" },
    };
    const sample = samples[id];
    if (sample) {
      addMessage("user", sample.text);
      startCopilotWorkflow({ type: sample.type, category: sample.category }, sample.text);
    } else {
      const config = getPageConfig(activePage || "Overview");
      const item = config.suggestions.find(s => s.id === id);
      if (item) {
        addMessage("user", item.label);
        startCopilotWorkflow({ type: "general_question", category: "general_question" }, item.label);
      }
    }
  }

  // ── Global Error Banner ────────────────────────────────────────────────────
  if (globalError && !copilot.active) {
    // Show inline in chat, then auto-clear
    setTimeout(() => setGlobalError(null), 5000);
  }

  // ── Closed state ──────────────────────────────────────────────────────────
  if (!open) {
    return (
      <div
        className="flex flex-col items-center"
        style={{
          width: 44,
          height: hasHeaderOffset ? "calc(100% - 56px)" : "100%",
          marginTop: hasHeaderOffset ? 56 : 0,
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          flexShrink: 0,
          paddingTop: 12,
          gap: 12,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 32,
            height: 32,
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: "var(--foreground)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--secondary)")}
          title="Open AI Copilot"
        >
          <Sparkles size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        width: 360,
        height: hasHeaderOffset ? "calc(100% - 56px)" : "100%",
        marginTop: hasHeaderOffset ? 56 : 0,
        background: "var(--card)",
        borderLeft: "1px solid var(--border)",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: "var(--foreground)" }}>
          <Sparkles size={13} style={{ color: "var(--background)" }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>DataTwin Copilot</p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{getPageConfig(activePage || "Overview").subtitle}</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          title="Minimize Copilot"
        >
          <X size={16} />
        </button>
      </div>

      {/* Copilot Pipeline Panel */}
      {copilot.active && copilot.category && (
        <div className="flex flex-col gap-2.5 px-4 py-3" style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>

          {/* Intent Category Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: `${getCategoryColor(copilot.category)}18`,
                  color: getCategoryColor(copilot.category),
                  border: `1px solid ${getCategoryColor(copilot.category)}30`,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                {getCategoryIcon(copilot.category)} {getCategoryLabel(copilot.category)}
              </span>
            </div>

            {/* Mode Switcher — only for form intents */}
            {(copilot.category === "create_record" || copilot.category === "update_record") && (
              <div className="flex rounded-md p-0.5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setCopilot(c => ({ ...c, mode: "review" }))}
                  style={{ border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: copilot.mode === "review" ? "var(--foreground)" : "none", color: copilot.mode === "review" ? "var(--background)" : "var(--muted-foreground)" }}
                >
                  Review
                </button>
                <button
                  onClick={() => setCopilot(c => ({ ...c, mode: "execute" }))}
                  style={{ border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: copilot.mode === "execute" ? "var(--foreground)" : "none", color: copilot.mode === "execute" ? "var(--background)" : "var(--muted-foreground)" }}
                >
                  Execute
                </button>
              </div>
            )}

            {/* Cancel button for non-form intents */}
            {copilot.category !== "create_record" && copilot.category !== "update_record" && (
              <button
                onClick={handleCancelCopilot}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 10, padding: "2px 4px" }}
              >
                ✕ Cancel
              </button>
            )}
          </div>

          {/* Sub-intent label */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}>
            {getIntentLabel(copilot.intent!)}
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-1.5">
            {copilot.timeline.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center justify-center" style={{ width: 14, height: 14 }}>
                  {item.status === "done" && <span style={{ color: "#4ade80", fontWeight: 700 }}>✓</span>}
                  {item.status === "running" && (
                    <span style={{ display: "inline-block", width: 8, height: 8, background: getCategoryColor(copilot.category!), borderRadius: "50%", boxShadow: `0 0 8px ${getCategoryColor(copilot.category!)}` }} />
                  )}
                  {item.status === "pending" && (
                    <span style={{ display: "inline-block", width: 6, height: 6, background: "var(--border)", borderRadius: "50%" }} />
                  )}
                  {item.status === "error" && <span style={{ color: "#f87171", fontWeight: 700 }}>✗</span>}
                </span>
                <span style={{ color: item.status === "pending" ? "var(--muted-foreground)" : "var(--foreground)", fontWeight: item.status === "running" ? 600 : 400 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Confirm & Submit — only for form intents in review mode */}
          {(copilot.category === "create_record" || copilot.category === "update_record") &&
           copilot.step === "waiting_review" && !pendingReviewModel && (
            <div className="flex gap-2">
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 py-1.5 rounded-lg border-none text-xs font-semibold cursor-pointer"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
              >
                Confirm & Submit
              </button>
              <button
                onClick={handleCancelCopilot}
                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                style={{ background: "none", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((msg, i) => {
          if (msg.role === "context") {
            return (
              <div key={i} className="flex flex-col items-center justify-center my-3 w-full border-b border-border/30 pb-2">
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>
                  Current Context
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", marginTop: 1 }}>
                  {msg.text}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col" style={{ alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                className="rounded-xl px-3 py-2"
                style={{
                  maxWidth: "90%",
                  background: msg.role === "user" ? "var(--foreground)" : "var(--secondary)",
                  color: msg.role === "user" ? "var(--background)" : "var(--foreground)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>

                {/* View Record button */}
                {msg.role === "ai" && msg.text.includes("Successfully!") && copilot.createdId && (
                  <button
                    onClick={() => { onNavigate(copilot.createdPage!, copilot.createdId!); setCopilot(c => ({ ...c, active: false })); }}
                    className="flex items-center gap-1.5 mt-2 rounded-lg px-2.5 py-1.5"
                    style={{ background: "var(--foreground)", color: "var(--background)", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}
                  >
                    View Details: {copilot.createdId} →
                  </button>
                )}
              </div>

              {/* Result Cards — rendered below the last AI message carrying a result */}
              {msg.role === "ai" && copilot.resultPayload && i === messages.length - 1 && (
                <div style={{ width: "100%", marginTop: 8 }}>
                  {copilot.resultPayload.type === "status" && (
                    <StatusCard
                      intentType={copilot.resultPayload.intentType}
                      query={copilot.resultPayload.query}
                      onNavigate={onNavigate}
                    />
                  )}
                  {copilot.resultPayload.type === "search" && (
                    <SearchResultsCard
                      intentType={copilot.resultPayload.intentType}
                      onNavigate={onNavigate}
                    />
                  )}
                  {copilot.resultPayload.type === "approval" && (
                    <ApprovalCard
                      intentType={copilot.resultPayload.intentType}
                      query={copilot.resultPayload.query}
                      onAction={handleApprovalAction}
                    />
                  )}
                </div>
              )}

              {/* Review Card — rendered below AI message */}
              {msg.role === "ai" && msg.reviewCard && (
                <div style={{ width: "100%", marginTop: 8 }}>
                  <ReviewCard
                    model={msg.reviewCard}
                    onConfirm={handleReviewConfirm}
                    onEdit={(key, val) => {
                      // Update pending model
                      setPendingReviewModel(prev => prev ? {
                        ...prev,
                        [key]: { ...(prev[key as keyof ExtractedDataModel] as ExtractedField), value: val, confidence: "high" as ConfidenceLevel, needsConfirmation: false }
                      } : prev);
                    }}
                    onCancel={handleReviewCancel}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Initial suggestions */}
        {!copilot.active && !messages.some(m => m.role === "user") && (
          <div className="flex flex-col gap-1.5 mt-1">
            {getPageConfig(activePage || "Overview").suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSuggestion(s.id)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors text-left"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)", fontSize: 13 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--secondary)")}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
                <ArrowRight size={12} className="ml-auto" style={{ opacity: 0.4 }} />
              </button>
            ))}
          </div>
        )}

        {/* Post-conversation suggestions */}
        {!copilot.active && messages.some(m => m.role === "user") && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {getPageConfig(activePage || "Overview").suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSuggestion(s.id)}
                className="rounded-full px-3 py-1 transition-colors"
                style={{ fontSize: 12, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--secondary)")}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Voice transcript bar */}
      {isListening && (
        <div
          className="mic-transcript-bar flex items-center gap-2 px-4 py-2"
          style={{
            background: "rgba(239,68,68,0.06)",
            borderTop: "1px solid rgba(239,68,68,0.2)",
            flexShrink: 0,
          }}
        >
          {/* Animated waveform dots */}
          <div className="flex items-end gap-0.5" style={{ height: 16 }}>
            {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  width: 3,
                  borderRadius: 2,
                  background: "#ef4444",
                  height: `${h * 14}px`,
                  animation: `micRing ${0.8 + i * 0.1}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, flex: 1 }}>
            {transcript ? `"${transcript}"` : "Listening… speak now"}
          </span>
          <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>tap mic to stop</span>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3" style={{ borderTop: isListening ? "none" : "1px solid var(--border)", flexShrink: 0 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isListening ? "Listening…" : "Describe what you want to do..."}
          className="flex-1 rounded-lg px-3 py-2"
          style={{
            background: isListening ? "rgba(239,68,68,0.04)" : "var(--secondary)",
            border: isListening ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border)",
            outline: "none",
            fontSize: 13,
            color: "var(--foreground)",
            transition: "border-color 0.2s, background 0.2s",
          }}
        />

        {/* Mic Button */}
        <button
          onClick={handleMicToggle}
          title={isListening ? "Stop listening" : "Speak to Copilot"}
          className={`flex items-center justify-center rounded-lg transition-colors ${isListening ? "mic-listening" : ""}`}
          style={{
            width: 34,
            height: 34,
            background: isListening ? "#ef4444" : "var(--secondary)",
            color: isListening ? "#fff" : "var(--muted-foreground)",
            border: isListening ? "none" : "1px solid var(--border)",
            cursor: "pointer",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (!isListening) e.currentTarget.style.background = "var(--accent)"; }}
          onMouseLeave={(e) => { if (!isListening) e.currentTarget.style.background = "var(--secondary)"; }}
        >
          {isListening ? <MicOff size={14} /> : <Mic size={14} />}
        </button>

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          className="flex items-center justify-center rounded-lg"
          style={{ width: 34, height: 34, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
