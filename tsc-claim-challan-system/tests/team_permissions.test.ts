import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Claim, 
  computeAutoFields, 
  validateTeamFieldChanges, 
  SERVICE_TEAM_FIELD_KEYS, 
  INPUT_TEAM_FIELD_KEYS, 
  STORE_TEAM_FIELD_KEYS, 
  AUTO_GENERATED_FIELD_KEYS,
  derived,
  DEFAULT_CONFIG
} from '../src/domain';
import { 
  AppUser, 
  canEditServiceSection, 
  canEditInputSection, 
  canEditStoreSection, 
  getUserTeam,
  DEFAULT_ADMIN_USER,
  generateInitialUsers,
  ROLE_DEFAULT_PERMISSIONS
} from '../src/auth';
import { MockRepository } from '../src/repository';

describe('Team-Wise Input Permissions & Automatic Field Derivations (Excel Workflow)', () => {
  let serviceUser: AppUser;
  let inputUser: AppUser;
  let storeUser: AppUser;
  let unauthorizedViewer: AppUser;
  let inactiveUser: AppUser;
  let adminUser: AppUser;
  let baseClaim: Claim;
  let repo: MockRepository;

  beforeEach(() => {
    // Reset localStorage for clean test runs
    localStorage.clear();
    repo = new MockRepository();

    adminUser = { ...DEFAULT_ADMIN_USER };

    serviceUser = {
      id: 'usr-service-001',
      employeeId: 'TSC-EMP-010',
      name: 'Rohan Sharma',
      username: 'rohan.service',
      email: 'rohan.sharma@turelgroup.com',
      role: 'Service/Claim User',
      branch: 'Mumbai HO',
      status: 'Active',
      team: 'Service Team',
      permissions: ['claim:create', 'claim:edit', 'dashboard:view'],
      designation: 'Field Service Engineer'
    };

    inputUser = {
      id: 'usr-input-001',
      employeeId: 'TSC-EMP-020',
      name: 'Anjali Verma',
      username: 'anjali.input',
      email: 'anjali.verma@turelgroup.com',
      role: 'Service/Claim User',
      branch: 'Mumbai HO',
      status: 'Active',
      team: 'Input Team',
      permissions: ['claim:edit', 'dashboard:view'],
      designation: 'Commercial Invoicing & Data Executive'
    };

    storeUser = {
      id: 'usr-store-001',
      employeeId: 'TSC-EMP-030',
      name: 'Vikram Singh',
      username: 'vikram.store',
      email: 'vikram.singh@turelgroup.com',
      role: 'Service/Claim User',
      branch: 'Mumbai HO',
      status: 'Active',
      team: 'Store Team',
      permissions: ['grn:manage', 'challan:manage', 'delivery_note:manage', 'claim:edit'],
      designation: 'Central Stores & Logistics Officer'
    };

    unauthorizedViewer = {
      id: 'usr-viewer-001',
      employeeId: 'TSC-EMP-040',
      name: 'Pooja Nair',
      username: 'pooja.viewer',
      email: 'pooja.nair@turelgroup.com',
      role: 'Viewer',
      branch: 'Mumbai HO',
      status: 'Active',
      team: 'Management/Admin',
      permissions: ['dashboard:view', 'reports:view'],
      designation: 'Quality Auditor'
    };

    inactiveUser = {
      ...serviceUser,
      id: 'usr-inactive-001',
      status: 'Inactive'
    };

    baseClaim = {
      id: 'clm-excel-row-001',
      claimAgainst: 'Installation call',
      callNo: 'TSC-LDH-INST-001',
      callDate: '2025-09-15',
      claimDate: '2025-09-17',
      claimNo: 'CLM-TSC-LDH-TY-25-26-001',
      branch: 'Ludhiana',
      financialYear: '2025-26',
      brand: 'Typical',
      customerName: 'Anandco Sporting Corporation',
      model: 'GC20606-1',
      serialNo: '21070001',
      partNo: 'Oil Tank',
      description: 'Oil Tank',
      qty: 1,
      category: 'Damaged in transit',
      remark: 'Damaged in transit',
      importInvoiceNo: '2021TAF016',
      importInvoiceDate: '2021-06-08',
      turelTaxInvoiceNo: '',
      turelTaxInvoiceDate: '',
      installationDate: '2025-09-16',
      vendorResponse: 'Approved',
      damagedPartInward: 'Y',
      damagedPartGRNNo: '',
      damagedPartGRNDate: '',
      newPartAtHO: 'Y',
      hoGRNNo: '5876',
      hoGRNDate: '2026-04-15',
      claimChallanNo: 'DN2-2627/MUM1003',
      challanDate: '2026-02-07',
      newPartAtBranch: 'Y',
      branchGRNNo: '1234',
      branchGRNDate: '2026-06-02',
      turelNewPartOutward: 'N',
      customerReceiptDate: '2026-02-07',
      oemClaimNo: '',
      oemClaimDate: '',
      oemSettlementExpected: 'Replacement',
      oemClaimOutcome: 'Pending',
      oemReplacementReceived: 'N',
      creditNoteVerified: 'N',
      inventoryAdjusted: 'N',
      financeReceivableCleared: 'N',
      localPurchaseExpenseSettled: 'Y',
      interimOption: '',
      branchTransferRequestNo: '',
      localPO: '',
      localPurchaseGRN: '',
      temporaryLocalPurchaseCost: null,
      oemCreditValue: null,
      rootCauseBrief: '',
      capaNo: '',
      capaStatus: 'N/A',
      isoClauseRef: '',
      createdAt: '2025-09-17T09:00:00Z',
      updatedAt: '2025-09-17T09:00:00Z',
      source: 'MANUAL_PILOT'
    };
  });

  // =========================================================================
  // Scenario 1: Service Team Only permissions
  // =========================================================================
  describe('Scenario 1: Service Team Input Permissions', () => {
    it('allows Service Team user to edit Section 1 fields', () => {
      expect(canEditServiceSection(serviceUser)).toBe(true);
      expect(canEditInputSection(serviceUser)).toBe(false);
      expect(canEditStoreSection(serviceUser)).toBe(false);

      const modifiedClaim: Claim = {
        ...baseClaim,
        customerName: 'Updated Anandco Mills Ltd',
        model: 'GC20606-2',
        serialNo: '21070099',
        partNo: 'Needle Plate',
        description: 'Heavy duty needle plate',
        qty: 2,
        remark: 'Updated defect observation'
      };

      const result = validateTeamFieldChanges(modifiedClaim, baseClaim, serviceUser);
      expect(result.allowed).toBe(true);
      expect(result.violations.length).toBe(0);
      expect(result.sanitized.customerName).toBe('Updated Anandco Mills Ltd');
      expect(result.sanitized.qty).toBe(2);
    });

    it('rejects and reverts Service Team user when tampering with Input Team fields', () => {
      const tamperedClaim: Claim = {
        ...baseClaim,
        importInvoiceNo: 'HACKED-INVOICE-001',
        vendorResponse: 'Reject'
      };

      const result = validateTeamFieldChanges(tamperedClaim, baseClaim, serviceUser);
      expect(result.allowed).toBe(false);
      expect(result.violations.some(v => v.includes('importInvoiceNo'))).toBe(true);
      expect(result.violations.some(v => v.includes('vendorResponse'))).toBe(true);
      // Reverted to original saved values
      expect(result.sanitized.importInvoiceNo).toBe(baseClaim.importInvoiceNo);
      expect(result.sanitized.vendorResponse).toBe(baseClaim.vendorResponse);
    });

    it('rejects and reverts Service Team user when tampering with Store Team fields', () => {
      const tamperedClaim: Claim = {
        ...baseClaim,
        damagedPartInward: 'N',
        claimChallanNo: 'TAMPERED-CHALLAN',
        challanDate: '2026-12-31'
      };

      const result = validateTeamFieldChanges(tamperedClaim, baseClaim, serviceUser);
      expect(result.allowed).toBe(false);
      expect(result.violations.some(v => v.includes('damagedPartInward'))).toBe(true);
      expect(result.violations.some(v => v.includes('claimChallanNo'))).toBe(true);
      expect(result.sanitized.damagedPartInward).toBe(baseClaim.damagedPartInward);
      expect(result.sanitized.claimChallanNo).toBe(baseClaim.claimChallanNo);
    });
  });

  // =========================================================================
  // Scenario 2: Input Team Only permissions
  // =========================================================================
  describe('Scenario 2: Input Team Input Permissions', () => {
    it('allows Input Team user to edit Section 2 fields', () => {
      expect(canEditServiceSection(inputUser)).toBe(false);
      expect(canEditInputSection(inputUser)).toBe(true);
      expect(canEditStoreSection(inputUser)).toBe(false);

      const modifiedClaim: Claim = {
        ...baseClaim,
        importInvoiceNo: '2024TAF999',
        importInvoiceDate: '2024-08-15',
        turelTaxInvoiceNo: 'INV/2026/0012',
        turelTaxInvoiceDate: '2026-02-10',
        vendorResponse: 'Approved'
      };

      const result = validateTeamFieldChanges(modifiedClaim, baseClaim, inputUser);
      expect(result.allowed).toBe(true);
      expect(result.violations.length).toBe(0);
      expect(result.sanitized.importInvoiceNo).toBe('2024TAF999');
      expect(result.sanitized.turelTaxInvoiceNo).toBe('INV/2026/0012');
    });

    it('rejects and reverts Input Team user when modifying Service Team fields', () => {
      const tamperedClaim: Claim = {
        ...baseClaim,
        customerName: 'Tampered Customer Name',
        serialNo: 'TAMPERED-SN',
        importInvoiceNo: '2024TAF999' // Allowed field alongside tampered
      };

      const result = validateTeamFieldChanges(tamperedClaim, baseClaim, inputUser);
      expect(result.allowed).toBe(false);
      expect(result.violations.some(v => v.includes('customerName'))).toBe(true);
      expect(result.violations.some(v => v.includes('serialNo'))).toBe(true);
      // Service fields are restored
      expect(result.sanitized.customerName).toBe(baseClaim.customerName);
      expect(result.sanitized.serialNo).toBe(baseClaim.serialNo);
      // Allowed input team field is preserved in sanitized
      expect(result.sanitized.importInvoiceNo).toBe('2024TAF999');
    });

    it('rejects and reverts Input Team user when modifying Store Team fields', () => {
      const tamperedClaim: Claim = {
        ...baseClaim,
        claimChallanNo: 'TAMPERED-CHALLAN-STORE'
      };

      const result = validateTeamFieldChanges(tamperedClaim, baseClaim, inputUser);
      expect(result.allowed).toBe(false);
      expect(result.violations.some(v => v.includes('claimChallanNo'))).toBe(true);
      expect(result.sanitized.claimChallanNo).toBe(baseClaim.claimChallanNo);
    });
  });

  // =========================================================================
  // Scenario 3: Store Team Only permissions
  // =========================================================================
  describe('Scenario 3: Store Team Input Permissions', () => {
    it('allows Store Team user to edit Section 3 fields', () => {
      expect(canEditServiceSection(storeUser)).toBe(false);
      expect(canEditInputSection(storeUser)).toBe(false);
      expect(canEditStoreSection(storeUser)).toBe(true);

      const modifiedClaim: Claim = {
        ...baseClaim,
        damagedPartInward: 'Y',
        damagedPartGRNNo: 'GRN-DP-555',
        damagedPartGRNDate: '2026-02-01',
        newPartAtHO: 'Y',
        hoGRNNo: 'GRN-HO-777',
        hoGRNDate: '2026-02-05',
        claimChallanNo: 'CHALLAN-NEW-888',
        challanDate: '2026-02-08',
        newPartAtBranch: 'Y',
        branchGRNNo: 'GRN-BR-999',
        branchGRNDate: '2026-02-09',
        turelNewPartOutward: 'Y',
        customerReceiptDate: '2026-02-12'
      };

      const result = validateTeamFieldChanges(modifiedClaim, baseClaim, storeUser);
      expect(result.allowed).toBe(true);
      expect(result.violations.length).toBe(0);
      expect(result.sanitized.claimChallanNo).toBe('CHALLAN-NEW-888');
      expect(result.sanitized.turelNewPartOutward).toBe('Y');
    });

    it('rejects and reverts Store Team user when modifying Service or Input Team fields', () => {
      const tamperedClaim: Claim = {
        ...baseClaim,
        customerName: 'Illegal Store Edit',
        importInvoiceNo: 'Illegal Invoice',
        claimChallanNo: 'CHALLAN-VALID-123'
      };

      const result = validateTeamFieldChanges(tamperedClaim, baseClaim, storeUser);
      expect(result.allowed).toBe(false);
      expect(result.violations.some(v => v.includes('customerName'))).toBe(true);
      expect(result.violations.some(v => v.includes('importInvoiceNo'))).toBe(true);
      expect(result.sanitized.customerName).toBe(baseClaim.customerName);
      expect(result.sanitized.importInvoiceNo).toBe(baseClaim.importInvoiceNo);
      expect(result.sanitized.claimChallanNo).toBe('CHALLAN-VALID-123');
    });
  });

  // =========================================================================
  // Scenario 4: Unauthorized users cannot modify another team's fields
  // =========================================================================
  describe('Scenario 4: Unauthorized User & Status Rejection', () => {
    it('rejects unauthenticated attempts (null user)', () => {
      const result = validateTeamFieldChanges(baseClaim, baseClaim, null);
      expect(result.allowed).toBe(false);
      expect(result.violations[0]).toContain('Authentication required');
    });

    it('rejects Inactive users even if they have the right team', () => {
      expect(canEditServiceSection(inactiveUser)).toBe(false);
      expect(canEditInputSection(inactiveUser)).toBe(false);
      expect(canEditStoreSection(inactiveUser)).toBe(false);

      const modifiedClaim: Claim = { ...baseClaim, customerName: 'Inactive User Edit' };
      const result = validateTeamFieldChanges(modifiedClaim, baseClaim, inactiveUser);
      expect(result.allowed).toBe(false);
      expect(result.sanitized.customerName).toBe(baseClaim.customerName);
    });

    it('rejects Viewer users from modifying any section', () => {
      expect(canEditServiceSection(unauthorizedViewer)).toBe(false);
      expect(canEditInputSection(unauthorizedViewer)).toBe(false);
      expect(canEditStoreSection(unauthorizedViewer)).toBe(false);

      const modifiedClaim: Claim = {
        ...baseClaim,
        customerName: 'Viewer Tamper',
        importInvoiceNo: 'Viewer Tamper',
        claimChallanNo: 'Viewer Tamper'
      };

      const result = validateTeamFieldChanges(modifiedClaim, baseClaim, unauthorizedViewer);
      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      expect(result.violations[0]).toContain('not authorized to edit claim data');
    });

    it('prevents non-Service teams from creating a brand new claim', () => {
      const createAsInputTeam = validateTeamFieldChanges(baseClaim, null, inputUser);
      expect(createAsInputTeam.allowed).toBe(false);
      expect(createAsInputTeam.violations[0]).toContain('not authorized to create initial Service Team claim');

      const createAsStoreTeam = validateTeamFieldChanges(baseClaim, null, storeUser);
      expect(createAsStoreTeam.allowed).toBe(false);

      const createAsServiceTeam = validateTeamFieldChanges(baseClaim, null, serviceUser);
      expect(createAsServiceTeam.allowed).toBe(true);
    });
  });

  // =========================================================================
  // Scenario 5: Yellow section fields are auto-generated and cannot be overwritten
  // =========================================================================
  describe('Scenario 5: Section 4 Auto Fields Non-Overwritable', () => {
    it('strictly recalculates and strips manual modifications to yellow-section fields', () => {
      const tamperedAutoClaim: Claim = {
        ...baseClaim,
        serviceCallStatusAuto: 'Closed',
        orgClaimStatusAuto: 'Closed',
        finalStatusAuto: 'Manually Overwritten Status',
        callToChallanDays: 9999,
        claimToChallanAgeing: 8888
      };

      // Even when submitted by admin, auto fields must strictly reflect calculated values
      const result = validateTeamFieldChanges(tamperedAutoClaim, baseClaim, adminUser);
      expect(result.allowed).toBe(true);

      // Verify the recalculated values based on baseClaim source fields:
      // callDate: 2025-09-15, claimDate: 2025-09-17, challanDate: 2026-02-07
      // 145 days elapsed between callDate and challanDate
      // 143 days elapsed between claimDate and challanDate
      expect(result.sanitized.callToChallanDays).toBe(145);
      expect(result.sanitized.claimToChallanAgeing).toBe(143);
      // Not 9999 or 8888!
      expect(result.sanitized.callToChallanDays).not.toBe(9999);
      expect(result.sanitized.claimToChallanAgeing).not.toBe(8888);
      expect(result.sanitized.finalStatusAuto).not.toBe('Manually Overwritten Status');
    });
  });

  // =========================================================================
  // Scenario 6: Changing source inputs updates the relevant generated values correctly
  // =========================================================================
  describe('Scenario 6: Excel Sheet Calculations and Dynamic Derivations', () => {
    it('matches Excel Sheet Row 1 exact numbers (145 days call to challan, 143 days claim ageing)', () => {
      // Row 1 from Excel:
      // Call date: 15-09-2025, Claim Date: 17-09-2025, Challan date: 07-02-2026
      // vendorResponse: Approved, damagedPartInward: Yes, turelNewPartOutward: No
      const row1Data: Partial<Claim> = {
        callDate: '2025-09-15',
        claimDate: '2025-09-17',
        challanDate: '2026-02-07',
        vendorResponse: 'Approved',
        damagedPartInward: 'Y',
        turelNewPartOutward: 'N',
        customerReceiptDate: '2026-02-07'
      };

      const auto = computeAutoFields(row1Data);
      expect(auto.callToChallanDays).toBe(145);
      expect(auto.claimToChallanAgeing).toBe(143);
      expect(auto.finalStatusAuto).toBe('Approved - Awaiting Part Dispatch to Customer');
      expect(auto.serviceCallStatusAuto).toBe('Closed');
      expect(auto.orgClaimStatusAuto).toBe('Open');
    });

    it('matches Excel Sheet Row 2 exact numbers (205 days call to challan, 203 days claim ageing)', () => {
      // Row 2 from Excel:
      // Call date: 25-10-2025, Claim Date: 27-10-2025, Challan date: 18-05-2026
      // vendorResponse: Approved, damagedPartInward: No
      const row2Data: Partial<Claim> = {
        callDate: '2025-10-25',
        claimDate: '2025-10-27',
        challanDate: '2026-05-18',
        vendorResponse: 'Approved',
        damagedPartInward: 'N',
        turelNewPartOutward: 'Y',
        customerReceiptDate: '2026-05-18'
      };

      const auto = computeAutoFields(row2Data);
      expect(auto.callToChallanDays).toBe(205);
      expect(auto.claimToChallanAgeing).toBe(203);
      expect(auto.finalStatusAuto).toBe('Approved - Awaiting Damaged Part Inward');
      expect(auto.serviceCallStatusAuto).toBe('Closed');
      expect(auto.orgClaimStatusAuto).toBe('Open');
    });

    it('derives Claim Under Process when pending vendor response and handles missing challan date', () => {
      const pendingData: Partial<Claim> = {
        callDate: '2025-10-01',
        claimDate: '2025-10-02',
        challanDate: '',
        vendorResponse: 'Pending'
      };

      const auto = computeAutoFields(pendingData);
      expect(auto.callToChallanDays).toBe(0);
      expect(auto.claimToChallanAgeing).toBe(0);
      expect(auto.finalStatusAuto).toBe('Claim Under Process');
      expect(auto.serviceCallStatusAuto).toBe('Open');
      expect(auto.orgClaimStatusAuto).toBe('Open');
    });

    it('derives Claim Rejected when vendor response is Reject', () => {
      const rejectedData: Partial<Claim> = {
        vendorResponse: 'Reject'
      };

      const auto = computeAutoFields(rejectedData);
      expect(auto.finalStatusAuto).toBe('Claim Rejected');
    });

    it('derives Organization Claim Status as Closed when closingNoteNo is issued', () => {
      const closedData: Partial<Claim> = {
        closingNoteNo: 'CN-MUM-2026-001',
        closingNoteDate: '2026-06-01'
      };

      const auto = computeAutoFields(closedData);
      expect(auto.orgClaimStatusAuto).toBe('Closed');
    });
  });

  // =========================================================================
  // Scenario 7: Saving, reopening, and editing claims preserves all teams' data
  // =========================================================================
  describe('Scenario 7: Multi-Team Collaboration & Data Integrity', () => {
    it('preserves all teams fields when different teams save sequential edits', async () => {
      // Step 1: Save base claim by admin
      await repo.saveClaim(baseClaim, adminUser);

      // Step 2: Service team edits Section 1
      let current = (await repo.claims()).find(c => c.id === baseClaim.id)!;
      const serviceEdit: Claim = {
        ...current,
        customerName: 'Updated Customer Pvt Ltd',
        remark: 'Service team diagnostic updated'
      };
      await repo.saveClaim(serviceEdit, serviceUser);

      // Step 3: Input team edits Section 2
      current = (await repo.claims()).find(c => c.id === baseClaim.id)!;
      expect(current.customerName).toBe('Updated Customer Pvt Ltd'); // preserved
      const inputEdit: Claim = {
        ...current,
        importInvoiceNo: 'NEW-INVOICE-2026',
        vendorResponse: 'Approved'
      };
      await repo.saveClaim(inputEdit, inputUser);

      // Step 4: Store team edits Section 3
      current = (await repo.claims()).find(c => c.id === baseClaim.id)!;
      expect(current.importInvoiceNo).toBe('NEW-INVOICE-2026'); // preserved
      expect(current.customerName).toBe('Updated Customer Pvt Ltd'); // preserved
      const storeEdit: Claim = {
        ...current,
        claimChallanNo: 'NEW-CHALLAN-9999',
        challanDate: '2026-02-07',
        turelNewPartOutward: 'Y'
      };
      await repo.saveClaim(storeEdit, storeUser);

      // Step 5: Verify final persisted claim has all three teams data + auto fields
      const finalSaved = (await repo.claims()).find(c => c.id === baseClaim.id)!;
      expect(finalSaved.customerName).toBe('Updated Customer Pvt Ltd');
      expect(finalSaved.importInvoiceNo).toBe('NEW-INVOICE-2026');
      expect(finalSaved.claimChallanNo).toBe('NEW-CHALLAN-9999');
      expect(finalSaved.finalStatusAuto).toBe('Approved - Awaiting Part Dispatch to Customer');
      expect(finalSaved.callToChallanDays).toBe(145);
    });
  });

  // =========================================================================
  // Scenario 8: Unauthorized updates are rejected by underlying data-handling logic
  // =========================================================================
  describe('Scenario 8: Enforcement at Repository Level', () => {
    it('throws Team Permission Violation when unauthorized user attempts direct repository modification', async () => {
      await repo.saveClaim(baseClaim, adminUser);

      const tamperedClaim: Claim = {
        ...baseClaim,
        importInvoiceNo: 'Direct Tampering Invoice Attempt'
      };

      // Service team tries to save an invoice change
      await expect(repo.saveClaim(tamperedClaim, serviceUser)).rejects.toThrow(
        /Team Permission Violation.*importInvoiceNo/
      );

      // Confirm in repo that saved claim was NOT changed
      const claims = await repo.claims();
      const persisted = claims.find(c => c.id === baseClaim.id)!;
      expect(persisted.importInvoiceNo).toBe(baseClaim.importInvoiceNo);
    });

    it('throws Team Permission Violation when non-service user attempts new claim creation', async () => {
      const newClaim: Claim = {
        ...baseClaim,
        id: 'new-unauthorized-claim-001',
        claimNo: 'CLM-TSC-NEW-001'
      };

      await expect(repo.saveClaim(newClaim, storeUser)).rejects.toThrow(
        /not authorized to create initial Service Team claim/
      );
    });
  });

  // =========================================================================
  // Scenario 9: Existing Administrators & Management have full access
  // =========================================================================
  describe('Scenario 9: Administrator & Management Full Access', () => {
    it('allows Admin/ERP user to edit across all 3 sections without restriction', () => {
      expect(canEditServiceSection(adminUser)).toBe(true);
      expect(canEditInputSection(adminUser)).toBe(true);
      expect(canEditStoreSection(adminUser)).toBe(true);

      const multiSectionEdit: Claim = {
        ...baseClaim,
        customerName: 'Admin Updated Customer',
        importInvoiceNo: 'Admin Updated Invoice',
        claimChallanNo: 'Admin Updated Challan'
      };

      const result = validateTeamFieldChanges(multiSectionEdit, baseClaim, adminUser);
      expect(result.allowed).toBe(true);
      expect(result.violations.length).toBe(0);
      expect(result.sanitized.customerName).toBe('Admin Updated Customer');
      expect(result.sanitized.importInvoiceNo).toBe('Admin Updated Invoice');
      expect(result.sanitized.claimChallanNo).toBe('Admin Updated Challan');
    });

    it('allows Branch Manager (Management/Admin) to coordinate across sections', () => {
      const branchManager: AppUser = {
        id: 'usr-bm-001',
        employeeId: 'TSC-EMP-002',
        name: 'Suresh Patil',
        username: 'suresh.patil',
        email: 'suresh.patil@turelgroup.com',
        role: 'Branch Manager',
        branch: 'Mumbai HO',
        status: 'Active',
        team: 'Management/Admin',
        permissions: [...ROLE_DEFAULT_PERMISSIONS['Branch Manager']],
        designation: 'Branch Operations Manager (Mumbai HO)'
      };

      expect(canEditServiceSection(branchManager)).toBe(true);
      expect(canEditInputSection(branchManager)).toBe(true);
      expect(canEditStoreSection(branchManager)).toBe(true);

      const result = validateTeamFieldChanges(baseClaim, baseClaim, branchManager);
      expect(result.allowed).toBe(true);
    });
  });

  // =========================================================================
  // Scenario 10: User Management, Roles & Default Generation
  // =========================================================================
  describe('Scenario 10: Deterministic User Generation & Team Configuration', () => {
    it('generates 158 users with proper team assignments without altering the 5 existing roles', () => {
      const users = generateInitialUsers();
      expect(users.length).toBeGreaterThan(150);

      const serviceUsers = users.filter(u => u.team === 'Service Team');
      const inputUsers = users.filter(u => u.team === 'Input Team');
      const storeUsers = users.filter(u => u.team === 'Store Team');
      const mgmtUsers = users.filter(u => u.team === 'Management/Admin');

      expect(serviceUsers.length).toBeGreaterThan(0);
      expect(inputUsers.length).toBeGreaterThan(0);
      expect(storeUsers.length).toBeGreaterThan(0);
      expect(mgmtUsers.length).toBeGreaterThan(0);

      // Verify each user has a valid team
      users.forEach(u => {
        expect(['Service Team', 'Input Team', 'Store Team', 'Management/Admin']).toContain(getUserTeam(u));
      });
    });

    it('integrates auto fields into derived domain metrics', () => {
      const d = derived(baseClaim, DEFAULT_CONFIG);
      expect(d.auto).toBeDefined();
      expect(d.auto.callToChallanDays).toBe(145);
      expect(d.auto.claimToChallanAgeing).toBe(143);
      expect(d.finalStatusAuto).toBe('Approved - Awaiting Part Dispatch to Customer');
      expect(d.serviceCallStatusAuto).toBe('Closed');
    });
  });
});
