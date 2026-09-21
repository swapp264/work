import React, { useState } from 'react';
import { CAPA } from '../domain';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldAlert, Plus, CheckCircle2, FileText, Calendar, User } from 'lucide-react';

interface CapaPageProps {
  capas: CAPA[];
  onSaveCAPA: (c: CAPA) => Promise<void>;
  onSelectClaimByNo: (claimNo: string) => void;
}

export function CapaPage({ capas, onSaveCAPA, onSelectClaimByNo }: CapaPageProps) {
  const [selectedCapa, setSelectedCapa] = useState<CAPA | null>(null);

  return (
    <div className="capa-page">
      {/* CAPA HEADER BANNER */}
      <div className="capa-summary-banner">
        <div className="banner-left">
          <ShieldAlert size={24} className="banner-icon" />
          <div>
            <h3>Corrective & Preventive Action (CAPA) Register</h3>
            <p>ISO 9001:2015 Clause 8.7 / 10.2 Nonconformity & Root Cause Management</p>
          </div>
        </div>
        <div className="banner-stats">
          <div className="capa-stat-chip">
            <span>Total CAPAs</span>
            <strong>{capas.length}</strong>
          </div>
          <div className="capa-stat-chip open">
            <span>Active / Open</span>
            <strong>{capas.filter(x => x.status !== 'Closed' && x.status !== 'N/A').length}</strong>
          </div>
          <div className="capa-stat-chip closed">
            <span>Closed & Verified</span>
            <strong>{capas.filter(x => x.status === 'Closed').length}</strong>
          </div>
        </div>
      </div>

      {/* CAPA DATA TABLE */}
      <div className="enterprise-card capa-table-card">
        <div className="table-responsive-container">
          <table className="enterprise-data-grid">
            <thead>
              <tr>
                <th>CAPA No.</th>
                <th>Source Claim No.</th>
                <th>Date Raised</th>
                <th>Nonconformity Description</th>
                <th>Root Cause / 5 Why</th>
                <th>Corrective Action</th>
                <th>Action Owner</th>
                <th>Target Date</th>
                <th>Completion Date</th>
                <th>Effectiveness Check Date</th>
                <th>Effectiveness Verified</th>
                <th>Status</th>
                <th>ISO Clause</th>
              </tr>
            </thead>
            <tbody>
              {capas.length === 0 ? (
                <tr>
                  <td colSpan={13} className="empty-grid-state">No CAPA records registered.</td>
                </tr>
              ) : (
                capas.map(item => (
                  <tr key={item.id} className="grid-row-clickable" onClick={() => setSelectedCapa(item)}>
                    <td><strong className="code-text">{item.capaNo}</strong></td>
                    <td>
                      <button 
                        className="link-btn-code"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClaimByNo(item.sourceClaimNo);
                        }}
                      >
                        {item.sourceClaimNo}
                      </button>
                    </td>
                    <td><span className="date-main">{item.dateRaised}</span></td>
                    <td><p className="cell-desc-text">{item.nonconformityDescription}</p></td>
                    <td><p className="cell-desc-text">{item.rootCause5Why}</p></td>
                    <td><p className="cell-desc-text">{item.correctiveAction}</p></td>
                    <td><strong>{item.actionOwner}</strong></td>
                    <td><span className="date-main">{item.targetDate}</span></td>
                    <td><span className="date-main">{item.completionDate || '—'}</span></td>
                    <td><span className="date-main">{item.effectivenessCheckDate || '—'}</span></td>
                    <td>
                      <StatusBadge 
                        status={item.effectivenessVerified} 
                        type={item.effectivenessVerified === 'Y' ? 'ok' : 'w'} 
                      />
                    </td>
                    <td>
                      <StatusBadge 
                        status={item.status} 
                        type={item.status === 'Closed' ? 'ok' : item.status === 'Open' ? 'bad' : 'w'} 
                      />
                    </td>
                    <td><code className="iso-code">{item.isoClause}</code></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
