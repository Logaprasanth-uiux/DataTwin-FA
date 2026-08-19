import { useState } from "react";
import { X, Check } from "lucide-react";

interface NewItemPageProps {
  onClose: () => void;
  onCreate: (item: any) => void;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ELabelInput({ label, value, onChange, placeholder, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>
        {label.toUpperCase()} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          height: 34,
          background: "var(--secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          outline: "none",
          fontSize: 13,
          color: "var(--foreground)",
          padding: "0 10px",
          width: "100%"
        }}
      />
    </div>
  );
}

function ELabelSelect({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.07em" }}>
        {label.toUpperCase()} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{
          height: 34,
          background: "var(--secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          outline: "none",
          fontSize: 13,
          color: "var(--foreground)",
          padding: "0 10px",
          width: "100%",
          cursor: "pointer"
        }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export function NewItemPage({ onClose, onCreate }: NewItemPageProps) {
  // Item Identification
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Office");
  const [group, setGroup] = useState("Others");

  // Classification
  const [commodityClass, setCommodityClass] = useState("HSN");
  const [commodityCode, setCommodityCode] = useState("");
  const [unit, setUnit] = useState("—");

  // Commercial / Tax
  const [rate, setRate] = useState("1.0");
  const [taxPercentage, setTaxPercentage] = useState("18.0");
  const [taxPreference, setTaxPreference] = useState("Taxable");
  const [forPrdFrom, setForPrdFrom] = useState("");
  const [forPrdTo, setForPrdTo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) {
      alert("Please fill in all required fields (Item ID and Item Name).");
      return;
    }

    const rateVal = parseFloat(rate) || 0;
    const formattedRate = `₹${rateVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const newItem = {
      id: id.trim(),
      name: name.trim(),
      rate: formattedRate,
      preferredVendor: "OfficeMax Pro", // Mock fallback vendor
      commodityCode: commodityCode.trim() || "—",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Active",

      // Extended detail properties
      type,
      group,
      commodityClass,
      unit,
      taxPercentage: parseFloat(taxPercentage) || 0,
      taxPreference,
      forPrdFrom: forPrdFrom || "—",
      forPrdTo: forPrdTo || "—"
    };

    onCreate(newItem);
    alert(`Item "${newItem.name}" created successfully.`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}>
            <X size={14} />
          </button>
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>New Item</h1>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5"
              style={{ fontSize: 11, fontWeight: 500, background: "rgba(107,140,255,0.12)", color: "#6b8cff" }}>
              Draft
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--secondary)")}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ fontSize: 12, fontWeight: 600, background: "var(--foreground)", color: "var(--background)", border: "none", cursor: "pointer" }}
          >
            <Check size={13} /> Create Item
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6" style={{ maxWidth: 1000 }}>
        {/* Item Identification Card */}
        <SectionCard title="Item Identification">
          <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <ELabelInput label="Item ID" value={id} onChange={setId} placeholder="e.g. EX-880016" required />
            <ELabelInput label="Item Name" value={name} onChange={setName} placeholder="e.g. High-Speed Wifi Router" required />
            <ELabelSelect label="Item Type" value={type} onChange={setType} options={["Office", "IT", "Others"]} />
            <ELabelSelect label="Item Group" value={group} onChange={setGroup} options={["Others", "Hardware", "Software", "Stationery"]} />
          </div>
        </SectionCard>

        {/* Classification Card */}
        <SectionCard title="Classification">
          <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <ELabelSelect label="Commodity Class" value={commodityClass} onChange={setCommodityClass} options={["HSN", "SAC"]} />
            <ELabelInput label="Commodity Code" value={commodityCode} onChange={setCommodityCode} placeholder="e.g. 85176200" />
            <ELabelSelect label="Unit" value={unit} onChange={setUnit} options={["—", "Nos", "Kgs", "Boxes", "Reams"]} />
          </div>
        </SectionCard>

        {/* Commercial / Tax Card */}
        <SectionCard title="Commercial / Tax">
          <div className="grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <ELabelInput label="Rate" value={rate} onChange={setRate} type="number" required />
            <ELabelInput label="Tax Percentage" value={taxPercentage} onChange={setTaxPercentage} type="number" required />
            <ELabelSelect label="Tax Preference" value={taxPreference} onChange={setTaxPreference} options={["Taxable", "Exempt", "Zero Rated"]} />
            <ELabelInput label="ForPrdFrom" value={forPrdFrom} onChange={setForPrdFrom} type="date" />
            <ELabelInput label="ForPrdTo" value={forPrdTo} onChange={setForPrdTo} type="date" />
          </div>
        </SectionCard>
      </div>
    </form>
  );
}
