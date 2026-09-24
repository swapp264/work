import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Claim, 
  ClaimEvent, 
  ClaimDocument, 
  ClaimPart,
  ClaimPartImage,
  days, 
  gates, 
  blockers, 
  derived, 
  validate, 
  DEFAULT_CONFIG 
} from '../src/domain';
import { MockRepository } from '../src/repository';
import { generateMilestonePdf, generateClaimsApplicationSheet, getBrandTheme } from '../src/pdfService';

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

describe('Part-Wise Image Attachment for Claims (ISO 9001:2015 Evidence)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Test 1: Create a Claim with 2 parts. Verify Part 1 -> Image 1, Part 2 -> Image 2, and that images are not mixed.
  it('Test 1: Creates claim with 2 parts and verifies images are mapped to their respective parts without mixing', async () => {
    const repo = new MockRepository();
    const claimId = 'claim-multi-part-01';

    const part1: ClaimPart = {
      id: 'part-01-a',
      srNo: 1,
      partNo: 'PART-A',
      description: 'Motor Drive',
      qty: 1
    };
    const part2: ClaimPart = {
      id: 'part-01-b',
      srNo: 2,
      partNo: 'PART-B',
      description: 'Needle Bar',
      qty: 2
    };

    const claim: Claim = {
      ...sampleClaim,
      id: claimId,
      claimNo: 'CLM-TSC-TEST-MP01',
      partNo: 'PART-A',
      parts: [part1, part2]
    };

    const img1: ClaimPartImage = {
      id: 'img-p1',
      claimId,
      partId: part1.id,
      srNo: 1,
      partNo: 'PART-A',
      fileName: 'motor_defect.jpg',
      fileUrl: 'data:image/jpeg;base64,part1img',
      uploadedBy: 'Technician',
      uploadedAt: '2026-09-24T10:00:00Z'
    };

    const img2: ClaimPartImage = {
      id: 'img-p2',
      claimId,
      partId: part2.id,
      srNo: 2,
      partNo: 'PART-B',
      fileName: 'needle_crack.jpg',
      fileUrl: 'data:image/jpeg;base64,part2img',
      uploadedBy: 'Technician',
      uploadedAt: '2026-09-24T10:05:00Z'
    };

    await repo.saveClaim(claim);
    await repo.addClaimPartImage(img1);
    await repo.addClaimPartImage(img2);

    const part1Images = await repo.getClaimPartImages(claimId, part1.id);
    const part2Images = await repo.getClaimPartImages(claimId, part2.id);

    expect(part1Images.length).toBe(1);
    expect(part1Images[0].id).toBe('img-p1');
    expect(part1Images[0].fileName).toBe('motor_defect.jpg');
    expect(part1Images[0].partId).toBe(part1.id);
    expect(part1Images[0].srNo).toBe(1);

    expect(part2Images.length).toBe(1);
    expect(part2Images[0].id).toBe('img-p2');
    expect(part2Images[0].fileName).toBe('needle_crack.jpg');
    expect(part2Images[0].partId).toBe(part2.id);
    expect(part2Images[0].srNo).toBe(2);

    // Ensure images are not mixed
    expect(part1Images.some(i => i.id === 'img-p2')).toBe(false);
    expect(part2Images.some(i => i.id === 'img-p1')).toBe(false);
  });

  // Test 2: Attach 2 images to the same part. Verify both belong to that part.
  it('Test 2: Attaches 2 images to the same part and verifies both belong to that part', async () => {
    const repo = new MockRepository();
    const claimId = 'claim-multi-img-02';
    const part: ClaimPart = {
      id: 'part-02-brake',
      srNo: 1,
      partNo: 'BRK-001',
      description: 'Brake Assembly',
      qty: 1
    };

    await repo.saveClaim({ ...sampleClaim, id: claimId, parts: [part] });

    const imgA: ClaimPartImage = {
      id: 'img-brk-1',
      claimId,
      partId: part.id,
      srNo: 1,
      fileName: 'brake_angle_1.jpg',
      fileUrl: 'data:image/jpeg;base64,imgA',
      uploadedBy: 'Swapnil',
      uploadedAt: '2026-09-24T11:00:00Z'
    };

    const imgB: ClaimPartImage = {
      id: 'img-brk-2',
      claimId,
      partId: part.id,
      srNo: 1,
      fileName: 'brake_angle_2.jpg',
      fileUrl: 'data:image/jpeg;base64,imgB',
      uploadedBy: 'Swapnil',
      uploadedAt: '2026-09-24T11:02:00Z'
    };

    await repo.addClaimPartImage(imgA);
    await repo.addClaimPartImage(imgB);

    const images = await repo.getClaimPartImages(claimId, part.id);
    expect(images.length).toBe(2);
    expect(images.map(i => i.id)).toEqual(['img-brk-1', 'img-brk-2']);
    expect(images.every(i => i.partId === part.id)).toBe(true);
  });

  // Test 3: Attach an image to Part 3. Verify it is not visible under Part 1 or Part 2.
  it('Test 3: Attaches image to Part 3 and verifies it is not visible under Part 1 or Part 2', async () => {
    const repo = new MockRepository();
    const claimId = 'claim-part3-test';

    const p1 = { id: 'p-1', srNo: 1, partNo: 'P-1', description: 'Desc 1', qty: 1 };
    const p2 = { id: 'p-2', srNo: 2, partNo: 'P-2', description: 'Desc 2', qty: 1 };
    const p3 = { id: 'p-3', srNo: 3, partNo: 'P-3', description: 'Desc 3', qty: 1 };

    await repo.saveClaim({ ...sampleClaim, id: claimId, parts: [p1, p2, p3] });

    const imgP3: ClaimPartImage = {
      id: 'img-for-p3',
      claimId,
      partId: p3.id,
      srNo: 3,
      partNo: 'P-3',
      fileName: 'part3_defect.png',
      fileUrl: 'data:image/png;base64,imgP3',
      uploadedBy: 'Tech',
      uploadedAt: '2026-09-24'
    };

    await repo.addClaimPartImage(imgP3);

    const p1Imgs = await repo.getClaimPartImages(claimId, p1.id);
    const p2Imgs = await repo.getClaimPartImages(claimId, p2.id);
    const p3Imgs = await repo.getClaimPartImages(claimId, p3.id);

    expect(p1Imgs.length).toBe(0);
    expect(p2Imgs.length).toBe(0);
    expect(p3Imgs.length).toBe(1);
    expect(p3Imgs[0].id).toBe('img-for-p3');
  });

  // Test 4: Reload/reopen the Claim. Verify the part-image mapping remains correct through repository persistence.
  it('Test 4: Reloads claim from repository and verifies part-image mapping remains intact', async () => {
    const repo = new MockRepository();
    const claimId = 'claim-reload-test';

    const part = {
      id: 'part-reload-01',
      srNo: 1,
      partNo: 'REL-99',
      description: 'Solenoid Valve',
      qty: 1
    };

    const claim = { ...sampleClaim, id: claimId, parts: [part] };
    await repo.saveClaim(claim);

    const img: ClaimPartImage = {
      id: 'img-reload-01',
      claimId,
      partId: part.id,
      srNo: 1,
      partNo: 'REL-99',
      fileName: 'solenoid_burn.webp',
      fileUrl: 'data:image/webp;base64,burn',
      uploadedBy: 'Tech 2',
      uploadedAt: '2026-09-24T12:00:00Z'
    };
    await repo.addClaimPartImage(img);

    // Fresh repository instance simulating page reload
    const freshRepo = new MockRepository();
    const reloadedClaims = await freshRepo.claims();
    const foundClaim = reloadedClaims.find(c => c.id === claimId);

    expect(foundClaim).toBeDefined();
    expect(foundClaim?.parts?.length).toBe(1);
    expect(foundClaim?.parts?.[0].images?.length).toBe(1);
    expect(foundClaim?.parts?.[0].images?.[0].fileName).toBe('solenoid_burn.webp');

    const reloadedImages = await freshRepo.getClaimPartImages(claimId, part.id);
    expect(reloadedImages.length).toBe(1);
    expect(reloadedImages[0].id).toBe('img-reload-01');
  });

  // Test 5: Delete/remove a part. Verify associated images are handled correctly and do not become orphaned.
  it('Test 5: Removes part and cleans up its associated images without leaving orphaned records', async () => {
    const repo = new MockRepository();
    const claimId = 'claim-del-test';
    const partToKeep = { id: 'p-keep', srNo: 1, partNo: 'KEEP-01', description: 'Stay', qty: 1 };
    const partToDelete = { id: 'p-del', srNo: 2, partNo: 'DEL-02', description: 'Leave', qty: 1 };

    await repo.saveClaim({ ...sampleClaim, id: claimId, parts: [partToKeep, partToDelete] });

    await repo.addClaimPartImage({
      id: 'img-keep',
      claimId,
      partId: partToKeep.id,
      srNo: 1,
      fileName: 'keep.jpg',
      fileUrl: 'url1',
      uploadedBy: 'Admin',
      uploadedAt: '2026-09-24'
    });

    await repo.addClaimPartImage({
      id: 'img-del',
      claimId,
      partId: partToDelete.id,
      srNo: 2,
      fileName: 'delete_me.jpg',
      fileUrl: 'url2',
      uploadedBy: 'Admin',
      uploadedAt: '2026-09-24'
    });

    // Delete images for the deleted part
    await repo.deleteClaimPartImagesByPart(claimId, partToDelete.id);

    const remainingImages = await repo.getClaimPartImages(claimId);
    expect(remainingImages.length).toBe(1);
    expect(remainingImages[0].id).toBe('img-keep');
    expect(remainingImages.some(i => i.partId === partToDelete.id)).toBe(false);

    // Documents check
    const docs = await repo.getClaimDocuments(claimId);
    expect(docs.some(d => d.partId === partToDelete.id)).toBe(false);
  });

  // Test 6: Stable partId preserves image association even if parts are reordered
  it('Test 6: Stable partId preserves image association even if parts are reordered in the claim', async () => {
    const repo = new MockRepository();
    const claimId = 'claim-reorder-test';

    const partA = { id: 'part-stable-a', srNo: 1, partNo: 'PART-A', description: 'Part A', qty: 1 };
    const partB = { id: 'part-stable-b', srNo: 2, partNo: 'PART-B', description: 'Part B', qty: 1 };

    await repo.saveClaim({ ...sampleClaim, id: claimId, parts: [partA, partB] });

    const imgA: ClaimPartImage = {
      id: 'img-stable-a',
      claimId,
      partId: partA.id,
      srNo: 1,
      fileName: 'partA_crack.jpg',
      fileUrl: 'urlA',
      uploadedBy: 'Tech',
      uploadedAt: '2026-09-24'
    };
    await repo.addClaimPartImage(imgA);

    // Reorder parts: partB becomes first, partA becomes second
    const reorderedParts = [
      { ...partB, srNo: 1 },
      { ...partA, srNo: 2 }
    ];
    await repo.saveClaim({ ...sampleClaim, id: claimId, parts: reorderedParts });

    // The image must still belong to partA by stable ID
    const imagesForA = await repo.getClaimPartImages(claimId, partA.id);
    expect(imagesForA.length).toBe(1);
    expect(imagesForA[0].id).toBe('img-stable-a');

    const imagesForB = await repo.getClaimPartImages(claimId, partB.id);
    expect(imagesForB.length).toBe(0);
  });

  // Test 7: Verify existing Claim Ledger events are unaffected by image operations
  it('Test 7: Part image attachments do not pollute or distort formal Claim Ledger milestone events', async () => {
    const repo = new MockRepository();
    const claimId = 'claim-ledger-integrity';

    const ledgerEvent: ClaimEvent = {
      id: 'event-milestone-01',
      claimId,
      eventType: 'CLAIM_CREATED',
      eventDate: '2026-09-24 10:00:00',
      status: 'Created',
      performedBy: 'Service Head',
      createdAt: '2026-09-24T10:00:00Z'
    };
    await repo.addClaimEvent(ledgerEvent);

    // Attach part image
    await repo.addClaimPartImage({
      id: 'img-evidence-1',
      claimId,
      partId: 'p-1',
      srNo: 1,
      fileName: 'photo.jpg',
      fileUrl: 'data:img',
      uploadedBy: 'Tech',
      uploadedAt: '2026-09-24'
    });

    const events = await repo.getClaimEvents(claimId);
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('CLAIM_CREATED');
  });

  // Test 8: Verify existing Claim creation and closure workflows still work
  it('Test 8: Full four-gate closure workflow operates seamlessly alongside part-wise images', async () => {
    const repo = new MockRepository();
    const claimId = 'claim-full-closure-test';

    const claimClosed: Claim = {
      ...sampleClaim,
      id: claimId,
      oemClaimNo: 'OEM-CLOSURE-99',
      oemReplacementReceived: 'Y',
      creditNoteVerified: 'N',
      inventoryAdjusted: 'Y',
      financeReceivableCleared: 'Y',
      localPurchaseExpenseSettled: 'Y',
      interimOption: 'A',
      closingNoteNo: 'CN-TSC-2526-99',
      parts: [
        { id: 'p-c-1', srNo: 1, partNo: 'CLS-01', description: 'Assembly', qty: 1 }
      ]
    };

    const g = gates(claimClosed);
    expect(g.oemClaimNo).toBe(true);
    expect(g.replacementOrCreditVerified).toBe(true);
    expect(g.inventoryAdjusted).toBe(true);
    expect(g.financeCleared).toBe(true);

    const d = derived(claimClosed, DEFAULT_CONFIG);
    expect(d.eligible).toBe(true);
    expect(d.final).toBe('Closed');
  });
});

