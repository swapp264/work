import { Claim, CAPA, ClaimEvent, ClaimDocument, ClaimPart, ClaimPartImage } from './domain';

export const createDemoImageSvg = (label: string, partNo: string, color: string = '#0284c7') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="g_${partNo.replace(/[^a-zA-Z0-9]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="#f1f5f9"/>
    <rect x="12" y="12" width="376" height="276" rx="8" fill="url(#g_${partNo.replace(/[^a-zA-Z0-9]/g, '')})"/>
    <circle cx="200" cy="140" r="65" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="6 4"/>
    <circle cx="200" cy="140" r="12" fill="${color}" fill-opacity="0.3"/>
    <line x1="200" y1="60" x2="200" y2="220" stroke="${color}" stroke-width="1.5" stroke-opacity="0.6"/>
    <line x1="120" y1="140" x2="280" y2="140" stroke="${color}" stroke-width="1.5" stroke-opacity="0.6"/>
    <rect x="25" y="24" width="350" height="36" rx="4" fill="#0f172a" fill-opacity="0.8"/>
    <text x="35" y="47" fill="#38bdf8" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="11" font-weight="700">TSC DEFECT EVIDENCE PHOTOGRAPH</text>
    <text x="362" y="47" fill="#94a3b8" font-family="monospace" font-size="11" font-weight="600" text-anchor="end">${partNo}</text>
    <text x="200" y="145" fill="#f8fafc" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="13" font-weight="600" text-anchor="middle">${label}</text>
    <rect x="25" y="244" width="350" height="32" rx="4" fill="#0f172a" fill-opacity="0.8"/>
    <text x="35" y="264" fill="#cbd5e1" font-family="monospace" font-size="10">ISO 9001:2015 EVIDENCE · VERIFIED</text>
    <text x="362" y="264" fill="#4ade80" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="10" font-weight="700" text-anchor="end">QA INSPECTED</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const demoClaimPartImages: ClaimPartImage[] = [
  {
    id: 'img-demo-001-1',
    claimId: 'claim-demo-001',
    partId: 'part-001-1',
    srNo: 1,
    partNo: 'OIL-TNK-01',
    fileName: 'oil_tank_crack_seam.jpg',
    fileUrl: createDemoImageSvg('Hairline Seam Fracture', 'OIL-TNK-01', '#ef4444'),
    fileSize: '142 KB',
    uploadedBy: 'Technician LDH',
    uploadedAt: '2026-01-16T09:40:00Z',
    remarks: 'Hairline stress fracture along lower reservoir weld seam during unboxing'
  },
  {
    id: 'img-demo-001-2',
    claimId: 'claim-demo-001',
    partId: 'part-001-1',
    srNo: 1,
    partNo: 'OIL-TNK-01',
    fileName: 'oil_tank_oem_stamp.jpg',
    fileUrl: createDemoImageSvg('OEM QA Batch Stamp', 'OIL-TNK-01', '#3b82f6'),
    fileSize: '98 KB',
    uploadedBy: 'Technician LDH',
    uploadedAt: '2026-01-16T09:42:00Z',
    remarks: 'OEM manufacturer inspection QA stamp and batch barcode label'
  },
  {
    id: 'img-demo-001-3',
    claimId: 'claim-demo-001',
    partId: 'part-001-2',
    srNo: 2,
    partNo: 'GSK-TNK-02',
    fileName: 'gasket_tear_defect.jpg',
    fileUrl: createDemoImageSvg('Packaging Pinch Tear', 'GSK-TNK-02', '#f59e0b'),
    fileSize: '115 KB',
    uploadedBy: 'Technician LDH',
    uploadedAt: '2026-01-16T09:45:00Z',
    remarks: 'Upper flange seal torn due to improper carton stacking in transit'
  },
  {
    id: 'img-demo-001-4',
    claimId: 'claim-demo-001',
    partId: 'part-001-4',
    srNo: 4,
    partNo: 'FLT-MESH-01',
    fileName: 'filter_mesh_puncture.jpg',
    fileUrl: createDemoImageSvg('Wire Mesh Puncture', 'FLT-MESH-01', '#ef4444'),
    fileSize: '88 KB',
    uploadedBy: 'Technician LDH',
    uploadedAt: '2026-01-16T09:48:00Z',
    remarks: 'Metal burr puncture on inlet wire screen'
  },
  {
    id: 'img-demo-002-1',
    claimId: 'claim-demo-002',
    partId: 'part-002-1',
    srNo: 1,
    partNo: 'DISP-131B',
    fileName: 'display_panel_dead_pixel.jpg',
    fileUrl: createDemoImageSvg('Dead Pixel Column & Flickering', 'DISP-131B', '#a855f7'),
    fileSize: '210 KB',
    uploadedBy: 'Technician KAN',
    uploadedAt: '2026-02-25T11:20:00Z',
    remarks: 'Vertical pixel line dropout on TC-131B LCD display assembly'
  }
];

