// Turel Service Corporation - Enterprise Identity, RBAC & Permissions Engine
// ISO 9001:2015 Process Control

export const BRANCHES = [
  'Mumbai HO',
  'Delhi / NCR',
  'Bengaluru',
  'Tirupur',
  'Surat',
  'Ahmedabad',
  'Kolkata',
  'Chennai',
  'Ludhiana',
  'Jaipur'
] as const;

export type Branch = typeof BRANCHES[number];

export const ROLES = [
  'Admin/ERP',
  'Branch Manager',
  'Service/Claim User',
  'Finance User',
  'Viewer'
] as const;

export type UserRole = typeof ROLES[number];

export interface PermissionDefinition {
  id: PermissionId;
  label: string;
  category: 'Dashboard & Reports' | 'Claims Management' | 'Logistics & OEM' | 'Finance & Closure' | 'Administration';
  description: string;
}

export const PERMISSIONS: PermissionDefinition[] = [
  {
    id: 'dashboard:view',
    label: 'Dashboard',
    category: 'Dashboard & Reports',
    description: 'View executive dashboard KPIs and process health charts'
  },
  {
    id: 'claim:create',
    label: 'Claim Create',
    category: 'Claims Management',
    description: 'Initiate and register new warranty claims'
  },
  {
    id: 'claim:edit',
    label: 'Claim Edit',
    category: 'Claims Management',
    description: 'Modify claim details, defective parts, and diagnostics'
  },
  {
    id: 'claim:approve',
    label: 'Claim Approval',
    category: 'Claims Management',
    description: 'Execute technical/QA verification and Service Head sign-off'
  },
  {
    id: 'oem:manage',
    label: 'OEM Claim',
    category: 'Logistics & OEM',
    description: 'Submit OEM claims, update OEM outcomes & settlement type'
  },
  {
    id: 'grn:manage',
    label: 'GRN',
    category: 'Logistics & OEM',
    description: 'Confirm damaged part inward GRN and HO/Branch replacement GRN'
  },
  {
    id: 'challan:manage',
    label: 'Challan',
    category: 'Logistics & OEM',
    description: 'Generate customer claim delivery challans'
  },
  {
    id: 'delivery_note:manage',
    label: 'Delivery Note',
    category: 'Logistics & OEM',
    description: 'Issue official delivery notes and customer outward notes'
  },
  {
    id: 'finance:manage',
    label: 'Finance',
    category: 'Finance & Closure',
    description: 'Verify credit notes, clear receivables, and settle local purchase costs'
  },
  {
    id: 'capa:manage',
    label: 'CAPA',
    category: 'Claims Management',
    description: 'Manage ISO 9001 Clause 8.7/10.2 nonconformity & 5-Why root cause actions'
  },
  {
    id: 'ledger:view',
    label: 'Claim Ledger',
    category: 'Claims Management',
    description: 'Inspect complete tamper-evident claim milestone history'
  },
  {
    id: 'documents:manage',
    label: 'Documents',
    category: 'Claims Management',
    description: 'Upload, manage, and inspect claim vault documents & part images'
  },
  {
    id: 'closing_note:create',
    label: 'Closing Note',
    category: 'Finance & Closure',
    description: 'Issue formal claim closing certificate upon 4/4 Gate verification'
  },
  {
    id: 'reports:view',
    label: 'Reports',
    category: 'Dashboard & Reports',
    description: 'Export audit data, SLA breach reports, and OEM scorecards'
  },
  {
    id: 'users:manage',
    label: 'User Management',
    category: 'Administration',
    description: 'Manage 155+ branch users, assign roles, permissions & statuses'
  },
  {
    id: 'settings:manage',
    label: 'Admin/ERP Settings',
    category: 'Administration',
    description: 'Configure SLA working/calendar days parameters and ERP synchronization'
  }
];

export type PermissionId =
  | 'dashboard:view'
  | 'claim:create'
  | 'claim:edit'
  | 'claim:approve'
  | 'oem:manage'
  | 'grn:manage'
  | 'challan:manage'
  | 'delivery_note:manage'
  | 'finance:manage'
  | 'capa:manage'
  | 'ledger:view'
  | 'documents:manage'
  | 'closing_note:create'
  | 'reports:view'
  | 'users:manage'
  | 'settings:manage';

