import React, { useState } from 'react';
import { Claim } from '../domain';
import { Search, Bell, User, Plus, ShieldCheck, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewClaim: () => void;
  onOpenLoginModal?: () => void;
  claims?: Claim[];
  onSelectClaim?: (c: Claim) => void;
  onNavigateToRegister?: () => void;
}

export function Header({ 
  currentTab, 
  searchQuery, 
  onSearchChange, 
  onNewClaim, 
  onOpenLoginModal,
  claims = [],
  onSelectClaim,
  onNavigateToRegister
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const notifications = [
    { id: '1', title: 'OEM Claim Pending', desc: 'CLM-TSC-KAN-TY-25-26-001 awaiting OEM response', time: '10m ago', urgent: true },
    { id: '2', title: 'CAPA Effectiveness Due', desc: 'CAPA-002 target review date approaching', time: '1h ago', urgent: false },
    { id: '3', title: '4/4 Gates Passed', desc: 'CLM-TSC-LDH-TY-25-26-001 ready for final closure', time: '2h ago', urgent: false }
  ];

  // Filter matching claims for autocomplete dropdown
  const query = searchQuery.trim().toLowerCase();
  const matchingClaims = query
    ? claims.filter(c => {
        const text = [
          c.claimNo,
          c.customerName,
          c.partNo,
          c.serialNo,
          c.oemClaimNo,
          c.brand,
          c.model,
          c.category,
          c.callNo
        ].join(' ').toLowerCase();
        return text.includes(query);
      }).slice(0, 6)
    : [];

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

      {/* CENTER: SEARCH BAR WITH INSTANT AUTOCOMPLETE DROPDOWN */}
      <div className="header-center">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Global search: Claim No., Customer, Part No., Serial No., OEM Claim..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="global-search-input"
          />
          {searchQuery && (
            <button 
              type="button" 
              className="clear-search-btn" 
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ×
            </button>
          )}

          {/* AUTOCOMPLETE POPUP DROPDOWN */}
          {isSearchFocused && query && (
            <div className="global-search-dropdown" onMouseDown={e => e.preventDefault()}>
              <div className="dropdown-header">
                <span>Matching Claims ({matchingClaims.length})</span>
                <small>Click to open details</small>
              </div>

              {matchingClaims.length === 0 ? (
                <div className="dropdown-empty">
                  No claims found matching "<strong>{searchQuery}</strong>"
                </div>
              ) : (
                <div className="dropdown-list">
                  {matchingClaims.map(c => (
                    <div 
                      key={c.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setIsSearchFocused(false);
                        if (onSelectClaim) onSelectClaim(c);
                      }}
                    >
                      <div className="item-icon-wrap">
                        <FileText size={16} />
                      </div>
                      <div className="item-details">
                        <div className="item-main-row">
                          <strong className="item-claim-no">{c.claimNo}</strong>
                          <span className="item-brand-tag">{c.brand}</span>
                        </div>
                        <div className="item-sub-row">
                          <span className="item-customer">{c.customerName}</span>
                          <span className="item-bullet">·</span>
                          <span className="item-part">Part: {c.partNo}</span>
                          {c.oemClaimNo && (
                            <>
                              <span className="item-bullet">·</span>
                              <span className="item-oem">OEM: {c.oemClaimNo}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className="item-arrow" />
                    </div>
                  ))}

                  {onNavigateToRegister && (
                    <div 
                      className="dropdown-footer" 
                      onClick={() => {
                        setIsSearchFocused(false);
                        onNavigateToRegister();
                      }}
                    >
                      <span>View full filtered results in Claim Register</span>
                      <ChevronRight size={14} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: NOTIFICATIONS, NEW CLAIM CTA & USER PROFILE */}
      <div className="header-right">
        <button 
          type="button"
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
            type="button"
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
