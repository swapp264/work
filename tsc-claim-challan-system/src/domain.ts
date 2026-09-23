export type YN = 'Y' | 'N';
export type Outcome = 'Pending' | 'Settled' | 'Rejected' | 'Partial';
export type Response = 'Pending' | 'Approved' | 'Reject';
export type Category = 
  | 'Damaged in transit'
  | 'Broken – Mfg defect'
  | 'Missing from package'
  | 'Wrong part shipped'
  | 'DOA – Dead on Arrival'
  | 'Defective – Functional'
  | 'Performance issue'
  | 'Intermittent fault'
  | 'Wear & tear'
  | 'Customer-induced damage'
  | 'Installation error (team)'
  | 'Return for credit';

export type ClaimEventType =
  | 'CLAIM_CREATED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'OEM_CLAIM_RAISED'
  | 'OEM_RESPONSE_RECEIVED'
  | 'GRN_RECEIVED'
  | 'CHALLAN_CREATED'
  | 'DELIVERY_NOTE_CREATED'
  | 'MATERIAL_DISPATCHED'
  | 'FINANCE_CLEARED'
  | 'CAPA_RAISED'
  | 'CLOSING_NOTE_CREATED';

export interface ClaimEvent {
  id: string;
  claimId: string;
  eventType: ClaimEventType;
  eventDate: string;
  status: string;
  referenceNo?: string;
  remarks?: string;
  performedBy: string;
  performedByRole?: string;
  createdAt: string;
  documentId?: string;
}

export type ClaimDocumentType =
  | 'CLAIM_NOTE'
  | 'APPROVAL_NOTE'
  | 'OEM_DOCUMENT'
  | 'GRN'
  | 'DELIVERY_NOTE'
  | 'CHALLAN'
  | 'CREDIT_NOTE'
  | 'FINANCE_NOTE'
  | 'CAPA_EVIDENCE'
  | 'CLOSING_NOTE';

export interface ClaimDocument {
  id: string;
  claimId: string;
  eventId?: string;
  documentType: ClaimDocumentType;
  documentNo?: string;
  documentDate?: string;
  fileName: string;
  fileUrl?: string;
  fileData?: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  previousValue?: string;
  newValue?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadedDate: string;
  status: 'Verified' | 'Pending' | 'Rejected' | 'Required';
  fileSize?: string;
}

export interface Claim {
  id: string;
  claimAgainst: string;
  callNo: string;
  callDate: string;
  claimDate: string;
  claimNo: string;
  brand: string;
  customerName: string;
  model: string;
  serialNo: string;
  partNo: string;
  description: string;
  qty: number;
  importInvoiceNo: string;
  importInvoiceDate: string;
  turelTaxInvoiceNo: string;
  turelTaxInvoiceDate: string;
  installationDate: string;
  category: Category;
  remark: string;
  vendorResponse: Response;
  damagedPartInward: YN;
  damagedPartGRNNo: string;
  damagedPartGRNDate: string;
  newPartAtHO: YN;
  hoGRNNo: string;
  hoGRNDate: string;
  claimChallanNo: string;
  challanDate: string;
  newPartAtBranch: YN;
  branchGRNNo: string;
  branchGRNDate: string;
  turelNewPartOutward: YN;
  customerReceiptDate: string;
  oemClaimNo: string;
  oemClaimDate: string;
  oemSettlementExpected: '' | 'Replacement' | 'Credit Note';
  oemClaimOutcome: Outcome;
  oemReplacementReceived: YN;
  creditNoteVerified: YN;
  inventoryAdjusted: YN;
  financeReceivableCleared: YN;
  localPurchaseExpenseSettled: YN;
  interimOption: '' | 'A' | 'B' | 'C';
  branchTransferRequestNo: string;
  localPO: string;
  localPurchaseGRN: string;
  temporaryLocalPurchaseCost: number | null;
  oemCreditValue: number | null;
  rootCauseBrief: string;
  capaNo: string;
  capaStatus: 'Open' | 'In Progress' | 'Closed' | 'N/A';
  isoClauseRef: string;
  createdAt: string;
  updatedAt: string;
  source: 'DEMO' | 'MANUAL_PILOT' | 'ERP';
  auditLogs?: AuditLog[];
  documents?: DocumentItem[];
  // Extended milestone tracking fields
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedDate?: string;
  approvalRemarks?: string;
  deliveryNoteNo?: string;
  deliveryNoteDate?: string;
  closingNoteNo?: string;
  closingNoteDate?: string;
  closureRemarks?: string;
}

