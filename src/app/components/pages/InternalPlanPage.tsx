import { useState } from "react";
import { ListPage } from "./ListPage";
import { CompanySwitch } from "../CompanySwitch";
import { InternalPlanDetailPage } from "./InternalPlanDetailPage";

const statusColor: Record<string, string> = {
  Active: "#4ade80",
  Pending: "#fbbf24",
  Rejected: "#f87171"
};

// 15 mock records to support list behavior, search, filters, and pagination
export const rows = [
  { id: "PE0226270000005", orgName: "ABC Chemicals Ltd", date: "11-07-2026", vendorId: "VI0477", vendorName: "ABC Chemicals Ltd", status: "Active" },
  { id: "PE0226270000004", orgName: "Demo Industrial Works Pvt Ltd", date: "10-07-2026", vendorId: "VI0102", vendorName: "TechSupply Co", status: "Active" },
  { id: "PE0226270000003", orgName: "Global BioPharma Ingredients Inc.", date: "08-07-2026", vendorId: "VI0205", vendorName: "Global BioPharma Ingredients Inc.", status: "Pending" },
  { id: "PE0226270000002", orgName: "HealthLogistics Pvt Ltd", date: "05-07-2026", vendorId: "VI0308", vendorName: "HealthLogistics Pvt Ltd", status: "Active" },
  { id: "PE0226270000001", orgName: "EuroLab Compliance Services GmbH", date: "01-07-2026", vendorId: "VI0412", vendorName: "EuroLab Compliance Services GmbH", status: "Active" },
  { id: "PE0226270000010", orgName: "Demo Industrial Works Pvt Ltd", date: "28-06-2026", vendorId: "VI0089", vendorName: "OfficeMax Pro", status: "Rejected" },
  { id: "PE0226270000009", orgName: "ABC Chemicals Ltd", date: "25-06-2026", vendorId: "VI0477", vendorName: "ABC Chemicals Ltd", status: "Active" },
  { id: "PE0226270000008", orgName: "Global BioPharma Ingredients Inc.", date: "22-06-2026", vendorId: "VI0114", vendorName: "Cleanroom Services", status: "Active" },
  { id: "PE0226270000007", orgName: "HealthLogistics Pvt Ltd", date: "18-06-2026", vendorId: "VI0308", vendorName: "HealthLogistics Pvt Ltd", status: "Pending" },
  { id: "PE0226270000006", orgName: "EuroLab Compliance Services GmbH", date: "15-06-2026", vendorId: "VI0412", vendorName: "EuroLab Compliance Services GmbH", status: "Active" },
  { id: "PE0226270000015", orgName: "Demo Industrial Works Pvt Ltd", date: "10-06-2026", vendorId: "VI0501", vendorName: "Green Facilities", status: "Active" },
  { id: "PE0226270000014", orgName: "ABC Chemicals Ltd", date: "05-06-2026", vendorId: "VI0223", vendorName: "PrintHouse Ltd", status: "Active" },
  { id: "PE0226270000013", orgName: "Global BioPharma Ingredients Inc.", date: "01-06-2026", vendorId: "VI0205", vendorName: "Global BioPharma Ingredients Inc.", status: "Pending" },
  { id: "PE0226270000012", orgName: "HealthLogistics Pvt Ltd", date: "28-05-2026", vendorId: "VI0612", vendorName: "SafeLogistics", status: "Active" },
  { id: "PE0226270000011", orgName: "EuroLab Compliance Services GmbH", date: "20-05-2026", vendorId: "VI0789", vendorName: "SwiftCargo", status: "Active" },
];

const filters = [
  {
    key: "orgName",
    label: "Organization",
    options: [
      "ABC Chemicals Ltd",
      "Demo Industrial Works Pvt Ltd",
      "Global BioPharma Ingredients Inc.",
      "HealthLogistics Pvt Ltd",
      "EuroLab Compliance Services GmbH"
    ]
  },
  {
    key: "status",
    label: "Status",
    options: ["Active", "Pending", "Rejected"]
  },
  {
    key: "vendorName",
    label: "Vendor",
    options: [
      "ABC Chemicals Ltd",
      "Cleanroom Services",
      "EuroLab Compliance Services GmbH",
      "Global BioPharma Ingredients Inc.",
      "Green Facilities",
      "HealthLogistics Pvt Ltd",
      "OfficeMax Pro",
      "PrintHouse Ltd",
      "SafeLogistics",
      "SwiftCargo",
      "TechSupply Co"
    ]
  }
];

export function InternalPlanPage() {
  const [items] = useState<any[]>(rows);
  const [detailRecord, setDetailRecord] = useState<any | null>(null);

  const columns = [
    {
      key: "id",
      label: "IP Number",
      mono: true,
      render: (val: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => {
            setDetailRecord(row);
          }}
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
            fontWeight: 500
          }}
        >
          {String(val)}
        </button>
      ),
    },
    { key: "orgName", label: "Organization Name" },
    { key: "date", label: "Date", mono: true },
    { key: "vendorId", label: "Vendor ID", mono: true },
    { key: "vendorName", label: "Vendor Name" },
    {
      key: "status",
      label: "Status",
      render: (val: unknown) => (
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: statusColor[String(val)] || statusColor.Active }}>
          <span className="rounded-full" style={{ width: 6, height: 6, background: statusColor[String(val)] || statusColor.Active, display: "inline-block" }} />
          {String(val)}
        </span>
      ),
    },
  ];

  if (detailRecord) {
    return (
      <InternalPlanDetailPage
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    );
  }

  return (
    <ListPage
      title="Internal Plan"
      addLabel="New Plan"
      columns={columns}
      rows={items}
      filters={filters}
      tableId="internal_plan"
      onAdd={() => alert("Internal Plan creation is not in scope for this phase.")}
      titleSlot={<CompanySwitch />}
    />
  );
}
