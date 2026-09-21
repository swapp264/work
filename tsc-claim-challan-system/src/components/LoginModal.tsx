import React from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="login-brand-header">
          <div className="login-logo-container">
            <img src="/turel-logo.png" alt="TUREL GROUP Logo" className="login-logo" />
          </div>
          <h2 className="login-corp-name">TUREL SERVICE CORPORATION</h2>
          <h3 className="login-product-name">Claim Challan Management System</h3>
          <p className="login-subtitle">Enterprise Process Control & QMS Audit Portal</p>
        </div>

        <div className="login-card-body">
          <div className="user-profile-card">
            <div className="profile-icon-wrapper">
              <ShieldCheck size={32} className="shield-icon" />
            </div>
            <div className="profile-info">
              <h4>Active Session: Service Head</h4>
              <p>User: Swapnil (Quality Manager / Operations Lead)</p>
              <span className="auth-badge">AUTHENTICATED · ISO 9001 AUDITOR ACCESS</span>
            </div>
          </div>

          <div className="auth-security-notice">
            <Lock size={14} />
            <span>Secured via TUREL Group Enterprise Identity & Role-Based Access Control (RBAC).</span>
          </div>
        </div>

        <div className="login-modal-footer">
          <button className="primary-btn-full" onClick={onClose}>
            Continue Active Session
          </button>
        </div>
      </div>
    </div>
  );
}
