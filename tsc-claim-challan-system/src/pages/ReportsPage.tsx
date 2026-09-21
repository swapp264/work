import React from 'react';
import { Claim, CAPA, Config, derived } from '../domain';
import { FileText, Download, Printer, BarChart3, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

interface ReportsPageProps {
  claims: Claim[];
  capas: CAPA[];
  config: Config;
}

export function ReportsPage({ claims, capas, config }: ReportsPageProps) {
  const rows = claims.map(c => ({ c, d: derived(c, config) }));

  const exportToCSV = (reportName: string, data: any[]) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => 
      Object.values(row).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[headers, ...csvRows].join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName}_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reportCards = [
    {
      id: 'rep-1',
      title: 'Full Claim Register Report',
      desc: 'Complete 48-column normalized claim register data extract for QMS auditors and management.',
      count: `${claims.length} Records`,
      icon: FileText,
      action: () => exportToCSV('TSC_Claim_Register', claims.map(c => ({
        ClaimNo: c.claimNo,
        Customer: c.customerName,
        Brand: c.brand,
        PartNo: c.partNo,
        SerialNo: c.serialNo,
        Category: c.category,
        ClaimDate: c.claimDate,
        CallNo: c.callNo,
        OEMClaimNo: c.oemClaimNo,
        OEMOutcome: c.oemClaimOutcome,
        CAPAStatus: c.capaStatus
      })))
    },
    {
      id: 'rep-2',
      title: 'Open Claims & Closure Blockers',
      desc: 'Detailed breakdown of all active claims currently pending 4-gate verification closure.',
      count: `${rows.filter(x => x.d.final === 'Open').length} Active Claims`,
      icon: AlertTriangle,
      action: () => exportToCSV('TSC_Open_Claims_Blockers', rows.filter(x => x.d.final === 'Open').map(x => ({
        ClaimNo: x.c.claimNo,
        Customer: x.c.customerName,
        Status: x.d.status,
        PendingBlockers: x.d.b.join('; ')
      })))
    },
    {
      id: 'rep-3',
      title: 'Closed Claims Verification Log',
      desc: 'Audit trail of fully resolved claims where all 4 mandatory closure gates passed.',
      count: `${rows.filter(x => x.d.final === 'Closed').length} Closed Claims`,
      icon: CheckCircle2,
      action: () => exportToCSV('TSC_Closed_Claims', rows.filter(x => x.d.final === 'Closed').map(x => ({
        ClaimNo: x.c.claimNo,
        Customer: x.c.customerName,
        ChallanNo: x.c.claimChallanNo,
        CompletionDate: x.c.customerReceiptDate
      })))
    },
    {
      id: 'rep-4',
      title: 'SLA Breach Analysis Report',
      desc: 'Incidents where claim creation, interim sourcing, or challan generation exceeded targets.',
      count: `${rows.filter(x => x.d.sla === true).length} Breached Records`,
      icon: BarChart3,
      action: () => exportToCSV('TSC_SLA_Breaches', rows.filter(x => x.d.sla === true).map(x => ({
        ClaimNo: x.c.claimNo,
        Category: x.c.category,
        TargetDays: x.d.target,
        ActualDays: x.d.claimToChallan
      })))
    },
    {
      id: 'rep-5',
      title: 'OEM Performance & Recovery Audit',
      desc: 'Principal supplier recovery rates, credit note values, and response time metrics.',
      count: 'Scorecard Report',
      icon: DollarSign,
      action: () => exportToCSV('TSC_OEM_Performance', claims.map(c => ({
        Brand: c.brand,
        OEMClaimNo: c.oemClaimNo,
        Outcome: c.oemClaimOutcome,
        CreditValue: c.oemCreditValue
      })))
    },
    {
      id: 'rep-6',
      title: 'CAPA Effectiveness Log',
      desc: 'ISO 9001 Clause 8.7 / 10.2 nonconformity tracking, root causes, and verification dates.',
      count: `${capas.length} CAPA Logs`,
      icon: ShieldCheck,
      action: () => exportToCSV('TSC_CAPA_Register', capas)
    }
  ];

  return (
    <div className="reports-page">
      {/* NOTICE BANNER */}
      <div className="demo-notice-banner">
        <span className="demo-badge">EXPORT READY</span>
        <p>Reports export raw QMS datasets to standardized CSV format. PDF engine integration is reserved for backend ERP deployment.</p>
      </div>

      {/* REPORT CARDS GRID */}
      <div className="reports-grid">
        {reportCards.map(rep => {
          const Icon = rep.icon;
          return (
            <div key={rep.id} className="enterprise-card report-card">
              <div className="report-card-top">
                <div className="report-icon-wrap">
                  <Icon size={20} />
                </div>
                <span className="report-count-badge">{rep.count}</span>
              </div>
              <h4 className="report-title">{rep.title}</h4>
              <p className="report-desc">{rep.desc}</p>

              <div className="report-card-actions">
                <button className="primary-btn-sm" onClick={rep.action}>
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
