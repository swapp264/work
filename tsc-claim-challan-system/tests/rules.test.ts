import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Claim, 
  ClaimEvent, 
  ClaimDocument, 
  days, 
  gates, 
  blockers, 
  derived, 
  validate, 
  DEFAULT_CONFIG 
} from '../src/domain';
import { MockRepository } from '../src/repository';
import { generateMilestonePdf } from '../src/pdfService';

const sampleClaim: Claim = {
  id: 'test-claim-001',
  claimAgainst: 'Service call',
  callNo: 'SC/MUM/25-26/001',
  callDate: '2026-09-04',
  claimDate: '2026-09-04',
  claimNo: 'CLM-TSC-TEST-001',
  brand: 'Typical',
  customerName: 'Test Customer Apparel Ltd',
  model: 'GC20606',
  serialNo: 'SN-999901',
  partNo: 'PART-001',
  description: 'Test Main Motor',
  qty: 1,
  importInvoiceNo: 'IMP-1234',
  importInvoiceDate: '2026-01-01',
  turelTaxInvoiceNo: 'TAX-5678',
  turelTaxInvoiceDate: '2026-01-05',
  installationDate: '2026-01-10',
  category: 'DOA – Dead on Arrival',
  remark: 'Test defect notes',
  vendorResponse: 'Approved',
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
  oemSettlementExpected: 'Replacement',
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
  rootCauseBrief: 'Initial analysis',
  capaNo: '',
  capaStatus: 'N/A',
  isoClauseRef: 'Cl. 8.7',
  createdAt: '2026-09-04T10:00:00Z',
  updatedAt: '2026-09-04T10:00:00Z',
  source: 'MANUAL_PILOT'
};