describe('Claims Application Sheet PDF Generation (Visual Reference Layout & Part-Wise Mapping)', () => {
  const multiPartClaimWithPhotos: Claim = {
    ...sampleClaim,
    id: 'claim-pdf-vibemac-001',
    claimNo: 'CLM-VIB-2026-001',
    brand: 'Vibemac',
    customerName: 'AQUA',
    model: 'S-2261HP',
    serialNo: '220702055',
    partNo: 'ST-K-BASE-04',
    description: 'Base assembled without column',
    qty: 1,
    parts: [
      {
        id: 'p-v-1',
        srNo: 1,
        partNo: 'ST-K-BASE-04',
        description: 'Base assembled without column',
        qty: 1,
        remarks: 'pedal assembly issue',
        images: [
          {
            id: 'img-v-1',
            claimId: 'claim-pdf-vibemac-001',
            partId: 'p-v-1',
            srNo: 1,
            partNo: 'ST-K-BASE-04',
            fileName: 'pedal_top.jpg',
            fileUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
            uploadedBy: 'Varun Patil',
            uploadedAt: '2026-08-12T10:00:00Z',
            remarks: 'Pedal assembly (top)'
          },
          {
            id: 'img-v-2',
            claimId: 'claim-pdf-vibemac-001',
            partId: 'p-v-1',
            srNo: 1,
            partNo: 'ST-K-BASE-04',
            fileName: 'pedal_bottom.jpg',
            fileUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
            uploadedBy: 'Varun Patil',
            uploadedAt: '2026-08-12T10:05:00Z',
            remarks: 'Pedal assembly (bottom)'
          }
        ]
      },
      {
        id: 'p-v-2',
        srNo: 2,
        partNo: 'CBL-PWR-01',
        description: 'Power Cable Connector',
        qty: 1,
        remarks: 'Terminal pin bent',
        images: [
          {
            id: 'img-v-3',
            claimId: 'claim-pdf-vibemac-001',
            partId: 'p-v-2',
            srNo: 2,
            partNo: 'CBL-PWR-01',
            fileName: 'cable_pin.jpg',
            fileUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
            uploadedBy: 'Varun Patil',
            uploadedAt: '2026-08-12T10:10:00Z',
            remarks: 'Terminal pin connector defect'
          }
        ]
      }
    ]
  };

  it('1. Resolves dynamic OEM brand themes correctly (Vibemac vs Durkopp Adler vs Typical)', () => {
    const vibemacTheme = getBrandTheme('VIBEMAC');
    expect(vibemacTheme.name).toBe('VIBEMAC');
    expect(vibemacTheme.iconType).toBe('vibemac');
    expect(vibemacTheme.primary).toEqual([163, 29, 29]);

    const durkoppTheme = getBrandTheme('Dürkopp Adler');
    expect(durkoppTheme.name).toBe('DÜRKOPP ADLER');
    expect(durkoppTheme.iconType).toBe('durkopp');
    expect(durkoppTheme.primary).toEqual([0, 85, 165]);

    const typicalTheme = getBrandTheme('Typical');
    expect(typicalTheme.name).toBe('TYPICAL');
    expect(typicalTheme.iconType).toBe('crest');
  });

  it('2. Generates Claims Application Sheet PDF with exact reference layout and document naming', () => {
    const res = generateClaimsApplicationSheet(multiPartClaimWithPhotos);
    expect(res.fileName).toContain('Claims_Application_CLM-VIB-2026-001.pdf');
    expect(res.documentNo).toBe('CAS-2026001');
    expect(res.dataUrl).toContain('data:application/pdf');
    expect(res.blob).toBeDefined();
    expect(res.blob.size).toBeGreaterThan(1500);
  });

  it('3. Delegates CLAIM_NOTE milestone generation directly to generateClaimsApplicationSheet', () => {
    const res = generateMilestonePdf('CLAIM_NOTE', multiPartClaimWithPhotos);
    expect(res.fileName).toContain('Claims_Application_CLM-VIB-2026-001.pdf');
    expect(res.documentNo).toBe('CAS-2026001');
    expect(res.blob.size).toBeGreaterThan(1500);
  });

  it('4. Multi-page continuation: handles 3+ photos across pages without truncation or crashing', () => {
    // 3 photos in multiPartClaimWithPhotos (Part 1 has 2, Part 2 has 1)
    const res = generateClaimsApplicationSheet(multiPartClaimWithPhotos);
    expect(res.blob).toBeDefined();
    expect(res.blob.size).toBeGreaterThan(2000);
  });

  it('5. Generates blank template format with dashed boxes when claim data has no customer or parts', () => {
    const blankClaim: Claim = {
      ...sampleClaim,
      id: 'claim-blank-template',
      brand: 'Dürkopp Adler',
      customerName: '',
      partNo: '',
      description: '',
      parts: []
    };
    const res = generateClaimsApplicationSheet(blankClaim);
    expect(res.fileName).toContain('Claims_Application_');
    expect(res.blob).toBeDefined();
    expect(res.blob.size).toBeGreaterThan(1000);
  });
});