export interface CAPA {
  id: string;
  capaNo: string;
  sourceClaimNo: string;
  dateRaised: string;
  nonconformityDescription: string;
  rootCause5Why: string;
  correctiveAction: string;
  actionOwner: string;
  targetDate: string;
  completionDate: string;
  effectivenessCheckDate: string;
  effectivenessVerified: YN | 'Pending';
  status: 'Open' | 'In Progress' | 'Closed' | 'N/A';
  isoClause: string;
}

export interface Config {
  claimCreationWorkingDays: number;
  oemClaimEntryWorkingDays: number;
  interimSourcingWorkingDays: number;
  oemGRNWorkingDays: number;
  fullClosureCalendarDays: number;
  capaCompletionDays: number;
  approvalRateTarget: number;
  recoveryRateTarget: number;
  breachRateTarget: number;
  mode: 'working' | 'calendar';
}

export const CATEGORIES: Category[] = [
  'Damaged in transit',
  'Broken – Mfg defect',
  'Missing from package',
  'Wrong part shipped',
  'DOA – Dead on Arrival',
  'Defective – Functional',
  'Performance issue',
  'Intermittent fault',
  'Wear & tear',
  'Customer-induced damage',
  'Installation error (team)',
  'Return for credit'
];

export const DEFAULT_CONFIG: Config = {
  claimCreationWorkingDays: 2,
  oemClaimEntryWorkingDays: 1,
  interimSourcingWorkingDays: 3,
  oemGRNWorkingDays: 1,
  fullClosureCalendarDays: 30,
  capaCompletionDays: 30,
  approvalRateTarget: 90,
  recoveryRateTarget: 85,
  breachRateTarget: 10,
  mode: 'working'
};

const catSLA: Partial<Record<Category, number>> = {
  'Damaged in transit': 2,
  'Broken – Mfg defect': 2,
  'Missing from package': 2,
  'Wrong part shipped': 2,
  'DOA – Dead on Arrival': 1,
  'Defective – Functional': 2,
  'Performance issue': 2,
  'Intermittent fault': 2,
  'Installation error (team)': 1
};

export const EVIDENCE_CHECKLIST: Record<Category, string[]> = {
  'Damaged in transit': ['Photo evidence', 'Carrier report'],
  'Broken – Mfg defect': ['Photo / video'],
  'Missing from package': ['Packing list', 'Unboxing photo'],
  'Wrong part shipped': ['Part label photo'],
  'DOA – Dead on Arrival': ['Video of non-operation'],
  'Defective – Functional': ['Diagnostic log'],
  'Performance issue': ['Diagnostic report'],
  'Intermittent fault': ['Diagnostic log ≥3 events'],
  'Wear & tear': ['Service record'],
  'Customer-induced damage': ['Inspection report'],
  'Installation error (team)': ['Technician report'],
  'Return for credit': ['Return authorisation']
};

export function days(a: string, b: string, mode: Config['mode']): number | null {
  if (!a || !b) return null;
  const s = new Date(a + 'T00:00:00Z').getTime(), e = new Date(b + 'T00:00:00Z').getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return null;
  if (mode === 'calendar') return Math.round((e - s) / 86400000);
  let n = 0;
  for (let t = s + 86400000; t <= e; t += 86400000) {
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) n++;
  }
  return n;
}

export function gates(c: Claim) {
  return {
    oemClaimNo: !!c.oemClaimNo,
    replacementOrCreditVerified: c.oemReplacementReceived === 'Y' || c.creditNoteVerified === 'Y',
    inventoryAdjusted: c.inventoryAdjusted === 'Y',
    financeCleared: c.financeReceivableCleared === 'Y' && (c.interimOption !== 'C' || c.localPurchaseExpenseSettled === 'Y')
  };
}

export function blockers(c: Claim) {
  const g = gates(c), b: string[] = [];
  if (!g.oemClaimNo) b.push('Gate 1: OEM Claim Number is missing.');
  if (!g.replacementOrCreditVerified) b.push('Gate 2: OEM replacement via Claim GRN or Finance-verified credit note is missing.');
  if (!g.inventoryAdjusted) b.push('Gate 3: Internal inventory adjustment is not confirmed.');
  if (!g.financeCleared) b.push('Gate 4: Finance settlement has not been confirmed.');
  return b;
}

