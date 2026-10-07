import React, { useState } from 'react';
import { Database, RefreshCw, Server, Layers, ShieldCheck, Users } from 'lucide-react';
import { UserManagement } from '../components/UserManagement';

interface AdminPageProps {
  onResetData: () => Promise<void>;
  initialSection?: 'users' | 'erp';
}

export function AdminPage({ onResetData, initialSection = 'users' }: AdminPageProps) {
  const [section, setSection] = useState<'users' | 'erp'>(initialSection);

  return (
    <div className="admin-page">
      {/* SECTION SELECTOR HEADER TABS */}
      <div className="admin-subnav-tabs">
        <button
          type="button"
          className={`subnav-tab-btn ${section === 'users' ? 'active' : ''}`}
          onClick={() => setSection('users')}
        >
          <Users size={16} />
          <span>User & Access Rights Management (155+ Staff)</span>
        </button>
        <button
          type="button"
          className={`subnav-tab-btn ${section === 'erp' ? 'active' : ''}`}
          onClick={() => setSection('erp')}
        >
          <Database size={16} />
          <span>ERP Architecture & Data Management</span>
        </button>
      </div>

      {section === 'users' && <UserManagement />}

      {section === 'erp' && (
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
            <h4>Current Operating Architecture</h4>
            <p>
              <strong>Mode:</strong> Local Repository Abstraction (<code>MockRepository</code> with <code>localStorage</code> persistence).
            </p>
            <p>
              The system features a centralized enterprise identity and RBAC subsystem supporting 155+ dynamic users across all 10 national branch locations with full granular permission enforcement.
            </p>
          </div>

          <div className="admin-danger-zone">
            <h4>Reset Seed & Local State</h4>
            <p>Restores original seed claims, CAPA records, default QMS SLA target settings, and the 155+ staff user directory.</p>
            <button className="danger-btn" onClick={onResetData}>
              <RefreshCw size={16} />
              <span>Reset Demo Data & Reload System</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