const now = '2026-09-20T08:00:00Z';
const base = (x: Partial<Claim>): Claim => ({
  id: crypto.randomUUID(),
  claimAgainst: 'Service call',
  callNo: '',
  callDate: '',
  claimDate: '',
  claimNo: '',
  brand: '',
  customerName: '',
  model: '',
  serialNo: '',
  partNo: '',
  description: '',
  qty: 1,
  importInvoiceNo: '',
  importInvoiceDate: '',
  turelTaxInvoiceNo: '',
  turelTaxInvoiceDate: '',
  installationDate: '',
  category: 'Damaged in transit',
  remark: '',
  vendorResponse: 'Pending',
  damagedPartInward: 'N',
  damagedPartGRNNo: '',
  damagedPartGRNDate: '',
  newPartAtHO: 'N',
  hoGRNNo: '',
  hoGRNDate: '',
  claimChallanNo: '',
  challanDate: '',
  newPartAtBranch: 'N',
  branchGRNNo: '',
  branchGRNDate: '',
  turelNewPartOutward: 'N',
  customerReceiptDate: '',
  oemClaimNo: '',
  oemClaimDate: '',
  oemSettlementExpected: '',
  oemClaimOutcome: 'Pending',
  oemReplacementReceived: 'N',
  creditNoteVerified: 'N',
  inventoryAdjusted: 'N',
  financeReceivableCleared: 'N',
  localPurchaseExpenseSettled: 'Y',
  interimOption: '',
  branchTransferRequestNo: '',
  localPO: '',
  localPurchaseGRN: '',
  temporaryLocalPurchaseCost: null,
  oemCreditValue: null,
  rootCauseBrief: '',
  capaNo: '',
  capaStatus: 'N/A',
  isoClauseRef: 'Cl. 8.7',
  createdAt: now,
  updatedAt: now,
  source: 'DEMO',
  ...x
});

