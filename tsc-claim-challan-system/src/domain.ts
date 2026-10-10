import { 
  AppUser, 
  canEditServiceSection, 
  canEditInputSection, 
  canEditStoreSection, 
  getUserTeam 
} from './auth';

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
  | 'CLOSING_NOTE'
  | 'PART_IMAGE';

export interface ClaimPartImage {
  id: string;
  claimId: string;
  partId: string;
  srNo: number;
  partNo?: string;
  fileName: string;
  fileUrl: string;
  fileData?: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: string;
  remarks?: string;
}

export interface ClaimPart {
  id: string;
  srNo: number;
  partNo: string;
  description: string;
  qty: number;
  remarks?: string;
  images?: ClaimPartImage[];
  oemDecision?: 'Accepted' | 'Rejected' | 'Pending';
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  partId?: string;
  srNo?: number;
  partNo?: string;
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
  remarks?: string;
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
  branch?: string;
  financialYear?: string;
  brand: string;
  customerName: string;
  model: string;
  serialNo: string;
  partNo: string;
  description: string;
  qty: number;
  parts?: ClaimPart[];
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
  oemSettlementMethod?: '' | 'Replacement' | 'Credit Note';
  oemClaimOutcome: Outcome;
  oemAcceptedParts?: string;
  oemRejectedParts?: string;
  oemReplacementReceived: YN;
  creditNoteVerified: YN;
  inventoryAdjusted: YN;
  financeReceivableCleared: YN;
  localPurchaseExpenseSettled: YN;
  interimOption: '' | 'A' | 'B' | 'C';
  branchTransferRequestNo: string;
  branchTransferBranch?: string;
  localPO: string;
  localPOVendor?: string;
  localPurchaseGRN: string;
  localPurchaseGRNDate?: string;
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
  // Excel Color-Coded Section 4: Automatically Generated Fields
  serviceCallStatusAuto?: 'Open' | 'Closed';
  orgClaimStatusAuto?: 'Open' | 'Closed';
  finalStatusAuto?: string;
  callToChallanDays?: number;
  claimToChallanAgeing?: number;
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

// =============================================================
// TEAM-WISE INPUT PERMISSIONS & AUTOMATIC DERIVATION ENGINE
// Excel Workflow: Service Team -> Input Team -> Store Team -> Yellow Auto
// =============================================================

// Section 1 — Service Team Only (Green / Pale Olive in Excel)
export const SERVICE_TEAM_FIELD_KEYS: (keyof Claim)[] = [
  'claimAgainst',
  'callNo',
  'callDate',
  'claimDate',
  'claimNo',
  'branch',
  'financialYear',
  'brand',
  'customerName',
  'model',
  'serialNo',
  'partNo',
  'description',
  'qty',
  'parts',
  'category',
  'remark',
  'approvalStatus',
  'approvedBy',
  'approvedDate',
  'approvalRemarks'
];

// Section 2 — Input Team Only (Light Blue / Periwinkle in Excel)
export const INPUT_TEAM_FIELD_KEYS: (keyof Claim)[] = [
  'importInvoiceNo',
  'importInvoiceDate',
  'turelTaxInvoiceNo',
  'turelTaxInvoiceDate',
  'installationDate',
  'vendorResponse'
];

// Section 3 — Store Team Only (Light Orange / Peach in Excel)
export const STORE_TEAM_FIELD_KEYS: (keyof Claim)[] = [
  'damagedPartInward',
  'damagedPartGRNNo',
  'damagedPartGRNDate',
  'newPartAtHO',
  'hoGRNNo',
  'hoGRNDate',
  'claimChallanNo',
  'challanDate',
  'newPartAtBranch',
  'branchGRNNo',
  'branchGRNDate',
  'turelNewPartOutward',
  'customerReceiptDate',
  'deliveryNoteNo',
  'deliveryNoteDate',
  'branchTransferRequestNo',
  'branchTransferBranch',
  'localPO',
  'localPOVendor',
  'localPurchaseGRN',
  'localPurchaseGRNDate',
  'temporaryLocalPurchaseCost'
];

// Section 4 — Yellow Section: Automatically Generated Fields
export const AUTO_GENERATED_FIELD_KEYS: (keyof Claim)[] = [
  'serviceCallStatusAuto',
  'orgClaimStatusAuto',
  'finalStatusAuto',
  'callToChallanDays',
  'claimToChallanAgeing'
];

export interface AutoGeneratedFields {
  serviceCallStatusAuto: 'Open' | 'Closed';
  orgClaimStatusAuto: 'Open' | 'Closed';
  finalStatusAuto: string;
  callToChallanDays: number;
  claimToChallanAgeing: number;
}

export function computeAutoFields(
  c: Partial<Claim>,
  mode: 'working' | 'calendar' = 'calendar'
): AutoGeneratedFields {
  // 1. Service/Installation Call Status (Auto): Closed once part delivered/received or outwarded
  const hasReceived = !!(c.customerReceiptDate && c.customerReceiptDate.trim());
  const isOutwarded = c.turelNewPartOutward === 'Y';
  const serviceCallStatusAuto: 'Open' | 'Closed' = (hasReceived || isOutwarded) ? 'Closed' : 'Open';

  // 2. Organization Claim Status (Auto): Closed when all closure gates pass & formal closing note issued
  const isOrgClosed = !!(
    c.closingNoteNo || 
    (c.source === 'DEMO' && c.oemClaimOutcome === 'Settled' && c.financeReceivableCleared === 'Y')
  );
  const orgClaimStatusAuto: 'Open' | 'Closed' = isOrgClosed ? 'Closed' : 'Open';

  // 3. Final Status (Auto)
  let finalStatusAuto = 'Claim Under Process';
  if (c.vendorResponse === 'Approved') {
    if (c.damagedPartInward !== 'Y') {
      finalStatusAuto = 'Approved - Awaiting Damaged Part Inward';
    } else if (c.turelNewPartOutward !== 'Y' || !hasReceived) {
      finalStatusAuto = 'Approved - Awaiting Part Dispatch to Customer';
    } else if (isOrgClosed) {
      finalStatusAuto = 'Approved - Claim Settled';
    } else {
      finalStatusAuto = 'Approved - Awaiting Part Dispatch to Customer';
    }
  } else if (c.vendorResponse === 'Reject' || c.oemClaimOutcome === 'Rejected') {
    finalStatusAuto = 'Claim Rejected';
  } else {
    finalStatusAuto = 'Claim Under Process';
  }

  // 4. call to challan (elapsed calendar days between call date and challan date as per Excel formula)
  let callToChallanDays = 0;
  if (c.callDate && c.challanDate) {
    const elapsed = days(c.callDate, c.challanDate, 'calendar');
    callToChallanDays = elapsed !== null && elapsed >= 0 ? elapsed : 0;
  }

  // 5. claim to challan Ageing (elapsed calendar days between claim date and challan date as per Excel formula)
  let claimToChallanAgeing = 0;
  if (c.claimDate && c.challanDate) {
    const elapsed = days(c.claimDate, c.challanDate, 'calendar');
    claimToChallanAgeing = elapsed !== null && elapsed >= 0 ? elapsed : 0;
  }

  return {
    serviceCallStatusAuto,
    orgClaimStatusAuto,
    finalStatusAuto,
    callToChallanDays,
    claimToChallanAgeing
  };
}

export interface TeamValidationResult {
  allowed: boolean;
  violations: string[];
  sanitized: Claim;
}

export function validateTeamFieldChanges(
  incoming: Claim,
  original: Claim | null,
  user: AppUser | null,
  mode: 'working' | 'calendar' = 'calendar'
): TeamValidationResult {
  const sanitized = { ...incoming };
  const auto = computeAutoFields(incoming, mode);

  // Always enforce auto fields are derived strictly and cannot be manually overridden
  sanitized.serviceCallStatusAuto = auto.serviceCallStatusAuto;
  sanitized.orgClaimStatusAuto = auto.orgClaimStatusAuto;
  sanitized.finalStatusAuto = auto.finalStatusAuto;
  sanitized.callToChallanDays = auto.callToChallanDays;
  sanitized.claimToChallanAgeing = auto.claimToChallanAgeing;

  // New claim creation: Service Team or Management/Admin only
  if (!original) {
    if (!user) {
      return { allowed: false, violations: ['Authentication required to register claims.'], sanitized };
    }
    const canCreate = canEditServiceSection(user);
    if (!canCreate) {
      return {
        allowed: false,
        violations: [`User '${user.name}' (${user.role}, Team: ${user.team || 'Unassigned'}) is not authorized to create initial Service Team claim records.`],
        sanitized
      };
    }
    return { allowed: true, violations: [], sanitized };
  }

  // Claim edits
  if (!user) {
    return { allowed: false, violations: ['Authentication required to modify claims.'], sanitized };
  }

  // System Administrator role has unrestricted access across sections
  if (user.role === 'Admin/ERP') {
    return { allowed: true, violations: [], sanitized };
  }

  const team = getUserTeam(user);
  const violations: string[] = [];
  const canService = canEditServiceSection(user);
  const canInput = canEditInputSection(user);
  const canStore = canEditStoreSection(user);

  const isChanged = (key: keyof Claim) => {
    const origVal = original[key];
    const newVal = incoming[key];
    if (origVal === newVal) return false;
    if ((origVal === null || origVal === undefined || origVal === '') && 
        (newVal === null || newVal === undefined || newVal === '')) {
      return false;
    }
    if (typeof origVal === 'object' || typeof newVal === 'object') {
      return JSON.stringify(origVal) !== JSON.stringify(newVal);
    }
    return origVal !== newVal;
  };

  // If user has no edit permissions for ANY section (e.g. Viewer, Inactive), reject any modifications
  if (!canService && !canInput && !canStore) {
    const modifiedKeys = (Object.keys(incoming) as (keyof Claim)[]).filter(k => 
      !AUTO_GENERATED_FIELD_KEYS.includes(k) && isChanged(k)
    );
    if (modifiedKeys.length > 0) {
      return {
        allowed: false,
        violations: [`User '${user.name}' (${user.role}) is not authorized to edit claim data. Attempted modifications to: ${modifiedKeys.join(', ')}`],
        sanitized: { ...original, ...auto }
      };
    }
  }

  // Section 1: Service Team Only
  if (!canService) {
    for (const key of SERVICE_TEAM_FIELD_KEYS) {
      if (isChanged(key)) {
        violations.push(`Unauthorized modification to Service Team field '${String(key)}' by ${team}. Reverting to saved value.`);
        (sanitized as any)[key] = original[key];
      }
    }
  }

  // Section 2: Input Team Only
  if (!canInput) {
    for (const key of INPUT_TEAM_FIELD_KEYS) {
      if (isChanged(key)) {
        violations.push(`Unauthorized modification to Input Team field '${String(key)}' by ${team}. Reverting to saved value.`);
        (sanitized as any)[key] = original[key];
      }
    }
  }

  // Section 3: Store Team Only
  if (!canStore) {
    for (const key of STORE_TEAM_FIELD_KEYS) {
      if (isChanged(key)) {
        violations.push(`Unauthorized modification to Store Team field '${String(key)}' by ${team}. Reverting to saved value.`);
        (sanitized as any)[key] = original[key];
      }
    }
  }

  return {
    allowed: violations.length === 0,
    violations,
    sanitized
  };
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
  const auto = computeAutoFields(c, cfg.mode);

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
    missingEvidence: EVIDENCE_CHECKLIST[c.category] || [],
    auto,
    serviceCallStatusAuto: auto.serviceCallStatusAuto,
    orgClaimStatusAuto: auto.orgClaimStatusAuto,
    finalStatusAuto: auto.finalStatusAuto,
    callToChallanDays: auto.callToChallanDays,
    claimToChallanAgeing: auto.claimToChallanAgeing
  };
}

