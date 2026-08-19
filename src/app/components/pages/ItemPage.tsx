import { useState, useEffect } from "react";
import { ListPage } from "./ListPage";
import { CompanySwitch } from "../CompanySwitch";
import { useActivity } from "../../contexts";
import { ItemDetailPage } from "./ItemDetailPage";
import { NewItemPage } from "./NewItemPage";

const statusColor: Record<string, string> = { 
  Active: "#4ade80", 
  Hold: "#fbbf24", 
  Inactive: "#888896" 
};

export const rows = [
  { id: "EX-880001", name: "Office Stationery Supplies", rate: "₹450.00", preferredVendor: "OfficeMax Pro", commodityCode: "44122000", createdAt: "Jan 12, 2026", status: "Active" },
  { id: "EX-880002", name: "Cleaning Chemicals & Supplies", rate: "₹1,200.00", preferredVendor: "Cleanroom Services", commodityCode: "34022090", createdAt: "Jan 15, 2026", status: "Active" },
  { id: "EX-880003", name: "Safety Gloves & PPE Kit", rate: "₹850.00", preferredVendor: "SafeLogistics", commodityCode: "61161000", createdAt: "Jan 20, 2026", status: "Active" },
  { id: "EX-880004", name: "Printer Ink & Toner", rate: "₹3,200.00", preferredVendor: "PrintHouse Ltd", commodityCode: "32151100", createdAt: "Jan 25, 2026", status: "Active" },
  { id: "EX-880005", name: "IT Consumables (Mouse, Keyboard)", rate: "₹1,500.00", preferredVendor: "TechSupply Co", commodityCode: "84716060", createdAt: "Feb 02, 2026", status: "Active" },
  { id: "EX-880006", name: "Pantry & Refreshments", rate: "₹650.00", preferredVendor: "FoodFirst Corp", commodityCode: "21069099", createdAt: "Feb 10, 2026", status: "Hold" },
  { id: "EX-880007", name: "Housekeeping Supplies", rate: "₹950.00", preferredVendor: "Green Facilities", commodityCode: "34029099", createdAt: "Feb 18, 2026", status: "Active" },
  { id: "EX-880008", name: "Heavy Duty Courier Boxes", rate: "₹750.00", preferredVendor: "SwiftCargo", commodityCode: "48191000", createdAt: "Mar 01, 2026", status: "Active" },
  { id: "EX-880009", name: "Ergonomic Office Chairs", rate: "₹8,500.00", preferredVendor: "Office Chairs Corp", commodityCode: "94033000", createdAt: "Mar 10, 2026", status: "Active" },
  { id: "EX-880010", name: "Network Switches & Cables", rate: "₹12,500.00", preferredVendor: "CloudNet Solutions", commodityCode: "85176200", createdAt: "Mar 15, 2026", status: "Hold" },
  { id: "EX-880011", name: "A4 Printing Paper Reams", rate: "₹280.00", preferredVendor: "PrintHouse Ltd", commodityCode: "48025600", createdAt: "Mar 22, 2026", status: "Active" },
  { id: "EX-880012", name: "LED Bulb 15W Pack", rate: "₹480.00", preferredVendor: "Green Facilities", commodityCode: "85395000", createdAt: "Apr 02, 2026", status: "Active" },
  { id: "EX-880013", name: "Wireless Presenter Clicker", rate: "₹1,800.00", preferredVendor: "TechSupply Co", commodityCode: "85437099", createdAt: "Apr 10, 2026", status: "Active" },
  { id: "EX-880014", name: "Hand Sanitizer Dispensers", rate: "₹1,100.00", preferredVendor: "Cleanroom Services", commodityCode: "84248990", createdAt: "Apr 18, 2026", status: "Inactive" },
  { id: "EX-880015", name: "First Aid Box Refills", rate: "₹1,650.00", preferredVendor: "SafeLogistics", commodityCode: "30065000", createdAt: "May 05, 2026", status: "Active" },
];

const filters = [
  { 
    key: "preferredVendor", 
    label: "Preferred Vendor", 
    options: [
      "OfficeMax Pro", "Cleanroom Services", "SafeLogistics", "PrintHouse Ltd", 
      "TechSupply Co", "FoodFirst Corp", "Green Facilities", "SwiftCargo", 
      "Office Chairs Corp", "CloudNet Solutions"
    ] 
  },
  { 
    key: "status", 
    label: "Status", 
    options: ["Active", "Hold", "Inactive"] 
  },
];

interface ItemPageProps {
  highlightId?: string;
}

export function ItemPage({ highlightId }: ItemPageProps) {
  const { openActivity } = useActivity();
  const [items, setItems] = useState(rows);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    if (highlightId) {
      setDetailId(highlightId);
    }
  }, [highlightId]);

  const columns = [
    {
      key: "id", label: "Item ID", mono: true,
      render: (val: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => {
            setDetailId(String(val));
          }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontFamily: "var(--font-mono)",
            color: "#6b8cff", textDecoration: "none", padding: 0,
            textAlign: "left"
          }}
        >
          {String(val)}
        </button>
      ),
    },
    { key: "name", label: "Item Name" },
    { key: "rate", label: "Rate", mono: true },
    { key: "preferredVendor", label: "Preferred Vendor" },
    { key: "commodityCode", label: "Commodity Code", mono: true },
    { key: "createdAt", label: "Created At", mono: true },
    {
      key: "status", label: "Status",
      render: (val: unknown) => (
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: statusColor[String(val)] }}>
          <span className="rounded-full" style={{ width: 6, height: 6, background: statusColor[String(val)], display: "inline-block" }} />
          {String(val)}
        </span>
      ),
    },
  ];

  if (creatingNew) {
    return (
      <NewItemPage
        onClose={() => setCreatingNew(false)}
        onCreate={(newItem) => {
          rows.unshift(newItem);
          setItems([newItem, ...items]);
          setCreatingNew(false);
        }}
      />
    );
  }

  if (detailId) {
    return (
      <ItemDetailPage
        itemId={detailId}
        onClose={() => setDetailId(null)}
      />
    );
  }

  return (
    <ListPage
      title="Items"
      addLabel="New Item"
      columns={columns}
      rows={items}
      filters={filters}
      tableId="item"
      onAdd={() => setCreatingNew(true)}
      titleSlot={<CompanySwitch />}
    />
  );
}