export const ALL_PERMISSION_IDS: PermissionId[] = PERMISSIONS.map(p => p.id);

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionId[]> = {
  'Admin/ERP': [
    'dashboard:view',
    'claim:create',
    'claim:edit',
    'claim:approve',
    'oem:manage',
    'grn:manage',
    'challan:manage',
    'delivery_note:manage',
    'finance:manage',
    'capa:manage',
    'ledger:view',
    'documents:manage',
    'closing_note:create',
    'reports:view',
    'users:manage',
    'settings:manage'
  ],
  'Branch Manager': [
    'dashboard:view',
    'claim:create',
    'claim:edit',
    'claim:approve',
    'oem:manage',
    'grn:manage',
    'challan:manage',
    'delivery_note:manage',
    'capa:manage',
    'ledger:view',
    'documents:manage',
    'closing_note:create',
    'reports:view'
  ],
  'Service/Claim User': [
    'dashboard:view',
    'claim:create',
    'claim:edit',
    'oem:manage',
    'grn:manage',
    'challan:manage',
    'delivery_note:manage',
    'capa:manage',
    'ledger:view',
    'documents:manage'
  ],
  'Finance User': [
    'dashboard:view',
    'finance:manage',
    'ledger:view',
    'documents:manage',
    'closing_note:create',
    'reports:view'
  ],
  'Viewer': [
    'dashboard:view',
    'ledger:view',
    'reports:view'
  ]
};

export const TEAMS = [
  'Service Team',
  'Input Team',
  'Store Team',
  'Management/Admin'
] as const;

export type Team = typeof TEAMS[number];

export interface AppUser {
  id: string;
  employeeId: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  branch: Branch;
  status: 'Active' | 'Inactive';
  permissions: PermissionId[];
  team?: Team;
  designation?: string;
  createdAt?: string;
}

export function getUserTeam(user: AppUser | null | undefined): Team {
  if (!user) return 'Service Team';
  if (user.team) return user.team;
  if (user.role === 'Admin/ERP' || user.role === 'Branch Manager') return 'Management/Admin';
  if (user.role === 'Finance User') return 'Input Team';
  if (user.role === 'Viewer') return 'Management/Admin';
  const des = (user.designation || '').toLowerCase();
  if (des.includes('store') || des.includes('warehouse') || des.includes('logistics') || des.includes('inventory')) {
    return 'Store Team';
  }
  if (des.includes('input') || des.includes('commercial') || des.includes('invoic') || des.includes('data entry')) {
    return 'Input Team';
  }
  return 'Service Team';
}

export function canEditServiceSection(user: AppUser | null | undefined): boolean {
  if (!user || user.status === 'Inactive') return false;
  // Must have base claim editing or creation permission
  const hasBase = user.permissions.includes('claim:edit') || user.permissions.includes('claim:create');
  if (!hasBase) return false;
  const team = getUserTeam(user);
  return team === 'Service Team' || team === 'Management/Admin' || user.role === 'Admin/ERP';
}

export function canEditInputSection(user: AppUser | null | undefined): boolean {
  if (!user || user.status === 'Inactive') return false;
  // Must have claim edit or finance permissions
  const hasBase = user.permissions.includes('claim:edit') || user.permissions.includes('finance:manage');
  if (!hasBase) return false;
  const team = getUserTeam(user);
  return team === 'Input Team' || team === 'Management/Admin' || user.role === 'Admin/ERP';
}

export function canEditStoreSection(user: AppUser | null | undefined): boolean {
  if (!user || user.status === 'Inactive') return false;
  // Must have logistics/GRN/challan or claim edit permissions
  const hasBase = user.permissions.includes('grn:manage') || 
                  user.permissions.includes('challan:manage') || 
                  user.permissions.includes('delivery_note:manage') || 
                  user.permissions.includes('claim:edit');
  if (!hasBase) return false;
  const team = getUserTeam(user);
  return team === 'Store Team' || team === 'Management/Admin' || user.role === 'Admin/ERP';
}

// Default master administrator
export const DEFAULT_ADMIN_USER: AppUser = {
  id: 'usr-admin-001',
  employeeId: 'TSC-EMP-001',
  name: 'Swapnil Mote (Service Head)',
  username: 'admin',
  email: 'swapnil.mote@turelgroup.com',
  role: 'Admin/ERP',
  branch: 'Mumbai HO',
  status: 'Active',
  team: 'Management/Admin',
  permissions: [...ALL_PERMISSION_IDS],
  designation: 'Service Head & QMS Operations Lead',
  createdAt: '2025-01-01'
};

