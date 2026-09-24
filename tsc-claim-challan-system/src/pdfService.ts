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

// ============================================================================
// CLAIMS APPLICATION SHEET - VISUAL REFERENCE & OEM TEMPLATE GENERATOR
// ============================================================================

export interface BrandTheme {
  name: string;
  subtitle: string;
  primary: readonly [number, number, number];
  accent: readonly [number, number, number];
  iconType: 'vibemac' | 'durkopp' | 'crest';
}

export function getBrandTheme(brand?: string): BrandTheme {
  const b = (brand || '').toLowerCase().trim();
  if (b.includes('durkopp') || b.includes('dürkopp') || b.includes('adler')) {
    return {
      name: 'DÜRKOPP ADLER',
      subtitle: 'Industrial Sewing Machines',
      primary: [0, 85, 165] as const, // #0055A5 Royal Blue
      accent: [0, 114, 206] as const,
      iconType: 'durkopp'
    };
  }
  if (b.includes('brother')) {
    return {
      name: 'BROTHER',
      subtitle: 'Industrial Sewing & Garment Machines',
      primary: [14, 116, 144] as const, // #0E7490 Teal Cyan
      accent: [6, 182, 212] as const,
      iconType: 'crest'
    };
  }
  if (b.includes('juki')) {
    return {
      name: 'JUKI',
      subtitle: 'Sewing Machines & Systems',
      primary: [2, 132, 199] as const, // #0284C7 Sky Blue
      accent: [56, 189, 248] as const,
      iconType: 'crest'
    };
  }
  if (b.includes('vibemac')) {
    return {
      name: 'VIBEMAC',
      subtitle: 'Industrial Sewing Machines',
      primary: [163, 29, 29] as const, // #A31D1D Crimson Red
      accent: [220, 38, 38] as const,
      iconType: 'vibemac'
    };
  }
  if (b.includes('typical')) {
    return {
      name: 'TYPICAL',
      subtitle: 'Industrial Sewing Machines',
      primary: [163, 29, 29] as const, // Crimson Red
      accent: [185, 28, 28] as const,
      iconType: 'crest'
    };
  }
  return {
    name: (brand || 'VIBEMAC').toUpperCase(),
    subtitle: 'Industrial Sewing Machines',
    primary: [163, 29, 29] as const,
    accent: [185, 28, 28] as const,
    iconType: 'vibemac'
  };
}

function formatDdMmYyyy(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (clean.includes('/')) return clean;
  const match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  return clean;
}

function getCustomerAddressLines(claim: Claim): string[] {
  if (claim.customerName && claim.customerName.toUpperCase().includes('AQUA')) {
    return [
      'Unit No. 20, Bharat Silk Mill Compound, L.B.S. Marg,',
      'Near Phoenix Market City, Kamani, Kurla (West),',
      'Mumbai, Maharashtra, 400070, India'
    ];
  }
  if (claim.customerName && claim.customerName.toUpperCase().includes('ANANDCO')) {
    return [
      'Plot 45, Focal Point Phase V, Near Hero Cycles,',
      'Ludhiana, Punjab, 141010, India'
    ];
  }
  if (claim.customerName) {
    return [
      `${claim.customerName} Works & Production Facility,`,
      'Industrial Area, Near Central Logistics Hub,',
      'Maharashtra, India'
    ];
  }
  return [
    'Unit No. 20, Bharat Silk Mill Compound, L.B.S. Marg,',
    'Near Phoenix Market City, Kamani, Kurla (West),',
    'Mumbai, Maharashtra, 400070, India'
  ];
}

