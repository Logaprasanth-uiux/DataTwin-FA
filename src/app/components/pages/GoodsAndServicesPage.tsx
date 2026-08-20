import { useState, useEffect } from "react";
import { ListPage } from "./ListPage";
import { CompanySwitch } from "../CompanySwitch";
import { useActivity } from "../../contexts";
import { GoodsAndServicesDetailPage } from "./GoodsAndServicesDetailPage";
import { GoodsAndServicesNewReceiptPage } from "./GoodsAndServicesNewReceiptPage";

const statusColor: Record<string, string> = { 
  Active: "#4ade80", 
  Pending: "#fbbf24", 
  Rejected: "#f87171" 
};

// 15 mock records to support list behavior and Load More pagination
export const rows = [
  { id: "GSEO226270000041", linkedPo: "PO-2026-041", vendorId: "VND-005", vendorName: "Global BioPharma Ingredients Inc.", invoiceRef: "GBI/CM5", status: "Active", invoiceDate: "Jun 10, 2026", docType: "GoodsReceipt" },
  { id: "GSEO226270000040", linkedPo: "PO-2026-040", vendorId: "VND-002", vendorName: "ABC Chemicals Ltd", invoiceRef: "ABC/CA1", status: "Active", invoiceDate: "Jun 09, 2026", docType: "GoodsReceipt" },
  { id: "GSEO226270000039", linkedPo: "PO-2026-039", vendorId: "VND-008", vendorName: "HealthLogistics Pvt Ltd", invoiceRef: "Hea/CL9", status: "Active", invoiceDate: "Jun 08, 2026", docType: "ServiceReceipt" },
  { id: "GSEO226270000038", linkedPo: "PO-2026-038", vendorId: "VND-006", vendorName: "EuroLab Compliance Services GmbH", invoiceRef: "ECS/CL3", status: "Active", invoiceDate: "Jun 07, 2026", docType: "ServiceReceipt" },
  { id: "GSEO226270000005", linkedPo: "PO-2026-005", vendorId: "VND-012", vendorName: "AB Samsung Ltd", invoiceRef: "25/262", status: "Rejected", invoiceDate: "Jun 05, 2026", docType: "GoodsReceipt" },
  { id: "GSEO226270000004", linkedPo: "PO-2026-004", vendorId: "VND-012", vendorName: "AB Samsung Ltd", invoiceRef: "25/262", status: "Rejected", invoiceDate: "Jun 04, 2026", docType: "GoodsReceipt" },
  { id: "GSEO226270000003", linkedPo: "PO-2026-003", vendorId: "VND-012", vendorName: "AB Samsung Ltd", invoiceRef: "AB/16789", status: "Active", invoiceDate: "Jun 03, 2026", docType: "GoodsReceipt" },
  { id: "GSEO226270000001", linkedPo: "PO-2026-001", vendorId: "VND-012", vendorName: "AB Samsung Ltd", invoiceRef: "AB /131010", status: "Active", invoiceDate: "Jun 01, 2026", docType: "GoodsReceipt" },
  
  // Additional realistic records to make a total of 15 records
  { id: "GSEO226270000037", linkedPo: "PO-2026-037", vendorId: "VND-003", vendorName: "CloudNet Solutions", invoiceRef: "CNS/IN8", status: "Pending", invoiceDate: "Jun 06, 2026", docType: "ServiceReceipt" },
  { id: "GSEO226270000036", linkedPo: "PO-2026-036", vendorId: "VND-004", vendorName: "Green Facilities", invoiceRef: "GF/BL2", status: "Active", invoiceDate: "Jun 05, 2026", docType: "GoodsReceipt" },
  { id: "GSEO226270000035", linkedPo: "PO-2026-035", vendorId: "VND-001", vendorName: "TechSupply Co", invoiceRef: "TS/2026", status: "Active", invoiceDate: "Jun 04, 2026", docType: "GoodsReceipt" },
  { id: "GSEO226270000034", linkedPo: "PO-2026-034", vendorId: "VND-010", vendorName: "SwiftCargo", invoiceRef: "SC/0981", status: "Active", invoiceDate: "Jun 03, 2026", docType: "ServiceReceipt" },
  { id: "GSEO226270000033", linkedPo: "PO-2026-033", vendorId: "VND-011", vendorName: "NextLevel IT", invoiceRef: "NL/IT9", status: "Active", invoiceDate: "Jun 02, 2026", docType: "ServiceReceipt" },
  { id: "GSEO226270000032", linkedPo: "PO-2026-032", vendorId: "VND-012", vendorName: "AB Samsung Ltd", invoiceRef: "AB/7789", status: "Pending", invoiceDate: "Jun 01, 2026", docType: "GoodsReceipt" },
  { id: "GSEO226270000031", linkedPo: "PO-2026-031", vendorId: "VND-008", vendorName: "HealthLogistics Pvt Ltd", invoiceRef: "Hea/CL5", status: "Active", invoiceDate: "May 28, 2026", docType: "ServiceReceipt" }
];

