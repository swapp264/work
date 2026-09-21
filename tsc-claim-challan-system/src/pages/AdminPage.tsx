import React from 'react';
import { Database, RefreshCw, Server, Layers, ShieldCheck } from 'lucide-react';

interface AdminPageProps {
  onResetData: () => Promise<void>;
}

export function AdminPage({ onResetData }: AdminPageProps) {
  return (
    <div className="admin-page">
      <div className="enterprise-card admin-card">
        <div className="card-header-row">
          <div>
            <span className="section-subtitle">DATA ARCHITECTURE & INTEGRATION</span>
            <h3 className="card-title">ERP & System Data Management</h3>
          </div>
          <Database size={22} className="card-header-icon" />
        </div>

        <div className="architecture-diagram-box">
          <h4 className="diagram-title">Target Enterprise Integration Topology</h4>
          <div className="topo-flow">
            <div className="topo-node active">
              <Layers size={20} />
              <span>React Frontend (Active)</span>
            </div>
            <div className="topo-arrow">↓</div>
            <div className="topo-node">
              <Server size={20} />
              <span>Backend REST / GraphQL API</span>
            </div>
            <div className="topo-arrow">↓</div>
            <div className="topo-node">
              <Database size={20} />
              <span>PostgreSQL Database</span>
            </div>
            <div className="topo-arrow">↓</div>
            <div className="topo-node">
              <ShieldCheck size={20} />
              <span>ERP Adapter (Tuhund ERP)</span>
            </div>
          </div>
        </div>

        <div className="admin-info-section">
          <h4>Current Pilot Operating Mode</h4>
          <p>
            <strong>Mode:</strong> Local Repository Abstraction (<code>MockRepository</code> with <code>localStorage</code> persistence).
          </p>
          <p>
            No live Tuhund API endpoint or backend credentials have been attached. The architecture maintains a clean separation of business domain rules, repository layer, and UI rendering.
          </p>
        </div>

        <div className="admin-danger-zone">
          <h4>Reset Seed & Local State</h4>
          <p>Restores original seed claims, CAPA records, and default QMS SLA target settings.</p>
          <button className="danger-btn" onClick={onResetData}>
            <RefreshCw size={16} />
            <span>Reset Demo Data & Reload System</span>
          </button>
        </div>
      </div>
    </div>
  );
}
