import React, { useState, useEffect } from 'react';
import { Claim, Config, CATEGORIES, derived, validate, ClaimEvent, ClaimDocument, gates } from '../domain';
import { Repository } from '../repository';
import { GateVerification } from './GateVerification';
import { WorkflowTimeline } from './WorkflowTimeline';
import { StatusBadge, SLAStatusBadge } from './StatusBadge';
import { ClaimLedger } from './ClaimLedger';
import { DocumentVault } from './DocumentVault';
import { generateMilestonePdf } from '../pdfService';
import { 
  X, Save, FileText, Package, ShoppingBag, Truck, Building2, 
  HelpCircle, DollarSign, AlertTriangle, ShieldCheck, History, 
  Paperclip, CheckCircle2, ListOrdered, FolderOpen, Award
} from 'lucide-react';

interface ClaimDetailDrawerProps {
  initial: Claim;
  config: Config;
  allClaims: Claim[];
  onClose: () => void;
  onSave: (c: Claim) => Promise<void>;
  repo: Repository;
}

export function ClaimDetailDrawer({ initial, config, allClaims, onClose, onSave, repo }: ClaimDetailDrawerProps) {
  const [c, setC] = useState<Claim>(initial);
  const [err, setErr] = useState<Record<string, string>>({});
  const [activeTabSection, setActiveTabSection] = useState<string>('all');
  const [events, setEvents] = useState<ClaimEvent[]>([]);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);

  const d = derived(c, config);

  // Load events and documents on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const evs = await repo.getClaimEvents(initial.id);
        const docs = await repo.getClaimDocuments(initial.id);
        if (mounted) {
          setEvents(evs);
          setDocuments(docs);
        }
      } catch (e) {
        console.error('Error fetching events/docs', e);
      }
    })();
    return () => { mounted = false; };
  }, [initial.id, repo]);

  const set = (k: keyof Claim, v: any) => {
    setC(prev => {
      const updated = { ...prev, [k]: v };
      
      // Real-time OEM-first validation check when modifying interimOption or replacement outward
      if (k === 'interimOption' && v && !updated.oemClaimNo) {
        setErr(e => ({ ...e, interimOption: 'OEM-first control: OEM Claim Number is required before interim sourcing can be initiated.' }));
      } else if (k === 'interimOption' && (!v || updated.oemClaimNo)) {
        setErr(e => {
          const newE = { ...e };
          delete newE.interimOption;
          return newE;
        });
      }

      return updated;
    });
  };

  const handleToggleGate = (key: keyof Claim, val: any) => {
    set(key, val);
  };

  // Technical / QA Approval Action
  const handleApproveClaim = async () => {
    const today = new Date().toISOString().substring(0, 10);
    const updated = {
      ...c,
      approvalStatus: 'Approved' as const,
      approvedBy: 'Swapnil (Service Head)',
      approvedDate: today,
      approvalRemarks: c.approvalRemarks || 'Warranty validity verified. Technical evaluation approves OEM submission.'
    };
    setC(updated);

    // Create event and document
    const eventId = crypto.randomUUID();
    const docId = crypto.randomUUID();
    const apvNo = `APV-${c.claimNo ? c.claimNo.replace(/[^a-zA-Z0-9]/g, '').slice(-7) : Date.now().toString().slice(-6)}`;

    const event: ClaimEvent = {
      id: eventId,
      claimId: c.id,
      eventType: 'CLAIM_APPROVED',
      eventDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Approved',
      referenceNo: apvNo,
      remarks: 'Technical verification confirms warranty coverage. Authorized for OEM filing.',
      performedBy: 'Swapnil (Service Head)',
      performedByRole: 'Service Head',
      createdAt: new Date().toISOString(),
      documentId: docId
    };

    const doc: ClaimDocument = {
      id: docId,
      claimId: c.id,
      eventId: eventId,
      documentType: 'APPROVAL_NOTE',
      documentNo: apvNo,
      documentDate: today,
      fileName: `Approval_${c.claimNo || 'Claim'}.pdf`,
      uploadedBy: 'Swapnil (Service Head)',
      uploadedAt: new Date().toISOString(),
      fileSize: '45 KB'
    };

    await repo.addClaimEvent(event);
    await repo.addClaimDocument(doc);
    setEvents(await repo.getClaimEvents(c.id));
    setDocuments(await repo.getClaimDocuments(c.id));
    await onSave(updated);
  };

  // Generate Closing Note Action (Strictly 4-Gate Interlocked)
  const handleGenerateClosingNote = async () => {
    const g = gates(c);
    if (!g.oemClaimNo || !g.replacementOrCreditVerified || !g.inventoryAdjusted || !g.financeCleared) {
      alert('Cannot generate Closing Note: All 4 closure gates must pass first.');
      return;
    }

    const today = new Date().toISOString().substring(0, 10);
    const ccnNo = c.closingNoteNo || `CN-TSC-${c.claimNo ? c.claimNo.replace(/[^a-zA-Z0-9]/g, '').slice(-7) : Date.now().toString().slice(-6)}`;
    const updatedClaim: Claim = {
      ...c,
      closingNoteNo: ccnNo,
      closingNoteDate: today,
      closureRemarks: c.closureRemarks || 'All 4 QMS process gates verified. Defective part handled, replacement delivered, stock adjusted, finance cleared.'
    };
    setC(updatedClaim);

    const eventId = crypto.randomUUID();
    const docId = crypto.randomUUID();

    const event: ClaimEvent = {
      id: eventId,
      claimId: c.id,
      eventType: 'CLOSING_NOTE_CREATED',
      eventDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Closed',
      referenceNo: ccnNo,
      remarks: 'All 4 QMS Gates passed. Formal claim closing certificate issued.',
      performedBy: 'Swapnil (Service Head)',
      performedByRole: 'Service Head',
      createdAt: new Date().toISOString(),
      documentId: docId
    };

    const doc: ClaimDocument = {
      id: docId,
      claimId: c.id,
      eventId: eventId,
      documentType: 'CLOSING_NOTE',
      documentNo: ccnNo,
      documentDate: today,
      fileName: `Closing_Note_${c.claimNo || 'Claim'}.pdf`,
      uploadedBy: 'Swapnil (Service Head)',
      uploadedAt: new Date().toISOString(),
      fileSize: '52 KB'
    };

    await repo.addClaimEvent(event);
    await repo.addClaimDocument(doc);
    setEvents(await repo.getClaimEvents(c.id));
    setDocuments(await repo.getClaimDocuments(c.id));
    await onSave(updatedClaim);
  };

  // Add document from vault upload modal
  const handleAddVaultDocument = async (doc: ClaimDocument) => {
    await repo.addClaimDocument(doc);
    setDocuments(await repo.getClaimDocuments(c.id));
  };

  const save = async () => {
    const e = validate(c, allClaims, c.id);
    setErr(e);
    if (Object.keys(e).length > 0) {
      alert('Please correct highlighted validation errors.');
      return;
    }

    const today = new Date().toISOString().substring(0, 10);
    const existingEvents = await repo.getClaimEvents(c.id);

    // If OEM Claim No newly added, record OEM_CLAIM_RAISED event
    if (c.oemClaimNo && !existingEvents.some(ev => ev.eventType === 'OEM_CLAIM_RAISED')) {
      const eventId = crypto.randomUUID();
      const docId = crypto.randomUUID();
      const ev: ClaimEvent = {
        id: eventId,
        claimId: c.id,
        eventType: 'OEM_CLAIM_RAISED',
        eventDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'OEM Claim Raised',
        referenceNo: c.oemClaimNo,
        remarks: `OEM Claim filed with ${c.brand || 'manufacturer'}.`,
        performedBy: 'Swapnil (Service Head)',
        performedByRole: 'Service Head',
        createdAt: new Date().toISOString(),
        documentId: docId
      };
      const doc: ClaimDocument = {
        id: docId,
        claimId: c.id,
        eventId: eventId,
        documentType: 'OEM_DOCUMENT',
        documentNo: c.oemClaimNo,
        documentDate: c.oemClaimDate || today,
        fileName: `OEM_Claim_${c.oemClaimNo}.pdf`,
        uploadedBy: 'Service Executive',
        uploadedAt: new Date().toISOString(),
        fileSize: '48 KB'
      };
      await repo.addClaimEvent(ev);
      await repo.addClaimDocument(doc);
    }

    // If GRN No entered, record GRN_RECEIVED event
    const grnNo = c.hoGRNNo || c.damagedPartGRNNo || c.branchGRNNo;
    if (grnNo && !existingEvents.some(ev => ev.eventType === 'GRN_RECEIVED')) {
      const eventId = crypto.randomUUID();
      const docId = crypto.randomUUID();
      const ev: ClaimEvent = {
        id: eventId,
        claimId: c.id,
        eventType: 'GRN_RECEIVED',
        eventDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Material Inwarded',
        referenceNo: grnNo,
        remarks: `Material inwarded against ${grnNo}.`,
        performedBy: 'Stores In-Charge',
        performedByRole: 'Central Stores',
        createdAt: new Date().toISOString(),
        documentId: docId
      };
      const doc: ClaimDocument = {
        id: docId,
        claimId: c.id,
        eventId: eventId,
        documentType: 'GRN',
        documentNo: grnNo,
        documentDate: c.hoGRNDate || c.damagedPartGRNDate || today,
        fileName: `GRN_${grnNo}.pdf`,
        uploadedBy: 'Stores In-Charge',
        uploadedAt: new Date().toISOString(),
        fileSize: '44 KB'
      };
      await repo.addClaimEvent(ev);
      await repo.addClaimDocument(doc);
    }

    // If Challan No entered, record CHALLAN_CREATED event
    if (c.claimChallanNo && !existingEvents.some(ev => ev.eventType === 'CHALLAN_CREATED')) {
      const eventId = crypto.randomUUID();
      const docId = crypto.randomUUID();
      const ev: ClaimEvent = {
        id: eventId,
        claimId: c.id,
        eventType: 'CHALLAN_CREATED',
        eventDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Challan Created',
        referenceNo: c.claimChallanNo,
        remarks: 'Claim delivery challan created for material movement.',
        performedBy: 'Logistics Desk',
        performedByRole: 'Logistics Officer',
        createdAt: new Date().toISOString(),
        documentId: docId
      };
      const doc: ClaimDocument = {
        id: docId,
        claimId: c.id,
        eventId: eventId,
        documentType: 'CHALLAN',
        documentNo: c.claimChallanNo,
        documentDate: c.challanDate || today,
        fileName: `Challan_${c.claimChallanNo.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        uploadedBy: 'Logistics Desk',
        uploadedAt: new Date().toISOString(),
        fileSize: '46 KB'
      };
      await repo.addClaimEvent(ev);
      await repo.addClaimDocument(doc);
    }

    // If Delivery Note No entered, record DELIVERY_NOTE_CREATED event
    if (c.deliveryNoteNo && !existingEvents.some(ev => ev.eventType === 'DELIVERY_NOTE_CREATED')) {
      const eventId = crypto.randomUUID();
      const docId = crypto.randomUUID();
      const ev: ClaimEvent = {
        id: eventId,
        claimId: c.id,
        eventType: 'DELIVERY_NOTE_CREATED',
        eventDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Delivered to Customer',
        referenceNo: c.deliveryNoteNo,
        remarks: 'Customer acknowledgment note created and signed.',
        performedBy: 'Branch Technician',
        performedByRole: 'Service Engineer',
        createdAt: new Date().toISOString(),
        documentId: docId
      };
      const doc: ClaimDocument = {
        id: docId,
        claimId: c.id,
        eventId: eventId,
        documentType: 'DELIVERY_NOTE',
        documentNo: c.deliveryNoteNo,
        documentDate: c.deliveryNoteDate || c.customerReceiptDate || today,
        fileName: `Delivery_Note_${c.deliveryNoteNo}.pdf`,
        uploadedBy: 'Technician',
        uploadedAt: new Date().toISOString(),
        fileSize: '43 KB'
      };
      await repo.addClaimEvent(ev);
      await repo.addClaimDocument(doc);
    }

    // If Finance Cleared, record FINANCE_CLEARED event
    if (c.financeReceivableCleared === 'Y' && !existingEvents.some(ev => ev.eventType === 'FINANCE_CLEARED')) {
      const eventId = crypto.randomUUID();
      const docId = crypto.randomUUID();
      const fsvNo = `FSV-${c.claimNo ? c.claimNo.replace(/[^a-zA-Z0-9]/g, '').slice(-7) : Date.now().toString().slice(-6)}`;
      const ev: ClaimEvent = {
        id: eventId,
        claimId: c.id,
        eventType: 'FINANCE_CLEARED',
        eventDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Finance Cleared',
        referenceNo: fsvNo,
        remarks: 'Finance confirms OEM receivable clearance and account settlement.',
        performedBy: 'Finance Controller',
        performedByRole: 'Finance Lead',
        createdAt: new Date().toISOString(),
        documentId: docId
      };
      const doc: ClaimDocument = {
        id: docId,
        claimId: c.id,
        eventId: eventId,
        documentType: 'FINANCE_NOTE',
        documentNo: fsvNo,
        documentDate: today,
        fileName: `Finance_Clearance_${c.claimNo || 'Claim'}.pdf`,
        uploadedBy: 'Finance Controller',
        uploadedAt: new Date().toISOString(),
        fileSize: '44 KB'
      };
      await repo.addClaimEvent(ev);
      await repo.addClaimDocument(doc);
    }

    // Append Audit Trail Event for system change history
    const auditLogs = c.auditLogs || [];
    const newLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'Service Head',
      action: 'Claim Data Updated & Validated',
      previousValue: 'Previous State',
      newValue: `Status: ${d.status}, Gates Passed: ${Object.values(d.g).filter(Boolean).length}/4`
    };

    await onSave({
      ...c,
      auditLogs: [newLog, ...auditLogs],
      updatedAt: new Date().toISOString()
    });

    setEvents(await repo.getClaimEvents(c.id));
    setDocuments(await repo.getClaimDocuments(c.id));
    onClose();
  };

  const sections = [
    { id: 'closure', label: 'Closure Control & 4 Gates', icon: ShieldCheck },
    { id: 'ledger', label: 'Claim Ledger', icon: ListOrdered },
    { id: 'info', label: 'Claim Information', icon: FileText },
    { id: 'customer', label: 'Customer / Product', icon: Package },
    { id: 'commercial', label: 'Commercial / Invoice', icon: ShoppingBag },
    { id: 'movement', label: 'Material Movement', icon: Truck },
    { id: 'oem', label: 'OEM (Mandatory First)', icon: Building2 },
    { id: 'interim', label: 'Interim Sourcing', icon: AlertTriangle },
    { id: 'finance', label: 'Finance & Receivables', icon: DollarSign },
    { id: 'capa', label: 'CAPA Controls', icon: HelpCircle },
    { id: 'vault', label: 'Document Vault', icon: FolderOpen },
    { id: 'audit', label: 'Audit Trail', icon: History }
  ];

  return (
    <div className="overlay">
      <aside className="enterprise-drawer">
        {/* DRAWER HEADER */}
        <header className="drawer-header">
          <div className="header-meta">
            <div className="title-row">
              <span className="qms-tag">CONTROLLED CLAIM RECORD</span>
              <StatusBadge status={c.source || 'MANUAL_PILOT'} type="info" />
              <StatusBadge status={d.final === 'Closed' ? 'Closed' : d.status} type={d.final === 'Closed' ? 'ok' : 'w'} />
              {c.approvalStatus === 'Approved' && (
                <span className="status-badge-approved">✓ QA Approved</span>
              )}
            </div>
            <h2 className="claim-heading">{c.claimNo || 'New Claim Filing'}</h2>
            <p className="claim-sub">
              {c.customerName ? `${c.customerName} · Call No: ${c.callNo || 'N/A'}` : 'Fill in required call & component details below.'}
            </p>
          </div>
          <div className="header-actions">
            {c.approvalStatus !== 'Approved' && (
              <button 
                type="button" 
                className="secondary-btn approve-btn" 
                onClick={handleApproveClaim}
                title="Authorize Technical & Warranty Approval"
              >
                <Award size={16} />
                <span>Approve Claim</span>
              </button>
            )}
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="primary-btn" onClick={save}>
              <Save size={16} />
              <span>Save Changes</span>
            </button>
            <button type="button" className="drawer-close-x" onClick={onClose}>×</button>
          </div>
        </header>

        {/* OEM-FIRST ALERT BANNER IF ERROR EXISTS */}
        {err.interimOption && (
          <div className="oem-first-error-banner">
            <AlertTriangle size={20} />
            <div>
              <strong>OEM-First Processing Violation:</strong>
              <p>{err.interimOption}</p>
            </div>
          </div>
        )}

        {/* SECTION QUICK FILTER TABS */}
        <div className="drawer-nav-bar">
          <button 
            type="button"
            className={`drawer-nav-tab ${activeTabSection === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTabSection('all')}
          >
            All Sections
          </button>
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                type="button"
                key={s.id}
                className={`drawer-nav-tab ${activeTabSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveTabSection(s.id)}
              >
                <Icon size={14} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* DRAWER MAIN CONTENT */}
        <main className="drawer-body">

          {/* 1. CLOSURE CONTROL & 4 GATES */}
          {(activeTabSection === 'all' || activeTabSection === 'closure') && (
            <div className="drawer-section-group">
              <GateVerification 
                claim={c} 
                config={config} 
                onToggleGate={handleToggleGate} 
                onGenerateClosingNote={handleGenerateClosingNote}
                editable={true} 
              />
              <WorkflowTimeline claim={c} config={config} />
            </div>
          )}

          {/* 2. COMPLETE CLAIM LEDGER */}
          {(activeTabSection === 'all' || activeTabSection === 'ledger') && (
            <div className="drawer-section-group">
              <ClaimLedger 
                claim={c} 
                events={events} 
                documents={documents} 
                currentStatus={d.status} 
                isClosed={d.final === 'Closed'} 
              />
            </div>
          )}

          {/* 3. CLAIM INFORMATION */}
          {(activeTabSection === 'all' || activeTabSection === 'info') && (
            <fieldset className="enterprise-fieldset">
              <legend><FileText size={16} /> 3. CLAIM INFORMATION</legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">Claim Against <strong className="req">*</strong></span>
                  <input type="text" value={c.claimAgainst} onChange={e => set('claimAgainst', e.target.value)} placeholder="e.g. Service call / Transit damage" />
                  {err.claimAgainst && <small className="field-error">{err.claimAgainst}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Call No. <strong className="req">*</strong></span>
                  <input type="text" value={c.callNo} onChange={e => set('callNo', e.target.value)} placeholder="e.g. SC/MUM/25-26/AMC/000145" />
                  {err.callNo && <small className="field-error">{err.callNo}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Call Date <strong className="req">*</strong></span>
                  <input type="date" value={c.callDate} onChange={e => set('callDate', e.target.value)} />
                  {err.callDate && <small className="field-error">{err.callDate}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Claim Date <strong className="req">*</strong></span>
                  <input type="date" value={c.claimDate} onChange={e => set('claimDate', e.target.value)} />
                  {err.claimDate && <small className="field-error">{err.claimDate}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Claim No. <strong className="req">*</strong></span>
                  <input type="text" value={c.claimNo} onChange={e => set('claimNo', e.target.value)} placeholder="e.g. CLM-TSC-LDH-TY-25-26-001" />
                  {err.claimNo && <small className="field-error">{err.claimNo}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Brand <strong className="req">*</strong></span>
                  <input type="text" value={c.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Typical / Brother / Juki" />
                  {err.brand && <small className="field-error">{err.brand}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Claim Category <strong className="req">*</strong></span>
                  <select value={c.category} onChange={e => set('category', e.target.value as any)}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {err.category && <small className="field-error">{err.category}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Quantity <strong className="req">*</strong></span>
                  <input type="number" min="1" value={c.qty} onChange={e => set('qty', Number(e.target.value))} />
                  {err.qty && <small className="field-error">{err.qty}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Technical Approval Status</span>
                  <div className="approval-status-box">
                    <span className={`approval-pill ${c.approvalStatus === 'Approved' ? 'appr-yes' : 'appr-pending'}`}>
                      {c.approvalStatus || 'Pending Approval'}
                    </span>
                    {c.approvalStatus !== 'Approved' && (
                      <button type="button" className="btn-inline-approve" onClick={handleApproveClaim}>
                        Approve Now
                      </button>
                    )}
                  </div>
                </label>
                <label className="form-field span-3">
                  <span className="field-label">Technical Description / Defect Details</span>
                  <textarea rows={2} value={c.description} onChange={e => set('description', e.target.value)} placeholder="Detailed description of defect, symptom, or transit damage..." />
                </label>
              </div>
            </fieldset>
          )}

          {/* 4. CUSTOMER / PRODUCT */}
          {(activeTabSection === 'all' || activeTabSection === 'customer') && (
            <fieldset className="enterprise-fieldset">
              <legend><Package size={16} /> 4. CUSTOMER / PRODUCT</legend>
              <div className="form-grid-2">
                <label className="form-field">
                  <span className="field-label">Customer Name <strong className="req">*</strong></span>
                  <input type="text" value={c.customerName} onChange={e => set('customerName', e.target.value)} placeholder="e.g. Super House Limited" />
                  {err.customerName && <small className="field-error">{err.customerName}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Machine Model</span>
                  <input type="text" value={c.model} onChange={e => set('model', e.target.value)} placeholder="e.g. TC-131B 6040HB" />
                </label>
                <label className="form-field">
                  <span className="field-label">Serial No. <strong className="req">*</strong></span>
                  <input type="text" value={c.serialNo} onChange={e => set('serialNo', e.target.value)} placeholder="e.g. 2102408043" />
                  {err.serialNo && <small className="field-error">{err.serialNo}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Part No. <strong className="req">*</strong></span>
                  <input type="text" value={c.partNo} onChange={e => set('partNo', e.target.value)} placeholder="e.g. DISP-131B" />
                  {err.partNo && <small className="field-error">{err.partNo}</small>}
                </label>
              </div>
            </fieldset>
          )}

          {/* 5. COMMERCIAL / INVOICE */}
          {(activeTabSection === 'all' || activeTabSection === 'commercial') && (
            <fieldset className="enterprise-fieldset">
              <legend><ShoppingBag size={16} /> 5. COMMERCIAL / INVOICE</legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">Import Invoice No.</span>
                  <input type="text" value={c.importInvoiceNo} onChange={e => set('importInvoiceNo', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Import Invoice Date</span>
                  <input type="date" value={c.importInvoiceDate} onChange={e => set('importInvoiceDate', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Installation Date</span>
                  <input type="date" value={c.installationDate} onChange={e => set('installationDate', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Turel Tax Invoice No.</span>
                  <input type="text" value={c.turelTaxInvoiceNo} onChange={e => set('turelTaxInvoiceNo', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Turel Tax Invoice Date</span>
                  <input type="date" value={c.turelTaxInvoiceDate} onChange={e => set('turelTaxInvoiceDate', e.target.value)} />
                </label>
              </div>
            </fieldset>
          )}

          {/* 6. OEM - MANDATORY FIRST */}
          {(activeTabSection === 'all' || activeTabSection === 'oem') && (
            <fieldset className="enterprise-fieldset highlight-oem-box">
              <legend><Building2 size={16} /> 6. OEM — MANDATORY FIRST CONTROL</legend>
              <p className="fieldset-notice">
                <AlertTriangle size={14} /> Mandatory QMS Control: OEM Claim Number must be recorded prior to interim sourcing or replacement dispatch.
              </p>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">OEM Claim No. <strong className="req">* (Mandatory First)</strong></span>
                  <input 
                    type="text" 
                    value={c.oemClaimNo} 
                    onChange={e => set('oemClaimNo', e.target.value)} 
                    placeholder="e.g. OEM-TY-2425-001"
                    className={!c.oemClaimNo ? 'input-warning-border' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">OEM Claim Date</span>
                  <input type="date" value={c.oemClaimDate} onChange={e => set('oemClaimDate', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">OEM Settlement Expected</span>
                  <select value={c.oemSettlementExpected} onChange={e => set('oemSettlementExpected', e.target.value as any)}>
                    <option value="">— Select —</option>
                    <option value="Replacement">Replacement</option>
                    <option value="Credit Note">Credit Note</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">OEM Claim Outcome</span>
                  <select value={c.oemClaimOutcome} onChange={e => set('oemClaimOutcome', e.target.value as any)}>
                    <option value="Pending">Pending</option>
                    <option value="Settled">Settled</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Partial">Partial</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Vendor / Principal Response</span>
                  <select value={c.vendorResponse} onChange={e => set('vendorResponse', e.target.value as any)}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Reject">Reject</option>
                  </select>
                </label>
              </div>
            </fieldset>
          )}

          {/* 7. MATERIAL MOVEMENT */}
          {(activeTabSection === 'all' || activeTabSection === 'movement') && (
            <fieldset className="enterprise-fieldset">
              <legend><Truck size={16} /> 7. MATERIAL MOVEMENT & LOGISTICS</legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">Damaged Part Inward</span>
                  <select value={c.damagedPartInward} onChange={e => set('damagedPartInward', e.target.value as any)}>
                    <option value="Y">Y - Inward Received</option>
                    <option value="N">N - Pending</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Damaged Part GRN No.</span>
                  <input type="text" value={c.damagedPartGRNNo} onChange={e => set('damagedPartGRNNo', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Damaged Part GRN Date</span>
                  <input type="date" value={c.damagedPartGRNDate} onChange={e => set('damagedPartGRNDate', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">New Part at HO</span>
                  <select value={c.newPartAtHO} onChange={e => set('newPartAtHO', e.target.value as any)}>
                    <option value="Y">Y - In Stock HO</option>
                    <option value="N">N - No</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">HO GRN No.</span>
                  <input type="text" value={c.hoGRNNo} onChange={e => set('hoGRNNo', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">HO GRN Date</span>
                  <input type="date" value={c.hoGRNDate} onChange={e => set('hoGRNDate', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Claim Challan No.</span>
                  <input type="text" value={c.claimChallanNo} onChange={e => set('claimChallanNo', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Challan Date</span>
                  <input type="date" value={c.challanDate} onChange={e => set('challanDate', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Delivery Note No.</span>
                  <input type="text" value={c.deliveryNoteNo || ''} onChange={e => set('deliveryNoteNo', e.target.value)} placeholder="e.g. DN-TSC-2526-001" />
                </label>
                <label className="form-field">
                  <span className="field-label">Delivery Note Date</span>
                  <input type="date" value={c.deliveryNoteDate || ''} onChange={e => set('deliveryNoteDate', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">Customer Receipt Date</span>
                  <input type="date" value={c.customerReceiptDate} onChange={e => set('customerReceiptDate', e.target.value)} />
                </label>
              </div>
            </fieldset>
          )}

          {/* 8. INTERIM SOURCING */}
          {(activeTabSection === 'all' || activeTabSection === 'interim') && (
            <fieldset className="enterprise-fieldset">
              <legend><AlertTriangle size={16} /> 8. INTERIM SOURCING CONTROLS</legend>
              {!c.oemClaimNo && (
                <div className="oem-blocker-warning">
                  <strong>BLOCKED BY OEM-FIRST CONTROL:</strong> Enter OEM Claim Number in Section 6 above to enable Interim Sourcing options.
                </div>
              )}
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">Interim Sourcing Option</span>
                  <select 
                    value={c.interimOption} 
                    onChange={e => set('interimOption', e.target.value as any)}
                    disabled={!c.oemClaimNo}
                  >
                    <option value="">— None (Standard OEM Flow) —</option>
                    <option value="A">Option A: Stock Transfer from Branch</option>
                    <option value="B">Option B: Advance Dispatch from HO</option>
                    <option value="C">Option C: Local Purchase / Procurement</option>
                  </select>
                  {err.interimOption && <small className="field-error">{err.interimOption}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Branch Transfer Request No.</span>
                  <input type="text" value={c.branchTransferRequestNo} onChange={e => set('branchTransferRequestNo', e.target.value)} disabled={!c.oemClaimNo} />
                </label>
                <label className="form-field">
                  <span className="field-label">Local PO No.</span>
                  <input type="text" value={c.localPO} onChange={e => set('localPO', e.target.value)} disabled={!c.oemClaimNo} />
                </label>
                <label className="form-field">
                  <span className="field-label">Local Purchase GRN</span>
                  <input type="text" value={c.localPurchaseGRN} onChange={e => set('localPurchaseGRN', e.target.value)} disabled={!c.oemClaimNo} />
                </label>
                <label className="form-field">
                  <span className="field-label">Temporary Local Purchase Cost (₹)</span>
                  <input type="number" value={c.temporaryLocalPurchaseCost ?? ''} onChange={e => set('temporaryLocalPurchaseCost', e.target.value ? Number(e.target.value) : null)} disabled={!c.oemClaimNo} />
                </label>
              </div>
            </fieldset>
          )}

          {/* 9. FINANCE */}
          {(activeTabSection === 'all' || activeTabSection === 'finance') && (
            <fieldset className="enterprise-fieldset">
              <legend><DollarSign size={16} /> 9. FINANCE & RECEIVABLES</legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">OEM Replacement Received (Gate 2)</span>
                  <select value={c.oemReplacementReceived} onChange={e => set('oemReplacementReceived', e.target.value as any)}>
                    <option value="Y">Y - Replacement Received</option>
                    <option value="N">N - Pending</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Credit Note Verified (Gate 2)</span>
                  <select value={c.creditNoteVerified} onChange={e => set('creditNoteVerified', e.target.value as any)}>
                    <option value="Y">Y - Verified by Finance</option>
                    <option value="N">N - Pending</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Inventory Adjusted (Gate 3)</span>
                  <select value={c.inventoryAdjusted} onChange={e => set('inventoryAdjusted', e.target.value as any)}>
                    <option value="Y">Y - Internal Stock Adjusted</option>
                    <option value="N">N - Pending</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Finance Receivable Cleared (Gate 4)</span>
                  <select value={c.financeReceivableCleared} onChange={e => set('financeReceivableCleared', e.target.value as any)}>
                    <option value="Y">Y - Cleared</option>
                    <option value="N">N - Pending</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Local Expense Settled (Gate 4)</span>
                  <select value={c.localPurchaseExpenseSettled} onChange={e => set('localPurchaseExpenseSettled', e.target.value as any)}>
                    <option value="Y">Y - Expense Settled / Reversed</option>
                    <option value="N">N - Pending</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">OEM Credit Value (₹)</span>
                  <input type="number" value={c.oemCreditValue ?? ''} onChange={e => set('oemCreditValue', e.target.value ? Number(e.target.value) : null)} />
                </label>
              </div>
            </fieldset>
          )}

          {/* 10. CAPA */}
          {(activeTabSection === 'all' || activeTabSection === 'capa') && (
            <fieldset className="enterprise-fieldset">
              <legend><HelpCircle size={16} /> 10. CAPA & ISO CLAUSE CONTROLS</legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">CAPA No.</span>
                  <input type="text" value={c.capaNo} onChange={e => set('capaNo', e.target.value)} placeholder="e.g. CAPA-001" />
                </label>
                <label className="form-field">
                  <span className="field-label">CAPA Status</span>
                  <select value={c.capaStatus} onChange={e => set('capaStatus', e.target.value as any)}>
                    <option value="N/A">N/A</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">ISO Clause Ref.</span>
                  <input type="text" value={c.isoClauseRef} onChange={e => set('isoClauseRef', e.target.value)} placeholder="e.g. Cl. 8.7 / 10.2" />
                </label>
              </div>
            </fieldset>
          )}

          {/* 11. DOCUMENT VAULT */}
          {(activeTabSection === 'all' || activeTabSection === 'vault') && (
            <div className="drawer-section-group">
              <DocumentVault 
                claim={c} 
                documents={documents} 
                onAddDocument={handleAddVaultDocument} 
              />
            </div>
          )}

          {/* 12. AUDIT TRAIL (STRICTLY SEPARATED SYSTEM LOGS) */}
          {(activeTabSection === 'all' || activeTabSection === 'audit') && (
            <div className="audit-trail-container">
              <div className="section-title-bar">
                <History size={16} />
                <h4>12. SYSTEM AUDIT TRAIL LOGS</h4>
              </div>
              <p className="audit-disclaimer">
                System field-level change history. Business milestones and official documents are tracked in the Complete Claim Ledger.
              </p>
              <div className="audit-table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Previous State</th>
                      <th>New Value / Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(c.auditLogs && c.auditLogs.length > 0) ? (
                      c.auditLogs.map(log => (
                        <tr key={log.id}>
                          <td><span className="audit-time">{log.timestamp}</span></td>
                          <td><strong>{log.user}</strong></td>
                          <td><span className="audit-action">{log.action}</span></td>
                          <td><span className="audit-prev">{log.previousValue || '—'}</span></td>
                          <td><span className="audit-new">{log.newValue || '—'}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-table-msg">Initial registration. System records subsequent updates.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>

        {/* DRAWER FOOTER */}
        <footer className="drawer-footer">
          <div className="footer-meta">
            <span>Claim ID: <code>{c.id}</code></span>
            <span>Created: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
            {c.closingNoteNo && (
              <span className="footer-closed-stamp">✓ Formally Closed ({c.closingNoteNo})</span>
            )}
          </div>
          <div className="footer-buttons">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="primary-btn" onClick={save}>
              <Save size={16} />
              <span>Save & Validate Claim</span>
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