export const demoClaims: Claim[] = [
  // 1. Fully Completed Workflow: CLM-TSC-LDH-TY-25-26-001 (All 4 gates passed & Closed)
  base({
    id: 'claim-demo-001',
    claimAgainst: 'Installation call',
    callNo: 'IC/MUM/25-26/AMC/000145',
    callDate: '2026-01-14',
    claimDate: '2026-01-16',
    claimNo: 'CLM-TSC-LDH-TY-25-26-001',
    brand: 'Typical',
    customerName: 'Anandco Sporting Corporation',
    model: 'GC20606-1',
    serialNo: '21070001',
    partNo: 'OIL-TNK-01',
    description: 'Oil Tank Assembly',
    qty: 1,
    parts: [
      {
        id: 'part-001-1',
        srNo: 1,
        partNo: 'OIL-TNK-01',
        description: 'Oil Tank Assembly',
        qty: 1,
        remarks: 'Transit damage - seam fracture',
        images: [demoClaimPartImages[0], demoClaimPartImages[1]]
      },
      {
        id: 'part-001-2',
        srNo: 2,
        partNo: 'GSK-TNK-02',
        description: 'Silicone Gasket Seal',
        qty: 2,
        remarks: 'Packaging pinch tear on upper seal flange',
        images: [demoClaimPartImages[2]]
      },
      {
        id: 'part-001-3',
        srNo: 3,
        partNo: 'BLT-HEX-M6',
        description: 'Hex Flange Bolt M6x20',
        qty: 4,
        remarks: 'Fasteners missing from transit crate',
        images: []
      },
      {
        id: 'part-001-4',
        srNo: 4,
        partNo: 'FLT-MESH-01',
        description: 'Oil Filter Mesh Screen',
        qty: 1,
        remarks: 'Debris puncture on intake wire screen',
        images: [demoClaimPartImages[3]]
      }
    ],
    category: 'Damaged in transit',
    vendorResponse: 'Approved',
    damagedPartInward: 'Y',
    damagedPartGRNNo: 'GRN-001',
    damagedPartGRNDate: '2026-01-17',
    newPartAtHO: 'Y',
    hoGRNNo: 'GRN-HO-5876',
    hoGRNDate: '2026-02-05',
    claimChallanNo: 'DN2-2627/MUM1003',
    challanDate: '2026-08-19',
    newPartAtBranch: 'Y',
    branchGRNNo: 'GRN-BR-1234',
    branchGRNDate: '2026-08-25',
    turelNewPartOutward: 'Y',
    customerReceiptDate: '2026-09-20',
    oemClaimNo: 'OEM-TY-2425-001',
    oemClaimDate: '2026-01-16',
    oemSettlementExpected: 'Replacement',
    oemClaimOutcome: 'Settled',
    oemReplacementReceived: 'Y',
    creditNoteVerified: 'Y',
    inventoryAdjusted: 'Y',
    financeReceivableCleared: 'Y',
    localPurchaseExpenseSettled: 'Y',
    interimOption: 'A',
    oemCreditValue: 18500,
    capaNo: 'CAPA-001',
    capaStatus: 'Closed',
    isoClauseRef: 'Cl. 8.7 / 10.2',
    approvalStatus: 'Approved',
    approvedBy: 'Swapnil (Service Head)',
    approvedDate: '2026-01-16',
    approvalRemarks: 'Warranty validity verified. Technical evaluation approves OEM submission.',
    deliveryNoteNo: 'DN-TSC-2526-001',
    deliveryNoteDate: '2026-09-20',
    closingNoteNo: 'CN-TSC-2526-001',
    closingNoteDate: '2026-09-20',
    closureRemarks: 'All 4 QMS gates verified. Replacement part delivered, stock adjusted, finance cleared.',
    auditLogs: [
      { id: 'log-101', timestamp: '2026-01-16 09:30:00', user: 'Service Head', action: 'Claim Created', previousValue: 'N/A', newValue: 'Draft Created' },
      { id: 'log-102', timestamp: '2026-01-16 11:15:00', user: 'QMS Auditor', action: 'OEM Claim Number Added', previousValue: 'Empty', newValue: 'OEM-TY-2425-001' },
      { id: 'log-103', timestamp: '2026-01-17 14:00:00', user: 'Stores Manager', action: 'Damaged Part Inward GRN', previousValue: 'N', newValue: 'GRN-001' },
      { id: 'log-104', timestamp: '2026-02-05 16:45:00', user: 'HO Stores', action: 'OEM Replacement Received', previousValue: 'Pending', newValue: 'GRN-HO-5876' },
      { id: 'log-105', timestamp: '2026-08-20 10:20:00', user: 'Finance Officer', action: 'Finance Receivable Cleared', previousValue: 'Pending', newValue: 'Cleared (INR 18,500)' },
      { id: 'log-106', timestamp: '2026-09-20 17:00:00', user: 'QMS Lead', action: 'Claim Closed (All Gates Passed)', previousValue: 'Open', newValue: 'Closed' }
    ],
    documents: [
      { id: 'doc-1', name: 'Inspection_Photos_TransitDamage.pdf', type: 'Photo evidence', uploadedBy: 'Technician LDH', uploadedDate: '2026-01-16', status: 'Verified', fileSize: '2.4 MB' },
      { id: 'doc-2', name: 'OEM_Acknowledgement_OEM-TY-2425-001.pdf', type: 'OEM Correspondence', uploadedBy: 'Service Executive', uploadedDate: '2026-01-16', status: 'Verified', fileSize: '1.1 MB' },
      { id: 'doc-3', name: 'GRN_HO_5876_Scan.pdf', type: 'GRN', uploadedBy: 'Stores HO', uploadedDate: '2026-02-05', status: 'Verified', fileSize: '850 KB' },
      { id: 'doc-4', name: 'Credit_Note_TYP_CN_884.pdf', type: 'Credit Note', uploadedBy: 'Finance Dept', uploadedDate: '2026-08-20', status: 'Verified', fileSize: '520 KB' }
    ]
  }),

  // 2. Blocked Workflow Demo: CLM-TSC-KAN-TY-25-26-001 (Gates 2, 3, 4 incomplete, Closing Note locked)
  base({
    id: 'claim-demo-002',
    claimAgainst: 'Service call',
    callNo: 'SC/MUM/25-26/AMC/000145',
    callDate: '2026-02-25',
    claimDate: '2026-02-27',
    claimNo: 'CLM-TSC-KAN-TY-25-26-001',
    brand: 'Typical',
    customerName: 'Super House Limited',
    model: 'TC-131B 6040HB',
    serialNo: '2102408043',
    partNo: 'DISP-131B',
    description: 'Display Panel Assembly',
    qty: 1,
    parts: [
      {
        id: 'part-002-1',
        srNo: 1,
        partNo: 'DISP-131B',
        description: 'Display Panel Assembly',
        qty: 1,
        remarks: 'Performance issue - dead pixel column and horizontal flickering',
        images: [demoClaimPartImages[4]]
      }
    ],
    category: 'Performance issue',
    vendorResponse: 'Approved',
    newPartAtHO: 'Y',
    claimChallanNo: 'DN2-2627/MUM1004',
    challanDate: '2026-03-28',
    newPartAtBranch: 'Y',
    turelNewPartOutward: 'Y',
    customerReceiptDate: '2026-03-29',
    oemClaimNo: 'OEM-TY-2425-002',
    oemClaimDate: '2026-02-27',
    oemSettlementExpected: 'Credit Note',
    oemClaimOutcome: 'Pending',
    oemReplacementReceived: 'N',
    creditNoteVerified: 'N',
    inventoryAdjusted: 'N',
    financeReceivableCleared: 'N',
    interimOption: 'A',
    branchTransferRequestNo: 'BTR-KAN-004',
    capaNo: 'CAPA-002',
    capaStatus: 'Open',
    isoClauseRef: 'Cl. 8.4 / 10.2',
    approvalStatus: 'Approved',
    approvedBy: 'Swapnil (Service Head)',
    approvedDate: '2026-02-27',
    approvalRemarks: 'Approved for OEM filing. Awaiting vendor replacement / credit note.',
    auditLogs: [
      { id: 'log-201', timestamp: '2026-02-27 10:00:00', user: 'Service Head', action: 'Claim Created', previousValue: 'N/A', newValue: 'Created' },
      { id: 'log-202', timestamp: '2026-02-27 11:30:00', user: 'Service Executive', action: 'OEM Claim Raised', previousValue: 'Empty', newValue: 'OEM-TY-2425-002' },
      { id: 'log-203', timestamp: '2026-03-01 14:20:00', user: 'Operations Executive', action: 'Interim Option A Selected', previousValue: 'None', newValue: 'Option A (Stock Transfer)' },
      { id: 'log-204', timestamp: '2026-03-28 16:00:00', user: 'Logistics Desk', action: 'Challan Generated', previousValue: 'Pending', newValue: 'DN2-2627/MUM1004' }
    ],
    documents: [
      { id: 'doc-201', name: 'DisplayPanel_DiagnosticLog.pdf', type: 'Diagnostic report', uploadedBy: 'Technician KAN', uploadedDate: '2026-02-25', status: 'Verified', fileSize: '3.1 MB' },
      { id: 'doc-202', name: 'OEM_Claim_Filing_Form.pdf', type: 'OEM Correspondence', uploadedBy: 'Service Executive', uploadedDate: '2026-02-27', status: 'Verified', fileSize: '1.4 MB' }
    ]
  }),

  // 3. Early Stage Demo: CLM-TSC-MUM-TY-26-27-003 (Initiated, Pending Approval)
  base({
    id: 'claim-demo-003',
    claimAgainst: 'Installation call',
    callNo: 'SC/MUM/26-27/AMC/000211',
    callDate: '2026-09-10',
    claimDate: '2026-09-10',
    claimNo: 'CLM-TSC-MUM-TY-26-27-003',
    brand: 'Typical',
    customerName: 'Demo Customer Pvt Ltd',
    model: 'TC-900',
    serialNo: 'DEMO-SN-003',
    partNo: 'CTRL-900',
    description: 'Control Module PCB',
    category: 'DOA – Dead on Arrival',
    oemClaimNo: 'OEM-DEMO-003',
    oemClaimDate: '2026-09-10',
    oemSettlementExpected: 'Replacement',
    auditLogs: [
      { id: 'log-301', timestamp: '2026-09-10 09:00:00', user: 'Service Head', action: 'Claim Created', previousValue: 'N/A', newValue: 'Created' },
      { id: 'log-302', timestamp: '2026-09-10 10:30:00', user: 'Service Executive', action: 'OEM Claim Raised', previousValue: 'Empty', newValue: 'OEM-DEMO-003' }
    ],
    documents: [
      { id: 'doc-301', name: 'DOA_Video_Evidence.mp4', type: 'Video of non-operation', uploadedBy: 'Field Tech', uploadedDate: '2026-09-10', status: 'Verified', fileSize: '14.2 MB' }
    ]
  })
];

