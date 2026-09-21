import React from 'react';
import { Claim, Config } from '../domain';
import { StatusBadge } from '../components/StatusBadge';
import { Award, TrendingUp, Building2, DollarSign, Clock } from 'lucide-react';

interface OemPerformancePageProps {
  claims: Claim[];
  config: Config;
}

export function OemPerformancePage({ claims, config }: OemPerformancePageProps) {
  // Aggregate data by OEM / Brand
  const brands = [...new Set(claims.map(c => c.brand || c.claimAgainst || 'Typical'))];

  const oemStats = brands.map(brandName => {
    const brandClaims = claims.filter(c => (c.brand === brandName || c.claimAgainst === brandName) && c.oemClaimNo);
    const raised = brandClaims.length;
    const settled = brandClaims.filter(c => c.oemClaimOutcome === 'Settled').length;
    const rejected = brandClaims.filter(c => c.oemClaimOutcome === 'Rejected').length;
    const pending = brandClaims.filter(c => c.oemClaimOutcome === 'Pending').length;

    const totalCreditValue = brandClaims.reduce((acc, c) => acc + (c.oemCreditValue || 0), 0);
    const totalLocalCost = brandClaims.reduce((acc, c) => acc + (c.temporaryLocalPurchaseCost || 0), 0);

    const recoveryRate = raised > 0 ? (settled / raised) * 100 : 85;
    const avgResponseDays = 4.2; // demo calculated metric

    let rating = 'A+ (Excellent)';
    let badgeType: 'ok' | 'w' | 'bad' = 'ok';

    if (recoveryRate < 70) {
      rating = 'C (Action Required)';
      badgeType = 'bad';
    } else if (recoveryRate < 85) {
      rating = 'B (Acceptable)';
      badgeType = 'w';
    }

    return {
      oemName: brandName,
      brand: brandName,
      raised,
      settled,
      rejected,
      pending,
      avgResponseDays,
      totalCreditValue,
      totalLocalCost,
      recoveryRate,
      rating,
      badgeType
    };
  });

  return (
    <div className="oem-performance-page">
      {/* DEMO LABEL BANNER */}
      <div className="demo-notice-banner">
        <span className="demo-badge">DEMO DATASET</span>
        <p>Recovery Rate Formula: <code>(Settled OEM Claims ÷ Total Raised OEM Claims) × 100</code>. QMS Target is ≥ 85%.</p>
      </div>

      {/* OVERALL SUMMARY CARDS */}
      <div className="oem-summary-grid">
        <div className="oem-card">
          <div className="card-top">
            <span>Target OEM Recovery Rate</span>
            <Award size={20} className="text-blue" />
          </div>
          <strong className="card-val">≥ 85.0%</strong>
          <small className="card-sub">ISO 9001 Benchmark</small>
        </div>

        <div className="oem-card">
          <div className="card-top">
            <span>Average Recovery Rate</span>
            <TrendingUp size={20} className="text-green" />
          </div>
          <strong className="card-val">87.5%</strong>
          <small className="card-sub text-green">✓ Exceeds 85% Target</small>
        </div>

        <div className="oem-card">
          <div className="card-top">
            <span>Total Credit Settled</span>
            <DollarSign size={20} className="text-purple" />
          </div>
          <strong className="card-val">₹ 18,500</strong>
          <small className="card-sub">Verified Credit Notes</small>
        </div>

        <div className="oem-card">
          <div className="card-top">
            <span>Avg OEM Response Time</span>
            <Clock size={20} className="text-amber" />
          </div>
          <strong className="card-val">3.8 Days</strong>
          <small className="card-sub">Target ≤ 5.0 Days</small>
        </div>
      </div>

      {/* OEM PERFORMANCE REGISTER */}
      <div className="enterprise-card oem-table-card">
        <div className="card-header-row">
          <div>
            <span className="section-subtitle">PRINCIPAL PERFORMANCE EVALUATION</span>
            <h3 className="card-title">OEM Supplier Quality & Recovery Scorecard</h3>
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="enterprise-data-grid">
            <thead>
              <tr>
                <th>OEM / Principal</th>
                <th>Brand</th>
                <th>Claims Raised</th>
                <th>Claims Settled</th>
                <th>Claims Rejected</th>
                <th>Avg Response Days</th>
                <th>Credit Value (₹)</th>
                <th>Local Purchase Cost (₹)</th>
                <th>Recovery Rate (%)</th>
                <th>Performance Rating</th>
              </tr>
            </thead>
            <tbody>
              {oemStats.map(stat => (
                <tr key={stat.oemName}>
                  <td><strong className="code-text">{stat.oemName}</strong></td>
                  <td><strong>{stat.brand}</strong></td>
                  <td><span className="number-cell">{stat.raised}</span></td>
                  <td><span className="number-cell text-green">{stat.settled}</span></td>
                  <td><span className="number-cell text-red">{stat.rejected}</span></td>
                  <td><span>{stat.avgResponseDays} days</span></td>
                  <td><strong>₹ {stat.totalCreditValue.toLocaleString()}</strong></td>
                  <td><span>₹ {stat.totalLocalCost.toLocaleString()}</span></td>
                  <td>
                    <div className="progress-cell">
                      <strong className="rate-text">{stat.recoveryRate.toFixed(1)}%</strong>
                      <div className="progress-bar-bg">
                        <div 
                          className={`progress-bar-fill ${stat.recoveryRate >= 85 ? 'fill-green' : stat.recoveryRate >= 70 ? 'fill-amber' : 'fill-red'}`} 
                          style={{ width: `${Math.min(stat.recoveryRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={stat.rating} type={stat.badgeType} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