export function validate(c: Partial<Claim>, all: Claim[] = [], self?: string) {
  const e: Record<string, string> = {};

  // If multi-part breakdown exists, auto-sync primary scalar fields
  if (c.parts && c.parts.length > 0) {
    if (!c.partNo && c.parts[0]?.partNo) c.partNo = c.parts[0].partNo;
    if (!c.description && c.parts[0]?.description) c.description = c.parts[0].description;
    if ((!c.qty || c.qty < 1) && c.parts[0]?.qty) {
      c.qty = c.parts.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);
    }
  }

  for (const [k, m] of [
    ['callNo', 'Call No. is required'],
    ['callDate', 'Call Date is required'],
    ['claimDate', 'Claim Date is required'],
    ['claimNo', 'Claim No. is required'],
    ['customerName', 'Customer Name is required'],
    ['serialNo', 'Serial No. is required'],
    ['partNo', 'Part No. is required'],
    ['category', 'Claim Category is required'],
    ['importInvoiceNo', 'Import Invoice Number is required'],
    ['importInvoiceDate', 'Import Invoice Date is required']
  ] as const) {
    if (!c[k] || (typeof c[k] === 'string' && !(c[k] as string).trim())) e[k] = m;
  }

  // Validate individual parts if provided
  if (c.parts && c.parts.length > 0) {
    c.parts.forEach((p, idx) => {
      const label = `Sr. No. ${p.srNo || idx + 1}`;
      if (!p.partNo || !p.partNo.trim()) {
        e[`part_${p.id}_partNo`] = `${label}: Part No. is required`;
      }
      if (p.qty === undefined || !(Number(p.qty) > 0) || !Number.isFinite(Number(p.qty))) {
        e[`part_${p.id}_qty`] = `${label}: Quantity must be greater than 0`;
      }
    });
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
  if (c.turelNewPartOutward === 'Y' && !c.oemClaimNo) {
    e.turelNewPartOutward = 'OEM-first control: OEM Claim No. is mandatory before replacement outward';
  }
  return e;
}

