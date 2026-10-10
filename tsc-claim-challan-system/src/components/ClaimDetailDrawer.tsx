import React, { useState, useEffect, useMemo } from 'react';
import { 
  Claim, Config, CATEGORIES, derived, validate, ClaimEvent, 
  ClaimDocument, gates, ClaimPart, ClaimPartImage, getFinancialYear, 
  FINANCIAL_YEARS, generateNextClaimNumber, commitClaimSequence,
  validateTeamFieldChanges, computeAutoFields, Outcome 
} from '../domain';
import { 
  BRANCHES, 
  canEditServiceSection, 
  canEditInputSection, 
  canEditStoreSection, 
  getUserTeam 
} from '../auth';
import { Repository } from '../repository';
import { GateVerification } from './GateVerification';
import { WorkflowTimeline } from './WorkflowTimeline';
import { StatusBadge, SLAStatusBadge } from './StatusBadge';
import { ClaimLedger } from './ClaimLedger';
import { DocumentVault } from './DocumentVault';
import { PartManager } from './PartManager';
import { generateMilestonePdf, viewPdf } from '../pdfService';
import { 
  X, Save, FileText, Package, ShoppingBag, Truck, Building2, 
  HelpCircle, DollarSign, AlertTriangle, ShieldCheck, History, 
  Paperclip, CheckCircle2, ListOrdered, FolderOpen, Award, Camera, 
  Lock, Check, Sparkles, Info, XCircle, Split, Plus 
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface ClaimDetailDrawerProps {
  initial: Claim;
  config: Config;
  allClaims: Claim[];
  onClose: () => void;
  onSave: (c: Claim) => Promise<void>;
  repo: Repository;
}

export function ClaimDetailDrawer({ initial, config, allClaims, onClose, onSave, repo }: ClaimDetailDrawerProps) {
  const { currentUser, hasPermission } = useAuth();
  const isNewClaim = !initial.claimNo;

  const [c, setC] = useState<Claim>(() => {
    const base = { ...initial };
    if (!base.parts || base.parts.length === 0) {
      base.parts = [
        {
          id: crypto.randomUUID(),
          srNo: 1,
          partNo: base.partNo || '',
          description: base.description || '',
          qty: base.qty || 1,
          remarks: '',
          images: []
        }
      ];
    }
    // Auto-generate claim number on new claim filing
    if (!base.claimNo) {
      const branch = base.branch || currentUser.branch || 'Mumbai HO';
      const brand = base.brand || 'Vibemac';
      const fy = base.financialYear || getFinancialYear(base.claimDate);
      base.branch = branch;
      base.brand = brand;
      base.financialYear = fy;
      base.claimNo = generateNextClaimNumber(branch, brand, fy, allClaims);
    }
    return base;
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const [activeTabSection, setActiveTabSection] = useState<string>('all');
  const [events, setEvents] = useState<ClaimEvent[]>([]);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const canApproveClaim = hasPermission('claim:approve');
  const canEditClaim = hasPermission('claim:edit') || hasPermission('claim:create');
  const userTeam = getUserTeam(currentUser);
  const canEditService = canEditServiceSection(currentUser);
  const canEditInput = canEditInputSection(currentUser);
  const canEditStore = canEditStoreSection(currentUser);

  const d = derived(c, config);

  // Load events, documents and part images on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const evs = await repo.getClaimEvents(initial.id);
        const docs = await repo.getClaimDocuments(initial.id);
        const partImgs = await repo.getClaimPartImages(initial.id);
        if (mounted) {
          setEvents(evs);
          setDocuments(docs);
          if (partImgs.length > 0) {
            setC(prev => {
              const currentParts = prev.parts && prev.parts.length > 0 ? prev.parts : [
                {
                  id: crypto.randomUUID(),
                  srNo: 1,
                  partNo: prev.partNo || '',
                  description: prev.description || '',
                  qty: prev.qty || 1,
                  remarks: '',
                  images: []
                }
              ];
              const updatedParts = currentParts.map(p => {
                const imgsForPart = partImgs.filter(img => img.partId === p.id);
                if (imgsForPart.length > 0) {
                  return { ...p, images: imgsForPart };
                }
                return p;
              });
              return { ...prev, parts: updatedParts };
            });
          }
        }
      } catch (e) {
        console.error('Error fetching events/docs/part images', e);
      }
    })();
    return () => { mounted = false; };
  }, [initial.id, repo]);

  const set = (k: keyof Claim, v: any) => {
    setC(prev => {
      const updated = { ...prev, [k]: v };
      return updated;
    });
  };

  const handleUpdateNumberingField = (field: 'branch' | 'brand' | 'financialYear' | 'claimDate', value: string) => {
    setC(prev => {
      const updated = { ...prev, [field]: value };
      if (!initial.claimNo) {
        if (field === 'claimDate' && !updated.financialYear) {
          updated.financialYear = getFinancialYear(value);
        }
        const branch = updated.branch || currentUser.branch || 'Mumbai HO';
        const brand = updated.brand || 'Vibemac';
        const fy = updated.financialYear || getFinancialYear(updated.claimDate);
        updated.claimNo = generateNextClaimNumber(branch, brand, fy, allClaims);
      }
      return updated;
    });
  };

  // Handle OEM Claim Outcome changes safely avoiding stale or inconsistent values
  const handleOutcomeChange = (newOutcome: Outcome) => {
    setC(prev => {
      const updated = { ...prev, oemClaimOutcome: newOutcome };
      if (newOutcome === 'Settled') {
        // Sync settlement method with existing expected or method
        const method = prev.oemSettlementMethod || prev.oemSettlementExpected || '';
        updated.oemSettlementExpected = method;
        updated.oemSettlementMethod = method;
        // Clear partial breakdown since claim is fully settled
        updated.oemAcceptedParts = '';
        updated.oemRejectedParts = '';
      } else if (newOutcome === 'Rejected') {
        // Clear settlement and partial details since claim is rejected
        updated.oemSettlementExpected = '';
        updated.oemSettlementMethod = '';
        updated.oemAcceptedParts = '';
        updated.oemRejectedParts = '';
      } else if (newOutcome === 'Pending') {
        // Completed settlement method is not applicable while pending
        updated.oemSettlementMethod = '';
        updated.oemAcceptedParts = '';
        updated.oemRejectedParts = '';
      } else if (newOutcome === 'Partial') {
        // Completed settlement method is not applicable for partial
        updated.oemSettlementMethod = '';
      }
      return updated;
    });
  };

  const handleSettlementChange = (val: '' | 'Replacement' | 'Credit Note') => {
    setC(prev => ({
      ...prev,
      oemSettlementExpected: val,
      oemSettlementMethod: prev.oemClaimOutcome === 'Settled' ? val : ''
    }));
  };

  // Extract parts list for quick-add in Partial Outcome Breakdown
  const availablePartsList = useMemo(() => {
    if (c.parts && c.parts.length > 0) {
      return c.parts;
    }
    if (c.partNo) {
      return [{ id: 'p-scalar', srNo: 1, partNo: c.partNo, description: c.description || '', qty: c.qty || 1 }];
    }
    return [];
  }, [c.parts, c.partNo, c.description, c.qty]);

  const handleAddPartTo = (type: 'accepted' | 'rejected', part: { partNo: string; description?: string; qty: number }) => {
    const line = `${part.partNo}${part.description ? ` (${part.description})` : ''} - Qty: ${part.qty || 1}`;
    setC(prev => {
      if (type === 'accepted') {
        const current = prev.oemAcceptedParts || '';
        const updated = current.trim() ? `${current.trim()}\n• ${line}` : `• ${line}`;
        return { ...prev, oemAcceptedParts: updated };
      } else {
        const current = prev.oemRejectedParts || '';
        const updated = current.trim() ? `${current.trim()}\n• ${line}` : `• ${line}`;
        return { ...prev, oemRejectedParts: updated };
      }
    });
  };

  // Extract available vendors for Local PO dropdown
  const availableVendors = useMemo(() => {
    const set = new Set<string>(['Typical', 'Vibemac', 'Dürkopp Adler', 'Brother', 'Juki']);
    allClaims.forEach(cl => {
      if (cl.brand) set.add(cl.brand);
      if (cl.localPOVendor) set.add(cl.localPOVendor);
    });
    return Array.from(set).filter(Boolean);
  }, [allClaims]);

  // Extract known GRN dates across all system claims and stored GRN documents
  const knownGrnDates = useMemo(() => {
    const map: Record<string, string> = {};
    allClaims.forEach(cl => {
      if (cl.damagedPartGRNNo && cl.damagedPartGRNDate) {
        map[cl.damagedPartGRNNo.trim().toUpperCase()] = cl.damagedPartGRNDate;
      }
      if (cl.hoGRNNo && cl.hoGRNDate) {
        map[cl.hoGRNNo.trim().toUpperCase()] = cl.hoGRNDate;
      }
      if (cl.branchGRNNo && cl.branchGRNDate) {
        map[cl.branchGRNNo.trim().toUpperCase()] = cl.branchGRNDate;
      }
      if (cl.localPurchaseGRN && cl.localPurchaseGRNDate) {
        map[cl.localPurchaseGRN.trim().toUpperCase()] = cl.localPurchaseGRNDate;
      }
    });
    documents.forEach(doc => {
      if (doc.documentType === 'GRN' && doc.documentNo && doc.documentDate) {
        map[doc.documentNo.trim().toUpperCase()] = doc.documentDate;
      }
    });
    return map;
  }, [allClaims, documents]);

  const handleToggleGate = (key: keyof Claim, val: any) => {
    set(key, val);
  };

  const handleChangeParts = (updatedParts: ClaimPart[]) => {
    setC(prev => {
      const u = { ...prev, parts: updatedParts };
      if (updatedParts.length > 0) {
        u.partNo = updatedParts[0].partNo;
        u.description = updatedParts[0].description;
        u.qty = updatedParts.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);
      }
      return u;
    });
    setErr(prev => {
      const newErr = { ...prev };
      delete newErr.partNo;
      delete newErr.qty;
      return newErr;
    });
  };

  const handleAddPartImage = async (partId: string, image: ClaimPartImage) => {
    await repo.addClaimPartImage(image);
    setC(prev => {
      const updatedParts = (prev.parts || []).map(p => {
        if (p.id === partId) {
          const currentImages = p.images || [];
          return { ...p, images: [...currentImages, image] };
        }
        return p;
      });
      return { ...prev, parts: updatedParts };
    });
    setDocuments(await repo.getClaimDocuments(c.id));
  };

  const handleDeletePartImage = async (partId: string, imageId: string) => {
    await repo.deleteClaimPartImage(imageId);
    setC(prev => {
      const updatedParts = (prev.parts || []).map(p => {
        if (p.id === partId) {
          const filteredImages = (p.images || []).filter(img => img.id !== imageId);
          return { ...p, images: filteredImages };
        }
        return p;
      });
      return { ...prev, parts: updatedParts };
    });
    setDocuments(await repo.getClaimDocuments(c.id));
  };

  // Technical / QA Approval Action
  const handleApproveClaim = async () => {
    if (!canApproveClaim) {
      alert('Access Restricted: You require Claim Approval (claim:approve) permission to authorize claims.');
      return;
    }

    const today = new Date().toISOString().substring(0, 10);
    const updated = {
      ...c,
      approvalStatus: 'Approved' as const,
      approvedBy: `${currentUser.name} (${currentUser.role})`,
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
      performedBy: `${currentUser.name} (${currentUser.role})`,
      performedByRole: currentUser.role,
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
      uploadedBy: currentUser.name,
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
    // 1. Enforce team-wise input permissions beyond UI
    const originalClaim = initial.claimNo ? initial : null;
    const teamValidation = validateTeamFieldChanges(c, originalClaim, currentUser, config.mode);
    if (!teamValidation.allowed) {
      alert(`Team Permission Denied:\n\n${teamValidation.violations.join('\n')}\n\nUnauthorized modifications were discarded to preserve data integrity.`);
      setC(teamValidation.sanitized);
      return;
    }

    const claimToSave = teamValidation.sanitized;

    // 2. Validate required business fields
    const e = validate(claimToSave, allClaims, claimToSave.id);
    setErr(e);
    if (Object.keys(e).length > 0) {
      alert('Please correct highlighted validation errors.');
      return;
    }

    const today = new Date().toISOString().substring(0, 10);
    const existingEvents = await repo.getClaimEvents(claimToSave.id);

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

    // Clean up any deleted parts' images
    const currentPartIds = new Set((c.parts || []).map(p => p.id));
    const previousImages = await repo.getClaimPartImages(c.id);
    for (const img of previousImages) {
      if (!currentPartIds.has(img.partId)) {
        await repo.deleteClaimPartImage(img.id);
      }
    }

    // Append Audit Trail Event for system change history
    const auditLogs = c.auditLogs || [];
    const newLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: `${currentUser.name} (${currentUser.role})`,
      action: 'Claim Data Updated & Validated',
      previousValue: 'Previous State',
      newValue: `Status: ${d.status}, Gates Passed: ${Object.values(d.g).filter(Boolean).length}/4`
    };

    if (claimToSave.claimNo) {
      commitClaimSequence(claimToSave.claimNo);
    }

    await onSave({
      ...claimToSave,
      auditLogs: [newLog, ...auditLogs],
      updatedAt: new Date().toISOString()
    });

    setEvents(await repo.getClaimEvents(claimToSave.id));
    setDocuments(await repo.getClaimDocuments(claimToSave.id));
    onClose();
  };

  const sections = [
    { id: 'closure', label: 'Closure Control & 4 Gates', icon: ShieldCheck },
    { id: 'ledger', label: 'Claim Ledger', icon: ListOrdered },
    { id: 'info', label: 'Section 1: Claim Information', icon: FileText },
    { id: 'customer', label: 'Section 1: Customer / Product', icon: Package },
    { id: 'parts', label: 'Section 1: Defect Evidence', icon: Camera },
    { id: 'commercial', label: 'Section 2: Commercial / Invoice', icon: ShoppingBag },
    { id: 'oem', label: 'Block 6 — OEM Control', icon: Building2 },
    { id: 'interim', label: 'Section 3: Interim Sourcing', icon: AlertTriangle },
    { id: 'movement', label: 'Section 3: Material Movement', icon: Truck },
    { id: 'auto', label: 'Section 4: Yellow Auto Fields', icon: Award },
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
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={() => {
                const res = generateMilestonePdf('CLAIM_NOTE', c);
                viewPdf(res.dataUrl);
              }}
              title="Preview Claims Application Sheet PDF"
            >
              <FileText size={16} />
              <span>Claims Sheet</span>
            </button>
            {c.approvalStatus !== 'Approved' && (
              <button 
                type="button" 
                className={`secondary-btn approve-btn ${!canApproveClaim ? 'btn-disabled' : ''}`} 
                onClick={() => {
                  if (canApproveClaim) handleApproveClaim();
                  else alert('Insufficient Privileges: Claim Approval (claim:approve) permission required.');
                }}
                disabled={!canApproveClaim}
                title={canApproveClaim ? "Authorize Technical & Warranty Approval" : "Claim Approval (claim:approve) permission required"}
              >
                {!canApproveClaim ? <Lock size={15} /> : <Award size={16} />}
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

        {/* TEAM PERMISSIONS WORKFLOW BANNER (CLAIM WORKFLOW SPEC) */}
        <div className="drawer-team-banner">
          <div className="drawer-team-banner-left">
            <span>User: <strong>{currentUser.name}</strong></span>
            <span>•</span>
            <span>Workflow Team:</span>
            <span className={`team-badge team-badge-${userTeam.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
              {userTeam}
            </span>
          </div>
          <div className="drawer-team-banner-right">
            <span className={`team-indicator-tag ${canEditService ? 'team-badge-service' : 'readonly'}`} title="Section 1: Claim Information & Defect Details">
              Sec 1: {canEditService ? '✓ Service (Edit)' : '🔒 Read-Only'}
            </span>
            <span className={`team-indicator-tag ${canEditInput ? 'team-badge-input' : 'readonly'}`} title="Section 2: Commercial & Invoice Numbers">
              Sec 2: {canEditInput ? '✓ Input (Edit)' : '🔒 Read-Only'}
            </span>
            <span className={`team-indicator-tag ${canEditStore ? 'team-badge-store' : 'readonly'}`} title="Section 3: Stores, GRN & Movement">
              Sec 3: {canEditStore ? '✓ Store (Edit)' : '🔒 Read-Only'}
            </span>
            <span className="team-indicator-tag team-badge-auto" title="Section 4: Auto-Generated Fields">
              Sec 4: ⚡ Auto
            </span>
          </div>
        </div>

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

          {/* 3. CLAIM INFORMATION (SECTION 1 — SERVICE TEAM ONLY) */}
          {(activeTabSection === 'all' || activeTabSection === 'info') && (
            <fieldset className="enterprise-fieldset">
              <legend>
                <div className="section-legend-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> 3. CLAIM INFORMATION</span>
                  <span className={`fieldset-team-tag ${canEditService ? 'editable' : 'readonly'}`}>
                    {canEditService ? <Check size={12} /> : <Lock size={12} />}
                    <span>Service Team {canEditService ? 'Editable' : 'Only (Read-Only)'}</span>
                  </span>
                </div>
              </legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">Claim Against <strong className="req">*</strong></span>
                  <input 
                    type="text" 
                    value={c.claimAgainst} 
                    onChange={e => set('claimAgainst', e.target.value)} 
                    placeholder="e.g. Service call / Transit damage"
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  {err.claimAgainst && <small className="field-error">{err.claimAgainst}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Call No. <strong className="req">*</strong></span>
                  <input 
                    type="text" 
                    value={c.callNo} 
                    onChange={e => set('callNo', e.target.value)} 
                    placeholder="e.g. SC/MUM/25-26/AMC/000145"
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  {err.callNo && <small className="field-error">{err.callNo}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Call Date <strong className="req">*</strong></span>
                  <input 
                    type="date" 
                    value={c.callDate} 
                    onChange={e => set('callDate', e.target.value)}
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  {err.callDate && <small className="field-error">{err.callDate}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Claim Date <strong className="req">*</strong></span>
                  <input 
                    type="date" 
                    value={c.claimDate} 
                    onChange={e => handleUpdateNumberingField('claimDate', e.target.value)}
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  {err.claimDate && <small className="field-error">{err.claimDate}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Branch <strong className="req">*</strong></span>
                  <select 
                    value={c.branch || currentUser.branch || 'Mumbai HO'} 
                    onChange={e => handleUpdateNumberingField('branch', e.target.value)}
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Brand <strong className="req">*</strong></span>
                  <input 
                    type="text" 
                    list="brand-catalog-list"
                    value={c.brand} 
                    onChange={e => handleUpdateNumberingField('brand', e.target.value)} 
                    placeholder="e.g. Vibemac / Durkopp Adler / Typical"
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  <datalist id="brand-catalog-list">
                    <option value="Vibemac" />
                    <option value="Dürkopp Adler" />
                    <option value="Typical" />
                    <option value="Brother" />
                    <option value="Juki" />
                  </datalist>
                  {err.brand && <small className="field-error">{err.brand}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Financial Year <strong className="req">*</strong></span>
                  <select 
                    value={c.financialYear || getFinancialYear(c.claimDate)} 
                    onChange={e => handleUpdateNumberingField('financialYear', e.target.value)}
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  >
                    {FINANCIAL_YEARS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">
                    Claim No. <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px', fontWeight: 600 }}>Auto-Generated</span>
                  </span>
                  <input 
                    type="text" 
                    value={c.claimNo} 
                    readOnly 
                    title="Claim numbers are generated automatically per Branch, Brand, and Financial Year combination"
                    style={{ background: '#f8fafc', fontWeight: 600, color: '#0f172a' }}
                  />
                  {err.claimNo && <small className="field-error">{err.claimNo}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Claim Category <strong className="req">*</strong></span>
                  <select 
                    value={c.category} 
                    onChange={e => set('category', e.target.value as any)}
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {err.category && <small className="field-error">{err.category}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Quantity <strong className="req">*</strong></span>
                  <input 
                    type="number" 
                    min="1" 
                    value={c.qty} 
                    onChange={e => set('qty', Number(e.target.value))}
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  {err.qty && <small className="field-error">{err.qty}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Technical Approval Status</span>
                  <div className="approval-status-box">
                    <span className={`approval-pill ${c.approvalStatus === 'Approved' ? 'appr-yes' : 'appr-pending'}`}>
                      {c.approvalStatus || 'Pending Approval'}
                    </span>
                    {c.approvalStatus !== 'Approved' && (
                      <button 
                        type="button" 
                        className={`btn-inline-approve ${!canEditService ? 'btn-disabled' : ''}`} 
                        onClick={() => {
                          if (canEditService) handleApproveClaim();
                          else alert('Service Team or Management/Admin permission required to approve claims.');
                        }}
                        disabled={!canEditService}
                      >
                        Approve Now
                      </button>
                    )}
                  </div>
                </label>
                <label className="form-field span-3">
                  <span className="field-label">Technical Description / Defect Details</span>
                  <textarea 
                    rows={2} 
                    value={c.description} 
                    onChange={e => set('description', e.target.value)} 
                    placeholder="Detailed description of defect, symptom, or transit damage..."
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {/* 4. CUSTOMER / PRODUCT (SECTION 1 — SERVICE TEAM ONLY) */}
          {(activeTabSection === 'all' || activeTabSection === 'customer') && (
            <fieldset className="enterprise-fieldset">
              <legend>
                <div className="section-legend-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Package size={16} /> 4. CUSTOMER / PRODUCT</span>
                  <span className={`fieldset-team-tag ${canEditService ? 'editable' : 'readonly'}`}>
                    {canEditService ? <Check size={12} /> : <Lock size={12} />}
                    <span>Service Team {canEditService ? 'Editable' : 'Only (Read-Only)'}</span>
                  </span>
                </div>
              </legend>
              <div className="form-grid-2">
                <label className="form-field">
                  <span className="field-label">Customer Name <strong className="req">*</strong></span>
                  <input 
                    type="text" 
                    value={c.customerName} 
                    onChange={e => set('customerName', e.target.value)} 
                    placeholder="e.g. Super House Limited"
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  {err.customerName && <small className="field-error">{err.customerName}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Machine Model</span>
                  <input 
                    type="text" 
                    value={c.model} 
                    onChange={e => set('model', e.target.value)} 
                    placeholder="e.g. TC-131B 6040HB"
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Serial No. <strong className="req">*</strong></span>
                  <input 
                    type="text" 
                    value={c.serialNo} 
                    onChange={e => set('serialNo', e.target.value)} 
                    placeholder="e.g. 2102408043"
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  {err.serialNo && <small className="field-error">{err.serialNo}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Part No. <strong className="req">*</strong></span>
                  <input 
                    type="text" 
                    value={c.partNo} 
                    onChange={e => {
                      const v = e.target.value;
                      set('partNo', v);
                      if (c.parts && c.parts.length > 0) {
                        const updatedParts = c.parts.map((p, i) => i === 0 ? { ...p, partNo: v } : p);
                        setC(prev => ({ ...prev, partNo: v, parts: updatedParts }));
                      }
                    }} 
                    placeholder="e.g. DISP-131B"
                    disabled={!canEditService}
                    className={!canEditService ? 'field-locked' : ''}
                  />
                  {err.partNo && <small className="field-error">{err.partNo}</small>}
                </label>
              </div>
            </fieldset>
          )}

          {/* 5. PARTS & DEFECT EVIDENCE IMAGES */}
          {(activeTabSection === 'all' || activeTabSection === 'parts' || activeTabSection === 'customer') && (
            <div className="drawer-section-group">
              <PartManager
                claim={c}
                parts={c.parts || []}
                onChangeParts={handleChangeParts}
                onAddPartImage={handleAddPartImage}
                onDeletePartImage={handleDeletePartImage}
                errors={err}
                disabled={!canEditService}
              />
            </div>
          )}

          {/* 5. COMMERCIAL / INVOICE (SECTION 2 — INPUT TEAM ONLY) */}
          {(activeTabSection === 'all' || activeTabSection === 'commercial') && (
            <fieldset className="enterprise-fieldset">
              <legend>
                <div className="section-legend-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShoppingBag size={16} /> 5. COMMERCIAL / INVOICE</span>
                  <span className={`fieldset-team-tag ${canEditInput ? 'editable' : 'readonly'}`}>
                    {canEditInput ? <Check size={12} /> : <Lock size={12} />}
                    <span>Input Team {canEditInput ? 'Editable' : 'Only (Read-Only)'}</span>
                  </span>
                </div>
              </legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">Import Invoice No. <strong className="req">*</strong></span>
                  <input 
                    type="text" 
                    value={c.importInvoiceNo} 
                    onChange={e => set('importInvoiceNo', e.target.value)} 
                    placeholder="e.g. IMP-2026-0045"
                    disabled={!canEditInput}
                    className={!canEditInput ? 'field-locked' : ''}
                  />
                  {err.importInvoiceNo && <small className="field-error">{err.importInvoiceNo}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Import Invoice Date <strong className="req">*</strong></span>
                  <input 
                    type="date" 
                    value={c.importInvoiceDate} 
                    onChange={e => set('importInvoiceDate', e.target.value)}
                    disabled={!canEditInput}
                    className={!canEditInput ? 'field-locked' : ''}
                  />
                  {err.importInvoiceDate && <small className="field-error">{err.importInvoiceDate}</small>}
                </label>
                <label className="form-field">
                  <span className="field-label">Installation Date</span>
                  <input 
                    type="date" 
                    value={c.installationDate} 
                    onChange={e => set('installationDate', e.target.value)}
                    disabled={!canEditInput}
                    className={!canEditInput ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Turel Tax Invoice No.</span>
                  <input 
                    type="text" 
                    value={c.turelTaxInvoiceNo} 
                    onChange={e => set('turelTaxInvoiceNo', e.target.value)}
                    disabled={!canEditInput}
                    className={!canEditInput ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Turel Tax Invoice Date</span>
                  <input 
                    type="date" 
                    value={c.turelTaxInvoiceDate} 
                    onChange={e => set('turelTaxInvoiceDate', e.target.value)}
                    disabled={!canEditInput}
                    className={!canEditInput ? 'field-locked' : ''}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {/* BLOCK 6 — OEM-MANDATORY FIRST CONTROL */}
          {(activeTabSection === 'all' || activeTabSection === 'oem') && (
            <fieldset className="enterprise-fieldset highlight-oem-box">
              <legend><Building2 size={16} /> Block 6 — OEM-Mandatory First Control</legend>
              <p className="fieldset-notice">
                <AlertTriangle size={14} /> QMS Milestone Control: OEM Claim Number is optional for interim sourcing and can be recorded when confirmed by principal supplier.
              </p>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">OEM Claim No. (Optional)</span>
                  <input 
                    type="text" 
                    value={c.oemClaimNo} 
                    onChange={e => set('oemClaimNo', e.target.value)} 
                    placeholder="e.g. OEM-TY-2425-001 (Optional)"
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">OEM Claim Date</span>
                  <input type="date" value={c.oemClaimDate} onChange={e => set('oemClaimDate', e.target.value)} />
                </label>
                <label className="form-field">
                  <span className="field-label">OEM Claim Outcome</span>
                  <select value={c.oemClaimOutcome} onChange={e => handleOutcomeChange(e.target.value as any)}>
                    <option value="Pending">Pending</option>
                    <option value="Settled">Settled</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Partial">Partial</option>
                  </select>
                </label>

                {/* CHANGE 1: OEM SETTLEMENT EXPECTED / COMPLETED METHOD */}
                <label className="form-field">
                  <span className="field-label">
                    {c.oemClaimOutcome === 'Settled' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>OEM Settlement Completed As</span>
                        <span style={{ fontSize: '10px', color: '#15803d', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Settled
                        </span>
                      </span>
                    ) : c.oemClaimOutcome === 'Rejected' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>OEM Settlement Expected</span>
                        <span style={{ fontSize: '10px', color: '#b91c1c', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          N/A (Rejected)
                        </span>
                      </span>
                    ) : c.oemClaimOutcome === 'Partial' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>OEM Settlement Expected</span>
                        <span style={{ fontSize: '10px', color: '#0369a1', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Accepted Items
                        </span>
                      </span>
                    ) : (
                      'OEM Settlement Expected'
                    )}
                  </span>
                  <select 
                    value={c.oemSettlementExpected} 
                    onChange={e => handleSettlementChange(e.target.value as any)}
                    disabled={c.oemClaimOutcome === 'Rejected'}
                    className={c.oemClaimOutcome === 'Rejected' ? 'field-locked' : ''}
                  >
                    {c.oemClaimOutcome === 'Settled' ? (
                      <>
                        <option value="">— Select Completed Settlement Method —</option>
                        <option value="Replacement">Replacement (Physical Replacement Part/Unit Provided)</option>
                        <option value="Credit Note">Credit Note (Financial Credit Note Issued by OEM)</option>
                      </>
                    ) : c.oemClaimOutcome === 'Rejected' ? (
                      <option value="">— N/A (Claim Rejected by OEM) —</option>
                    ) : (
                      <>
                        <option value="">— Select Expected Settlement —</option>
                        <option value="Replacement">Replacement</option>
                        <option value="Credit Note">Credit Note</option>
                      </>
                    )}
                  </select>
                </label>

                <label className="form-field">
                  <span className="field-label">
                    Customer Response on Claim Status
                    <span style={{ fontSize: '10px', color: '#1d4ed8', background: '#dbeafe', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>Input Team</span>
                  </span>
                  <select 
                    value={c.vendorResponse} 
                    onChange={e => set('vendorResponse', e.target.value as any)}
                    disabled={!canEditInput}
                    className={!canEditInput ? 'field-locked' : ''}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Reject">Reject</option>
                  </select>
                </label>
              </div>

              {/* CHANGE 1 VISIBILITY: CLEAR SETTLEMENT METHOD BANNER WHEN SETTLED */}
              {c.oemClaimOutcome === 'Settled' && (
                <div style={{ marginTop: '12px' }}>
                  {c.oemSettlementExpected ? (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} color="#16a34a" />
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: 500 }}>
                          OEM Settlement Method Recorded: <strong>{c.oemSettlementExpected}</strong>
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                        {c.oemSettlementExpected === 'Credit Note' ? 'Financial Credit Note Received' : 'Physical Replacement Part Received'}
                      </span>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} color="#d97706" />
                      <span style={{ fontSize: '12px', color: '#92400e' }}>
                        Claim outcome is marked as <strong>Settled</strong>. Please select whether the OEM provided a <strong>Credit Note</strong> or a <strong>Replacement</strong>.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* CHANGE 2: PARTIAL CLAIM OUTCOME — ACCEPTED AND REJECTED ITEMS */}
              {c.oemClaimOutcome === 'Partial' && (
                <div 
                  className="partial-outcome-panel" 
                  style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: '#f8fafc', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Split size={18} color="#0284c7" />
                      <div>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>Partial Claim Outcome — Item Disposition Breakdown</strong>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                          Record and distinguish which items/parts were accepted versus rejected by the OEM for this claim.
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      Outcome: Partial
                    </span>
                  </div>

                  {/* Clearly Distinguishable 2-Column Sections for Accepted vs Rejected */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* SECTION A: ACCEPTED ITEMS / PARTS */}
                    <div 
                      className="accepted-parts-section" 
                      style={{ 
                        background: '#f0fdf4', 
                        border: '1.5px solid #86efac', 
                        borderRadius: '6px', 
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: '#166534' }}>
                          <CheckCircle2 size={16} color="#16a34a" /> Accepted Items / Parts
                        </label>
                        <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          OEM Approved
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={c.oemAcceptedParts || ''}
                        onChange={e => set('oemAcceptedParts', e.target.value)}
                        placeholder="List accepted items/parts, serial numbers, quantities, or approved scope..."
                        style={{ 
                          width: '100%', 
                          fontSize: '12px', 
                          padding: '8px', 
                          borderRadius: '4px', 
                          border: '1px solid #bbf7d0', 
                          background: '#ffffff',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      {availablePartsList.length > 0 && (
                        <div>
                          <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            Quick-add from Claimed Parts:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {availablePartsList.map((p, idx) => (
                              <button
                                key={`acc-p-${idx}`}
                                type="button"
                                onClick={() => handleAddPartTo('accepted', p)}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #86efac',
                                  background: '#ffffff',
                                  color: '#166534',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`Add ${p.partNo} to Accepted Items`}
                              >
                                <Plus size={10} /> {p.partNo || `Part ${idx + 1}`} (Qty: {p.qty})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION B: REJECTED ITEMS / PARTS */}
                    <div 
                      className="rejected-parts-section" 
                      style={{ 
                        background: '#fef2f2', 
                        border: '1.5px solid #fca5a5', 
                        borderRadius: '6px', 
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: '#991b1b' }}>
                          <XCircle size={16} color="#dc2626" /> Rejected Items / Parts
                        </label>
                        <span style={{ fontSize: '10px', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          OEM Rejected
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={c.oemRejectedParts || ''}
                        onChange={e => set('oemRejectedParts', e.target.value)}
                        placeholder="List rejected items/parts, serial numbers, quantities, and OEM rejection reasons..."
                        style={{ 
                          width: '100%', 
                          fontSize: '12px', 
                          padding: '8px', 
                          borderRadius: '4px', 
                          border: '1px solid #fecaca', 
                          background: '#ffffff',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      {availablePartsList.length > 0 && (
                        <div>
                          <span style={{ fontSize: '10px', color: '#991b1b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            Quick-add from Claimed Parts:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {availablePartsList.map((p, idx) => (
                              <button
                                key={`rej-p-${idx}`}
                                type="button"
                                onClick={() => handleAddPartTo('rejected', p)}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #fca5a5',
                                  background: '#ffffff',
                                  color: '#991b1b',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`Add ${p.partNo} to Rejected Items`}
                              >
                                <Plus size={10} /> {p.partNo || `Part ${idx + 1}`} (Qty: {p.qty})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
          )}

          {/* BLOCK 7 — INTERIM SOURCING CONTROLS (SECTION 3 — STORE TEAM ONLY) */}
          {(activeTabSection === 'all' || activeTabSection === 'interim') && (
            <fieldset className="enterprise-fieldset">
              <legend>
                <div className="section-legend-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={16} /> Block 7 — Interim Sourcing Controls</span>
                  <span className={`fieldset-team-tag ${canEditStore ? 'editable' : 'readonly'}`}>
                    {canEditStore ? <Check size={12} /> : <Lock size={12} />}
                    <span>Store Team {canEditStore ? 'Editable' : 'Only (Read-Only)'}</span>
                  </span>
                </div>
              </legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">Interim Sourcing Option</span>
                  <select 
                    value={c.interimOption} 
                    onChange={e => set('interimOption', e.target.value as any)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  >
                    <option value="">— None (Standard OEM Flow) —</option>
                    <option value="A">Option A: Stock Transfer from Branch</option>
                    <option value="B">Option B: Advance Dispatch from HO</option>
                    <option value="C">Option C: Local Purchase / Procurement</option>
                  </select>
                </label>

                {/* 5.1 Branch Transfer Request No. with Branch Selection */}
                <div className="form-field">
                  <span className="field-label">Branch Transfer Request No.</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select 
                        value={c.branchTransferBranch || ''} 
                        onChange={e => set('branchTransferBranch', e.target.value)}
                        disabled={!canEditStore}
                        className={!canEditStore ? 'field-locked' : ''}
                        style={{ flex: 1 }}
                        title="Select Branch for Transfer Request"
                      >
                        <option value="">— Select Source Branch —</option>
                        {BRANCHES.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        value={c.branchTransferRequestNo} 
                        onChange={e => set('branchTransferRequestNo', e.target.value)} 
                        placeholder="e.g. BTR-KAN-004"
                        disabled={!canEditStore}
                        className={!canEditStore ? 'field-locked' : ''}
                        style={{ flex: 1.2 }}
                      />
                    </div>
                    {c.branchTransferBranch && (
                      <div style={{ fontSize: '11px', color: '#0284c7', background: 'rgba(2,132,199,0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <span>Selected Branch:</span> <strong>{c.branchTransferBranch}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5.2 Local PO No. with Vendor Selection */}
                <div className="form-field">
                  <span className="field-label">Local PO No. & Vendor</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text"
                        list="available-po-vendors"
                        value={c.localPOVendor || ''} 
                        onChange={e => set('localPOVendor', e.target.value)} 
                        placeholder="Select or enter Vendor..."
                        disabled={!canEditStore}
                        className={!canEditStore ? 'field-locked' : ''}
                        style={{ flex: 1 }}
                      />
                      <datalist id="available-po-vendors">
                        {availableVendors.map(v => <option key={v} value={v} />)}
                      </datalist>
                      <input 
                        type="text" 
                        value={c.localPO} 
                        onChange={e => set('localPO', e.target.value)} 
                        placeholder="e.g. PO-LOC-2026-088"
                        disabled={!canEditStore}
                        className={!canEditStore ? 'field-locked' : ''}
                        style={{ flex: 1 }}
                      />
                    </div>
                    {c.localPOVendor && (
                      <div style={{ fontSize: '11px', color: '#16a34a', background: 'rgba(22,163,74,0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <span>Associated Vendor:</span> <strong>{c.localPOVendor}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5.3 Local Purchase GRN & Display GRN Date */}
                <div className="form-field">
                  <span className="field-label">Local Purchase GRN & Date</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text" 
                        value={c.localPurchaseGRN} 
                        onChange={e => {
                          const val = e.target.value;
                          if (!val) {
                            setC(prev => ({ ...prev, localPurchaseGRN: '', localPurchaseGRNDate: '' }));
                          } else {
                            const matchedDate = knownGrnDates[val.trim().toUpperCase()];
                            setC(prev => ({
                              ...prev,
                              localPurchaseGRN: val,
                              localPurchaseGRNDate: matchedDate !== undefined ? matchedDate : (prev.localPurchaseGRNDate || '')
                            }));
                          }
                        }} 
                        placeholder="e.g. GRN-LOC-0941" 
                        disabled={!canEditStore}
                        className={!canEditStore ? 'field-locked' : ''}
                        style={{ flex: 1.2 }}
                      />
                      <input 
                        type="date"
                        value={c.localPurchaseGRNDate || ''}
                        onChange={e => set('localPurchaseGRNDate', e.target.value)}
                        disabled={!c.localPurchaseGRN || !canEditStore}
                        className={(!c.localPurchaseGRN || !canEditStore) ? 'field-locked' : ''}
                        style={{ flex: 1 }}
                        title="GRN Date"
                      />
                    </div>
                    {c.localPurchaseGRN && (
                      c.localPurchaseGRNDate ? (
                        <div style={{ fontSize: '11px', color: '#0369a1', background: 'rgba(3,105,161,0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                          <span>GRN Date:</span> <strong>{c.localPurchaseGRNDate}</strong>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#b45309', background: 'rgba(180,83,9,0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                          <span>GRN Date:</span> <em>Date unavailable in records (please specify)</em>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <label className="form-field">
                  <span className="field-label">Temporary Local Purchase Cost (₹)</span>
                  <input 
                    type="number" 
                    value={c.temporaryLocalPurchaseCost ?? ''} 
                    onChange={e => set('temporaryLocalPurchaseCost', e.target.value ? Number(e.target.value) : null)} 
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {/* BLOCK 8 — MATERIAL MOVEMENT AND LOGISTICS (SECTION 3 — STORE TEAM ONLY) */}
          {(activeTabSection === 'all' || activeTabSection === 'movement') && (
            <fieldset className="enterprise-fieldset">
              <legend>
                <div className="section-legend-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={16} /> Block 8 — Material Movement and Logistics</span>
                  <span className={`fieldset-team-tag ${canEditStore ? 'editable' : 'readonly'}`}>
                    {canEditStore ? <Check size={12} /> : <Lock size={12} />}
                    <span>Store Team {canEditStore ? 'Editable' : 'Only (Read-Only)'}</span>
                  </span>
                </div>
              </legend>
              <div className="form-grid-3">
                <label className="form-field">
                  <span className="field-label">Customer Damaged Part Inward</span>
                  <select 
                    value={c.damagedPartInward} 
                    onChange={e => set('damagedPartInward', e.target.value as any)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  >
                    <option value="Y">Y - Inward Received</option>
                    <option value="N">N - Pending</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Damaged Part GRN No.</span>
                  <input 
                    type="text" 
                    value={c.damagedPartGRNNo} 
                    onChange={e => set('damagedPartGRNNo', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Damaged Part GRN Date</span>
                  <input 
                    type="date" 
                    value={c.damagedPartGRNDate} 
                    onChange={e => set('damagedPartGRNDate', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Principal New Part Inward in Head Office</span>
                  <select 
                    value={c.newPartAtHO} 
                    onChange={e => set('newPartAtHO', e.target.value as any)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  >
                    <option value="Y">Y - In Stock HO</option>
                    <option value="N">N - No</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">HO GRN No.</span>
                  <input 
                    type="text" 
                    value={c.hoGRNNo} 
                    onChange={e => set('hoGRNNo', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">HO GRN Date</span>
                  <input 
                    type="date" 
                    value={c.hoGRNDate} 
                    onChange={e => set('hoGRNDate', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Claim Challan No.</span>
                  <input 
                    type="text" 
                    value={c.claimChallanNo} 
                    onChange={e => set('claimChallanNo', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Challan Date</span>
                  <input 
                    type="date" 
                    value={c.challanDate} 
                    onChange={e => set('challanDate', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Principal Part Inward in Claimed Branch</span>
                  <select 
                    value={c.newPartAtBranch} 
                    onChange={e => set('newPartAtBranch', e.target.value as any)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  >
                    <option value="Y">Y - Inward in Branch</option>
                    <option value="N">N - No</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Branch GRN No.</span>
                  <input 
                    type="text" 
                    value={c.branchGRNNo} 
                    onChange={e => set('branchGRNNo', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Branch GRN Date</span>
                  <input 
                    type="date" 
                    value={c.branchGRNDate} 
                    onChange={e => set('branchGRNDate', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Turel New Part Outward</span>
                  <select 
                    value={c.turelNewPartOutward} 
                    onChange={e => set('turelNewPartOutward', e.target.value as any)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  >
                    <option value="Y">Y - Outward Dispatched</option>
                    <option value="N">N - No</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="field-label">Delivery Note No.</span>
                  <input 
                    type="text" 
                    value={c.deliveryNoteNo || ''} 
                    onChange={e => set('deliveryNoteNo', e.target.value)} 
                    placeholder="e.g. DN-TSC-2526-001"
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Delivery Note Date</span>
                  <input 
                    type="date" 
                    value={c.deliveryNoteDate || ''} 
                    onChange={e => set('deliveryNoteDate', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
                <label className="form-field">
                  <span className="field-label">Customer Receipt Date</span>
                  <input 
                    type="date" 
                    value={c.customerReceiptDate} 
                    onChange={e => set('customerReceiptDate', e.target.value)}
                    disabled={!canEditStore}
                    className={!canEditStore ? 'field-locked' : ''}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {/* SECTION 4 — YELLOW SECTION: AUTOMATICALLY GENERATED FIELDS */}
          {(activeTabSection === 'all' || activeTabSection === 'auto' || activeTabSection === 'movement') && (
            <fieldset className="enterprise-fieldset auto-yellow-section">
              <legend>
                <Sparkles size={16} /> Section 4 — Automatically Generated Fields (Excel Workflow)
              </legend>
              <div className="auto-section-intro">
                <Info size={15} />
                <span>
                  <strong>Read-Only System Derivations:</strong> These values are calculated dynamically from Service, Input, and Store inputs per the Excel master workflow. Manual entry or tampering is strictly prohibited.
                </span>
              </div>
              <div className="auto-metrics-grid">
                {/* 1. Service / Installation Call Status */}
                <div className="auto-metric-card">
                  <div className="auto-metric-label">
                    <span>Service / Call Status</span>
                    <span className={`auto-pill ${d.serviceCallStatusAuto === 'Closed' ? 'auto-pill-closed' : 'auto-pill-open'}`}>
                      {d.serviceCallStatusAuto}
                    </span>
                  </div>
                  <div className="auto-metric-value">
                    {d.serviceCallStatusAuto}
                  </div>
                  <div className="auto-metric-formula">
                    Derived: Closed once customer receipt / part outward is confirmed
                  </div>
                </div>

                {/* 2. Organization Claim Status */}
                <div className="auto-metric-card">
                  <div className="auto-metric-label">
                    <span>Organization Claim Status</span>
                    <span className={`auto-pill ${d.orgClaimStatusAuto === 'Closed' ? 'auto-pill-closed' : 'auto-pill-open'}`}>
                      {d.orgClaimStatusAuto}
                    </span>
                  </div>
                  <div className="auto-metric-value">
                    {d.orgClaimStatusAuto}
                  </div>
                  <div className="auto-metric-formula">
                    Derived: Closed once all 4 closure gates pass & formal note generated
                  </div>
                </div>

                {/* 3. Final Status (Auto) */}
                <div className="auto-metric-card" style={{ gridColumn: 'span 2' }}>
                  <div className="auto-metric-label">
                    <span>Final Status (Auto)</span>
                    <span className={`auto-pill ${
                      d.finalStatusAuto.includes('Dispatch') ? 'auto-pill-dispatch' :
                      d.finalStatusAuto.includes('Inward') ? 'auto-pill-inward' :
                      d.finalStatusAuto.includes('Rejected') ? 'auto-pill-rejected' :
                      d.finalStatusAuto.includes('Settled') || d.finalStatusAuto.includes('Closed') ? 'auto-pill-closed' :
                      'auto-pill-process'
                    }`}>
                      {d.finalStatusAuto}
                    </span>
                  </div>
                  <div className="auto-metric-value" style={{ fontSize: '14.5px' }}>
                    {d.finalStatusAuto}
                  </div>
                  <div className="auto-metric-formula">
                    Derived from Vendor Response, Damaged Part Inward & Outward status
                  </div>
                </div>

                {/* 4. call to challan */}
                <div className="auto-metric-card">
                  <div className="auto-metric-label">
                    <span>Call to Challan</span>
                    <span className="auto-pill auto-pill-open">{d.callToChallanDays} Days</span>
                  </div>
                  <div className="auto-metric-value">
                    {d.callToChallanDays} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>elapsed days</span>
                  </div>
                  <div className="auto-metric-formula">
                    Calculated: Days between Call Date ({c.callDate || 'N/A'}) & Challan Date ({c.challanDate || 'N/A'})
                  </div>
                </div>

                {/* 5. claim to challan Ageing */}
                <div className="auto-metric-card">
                  <div className="auto-metric-label">
                    <span>Claim to Challan Ageing</span>
                    <span className="auto-pill auto-pill-open">{d.claimToChallanAgeing} Days</span>
                  </div>
                  <div className="auto-metric-value">
                    {d.claimToChallanAgeing} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>days ageing</span>
                  </div>
                  <div className="auto-metric-formula">
                    Calculated: Days between Claim Date ({c.claimDate || 'N/A'}) & Challan Date ({c.challanDate || 'N/A'})
                  </div>
                </div>
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
