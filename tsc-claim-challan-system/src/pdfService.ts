import { jsPDF } from 'jspdf';
import { Claim, ClaimEvent, ClaimDocumentType, CAPA, gates } from './domain';

export interface GeneratedPdfResult {
  blob: Blob;
  dataUrl: string;
  fileName: string;
  documentNo: string;
}

// Corporate Brand Colors
const COLOR_PRIMARY = [15, 41, 66] as const;      // Turel Deep Navy
const COLOR_SECONDARY = [30, 78, 121] as const;   // Turel Steel Blue
const COLOR_ACCENT = [217, 119, 6] as const;      // Warm Amber
const COLOR_TEXT = [51, 65, 85] as const;         // Slate Text
const COLOR_MUTED = [100, 116, 139] as const;     // Muted Gray
const COLOR_BORDER = [203, 213, 225] as const;    // Table Border Gray
const COLOR_BG_LIGHT = [248, 250, 252] as const;  // Light Card Fill
const COLOR_PASS = [21, 128, 61] as const;        // Success Green

function drawHeader(doc: jsPDF, title: string, docSub: string, docNo: string, docDate: string) {
  // Top brand band
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setFillColor(...COLOR_ACCENT);
  doc.rect(0, 26, 210, 1.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TUREL GROUP  |  TUREL SERVICE CORPORATION', 15, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text('Enterprise Warranty & Claim Challan Management System · ISO 9001:2015 QMS', 15, 18);
  doc.text('Ref: TSC-QMS-SVC-007', 15, 22);

  // Document Title Box
  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.setDrawColor(...COLOR_BORDER);
  doc.roundedRect(15, 32, 180, 18, 1.5, 1.5, 'FD');

  doc.setTextColor(...COLOR_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), 20, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(docSub, 20, 46);

  // Doc No & Date on the right
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(`Doc No: ${docNo}`, 190, 40, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Date: ${docDate}`, 190, 46, { align: 'right' });
}

function drawSectionHeader(doc: jsPDF, y: number, text: string) {
  doc.setFillColor(...COLOR_SECONDARY);
  doc.rect(15, y, 180, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(text.toUpperCase(), 18, y + 4.2);
}

function drawKeyValueTable(doc: jsPDF, y: number, rows: [string, string, string, string][]) {
  doc.setFontSize(8);
  const rowHeight = 6.5;
  const colW1 = 35;
  const colW2 = 55;
  const colW3 = 35;
  const colW4 = 55;

  rows.forEach((row, i) => {
    const curY = y + i * rowHeight;
    // Row background
    if (i % 2 === 0) {
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.rect(15, curY, 180, rowHeight, 'F');
    }
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(15, curY, 180, rowHeight, 'S');

    // Col 1 label
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_MUTED);
    doc.text(row[0], 17, curY + 4.5);

    // Col 1 value
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_TEXT);
    doc.text(String(row[1] || '—'), 15 + colW1 + 2, curY + 4.5, { maxWidth: colW2 - 4 });

    // Col 2 label
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_MUTED);
    doc.text(row[2], 15 + colW1 + colW2 + 2, curY + 4.5);

    // Col 2 value
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_TEXT);
    doc.text(String(row[3] || '—'), 15 + colW1 + colW2 + colW3 + 2, curY + 4.5, { maxWidth: colW4 - 4 });
  });

  return y + rows.length * rowHeight;
}

function drawFooter(doc: jsPDF, claimNo: string, docNo: string) {
  const y = 282;
  doc.setDrawColor(...COLOR_BORDER);
  doc.line(15, y, 195, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Claim Ref: ${claimNo}  |  Doc Ref: ${docNo}  |  Certified Controlled QMS Record`, 15, y + 4);
  doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`, 195, y + 4, { align: 'right' });
}

function drawSignatureBlock(doc: jsPDF, y: number, leftTitle: string, rightTitle: string) {
  const boxW = 85;
  const boxH = 20;

  // Left signature box
  doc.setDrawColor(...COLOR_BORDER);
  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.roundedRect(15, y, boxW, boxH, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(leftTitle, 18, y + 5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Signature & Official Seal', 18, y + 17);

  // Right signature box
  doc.roundedRect(110, y, boxW, boxH, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(rightTitle, 113, y + 5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Signature & Official Seal', 113, y + 17);
}

export function generateMilestonePdf(
  docType: ClaimDocumentType,
  claim: Claim,
  event?: ClaimEvent,
  capa?: CAPA
): GeneratedPdfResult {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date().toISOString().substring(0, 10);
  let docTitle = 'CLAIM TRANSACTION DOCUMENT';
  let docSub = 'Official Operational Document';
  let docNo = `DOC-${claim.claimNo.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
  let fileName = `${docType.toLowerCase()}_${claim.claimNo}.pdf`;

  switch (docType) {
    case 'CLAIM_NOTE': {
      docTitle = 'Claim Intimation Slip';
      docSub = 'Warranty Registration & Defect Intimation Note';
      docNo = `CIS-${claim.claimNo.substring(claim.claimNo.length - 7)}`;
      fileName = `Intimation_${claim.claimNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, claim.claimDate || today);

      let y = 56;
      drawSectionHeader(doc, y, '1. Claim & Call Registration Particulars');
      y = drawKeyValueTable(doc, y + 6, [
        ['Claim No.', claim.claimNo, 'Claim Date', claim.claimDate || today],
        ['Call No.', claim.callNo, 'Call Date', claim.callDate || today],
        ['Claim Against', claim.claimAgainst || 'Service Call', 'Claim Category', claim.category],
        ['Created By', event?.performedBy || 'Service Desk', 'Current Status', 'Initiated / Open']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Customer & Machine Identification');
      y = drawKeyValueTable(doc, y + 6, [
        ['Customer Name', claim.customerName, 'Machine Brand', claim.brand || 'Typical'],
        ['Machine Model', claim.model || '—', 'Serial No.', claim.serialNo || '—'],
        ['Failed Part No.', claim.partNo, 'Part Description', claim.description || '—'],
        ['Claim Quantity', `${claim.qty} Unit(s)`, 'Installation Date', claim.installationDate || '—']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '3. Commercial & Invoice References');
      y = drawKeyValueTable(doc, y + 6, [
        ['Import Invoice No.', claim.importInvoiceNo || '—', 'Import Inv Date', claim.importInvoiceDate || '—'],
        ['Turel Tax Inv No.', claim.turelTaxInvoiceNo || '—', 'Turel Inv Date', claim.turelTaxInvoiceDate || '—']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '4. Technical Defect Description & Initial Remarks');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 20, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(
        claim.remark || claim.rootCauseBrief || 'Warranty defect reported during operation. Part inspected for OEM replacement coverage.',
        18,
        y + 12,
        { maxWidth: 174 }
      );

      drawSignatureBlock(doc, 250, 'Prepared By (Service Technician)', 'Verified By (Service Head)');
      break;
    }

    case 'APPROVAL_NOTE': {
      docTitle = 'Technical / QA Approval Voucher';
      docSub = 'Warranty Legitimacy & Engineering Disposition Certificate';
      docNo = `APV-${claim.claimNo.substring(claim.claimNo.length - 7)}`;
      fileName = `Approval_${claim.claimNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, claim.approvedDate || today);

      let y = 56;
      drawSectionHeader(doc, y, '1. Claim Identification');
      y = drawKeyValueTable(doc, y + 6, [
        ['Claim No.', claim.claimNo, 'Claim Date', claim.claimDate || today],
        ['Customer Name', claim.customerName, 'Machine Model', claim.model || '—'],
        ['Defective Part No.', claim.partNo, 'Part Description', claim.description || '—'],
        ['Serial No.', claim.serialNo, 'Claim Category', claim.category]
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Technical Evaluation & Legitimacy Review');
      y = drawKeyValueTable(doc, y + 6, [
        ['Warranty Legitimacy', 'VERIFIED VALID', 'Coverage Status', 'Under Warranty'],
        ['Approved By', claim.approvedBy || event?.performedBy || 'Swapnil (Service Head)', 'Approval Date', claim.approvedDate || today],
        ['Approval Decision', 'APPROVED', 'Authorization', 'Proceed with OEM Warranty Filing']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '3. Quality Disposition & Action Authorization');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 24, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(
        claim.approvalRemarks || 'The technical report and operating conditions confirm manufacturing defect. Authorized for immediate OEM warranty filing and parallel interim customer sourcing in accordance with procedure TSC-QMS-SVC-007.',
        18,
        y + 12,
        { maxWidth: 174 }
      );

      drawSignatureBlock(doc, 250, 'Evaluated By (Technical Lead)', 'Approved By (Head of Service)');
      break;
    }

    case 'OEM_DOCUMENT': {
      docTitle = 'OEM Warranty Claim Form';
      docSub = 'Manufacturer Transmission & Warranty Filing Document';
      docNo = claim.oemClaimNo || `OEM-${Date.now().toString().slice(-6)}`;
      fileName = `OEM_Claim_${claim.oemClaimNo || claim.claimNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, claim.oemClaimDate || today);

      let y = 56;
      drawSectionHeader(doc, y, '1. OEM Vendor & Submission Particulars');
      y = drawKeyValueTable(doc, y + 6, [
        ['OEM Claim No.', claim.oemClaimNo || '—', 'OEM Claim Date', claim.oemClaimDate || today],
        ['Manufacturer / Brand', claim.brand || 'Typical', 'Expected Settlement', claim.oemSettlementExpected || 'Replacement'],
        ['Source Claim No.', claim.claimNo, 'Outcome Status', claim.oemClaimOutcome || 'Pending']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Equipment & Defective Component Specifications');
      y = drawKeyValueTable(doc, y + 6, [
        ['Machine Model', claim.model, 'Machine Serial No.', claim.serialNo],
        ['Part Number', claim.partNo, 'Part Description', claim.description],
        ['Claim Quantity', `${claim.qty} Unit(s)`, 'Import Invoice No.', claim.importInvoiceNo || '—'],
        ['Import Invoice Date', claim.importInvoiceDate || '—', 'Installation Date', claim.installationDate || '—']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '3. Diagnostic Evidence & Failure Analysis');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 28, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(
        `Category: ${claim.category}\n\nTechnical Diagnostic Notes: Component failed prematurely during normal operating parameters. Failure symptoms inspected and verified by TSC service engineers. Inward photos, diagnostic logs, and serial nameplates attached for manufacturer warranty reimbursement/credit note processing.`,
        18,
        y + 12,
        { maxWidth: 174 }
      );

      drawSignatureBlock(doc, 250, 'Submitted By (TSC Service Executive)', 'OEM Acceptance (Authorized Signatory)');
      break;
    }

    case 'GRN': {
      docTitle = 'Goods Receipt Note (GRN)';
      docSub = 'Stores Inward Receipt & Quality Acceptance Note';
      docNo = claim.hoGRNNo || claim.branchGRNNo || claim.damagedPartGRNNo || `GRN-${Date.now().toString().slice(-6)}`;
      fileName = `GRN_${docNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, claim.hoGRNDate || claim.damagedPartGRNDate || today);

      let y = 56;
      drawSectionHeader(doc, y, '1. Material Inward Particulars');
      y = drawKeyValueTable(doc, y + 6, [
        ['GRN Number', docNo, 'GRN Date', claim.hoGRNDate || claim.damagedPartGRNDate || today],
        ['Receiving Location', claim.newPartAtHO === 'Y' ? 'Head Office Central Stores (Mumbai)' : 'Branch Warehouse', 'Material Type', claim.oemReplacementReceived === 'Y' ? 'OEM Replacement Part' : 'Defective Return'],
        ['Claim Reference', claim.claimNo, 'OEM Claim No.', claim.oemClaimNo || '—']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Inwarded Material Specifications');
      y = drawKeyValueTable(doc, y + 6, [
        ['Part Number', claim.partNo, 'Part Description', claim.description],
        ['Quantity Inwarded', `${claim.qty} Unit(s)`, 'Condition on Receipt', 'Inspected / Undamaged'],
        ['Equipment Serial No.', claim.serialNo, 'Origin / Vendor', claim.brand || 'Typical']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '3. Storage & Quality Inspection Certificate');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 22, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(
        'The above replacement material has been received in sound physical condition, verified against packing slip and claim challan records, and posted to the TSC inventory system. Stored at Central Stores pending branch dispatch.',
        18,
        y + 12,
        { maxWidth: 174 }
      );

      drawSignatureBlock(doc, 250, 'Received By (Stores In-Charge)', 'Inspected By (QA Executive)');
      break;
    }

    case 'CHALLAN': {
      docTitle = 'TSC Claim Delivery Challan';
      docSub = 'Controlled Material Movement Challan (TSC-QMS-SVC-007)';
      docNo = claim.claimChallanNo || `CH-${Date.now().toString().slice(-6)}`;
      fileName = `Challan_${claim.claimChallanNo || claim.claimNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, claim.challanDate || today);

      let y = 56;
      drawSectionHeader(doc, y, '1. Challan & Dispatch Identification');
      y = drawKeyValueTable(doc, y + 6, [
        ['Challan No.', docNo, 'Challan Date', claim.challanDate || today],
        ['Source Claim No.', claim.claimNo, 'Call Number', claim.callNo],
        ['Dispatch From', 'Turel Service Corp (Head Office)', 'Consignee / Customer', claim.customerName]
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Consignee & Destination Particulars');
      y = drawKeyValueTable(doc, y + 6, [
        ['Customer Name', claim.customerName, 'Machine Model', claim.model],
        ['Machine Serial No.', claim.serialNo, 'Interim Option', claim.interimOption ? `Option ${claim.interimOption}` : 'Direct']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '3. Dispatched Material Specifications');
      y = drawKeyValueTable(doc, y + 6, [
        ['Part Number', claim.partNo, 'Description', claim.description],
        ['Quantity Dispatched', `${claim.qty} Unit(s)`, 'Tariff / HSN Reference', '84529090'],
        ['Nature of Movement', 'Warranty Replacement Part', 'Commercial Value', 'NIL (Warranty Service)']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '4. Statutory Declaration');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 20, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(
        'DECLARATION: This movement is purely for warranty replacement of defective parts against customer service call. Not for sale. Value stated is strictly for transit / carrier purposes only.',
        18,
        y + 12,
        { maxWidth: 174 }
      );

      drawSignatureBlock(doc, 250, 'Dispatched By (Stores / Logistics)', 'Carrier / Receiver Acknowledgment');
      break;
    }

    case 'DELIVERY_NOTE': {
      docTitle = 'Customer Acknowledgment / Delivery Note';
      docSub = 'Customer Handover & Site Acceptance Receipt';
      docNo = claim.deliveryNoteNo || `DN-${claim.claimNo.substring(claim.claimNo.length - 7)}`;
      fileName = `Delivery_Note_${claim.claimNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, claim.deliveryNoteDate || claim.customerReceiptDate || today);

      let y = 56;
      drawSectionHeader(doc, y, '1. Delivery Note Identification');
      y = drawKeyValueTable(doc, y + 6, [
        ['Delivery Note No.', docNo, 'Delivery Date', claim.deliveryNoteDate || claim.customerReceiptDate || today],
        ['Related Challan No.', claim.claimChallanNo || '—', 'Claim No.', claim.claimNo],
        ['Customer Name', claim.customerName, 'Service Call No.', claim.callNo]
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Handed-Over Component Particulars');
      y = drawKeyValueTable(doc, y + 6, [
        ['Part Number', claim.partNo, 'Part Description', claim.description],
        ['Quantity Handed Over', `${claim.qty} Unit(s)`, 'Machine Serial No.', claim.serialNo],
        ['Machine Model', claim.model, 'Installation Status', 'Replaced & Operational']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '3. Customer Acceptance Declaration');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 28, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(
        'CUSTOMER CONFIRMATION: We hereby confirm receipt of the above warranty replacement component in sound working order. The part has been installed and tested on our machine, and the equipment is restored to full satisfactory operation.',
        18,
        y + 12,
        { maxWidth: 174 }
      );

      drawSignatureBlock(doc, 250, 'Handed Over By (TSC Service Engineer)', 'Accepted By (Customer Authorized Signatory)');
      break;
    }

    case 'FINANCE_NOTE': {
      docTitle = 'Finance Settlement Voucher';
      docSub = 'OEM Receivable Clearance & Expense Reversal Certificate';
      docNo = `FSV-${claim.claimNo.substring(claim.claimNo.length - 7)}`;
      fileName = `Finance_Clearance_${claim.claimNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, today);

      let y = 56;
      drawSectionHeader(doc, y, '1. Settlement & Account Particulars');
      y = drawKeyValueTable(doc, y + 6, [
        ['Voucher No.', docNo, 'Voucher Date', today],
        ['Claim No.', claim.claimNo, 'OEM Claim No.', claim.oemClaimNo || '—'],
        ['Customer Name', claim.customerName, 'OEM Manufacturer', claim.brand || 'Typical']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Financial Reconciliation & Ledger Postings');
      y = drawKeyValueTable(doc, y + 6, [
        ['OEM Credit Note Value', claim.oemCreditValue ? `INR ${claim.oemCreditValue.toLocaleString()}` : 'N/A (Replacement Received)', 'Receivable Status', 'CLEARED'],
        ['Local Purchase Expense', claim.temporaryLocalPurchaseCost ? `INR ${claim.temporaryLocalPurchaseCost.toLocaleString()}` : 'NIL', 'Expense Reversal', claim.localPurchaseExpenseSettled === 'Y' ? 'SETTLED / REVERSED' : 'PENDING'],
        ['Finance Gate Status', 'GATE 4 VERIFIED', 'Clearance Authority', 'Finance Controller (TSC)']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '3. Financial Certification');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 24, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(
        'Finance confirms that all receivables from the OEM manufacturer have been settled or credited, and any temporary local purchase expenditures have been reconciled and reversed in accordance with statutory accounting guidelines.',
        18,
        y + 12,
        { maxWidth: 174 }
      );

      drawSignatureBlock(doc, 250, 'Prepared By (Accounts Officer)', 'Certified By (Finance Controller)');
      break;
    }

    case 'CAPA_EVIDENCE': {
      docTitle = 'ISO 9001 Root Cause & CAPA Sheet';
      docSub = 'Corrective & Preventive Action Report (ISO 9001:2015 Cl. 8.7 / 10.2)';
      docNo = claim.capaNo || capa?.capaNo || `CAPA-${Date.now().toString().slice(-4)}`;
      fileName = `CAPA_Report_${docNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, capa?.dateRaised || today);

      let y = 56;
      drawSectionHeader(doc, y, '1. CAPA Registration & Nonconformity Details');
      y = drawKeyValueTable(doc, y + 6, [
        ['CAPA No.', docNo, 'Date Raised', capa?.dateRaised || today],
        ['Source Claim No.', claim.claimNo, 'ISO Clause Ref', capa?.isoClause || claim.isoClauseRef || 'Cl. 8.7 / 10.2'],
        ['Action Owner', capa?.actionOwner || 'QMS Lead', 'Status', capa?.status || claim.capaStatus || 'Open']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Nonconformity Description');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 16, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(capa?.nonconformityDescription || claim.rootCauseBrief || 'Component failure requiring systemic corrective action.', 18, y + 11, { maxWidth: 174 });

      y += 22;
      drawSectionHeader(doc, y, '3. Root Cause Analysis (5-Why Methodology)');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 16, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(capa?.rootCause5Why || 'Lack of specialized packing checks for heavy transit shipments resulting in repeated component strain.', 18, y + 11, { maxWidth: 174 });

      y += 22;
      drawSectionHeader(doc, y, '4. Corrective Action Plan & Verification');
      y = drawKeyValueTable(doc, y + 6, [
        ['Target Completion Date', capa?.targetDate || '2026-10-31', 'Actual Completion Date', capa?.completionDate || '—'],
        ['Effectiveness Review Date', capa?.effectivenessCheckDate || '2026-11-30', 'Effectiveness Verified', capa?.effectivenessVerified || 'Pending']
      ]);

      drawSignatureBlock(doc, 250, 'Investigated By (QMS Officer)', 'Approved By (Quality Head)');
      break;
    }

    case 'CLOSING_NOTE': {
      docTitle = 'Claim Closing Note';
      docSub = 'Four-Gate QMS Claim Closure Certificate (TSC-QMS-SVC-007)';
      docNo = claim.closingNoteNo || `CCN-${claim.claimNo.substring(claim.claimNo.length - 7)}`;
      fileName = `Closing_Note_${claim.claimNo}.pdf`;
      drawHeader(doc, docTitle, docSub, docNo, claim.closingNoteDate || today);

      let y = 56;
      drawSectionHeader(doc, y, '1. Master Claim Particulars');
      y = drawKeyValueTable(doc, y + 6, [
        ['Claim No.', claim.claimNo, 'Claim Date', claim.claimDate || today],
        ['Customer Name', claim.customerName, 'Machine Brand & Model', `${claim.brand} ${claim.model}`],
        ['Serial No.', claim.serialNo, 'Part Number', claim.partNo],
        ['Claim Category', claim.category, 'Final QMS Status', 'CLOSED (ALL GATES PASSED)']
      ]);

      y += 6;
      drawSectionHeader(doc, y, '2. Complete Lifecycle Milestone References');
      y = drawKeyValueTable(doc, y + 6, [
        ['OEM Claim No.', claim.oemClaimNo || '—', 'OEM Outcome', claim.oemClaimOutcome || 'Settled'],
        ['Claim Challan No.', claim.claimChallanNo || '—', 'Challan Date', claim.challanDate || '—'],
        ['GRN Number', claim.hoGRNNo || claim.branchGRNNo || claim.damagedPartGRNNo || '—', 'Delivery Note No.', claim.deliveryNoteNo || '—'],
        ['CAPA Reference', claim.capaNo || 'N/A', 'Closure Date', claim.closingNoteDate || today]
      ]);

      y += 6;
      drawSectionHeader(doc, y, '3. Mandatory Four-Gate Closure Verification Audit');
      const g = gates(claim);
      const gateRows: [string, string, string, string][] = [
        ['Gate 1: OEM Claim Number', g.oemClaimNo ? '✓ PASSED' : '✕ FAILED', 'Ref', claim.oemClaimNo || 'Missing'],
        ['Gate 2: Replacement / Credit', g.replacementOrCreditVerified ? '✓ PASSED' : '✕ FAILED', 'Status', claim.oemReplacementReceived === 'Y' ? 'Replacement Received' : 'Credit Note Verified'],
        ['Gate 3: Inventory Adjustment', g.inventoryAdjusted ? '✓ PASSED' : '✕ FAILED', 'Status', 'Stores Confirmed'],
        ['Gate 4: Finance Settlement', g.financeCleared ? '✓ PASSED' : '✕ FAILED', 'Status', 'Receivables Cleared']
      ];
      y = drawKeyValueTable(doc, y + 6, gateRows);

      y += 6;
      drawSectionHeader(doc, y, '4. Final QMS Closure Sign-Off');
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(...COLOR_BORDER);
      doc.rect(15, y + 6, 180, 18, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_PASS);
      doc.text('✓ 4 / 4 PROCESS GATES VERIFIED — CLAIM OFFICIALLY CLOSED IN ACCORDANCE WITH ISO 9001:2015', 18, y + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(
        claim.closureRemarks || 'All process gates satisfied. Customer received replacement, damaged inventory adjusted, OEM claim settled, finance receivables cleared.',
        18,
        y + 18,
        { maxWidth: 174 }
      );

      drawSignatureBlock(doc, 250, 'Closed By (Service Head)', 'Audit Verified By (QMS Management Rep)');
      break;
    }
  }

  drawFooter(doc, claim.claimNo, docNo);

  const blob = doc.output('blob');
  const dataUrl = doc.output('dataurlstring');

  return {
    blob,
    dataUrl,
    fileName,
    documentNo: docNo
  };
}

export function downloadPdf(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function viewPdf(blobOrDataUrl: Blob | string) {
  if (typeof blobOrDataUrl === 'string') {
    const w = window.open();
    if (w) {
      w.document.write(`<iframe src="${blobOrDataUrl}" style="width:100%;height:100%;border:none;"></iframe>`);
    }
  } else {
    const url = window.URL.createObjectURL(blobOrDataUrl);
    window.open(url, '_blank');
  }
}
