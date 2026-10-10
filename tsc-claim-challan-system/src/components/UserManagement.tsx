import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, ShieldCheck, Edit3, 
  CheckCircle2, XCircle, Power, ChevronLeft, ChevronRight, 
  Building2, Key, Check, AlertCircle, X, LogIn
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { 
  AppUser, Branch, BRANCHES, UserRole, ROLES, 
  PERMISSIONS, PermissionId, ROLE_DEFAULT_PERMISSIONS, ALL_PERMISSION_IDS,
  Team, TEAMS, getUserTeam
} from '../auth';

export function UserManagement() {
  const { users, currentUser, saveUser, toggleUserStatus, loginAsUser, hasPermission } = useAuth();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmpId, setFormEmpId] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Service/Claim User');
  const [formTeam, setFormTeam] = useState<Team>('Service Team');
  const [formBranch, setFormBranch] = useState<Branch>('Mumbai HO');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formPermissions, setFormPermissions] = useState<PermissionId[]>([]);
  const [formDesignation, setFormDesignation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (branchFilter !== 'all' && u.branch !== branchFilter) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (teamFilter !== 'all' && getUserTeam(u) !== teamFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const userTeam = getUserTeam(u).toLowerCase();
        const match = (
          u.name.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.branch.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          userTeam.includes(q)
        );
        if (!match) return false;
      }
      return true;
    });
  }, [users, search, branchFilter, roleFilter, teamFilter, statusFilter]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'Active').length,
      inactive: users.filter(u => u.status === 'Inactive').length,
      branchesCount: new Set(users.map(u => u.branch)).size
    };
  }, [users]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextEmpNum = users.length + 1;
    const defaultEmpId = `TSC-EMP-${String(nextEmpNum).padStart(3, '0')}`;
    const defaultRole: UserRole = 'Service/Claim User';

    setEditingUser(null);
    setFormName('');
    setFormEmpId(defaultEmpId);
    setFormUsername('');
    setFormEmail('');
    setFormRole(defaultRole);
    setFormTeam('Service Team');
    setFormBranch('Mumbai HO');
    setFormStatus('Active');
    setFormPermissions([...ROLE_DEFAULT_PERMISSIONS[defaultRole]]);
    setFormDesignation('Claim Executive');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmpId(user.employeeId);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormTeam(getUserTeam(user));
    setFormBranch(user.branch);
    setFormStatus(user.status);
    setFormPermissions([...user.permissions]);
    setFormDesignation(user.designation || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // When role changes in modal, auto-suggest default permissions and team
  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    setFormPermissions([...ROLE_DEFAULT_PERMISSIONS[newRole]]);
    if (newRole === 'Admin/ERP' || newRole === 'Branch Manager') {
      setFormTeam('Management/Admin');
    } else if (newRole === 'Finance User') {
      setFormTeam('Input Team');
    }
  };

  // Toggle individual permission
  const handleTogglePermission = (pId: PermissionId) => {
    if (formPermissions.includes(pId)) {
      setFormPermissions(formPermissions.filter(p => p !== pId));
    } else {
      setFormPermissions([...formPermissions, pId]);
    }
  };

  // Save Modal
  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!formEmpId.trim()) {
      setFormError('Employee ID is required.');
      return;
    }
    if (!formUsername.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Valid corporate email address is required.');
      return;
    }

    // Check duplicate employee ID or username
    const isDupEmp = users.some(u => u.id !== editingUser?.id && u.employeeId.toLowerCase() === formEmpId.trim().toLowerCase());
    if (isDupEmp) {
      setFormError(`Employee ID "${formEmpId}" already exists.`);
      return;
    }

    const isDupUsername = users.some(u => u.id !== editingUser?.id && u.username.toLowerCase() === formUsername.trim().toLowerCase());
    if (isDupUsername) {
      setFormError(`Username "${formUsername}" is already taken.`);
      return;
    }

    const savedUser: AppUser = {
      id: editingUser ? editingUser.id : `usr-custom-${Date.now()}`,
      name: formName.trim(),
      employeeId: formEmpId.trim().toUpperCase(),
      username: formUsername.trim().toLowerCase(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      team: formTeam,
      branch: formBranch,
      status: formStatus,
      permissions: formPermissions,
      designation: formDesignation.trim() || undefined,
      createdAt: editingUser?.createdAt || new Date().toISOString().substring(0, 10)
    };

    await saveUser(savedUser);
    setIsModalOpen(false);
  };

  // Grouped permissions by category for clear UI
  const categories = ['Dashboard & Reports', 'Claims Management', 'Logistics & OEM', 'Finance & Closure', 'Administration'] as const;

  return (
    <div className="user-management-module">
      {/* SUMMARY BANNER */}
      <div className="enterprise-card um-banner-card">
        <div className="um-banner-left">
          <div className="um-icon-badge">
            <Users size={24} />
          </div>
          <div>
            <span className="section-subtitle">ENTERPRISE ACCESS CONTROL & IDENTITY</span>
            <h3 className="card-title">User & Role Rights Management</h3>
            <p className="banner-subtext">
              Managing 155+ active staff across 10 national service branches with granular ISO 9001 process permissions.
            </p>
          </div>
        </div>

        <div className="um-stats-group">
          <div className="um-stat-pill">
            <span className="label">Total Users</span>
            <strong className="val">{metrics.total}</strong>
          </div>
          <div className="um-stat-pill active-stat">
            <span className="label">Active</span>
            <strong className="val">{metrics.active}</strong>
          </div>
          <div className="um-stat-pill inactive-stat">
            <span className="label">Inactive</span>
            <strong className="val">{metrics.inactive}</strong>
          </div>
          <div className="um-stat-pill branch-stat">
            <span className="label">Branches</span>
            <strong className="val">{metrics.branchesCount} / 10</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR CONTROLS */}
      <div className="enterprise-card um-toolbar-card">
        <div className="um-toolbar-grid">
          {/* SEARCH */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Name, Emp ID, Username, Email..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')}>×</button>
            )}
          </div>

          {/* BRANCH FILTER */}
          <div className="filter-select-wrapper">
            <Building2 size={15} className="select-icon" />
            <select
              value={branchFilter}
              onChange={e => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All 10 Branches</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* ROLE FILTER */}
          <div className="filter-select-wrapper">
            <ShieldCheck size={15} className="select-icon" />
            <select
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Roles</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* TEAM FILTER */}
          <div className="filter-select-wrapper">
            <Users size={15} className="select-icon" />
            <select
              value={teamFilter}
              onChange={e => {
                setTeamFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Workflow Teams</option>
              {TEAMS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* STATUS FILTER */}
          <div className="filter-select-wrapper">
            <Filter size={15} className="select-icon" />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* CREATE ACTION */}
          <button 
            type="button" 
            className="primary-btn-action" 
            onClick={handleOpenCreate}
            disabled={!hasPermission('users:manage')}
            title={!hasPermission('users:manage') ? 'Requires users:manage permission' : 'Create new user profile'}
          >
            <UserPlus size={16} />
            <span>+ Add New User</span>
          </button>
        </div>
      </div>

      {/* USER DATA TABLE */}
      <div className="enterprise-card um-table-card">
        <div className="table-responsive-container">
          <table className="enterprise-data-grid">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee / User</th>
                <th>Role</th>
                <th>Workflow Team</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Granted Rights</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-grid-state">
                    No users match current filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => {
                  const isCurrent = currentUser?.id === user.id;
                  const isActive = user.status === 'Active';
                  const team = getUserTeam(user);

                  return (
                    <tr key={user.id} className={!isActive ? 'row-inactive' : ''}>
                      <td>
                        <strong className="code-text">{user.employeeId}</strong>
                        {isCurrent && <span className="current-user-tag">YOU</span>}
                      </td>
                      <td>
                        <div className="user-name-cell">
                          <strong>{user.name}</strong>
                          <span className="user-email-text">{user.email} · @{user.username}</span>
                          {user.designation && <small className="user-designation-text">{user.designation}</small>}
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${user.role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`team-pill team-pill-${team.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                          {team}
                        </span>
                      </td>
                      <td>
                        <div className="branch-cell">
                          <Building2 size={13} className="text-muted" />
                          <span>{user.branch}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${isActive ? 'pill-active' : 'pill-inactive'}`}>
                          {isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="rights-preview-wrap" title={`${user.permissions.length} permissions assigned: ${user.permissions.join(', ')}`}>
                          <Key size={13} className="text-accent" />
                          <span>{user.permissions.length} Rights</span>
                          {user.permissions.length === ALL_PERMISSION_IDS.length && (
                            <span className="full-rights-badge">FULL</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          {/* EDIT USER */}
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Role, Branch & Permissions"
                            disabled={!hasPermission('users:manage')}
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* TOGGLE ACTIVE/INACTIVE */}
                          <button
                            type="button"
                            className={`btn-icon-subtle ${isActive ? 'btn-deactivate' : 'btn-activate'}`}
                            onClick={() => toggleUserStatus(user.id)}
                            title={isActive ? 'Deactivate User Account' : 'Activate User Account'}
                            disabled={!hasPermission('users:manage') || isCurrent}
                          >
                            <Power size={15} />
                          </button>

                          {/* QUICK SWITCH TO USER */}
                          <button
                            type="button"
                            className="btn-icon-subtle btn-switch-user"
                            onClick={() => {
                              const res = loginAsUser(user);
                              if (!res.success) alert(res.error);
                            }}
                            title={`Sign in as ${user.name}`}
                          >
                            <LogIn size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="um-pagination-footer">
          <div className="pagination-info">
            Showing <strong>{filteredUsers.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(page * pageSize, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> users
            {users.length !== filteredUsers.length && ` (filtered from ${users.length} total)`}
          </div>

          <div className="pagination-controls">
            <button
              className="page-nav-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="page-indicator">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              className="page-nav-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="overlay" onClick={() => setIsModalOpen(false)}>
          <div className="enterprise-modal user-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Users size={20} className="modal-icon" />
                <div>
                  <h3>{editingUser ? `Edit User: ${editingUser.name}` : 'Register New Enterprise User'}</h3>
                  <p>Assign corporate role, 10-branch allocation, and granular QMS process permissions</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="modal-body-scrollable">
              {formError && (
                <div className="form-error-banner">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* CORE DETAILS ROW */}
              <div className="form-grid-2col">
                <div className="form-group">
                  <label>Full Employee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TSC-EMP-156"
                    value={formEmpId}
                    onChange={e => setFormEmpId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Username / Login ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh.patel"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh.patel@turelgroup.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Branch Allocation (10 National Branches) *</label>
                  <select
                    value={formBranch}
                    onChange={e => setFormBranch(e.target.value as Branch)}
                  >
                    {BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>System Role *</label>
                  <select
                    value={formRole}
                    onChange={e => handleRoleChange(e.target.value as UserRole)}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Workflow Team *</label>
                  <select
                    value={formTeam}
                    onChange={e => setFormTeam(e.target.value as Team)}
                  >
                    <option value="Service Team">Service Team (Section 1 Only)</option>
                    <option value="Input Team">Input Team (Section 2 Only)</option>
                    <option value="Store Team">Store Team (Section 3 Only)</option>
                    <option value="Management/Admin">Management/Admin (Full Access)</option>
                  </select>
                  <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '3px' }}>
                    Controls Section-level edit permissions per Claim Workflow Advanced Software spec.
                  </small>
                </div>

                <div className="form-group">
                  <label>Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Warranty Specialist"
                    value={formDesignation}
                    onChange={e => setFormDesignation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Account Status *</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'Active' | 'Inactive')}
                  >
                    <option value="Active">Active (Permitted to Log In)</option>
                    <option value="Inactive">Inactive / Suspended (Login Blocked)</option>
                  </select>
                </div>
              </div>

              {/* PERMISSION MATRIX SECTION */}
              <div className="permissions-matrix-section">
                <div className="matrix-header-row">
                  <div>
                    <h4>Granular Process Rights & Permissions ({formPermissions.length} / {ALL_PERMISSION_IDS.length} Granted)</h4>
                    <p>Fine-tune operational access or restore standard role defaults.</p>
                  </div>
                  <div className="matrix-quick-actions">
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => setFormPermissions([...ALL_PERMISSION_IDS])}
                    >
                      Grant All
                    </button>
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => setFormPermissions([...ROLE_DEFAULT_PERMISSIONS[formRole]])}
                    >
                      Reset to {formRole} Defaults
                    </button>
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => setFormPermissions([])}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="permissions-by-category">
                  {categories.map(cat => {
                    const catPerms = PERMISSIONS.filter(p => p.category === cat);
                    if (!catPerms.length) return null;

                    return (
                      <div key={cat} className="permission-category-block">
                        <h5 className="category-title">{cat}</h5>
                        <div className="permission-items-grid">
                          {catPerms.map(p => {
                            const isChecked = formPermissions.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={`perm-checkbox-item ${isChecked ? 'checked' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(p.id)}
                                />
                                <div className="perm-info">
                                  <span className="perm-label">{p.label}</span>
                                  <small className="perm-desc">{p.description}</small>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                >
                  <Check size={16} />
                  <span>{editingUser ? 'Save User Changes' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
