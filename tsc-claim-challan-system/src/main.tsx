import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Claim, CAPA, Config, DEFAULT_CONFIG, CATEGORIES, ClaimEvent, ClaimDocument, getFinancialYear, commitClaimSequence } from './domain';
import { MockRepository } from './repository';
import { AuthProvider, useAuth } from './AuthContext';
import { canEditServiceSection } from './auth';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ClaimDetailDrawer } from './components/ClaimDetailDrawer';
import { LoginModal } from './components/LoginModal';
import { AccessDenied } from './components/AccessDenied';

import { DashboardPage } from './pages/DashboardPage';
import { ClaimRegisterPage } from './pages/ClaimRegisterPage';
import { CapaPage } from './pages/CapaPage';
import { OemPerformancePage } from './pages/OemPerformancePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

import './style.css';

const repo = new MockRepository();

const blankClaim = (performedByUser?: string, performedByRole?: string, userBranch?: string): Claim => {
  const branch = userBranch || 'Mumbai HO';
  const brand = 'Vibemac';
  const fy = getFinancialYear();
  return {
    id: crypto.randomUUID(),
    claimAgainst: 'Service call',
    callNo: '',
    callDate: new Date().toISOString().substring(0, 10),
    claimDate: new Date().toISOString().substring(0, 10),
    claimNo: '',
    branch,
    financialYear: fy,
    brand,
  customerName: '',
  model: '',
  serialNo: '',
  partNo: '',
  description: '',
  qty: 1,
  parts: [
    {
      id: crypto.randomUUID(),
      srNo: 1,
      partNo: '',
      description: '',
      qty: 1,
      remarks: '',
      images: []
    }
  ],
  importInvoiceNo: '',
  importInvoiceDate: '',
  turelTaxInvoiceNo: '',
  turelTaxInvoiceDate: '',
  installationDate: '',
  category: CATEGORIES[0],
  remark: '',
  vendorResponse: 'Pending',
  damagedPartInward: 'N',
  damagedPartGRNNo: '',
  damagedPartGRNDate: '',
  newPartAtHO: 'N',
  hoGRNNo: '',
  hoGRNDate: '',
  claimChallanNo: '',
  challanDate: '',
  newPartAtBranch: 'N',
  branchGRNNo: '',
  branchGRNDate: '',
  turelNewPartOutward: 'N',
  customerReceiptDate: '',
  oemClaimNo: '',
  oemClaimDate: '',
  oemSettlementExpected: '',
  oemClaimOutcome: 'Pending',
  oemReplacementReceived: 'N',
  creditNoteVerified: 'N',
  inventoryAdjusted: 'N',
  financeReceivableCleared: 'N',
  localPurchaseExpenseSettled: 'Y',
  interimOption: '',
  branchTransferRequestNo: '',
  branchTransferBranch: '',
  localPO: '',
  localPOVendor: '',
  localPurchaseGRN: '',
  localPurchaseGRNDate: '',
  temporaryLocalPurchaseCost: null,
  oemCreditValue: null,
  rootCauseBrief: '',
  capaNo: '',
  capaStatus: 'N/A',
  isoClauseRef: 'Cl. 8.7',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  source: 'MANUAL_PILOT',
  auditLogs: [
    {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: performedByUser || 'Service Head',
      action: 'Claim Draft Initiated',
      previousValue: 'N/A',
      newValue: 'Draft State'
    }
  ],
    documents: []
  };
};