// Deterministically generate 155+ realistic users across 10 branches
export function generateInitialUsers(): AppUser[] {
  const users: AppUser[] = [DEFAULT_ADMIN_USER];

  // Distribution across 10 branches total ~158 users
  const branchConfigs: { branch: Branch; count: number; prefix: string }[] = [
    { branch: 'Mumbai HO', count: 24, prefix: 'MUM' },
    { branch: 'Delhi / NCR', count: 22, prefix: 'DEL' },
    { branch: 'Bengaluru', count: 18, prefix: 'BLR' },
    { branch: 'Tirupur', count: 16, prefix: 'TPR' },
    { branch: 'Surat', count: 15, prefix: 'SUR' },
    { branch: 'Ahmedabad', count: 15, prefix: 'AHM' },
    { branch: 'Kolkata', count: 14, prefix: 'KOL' },
    { branch: 'Chennai', count: 13, prefix: 'CHN' },
    { branch: 'Ludhiana', count: 12, prefix: 'LDH' },
    { branch: 'Jaipur', count: 10, prefix: 'JPR' }
  ];

  const firstNames = [
    'Rajesh', 'Suresh', 'Amit', 'Sunita', 'Pooja', 'Vikram', 'Ramesh', 'Deepak',
    'Priya', 'Kavita', 'Sanjay', 'Rahul', 'Manoj', 'Anil', 'Naveen', 'Arun',
    'Neha', 'Sachin', 'Sneha', 'Vivek', 'Manish', 'Alok', 'Dinesh', 'Kiran',
    'Gaurav', 'Ritu', 'Pradeep', 'Shweta', 'Harish', 'Rohit', 'Ashok', 'Meena'
  ];

  const lastNames = [
    'Patel', 'Sharma', 'Verma', 'Gupta', 'Singh', 'Rao', 'Nair', 'Joshi',
    'Mehta', 'Shah', 'Choudhary', 'Deshmukh', 'Kulkarni', 'Bose', 'Mukherjee',
    'Reddy', 'Pillai', 'Yadav', 'Malhotra', 'Bhatia', 'Agarwal', 'Menon'
  ];

  let empCounter = 2;

  branchConfigs.forEach(({ branch, count, prefix }) => {
    for (let i = 1; i <= count; i++) {
      const fn = firstNames[(empCounter * 7 + i) % firstNames.length];
      const ln = lastNames[(empCounter * 11 + i) % lastNames.length];
      const fullName = `${fn} ${ln}`;
      const username = `${fn.toLowerCase()}.${ln.toLowerCase().slice(0, 3)}${empCounter}`;
      const empId = `TSC-EMP-${String(empCounter).padStart(3, '0')}`;

      // Assign realistic role breakdown and team per branch:
      // i = 1 is Branch Manager -> Management/Admin
      // i = 2 is Finance User -> Input Team
      // remaining distributed across Service Team, Input Team, Store Team
      let role: UserRole = 'Service/Claim User';
      let designation = 'Service Engineer';
      let team: Team = 'Service Team';

      if (i === 1) {
        role = 'Branch Manager';
        designation = `Branch Operations Manager (${branch})`;
        team = 'Management/Admin';
      } else if (i === 2) {
        role = 'Finance User';
        designation = 'Accounts & Commercial Invoicing Officer';
        team = 'Input Team';
      } else if (i === count) {
        role = 'Viewer';
        designation = 'Internal Quality Auditor';
        team = 'Management/Admin';
      } else if (branch === 'Mumbai HO' && i === 3) {
        role = 'Admin/ERP';
        designation = 'ERP System Administrator';
        team = 'Management/Admin';
      } else if (i % 4 === 0) {
        role = 'Service/Claim User';
        designation = 'Central Stores & Logistics Officer';
        team = 'Store Team';
      } else if (i % 3 === 0) {
        role = 'Service/Claim User';
        designation = 'Commercial Invoicing & Data Executive';
        team = 'Input Team';
      } else if (i % 5 === 0) {
        role = 'Service/Claim User';
        designation = 'Senior Technical Service Specialist';
        team = 'Service Team';
      } else {
        role = 'Service/Claim User';
        designation = 'Claim & Service Executive';
        team = 'Service Team';
      }

      // Deactivate ~7 users to test inactive account controls
      const isInactive = empCounter === 25 || empCounter === 52 || empCounter === 88 || empCounter === 114 || empCounter === 139;

      users.push({
        id: `usr-${prefix.toLowerCase()}-${String(i).padStart(3, '0')}`,
        employeeId: empId,
        name: fullName,
        username,
        email: `${username}@turelgroup.com`,
        role,
        branch,
        status: isInactive ? 'Inactive' : 'Active',
        team,
        permissions: [...ROLE_DEFAULT_PERMISSIONS[role]],
        designation,
        createdAt: '2025-02-15'
      });

      empCounter++;
    }
  });

  return users;
}
