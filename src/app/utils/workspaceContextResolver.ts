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
