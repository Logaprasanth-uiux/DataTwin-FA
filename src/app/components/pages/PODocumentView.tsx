import { X, Printer, FileText } from "lucide-react";

const statusColor: Record<string, string> = {
  Draft: "#888896", Sent: "#6b8cff", Approved: "#22c55e", Rejected: "#ef4444", "Pending Approval": "#f59e0b",
};

// Fixed paper colors — document always looks like a printed page regardless of app theme
const D = {
  bg:       "#ffffff",
  card:     "#ffffff",
  surface:  "#f8f8fa",
  border:   "rgba(0,0,0,0.09)",
  heading:  "#111113",
  body:     "#374151",
  sub:      "#6b7280",
  mono:     "JetBrains Mono, monospace",
  band:     "#111113",   // dark header band
  bandText: "#ffffff",
  bandSub:  "rgba(255,255,255,0.6)",
};

const poItems = [
  { sno: 1, description: "Dell Latitude 5540 – 14\" FHD, i5, 16GB, 512 SSD", itemId: "ITM-1001", qty: 10, uom: "NOS", rate: "85,000.00", taxPct: "18%", taxValue: "1,53,000.00", total: "10,03,300.00" },
  { sno: 2, description: "Logitech MX Master 3 – Ergonomic wireless mouse",   itemId: "ITM-1002", qty: 15, uom: "NOS", rate: "4,500.00",  taxPct: "18%", taxValue: "12,150.00",   total: "79,600.00" },
  { sno: 3, description: "Anker USB-C Hub 7-in-1",                            itemId: "ITM-1003", qty: 10, uom: "NOS", rate: "3,200.00",  taxPct: "18%", taxValue: "5,760.00",    total: "37,760.00" },
];

interface Props { poId: string; onClose: () => void; }