function AppContent() {
  const { currentUser, canAccessTab, hasPermission } = useAuth();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const [tab, setTab] = useState<string>('Dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [registerFilter, setRegisterFilter] = useState<string>('all');

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Load claims and config on mount
  useEffect(() => {
    (async () => {
      setClaims(await repo.claims());
      setCapas(await repo.capas());
      setConfig(await repo.config());
    })();
  }, []);

  const handleNewClaim = () => {
    if (!hasPermission('claim:create') || !canEditServiceSection(currentUser)) {
      alert(`Insufficient Privileges: Initiating new warranty claims requires Service Team or Administrative authorization.`);
      return;
    }
    setSelectedClaim(blankClaim(currentUser.name, currentUser.role, currentUser.branch));
  };

  const handleSaveClaim = async (updatedClaim: Claim) => {
    const isNew = claims.findIndex(x => x.id === updatedClaim.id) < 0;
    if (updatedClaim.claimNo) {
      commitClaimSequence(updatedClaim.claimNo);
    }
    await repo.saveClaim(updatedClaim, currentUser);
    if (isNew) {
      const today = updatedClaim.claimDate || new Date().toISOString().substring(0, 10);
      const evId = crypto.randomUUID();
      const docId = crypto.randomUUID();
      const createdEvent: ClaimEvent = {
        id: evId,
        claimId: updatedClaim.id,
        eventType: 'CLAIM_CREATED',
        eventDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Created',
        referenceNo: updatedClaim.claimNo,
        remarks: `Claim initiated by ${currentUser.name} (${currentUser.branch}).`,
        performedBy: `${currentUser.name} (${currentUser.role})`,
        performedByRole: currentUser.role,
        createdAt: new Date().toISOString(),
        documentId: docId
      };
      const createdDoc: ClaimDocument = {
        id: docId,
        claimId: updatedClaim.id,
        eventId: evId,
        documentType: 'CLAIM_NOTE',
        documentNo: `CIS-${updatedClaim.claimNo.substring(Math.max(0, updatedClaim.claimNo.length - 7))}`,
        documentDate: today,
        fileName: `Intimation_${updatedClaim.claimNo || 'NewClaim'}.pdf`,
        uploadedBy: currentUser.name,
        uploadedAt: new Date().toISOString(),
        fileSize: '42 KB'
      };
      await repo.addClaimEvent(createdEvent);
      await repo.addClaimDocument(createdDoc);
    }
    setClaims(await repo.claims());
  };

  const handleSaveConfig = async (newCfg: Config) => {
    await repo.saveConfig(newCfg);
    setConfig(newCfg);
  };

  const handleSaveCAPA = async (capa: CAPA) => {
    await repo.saveCAPA(capa);
    setCapas(await repo.capas());
  };

  const handleResetData = async () => {
    await repo.reset();
    window.location.reload();
  };

  const handleDashboardFilterSelect = (filterKey: string) => {
    setRegisterFilter(filterKey);
    setTab('Claim Register');
  };

  const handleSelectClaimByNo = (claimNo: string) => {
    const found = claims.find(c => c.claimNo.toLowerCase() === claimNo.toLowerCase());
    if (found) {
      setSelectedClaim(found);
    } else {
      setSearchQuery(claimNo);
      setTab('Claim Register');
    }
  };

  const isTabPermitted = canAccessTab(tab);

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <Sidebar
        currentTab={tab}
        onSelectTab={setTab}
        onNewClaim={handleNewClaim}
      />

      {/* MAIN CONTENT AREA */}
      <div className="app-main-content">
        {/* HEADER */}
        <Header
          currentTab={tab}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q && tab !== 'Claim Register') {
              setTab('Claim Register');
            }
          }}
          onNewClaim={handleNewClaim}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          claims={claims}
          onSelectClaim={setSelectedClaim}
          onNavigateToRegister={() => setTab('Claim Register')}
        />

        {/* DYNAMIC PAGE VIEWS WITH ROUTE PERMISSION GUARD */}
        <main className="page-content-wrapper">
          {!isTabPermitted ? (
            <AccessDenied
              tabName={tab}
              onNavigateDashboard={() => setTab('Dashboard')}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
            />
          ) : (
            <>
              {tab === 'Dashboard' && (
                <DashboardPage
                  claims={claims}
                  capas={capas}
                  config={config}
                  onFilterSelect={handleDashboardFilterSelect}
                  onSelectClaim={setSelectedClaim}
                />
              )}

              {(tab === 'Claim Register' || tab === 'Claims') && (
                <ClaimRegisterPage
                  claims={claims}
                  config={config}
                  initialFilter={registerFilter}
                  initialQuery={searchQuery}
                  onQueryChange={setSearchQuery}
                  onSelectClaim={setSelectedClaim}
                  onNewClaim={handleNewClaim}
                />
              )}

              {tab === 'Create Claim' && (
                <ClaimRegisterPage
                  claims={claims}
                  config={config}
                  initialFilter="all"
                  initialQuery=""
                  onSelectClaim={setSelectedClaim}
                  onNewClaim={handleNewClaim}
                />
              )}

              {tab === 'CAPA' && (
                <CapaPage
                  capas={capas}
                  onSaveCAPA={handleSaveCAPA}
                  onSelectClaimByNo={handleSelectClaimByNo}
                />
              )}

              {tab === 'OEM Performance' && (
                <OemPerformancePage
                  claims={claims}
                  config={config}
                />
              )}

              {tab === 'Reports' && (
                <ReportsPage
                  claims={claims}
                  capas={capas}
                  config={config}
                />
              )}

              {(tab === 'Configuration' || tab === 'SLA / Settings') && (
                <SettingsPage
                  config={config}
                  onSaveConfig={handleSaveConfig}
                />
              )}

              {tab === 'User Management' && (
                <AdminPage
                  initialSection="users"
                  onResetData={handleResetData}
                />
              )}

              {(tab === 'User / Profile' || tab === 'ERP / Admin' || tab === 'Administration') && (
                <AdminPage
                  initialSection={tab === 'User / Profile' ? 'users' : 'erp'}
                  onResetData={handleResetData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* CLAIM DETAIL DRAWER / EDIT MODAL */}
      {selectedClaim && (
        <ClaimDetailDrawer
          initial={selectedClaim}
          config={config}
          allClaims={claims}
          onClose={() => setSelectedClaim(null)}
          onSave={handleSaveClaim}
          repo={repo}
        />
      )}

      {/* CORPORATE LOGIN / AUTH MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider repo={repo}>
      <AppContent />
    </AuthProvider>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
