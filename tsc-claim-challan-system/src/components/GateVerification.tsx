import React from 'react';
import { Claim, Config, derived } from '../domain';
import { StatusBadge } from './StatusBadge';

interface GateVerificationProps {
  claim: Claim;
  config: Config;
  onToggleGate?: (key: keyof Claim, val: any) => void;
  editable?: boolean;
}

export function GateVerification({ claim, config, onToggleGate, editable = false }: GateVerificationProps) {
  const d = derived(claim, config);
  const gates = [
    {
      id: 'gate-1',
      num: 1,
      title: 'GATE 1: OEM Claim Number Entered',
      desc: 'Mandatory OEM claim reference required before interim sourcing or closure.',
      passed: d.g.oemClaimNo,
      field: 'oemClaimNo' as keyof Claim,
      blockerText: 'Gate 1: OEM Claim Number is missing.'
    },
    {
      id: 'gate-2',
      num: 2,
      title: 'GATE 2: OEM Replacement GRN / Credit Note Verified',
      desc: 'OEM replacement received through Claim GRN OR Finance-verified credit note available.',
      passed: d.g.replacementOrCreditVerified,
      field: 'oemReplacementReceived' as keyof Claim,
      blockerText: 'Gate 2: OEM replacement / verified credit is missing.'
    },
    {
      id: 'gate-3',
      num: 3,
      title: 'GATE 3: Internal Inventory Adjustment Confirmed',
      desc: 'Stores confirmed stock adjustment for returned damaged part & inward component.',
      passed: d.g.inventoryAdjusted,
      field: 'inventoryAdjusted' as keyof Claim,
      blockerText: 'Gate 3: Internal inventory adjustment is not confirmed.'
    },
    {
      id: 'gate-4',
      num: 4,
      title: 'GATE 4: Finance Receivable Cleared & Local Expense Reversed',
      desc: 'Finance confirms OEM receivable cleared & temporary local purchase expense reversed/settled.',
      passed: d.g.financeCleared,
      field: 'financeReceivableCleared' as keyof Claim,
      blockerText: 'Gate 4: Finance settlement has not been confirmed.'
    }
  ];

  const passedCount = gates.filter(g => g.passed).length;
  const isEligible = d.eligible;

  return (
    <div className="closure-verification-card">
      <div className="closure-header">
        <div>
          <span className="section-subtitle">QMS PROCESS CONTROL</span>
          <h4 className="closure-title">CLAIM CLOSURE VERIFICATION</h4>
        </div>
        <div className="closure-status-box">
          <span className="gate-counter">{passedCount} / 4 Gates Passed</span>
          {isEligible ? (
            <div className="closure-pill eligible">
              <span className="check-mark">✓</span> All closure gates passed — <strong>CLAIM CLOSURE ELIGIBLE</strong>
            </div>
          ) : (
            <div className="closure-pill blocked">
              <span className="cross-mark">✕</span> <strong>CLAIM CLOSURE BLOCKED</strong>
            </div>
          )}
        </div>
      </div>

      <div className="gates-grid">
        {gates.map(gate => (
          <div key={gate.id} className={`gate-item ${gate.passed ? 'gate-passed' : 'gate-failed'}`}>
            <div className="gate-item-left">
              <span className={`gate-badge ${gate.passed ? 'pass' : 'fail'}`}>
                {gate.passed ? '✓ Passed' : '✕ Not Passed'}
              </span>
              <div>
                <h5 className="gate-name">{gate.title}</h5>
                <p className="gate-desc">{gate.desc}</p>
              </div>
            </div>
            {editable && onToggleGate && (
              <div className="gate-item-action">
                {gate.num === 2 && (
                  <div className="gate-toggle-group">
                    <label className="toggle-chip">
                      <input
                        type="checkbox"
                        checked={claim.oemReplacementReceived === 'Y'}
                        onChange={e => onToggleGate('oemReplacementReceived', e.target.checked ? 'Y' : 'N')}
                      />
                      Replacement Received
                    </label>
                    <label className="toggle-chip">
                      <input
                        type="checkbox"
                        checked={claim.creditNoteVerified === 'Y'}
                        onChange={e => onToggleGate('creditNoteVerified', e.target.checked ? 'Y' : 'N')}
                      />
                      Credit Verified
                    </label>
                  </div>
                )}
                {gate.num === 3 && (
                  <label className="toggle-chip">
                    <input
                      type="checkbox"
                      checked={claim.inventoryAdjusted === 'Y'}
                      onChange={e => onToggleGate('inventoryAdjusted', e.target.checked ? 'Y' : 'N')}
                    />
                    Confirmed
                  </label>
                )}
                {gate.num === 4 && (
                  <label className="toggle-chip">
                    <input
                      type="checkbox"
                      checked={claim.financeReceivableCleared === 'Y'}
                      onChange={e => onToggleGate('financeReceivableCleared', e.target.checked ? 'Y' : 'N')}
                    />
                    Cleared
                  </label>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isEligible && d.b.length > 0 && (
        <div className="blockers-alert">
          <div className="alert-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <strong>Mandatory Closure Blockers ({d.b.length}):</strong>
          </div>
          <ul className="blockers-list">
            {d.b.map((blocker, idx) => (
              <li key={idx}>✕ {blocker}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
