import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { AppUser, PermissionId, DEFAULT_ADMIN_USER, ROLE_DEFAULT_PERMISSIONS, UserRole } from './auth';
import { Repository } from './repository';

interface AuthContextValue {
  currentUser: AppUser;
  users: AppUser[];
  isLoading: boolean;
  login: (identifier: string, roleMode?: 'user' | 'admin') => Promise<{ success: boolean; error?: string }>;
  loginAsUser: (user: AppUser) => { success: boolean; error?: string };
  logout: () => void;
  hasPermission: (permission: PermissionId) => boolean;
  hasAnyPermission: (permissions: PermissionId[]) => boolean;
  canAccessTab: (tabName: string) => boolean;
  saveUser: (user: AppUser) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  repo: Repository;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  repo: Repository;
}

export function AuthProvider({ children, repo }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AppUser>(DEFAULT_ADMIN_USER);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load users and current active session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const userList = await repo.getUsers();
        const activeUser = await repo.getCurrentUser();
        if (mounted) {
          setUsers(userList);
          setCurrentUser(activeUser);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize auth state', err);
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [repo]);

  const refreshUsers = async () => {
    const list = await repo.getUsers();
    setUsers(list);
    const refreshedCurrent = list.find(u => u.id === currentUser.id);
    if (refreshedCurrent) {
      setCurrentUser(refreshedCurrent);
      await repo.setCurrentUser(refreshedCurrent);
    }
  };

  const login = async (identifier: string, roleMode?: 'user' | 'admin'): Promise<{ success: boolean; error?: string }> => {
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: 'Please enter a valid Username, Employee ID, or Email.' };
    }

    const matchedUser = await repo.getUserById(trimmed);
    if (!matchedUser) {
      return { success: false, error: `No user found matching "${identifier}".` };
    }

    if (matchedUser.status === 'Inactive') {
      return {
        success: false,
        error: `Account for ${matchedUser.name} (${matchedUser.employeeId}) is currently Inactive / Deactivated. Contact your ERP Administrator.`
      };
    }

    if (roleMode === 'admin' && matchedUser.role !== 'Admin/ERP') {
      return {
        success: false,
        error: `User "${matchedUser.name}" does not possess Admin/ERP system rights.`
      };
    }

    setCurrentUser(matchedUser);
    await repo.setCurrentUser(matchedUser);
    return { success: true };
  };

  const loginAsUser = (targetUser: AppUser): { success: boolean; error?: string } => {
    if (targetUser.status === 'Inactive') {
      return {
        success: false,
        error: `Cannot switch to ${targetUser.name} (${targetUser.employeeId}): Account is currently Inactive / Deactivated.`
      };
    }
    setCurrentUser(targetUser);
    repo.setCurrentUser(targetUser);
    return { success: true };
  };

  const logout = () => {
    // Revert to demo viewer or default admin
    const defaultViewer = users.find(u => u.role === 'Viewer' && u.status === 'Active') || DEFAULT_ADMIN_USER;
    setCurrentUser(defaultViewer);
    repo.setCurrentUser(defaultViewer);
  };

  // Centralized Permission Checker
  const hasPermission = (permission: PermissionId): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin/ERP') return true; // Superuser bypass
    return currentUser.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: PermissionId[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin/ERP') return true;
    return permissions.some(p => currentUser.permissions.includes(p));
  };

  // Route / Tab Authorization
  const canAccessTab = (tabName: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin/ERP') return true;

    switch (tabName) {
      case 'Dashboard':
        return hasPermission('dashboard:view');
      case 'Claim Register':
      case 'Claims':
        return hasAnyPermission(['claim:create', 'claim:edit', 'ledger:view', 'dashboard:view']);
      case 'Create Claim':
        return hasPermission('claim:create');
      case 'CAPA':
        return hasPermission('capa:manage');
      case 'OEM Performance':
        return hasAnyPermission(['oem:manage', 'reports:view']);
      case 'Reports':
        return hasPermission('reports:view');
      case 'Configuration':
      case 'SLA / Settings':
        return hasPermission('settings:manage');
      case 'User Management':
        return hasPermission('users:manage');
      case 'ERP / Admin':
      case 'Administration':
        return hasAnyPermission(['settings:manage', 'users:manage']);
      default:
        return true;
    }
  };

  const saveUser = async (userToSave: AppUser) => {
    await repo.saveUser(userToSave);
    await refreshUsers();
  };

  const toggleUserStatus = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const updated: AppUser = {
      ...target,
      status: target.status === 'Active' ? 'Inactive' : 'Active'
    };
    await repo.saveUser(updated);
    await refreshUsers();
  };

  const deleteUser = async (userId: string) => {
    await repo.deleteUser(userId);
    await refreshUsers();
  };

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    users,
    isLoading,
    login,
    loginAsUser,
    logout,
    hasPermission,
    hasAnyPermission,
    canAccessTab,
    saveUser,
    toggleUserStatus,
    deleteUser,
    refreshUsers,
    repo
  }), [currentUser, users, isLoading, repo]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