export const demoCAPA: CAPA[] = [
  {
    id: 'capa-001',
    capaNo: 'CAPA-001',
    sourceClaimNo: 'CLM-TSC-LDH-TY-25-26-001',
    dateRaised: '2026-01-20',
    nonconformityDescription: 'Oil Tank damaged in transit – packaging inadequate.',
    rootCause5Why: 'No packing checklist for heavy assemblies.',
    correctiveAction: 'Develop packing checklist and retrain Stores team.',
    actionOwner: 'QMS Manager',
    targetDate: '2026-02-28',
    completionDate: '2026-02-20',
    effectivenessCheckDate: '2026-03-20',
    effectivenessVerified: 'Y',
    status: 'Closed',
    isoClause: 'Cl. 8.7 / 10.2'
  },
  {
    id: 'capa-002',
    capaNo: 'CAPA-002',
    sourceClaimNo: 'CLM-TSC-KAN-TY-25-26-001',
    dateRaised: '2026-02-28',
    nonconformityDescription: 'Display Panel QC failure at OEM manufacturing site.',
    rootCause5Why: 'Supplier qualification gap and uncalibrated testing rig.',
    correctiveAction: 'Supplier quality review and incoming inspection protocol.',
    actionOwner: 'Purchase Executive',
    targetDate: '2026-03-31',
    completionDate: '',
    effectivenessCheckDate: '2026-04-30',
    effectivenessVerified: 'Pending',
    status: 'Open',
    isoClause: 'Cl. 8.4 / 10.2'
  }
];