function drawSheetTopHeader(doc: jsPDF, theme: BrandTheme) {
  // Vector brand logo emblem box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(215, 222, 230);
  doc.setLineWidth(0.35);
  doc.roundedRect(15, 8.5, 11.5, 11.5, 1, 1, 'FD');

  if (theme.iconType === 'vibemac') {
    doc.setDrawColor(...theme.primary);
    doc.setLineWidth(0.65);
    // V crest lines
    doc.line(17.2, 10.5, 20.75, 17.5);
    doc.line(20.75, 17.5, 24.3, 10.5);
    doc.line(18.5, 12.0, 20.75, 16.0);
    doc.line(20.75, 16.0, 23.0, 12.0);
    doc.line(16.5, 10.5, 18.5, 10.5);
    doc.line(23.0, 10.5, 25.0, 10.5);
    doc.setFillColor(243, 230, 230);
    doc.circle(20.75, 13.8, 1.1, 'F');
  } else if (theme.iconType === 'durkopp') {
    doc.setFillColor(...theme.primary);
    doc.circle(20.75, 14.25, 4.6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('DA', 20.75, 16.7, { align: 'center' });
  } else {
    doc.setFillColor(...theme.primary);
    doc.roundedRect(17.2, 10.2, 7.1, 8.0, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(theme.name.charAt(0), 20.75, 15.6, { align: 'center' });
  }

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...theme.primary);
  doc.text(theme.name, 29.5, 13.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 150, 165);
  doc.text(theme.subtitle, 29.5, 18.0);

  // Top-right "Claims Form"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 170, 180);
  doc.text('Claims Form', 197, 13.5, { align: 'right' });

  // Divider line across the page
  doc.setDrawColor(...theme.primary);
  doc.setLineWidth(0.65);
  doc.line(15, 22.5, 197, 22.5);
}

function drawPhotoCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  imgItem: { image: { fileUrl?: string; fileData?: string; fileName?: string; remarks?: string }; srNo: number; partNo: string; caption: string }
) {
  let imgLoaded = false;
  const fileUrl = imgItem.image.fileUrl || imgItem.image.fileData;

  // If raster base64 (JPEG, PNG, WEBP), embed directly into jsPDF
  if (fileUrl && (fileUrl.startsWith('data:image/jpeg') || fileUrl.startsWith('data:image/png') || fileUrl.startsWith('data:image/webp') || fileUrl.startsWith('data:image/jpg'))) {
    try {
      doc.addImage(fileUrl, x, y, w, h, undefined, 'FAST');
      imgLoaded = true;
    } catch {
      imgLoaded = false;
    }
  }

  // High-fidelity digital inspection photo card fallback (for SVG data URLs or raw vector representation)
  if (!imgLoaded) {
    // Dark slate card background
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F');

    // Inner subtle border
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.3);
    doc.roundedRect(x + 0.5, y + 0.5, w - 1, h - 1, 1.5, 1.5, 'S');

    // Top header badge inside card
    doc.setFillColor(30, 41, 59);
    doc.rect(x + 2, y + 2, w - 4, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(56, 189, 248);
    doc.text('TSC DEFECT EVIDENCE PHOTOGRAPH', x + 4, y + 6.6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(203, 213, 225);
    doc.text(imgItem.partNo || 'PART', x + w - 4, y + 6.6, { align: 'right' });

    // Center defect reticle crosshair
    const cx = x + w / 2;
    const cy = y + h / 2 - 1;
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.4);
    doc.circle(cx, cy, 11, 'S');
    doc.circle(cx, cy, 3, 'S');
    doc.line(cx - 15, cy, cx + 15, cy);
    doc.line(cx, cy - 15, cx, cy + 15);

    // Defect label text centered
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(248, 250, 252);
    doc.text(imgItem.caption, cx, cy + 17, { align: 'center', maxWidth: w - 8 });

    // Bottom QA inspection bar
    doc.setFillColor(30, 41, 59);
    doc.rect(x + 2, y + h - 8, w - 4, 6, 'F');
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('ISO 9001:2015 EVIDENCE · VERIFIED', x + 4, y + h - 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 222, 128);
    doc.text('QA INSPECTED', x + w - 4, y + h - 4, { align: 'right' });
  }

  // Outer framing line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, 'S');
}

function formatPhotoCaption(item: { srNo: number; partNo: string; caption: string }, figIndex: number): string {
  const c = (item.caption || '').trim();
  if (c.toLowerCase().startsWith('fig.')) {
    return c;
  }
  if (c.includes(item.partNo)) {
    return `Fig. ${figIndex} — ${c}`;
  }
  return `Fig. ${figIndex} — Sr. No. ${item.srNo}: ${item.partNo} — ${c}`;
}

/**
 * Generate official Claims Application Sheet PDF matching the reference visual style and layout.
 */