// -------------------------------------------------------------
// CLAIM NUMBER GENERATION, REGISTRY & NUMERICAL ORDERING ENGINE
// Format: CLM-TSC-BranchName-BrandName-FinancialYear-SequentialNumber
// -------------------------------------------------------------

export const BRANCH_PREFIXES: Record<string, string> = {
  'Mumbai HO': 'MUM',
  'MUM': 'MUM',
  'Delhi / NCR': 'DEL',
  'DEL': 'DEL',
  'Bengaluru': 'BLR',
  'BLR': 'BLR',
  'Tirupur': 'TPR',
  'TPR': 'TPR',
  'Surat': 'SUR',
  'SUR': 'SUR',
  'Ahmedabad': 'AHM',
  'AHM': 'AHM',
  'Kolkata': 'KOL',
  'KOL': 'KOL',
  'Chennai': 'CHN',
  'CHN': 'CHN',
  'Ludhiana': 'LDH',
  'LDH': 'LDH',
  'Jaipur': 'JPR',
  'JPR': 'JPR'
};

export function getBranchCode(branch?: string): string {
  if (!branch) return 'MUM';
  const trimmed = branch.trim();
  if (BRANCH_PREFIXES[trimmed]) return BRANCH_PREFIXES[trimmed];
  const upper = trimmed.toUpperCase();
  for (const [k, v] of Object.entries(BRANCH_PREFIXES)) {
    if (upper.includes(k.toUpperCase()) || upper.includes(v)) return v;
  }
  return upper.replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'MUM';
}