export function derived(c: Claim, cfg: Config) {
  const g = gates(c), b = blockers(c);
  const eligible = !b.length;
  // Final closure requires all 4 gates to pass AND the formal closing note to be generated
  const closed = eligible && (!!c.closingNoteNo || (c.source === 'DEMO' && c.oemClaimOutcome === 'Settled' && c.financeReceivableCleared === 'Y'));
  
  let status = 'Created';
  if (closed) status = 'Closed';
  else if (eligible) status = 'Closure Eligible (Pending Closing Note)';
  else if (c.capaNo && c.capaStatus !== 'Closed' && c.capaStatus !== 'N/A') status = 'CAPA Raised';
  else if (c.oemClaimOutcome === 'Rejected') status = 'OEM Claim Rejected';
  else if (!c.oemClaimNo) status = 'Created';
  else if (c.oemReplacementReceived === 'Y' || c.creditNoteVerified === 'Y') {
    status = c.newPartAtHO === 'Y' && c.newPartAtBranch !== 'Y' 
      ? 'New Part at Head Office' 
      : c.newPartAtBranch === 'Y' && c.turelNewPartOutward !== 'Y' 
      ? 'New Part at Branch' 
      : 'OEM Settlement Received';
  } else if (c.turelNewPartOutward === 'Y') {
    status = c.customerReceiptDate ? 'OEM Settlement Pending' : 'Material Dispatched';
  } else if (c.interimOption) {
    status = 'In Process – Interim Sourcing';
  } else {
    status = 'OEM Claim Raised';
  }

  const target = catSLA[c.category] ?? null;
  const actual = c.challanDate ? days(c.claimDate, c.challanDate, cfg.mode) : null;
  return {
    status,
    final: closed ? 'Closed' : 'Open',
    g,
    b,
    eligible,
    callStatus: c.customerReceiptDate ? 'Closed' : 'Open',
    claimToChallan: actual,
    callToChallan: c.challanDate ? days(c.callDate, c.challanDate, cfg.mode) : null,
    target,
    sla: actual === null || target === null ? null : actual > target,
    missingEvidence: EVIDENCE_CHECKLIST[c.category] || []
  };
}

export function validate(c: Partial<Claim>, all: Claim[] = [], self?: string) {
  const e: Record<string, string> = {};
  for (const [k, m] of [
    ['callNo', 'Call No. is required'],
    ['callDate', 'Call Date is required'],
    ['claimDate', 'Claim Date is required'],
    ['claimNo', 'Claim No. is required'],
    ['customerName', 'Customer Name is required'],
    ['serialNo', 'Serial No. is required'],
    ['partNo', 'Part No. is required'],
    ['category', 'Claim Category is required']
  ] as const) {
    if (!c[k]) e[k] = m;
  }

  if (c.qty !== undefined && (!(Number(c.qty) > 0) || !Number.isFinite(Number(c.qty)))) {
    e.qty = 'Quantity must be greater than 0';
  }
  if (c.claimNo && all.some(x => x.id !== self && x.claimNo.toLowerCase() === c.claimNo!.toLowerCase())) {
    e.claimNo = 'Duplicate Claim No.';
  }
  if (c.callDate && c.claimDate && c.claimDate < c.callDate) {
    e.claimDate = 'Claim Date cannot precede Call Date';
  }
  if (c.claimDate && c.challanDate && c.challanDate < c.claimDate) {
    e.challanDate = 'Challan Date cannot precede Claim Date';
  }
  if (c.challanDate && c.customerReceiptDate && c.customerReceiptDate < c.challanDate) {
    e.customerReceiptDate = 'Customer Receipt Date cannot precede Challan Date';
  }
  if (c.interimOption && !c.oemClaimNo) {
    e.interimOption = 'OEM-first control: OEM Claim No. is required before interim sourcing can be initiated.';
  }
  if (c.turelNewPartOutward === 'Y' && !c.oemClaimNo) {
    e.turelNewPartOutward = 'OEM-first control: OEM Claim No. is mandatory before replacement outward';
  }
  return e;
}
