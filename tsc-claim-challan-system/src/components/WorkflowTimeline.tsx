import React from 'react';
import { Claim, Config, derived } from '../domain';

interface WorkflowTimelineProps {
  claim: Claim;
  config: Config;
}

export function WorkflowTimeline({ claim, config }: WorkflowTimelineProps) {
  const d = derived(claim, config);

  const steps = [
    { title: 'Claim Created', active: true, done: true, subtitle: claim.claimDate || 'Initiated' },
    { title: 'OEM Claim Raised', active: !!claim.oemClaimNo, done: !!claim.oemClaimNo, subtitle: claim.oemClaimNo || 'Pending Filing' },
    { title: 'Interim Sourcing', active: !!claim.interimOption, done: !!claim.interimOption, subtitle: claim.interimOption ? `Option ${claim.interimOption}` : 'Not Initiated' },
    { title: 'HO / Branch Inward', active: claim.newPartAtHO === 'Y' || claim.newPartAtBranch === 'Y', done: claim.newPartAtHO === 'Y' || claim.newPartAtBranch === 'Y', subtitle: claim.hoGRNNo || claim.branchGRNNo || 'Pending' },
    { title: 'Dispatched / Customer', active: claim.turelNewPartOutward === 'Y', done: claim.turelNewPartOutward === 'Y', subtitle: claim.customerReceiptDate || 'In Transit' },
    { title: 'Full Closure', active: d.eligible, done: d.eligible, subtitle: d.eligible ? 'All Gates Passed' : 'Gates Pending' }
  ];

  return (
    <div className="workflow-timeline-card">
      <div className="timeline-header">
        <span className="section-subtitle">WORKFLOW STAGE PRESENTATION</span>
        <h4 className="timeline-title">Current Status: <span className="status-highlight">{d.status}</span></h4>
      </div>
      <div className="timeline-steps">
        {steps.map((step, idx) => {
          const isCurrent = d.status.toLowerCase().includes(step.title.toLowerCase().substring(0, 5));
          return (
            <div key={idx} className={`timeline-step ${step.done ? 'step-done' : ''} ${isCurrent ? 'step-current' : ''}`}>
              <div className="step-marker">
                {step.done ? '✓' : idx + 1}
              </div>
              <div className="step-content">
                <span className="step-name">{step.title}</span>
                <span className="step-sub">{step.subtitle}</span>
              </div>
              {idx < steps.length - 1 && <div className={`step-connector ${step.done ? 'connector-done' : ''}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
