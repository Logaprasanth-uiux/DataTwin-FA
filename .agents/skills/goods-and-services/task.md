# Tasks - Goods and Services List and Detail Page Implementation

- [x] Navigation Sidebar Integration
  - [x] Import `ClipboardCheck` icon in `Sidebar.tsx`
  - [x] Add `{ icon: ClipboardCheck, label: "Goods and Services" }` to `documentsNav` in `Sidebar.tsx`

- [x] App Router Page Registration
  - [x] Import `GoodsAndServicesPage` in `App.tsx`
  - [x] Add `"Goods and Services": "Goods and Services"` to `pageTitles` in `App.tsx`
  - [x] Add `"Goods and Services"` to `isListPage` and header company switch ornaments list in `App.tsx`
  - [x] Add case `"Goods and Services"` in `renderContent()` of `App.tsx` and forward `highlightId`

- [x] ListPage modifications & responsive table behaviors
  - [x] Update `tableId` type in `ListPageProps` interface of `ListPage.tsx` to include `"goods_services"`
  - [x] Update `recordType` mapping to return `"Goods and Services"` when title matches `"Goods and Services"`
  - [x] Implement responsive column progressive hiding for `"goods_services"` in `ListPage.tsx`
  - [x] Ensure Vendor Name wrapping, truncation/ellipsis, and responsive max-width are applied on compact widths

- [x] Context Resolution & Empty State registrations
  - [x] Implement case mapping for `"Goods and Services"` in `workspaceContextResolver.ts`
  - [x] Add `"goods and services"` case to empty state message and examples in `AIAssistant.tsx`

- [x] Create GoodsAndServicesPage component (`GoodsAndServicesPage.tsx`)
  - [x] Define columns: GRN/SRN Number, Linked PO, Vendor ID, Vendor Name, Invoice Ref, Status, Invoice Date, Document Type, Activity
  - [x] Set up 15 mock records with `Load More` pagination support
  - [x] Set up filters: Vendor, Status, Document Type
  - [x] Add state `detailId` to open `GoodsAndServicesDetailPage`
  - [x] Hook up `creatingNew` state to open `GoodsAndServicesNewReceiptPage`

- [x] Create GoodsAndServicesDetailPage component (`GoodsAndServicesDetailPage.tsx`)
  - [x] Design header structure matching Bill Detail Page showing GRN/SRN number, Vendor, and Status Badge
  - [x] Render action button group (Validate, Activate) alongside checkbox Deduct TDS control
  - [x] Setup 5-tab selector (Goods & Services Info, Entries Item, Cost Allocation, Journal, Workflow)
  - [x] Setup select fields (Receiver w/ Tax Reg., Sender Name / Tax Reg., and Doc information select options)
  - [x] Refine **Entries Item** tab to render expandable/collapsible line item cards matching Bill Billing Summary pattern (no horizontal scrollbar)
  - [x] Refine **Journal** tab to render expandable/collapsible accordion cards matching Entries Item card styling (no horizontal scrollbar)
  - [x] Setup Cost Allocation and Journal records (3 pharmaceutical rows)
  - [x] Setup Workflow table and Actions: Approve, Reset, and Rejection Modal backdrop popup with reason validation
  - [x] Setup mount effect establishing selected receipt context to AI Workspace and unmount cleanup clearing context

- [x] Create GoodsAndServicesNewReceiptPage component (`GoodsAndServicesNewReceiptPage.tsx`)
  - [x] Render header matching New Item/Vendor (Draft status, Cancel/Create actions)
  - [x] Implement Goods & Services Entries Info Card (Receiver & Sender details)
  - [x] Implement Document Information Card
  - [x] Implement Charges & Currency Card
  - [x] Implement Goods & Services Entries Item Card (Accordion list, + Add Item, Remove buttons)
  - [x] Connect Item ID selector to Item Master lookup data (populates Item Name and Rate automatically)
  - [x] Hook up Create Receipt handler, validation checks, unshifting to `rows` array and redirecting to List Page
