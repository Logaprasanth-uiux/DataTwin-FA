export interface FSCPAttachment {
  name: string;
  size: string;
}

export interface FSCPUploadRecord {
  id: string;
  uploadDate: string;
  company: string;
  prdFrom: string;
  prdTo: string;
  type: string;
  status: 'Completed' | 'Processing' | 'Failed' | 'Draft';
  attachments: FSCPAttachment[];
  createdBy: string;
  lastUpdated: string;
  reportAvailable: boolean;
}

export const initialUploadHistory: FSCPUploadRecord[] = [
  {
    id: "FSCP-2026-000124",
    uploadDate: "04 Jul 2026 10:42 AM",
    company: "Global Holdings Group",
    prdFrom: "01-Jun-2026",
    prdTo: "30-Jun-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "GL_Trial_Balance_Q2_v2.xlsx", size: "2.4 MB" },
      { name: "BS_Reconciliation_Ledger.csv", size: "1.1 MB" },
      { name: "AP_Subledger_Extract.csv", size: "850 KB" }
    ],
    createdBy: "Sarah Jenkins",
    lastUpdated: "04 Jul 2026 10:45 AM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000123",
    uploadDate: "03 Jul 2026 02:15 PM",
    company: "North America Operations",
    prdFrom: "01-Jun-2026",
    prdTo: "30-Jun-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "NA_Close_Ledger_Final.xlsx", size: "4.8 MB" },
      { name: "Tax_Provision_Summary.pdf", size: "1.5 MB" }
    ],
    createdBy: "Michael Chang",
    lastUpdated: "03 Jul 2026 02:18 PM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000122",
    uploadDate: "02 Jul 2026 09:30 AM",
    company: "Europe Finance Group",
    prdFrom: "01-Jun-2026",
    prdTo: "30-Jun-2026",
    type: "Monthly Close",
    status: "Failed",
    attachments: [
      { name: "EU_Consolidated_TB_Draft.xlsx", size: "3.2 MB" }
    ],
    createdBy: "Emma Larsson",
    lastUpdated: "02 Jul 2026 09:32 AM",
    reportAvailable: false
  },
  {
    id: "FSCP-2026-000121",
    uploadDate: "01 Jul 2026 04:55 PM",
    company: "APAC Shared Services",
    prdFrom: "01-Jun-2026",
    prdTo: "30-Jun-2026",
    type: "Monthly Close",
    status: "Processing",
    attachments: [
      { name: "APAC_SBU_Subledger_TB.csv", size: "5.1 MB" },
      { name: "Bank_Reconciliation_APAC.xlsx", size: "1.9 MB" },
      { name: "FX_Gain_Loss_Calculation.xlsx", size: "720 KB" }
    ],
    createdBy: "Kenji Sato",
    lastUpdated: "01 Jul 2026 04:55 PM",
    reportAvailable: false
  },
  {
    id: "FSCP-2026-000120",
    uploadDate: "30 Jun 2026 11:20 AM",
    company: "Fabrikam Retail",
    prdFrom: "01-Jun-2026",
    prdTo: "30-Jun-2026",
    type: "Close Blockers",
    status: "Completed",
    attachments: [
      { name: "Retail_Store_Closing_Reports.zip", size: "12.4 MB" }
    ],
    createdBy: "John Doe",
    lastUpdated: "30 Jun 2026 11:24 AM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000119",
    uploadDate: "28 Jun 2026 01:10 PM",
    company: "Contoso Manufacturing",
    prdFrom: "01-May-2026",
    prdTo: "31-May-2026",
    type: "Monthly Close",
    status: "Draft",
    attachments: [
      { name: "Inventory_Valuation_Contoso.xlsx", size: "6.2 MB" }
    ],
    createdBy: "Alice Smith",
    lastUpdated: "28 Jun 2026 01:10 PM",
    reportAvailable: false
  },
  {
    id: "FSCP-2026-000118",
    uploadDate: "25 Jun 2026 10:00 AM",
    company: "Global Holdings Group",
    prdFrom: "01-Jan-2026",
    prdTo: "30-Jun-2026",
    type: "Quarter Close",
    status: "Completed",
    attachments: [
      { name: "GH_Consolidated_Balance_Sheet.xlsx", size: "8.5 MB" },
      { name: "GH_Q2_Income_Statement.xlsx", size: "4.2 MB" },
      { name: "Intercompany_Eliminations_Log.xlsx", size: "2.1 MB" }
    ],
    createdBy: "Sarah Jenkins",
    lastUpdated: "25 Jun 2026 10:05 AM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000117",
    uploadDate: "23 Jun 2026 03:40 PM",
    company: "North America Operations",
    prdFrom: "01-May-2026",
    prdTo: "31-May-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "NA_Subledger_AP_AR_May.xlsx", size: "3.7 MB" }
    ],
    createdBy: "Michael Chang",
    lastUpdated: "23 Jun 2026 03:42 PM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000116",
    uploadDate: "20 Jun 2026 08:15 AM",
    company: "Europe Finance Group",
    prdFrom: "01-May-2026",
    prdTo: "31-May-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "EU_Close_Adjustments_May.xlsx", size: "1.8 MB" },
      { name: "VAT_Declaration_Draft.pdf", size: "980 KB" }
    ],
    createdBy: "Emma Larsson",
    lastUpdated: "20 Jun 2026 08:18 AM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000115",
    uploadDate: "18 Jun 2026 12:05 PM",
    company: "APAC Shared Services",
    prdFrom: "01-May-2026",
    prdTo: "31-May-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "APAC_Reconciliation_Ledger_May.xlsx", size: "3.9 MB" }
    ],
    createdBy: "Kenji Sato",
    lastUpdated: "18 Jun 2026 12:08 PM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000114",
    uploadDate: "15 Jun 2026 02:30 PM",
    company: "Fabrikam Retail",
    prdFrom: "01-May-2026",
    prdTo: "31-May-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "Store_Sales_Reconciliation.csv", size: "8.2 MB" },
      { name: "Inventory_Shrinkage_Report.xlsx", size: "1.1 MB" }
    ],
    createdBy: "John Doe",
    lastUpdated: "15 Jun 2026 02:33 PM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000113",
    uploadDate: "12 Jun 2026 09:45 AM",
    company: "Contoso Manufacturing",
    prdFrom: "01-May-2026",
    prdTo: "31-May-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "Manufacturing_OH_Allocation.xlsx", size: "2.9 MB" }
    ],
    createdBy: "Alice Smith",
    lastUpdated: "12 Jun 2026 09:47 AM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000112",
    uploadDate: "10 Jun 2026 04:15 PM",
    company: "Global Holdings Group",
    prdFrom: "01-May-2026",
    prdTo: "31-May-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "GH_Consolidated_TB_May.xlsx", size: "4.5 MB" }
    ],
    createdBy: "Sarah Jenkins",
    lastUpdated: "10 Jun 2026 04:18 PM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000111",
    uploadDate: "08 Jun 2026 11:30 AM",
    company: "North America Operations",
    prdFrom: "01-Apr-2026",
    prdTo: "30-Apr-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "NA_Subledger_TB_April.xlsx", size: "3.5 MB" },
      { name: "Intercompany_Matching_Log_April.xlsx", size: "1.7 MB" }
    ],
    createdBy: "Michael Chang",
    lastUpdated: "08 Jun 2026 11:33 AM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000110",
    uploadDate: "05 Jun 2026 03:00 PM",
    company: "Europe Finance Group",
    prdFrom: "01-Apr-2026",
    prdTo: "30-Apr-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "EU_Close_Adjustments_April.xlsx", size: "1.6 MB" }
    ],
    createdBy: "Emma Larsson",
    lastUpdated: "05 Jun 2026 03:02 PM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000109",
    uploadDate: "03 Jun 2026 10:10 AM",
    company: "APAC Shared Services",
    prdFrom: "01-Apr-2026",
    prdTo: "30-Apr-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "APAC_Reconciliation_Ledger_April.xlsx", size: "3.8 MB" }
    ],
    createdBy: "Kenji Sato",
    lastUpdated: "03 Jun 2026 10:13 AM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000108",
    uploadDate: "01 Jun 2026 01:50 PM",
    company: "Fabrikam Retail",
    prdFrom: "01-Apr-2026",
    prdTo: "30-Apr-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "Store_Sales_Reconciliation_April.csv", size: "7.9 MB" }
    ],
    createdBy: "John Doe",
    lastUpdated: "01 Jun 2026 01:52 PM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000107",
    uploadDate: "28 May 2026 09:20 AM",
    company: "Contoso Manufacturing",
    prdFrom: "01-Apr-2026",
    prdTo: "30-Apr-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "Manufacturing_OH_Allocation_April.xlsx", size: "2.8 MB" }
    ],
    createdBy: "Alice Smith",
    lastUpdated: "28 May 2026 09:22 AM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000106",
    uploadDate: "25 May 2026 02:40 PM",
    company: "Global Holdings Group",
    prdFrom: "01-Apr-2026",
    prdTo: "30-Apr-2026",
    type: "Monthly Close",
    status: "Completed",
    attachments: [
      { name: "GH_Consolidated_TB_April.xlsx", size: "4.4 MB" }
    ],
    createdBy: "Sarah Jenkins",
    lastUpdated: "25 May 2026 02:43 PM",
    reportAvailable: true
  },
  {
    id: "FSCP-2026-000105",
    uploadDate: "22 May 2026 11:15 AM",
    company: "North America Operations",
    prdFrom: "01-Jan-2026",
    prdTo: "31-Mar-2026",
    type: "Quarter Close",
    status: "Completed",
    attachments: [
      { name: "NA_Q1_Reconciliation_Pack.zip", size: "15.4 MB" }
    ],
    createdBy: "Michael Chang",
    lastUpdated: "22 May 2026 11:20 AM",
    reportAvailable: true
  }
];