const filters = [
  { 
    key: "vendorName", 
    label: "Vendor", 
    options: [
      "Global BioPharma Ingredients Inc.", "ABC Chemicals Ltd", "HealthLogistics Pvt Ltd", 
      "EuroLab Compliance Services GmbH", "AB Samsung Ltd", "CloudNet Solutions", 
      "Green Facilities", "TechSupply Co", "SwiftCargo", "NextLevel IT"
    ] 
  },
  { 
    key: "status", 
    label: "Status", 
    options: ["Active", "Pending", "Rejected"] 
  },
  { 
    key: "docType", 
    label: "Document Type", 
    options: ["GoodsReceipt", "ServiceReceipt"] 
  }
];

interface GoodsAndServicesPageProps {
  highlightId?: string;
}

export function GoodsAndServicesPage({ highlightId }: GoodsAndServicesPageProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [items, setItems] = useState<any[]>(rows);

  const handleCreateReceipt = (newRec: any) => {
    rows.unshift(newRec);
    setItems([...rows]);
    setCreatingNew(false);
  };

  useEffect(() => {
    if (highlightId) {
      setDetailId(highlightId);
    }
  }, [highlightId]);

  const columns = [
    {
      key: "id", label: "GRN/SRN Number", mono: true,
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
    {
      key: "linkedPo", label: "Linked PO Number", mono: true,
      render: (val: unknown) => (
        <button
          onClick={() => alert(`Purchase Order "${val}" detail is not in scope for this phase.`)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontFamily: "var(--font-mono)",
            color: "#6b8cff", textDecoration: "none", padding: 0,
            textAlign: "left"
          }}
        >
          {String(val)}
        </button>
      )
    },
    { key: "vendorId", label: "Vendor ID", mono: true },
    { key: "vendorName", label: "Vendor Name" },
    { key: "invoiceRef", label: "Invoice Ref" },
    {
      key: "status", label: "Status",
      render: (val: unknown) => (
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: statusColor[String(val)] }}>
          <span className="rounded-full" style={{ width: 6, height: 6, background: statusColor[String(val)], display: "inline-block" }} />
          {String(val)}
        </span>
      ),
    },
    { key: "invoiceDate", label: "Invoice Date", mono: true },
    { key: "docType", label: "Document Type" }
  ];

  if (detailId) {
    return (
      <GoodsAndServicesDetailPage
        itemId={detailId}
        onClose={() => setDetailId(null)}
      />
    );
  }

  if (creatingNew) {
    return (
      <GoodsAndServicesNewReceiptPage
        onClose={() => setCreatingNew(false)}
        onCreate={handleCreateReceipt}
      />
    );
  }

  return (
    <ListPage
      title="Goods and Services"
      addLabel="New Receipt"
      columns={columns}
      rows={items}
      filters={filters}
      tableId="goods_services"
      onAdd={() => setCreatingNew(true)}
      titleSlot={<CompanySwitch />}
    />
  );
}