export function PODocumentView({ poId, onClose }: Props) {
  const status = poId === "PO-2026-003" || poId === "PO-2026-008" || poId === "PO-2026-011" ? "Draft"
               : poId === "PO-2026-009" ? "Pending Approval"
               : poId === "PO-2026-002" || poId === "PO-2026-007" ? "Sent"
               : poId === "PO-2026-005" ? "Rejected"
               : "Approved";

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* App-themed toolbar */}
      <div className="flex items-center justify-between px-5" style={{ height: 50, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center gap-2.5">
          <FileText size={14} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Purchase Order Document</span>
          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{poId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ fontSize: 12, fontWeight: 500, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}>
            <Printer size={13} /> Print
          </button>
          <button onClick={onClose} className="flex items-center justify-center rounded-lg"
            style={{ width: 30, height: 30, background: "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Paper document — always light/white */}
      <div className="flex-1 overflow-y-auto flex justify-center py-6 px-4" style={{ background: "var(--muted)" }}>
        <div style={{ width: "100%", maxWidth: 800, background: D.bg, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.10)" }}>

          {/* Dark header band */}
          <div style={{ background: D.band, padding: "28px 36px 24px" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center rounded"
                    style={{ width: 28, height: 28, background: D.bg, fontSize: 10, fontWeight: 800, color: D.band, fontFamily: D.mono }}>
                    DT
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: D.bandText, letterSpacing: "-0.02em" }}>DataTwin AI</span>
                </div>
                <p style={{ fontSize: 11, color: D.bandSub, lineHeight: 1.6 }}>
                  Acme Corp · ORG-001<br />
                  Plot 5, SIPCOT, Chennai – 600058
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span style={{ fontSize: 22, fontWeight: 700, color: D.bandText, letterSpacing: "-0.03em" }}>PURCHASE ORDER</span>
                <span className="rounded-full px-3 py-1"
                  style={{ fontSize: 11, fontWeight: 600, background: statusColor[status], color: "#fff", letterSpacing: "0.04em" }}>
                  {status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-8 px-9 py-4" style={{ background: D.surface, borderBottom: `1px solid ${D.border}` }}>
            {[
              { label: "PO Number",     value: poId },
              { label: "PO Date",       value: "Jun 01, 2026" },
              { label: "Order ID",      value: "ORD-2026-441" },
              { label: "Currency",      value: "INR" },
              { label: "Payment Terms", value: "Net 30" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span style={{ fontSize: 9, fontWeight: 700, color: D.sub, letterSpacing: "0.08em" }}>{label.toUpperCase()}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: D.heading, fontFamily: D.mono }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Org + Vendor */}
          <div className="grid px-9 py-6 gap-8" style={{ gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${D.border}` }}>
            {[
              { section: "BILL FROM (BUYER)",  name: "Acme Corp",       id: "ORG-001", gstin: "33AABCA1234B1ZD", pan: "AABCA1234B", addr: "Plot 5, SIPCOT, Chennai – 602105" },
              { section: "BILL TO (VENDOR)",   name: "TechSupply Co",   id: "VND-001", gstin: "33AABCT1332L1ZC", pan: "AABCT1332L", addr: "Plot 12, Industrial Area, Chennai – 600058" },
            ].map(p => (
              <div key={p.section} className="flex flex-col gap-3">
                <p style={{ fontSize: 10, fontWeight: 700, color: D.sub, letterSpacing: "0.1em" }}>{p.section}</p>
                <div className="flex flex-col gap-1">
                  <span style={{ fontSize: 14, fontWeight: 600, color: D.heading }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: D.sub }}>{p.id}</span>
                  <span style={{ fontSize: 12, color: D.sub }}>GSTIN: {p.gstin}</span>
                  <span style={{ fontSize: 12, color: D.sub }}>PAN: {p.pan}</span>
                  <span style={{ fontSize: 12, color: D.sub }}>{p.addr}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Items table */}
          <div className="px-9 py-6" style={{ borderBottom: `1px solid ${D.border}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: D.surface }}>
                  {["#", "Description", "Item ID", "Qty", "UOM", "Rate (₹)", "Tax %", "Tax (₹)", "Total (₹)"].map(h => (
                    <th key={h} style={{
                      padding: "9px 12px",
                      textAlign: ["#","Qty","UOM"].includes(h) ? "center" : h.includes("₹") ? "right" : "left",
                      fontSize: 10, fontWeight: 700, color: D.sub, letterSpacing: "0.07em",
                      borderBottom: `1px solid ${D.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, i) => (
                  <tr key={item.sno} style={{ borderBottom: i < poItems.length - 1 ? `1px solid ${D.border}` : "none" }}>
                    <td style={{ padding: "11px 12px", fontSize: 12, color: D.sub, textAlign: "center" }}>{item.sno}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, color: D.body }}>{item.description}</td>
                    <td style={{ padding: "11px 12px", fontSize: 11, fontFamily: D.mono, color: D.sub, textAlign: "center" }}>{item.itemId}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, fontFamily: D.mono, textAlign: "center", color: D.heading }}>{item.qty}</td>
                    <td style={{ padding: "11px 12px", fontSize: 11, color: D.sub, textAlign: "center" }}>{item.uom}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, fontFamily: D.mono, textAlign: "right", color: D.body }}>{item.rate}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, textAlign: "right", color: D.sub }}>{item.taxPct}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, fontFamily: D.mono, textAlign: "right", color: D.sub }}>{item.taxValue}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, fontFamily: D.mono, textAlign: "right", fontWeight: 600, color: D.heading }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-4">
              <div className="flex flex-col gap-1.5" style={{ minWidth: 220 }}>
                {[
                  { label: "Base Value",           value: "₹ 9,49,500.00" },
                  { label: "Additional Charges",   value: "₹ 500.00" },
                  { label: "Discount",             value: "– ₹ 250.00" },
                  { label: "Total Tax (GST 18%)",  value: "₹ 1,70,910.00" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-8">
                    <span style={{ fontSize: 12, color: D.sub }}>{label}</span>
                    <span style={{ fontSize: 12, fontFamily: D.mono, color: D.body }}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-8 rounded-lg px-3 py-2 mt-1" style={{ background: D.band }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: D.bandText }}>Grand Total</span>
                  <span style={{ fontSize: 14, fontFamily: D.mono, fontWeight: 700, color: D.bandText }}>₹ 11,20,660.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Authorisation */}
          <div className="grid px-9 py-6 gap-8" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="flex flex-col gap-2">
              <p style={{ fontSize: 10, fontWeight: 700, color: D.sub, letterSpacing: "0.1em" }}>TERMS & CONDITIONS</p>
              <p style={{ fontSize: 11, color: D.sub, lineHeight: 1.7 }}>
                Delivery Terms: Ex-Works<br />
                Payment Terms: Net 30<br />
                Mode of Delivery: Courier<br />
                Agreement Period: Jan 01 – Dec 31, 2026<br />
                Goods must be delivered within 10 working days from PO date.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <p style={{ fontSize: 10, fontWeight: 700, color: D.sub, letterSpacing: "0.1em" }}>AUTHORISATION</p>
              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                {[
                  { label: "Requested By", name: "Priya Ramesh" },
                  { label: "Prepared By",  name: "Kiran Nair" },
                  { label: "Authorised By",name: "Sundar Rajan" },
                ].map(({ label, name }) => (
                  <div key={label} className="flex flex-col gap-4">
                    <div style={{ height: 32, borderBottom: `1px solid ${D.border}` }} />
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 11, fontWeight: 500, color: D.heading }}>{name}</span>
                      <span style={{ fontSize: 10, color: D.sub }}>{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center px-9 py-4" style={{ borderTop: `1px solid ${D.border}`, background: D.surface }}>
            <span style={{ fontSize: 10, color: D.sub, fontFamily: D.mono }}>
              {poId} · Generated by DataTwin AI · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
