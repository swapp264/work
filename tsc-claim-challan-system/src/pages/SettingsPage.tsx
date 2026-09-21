import React, { useState } from 'react';
import { Config } from '../domain';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

interface SettingsPageProps {
  config: Config;
  onSaveConfig: (cfg: Config) => Promise<void>;
}

export function SettingsPage({ config, onSaveConfig }: SettingsPageProps) {
  const [cfg, setCfg] = useState<Config>(config);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await onSaveConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-page">
      <div className="enterprise-card settings-card">
        <div className="card-header-row">
          <div>
            <span className="section-subtitle">QMS PROCESS PARAMETERS</span>
            <h3 className="card-title">Centralized SLA & Performance Targets Configuration</h3>
          </div>
          <Settings size={22} className="card-header-icon" />
        </div>

        <p className="settings-intro">
          Target values govern automatic SLA breach calculations across the system. All rules follow formal procedure TSC-QMS-SVC-007.
        </p>

        {saved && (
          <div className="success-toast-banner">
            <CheckCircle2 size={16} />
            <span>QMS Configuration saved successfully to Local Repository!</span>
          </div>
        )}

        <div className="settings-grid">
          <label className="form-field">
            <span className="field-label">Claim Creation SLA (Days)</span>
            <input 
              type="number" 
              min="1" 
              value={cfg.claimCreationWorkingDays} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, claimCreationWorkingDays: Number(e.target.value) })} 
            />
            <small className="field-hint">Target ≤ 2 working days</small>
          </label>

          <label className="form-field">
            <span className="field-label">OEM Claim Entry SLA (Days)</span>
            <input 
              type="number" 
              min="1" 
              value={cfg.oemClaimEntryWorkingDays} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, oemClaimEntryWorkingDays: Number(e.target.value) })} 
            />
            <small className="field-hint">Target ≤ 1 working day</small>
          </label>

          <label className="form-field">
            <span className="field-label">Interim Sourcing SLA (Days)</span>
            <input 
              type="number" 
              min="1" 
              value={cfg.interimSourcingWorkingDays} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, interimSourcingWorkingDays: Number(e.target.value) })} 
            />
            <small className="field-hint">Target ≤ 3 working days</small>
          </label>

          <label className="form-field">
            <span className="field-label">OEM GRN Inward SLA (Days)</span>
            <input 
              type="number" 
              min="1" 
              value={cfg.oemGRNWorkingDays} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, oemGRNWorkingDays: Number(e.target.value) })} 
            />
            <small className="field-hint">Target ≤ 1 working day</small>
          </label>

          <label className="form-field">
            <span className="field-label">Full Closure SLA (Days)</span>
            <input 
              type="number" 
              min="1" 
              value={cfg.fullClosureCalendarDays} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, fullClosureCalendarDays: Number(e.target.value) })} 
            />
            <small className="field-hint">Target ≤ 30 calendar days</small>
          </label>

          <label className="form-field">
            <span className="field-label">CAPA Completion SLA (Days)</span>
            <input 
              type="number" 
              min="1" 
              value={cfg.capaCompletionDays} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, capaCompletionDays: Number(e.target.value) })} 
            />
            <small className="field-hint">Target ≤ 30 days</small>
          </label>

          <label className="form-field">
            <span className="field-label">Target Approval Rate (%)</span>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={cfg.approvalRateTarget} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, approvalRateTarget: Number(e.target.value) })} 
            />
            <small className="field-hint">Target ≥ 90%</small>
          </label>

          <label className="form-field">
            <span className="field-label">Target OEM Recovery Rate (%)</span>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={cfg.recoveryRateTarget} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, recoveryRateTarget: Number(e.target.value) })} 
            />
            <small className="field-hint">Target ≥ 85%</small>
          </label>

          <label className="form-field">
            <span className="field-label">Day Calculation Mode</span>
            <select 
              value={cfg.mode} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCfg({ ...cfg, mode: e.target.value as any })}
            >
              <option value="working">Working Days (Excludes Weekends)</option>
              <option value="calendar">Calendar Days (Consecutive)</option>
            </select>
          </label>
        </div>

        <div className="settings-footer">
          <button className="primary-btn" onClick={save}>
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
