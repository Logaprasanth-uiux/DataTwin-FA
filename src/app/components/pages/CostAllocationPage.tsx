import { useState } from "react";
import { ListPage } from "./ListPage";
import { CompanySwitch } from "../CompanySwitch";
import { CostAllocationDetailPage } from "./CostAllocationDetailPage";
import { CostAllocationNewPage } from "./CostAllocationNewPage";

// Mock records representing all 8 valid Cost Allocation Methods across realistic organizations
export const rows = [
  { id: "CA-2026-001", costAllocMethod: "B2B", orgName: "Demo Industrial Works Pvt Ltd", forPeriodFrom: "01-03-2026", forPeriodTo: "", allocType: "%" },
  { id: "CA-2026-002", costAllocMethod: "Staff-Welfare and Maintenance-Dept", orgName: "Global BioPharma Ingredients Inc.", forPeriodFrom: "01-01-2026", forPeriodTo: "31-12-2026", allocType: "%" },
  { id: "CA-2026-003", costAllocMethod: "Marketing-Dept", orgName: "ABC Chemicals Ltd", forPeriodFrom: "01-04-2026", forPeriodTo: "", allocType: "%" },
  { id: "CA-2026-004", costAllocMethod: "Maintenance-Dept", orgName: "HealthLogistics Pvt Ltd", forPeriodFrom: "15-02-2026", forPeriodTo: "30-06-2026", allocType: "%" },
  { id: "CA-2026-005", costAllocMethod: "B2C", orgName: "EuroLab Compliance Services GmbH", forPeriodFrom: "01-02-2026", forPeriodTo: "", allocType: "%" },
  { id: "CA-2026-006", costAllocMethod: "Staff-Welfare", orgName: "Demo Industrial Works Pvt Ltd", forPeriodFrom: "01-05-2026", forPeriodTo: "31-10-2026", allocType: "%" },
  { id: "CA-2026-007", costAllocMethod: "Admin-Dept", orgName: "Global BioPharma Ingredients Inc.", forPeriodFrom: "01-01-2026", forPeriodTo: "31-12-2026", allocType: "%" },
  { id: "CA-2026-008", costAllocMethod: "Production-Dept", orgName: "ABC Chemicals Ltd", forPeriodFrom: "01-03-2026", forPeriodTo: "30-09-2026", allocType: "%" },
  { id: "CA-2026-009", costAllocMethod: "B2C", orgName: "HealthLogistics Pvt Ltd", forPeriodFrom: "01-04-2026", forPeriodTo: "", allocType: "%" },
  { id: "CA-2026-010", costAllocMethod: "Marketing-Dept", orgName: "EuroLab Compliance Services GmbH", forPeriodFrom: "01-01-2026", forPeriodTo: "31-12-2026", allocType: "%" },
  { id: "CA-2026-011", costAllocMethod: "Maintenance-Dept", orgName: "Demo Industrial Works Pvt Ltd", forPeriodFrom: "15-03-2026", forPeriodTo: "", allocType: "%" },
  { id: "CA-2026-012", costAllocMethod: "Admin-Dept", orgName: "ABC Chemicals Ltd", forPeriodFrom: "01-06-2026", forPeriodTo: "", allocType: "%" },
  { id: "CA-2026-013", costAllocMethod: "Production-Dept", orgName: "Demo Industrial Works Pvt Ltd", forPeriodFrom: "01-02-2026", forPeriodTo: "31-08-2026", allocType: "%" },
  { id: "CA-2026-014", costAllocMethod: "Staff-Welfare", orgName: "HealthLogistics Pvt Ltd", forPeriodFrom: "01-05-2026", forPeriodTo: "", allocType: "%" },
  { id: "CA-2026-015", costAllocMethod: "Staff-Welfare and Maintenance-Dept", orgName: "EuroLab Compliance Services GmbH", forPeriodFrom: "01-01-2026", forPeriodTo: "30-06-2026", allocType: "%" },
  { id: "CA-2026-016", costAllocMethod: "B2B", orgName: "Global BioPharma Ingredients Inc.", forPeriodFrom: "01-03-2026", forPeriodTo: "", allocType: "%" }
];

const filters = [
  { 
    key: "costAllocMethod", 
    label: "Cost Allocation Method", 
    options: [
      "Admin-Dept",
      "B2B",
      "B2C",
      "Maintenance-Dept",
      "Marketing-Dept",
      "Production-Dept",
      "Staff-Welfare",
      "Staff-Welfare and Maintenance-Dept"
    ] 
  },
  {
    key: "orgName",
    label: "Organization",
    options: [
      "Demo Industrial Works Pvt Ltd",
      "Global BioPharma Ingredients Inc.",
      "ABC Chemicals Ltd",
      "HealthLogistics Pvt Ltd",
      "EuroLab Compliance Services GmbH"
    ]
  }
];

export function CostAllocationPage() {
  const [items, setItems] = useState<any[]>(rows);
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const handleCreateAllocation = (newAlloc: any) => {
    rows.unshift(newAlloc);
    setItems([...rows]);
    setCreatingNew(false);
  };

  const columns = [
    {
      key: "costAllocMethod",
      label: "Cost Allocation Method",
      render: (val: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => {
            setDetailRecord(row);
          }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "#6b8cff", textDecoration: "none", padding: 0,
            textAlign: "left", fontWeight: 500
          }}
        >
          {String(val)}
        </button>
      ),
    },
    { key: "orgName", label: "Organization Name" },
    { key: "forPeriodFrom", label: "For Period From", mono: true },
    {
      key: "forPeriodTo",
      label: "For Period To",
      mono: true,
      render: (val: unknown) => (val ? String(val) : "—")
    },
    { key: "allocType", label: "Allocation Type", mono: true }
  ];

  if (creatingNew) {
    return (
      <CostAllocationNewPage
        onClose={() => setCreatingNew(false)}
        onCreate={handleCreateAllocation}
      />
    );
  }

  if (detailRecord) {
    return (
      <CostAllocationDetailPage
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    );
  }

  return (
    <ListPage
      title="Cost Allocation"
      addLabel="New Allocation"
      columns={columns}
      rows={items}
      filters={filters}
      tableId="cost_allocation"
      onAdd={() => setCreatingNew(true)}
      titleSlot={<CompanySwitch />}
    />
  );
}
