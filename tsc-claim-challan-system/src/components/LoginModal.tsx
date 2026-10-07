import React, { useState } from 'react';
import { 
  Lock, ShieldCheck, X, User, Building2, Key, 
  CheckCircle2, AlertTriangle, LogIn, LogOut, ArrowRight, Search 
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { AppUser, BRANCHES, UserRole, ROLES, PERMISSIONS } from '../auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { currentUser, users, login, loginAsUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [userInput, setUserInput] = useState('');
  const [adminInput, setAdminInput] = useState('admin');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await login(userInput, 'user');
    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed');
    } else {
      setSuccessMsg(`Welcome, ${currentUser?.name || userInput}! Session authenticated.`);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await login(adminInput, 'admin');
    if (!res.success) {
      setErrorMsg(res.error || 'ERP/Admin Authentication failed');
    } else {
      setSuccessMsg('ERP/Admin superuser session verified and active.');
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleQuickSwitch = (u: AppUser) => {
    setErrorMsg(null);
    const res = loginAsUser(u);
    if (!res.success) {
      setErrorMsg(res.error || 'Could not switch user.');
    } else {
      setSuccessMsg(`Switched active session to ${u.name} (${u.role}).`);
      setTimeout(() => {
        onClose();
      }, 600);
    }
  };

  // Find sample representative users for quick testing each role
  const sampleUsersByRole: { role: UserRole; user?: AppUser }[] = ROLES.map(r => ({
    role: r,
    user: users.find(u => u.role === r && u.status === 'Active')
  }));

  // Filter users list for user picker
  const filteredUsers = users.filter(u => {
    if (selectedBranch !== 'all' && u.branch !== selectedBranch) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  }).slice(0, 8); // Show top 8 matching for quick selection

  return (
    <div className="overlay" onClick={onClose}>
      <div className="enterprise-modal login-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* BRAND HEADER */}
        <div className="login-brand-header">
          <div className="login-logo-container">
            <img src="/turel-logo.png" alt="TUREL GROUP Logo" className="login-logo" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          </div>
          <h2 className="login-corp-name">TUREL SERVICE CORPORATION</h2>
          <h3 className="login-product-name">Claim Challan Management System</h3>
          <p className="login-subtitle">Enterprise Identity & Role-Based Access Control (RBAC)</p>
        </div>

        {/* ACTIVE SESSION STATUS BANNER */}
        <div className="active-user-session-card">
          <div className="session-left">
            <div className="session-avatar">
              <ShieldCheck size={28} className="shield-icon" />
            </div>
            <div className="session-info">
              <div className="session-header-line">
                <span className="session-status-tag">ACTIVE AUTHENTICATED SESSION</span>
                <span className="session-emp-id">{currentUser.employeeId}</span>
              </div>
              <h4 className="session-name">{currentUser.name}</h4>
              <div className="session-meta">
                <span className={`role-badge role-${currentUser.role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                  {currentUser.role}
                </span>
                <span className="session-bullet">·</span>
                <span className="session-branch">
                  <Building2 size={13} className="inline-icon" /> {currentUser.branch}
                </span>
                <span className="session-bullet">·</span>
                <span className="session-rights">
                  <Key size={13} className="inline-icon" /> {currentUser.permissions.length} Rights Granted
                </span>
              </div>
            </div>
          </div>

          <div className="session-actions">
            <button
              type="button"
              className="btn-outline-signout"
              onClick={() => {
                logout();
                setSuccessMsg('Session ended. Switched to default viewer.');
              }}
              title="End active session"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* CURRENT USER RIGHTS CHIPS */}
        <div className="current-rights-section">
          <span className="rights-section-title">Assigned Permissions in Active Session:</span>
          <div className="rights-chips-container">
            {currentUser.permissions.map(pId => {
              const def = PERMISSIONS.find(p => p.id === pId);
              return (
                <span key={pId} className="permission-chip" title={def?.description || pId}>
                  <CheckCircle2 size={11} className="chip-check" />
                  <span>{def?.label || pId}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* TABS: USER LOGIN vs ERP / ADMIN LOGIN */}
        <div className="login-mode-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('user');
              setErrorMsg(null);
            }}
          >
            <User size={16} />
            <span>User Login (155+ Staff)</span>
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg(null);
            }}
          >
            <Lock size={16} />
            <span>ERP / Admin Login</span>
          </button>
        </div>

        {/* FEEDBACK BANNERS */}
        {errorMsg && (
          <div className="login-feedback-banner error">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="login-feedback-banner success">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="login-tab-body">
          {/* USER LOGIN TAB */}
          {activeTab === 'user' && (
            <div className="tab-pane-content">
              {/* QUICK ROLE SWITCHER PILLS FOR EVALUATION */}
              <div className="quick-switch-section">
                <span className="quick-switch-label">Quick Switch Role for Testing:</span>
                <div className="quick-role-buttons">
                  {sampleUsersByRole.map(({ role, user }) => {
                    if (!user) return null;
                    const isSelected = currentUser.id === user.id;
                    return (
                      <button
                        key={role}
                        type="button"
                        className={`role-switch-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleQuickSwitch(user)}
                        title={`Log in as ${user.name} (${user.employeeId}, ${user.branch})`}
                      >
                        <strong>{role}</strong>
                        <small>{user.name.split(' ')[0]} ({user.branch})</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SEARCH & SELECT USER FORM */}
              <div className="user-picker-section">
                <div className="picker-header-row">
                  <span className="picker-title">Select or Search Any User ({users.length} Dynamic Staff):</span>
                  <select
                    className="branch-quick-select"
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                  >
                    <option value="all">All 10 Branches</option>
                    {BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="picker-search-input">
                  <Search size={14} className="picker-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Employee ID, Name or Username..."
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                  />
                </div>

                <div className="user-picker-scroll-list">
                  {filteredUsers.map(u => {
                    const isCurrent = currentUser.id === u.id;
                    const isInactive = u.status === 'Inactive';

                    return (
                      <div
                        key={u.id}
                        className={`user-picker-row ${isCurrent ? 'active' : ''} ${isInactive ? 'inactive' : ''}`}
                        onClick={() => handleQuickSwitch(u)}
                      >
                        <div className="picker-row-info">
                          <strong className="picker-emp">{u.employeeId}</strong>
                          <span className="picker-name">{u.name}</span>
                          <span className="picker-role-tag">{u.role}</span>
                          <span className="picker-branch-text">{u.branch}</span>
                        </div>

                        <div className="picker-row-action">
                          {isInactive ? (
                            <span className="inactive-badge">Deactivated</span>
                          ) : isCurrent ? (
                            <span className="active-session-label">Current</span>
                          ) : (
                            <span className="login-link-text">Login <ArrowRight size={12} /></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MANUAL LOGIN INPUT FORM */}
              <form onSubmit={handleUserLoginSubmit} className="manual-login-form">
                <div className="form-row-inline">
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      placeholder="Or enter Employee ID (e.g. TSC-EMP-004) / Username"
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="login-submit-btn">
                    <LogIn size={15} />
                    <span>Sign In</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ERP / ADMIN LOGIN TAB */}
          {activeTab === 'admin' && (
            <div className="tab-pane-content admin-tab-pane">
              <div className="admin-portal-box">
                <div className="admin-portal-header">
                  <div className="admin-shield-wrap">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h4>ERP / Administrator Security Gateway</h4>
                    <p>Elevated master authorization for ISO 9001 Process Control & System Administration</p>
                  </div>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="admin-login-form">
                  <div className="form-group">
                    <label>Admin Login / Employee ID</label>
                    <input
                      type="text"
                      required
                      value={adminInput}
                      onChange={e => setAdminInput(e.target.value)}
                      placeholder="admin or TSC-EMP-001"
                    />
                  </div>

                  <div className="admin-credential-hint">
                    <span>Master Admin: <strong>Swapnil Mote (Service Head & ERP Admin)</strong></span>
                    <code>Username: admin | ID: TSC-EMP-001 | Branch: Mumbai HO</code>
                  </div>

                  <button type="submit" className="primary-btn-full">
                    <ShieldCheck size={18} />
                    <span>Authenticate as ERP Administrator</span>
                  </button>
                </form>

                <div className="auth-security-notice">
                  <Lock size={14} />
                  <span>Centralized identity enforcement with audit tracking for all administrative operations.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="login-modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Continue Working
          </button>
        </div>
      </div>
    </div>
  );
}
