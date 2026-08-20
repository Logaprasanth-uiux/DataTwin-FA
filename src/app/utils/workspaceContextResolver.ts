import { ActivityRecord, WorkspaceContextInfo, FinanceMetric, AttentionItem } from "../contexts";

/**
 * Resolves the presentation-friendly workspace context details, highlights,
 * and attention alerts generically from any selected business record.
 */
export function resolveWorkspaceContext(activeRecord: ActivityRecord | null): WorkspaceContextInfo | null {
  if (!activeRecord) return null;
  const { type, id, status = "Active" } = activeRecord;
  const cleanId = id.trim();
  const metadata: { label: string; value: string }[] = [];
  const highlights: FinanceMetric[] = [];
  const attentionItems: AttentionItem[] = [];

  if (type === "Bill" || cleanId.startsWith("INV-") || cleanId.startsWith("Bill-")) {
    let vendor = "Supplier Vendor";
    let amount = "₹85,000.00";
    let dueDate = "Aug 10, 2026";
    let isMatched = true;
    let isApproved = true;

    if (cleanId === "INV-2026-001" || cleanId === "Bill-2026-001") {
      vendor = "TechSupply Co";
      amount = "₹4,80,000.00";
      dueDate = "Jul 15, 2026";
      isMatched = true;
      isApproved = true;
    } else if (cleanId === "INV-2026-002" || cleanId === "Bill-2026-002") {
      vendor = "OfficeMax Pro";
      amount = "₹1,25,000.00";
      dueDate = "Jul 18, 2026";
      isMatched = false;
      isApproved = false;
    } else if (cleanId === "INV-2026-003") {
      vendor = "CloudNet Solutions";
      amount = "₹6,56,000.00";
      dueDate = "Jul 20, 2026";
      isMatched = true;
      isApproved = false;
    } else if (cleanId === "INV-2026-004") {
      vendor = "Green Facilities";
      amount = "₹3,40,000.00";
      dueDate = "Jul 22, 2026";
      isMatched = true;
      isApproved = true;
    } else if (cleanId === "INV-2026-005") {
      vendor = "SafeLogistics";
      amount = "₹95,000.00";
      dueDate = "Jul 25, 2026";
      isMatched = false;
      isApproved = false;
    } else if (cleanId === "INV-2026-006") {
      vendor = "TechSupply Co";
      amount = "₹4,00,000.00";
      dueDate = "Jul 28, 2026";
      isMatched = true;
      isApproved = true;
    } else if (cleanId === "INV-2026-007") {
      vendor = "SwiftCargo";
      amount = "₹1,80,000.00";
      dueDate = "Jul 30, 2026";
      isMatched = true;
      isApproved = false;
    }

    metadata.push({ label: "Vendor", value: vendor });
    metadata.push({ label: "Amount", value: amount });
    metadata.push({ label: "Due Date", value: dueDate });

    // Populate Highlights
    highlights.push({
      title: "Matching Status",
      value: isMatched ? "Matched" : "Variance Found",
      icon: "🧩",
      severity: isMatched ? "success" : "warning",
    });
    highlights.push({
      title: "Approval Status",
      value: isApproved ? "Approved" : "Pending",
      icon: "⏳",
      severity: isApproved ? "success" : "warning",
    });
    highlights.push({
      title: "Payment Status",
      value: status === "Rejected" ? "Rejected" : (isApproved ? "Unpaid" : "On Hold"),
      icon: "💳",
      severity: status === "Rejected" ? "error" : (isApproved ? "info" : "warning"),
    });

    // Populate Attention Items
    if (!isMatched) {
      attentionItems.push({
        severity: "warning",
        title: "Matching Variance Found",
        description: "Quantity discrepancy identified between Bill and Purchase Order items.",
        suggestedAction: "Show matching issues",
      });
    }
    if (!isApproved) {
      attentionItems.push({
        severity: "info",
        title: "Approval Required",
        description: "Requires final reviewer confirmation before invoice can be scheduled for payment.",
        suggestedAction: "Explain approval status",
      });
    }
    if (status === "Rejected") {
      attentionItems.push({
        severity: "error",
        title: "Bill Rejected",
        description: "This invoice was rejected by accounts manager. Audit trail notes bank validation failures.",
      });
    }

    return { type: "Bill", id, status: status || "Received", metadata, highlights, attentionItems };
  }

  if (type === "Purchase Order" || cleanId.startsWith("PO-")) {
    let vendor = "Procurement Partner";
    let amount = "₹2,50,000.00";
    let expectedDate = "Jun 30, 2026";

    if (cleanId === "PO-2026-001") {
      vendor = "TechSupply Co";
      amount = "₹4,80,000.00";
      expectedDate = "Jun 30, 2026";
    } else if (cleanId === "PO-2026-002") {
      vendor = "OfficeMax Pro";
      amount = "₹1,25,000.00";
      expectedDate = "Jul 05, 2026";
    } else if (cleanId === "PO-2026-003") {
      vendor = "CloudNet Solutions";
      amount = "₹6,40,000.00";
      expectedDate = "Jul 10, 2026";
    } else if (cleanId === "PO-2026-005") {
      vendor = "Mimecast";
      amount = "₹81,000.00";
      expectedDate = "Jul 15, 2026";
    } else if (cleanId === "PO-2026-006") {
      vendor = "Office Chairs Corp";
      amount = "₹4,00,000.00";
      expectedDate = "Jul 18, 2026";
    } else if (cleanId === "PO-2026-007") {
      vendor = "Salesforce / Zoom";
      amount = "₹18,20,000.00";
      expectedDate = "Jul 20, 2026";
    }

    metadata.push({ label: "Vendor", value: vendor });
    metadata.push({ label: "Amount", value: amount });
    metadata.push({ label: "Expected Date", value: expectedDate });

    // Populate Highlights
    highlights.push({
      title: "PO Status",
      value: "Open",
      icon: "📦",
      severity: "success",
    });
    highlights.push({
      title: "Approval Status",
      value: "Approved",
      icon: "✅",
      severity: "success",
    });
    highlights.push({
      title: "Matching Type",
      value: "3-Way Match",
      icon: "🧩",
      severity: "info",
    });

    return { type: "Purchase Order", id, status: status || "Approved", metadata, highlights, attentionItems };
  }

  if (type === "Vendor" || cleanId.startsWith("VND-")) {
    let vendor = "Partner Vendor";
    let risk = "Low";
    let onboarded = "Completed";

    if (cleanId === "VND-001") {
      vendor = "TechSupply Co";
      risk = "Low";
      onboarded = "Completed";
    } else if (cleanId === "VND-002") {
      vendor = "OfficeMax Pro";
      risk = "Medium";
      onboarded = "Pending Review";
    }

    metadata.push({ label: "Supplier", value: vendor });
    metadata.push({ label: "Country", value: "India" });
    metadata.push({ label: "Currency", value: "INR (₹)" });

    // Populate Highlights
    highlights.push({
      title: "Risk Profile",
      value: risk,
      icon: "⚠️",
      severity: risk === "Low" ? "success" : "warning",
    });
    highlights.push({
      title: "Onboarding",
      value: onboarded,
      icon: "📋",
      severity: onboarded === "Completed" ? "success" : "warning",
    });
    highlights.push({
      title: "Contracts",
      value: risk === "Low" ? "3 Active" : "1 Active",
      icon: "📜",
      severity: "info",
    });

    if (onboarded !== "Completed") {
      attentionItems.push({
        severity: "warning",
        title: "Missing Tax Documentation",
        description: "Form W-9/10E is required before active transactions can be disbursed.",
        suggestedAction: "Explain onboarding checklist",
      });
    }

    return { type: "Vendor", id, status: status || "Active", metadata, highlights, attentionItems };
  }

  if (type === "Item" || cleanId.startsWith("EX-")) {
    let itemName = "Office Stationery Supplies";
    let rate = "₹450.00";
    let vendor = "OfficeMax Pro";
    let code = "44122000";

    if (cleanId === "EX-880001") {
      itemName = "Office Stationery Supplies";
      rate = "₹450.00";
      vendor = "OfficeMax Pro";
      code = "44122000";
    } else if (cleanId === "EX-880002") {
      itemName = "Cleaning Chemicals & Supplies";
      rate = "₹1,200.00";
      vendor = "Cleanroom Services";
      code = "34022090";
    } else if (cleanId === "EX-880003") {
      itemName = "Safety Gloves & PPE Kit";
      rate = "₹850.00";
      vendor = "SafeLogistics";
      code = "61161000";
    } else if (cleanId === "EX-880004") {
      itemName = "Printer Ink & Toner";
      rate = "₹3,200.00";
      vendor = "PrintHouse Ltd";
      code = "32151100";
    } else if (cleanId === "EX-880005") {
      itemName = "IT Consumables (Mouse, Keyboard)";
      rate = "₹1,500.00";
      vendor = "TechSupply Co";
      code = "84716060";
    } else if (cleanId === "EX-880006") {
      itemName = "Pantry & Refreshments";
      rate = "₹650.00";
      vendor = "FoodFirst Corp";
      code = "21069099";
    } else if (cleanId === "EX-880007") {
      itemName = "Housekeeping Supplies";
      rate = "₹950.00";
      vendor = "Green Facilities";
      code = "34029099";
    } else if (cleanId === "EX-880008") {
      itemName = "Heavy Duty Courier Boxes";
      rate = "₹750.00";
      vendor = "SwiftCargo";
      code = "48191000";
    } else if (cleanId === "EX-880009") {
      itemName = "Ergonomic Office Chairs";
      rate = "₹8,500.00";
      vendor = "Office Chairs Corp";
      code = "94033000";
    } else if (cleanId === "EX-880010") {
      itemName = "Network Switches & Cables";
      rate = "₹12,500.00";
      vendor = "CloudNet Solutions";
      code = "85176200";
    } else if (cleanId === "EX-880011") {
      itemName = "A4 Printing Paper Reams";
      rate = "₹280.00";
      vendor = "PrintHouse Ltd";
      code = "48025600";
    } else if (cleanId === "EX-880012") {
      itemName = "LED Bulb 15W Pack";
      rate = "₹480.00";
      vendor = "Green Facilities";
      code = "85395000";
    } else if (cleanId === "EX-880013") {
      itemName = "Wireless Presenter Clicker";
      rate = "₹1,800.00";
      vendor = "TechSupply Co";
      code = "85437099";
    } else if (cleanId === "EX-880014") {
      itemName = "Hand Sanitizer Dispensers";
      rate = "₹1,100.00";
      vendor = "Cleanroom Services";
      code = "84248990";
    } else if (cleanId === "EX-880015") {
      itemName = "First Aid Box Refills";
      rate = "₹1,650.00";
      vendor = "SafeLogistics";
      code = "30065000";
    }

    metadata.push({ label: "Item Name", value: itemName });
    metadata.push({ label: "Preferred Vendor", value: vendor });
    metadata.push({ label: "Rate", value: rate });
    metadata.push({ label: "Commodity Code", value: code });

    highlights.push({
      title: "Item Status",
      value: status || "Active",
      icon: "📦",
      severity: "success",
    });

    return { type: "Item", id, status: status || "Active", metadata, highlights, attentionItems };
  }

  if (type === "Goods and Services" || cleanId.startsWith("GSEO")) {
    let grnNumber = cleanId;
    let linkedPo = "PO-2026-001";
    let vendorId = "VND-001";
    let vendorName = "Global BioPharma Ingredients Inc.";
    let invoiceRef = "GBI/CM5";
    let statusVal = status || "Active";
    let docType = "GoodsReceipt";

    if (cleanId === "GSEO226270000041") {
      linkedPo = "PO-2026-041";
      vendorId = "VND-005";
      vendorName = "Global BioPharma Ingredients Inc.";
      invoiceRef = "GBI/CM5";
      docType = "GoodsReceipt";
    } else if (cleanId === "GSEO226270000040") {
      linkedPo = "PO-2026-040";
      vendorId = "VND-002";
      vendorName = "ABC Chemicals Ltd";
      invoiceRef = "ABC/CA1";
      docType = "GoodsReceipt";
    } else if (cleanId === "GSEO226270000039") {
      linkedPo = "PO-2026-039";
      vendorId = "VND-008";
      vendorName = "HealthLogistics Pvt Ltd";
      invoiceRef = "Hea/CL9";
      docType = "ServiceReceipt";
    } else if (cleanId === "GSEO226270000038") {
      linkedPo = "PO-2026-038";
      vendorId = "VND-006";
      vendorName = "EuroLab Compliance Services GmbH";
      invoiceRef = "ECS/CL3";
      docType = "ServiceReceipt";
    } else if (cleanId === "GSEO226270000005") {
      linkedPo = "PO-2026-005";
      vendorId = "VND-012";
      vendorName = "AB Samsung Ltd";
      invoiceRef = "25/262";
      statusVal = "Rejected";
      docType = "GoodsReceipt";
    } else if (cleanId === "GSEO226270000004") {
      linkedPo = "PO-2026-004";
      vendorId = "VND-012";
      vendorName = "AB Samsung Ltd";
      invoiceRef = "25/262";
      statusVal = "Rejected";
      docType = "GoodsReceipt";
    } else if (cleanId === "GSEO226270000003") {
      linkedPo = "PO-2026-003";
      vendorId = "VND-012";
      vendorName = "AB Samsung Ltd";
      invoiceRef = "AB/16789";
      docType = "GoodsReceipt";
    } else if (cleanId === "GSEO226270000001") {
      linkedPo = "PO-2026-001";
      vendorId = "VND-012";
      vendorName = "AB Samsung Ltd";
      invoiceRef = "AB /131010";
      docType = "GoodsReceipt";
    }

    metadata.push({ label: "GRN/SRN Number", value: grnNumber });
    metadata.push({ label: "Linked PO", value: linkedPo });
    metadata.push({ label: "Vendor Name", value: vendorName });
    metadata.push({ label: "Invoice Ref", value: invoiceRef });
    metadata.push({ label: "Document Type", value: docType });

    highlights.push({
      title: "Doc Status",
      value: statusVal,
      icon: "📋",
      severity: statusVal === "Active" ? "success" : statusVal === "Pending" ? "warning" : "danger",
    });

    return { type: "Goods and Services", id, status: statusVal, metadata, highlights, attentionItems };
  }

  // Fallback for other entities
  metadata.push({ label: "Entity Status", value: status });
  highlights.push({
    title: "Entity Status",
    value: status,
    icon: "📋",
    severity: "info",
  });

  return { type, id, status, metadata, highlights, attentionItems };
}