// Seed ClaimEvents for the Complete Journey (claim-demo-001) and Blocked Journey (claim-demo-002)
export const demoClaimEvents: ClaimEvent[] = [
  // Events for claim-demo-001 (COMPLETED WORKFLOW)
  {
    id: 'ev-101',
    claimId: 'claim-demo-001',
    eventType: 'CLAIM_CREATED',
    eventDate: '2026-01-16 09:30:00',
    status: 'Created',
    referenceNo: 'CLM-TSC-LDH-TY-25-26-001',
    remarks: 'Warranty ticket registered against service call IC/MUM/25-26/AMC/000145.',
    performedBy: 'Swapnil (Service Head)',
    performedByRole: 'Service Head',
    createdAt: '2026-01-16T09:30:00Z',
    documentId: 'doc-seed-101'
  },
  {
    id: 'ev-102',
    claimId: 'claim-demo-001',
    eventType: 'CLAIM_APPROVED',
    eventDate: '2026-01-16 11:00:00',
    status: 'Approved',
    referenceNo: 'APV-25-26-001',
    remarks: 'Technical verification confirms manufacturing defect in transit. Authorized for OEM filing.',
    performedBy: 'Swapnil (Service Head)',
    performedByRole: 'Service Head',
    createdAt: '2026-01-16T11:00:00Z',
    documentId: 'doc-seed-102'
  },
  {
    id: 'ev-103',
    claimId: 'claim-demo-001',
    eventType: 'OEM_CLAIM_RAISED',
    eventDate: '2026-01-16 14:30:00',
    status: 'OEM Claim Raised',
    referenceNo: 'OEM-TY-2425-001',
    remarks: 'OEM Claim filed with Typical manufacturer with import invoice reference.',
    performedBy: 'Rajesh (Service Executive)',
    performedByRole: 'Service Executive',
    createdAt: '2026-01-16T14:30:00Z',
    documentId: 'doc-seed-103'
  },
  {
    id: 'ev-104',
    claimId: 'claim-demo-001',
    eventType: 'GRN_RECEIVED',
    eventDate: '2026-02-05 16:45:00',
    status: 'Replacement Inwarded',
    referenceNo: 'GRN-HO-5876',
    remarks: 'OEM Replacement Oil Tank assembly inwarded at Head Office Central Stores.',
    performedBy: 'Vikas (Stores In-Charge)',
    performedByRole: 'Central Stores HO',
    createdAt: '2026-02-05T16:45:00Z',
    documentId: 'doc-seed-104'
  },
  {
    id: 'ev-105',
    claimId: 'claim-demo-001',
    eventType: 'CHALLAN_CREATED',
    eventDate: '2026-08-19 11:15:00',
    status: 'Challan Dispatched',
    referenceNo: 'DN2-2627/MUM1003',
    remarks: 'Delivery challan generated for replacement dispatch to Ludhiana Branch / Anandco.',
    performedBy: 'Sanjay (Logistics Desk)',
    performedByRole: 'Logistics Desk',
    createdAt: '2026-08-19T11:15:00Z',
    documentId: 'doc-seed-105'
  },
  {
    id: 'ev-106',
    claimId: 'claim-demo-001',
    eventType: 'DELIVERY_NOTE_CREATED',
    eventDate: '2026-09-20 15:00:00',
    status: 'Delivered to Customer',
    referenceNo: 'DN-TSC-2526-001',
    remarks: 'Replacement part received and acknowledged by customer Anandco Sporting Corp.',
    performedBy: 'Harpreet (Branch Tech LDH)',
    performedByRole: 'Service Technician',
    createdAt: '2026-09-20T15:00:00Z',
    documentId: 'doc-seed-106'
  },
  {
    id: 'ev-107',
    claimId: 'claim-demo-001',
    eventType: 'FINANCE_CLEARED',
    eventDate: '2026-08-20 10:20:00',
    status: 'Finance Cleared',
    referenceNo: 'FSV-25-26-001',
    remarks: 'Finance verified OEM credit note (INR 18,500) and settled account receivables.',
    performedBy: 'Mehul (Finance Controller)',
    performedByRole: 'Finance Controller',
    createdAt: '2026-08-20T10:20:00Z',
    documentId: 'doc-seed-107'
  },
  {
    id: 'ev-108',
    claimId: 'claim-demo-001',
    eventType: 'CAPA_RAISED',
    eventDate: '2026-01-20 10:00:00',
    status: 'CAPA Closed',
    referenceNo: 'CAPA-001',
    remarks: 'CAPA initiated for packaging defect and verified effective.',
    performedBy: 'Pooja (QMS Manager)',
    performedByRole: 'QMS Auditor',
    createdAt: '2026-01-20T10:00:00Z',
    documentId: 'doc-seed-108'
  },
  {
    id: 'ev-109',
    claimId: 'claim-demo-001',
    eventType: 'CLOSING_NOTE_CREATED',
    eventDate: '2026-09-20 17:00:00',
    status: 'Closed',
    referenceNo: 'CN-TSC-2526-001',
    remarks: 'All 4 QMS Gates passed. Formal claim closing certificate issued and archived.',
    performedBy: 'Swapnil (Service Head)',
    performedByRole: 'Service Head',
    createdAt: '2026-09-20T17:00:00Z',
    documentId: 'doc-seed-109'
  },

  // Events for claim-demo-002 (BLOCKED WORKFLOW - Gates 2, 3, 4 incomplete)
  {
    id: 'ev-201',
    claimId: 'claim-demo-002',
    eventType: 'CLAIM_CREATED',
    eventDate: '2026-02-27 10:00:00',
    status: 'Created',
    referenceNo: 'CLM-TSC-KAN-TY-25-26-001',
    remarks: 'Warranty claim initiated for display panel failure at Super House Limited.',
    performedBy: 'Swapnil (Service Head)',
    performedByRole: 'Service Head',
    createdAt: '2026-02-27T10:00:00Z',
    documentId: 'doc-seed-201'
  },
  {
    id: 'ev-202',
    claimId: 'claim-demo-002',
    eventType: 'CLAIM_APPROVED',
    eventDate: '2026-02-27 11:30:00',
    status: 'Approved',
    referenceNo: 'APV-25-26-002',
    remarks: 'Technical report verified. Display malfunction covered under manufacturer warranty.',
    performedBy: 'Swapnil (Service Head)',
    performedByRole: 'Service Head',
    createdAt: '2026-02-27T11:30:00Z',
    documentId: 'doc-seed-202'
  },
  {
    id: 'ev-203',
    claimId: 'claim-demo-002',
    eventType: 'OEM_CLAIM_RAISED',
    eventDate: '2026-02-27 14:00:00',
    status: 'OEM Claim Raised',
    referenceNo: 'OEM-TY-2425-002',
    remarks: 'OEM Claim submitted to Typical vendor for credit note settlement.',
    performedBy: 'Rajesh (Service Executive)',
    performedByRole: 'Service Executive',
    createdAt: '2026-02-27T14:00:00Z',
    documentId: 'doc-seed-203'
  },
  {
    id: 'ev-204',
    claimId: 'claim-demo-002',
    eventType: 'CHALLAN_CREATED',
    eventDate: '2026-03-28 16:00:00',
    status: 'Challan Dispatched',
    referenceNo: 'DN2-2627/MUM1004',
    remarks: 'Interim replacement dispatched from Central Stores under Option A.',
    performedBy: 'Sanjay (Logistics Desk)',
    performedByRole: 'Logistics Desk',
    createdAt: '2026-03-28T16:00:00Z',
    documentId: 'doc-seed-204'
  },
  {
    id: 'ev-205',
    claimId: 'claim-demo-002',
    eventType: 'CAPA_RAISED',
    eventDate: '2026-02-28 09:30:00',
    status: 'CAPA Open',
    referenceNo: 'CAPA-002',
    remarks: 'CAPA raised for vendor manufacturing QC failure.',
    performedBy: 'Pooja (QMS Manager)',
    performedByRole: 'QMS Auditor',
    createdAt: '2026-02-28T09:30:00Z',
    documentId: 'doc-seed-205'
  }
];

