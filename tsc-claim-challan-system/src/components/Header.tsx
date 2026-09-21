import React, { useState } from 'react';
import { Search, Bell, User, Plus, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewClaim: () => void;
  onOpenLoginModal?: () => void;
}

export function Header({ currentTab, searchQuery, onSearchChange, onNewClaim, onOpenLoginModal }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: '1', title: 'OEM Claim Pending', desc: 'CLM-TSC-KAN-TY-25-26-001 awaiting OEM response', time: '10m ago', urgent: true },
    { id: '2', title: 'CAPA Effectiveness Due', desc: 'CAPA-002 target review date approaching', time: '1h ago', urgent: false },
    { id: '3', title: '4/4 Gates Passed', desc: 'CLM-TSC-LDH-TY-25-26-001 ready for final closure', time: '2h ago', urgent: false }
  ];

  return (
    <header className="enterprise-header">
      {/* LEFT: TITLE & BREADCRUMBS */}
      <div className="header-left">
        <div className="breadcrumb-nav">
          <span className="bc-root">TUREL SERVICE CORPORATION</span>
          <span className="bc-sep">/</span>
          <span className="bc-qms">ISO 9001:2015 (TSC-QMS-SVC-007)</span>
          <span className="bc-sep">/</span>
          <span className="bc-current">{currentTab}</span>
        </div>
        <h2 className="header-title">{currentTab}</h2>
      </div>

      {/* CENTER: SEARCH BAR */}
      <div className="header-center">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Global search: Claim No., Customer, Part No., Serial No., OEM Claim..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="global-search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => onSearchChange('')}>×</button>
          )}
        </div>
      </div>

      {/* RIGHT: NOTIFICATIONS, NEW CLAIM CTA & USER PROFILE */}
      <div className="header-right">
        <button 
          className="cta-primary-btn" 
          onClick={onNewClaim}
          title="Create a new warranty claim"
        >
          <Plus size={16} />
          <span>+ New Claim</span>
        </button>

        {/* NOTIFICATION TRIGGER */}
        <div className="notification-wrapper">
          <button 
            className="icon-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            title="QMS Notifications"
          >
            <Bell size={18} />
            <span className="notification-badge">{notifications.length}</span>
          </button>

          {showNotifications && (
            <div className="notification-popover">
              <div className="popover-header">
                <h4>System Notifications</h4>
                <span className="popover-count">{notifications.length} new</span>
              </div>
              <div className="popover-body">
                {notifications.map(n => (
                  <div key={n.id} className={`notification-item ${n.urgent ? 'urgent' : ''}`}>
                    <div className="notif-bullet" />
                    <div>
                      <strong className="notif-title">{n.title}</strong>
                      <p className="notif-desc">{n.desc}</p>
                      <small className="notif-time">{n.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* USER PROFILE */}
        <div className="user-profile-menu" onClick={onOpenLoginModal} title="Click to view Corporate Auth details">
          <div className="avatar-circle">
            <User size={16} />
          </div>
          <div className="user-details">
            <span className="user-name">Swapnil (Service Head)</span>
            <span className="user-role">QMS Lead · TSC Mumbai</span>
          </div>
          <ShieldCheck size={14} className="verified-shield" />
        </div>
      </div>
    </header>
  );
}
