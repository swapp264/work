import React from 'react';
import { Claim, Config, derived } from '../domain';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface GateVerificationProps {
  claim: Claim;
  config: Config;
  onToggleGate?: (key: keyof Claim, val: any) => void;
  onGenerateClosingNote?: () => void;
  editable?: boolean;
}

export function GateVerification({ 
  claim, 
  config, 
  onToggleGate, 
  onGenerateClosingNote,
  editable = false 
}: GateVerificationProps) {
  const d = derived(claim, config);
  const gates = [
    {
      id: 'gate-1',
      num: 1,
      title: 'GATE 1: OEM Claim Number Entered',
      desc: 'Mandatory OEM claim reference required before interim sourcing or closure.',
      passed: d.g.oemClaimNo,
      field: 'oemClaimNo' as keyof Claim,
      blockerText: 'Gate 1 — OEM Claim Number missing'
    },
    {
      id: 'gate-2',
      num: 2,
      title: 'GATE 2: OEM Replacement GRN / Credit Note Verified',
      desc: 'OEM replacement received through Claim GRN OR Finance-verified credit note available.',
      passed: d.g.replacementOrCreditVerified,
      field: 'oemReplacementReceived' as keyof Claim,
      blockerText: 'Gate 2 — OEM replacement / verified credit note pending'
    },
    {
      id: 'gate-3',
      num: 3,
      title: 'GATE 3: Internal Inventory Adjustment Confirmed',
      desc: 'Stores confirmed stock adjustment for returned damaged part & inward component.',
      passed: d.g.inventoryAdjusted,
      field: 'inventoryAdjusted' as keyof Claim,
      blockerText: 'Gate 3 — Internal inventory adjustment pending'
    },
    {
      id: 'gate-4',
      num: 4,
      title: 'GATE 4: Finance Receivable Cleared & Local Expense Reversed',
      desc: 'Finance confirms OEM receivable cleared & temporary local purchase expense reversed/settled.',
      passed: d.g.financeCleared,
      field: 'financeReceivableCleared' as keyof Claim,
      blockerText: 'Gate 4 — Finance settlement & expense reversal pending'
    }
  ];

  const passedCount = gates.filter(g => g.passed).length;
  const isAllPassed = passedCount === 4;
  const hasClosingNote = !!claim.closingNoteNo;

  return (
    <div className="closure-verification-card">
      <div className="closure-header">
        <div>
          <span className="section-subtitle">QMS PROCESS CONTROL</span>
          <h4 className="closure-title">CLAIM CLOSURE VERIFICATION</h4>
        </div>
        <div className="closure-status-box">
          <span className="gate-counter">{passedCount} / 4 Gates Passed</span>
          {isAllPassed ? (
            <div className="closure-pill eligible">
              <span className="check-mark">✓</span> <strong>4 / 4 GATES PASSED</strong> — CLAIM CLOSURE ELIGIBLE
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

      {/* CLOSING NOTE INTERLOCK & ACTION BAR */}
      <div className="closing-note-interlock-bar">
        {isAllPassed ? (
          <div className="interlock-ready-box">
            <div className="interlock-info">
              <CheckCircle2 size={20} className="check-icon" />
              <div>
                <strong>All 4 Closure Gates Passed!</strong>
                <p>Formal Claim Closing Note can now be generated to archive and finalize this claim.</p>
              </div>
            </div>
            {onGenerateClosingNote && (
              <button 
                type="button" 
                className="cta-closing-btn"
                onClick={onGenerateClosingNote}
                title="Generate official 4-Gate Claim Closing Certificate"
              >
                <ShieldCheck size={16} />
                <span>{hasClosingNote ? 'Re-Generate Closing Note' : 'GENERATE CLOSING NOTE'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="interlock-locked-box">
            <div className="lock-header-row">
              <Lock size={16} className="lock-icon" />
              <strong>Closing Note Locked — 4 / 4 Process Gates Required</strong>
            </div>
            <p className="lock-desc">
              ISO 9001:2015 procedure prohibits closing note issuance while gates remain open.
            </p>
            <ul className="blocking-gates-list">
              {gates.filter(g => !g.passed).map(g => (
                <li key={g.id}>• {g.blockerText}</li>
              ))}
            </ul>
            <button 
              type="button" 
              className="cta-closing-btn disabled" 
              disabled 
              title="All 4 gates must pass to generate Closing Note"
            >
              <Lock size={14} />
              <span>GENERATE CLOSING NOTE (LOCKED)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