// Seed ClaimDocuments corresponding to milestones
export const demoClaimDocuments: ClaimDocument[] = [
  // Documents for claim-demo-001 (COMPLETED)
  {
    id: 'doc-seed-101',
    claimId: 'claim-demo-001',
    eventId: 'ev-101',
    documentType: 'CLAIM_NOTE',
    documentNo: 'CIS-25-26-001',
    documentDate: '2026-01-16',
    fileName: 'Intimation_CLM-TSC-LDH-TY-25-26-001.pdf',
    uploadedBy: 'Service Desk',
    uploadedAt: '2026-01-16T09:30:00Z',
    fileSize: '42 KB'
  },
  {
    id: 'doc-seed-102',
    claimId: 'claim-demo-001',
    eventId: 'ev-102',
    documentType: 'APPROVAL_NOTE',
    documentNo: 'APV-25-26-001',
    documentDate: '2026-01-16',
    fileName: 'Approval_CLM-TSC-LDH-TY-25-26-001.pdf',
    uploadedBy: 'Swapnil (Service Head)',
    uploadedAt: '2026-01-16T11:00:00Z',
    fileSize: '45 KB'
  },
  {
    id: 'doc-seed-103',
    claimId: 'claim-demo-001',
    eventId: 'ev-103',
    documentType: 'OEM_DOCUMENT',
    documentNo: 'OEM-TY-2425-001',
    documentDate: '2026-01-16',
    fileName: 'OEM_Claim_OEM-TY-2425-001.pdf',
    uploadedBy: 'Service Executive',
    uploadedAt: '2026-01-16T14:30:00Z',
    fileSize: '48 KB'
  },
  {
    id: 'doc-seed-104',
    claimId: 'claim-demo-001',
    eventId: 'ev-104',
    documentType: 'GRN',
    documentNo: 'GRN-HO-5876',
    documentDate: '2026-02-05',
    fileName: 'GRN_GRN-HO-5876.pdf',
    uploadedBy: 'Stores HO',
    uploadedAt: '2026-02-05T16:45:00Z',
    fileSize: '44 KB'
  },
  {
    id: 'doc-seed-105',
    claimId: 'claim-demo-001',
    eventId: 'ev-105',
    documentType: 'CHALLAN',
    documentNo: 'DN2-2627/MUM1003',
    documentDate: '2026-08-19',
    fileName: 'Challan_DN2-2627-MUM1003.pdf',
    uploadedBy: 'Logistics Desk',
    uploadedAt: '2026-08-19T11:15:00Z',
    fileSize: '46 KB'
  },
  {
    id: 'doc-seed-106',
    claimId: 'claim-demo-001',
    eventId: 'ev-106',
    documentType: 'DELIVERY_NOTE',
    documentNo: 'DN-TSC-2526-001',
    documentDate: '2026-09-20',
    fileName: 'Delivery_Note_CLM-TSC-LDH-TY-25-26-001.pdf',
    uploadedBy: 'Technician LDH',
    uploadedAt: '2026-09-20T15:00:00Z',
    fileSize: '43 KB'
  },
  {
    id: 'doc-seed-107',
    claimId: 'claim-demo-001',
    eventId: 'ev-107',
    documentType: 'FINANCE_NOTE',
    documentNo: 'FSV-25-26-001',
    documentDate: '2026-08-20',
    fileName: 'Finance_Clearance_CLM-TSC-LDH-TY-25-26-001.pdf',
    uploadedBy: 'Finance Controller',
    uploadedAt: '2026-08-20T10:20:00Z',
    fileSize: '44 KB'
  },
  {
    id: 'doc-seed-108',
    claimId: 'claim-demo-001',
    eventId: 'ev-108',
    documentType: 'CAPA_EVIDENCE',
    documentNo: 'CAPA-001',
    documentDate: '2026-01-20',
    fileName: 'CAPA_Report_CAPA-001.pdf',
    uploadedBy: 'QMS Manager',
    uploadedAt: '2026-01-20T10:00:00Z',
    fileSize: '51 KB'
  },
  {
    id: 'doc-seed-109',
    claimId: 'claim-demo-001',
    eventId: 'ev-109',
    documentType: 'CLOSING_NOTE',
    documentNo: 'CN-TSC-2526-001',
    documentDate: '2026-09-20',
    fileName: 'Closing_Note_CLM-TSC-LDH-TY-25-26-001.pdf',
    uploadedBy: 'Swapnil (Service Head)',
    uploadedAt: '2026-09-20T17:00:00Z',
    fileSize: '54 KB'
  },

  // Documents for claim-demo-002 (BLOCKED)
  {
    id: 'doc-seed-201',
    claimId: 'claim-demo-002',
    eventId: 'ev-201',
    documentType: 'CLAIM_NOTE',
    documentNo: 'CIS-25-26-002',
    documentDate: '2026-02-27',
    fileName: 'Intimation_CLM-TSC-KAN-TY-25-26-001.pdf',
    uploadedBy: 'Service Desk',
    uploadedAt: '2026-02-27T10:00:00Z',
    fileSize: '42 KB'
  },
  {
    id: 'doc-seed-202',
    claimId: 'claim-demo-002',
    eventId: 'ev-202',
    documentType: 'APPROVAL_NOTE',
    documentNo: 'APV-25-26-002',
    documentDate: '2026-02-27',
    fileName: 'Approval_CLM-TSC-KAN-TY-25-26-001.pdf',
    uploadedBy: 'Swapnil (Service Head)',
    uploadedAt: '2026-02-27T11:30:00Z',
    fileSize: '45 KB'
  },
  {
    id: 'doc-seed-203',
    claimId: 'claim-demo-002',
    eventId: 'ev-203',
    documentType: 'OEM_DOCUMENT',
    documentNo: 'OEM-TY-2425-002',
    documentDate: '2026-02-27',
    fileName: 'OEM_Claim_OEM-TY-2425-002.pdf',
    uploadedBy: 'Service Executive',
    uploadedAt: '2026-02-27T14:00:00Z',
    fileSize: '47 KB'
  },
  {
    id: 'doc-seed-204',
    claimId: 'claim-demo-002',
    eventId: 'ev-204',
    documentType: 'CHALLAN',
    documentNo: 'DN2-2627/MUM1004',
    documentDate: '2026-03-28',
    fileName: 'Challan_DN2-2627-MUM1004.pdf',
    uploadedBy: 'Logistics Desk',
    uploadedAt: '2026-03-28T16:00:00Z',
    fileSize: '46 KB'
  },
  {
    id: 'doc-seed-205',
    claimId: 'claim-demo-002',
    eventId: 'ev-205',
    documentType: 'CAPA_EVIDENCE',
    documentNo: 'CAPA-002',
    documentDate: '2026-02-28',
    fileName: 'CAPA_Report_CAPA-002.pdf',
    uploadedBy: 'Purchase Executive',
    uploadedAt: '2026-02-28T09:30:00Z',
    fileSize: '50 KB'
  },
  // Part Evidence Images linked to claim documents
  ...demoClaimPartImages.map(img => ({
    id: img.id,
    claimId: img.claimId,
    partId: img.partId,
    srNo: img.srNo,
    partNo: img.partNo,
    documentType: 'PART_IMAGE' as const,
    documentNo: `IMG-P${img.srNo}-${img.partNo || 'PART'}`,
    documentDate: img.uploadedAt.substring(0, 10),
    fileName: img.fileName,
    fileUrl: img.fileUrl,
    uploadedBy: img.uploadedBy,
    uploadedAt: img.uploadedAt,
    fileSize: img.fileSize,
    remarks: img.remarks
  }))
];
