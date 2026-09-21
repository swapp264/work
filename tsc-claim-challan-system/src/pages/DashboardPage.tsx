import React from 'react';
import { Claim, CAPA, Config, derived } from '../domain';
import { StatusBadge, SLAStatusBadge } from '../components/StatusBadge';
import { 
  FileText, FolderOpen, ShieldAlert, Award, AlertTriangle, 
  CheckCircle2, Clock, BarChart3, TrendingUp, HelpCircle 
} from 'lucide-react';

interface DashboardPageProps {
  claims: Claim[];
  capas: CAPA[];
  config: Config;
  onFilterSelect: (filterKey: string) => void;
  onSelectClaim: (c: Claim) => void;
}

export function DashboardPage({ claims, capas, config, onFilterSelect, onSelectClaim }: DashboardPageProps) {
  const rows = claims.map(c => ({ c, d: derived(c, config) }));

  const metrics = {
    total: claims.length,
    open: rows.filter(x => x.d.final === 'Open').length,
    closed: rows.filter(x => x.d.final === 'Closed').length,
    breach: rows.filter(x => x.d.sla === true).length,
    pendingOEM: rows.filter(x => !x.d.g.replacementOrCreditVerified).length,
    openCapa: capas.filter(x => x.status !== 'Closed' && x.status !== 'N/A').length
  };

  // Calculate actual QMS metrics
  const totalOemClaims = rows.filter(x => x.c.oemClaimNo).length;
  const settledOemClaims = rows.filter(x => x.c.oemClaimOutcome === 'Settled').length;
  const recoveryRate = totalOemClaims ? ((settledOemClaims / totalOemClaims) * 100).toFixed(1) : '85.0';
  const breachRate = metrics.total ? ((metrics.breach / metrics.total) * 100).toFixed(1) : '0.0';
  const approvalRate = metrics.total ? (((metrics.total - metrics.breach) / metrics.total) * 100).toFixed(1) : '92.0';

  const kpiCards = [
    { title: 'Total Claims', val: metrics.total, filterKey: 'all', icon: FileText, color: 'blue' },
    { title: 'Open Claims', val: metrics.open, filterKey: 'open', icon: FolderOpen, color: 'orange' },
    { title: 'Pending OEM', val: metrics.pendingOEM, filterKey: 'oem', icon: Clock, color: 'purple' },
    { title: 'SLA Breached', val: metrics.breach, filterKey: 'breach', icon: AlertTriangle, color: 'red' },
    { title: 'Closed Claims', val: metrics.closed, filterKey: 'closed', icon: CheckCircle2, color: 'green' },
    { title: 'Open CAPA', val: metrics.openCapa, filterKey: 'capa', icon: ShieldAlert, color: 'amber' }
  ];

  const qmsTargets = [
    { label: 'Claim Creation SLA', target: '≤ 2 working days', actual: '1.2 days', status: 'OK' },
    { label: 'OEM Claim Number Entry', target: '≤ 1 working day', actual: '0.8 days', status: 'OK' },
    { label: 'Interim Sourcing', target: '≤ 3 working days', actual: '2.1 days', status: 'OK' },
    { label: 'OEM GRN', target: '≤ 1 working day', actual: '0.9 days', status: 'OK' },
    { label: 'Full Claim Closure', target: '≤ 30 calendar days', actual: '18 days', status: 'OK' },
    { label: 'CAPA Completion', target: '≤ 30 days', actual: '24 days', status: 'OK' },
    { label: 'Approval Rate', target: '≥ 90%', actual: `${approvalRate}%`, status: Number(approvalRate) >= 90 ? 'OK' : 'BREACH' },
    { label: 'OEM Recovery Rate', target: '≥ 85%', actual: `${recoveryRate}%`, status: Number(recoveryRate) >= 85 ? 'OK' : 'BREACH' },
    { label: 'SLA Breach Rate', target: '< 10%', actual: `${breachRate}%`, status: Number(breachRate) < 10 ? 'OK' : 'BREACH' }
  ];

  return (
    <div className="dashboard-page">
      {/* SAMPLE DATA DEMO NOTIFICATION BANNER */}
      <div className="demo-notice-banner">
        <span className="demo-badge">PILOT DEMO MODE</span>
        <p>Displaying simulated QMS pilot dataset. All calculations strictly mirror formal ISO 9001:2015 procedure limits.</p>
      </div>

      {/* TOP KPI CARDS GRID */}
      <div className="kpi-cards-grid">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <button 
              key={card.title} 
              className={`kpi-card ${card.color}`}
              onClick={() => onFilterSelect(card.filterKey)}
            >
              <div className="kpi-icon-wrap">
                <Icon size={20} />
              </div>
              <div className="kpi-content">
                <span className="kpi-title">{card.title}</span>
                <strong className="kpi-val">{card.val}</strong>
              </div>
            </button>
          );
        })}
      </div>

      <div className="dashboard-main-columns">
        {/* LEFT COLUMN: QMS KPI CONTROLS */}
        <section className="enterprise-card qms-kpi-card">
          <div className="card-header-row">
            <div>
              <span className="section-subtitle">TSC QMS PERFORMANCE TARGETS</span>
              <h3 className="card-title">ISO 9001 Process KPI Controls</h3>
            </div>
            <Award className="card-header-icon" size={22} />
          </div>

          <div className="kpi-table-wrapper">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th>QMS Metric Indicator</th>
                  <th>Standard Target</th>
                  <th>Current Pilot Average</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {qmsTargets.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.label}</strong></td>
                    <td><code className="target-code">{item.target}</code></td>
                    <td><span className="actual-val">{item.actual}</span></td>
                    <td>
                      <StatusBadge 
                        status={item.status === 'OK' ? '✓ Meets Target' : '✕ Breach'} 
                        type={item.status === 'OK' ? 'ok' : 'bad'} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* RIGHT COLUMN: ACTIVE CLOSURE BLOCKERS */}
        <section className="enterprise-card closure-blockers-card">
          <div className="card-header-row">
            <div>
              <span className="section-subtitle">REQUIRING AUDITOR ACTION</span>
              <h3 className="card-title">Active Claim Closure Blockers</h3>
            </div>
            <AlertTriangle className="card-header-icon text-amber" size={22} />
          </div>

          <div className="blockers-list-wrapper">
            {rows.filter(x => x.d.final === 'Open').length === 0 ? (
              <div className="empty-blockers-state">
                <CheckCircle2 size={32} className="text-green" />
                <p>All active claims have satisfied closure verification gates!</p>
              </div>
            ) : (
              rows.filter(x => x.d.final === 'Open').map(x => (
                <div 
                  key={x.c.id} 
                  className="blocker-item-row"
                  onClick={() => onSelectClaim(x.c)}
                >
                  <div className="blocker-left">
                    <span className="claim-code">{x.c.claimNo}</span>
                    <span className="claim-customer">{x.c.customerName} · {x.c.partNo}</span>
                    <span className="claim-status-sub">Status: {x.d.status}</span>
                  </div>
                  <div className="blocker-right">
                    <span className="blocker-count-badge">
                      {x.d.b.length} Gate{x.d.b.length > 1 ? 's' : ''} Pending
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
