import { describe, it, expect, beforeEach } from 'vitest';
import { 
  BRANCHES, 
  ROLES, 
  PERMISSIONS, 
  ALL_PERMISSION_IDS, 
  ROLE_DEFAULT_PERMISSIONS, 
  DEFAULT_ADMIN_USER, 
  generateInitialUsers, 
  AppUser 
} from '../src/auth';
import { MockRepository } from '../src/repository';

describe('TSC Enterprise Identity & RBAC Subsystem', () => {
  let repo: MockRepository;

  beforeEach(async () => {
    // Clear storage before each test
    localStorage.clear();
    repo = new MockRepository();
  });

  describe('1. 10 National Branches & Role Architecture', () => {
    it('defines exactly the 10 national service branches', () => {
      expect(BRANCHES.length).toBe(10);
      expect(BRANCHES).toContain('Mumbai HO');
      expect(BRANCHES).toContain('Delhi / NCR');
      expect(BRANCHES).toContain('Bengaluru');
      expect(BRANCHES).toContain('Tirupur');
      expect(BRANCHES).toContain('Surat');
      expect(BRANCHES).toContain('Ahmedabad');
      expect(BRANCHES).toContain('Kolkata');
      expect(BRANCHES).toContain('Chennai');
      expect(BRANCHES).toContain('Ludhiana');
      expect(BRANCHES).toContain('Jaipur');
    });

    it('defines the 5 enterprise user roles', () => {
      expect(ROLES.length).toBe(5);
      expect(ROLES).toContain('Admin/ERP');
      expect(ROLES).toContain('Branch Manager');
      expect(ROLES).toContain('Service/Claim User');
      expect(ROLES).toContain('Finance User');
      expect(ROLES).toContain('Viewer');
    });

    it('defines all 16 granular process permissions', () => {
      expect(PERMISSIONS.length).toBe(16);
      expect(ALL_PERMISSION_IDS).toContain('dashboard:view');
      expect(ALL_PERMISSION_IDS).toContain('claim:create');
      expect(ALL_PERMISSION_IDS).toContain('claim:edit');
      expect(ALL_PERMISSION_IDS).toContain('claim:approve');
      expect(ALL_PERMISSION_IDS).toContain('oem:manage');
      expect(ALL_PERMISSION_IDS).toContain('grn:manage');
      expect(ALL_PERMISSION_IDS).toContain('challan:manage');
      expect(ALL_PERMISSION_IDS).toContain('delivery_note:manage');
      expect(ALL_PERMISSION_IDS).toContain('finance:manage');
      expect(ALL_PERMISSION_IDS).toContain('capa:manage');
      expect(ALL_PERMISSION_IDS).toContain('ledger:view');
      expect(ALL_PERMISSION_IDS).toContain('documents:manage');
      expect(ALL_PERMISSION_IDS).toContain('closing_note:create');
      expect(ALL_PERMISSION_IDS).toContain('reports:view');
      expect(ALL_PERMISSION_IDS).toContain('users:manage');
      expect(ALL_PERMISSION_IDS).toContain('settings:manage');
    });

    it('assigns all 16 permissions to Admin/ERP role', () => {
      expect(ROLE_DEFAULT_PERMISSIONS['Admin/ERP'].length).toBe(16);
      expect(ROLE_DEFAULT_PERMISSIONS['Admin/ERP']).toEqual(ALL_PERMISSION_IDS);
    });

    it('restricts Viewer role strictly to read-only rights', () => {
      const viewerPerms = ROLE_DEFAULT_PERMISSIONS['Viewer'];
      expect(viewerPerms).toContain('dashboard:view');
      expect(viewerPerms).toContain('ledger:view');
      expect(viewerPerms).toContain('reports:view');
      expect(viewerPerms).not.toContain('claim:create');
      expect(viewerPerms).not.toContain('claim:edit');
      expect(viewerPerms).not.toContain('closing_note:create');
      expect(viewerPerms).not.toContain('users:manage');
      expect(viewerPerms).not.toContain('settings:manage');
    });

    it('restricts Service/Claim User from finance and closing note issuance', () => {
      const servicePerms = ROLE_DEFAULT_PERMISSIONS['Service/Claim User'];
      expect(servicePerms).toContain('claim:create');
      expect(servicePerms).toContain('claim:edit');
      expect(servicePerms).toContain('oem:manage');
      expect(servicePerms).toContain('grn:manage');
      expect(servicePerms).not.toContain('finance:manage');
      expect(servicePerms).not.toContain('closing_note:create');
      expect(servicePerms).not.toContain('users:manage');
    });

    it('grants Finance User finance clearance and closing note rights', () => {
      const financePerms = ROLE_DEFAULT_PERMISSIONS['Finance User'];
      expect(financePerms).toContain('finance:manage');
      expect(financePerms).toContain('closing_note:create');
      expect(financePerms).not.toContain('claim:create');
      expect(financePerms).not.toContain('oem:manage');
    });
  });

  describe('2. Dynamic 155+ User Directory Generation', () => {
    it('generates 155+ realistic users across all 10 branches', () => {
      const users = generateInitialUsers();
      expect(users.length).toBeGreaterThanOrEqual(155);

      // Verify every branch is represented
      BRANCHES.forEach(branch => {
        const branchUsers = users.filter(u => u.branch === branch);
        expect(branchUsers.length).toBeGreaterThan(0);
      });
    });

    it('contains valid employee IDs, names, emails, roles, and statuses for all users', () => {
      const users = generateInitialUsers();
      users.forEach(u => {
        expect(u.id).toBeTruthy();
        expect(u.employeeId).toMatch(/^TSC-EMP-\d{3,}$/);
        expect(u.name.trim().length).toBeGreaterThan(2);
        expect(u.username.trim().length).toBeGreaterThan(2);
        expect(u.email).toContain('@turelgroup.com');
        expect(ROLES).toContain(u.role);
        expect(BRANCHES).toContain(u.branch);
        expect(['Active', 'Inactive']).toContain(u.status);
        expect(Array.isArray(u.permissions)).toBe(true);
      });
    });

    it('sets user 1 as master admin Swapnil Mote with full permissions', () => {
      const users = generateInitialUsers();
      const admin = users[0];
      expect(admin.employeeId).toBe('TSC-EMP-001');
      expect(admin.role).toBe('Admin/ERP');
      expect(admin.branch).toBe('Mumbai HO');
      expect(admin.status).toBe('Active');
      expect(admin.permissions.length).toBe(16);
    });

    it('includes inactive users to verify deactivated account handling', () => {
      const users = generateInitialUsers();
      const inactiveUsers = users.filter(u => u.status === 'Inactive');
      expect(inactiveUsers.length).toBeGreaterThan(0);
    });
  });

  describe('3. Repository User Methods & Dynamic Persistence', () => {
    it('loads initial users and persists to storage', async () => {
      const users = await repo.getUsers();
      expect(users.length).toBeGreaterThanOrEqual(155);

      const stored = JSON.parse(localStorage.getItem('tsc.users') || '[]');
      expect(stored.length).toBe(users.length);
    });

    it('retrieves user by id, employeeId, username, or email case-insensitively', async () => {
      const user = await repo.getUserById('tsc-emp-001');
      expect(user).not.toBeNull();
      expect(user?.name).toContain('Swapnil');

      const byUsername = await repo.getUserById('admin');
      expect(byUsername?.id).toBe(user?.id);

      const byEmail = await repo.getUserById('swapnil.mote@turelgroup.com');
      expect(byEmail?.id).toBe(user?.id);
    });

    it('adds a new user dynamically, increasing count beyond initial 155+', async () => {
      const initialUsers = await repo.getUsers();
      const initialCount = initialUsers.length;

      const newUser: AppUser = {
        id: 'usr-test-999',
        employeeId: 'TSC-EMP-999',
        name: 'Kavita Deshmukh',
        username: 'kavita.deshmukh',
        email: 'kavita.deshmukh@turelgroup.com',
        role: 'Branch Manager',
        branch: 'Surat',
        status: 'Active',
        permissions: [...ROLE_DEFAULT_PERMISSIONS['Branch Manager']],
        designation: 'Pune Branch Operations Head'
      };

      await repo.saveUser(newUser);

      const updatedUsers = await repo.getUsers();
      expect(updatedUsers.length).toBe(initialCount + 1);

      const retrieved = await repo.getUserById('TSC-EMP-999');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Kavita Deshmukh');
      expect(retrieved?.role).toBe('Branch Manager');
    });

    it('updates user role, branch, and status (activate/deactivate)', async () => {
      const user = await repo.getUserById('TSC-EMP-001');
      expect(user).not.toBeNull();

      const updatedUser: AppUser = {
        ...user!,
        status: 'Inactive',
        branch: 'Delhi / NCR'
      };

      await repo.saveUser(updatedUser);

      const retrieved = await repo.getUserById('TSC-EMP-001');
      expect(retrieved?.status).toBe('Inactive');
      expect(retrieved?.branch).toBe('Delhi / NCR');
    });

    it('clears user data and resets back to clean state on repo.reset()', async () => {
      await repo.getUsers();
      expect(localStorage.getItem('tsc.users')).not.toBeNull();

      await repo.reset();
      expect(localStorage.getItem('tsc.users')).toBeNull();
    });
  });
});
