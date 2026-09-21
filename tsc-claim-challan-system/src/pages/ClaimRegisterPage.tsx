import React, { useState, useMemo } from 'react';
import { Claim, Config, derived, CATEGORIES } from '../domain';
import { StatusBadge, SLAStatusBadge } from '../components/StatusBadge';
import { Search, Filter, Eye, SlidersHorizontal } from 'lucide-react';

interface ClaimRegisterPageProps {
  claims: Claim[];
  config: Config;
  initialFilter?: string;
  initialQuery?: string;
  onSelectClaim: (c: Claim) => void;
  onNewClaim: () => void;
}

export function ClaimRegisterPage({ 
  claims, 
  config, 
  initialFilter = 'all', 
  initialQuery = '', 
  onSelectClaim, 
  onNewClaim 
}: ClaimRegisterPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // Column visibility state
  const [cols, setCols] = useState({
    claimAgainst: true,
    callNo: true,
    dates: true,
    brandCustomer: true,
    product: true,
    category: true,
    oemClaim: true,
    oemOutcome: true,
    capaStatus: true,
    sla: true,
    finalStatus: true
  });

  const rows = useMemo(() => {
    return claims.map(c => ({
      c,
      d: derived(c, config)
    }));
  }, [claims, config]);

  const filteredRows = useMemo(() => {
    return rows.filter(({ c, d }) => {
      // Filter tab check
      if (filter === 'open' && d.final !== 'Open') return false;
      if (filter === 'closed' && d.final !== 'Closed') return false;
      if (filter === 'breach' && d.sla !== true) return false;
      if (filter === 'oem' && d.g.replacementOrCreditVerified) return false;

      // Category filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;

      // Text Search
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = [
          c.claimNo, c.customerName, c.partNo, c.serialNo, 
          c.oemClaimNo, c.callNo, c.brand, c.category, c.model
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [rows, filter, categoryFilter, query]);

  return (
    <div className="claim-register-page">
      {/* TOOLBAR */}
      <div className="register-toolbar-card">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Filter register by Claim No., Customer, Serial No., Part No., OEM Claim..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            />
            {query && <button className="clear-btn" onClick={() => setQuery('')}>×</button>}
          </div>

          <div className="filter-select-group">
            <Filter size={14} className="filter-icon" />
            <select value={filter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="open">Open Claims Only</option>
              <option value="closed">Closed Claims Only</option>
              <option value="breach">SLA Breached Only</option>
              <option value="oem">Pending OEM Settlement</option>
            </select>
          </div>

          <div className="filter-select-group">
            <select value={categoryFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="column-toggle-wrapper">
            <button 
              className="icon-btn-secondary"
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              title="Customize visible grid columns"
            >
              <SlidersHorizontal size={16} />
              <span>Columns</span>
            </button>

            {showColumnToggle && (
              <div className="column-toggle-popover">
                <h5>Grid Columns</h5>
                {Object.entries(cols).map(([k, v]) => (
                  <label key={k} className="col-toggle-item">
                    <input
                      type="checkbox"
                      checked={v}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCols({ ...cols, [k]: e.target.checked })}
                    />
                    <span>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button className="primary-btn" onClick={onNewClaim}>
            + Create Claim
          </button>
        </div>
      </div>

      {/* DATA GRID TABLE */}
      <div className="data-grid-card">
        <div className="grid-summary-bar">
          <span>Showing <strong>{filteredRows.length}</strong> of <strong>{claims.length}</strong> total claim records</span>
          <span className="qms-badge">QMS AUDITABLE GRID</span>
        </div>

        <div className="table-responsive-container">
          <table className="enterprise-data-grid">
            <thead>
              <tr>
                <th>Claim No.</th>
                {cols.claimAgainst && <th>Claim Against</th>}
                {cols.callNo && <th>Call No.</th>}
                {cols.dates && <th>Call & Claim Date</th>}
                {cols.brandCustomer && <th>Brand & Customer</th>}
                {cols.product && <th>Model / Serial / Part</th>}
                {cols.category && <th>Category</th>}
                {cols.oemClaim && <th>OEM Claim No.</th>}
                {cols.oemOutcome && <th>OEM Outcome</th>}
                {cols.capaStatus && <th>CAPA</th>}
                {cols.sla && <th>SLA Status</th>}
                {cols.finalStatus && <th>Final Status</th>}
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="empty-grid-state">
                    No claim records matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ c, d }) => (
                  <tr key={c.id} className="grid-row-clickable" onClick={() => onSelectClaim(c)}>
                    <td className="td-claim-no">
                      <strong className="code-text">{c.claimNo || 'Draft'}</strong>
                    </td>
                    {cols.claimAgainst && <td><span className="cell-text">{c.claimAgainst || '—'}</span></td>}
                    {cols.callNo && <td><code className="call-code">{c.callNo || '—'}</code></td>}
                    {cols.dates && (
                      <td>
                        <span className="date-main">{c.claimDate || '—'}</span>
                        <small className="date-sub">Call: {c.callDate || '—'}</small>
                      </td>
                    )}
                    {cols.brandCustomer && (
                      <td>
                        <strong className="cust-name">{c.customerName || '—'}</strong>
                        <small className="brand-sub">Brand: {c.brand || '—'}</small>
                      </td>
                    )}
                    {cols.product && (
                      <td>
                        <span className="part-code">{c.partNo || '—'}</span>
                        <small className="sn-sub">S/N: {c.serialNo || '—'} | {c.model || '—'}</small>
                      </td>
                    )}
                    {cols.category && <td><span className="category-chip">{c.category}</span></td>}
                    {cols.oemClaim && (
                      <td>
                        {c.oemClaimNo ? (
                          <code className="oem-code">{c.oemClaimNo}</code>
                        ) : (
                          <span className="text-warning-muted">Pending Entry</span>
                        )}
                      </td>
                    )}
                    {cols.oemOutcome && (
                      <td>
                        <StatusBadge 
                          status={c.oemClaimOutcome} 
                          type={c.oemClaimOutcome === 'Settled' ? 'ok' : c.oemClaimOutcome === 'Rejected' ? 'bad' : 'w'} 
                        />
                      </td>
                    )}
                    {cols.capaStatus && (
                      <td>
                        <StatusBadge 
                          status={c.capaStatus} 
                          type={c.capaStatus === 'Closed' ? 'ok' : c.capaStatus === 'Open' || c.capaStatus === 'In Progress' ? 'w' : 'neutral'} 
                        />
                      </td>
                    )}
                    {cols.sla && (
                      <td>
                        <SLAStatusBadge sla={d.sla} />
                      </td>
                    )}
                    {cols.finalStatus && (
                      <td>
                        <StatusBadge 
                          status={d.final} 
                          type={d.final === 'Closed' ? 'ok' : 'w'} 
                        />
                      </td>
                    )}
                    <td className="td-actions" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <button 
                        className="btn-grid-action"
                        onClick={() => onSelectClaim(c)}
                        title="View Full Claim Details"
                      >
                        <Eye size={15} />
                        <span>View</span>
                      </button>
                    </td>
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
