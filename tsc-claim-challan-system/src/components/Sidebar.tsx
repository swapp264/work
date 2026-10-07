import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  ShieldAlert, 
  Award, 
  BarChart3, 
  Settings, 
  UserCheck, 
  Database,
  Building2,
  ChevronRight,
  Users,
  Lock
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabName: string) => void;
  onNewClaim: () => void;
  collapsed?: boolean;
}

export function Sidebar({ currentTab, onSelectTab, onNewClaim }: SidebarProps) {
  const { currentUser, canAccessTab } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { 
      group: 'Claims', 
      items: [
        { label: 'Claim Register', icon: FileText },
        { label: 'Create Claim', icon: PlusCircle, action: onNewClaim }
      ]
    },
    { label: 'CAPA', icon: ShieldAlert },
    { label: 'OEM Performance', icon: Award },
    { label: 'Reports', icon: BarChart3 },
    { 
      group: 'Administration', 
      items: [
        { label: 'User Management', icon: Users },
        { label: 'Configuration', icon: Settings },
        { label: 'ERP / Admin', icon: Database }
      ]
    }
  ];

  return (
    <aside className="enterprise-sidebar">
      {/* BRANDING HEADER */}
      <div className="sidebar-brand">
        <div className="logo-wrapper">
          <img 
            src="/turel-logo.png" 
            alt="TUREL GROUP Logo" 
            className="brand-logo"
            onError={(e) => {
              // Fallback if logo fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="brand-text">
          <h1 className="company-title">TUREL GROUP</h1>
          <h2 className="subsidiary-title">TUREL SERVICE CORPORATION</h2>
          <span className="product-badge">Claim Challan System</span>
        </div>
      </div>

      <div className="qms-divider" />

      {/* NAVIGATION ITEMS */}
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if ('group' in item && item.items) {
            return (
              <div key={idx} className="nav-group">
                <div className="nav-group-header">
                  <span>{item.group}</span>
                </div>
                {item.items.map(sub => {
                  const Icon = sub.icon;
                  const isActive = currentTab === sub.label;
                  const hasAccess = canAccessTab(sub.label);

                  return (
                    <button
                      key={sub.label}
                      className={`nav-btn ${isActive ? 'active' : ''} ${!hasAccess ? 'nav-btn-restricted' : ''}`}
                      onClick={() => {
                        if (sub.action) sub.action();
                        else onSelectTab(sub.label);
                      }}
                      title={!hasAccess ? `Restricted for ${currentUser.role}` : sub.label}
                    >
                      <Icon className="nav-icon" size={18} />
                      <span className="nav-label">{sub.label}</span>
                      {!hasAccess && <Lock size={12} className="nav-lock-icon" />}
                      {isActive && <ChevronRight size={14} className="active-arrow" />}
                    </button>
                  );
                })}
              </div>
            );
          }

          const singleItem = item as { label: string; icon: any };
          const Icon = singleItem.icon;
          const isActive = currentTab === singleItem.label;
          const hasAccess = canAccessTab(singleItem.label);

          return (
            <button
              key={singleItem.label}
              className={`nav-btn ${isActive ? 'active' : ''} ${!hasAccess ? 'nav-btn-restricted' : ''}`}
              onClick={() => onSelectTab(singleItem.label)}
              title={!hasAccess ? `Restricted for ${currentUser.role}` : singleItem.label}
            >
              <Icon className="nav-icon" size={18} />
              <span className="nav-label">{singleItem.label}</span>
              {!hasAccess && <Lock size={12} className="nav-lock-icon" />}
              {isActive && <ChevronRight size={14} className="active-arrow" />}
            </button>
          );
        })}
      </nav>

      {/* FOOTER AUDIT STAMP & CURRENT USER INFO */}
      <div className="sidebar-footer">
        <div className="sidebar-active-user-badge">
          <div className="sidebar-user-avatar">
            <span>{currentUser.name.charAt(0)}</span>
          </div>
          <div className="sidebar-user-meta">
            <strong className="sidebar-user-name" title={currentUser.name}>{currentUser.name}</strong>
            <span className="sidebar-user-role-text">{currentUser.role} · {currentUser.branch}</span>
          </div>
        </div>

        <div className="qms-stamp">
          <Building2 size={13} />
          <span>ISO 9001:2015 QMS Verified</span>
        </div>
      </div>
    </aside>
  );
}
