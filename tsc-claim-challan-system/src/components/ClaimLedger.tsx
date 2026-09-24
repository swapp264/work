import React from 'react';
import { Claim, ClaimEvent, ClaimDocument } from '../domain';
import { generateMilestonePdf, viewPdf, downloadPdf } from '../pdfService';
import { 
  FileText, CheckCircle2, Building2, Truck, DollarSign, 
  ShieldAlert, ShieldCheck, Eye, Download, Calendar, User, Tag
} from 'lucide-react';

interface ClaimLedgerProps {
  claim: Claim;
  events: ClaimEvent[];
  documents: ClaimDocument[];
  currentStatus: string;
  isClosed: boolean;
}

export function ClaimLedger({ claim, events, documents, currentStatus, isClosed }: ClaimLedgerProps) {
  // Sort events chronologically (oldest to newest for true journey, or newest on top if specified)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const getEventIcon = (type: ClaimEvent['eventType']) => {
    switch (type) {
      case 'CLAIM_CREATED': return FileText;
      case 'CLAIM_APPROVED': return CheckCircle2;
      case 'OEM_CLAIM_RAISED': return Building2;
      case 'GRN_RECEIVED': return Truck;
      case 'CHALLAN_CREATED': return Truck;
      case 'DELIVERY_NOTE_CREATED': return CheckCircle2;
      case 'FINANCE_CLEARED': return DollarSign;
      case 'CAPA_RAISED': return ShieldAlert;
      case 'CLOSING_NOTE_CREATED': return ShieldCheck;
      default: return Tag;
    }
  };

  const getEventTitle = (type: ClaimEvent['eventType']): string => {
    switch (type) {
      case 'CLAIM_CREATED': return 'Claim Created (Claims Application Sheet)';
      case 'CLAIM_APPROVED': return 'Claim Approved (QA / Technical)';
      case 'CLAIM_REJECTED': return 'Claim Rejected';
      case 'OEM_CLAIM_RAISED': return 'OEM Claim Raised';
      case 'OEM_RESPONSE_RECEIVED': return 'OEM Response Received';
      case 'GRN_RECEIVED': return 'GRN Received (Material Inward)';
      case 'CHALLAN_CREATED': return 'Claim Challan Created';
      case 'DELIVERY_NOTE_CREATED': return 'Delivery Note Created (Customer)';
      case 'MATERIAL_DISPATCHED': return 'Material Dispatched';
      case 'FINANCE_CLEARED': return 'Finance Cleared';
      case 'CAPA_RAISED': return 'CAPA Raised (ISO 9001)';
      case 'CLOSING_NOTE_CREATED': return 'Closing Note Created (4-Gate Closure)';
      default: return (type as string).replace(/_/g, ' ');
    }
  };

  const handleViewDocument = (doc: ClaimDocument) => {
    try {
      const res = generateMilestonePdf(doc.documentType, claim);
      viewPdf(res.dataUrl);
    } catch (err) {
      console.error('Failed to view PDF', err);
      alert('Unable to generate PDF preview.');
    }
  };

  const handleDownloadDocument = (doc: ClaimDocument) => {
    try {
      const res = generateMilestonePdf(doc.documentType, claim);
      downloadPdf(res.blob, doc.fileName || res.fileName);
    } catch (err) {
      console.error('Failed to download PDF', err);
      alert('Unable to download PDF.');
    }
  };

  return (
    <div className="claim-ledger-container">
      <div className="ledger-header">
        <div className="ledger-title-wrap">
          <span className="section-subtitle">TRACEABLE PROCESS MILESTONES</span>
          <h3 className="ledger-main-title">COMPLETE CLAIM LEDGER</h3>
          <p className="ledger-desc">
            Chronological audit of formal business milestones and supporting verified QMS documents.
          </p>
        </div>
        <div className="ledger-current-status-box">
          <span className="status-label">CURRENT STATUS:</span>
          <span className={`status-pill ${isClosed ? 'status-closed' : 'status-open'}`}>
            {currentStatus}
          </span>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="ledger-empty-state">
          <FileText size={32} className="empty-icon" />
          <p>No business milestone events recorded yet for this claim.</p>
        </div>
      ) : (
        <div className="ledger-timeline">
          {sortedEvents.map((ev, index) => {
            const Icon = getEventIcon(ev.eventType);
            const relatedDoc = documents.find(d => d.id === ev.documentId || (d.eventId && d.eventId === ev.id));

            return (
              <div key={ev.id || index} className="ledger-card-item">
                <div className="ledger-marker-col">
                  <div className="ledger-marker-node">
                    <Icon size={16} />
                  </div>
                  {index < sortedEvents.length - 1 && <div className="ledger-marker-line" />}
                </div>

                <div className="ledger-card-body">
                  <div className="ledger-card-top">
                    <div className="event-primary-info">
                      <div className="event-date-row">
                        <Calendar size={13} className="meta-icon" />
                        <span className="event-date">{ev.eventDate}</span>
                      </div>
                      <h4 className="event-title">
                        <span className="check-bullet">✓</span> {getEventTitle(ev.eventType)}
                      </h4>
                    </div>

                    <div className="event-badge-col">
                      <span className="event-status-badge">{ev.status || 'Recorded'}</span>
                    </div>
                  </div>

                  <div className="event-meta-grid">
                    {ev.referenceNo && (
                      <div className="meta-field">
                        <span className="meta-label">Reference No:</span>
                        <strong className="meta-val">{ev.referenceNo}</strong>
                      </div>
                    )}
                    <div className="meta-field">
                      <span className="meta-label">Actor:</span>
                      <span className="meta-val">
                        <User size={12} className="inline-icon" /> {ev.performedBy}
                        {ev.performedByRole && <small className="role-tag"> ({ev.performedByRole})</small>}
                      </span>
                    </div>
                  </div>

                  {ev.remarks && (
                    <p className="event-remarks">
                      "{ev.remarks}"
                    </p>
                  )}

                  {/* ATTACHED DOCUMENT ACTION BAR */}
                  {relatedDoc ? (
                    <div className="ledger-doc-attachment">
                      <div className="doc-info-chip">
                        <FileText size={14} className="doc-icon" />
                        <span className="doc-name">{relatedDoc.fileName}</span>
                        {relatedDoc.documentNo && <span className="doc-no-pill">{relatedDoc.documentNo}</span>}
                      </div>
                      <div className="doc-action-btns">
                        <button 
                          type="button" 
                          className="doc-btn view-btn" 
                          onClick={() => handleViewDocument(relatedDoc)}
                          title="View PDF Document"
                        >
                          <Eye size={13} />
                          <span>View PDF</span>
                        </button>
                        <button 
                          type="button" 
                          className="doc-btn dl-btn" 
                          onClick={() => handleDownloadDocument(relatedDoc)}
                          title="Download PDF Document"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ledger-doc-attachment generated-on-demand">
                      <div className="doc-info-chip">
                        <FileText size={14} className="doc-icon" />
                        <span className="doc-name">Milestone Document Available</span>
                      </div>
                      <div className="doc-action-btns">
                        <button 
                          type="button" 
                          className="doc-btn view-btn"
                          onClick={() => {
                            // Map event to document type
                            let docType: any = 'CLAIM_NOTE';
                            if (ev.eventType === 'CLAIM_APPROVED') docType = 'APPROVAL_NOTE';
                            else if (ev.eventType === 'OEM_CLAIM_RAISED') docType = 'OEM_DOCUMENT';
                            else if (ev.eventType === 'GRN_RECEIVED') docType = 'GRN';
                            else if (ev.eventType === 'CHALLAN_CREATED') docType = 'CHALLAN';
                            else if (ev.eventType === 'DELIVERY_NOTE_CREATED') docType = 'DELIVERY_NOTE';
                            else if (ev.eventType === 'FINANCE_CLEARED') docType = 'FINANCE_NOTE';
                            else if (ev.eventType === 'CAPA_RAISED') docType = 'CAPA_EVIDENCE';
                            else if (ev.eventType === 'CLOSING_NOTE_CREATED') docType = 'CLOSING_NOTE';

                            const res = generateMilestonePdf(docType, claim, ev);
                            viewPdf(res.dataUrl);
                          }}
                        >
                          <Eye size={13} />
                          <span>View PDF</span>
                        </button>
                        <button 
                          type="button" 
                          className="doc-btn dl-btn"
                          onClick={() => {
                            let docType: any = 'CLAIM_NOTE';
                            if (ev.eventType === 'CLAIM_APPROVED') docType = 'APPROVAL_NOTE';
                            else if (ev.eventType === 'OEM_CLAIM_RAISED') docType = 'OEM_DOCUMENT';
                            else if (ev.eventType === 'GRN_RECEIVED') docType = 'GRN';
                            else if (ev.eventType === 'CHALLAN_CREATED') docType = 'CHALLAN';
                            else if (ev.eventType === 'DELIVERY_NOTE_CREATED') docType = 'DELIVERY_NOTE';
                            else if (ev.eventType === 'FINANCE_CLEARED') docType = 'FINANCE_NOTE';
                            else if (ev.eventType === 'CAPA_RAISED') docType = 'CAPA_EVIDENCE';
                            else if (ev.eventType === 'CLOSING_NOTE_CREATED') docType = 'CLOSING_NOTE';

                            const res = generateMilestonePdf(docType, claim, ev);
                            downloadPdf(res.blob, res.fileName);
                          }}
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="ledger-footer-stamp">
        <ShieldCheck size={16} />
        <span>End of verified chronological process audit · TSC QMS Clause 8.7</span>
      </div>
    </div>
  );
}
