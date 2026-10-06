import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound, UserCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface AccessDeniedProps {
  requiredPermission?: string;
  tabName?: string;
  onNavigateDashboard?: () => void;
  onOpenLoginModal?: () => void;
}

export function AccessDenied({
  requiredPermission,
  tabName,
  onNavigateDashboard,
  onOpenLoginModal
}: AccessDeniedProps) {
  const { currentUser } = useAuth();

  return (
    <div className="access-denied-container">
      <div className="enterprise-card access-denied-card">
        <div className="denied-icon-wrap">
          <ShieldAlert size={48} className="denied-icon" />
        </div>

        <span className="denied-tag">RBAC RESTRICTION</span>
        <h2 className="denied-title">Access Restricted</h2>
        <p className="denied-subtitle">
          Your current enterprise role does not have authorization to access <strong>{tabName || 'this module'}</strong>.
        </p>

        <div className="denied-meta-box">
          <div className="meta-row">
            <span className="meta-label">Active User:</span>
            <span className="meta-value"><strong>{currentUser.name}</strong> ({currentUser.employeeId})</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Assigned Role:</span>
            <span className="meta-value role-badge">{currentUser.role}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Operating Branch:</span>
            <span className="meta-value">{currentUser.branch}</span>
          </div>
          {requiredPermission && (
            <div className="meta-row highlight">
              <span className="meta-label">Required Permission:</span>
              <span className="meta-value code-pill">{requiredPermission}</span>
            </div>
          )}
        </div>

        <div className="denied-actions">
          {onNavigateDashboard && (
            <button className="secondary-btn" onClick={onNavigateDashboard}>
              <ArrowLeft size={16} />
              <span>Return to Dashboard</span>
            </button>
          )}
          {onOpenLoginModal && (
            <button className="primary-btn" onClick={onOpenLoginModal}>
              <KeyRound size={16} />
              <span>Switch User / Admin Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