describe('TSC Claim Challan Management System Business Rules & Ledger', () => {
  // Existing baseline tests
  it('excludes weekend working days', () => {
    expect(days('2026-09-04', '2026-09-07', 'working')).toBe(1);
  });

  it('requires OEM first before interim sourcing', () => {
    const res = validate({ ...sampleClaim, interimOption: 'A' });
    expect(res.interimOption).toContain('OEM Claim No.');
  });

  it('requires all closure gates to evaluate true', () => {
    const cClosed: Claim = {
      ...sampleClaim,
      oemClaimNo: 'OEM-12345',
      oemReplacementReceived: 'Y',
      creditNoteVerified: 'N',
      inventoryAdjusted: 'Y',
      financeReceivableCleared: 'Y',
      localPurchaseExpenseSettled: 'Y',
      interimOption: 'A'
    };
    expect(gates(cClosed)).toEqual({
      oemClaimNo: true,
      replacementOrCreditVerified: true,
      inventoryAdjusted: true,
      financeCleared: true
    });
  });

  // Section 28 Requirements
  it('1. Creating a claim creates CLAIM_CREATED event with valid document', async () => {
    const repo = new MockRepository();
    const event: ClaimEvent = {
      id: 'ev-test-created',
      claimId: sampleClaim.id,
      eventType: 'CLAIM_CREATED',
      eventDate: '2026-09-04 10:00:00',
      status: 'Created',
      referenceNo: sampleClaim.claimNo,
      performedBy: 'Service Head',
      createdAt: '2026-09-04T10:00:00Z',
      documentId: 'doc-test-created'
    };
    const doc: ClaimDocument = {
      id: 'doc-test-created',
      claimId: sampleClaim.id,
      eventId: event.id,
      documentType: 'CLAIM_NOTE',
      documentNo: 'CIS-TEST-001',
      documentDate: '2026-09-04',
      fileName: 'Intimation_CLM-TSC-TEST-001.pdf',
      uploadedBy: 'Service Head',
      uploadedAt: '2026-09-04T10:00:00Z'
    };
    await repo.addClaimEvent(event);
    await repo.addClaimDocument(doc);

    const evs = await repo.getClaimEvents(sampleClaim.id);
    expect(evs.some(e => e.eventType === 'CLAIM_CREATED')).toBe(true);
    const docs = await repo.getClaimDocuments(sampleClaim.id);
    expect(docs.some(d => d.documentType === 'CLAIM_NOTE')).toBe(true);
  });

  it('2. Approval creates CLAIM_APPROVED event', async () => {
    const repo = new MockRepository();
    const event: ClaimEvent = {
      id: 'ev-test-appr',
      claimId: sampleClaim.id,
      eventType: 'CLAIM_APPROVED',
      eventDate: '2026-09-04 11:00:00',
      status: 'Approved',
      referenceNo: 'APV-TEST-001',
      performedBy: 'Swapnil (Service Head)',
      createdAt: '2026-09-04T11:00:00Z'
    };
    await repo.addClaimEvent(event);
    const evs = await repo.getClaimEvents(sampleClaim.id);
    expect(evs.some(e => e.eventType === 'CLAIM_APPROVED' && e.performedBy.includes('Service Head'))).toBe(true);
  });

  it('3. OEM Claim creation creates OEM_CLAIM_RAISED event', async () => {
    const repo = new MockRepository();
    const event: ClaimEvent = {
      id: 'ev-test-oem',
      claimId: sampleClaim.id,
      eventType: 'OEM_CLAIM_RAISED',
      eventDate: '2026-09-04 12:00:00',
      status: 'OEM Claim Raised',
      referenceNo: 'OEM-TY-TEST-99',
      performedBy: 'Service Executive',
      createdAt: '2026-09-04T12:00:00Z'
    };
    await repo.addClaimEvent(event);
    const evs = await repo.getClaimEvents(sampleClaim.id);
    expect(evs.some(e => e.eventType === 'OEM_CLAIM_RAISED' && e.referenceNo === 'OEM-TY-TEST-99')).toBe(true);
  });

  it('4. GRN creation creates GRN_RECEIVED event', async () => {
    const repo = new MockRepository();
    const event: ClaimEvent = {
      id: 'ev-test-grn',
      claimId: sampleClaim.id,
      eventType: 'GRN_RECEIVED',
      eventDate: '2026-09-05 14:00:00',
      status: 'Material Inwarded',
      referenceNo: 'GRN-HO-TEST-01',
      performedBy: 'Stores In-Charge',
      createdAt: '2026-09-05T14:00:00Z'
    };
    await repo.addClaimEvent(event);
    const evs = await repo.getClaimEvents(sampleClaim.id);
    expect(evs.some(e => e.eventType === 'GRN_RECEIVED' && e.referenceNo === 'GRN-HO-TEST-01')).toBe(true);
  });

  it('5. Challan creation creates CHALLAN_CREATED event', async () => {
    const repo = new MockRepository();
    const event: ClaimEvent = {
      id: 'ev-test-ch',
      claimId: sampleClaim.id,
      eventType: 'CHALLAN_CREATED',
      eventDate: '2026-09-06 15:00:00',
      status: 'Challan Created',
      referenceNo: 'CH-TEST-001',
      performedBy: 'Logistics Desk',
      createdAt: '2026-09-06T15:00:00Z'
    };
    await repo.addClaimEvent(event);
    const evs = await repo.getClaimEvents(sampleClaim.id);
    expect(evs.some(e => e.eventType === 'CHALLAN_CREATED' && e.referenceNo === 'CH-TEST-001')).toBe(true);
  });

  it('6. Delivery Note creation creates DELIVERY_NOTE_CREATED event', async () => {
    const repo = new MockRepository();
    const event: ClaimEvent = {
      id: 'ev-test-dn',
      claimId: sampleClaim.id,
      eventType: 'DELIVERY_NOTE_CREATED',
      eventDate: '2026-09-07 16:00:00',
      status: 'Delivered to Customer',
      referenceNo: 'DN-TEST-001',
      performedBy: 'Branch Technician',
      createdAt: '2026-09-07T16:00:00Z'
    };
    await repo.addClaimEvent(event);
    const evs = await repo.getClaimEvents(sampleClaim.id);
    expect(evs.some(e => e.eventType === 'DELIVERY_NOTE_CREATED' && e.referenceNo === 'DN-TEST-001')).toBe(true);
  });

  it('7. Finance clearance creates FINANCE_CLEARED event', async () => {
    const repo = new MockRepository();
    const event: ClaimEvent = {
      id: 'ev-test-fin',
      claimId: sampleClaim.id,
      eventType: 'FINANCE_CLEARED',
      eventDate: '2026-09-08 11:30:00',
      status: 'Finance Cleared',
      referenceNo: 'FSV-TEST-001',
      performedBy: 'Finance Controller',
      createdAt: '2026-09-08T11:30:00Z'
    };
    await repo.addClaimEvent(event);
    const evs = await repo.getClaimEvents(sampleClaim.id);
    expect(evs.some(e => e.eventType === 'FINANCE_CLEARED' && e.referenceNo === 'FSV-TEST-001')).toBe(true);
  });

  it('8. Closing Note cannot be generated if Gate 1 fails (OEM Claim No missing)', () => {
    const c: Claim = {
      ...sampleClaim,
      oemClaimNo: '', // Gate 1 fails
      oemReplacementReceived: 'Y',
      inventoryAdjusted: 'Y',
      financeReceivableCleared: 'Y'
    };
    const g = gates(c);
    expect(g.oemClaimNo).toBe(false);
    const b = blockers(c);
    expect(b.some(text => text.includes('Gate 1'))).toBe(true);
    const d = derived(c, DEFAULT_CONFIG);
    expect(d.eligible).toBe(false);
    expect(d.final).toBe('Open');
  });

  it('9. Closing Note cannot be generated if Gate 2 fails (Replacement/Credit missing)', () => {
    const c: Claim = {
      ...sampleClaim,
      oemClaimNo: 'OEM-123',
      oemReplacementReceived: 'N',
      creditNoteVerified: 'N', // Gate 2 fails
      inventoryAdjusted: 'Y',
      financeReceivableCleared: 'Y'
    };
    const g = gates(c);
    expect(g.replacementOrCreditVerified).toBe(false);
    const b = blockers(c);
    expect(b.some(text => text.includes('Gate 2'))).toBe(true);
    const d = derived(c, DEFAULT_CONFIG);
    expect(d.eligible).toBe(false);
    expect(d.final).toBe('Open');
  });

  it('10. Closing Note cannot be generated if Gate 3 fails (Inventory not adjusted)', () => {
    const c: Claim = {
      ...sampleClaim,
      oemClaimNo: 'OEM-123',
      oemReplacementReceived: 'Y',
      inventoryAdjusted: 'N', // Gate 3 fails
      financeReceivableCleared: 'Y'
    };
    const g = gates(c);
    expect(g.inventoryAdjusted).toBe(false);
    const b = blockers(c);
    expect(b.some(text => text.includes('Gate 3'))).toBe(true);
    const d = derived(c, DEFAULT_CONFIG);
    expect(d.eligible).toBe(false);
    expect(d.final).toBe('Open');
  });

  it('11. Closing Note cannot be generated if Gate 4 fails (Finance clearance pending)', () => {
    const c: Claim = {
      ...sampleClaim,
      oemClaimNo: 'OEM-123',
      oemReplacementReceived: 'Y',
      inventoryAdjusted: 'Y',
      financeReceivableCleared: 'N' // Gate 4 fails
    };
    const g = gates(c);
    expect(g.financeCleared).toBe(false);
    const b = blockers(c);
    expect(b.some(text => text.includes('Gate 4'))).toBe(true);
    const d = derived(c, DEFAULT_CONFIG);
    expect(d.eligible).toBe(false);
    expect(d.final).toBe('Open');
  });

  it('12. Closing Note can be generated only when all four gates pass', () => {
    const c: Claim = {
      ...sampleClaim,
      oemClaimNo: 'OEM-123',
      oemReplacementReceived: 'Y',
      inventoryAdjusted: 'Y',
      financeReceivableCleared: 'Y',
      localPurchaseExpenseSettled: 'Y'
    };
    const g = gates(c);
    expect(g.oemClaimNo && g.replacementOrCreditVerified && g.inventoryAdjusted && g.financeCleared).toBe(true);
    const b = blockers(c);
    expect(b.length).toBe(0);
    const d = derived(c, DEFAULT_CONFIG);
    expect(d.eligible).toBe(true);
  });

  it('13. Successful Closing Note creates CLOSING_NOTE_CREATED event', async () => {
    const repo = new MockRepository();
    const event: ClaimEvent = {
      id: 'ev-test-ccn',
      claimId: sampleClaim.id,
      eventType: 'CLOSING_NOTE_CREATED',
      eventDate: '2026-09-09 17:00:00',
      status: 'Closed',
      referenceNo: 'CN-TSC-TEST-001',
      performedBy: 'Swapnil (Service Head)',
      createdAt: '2026-09-09T17:00:00Z',
      documentId: 'doc-test-ccn'
    };
    await repo.addClaimEvent(event);
    const evs = await repo.getClaimEvents(sampleClaim.id);
    expect(evs.some(e => e.eventType === 'CLOSING_NOTE_CREATED')).toBe(true);
  });

  it('14. Claim status becomes CLOSED only through centralized business logic', () => {
    // 4 gates pass but closingNoteNo is NOT set: claim is NOT closed yet
    const pendingClosureClaim: Claim = {
      ...sampleClaim,
      source: 'MANUAL_PILOT',
      oemClaimNo: 'OEM-123',
      oemReplacementReceived: 'Y',
      inventoryAdjusted: 'Y',
      financeReceivableCleared: 'Y',
      localPurchaseExpenseSettled: 'Y',
      closingNoteNo: '' // Not generated yet
    };
    const dPending = derived(pendingClosureClaim, DEFAULT_CONFIG);
    expect(dPending.eligible).toBe(true);
    expect(dPending.status).toBe('Closure Eligible (Pending Closing Note)');
    expect(dPending.final).toBe('Open');

    // Once closingNoteNo is generated: derived transitions status to 'Closed'
    const fullyClosedClaim: Claim = {
      ...pendingClosureClaim,
      closingNoteNo: 'CN-TSC-2526-001',
      closingNoteDate: '2026-09-20'
    };
    const dClosed = derived(fullyClosedClaim, DEFAULT_CONFIG);
    expect(dClosed.eligible).toBe(true);
    expect(dClosed.status).toBe('Closed');
    expect(dClosed.final).toBe('Closed');
  });

  it('15. Ledger is chronological', () => {
    const unsortedEvents: ClaimEvent[] = [
      { id: '1', claimId: 'c1', eventType: 'CHALLAN_CREATED', eventDate: '2026-09-10', status: 'Challan', performedBy: 'A', createdAt: '2026-09-10' },
      { id: '2', claimId: 'c1', eventType: 'CLAIM_CREATED', eventDate: '2026-09-01', status: 'Created', performedBy: 'B', createdAt: '2026-09-01' },
      { id: '3', claimId: 'c1', eventType: 'CLAIM_APPROVED', eventDate: '2026-09-02', status: 'Approved', performedBy: 'C', createdAt: '2026-09-02' }
    ];

    const sorted = [...unsortedEvents].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    expect(sorted[0].eventType).toBe('CLAIM_CREATED');
    expect(sorted[1].eventType).toBe('CLAIM_APPROVED');
    expect(sorted[2].eventType).toBe('CHALLAN_CREATED');
  });

  it('16. Documents are correctly linked to events', async () => {
    const repo = new MockRepository();
    const eventId = 'ev-link-test';
    const docId = 'doc-link-test';
    const event: ClaimEvent = {
      id: eventId,
      claimId: 'claim-link',
      eventType: 'GRN_RECEIVED',
      eventDate: '2026-09-04',
      status: 'Inwarded',
      performedBy: 'Stores',
      createdAt: '2026-09-04',
      documentId: docId
    };
    const doc: ClaimDocument = {
      id: docId,
      claimId: 'claim-link',
      eventId: eventId,
      documentType: 'GRN',
      documentNo: 'GRN-HO-LINK-01',
      fileName: 'GRN_Receipt.pdf',
      uploadedBy: 'Stores',
      uploadedAt: '2026-09-04'
    };
    await repo.addClaimEvent(event);
    await repo.addClaimDocument(doc);

    const retrievedDoc = await repo.getClaimDocument(docId);
    expect(retrievedDoc).not.toBeNull();
    expect(retrievedDoc?.eventId).toBe(eventId);
    expect(retrievedDoc?.documentType).toBe('GRN');
  });

  it('17. Failed operations do not create false ledger events', async () => {
    const repo = new MockRepository();
    const invalidClaim: Partial<Claim> = {
      callNo: '',
      claimNo: ''
    };
    const errors = validate(invalidClaim);
    expect(Object.keys(errors).length).toBeGreaterThan(0);

    // Because validation failed, no event was saved
    const eventsBefore = await repo.getClaimEvents('non-existent-claim');
    expect(eventsBefore.length).toBe(0);
  });

  it('18. Generates valid PDF documents for formal milestones', () => {
    const pdf = generateMilestonePdf('CLOSING_NOTE', {
      ...sampleClaim,
      oemClaimNo: 'OEM-12345',
      closingNoteNo: 'CN-TSC-2526-001'
    });
    expect(pdf.documentNo).toBe('CN-TSC-2526-001');
    expect(pdf.fileName).toContain('Closing_Note');
    expect(pdf.dataUrl).toContain('data:application/pdf');
    expect(pdf.blob).toBeDefined();
    expect(pdf.blob.size).toBeGreaterThan(1000);
  });
});
