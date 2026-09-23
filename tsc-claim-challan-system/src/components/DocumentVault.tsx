import React, { useState } from 'react';
import { Claim, ClaimDocument, EVIDENCE_CHECKLIST } from '../domain';
import { generateMilestonePdf, viewPdf, downloadPdf } from '../pdfService';
import { 
  FileText, Eye, Download, Upload, CheckCircle2, 
  AlertCircle, Paperclip, Clock, ShieldCheck, Plus
} from 'lucide-react';

interface DocumentVaultProps {
  claim: Claim;
  documents: ClaimDocument[];
  onAddDocument: (doc: ClaimDocument) => Promise<void>;
}

export function DocumentVault({ claim, documents, onAddDocument }: DocumentVaultProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocType, setNewDocType] = useState<ClaimDocument['documentType']>('CLAIM_NOTE');
  const [newDocNo, setNewDocNo] = useState('');
  const [newFileName, setNewFileName] = useState('');

  const requiredEvidence = EVIDENCE_CHECKLIST[claim.category] || [];

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const newDoc: ClaimDocument = {
      id: crypto.randomUUID(),
      claimId: claim.id,
      documentType: newDocType,
      documentNo: newDocNo || `DOC-${Date.now().toString().slice(-5)}`,
      documentDate: new Date().toISOString().substring(0, 10),
      fileName: newFileName.endsWith('.pdf') ? newFileName : `${newFileName}.pdf`,
      uploadedBy: 'Swapnil (Service Head)',
      uploadedAt: new Date().toISOString(),
      fileSize: '65 KB'
    };

    await onAddDocument(newDoc);
    setShowUploadModal(false);
    setNewDocNo('');
    setNewFileName('');
  };

  const handleView = (doc: ClaimDocument) => {
    try {
      const res = generateMilestonePdf(doc.documentType, claim);
      viewPdf(res.dataUrl);
    } catch (err) {
      console.error(err);
      alert('Unable to generate PDF preview.');
    }
  };

  const handleDownload = (doc: ClaimDocument) => {
    try {
      const res = generateMilestonePdf(doc.documentType, claim);
      downloadPdf(res.blob, doc.fileName || res.fileName);
    } catch (err) {
      console.error(err);
      alert('Unable to download PDF.');
    }
  };

  const formatDocType = (t: string) => {
    switch (t) {
      case 'CLAIM_NOTE': return 'Claim Intimation Slip';
      case 'APPROVAL_NOTE': return 'Technical Approval Voucher';
      case 'OEM_DOCUMENT': return 'OEM Warranty Form';
      case 'GRN': return 'Goods Receipt Note (GRN)';
      case 'CHALLAN': return 'Claim Delivery Challan';
      case 'DELIVERY_NOTE': return 'Customer Delivery Note';
      case 'FINANCE_NOTE': return 'Finance Clearance Voucher';
      case 'CAPA_EVIDENCE': return 'ISO 9001 CAPA Sheet';
      case 'CLOSING_NOTE': return 'Claim Closing Certificate';
      default: return t.replace(/_/g, ' ');
    }
  };

  return (
    <div className="document-vault-container">
      {/* HEADER WITH ACTION */}
      <div className="vault-header-row">
        <div>
          <span className="section-subtitle">QMS DOCUMENT REPOSITORY</span>
          <h3 className="vault-title">DOCUMENT VAULT & EVIDENCE ARCHIVE</h3>
          <p className="vault-desc">
            Centralized repository of generated process PDFs and supporting technical evidence.
          </p>
        </div>
        <button 
          type="button" 
          className="cta-primary-btn" 
          onClick={() => setShowUploadModal(true)}
        >
          <Plus size={16} />
          <span>+ Upload Document</span>
        </button>
      </div>

      {/* EVIDENCE CHECKLIST COMPLIANCE CARD */}
      <div className="evidence-checklist-card">
        <div className="checklist-header">
          <div className="chk-title-left">
            <ShieldCheck size={18} className="chk-icon" />
            <strong>Category Evidence Compliance ({claim.category}):</strong>
          </div>
          <span className="chk-count">
            {requiredEvidence.length} Mandatory Requirement(s)
          </span>
        </div>

        <div className="checklist-items-grid">
          {requiredEvidence.map((req, idx) => {
            const isUploaded = documents.some(
              d => d.fileName.toLowerCase().includes(req.toLowerCase().substring(0, 5)) ||
                   d.documentType.toLowerCase().includes(req.toLowerCase().substring(0, 4))
            ) || (claim.documents && claim.documents.some(d => d.name.toLowerCase().includes(req.toLowerCase().substring(0, 5))));

            return (
              <div key={idx} className={`checklist-item ${isUploaded ? 'item-verified' : 'item-pending'}`}>
                {isUploaded ? (
                  <CheckCircle2 size={16} className="item-icon verified" />
                ) : (
                  <Clock size={16} className="item-icon pending" />
                )}
                <div className="item-details">
                  <span className="item-name">{req}</span>
                  <small className="item-status">{isUploaded ? 'Verified & On File' : 'Required for Audit'}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DOCUMENT DATA GRID */}
      <div className="vault-table-wrapper">
        <table className="enterprise-data-grid">
          <thead>
            <tr>
              <th>Document Type</th>
              <th>Document No.</th>
              <th>File Name</th>
              <th>Date</th>
              <th>Created / Uploaded By</th>
              <th>Size</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                  <Paperclip size={24} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                  <p>No documents currently archived in vault for this claim.</p>
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <span className="doc-type-badge">{formatDocType(doc.documentType)}</span>
                  </td>
                  <td>
                    <strong>{doc.documentNo || '—'}</strong>
                  </td>
                  <td>
                    <div className="doc-file-cell">
                      <FileText size={14} className="file-icon" />
                      <span>{doc.fileName}</span>
                    </div>
                  </td>
                  <td>{doc.documentDate || (doc.uploadedAt ? doc.uploadedAt.substring(0, 10) : '—')}</td>
                  <td>{doc.uploadedBy}</td>
                  <td><span className="file-size-badge">{doc.fileSize || '45 KB'}</span></td>
                  <td>
                    <span className="status-badge-verified">
                      <CheckCircle2 size={12} /> Available
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="vault-actions-row">
                      <button 
                        type="button" 
                        className="icon-action-btn" 
                        onClick={() => handleView(doc)}
                        title="View PDF"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        type="button" 
                        className="icon-action-btn" 
                        onClick={() => handleDownload(doc)}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="overlay" onClick={() => setShowUploadModal(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header-row">
              <h4>Upload / Attach Document</h4>
              <button className="modal-close-btn" onClick={() => setShowUploadModal(false)}>×</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="modal-body-form">
              <label className="form-field">
                <span className="field-label">Document Type *</span>
                <select 
                  value={newDocType} 
                  onChange={e => setNewDocType(e.target.value as any)}
                >
                  <option value="CLAIM_NOTE">Claim Intimation Slip</option>
                  <option value="APPROVAL_NOTE">Technical Approval Voucher</option>
                  <option value="OEM_DOCUMENT">OEM Warranty Document</option>
                  <option value="GRN">Goods Receipt Note (GRN)</option>
                  <option value="CHALLAN">Claim Delivery Challan</option>
                  <option value="DELIVERY_NOTE">Customer Delivery Note</option>
                  <option value="FINANCE_NOTE">Finance Clearance Note</option>
                  <option value="CAPA_EVIDENCE">CAPA Evidence / 5-Why</option>
                  <option value="CLOSING_NOTE">Closing Certificate</option>
                </select>
              </label>

              <label className="form-field">
                <span className="field-label">Document Number</span>
                <input 
                  type="text" 
                  placeholder="e.g. GRN-HO-9921, DN-2526-004" 
                  value={newDocNo} 
                  onChange={e => setNewDocNo(e.target.value)} 
                />
              </label>

              <label className="form-field">
                <span className="field-label">File Name *</span>
                <input 
                  type="text" 
                  placeholder="e.g. Delivery_Acknowledgment_Signed.pdf" 
                  value={newFileName} 
                  onChange={e => setNewFileName(e.target.value)} 
                  required 
                />
              </label>

              <div className="modal-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cta-primary-btn">
                  <Upload size={14} /> Attach to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