export function normalizeBrandCode(brand?: string): string {
  const b = (brand || '').trim().toLowerCase();
  if (b.includes('durkopp') || b.includes('dürkopp') || b.includes('adler')) return 'DURKOPP';
  if (b.includes('vibemac')) return 'VIBEMAC';
  if (b.includes('brother')) return 'BROTHER';
  if (b.includes('juki')) return 'JUKI';
  if (b.includes('typical')) return 'TYPICAL';
  const clean = (brand || 'VIBEMAC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean || 'VIBEMAC';
}

export const FINANCIAL_YEARS = ['2026-27', '2025-26', '2024-25', '2027-28'] as const;

export function getFinancialYear(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '2026-27';
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1 to 12
  const startYear = month >= 4 ? year : year - 1;
  const endYear = (startYear + 1) % 100;
  return `${startYear}-${String(endYear).padStart(2, '0')}`;
}

export interface ParsedClaimNumber {
  branchCode: string;
  brandCode: string;
  financialYear: string;
  sequenceNumber: number;
}

export function parseClaimNumber(claimNo: string): ParsedClaimNumber | null {
  if (!claimNo) return null;
  // Match standard format: CLM-TSC-<Branch>-<Brand>-<FY>-<Seq>
  // Example: CLM-TSC-MUM-VIBEMAC-2026-27-001
  const m1 = claimNo.match(/^CLM-TSC-([A-Za-z0-9]+)-([A-Za-z0-9_-]+)-(\d{4}-\d{2})-(\d+)$/);
  if (m1) {
    return {
      branchCode: m1[1].toUpperCase(),
      brandCode: m1[2].toUpperCase(),
      financialYear: m1[3],
      sequenceNumber: parseInt(m1[4], 10)
    };
  }
  // Match 2-digit FY legacy format: CLM-TSC-LDH-TY-25-26-001
  const m2 = claimNo.match(/^CLM-TSC-([A-Za-z0-9]+)-([A-Za-z0-9_-]+)-(\d{2}-\d{2})-(\d+)$/);
  if (m2) {
    return {
      branchCode: m2[1].toUpperCase(),
      brandCode: m2[2].toUpperCase(),
      financialYear: `20${m2[3]}`,
      sequenceNumber: parseInt(m2[4], 10)
    };
  }
  return null;
}

export const CLAIM_SEQUENCE_REGISTRY_KEY = 'tsc.claim_sequence_registry';

export function getSequenceRegistry(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(CLAIM_SEQUENCE_REGISTRY_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function saveSequenceRegistry(reg: Record<string, number>): void {
  try {
    localStorage.setItem(CLAIM_SEQUENCE_REGISTRY_KEY, JSON.stringify(reg));
  } catch (e) {
    console.error('Failed to save sequence registry', e);
  }
}

export function getNextSequence(
  branch: string,
  brand: string,
  financialYear: string,
  existingClaims: Claim[] = []
): number {
  const branchCode = getBranchCode(branch);
  const brandCode = normalizeBrandCode(brand);
  const fy = financialYear.trim();
  const comboKey = `${branchCode}_${brandCode}_${fy}`;

  // 1. Scan all existing claims for this combination
  let maxFromClaims = 0;
  for (const cl of existingClaims) {
    const parsed = parseClaimNumber(cl.claimNo);
    if (parsed) {
      if (
        parsed.branchCode === branchCode &&
        parsed.brandCode === brandCode &&
        parsed.financialYear === fy
      ) {
        if (parsed.sequenceNumber > maxFromClaims) {
          maxFromClaims = parsed.sequenceNumber;
        }
      }
    }
  }

  // 2. Read registry of issued sequences (ensures deleted/cancelled numbers are never reused)
  const reg = getSequenceRegistry();
  const maxFromReg = reg[comboKey] || 0;

  const currentMax = Math.max(maxFromClaims, maxFromReg);
  return currentMax + 1;
}

export function formatClaimNumber(
  branch: string,
  brand: string,
  financialYear: string,
  seq: number
): string {
  const branchCode = getBranchCode(branch);
  const brandCode = normalizeBrandCode(brand);
  const fy = financialYear.trim();
  const seqStr = String(seq).padStart(3, '0');
  return `CLM-TSC-${branchCode}-${brandCode}-${fy}-${seqStr}`;
}

export function generateNextClaimNumber(
  branch: string,
  brand: string,
  financialYear: string,
  existingClaims: Claim[] = []
): string {
  const seq = getNextSequence(branch, brand, financialYear, existingClaims);
  return formatClaimNumber(branch, brand, financialYear, seq);
}

export function commitClaimSequence(claimNo: string): void {
  const parsed = parseClaimNumber(claimNo);
  if (!parsed) return;
  const comboKey = `${parsed.branchCode}_${parsed.brandCode}_${parsed.financialYear}`;
  const reg = getSequenceRegistry();
  if (!reg[comboKey] || parsed.sequenceNumber > reg[comboKey]) {
    reg[comboKey] = parsed.sequenceNumber;
    saveSequenceRegistry(reg);
  }
}

export function compareClaimNumbers(aClaim: Claim, bClaim: Claim): number {
  const a = parseClaimNumber(aClaim.claimNo);
  const b = parseClaimNumber(bClaim.claimNo);

  if (a && b) {
    const aKey = `${a.branchCode}_${a.brandCode}_${a.financialYear}`;
    const bKey = `${b.branchCode}_${b.brandCode}_${b.financialYear}`;

    if (aKey === bKey) {
      // Ascending numerical order within the same combination
      return a.sequenceNumber - b.sequenceNumber;
    }
    return aKey.localeCompare(bKey);
  }

  if (a && !b) return -1;
  if (!a && b) return 1;
  return (aClaim.claimNo || '').localeCompare(bClaim.claimNo || '');
}

// -------------------------------------------------------------
// FULL CLAIM REGISTER EXCEL REPORT EXPORT SPECIFICATION
// Exact column order matching Claim_Workflow_Advanced_Software.xlsx
// -------------------------------------------------------------

export const FULL_CLAIM_REGISTER_EXCEL_COLUMNS = [
  'Sr No',
  'Claim against',
  'Call no',
  'Call date',
  'Claim Date',
  'Claim No.',
  'Brand',
  'Customer Name',
  'Model',
  'Serial No.',
  'Part No.',
  'Description',
  'Qty',
  'Remark',
  'Import Invoice No',
  'Import Invoice Date',
  'Turel Tax Invoice Number',
  'Turel Tax Invoice Date',
  'Customer Response on Claim Status',
  'Customer Damaged Part Inward',
  'GRN no',
  'GRN date',
  'Principal New Part Inward in Head Office',
  'GRN no',
  'GRN date',
  'Claim Challan No',
  'Challan date',
  'Principal New Part Inward in Claimed Branch Office',
  'GRN no',
  'GRN date',
  'Turel New Part Outward',
  'Customer receipt Date',
  'Service/Installation Call Status (Auto)',
  'Organization Claim Status (Auto)',
  'Final Status (Auto)',
  'call to challan',
  'claim to challan Ageing'
] as const;

export function formatExportYN(v: string | undefined | null): string {
  if (!v) return '';
  const trimmed = String(v).trim().toLowerCase();
  if (trimmed === 'y' || trimmed === 'yes') return 'Yes';
  if (trimmed === 'n' || trimmed === 'no') return 'No';
  return String(v);
}

export function buildFullClaimRegisterRow(
  c: Claim,
  index: number,
  config?: Config
): (string | number)[] {
  const auto = computeAutoFields(c, config?.mode || 'calendar');
  return [
    index + 1,                                            // 1. Sr No
    c.claimAgainst || '',                                 // 2. Claim against
    c.callNo || '',                                       // 3. Call no
    c.callDate || '',                                     // 4. Call date
    c.claimDate || '',                                    // 5. Claim Date
    c.claimNo || '',                                      // 6. Claim No.
    c.brand || '',                                        // 7. Brand
    c.customerName || '',                                 // 8. Customer Name
    c.model || '',                                        // 9. Model
    c.serialNo || '',                                     // 10. Serial No.
    c.partNo || '',                                       // 11. Part No.
    c.description || '',                                  // 12. Description
    c.qty ?? '',                                          // 13. Qty
    c.remark || '',                                       // 14. Remark
    c.importInvoiceNo || '',                              // 15. Import Invoice No
    c.importInvoiceDate || '',                            // 16. Import Invoice Date
    c.turelTaxInvoiceNo || '',                            // 17. Turel Tax Invoice Number
    c.turelTaxInvoiceDate || '',                          // 18. Turel Tax Invoice Date
    c.vendorResponse || '',                               // 19. Customer Response on Claim Status
    formatExportYN(c.damagedPartInward),                  // 20. Customer Damaged Part Inward
    c.damagedPartGRNNo || '',                             // 21. GRN no (Damaged Part)
    c.damagedPartGRNDate || '',                           // 22. GRN date (Damaged Part)
    formatExportYN(c.newPartAtHO),                        // 23. Principal New Part Inward in Head Office
    c.hoGRNNo || '',                                      // 24. GRN no (HO)
    c.hoGRNDate || '',                                    // 25. GRN date (HO)
    c.claimChallanNo || '',                               // 26. Claim Challan No
    c.challanDate || '',                                  // 27. Challan date
    formatExportYN(c.newPartAtBranch),                    // 28. Principal New Part Inward in Claimed Branch Office
    c.branchGRNNo || '',                                  // 29. GRN no (Branch)
    c.branchGRNDate || '',                                // 30. GRN date (Branch)
    formatExportYN(c.turelNewPartOutward),                // 31. Turel New Part Outward
    c.customerReceiptDate || '',                          // 32. Customer receipt Date
    auto.serviceCallStatusAuto,                           // 33. Service/Installation Call Status (Auto)
    auto.orgClaimStatusAuto,                              // 34. Organization Claim Status (Auto)
    auto.finalStatusAuto,                                 // 35. Final Status (Auto)
    auto.callToChallanDays,                               // 36. call to challan
    auto.claimToChallanAgeing                             // 37. claim to challan Ageing
  ];
}