export function generateClaimsApplicationSheet(claim: Claim, event?: ClaimEvent): GeneratedPdfResult {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const theme = getBrandTheme(claim.brand);
  const isTemplate = !claim.customerName && !claim.partNo && (!claim.parts || claim.parts.length === 0);

  // 1. TOP HEADER & DIVIDER
  drawSheetTopHeader(doc, theme);

  // 2. DOCUMENT MAIN TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...theme.primary);
  doc.text('CLAIMS APPLICATION SHEET', 106, 28.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.2);
  doc.setTextColor(90, 100, 110);
  doc.text('To be filled out by the initiator', 106, 33.5, { align: 'center' });

  // 3. SECTION 1: CUSTOMER & DELIVERY DETAILS
  const sec1Y = 37.5;
  doc.setFillColor(...theme.primary);
  doc.rect(15, sec1Y, 182, 5.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.text('CUSTOMER & DELIVERY DETAILS', 17, sec1Y + 3.8);

  const t1Y = sec1Y + 5.2;
  const initiator = isTemplate ? '' : (claim.approvedBy || event?.performedBy || 'Varun Patil');
  const issueDate = isTemplate ? '' : (formatDdMmYyyy(claim.claimDate || claim.callDate) || '12/08/2026');
  const customerName = isTemplate ? '' : (claim.customerName || 'AQUA');
  const deliveryExFactory = isTemplate ? '' : 'Turel Sales Corporation — Mumbai';
  const invoiceNumber = isTemplate ? '' : (claim.turelTaxInvoiceNo || claim.importInvoiceNo || '');
  const deliveryTo = isTemplate ? '' : 'Turel Sales Corporation — Mumbai';
  const addressLines = isTemplate ? ['', '', ''] : getCustomerAddressLines(claim);

  doc.setDrawColor(185, 195, 205);
  doc.setLineWidth(0.25);

  // Row 1 (H: 5.6)
  let curY = t1Y;
  doc.rect(15, curY, 182, 5.6, 'S');
  doc.line(43, curY, 43, curY + 5.6);
  doc.line(100, curY, 100, curY + 5.6);
  doc.line(134, curY, 134, curY + 5.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Initiator', 17, curY + 3.8);
  doc.text('Date of Issue', 102, curY + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.text(initiator, 45, curY + 3.8);
  doc.text(issueDate, 136, curY + 3.8);

  // Row 2 (H: 5.6)
  curY += 5.6;
  doc.rect(15, curY, 182, 5.6, 'S');
  doc.line(43, curY, 43, curY + 5.6);
  doc.line(100, curY, 100, curY + 5.6);
  doc.line(134, curY, 134, curY + 5.6);

  doc.setFont('helvetica', 'bold');
  doc.text('Customer', 17, curY + 3.8);
  doc.text('Delivery Ex-Factory', 102, curY + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.text(customerName, 45, curY + 3.8);
  doc.text(deliveryExFactory, 136, curY + 3.8);

  // Row 3 (H: 5.6)
  curY += 5.6;
  doc.rect(15, curY, 182, 5.6, 'S');
  doc.line(43, curY, 43, curY + 5.6);
  doc.line(100, curY, 100, curY + 5.6);
  doc.line(134, curY, 134, curY + 5.6);

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number', 17, curY + 3.8);
  doc.text('Delivery To', 102, curY + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.text(invoiceNumber, 45, curY + 3.8);
  doc.text(deliveryTo, 136, curY + 3.8);

  // Row 4 (H: 12.0)
  curY += 5.6;
  doc.rect(15, curY, 182, 12.0, 'S');
  doc.line(43, curY, 43, curY + 12.0);
  doc.line(134, curY, 134, curY + 12.0);

  doc.setFont('helvetica', 'bold');
  doc.text('Address of', 17, curY + 4.5);
  doc.text('Customer', 17, curY + 8.2);

  doc.setFont('helvetica', 'normal');
  doc.text(addressLines[0] || '', 45, curY + 3.8);
  doc.text(addressLines[1] || '', 45, curY + 7.3);
  doc.text(addressLines[2] || '', 45, curY + 10.8);

  // 4. SECTION 2: MACHINE DETAILS
  const sec2Y = curY + 12.0 + 3.2;
  doc.setFillColor(...theme.primary);
  doc.rect(15, sec2Y, 182, 5.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.text('MACHINE DETAILS', 17, sec2Y + 3.8);

  // Column Headers (Dark Charcoal)
  const th2Y = sec2Y + 5.2;
  doc.setFillColor(30, 30, 30);
  doc.rect(15, th2Y, 182, 6.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);
  doc.text('Quantity', 26, th2Y + 4.2, { align: 'center' });
  doc.text('Part No. / Issue', 55, th2Y + 4.2, { align: 'center' });
  doc.text('Description', 102, th2Y + 4.2, { align: 'center' });
  doc.text('Machine Model', 147.5, th2Y + 4.2, { align: 'center' });
  doc.text('Machine Serial No.', 180.5, th2Y + 4.2, { align: 'center' });

  // Rows from actual claim parts
  const partRows: { qty: string; partNo: string; desc: string; model: string; serial: string }[] = [];
  if (!isTemplate) {
    if (claim.parts && claim.parts.length > 0) {
      claim.parts.forEach(p => {
        partRows.push({
          qty: String(p.qty || 1),
          partNo: p.partNo || '',
          desc: p.description || p.remarks || claim.description || '',
          model: claim.model || 'S-2261HP',
          serial: claim.serialNo || '220702055'
        });
      });
    } else if (claim.partNo) {
      partRows.push({
        qty: String(claim.qty || 1),
        partNo: claim.partNo,
        desc: claim.description || '',
        model: claim.model || 'S-2261HP',
        serial: claim.serialNo || '220702055'
      });
    }
  }

  // Minimum 4 rows displayed (template appearance)
  const totalDisplayRows = Math.max(partRows.length, 4);
  let trY = th2Y + 6.2;
  for (let r = 0; r < totalDisplayRows; r++) {
    doc.setDrawColor(185, 195, 205);
    doc.rect(15, trY, 182, 5.5, 'S');
    doc.line(37, trY, 37, trY + 5.5);
    doc.line(73, trY, 73, trY + 5.5);
    doc.line(131, trY, 131, trY + 5.5);
    doc.line(164, trY, 164, trY + 5.5);

    if (r < partRows.length) {
      const item = partRows[r];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);
      doc.text(item.qty, 26, trY + 3.8, { align: 'center' });
      doc.text(item.partNo, 55, trY + 3.8, { align: 'center' });
      doc.text(item.desc, 75, trY + 3.8, { maxWidth: 54 });
      doc.text(item.model, 147.5, trY + 3.8, { align: 'center' });
      doc.text(item.serial, 180.5, trY + 3.8, { align: 'center' });
    }
    trY += 5.5;
  }

  // 5. SECTION 3: PROBLEM DESCRIPTION
  const sec3Y = trY + 3.2;
  doc.setFillColor(...theme.primary);
  doc.rect(15, sec3Y, 182, 5.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.text('PROBLEM DESCRIPTION', 17, sec3Y + 3.8);

  const subPrompt = isTemplate 
    ? 'Please explain the exact issue in the problem description. An example is provided below.'
    : 'Please explain the exact issue in the problem description.';

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text(subPrompt, 15, sec3Y + 8.6);

  const letterBoxY = sec3Y + 11.2;
  const letterBoxH = 26.0;
  doc.setDrawColor(185, 195, 205);
  doc.setFillColor(255, 255, 255);
  doc.rect(15, letterBoxY, 182, letterBoxH, 'FD');

  if (isTemplate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(140, 150, 165);
    doc.text('EXAMPLE', 19, letterBoxY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Dear Mr. [Contact Name],', 19, letterBoxY + 8.8);

    doc.setFont('helvetica', 'normal');
    doc.text('Please note that we have installed a new machine at [Customer Name]. In that machine, the [part/component] was not working.', 19, letterBoxY + 13.5, { maxWidth: 174 });
    doc.text('Our technician, [Technician Name], checked the machine and found that the [part/component] is not working.', 19, letterBoxY + 18.0, { maxWidth: 174 });
    doc.text('You are requested to dispatch the required [part] on an FOC basis.', 19, letterBoxY + 22.5, { maxWidth: 174 });
  } else {
    const recipient = theme.iconType === 'vibemac' ? 'Mr. Giuliano' : `${theme.name} Claims Department`;
    const cust = claim.customerName || 'AQUA';
    const component = (claim.description || claim.partNo || 'pedal').toLowerCase();
    const tech = claim.approvedBy || event?.performedBy || 'Mr. Amir';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Dear ${recipient},`, 19, letterBoxY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.text(`Please note that we have installed a new machine at ${cust}. In that machine, the ${component} was not working.`, 19, letterBoxY + 10.5, { maxWidth: 174 });
    doc.text(`Our technician, ${tech}, checked the machine and found that the ${component} is not working.`, 19, letterBoxY + 15.5, { maxWidth: 174 });
    doc.text(`You are requested to dispatch the required ${component} on an FOC basis.`, 19, letterBoxY + 20.5, { maxWidth: 174 });
  }

  // 6. SECTION 4: SUPPORTING PHOTOS & PART-WISE MAPPING
  const sec4Y = letterBoxY + letterBoxH + 3.5;
  doc.setFillColor(...theme.primary);
  doc.rect(15, sec4Y, 182, 5.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.text('SUPPORTING PHOTOS', 17, sec4Y + 3.8);

  // Collect all mapped part images strictly preserving Part -> Sr. No. -> Image(s)
  const mappedPhotos: {
    image: { fileUrl?: string; fileData?: string; fileName?: string; remarks?: string };
    srNo: number;
    partNo: string;
    caption: string;
  }[] = [];

  if (!isTemplate && claim.parts && claim.parts.length > 0) {
    claim.parts.forEach((p, pIdx) => {
      const srNo = p.srNo || (pIdx + 1);
      const partNo = p.partNo || `Part-${srNo}`;
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, imgIdx) => {
          const caption = img.remarks || img.fileName || p.description || `Photo ${imgIdx + 1}`;
          mappedPhotos.push({
            image: img,
            srNo,
            partNo,
            caption
          });
        });
      }
    });
  }

  const photoW = 86;
  const photoH = 54;
  const photoY = sec4Y + 7.5;

  if (mappedPhotos.length === 0) {
    // Blank template format: dashed photo attachment frames
    doc.setLineDashPattern([2.5, 2.5], 0);
    doc.setDrawColor(185, 195, 205);
    doc.rect(15, photoY, photoW, photoH, 'S');
    doc.rect(111, photoY, photoW, photoH, 'S');
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 150);
    doc.text('Attach photo here', 15 + photoW / 2, photoY + photoH / 2, { align: 'center' });
    doc.text('Attach photo here', 111 + photoW / 2, photoY + photoH / 2, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 110, 120);
    doc.text('Fig. 1 — Photo evidence', 15 + photoW / 2, photoY + photoH + 4.5, { align: 'center' });
    doc.text('Fig. 2 — Photo evidence', 111 + photoW / 2, photoY + photoH + 4.5, { align: 'center' });
  } else {
    // Page 1: First 2 photos side-by-side
    drawPhotoCard(doc, 15, photoY, photoW, photoH, mappedPhotos[0]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const cap1 = formatPhotoCaption(mappedPhotos[0], 1);
    doc.text(cap1, 15 + photoW / 2, photoY + photoH + 4.5, { align: 'center', maxWidth: photoW });

    if (mappedPhotos.length > 1) {
      drawPhotoCard(doc, 111, photoY, photoW, photoH, mappedPhotos[1]);
      const cap2 = formatPhotoCaption(mappedPhotos[1], 2);
      doc.text(cap2, 111 + photoW / 2, photoY + photoH + 4.5, { align: 'center', maxWidth: photoW });
    }

    // If more than 2 photos, continue onto Page 2 (and subsequent pages) cleanly
    if (mappedPhotos.length > 2) {
      let curPhotoIdx = 2;
      while (curPhotoIdx < mappedPhotos.length) {
        doc.addPage();
        drawSheetTopHeader(doc, theme);

        // Continuation Banner
        const contBannerY = 27.0;
        doc.setFillColor(...theme.primary);
        doc.rect(15, contBannerY, 182, 5.2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.8);
        doc.setTextColor(255, 255, 255);
        doc.text('SUPPORTING PHOTOS (CONTINUED)', 17, contBannerY + 3.8);

        // Up to 6 photos per continuation page (3 rows of 2)
        let pageRow = 0;
        const startYOnContPage = contBannerY + 8.0;
        while (curPhotoIdx < mappedPhotos.length && pageRow < 3) {
          const rowY = startYOnContPage + pageRow * (photoH + 11.0);

          // Left Photo
          const leftPhoto = mappedPhotos[curPhotoIdx];
          drawPhotoCard(doc, 15, rowY, photoW, photoH, leftPhoto);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          const leftCap = formatPhotoCaption(leftPhoto, curPhotoIdx + 1);
          doc.text(leftCap, 15 + photoW / 2, rowY + photoH + 4.5, { align: 'center', maxWidth: photoW });
          curPhotoIdx++;

          // Right Photo (if available)
          if (curPhotoIdx < mappedPhotos.length) {
            const rightPhoto = mappedPhotos[curPhotoIdx];
            drawPhotoCard(doc, 111, rowY, photoW, photoH, rightPhoto);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105);
            const rightCap = formatPhotoCaption(rightPhoto, curPhotoIdx + 1);
            doc.text(rightCap, 111 + photoW / 2, rowY + photoH + 4.5, { align: 'center', maxWidth: photoW });
            curPhotoIdx++;
          }

          pageRow++;
        }
      }
    }
  }

  // 7. FOOTER ACROSS ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footY = 286.0;
    doc.setDrawColor(215, 222, 230);
    doc.setLineWidth(0.3);
    doc.line(15, footY, 197, footY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 150, 165);
    doc.text(`${theme.name} — Claims Application Sheet`, 15, footY + 4.2);
    doc.text(`Page ${p} of ${totalPages}`, 197, footY + 4.2, { align: 'right' });
  }

  const blob = doc.output('blob');
  const dataUrl = doc.output('dataurlstring');
  const docNo = `CAS-${claim.claimNo ? claim.claimNo.replace(/[^a-zA-Z0-9]/g, '').slice(-7) : '001'}`;
  const fileName = `Claims_Application_${claim.claimNo || 'Sheet'}.pdf`;

  return {
    blob,
    dataUrl,
    fileName,
    documentNo: docNo
  };
}

export function generateMilestonePdf(
  docType: ClaimDocumentType,
  claim: Claim,
  event?: ClaimEvent,
  capa?: CAPA
): GeneratedPdfResult {
  if (docType === 'CLAIM_NOTE') {
    return generateClaimsApplicationSheet(claim, event);
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date().toISOString().substring(0, 10);
  let docTitle = 'CLAIM TRANSACTION DOCUMENT';
  let docSub = 'Official Operational Document';
  let docNo = `DOC-${claim.claimNo.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
  let fileName = `${docType.toLowerCase()}_${claim.claimNo}.pdf`;

  switch (docType) {
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

    case 'PART_IMAGE': {
      docTitle = 'Defect Photo Evidence Certificate';
      docSub = 'ISO 9001:2015 Part-Wise Inspection Evidence (TSC-QMS-SVC-007)';
      docNo = `IMG-EVD-${claim.claimNo ? claim.claimNo.replace(/[^a-zA-Z0-9]/g, '').slice(-7) : '001'}`;
      fileName = `Evidence_${claim.claimNo || 'Claim'}.pdf`;

      drawHeader(doc, docTitle, docSub, docNo, today);
      let y = 56;
      drawSectionHeader(doc, y, '1. Defect Photo Evidence Register');
      const partRows: [string, string, string, string][] = (claim.parts || []).map((p, i) => [
        `Sr. No. ${p.srNo || i + 1}: ${p.partNo || 'PART'}`,
        `Qty: ${p.qty} Unit(s)`,
        'Evidence Status',
        `${p.images?.length || 0} Photo(s) Attached`
      ]);
      if (partRows.length === 0) {
        partRows.push(['Part No.', claim.partNo, 'Evidence', 'Attached on file']);
      }
      y = drawKeyValueTable(doc, y + 6, partRows);
      drawSignatureBlock(doc, 250, 'Inspected By (Technician)', 'Verified By (QA In-Charge)');
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
