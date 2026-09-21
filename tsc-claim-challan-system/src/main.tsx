import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Claim, CAPA, Config, DEFAULT_CONFIG, CATEGORIES } from './domain';
import { MockRepository } from './repository';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ClaimDetailDrawer } from './components/ClaimDetailDrawer';
import { LoginModal } from './components/LoginModal';

import { DashboardPage } from './pages/DashboardPage';
import { ClaimRegisterPage } from './pages/ClaimRegisterPage';
import { CapaPage } from './pages/CapaPage';
import { OemPerformancePage } from './pages/OemPerformancePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

import './style.css';

const repo = new MockRepository();

const blankClaim = (): Claim => ({
  id: crypto.randomUUID(),
  claimAgainst: 'Service call',
  callNo: '',
  callDate: new Date().toISOString().substring(0, 10),
  claimDate: new Date().toISOString().substring(0, 10),
  claimNo: '',
  brand: 'Typical',
  customerName: '',
  model: '',
  serialNo: '',
  partNo: '',
  description: '',
  qty: 1,
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
  localPO: '',
  localPurchaseGRN: '',
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
      user: 'Service Head',
      action: 'Claim Draft Initiated',
      previousValue: 'N/A',
      newValue: 'Draft State'
    }
  ],
  documents: []
});

function App() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const [tab, setTab] = useState<string>('Dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [registerFilter, setRegisterFilter] = useState<string>('all');

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Load data on mount
  useEffect(() => {
    (async () => {
      setClaims(await repo.claims());
      setCapas(await repo.capas());
      setConfig(await repo.config());
    })();
  }, []);

  const handleSaveClaim = async (updatedClaim: Claim) => {
    await repo.saveClaim(updatedClaim);
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

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <Sidebar
        currentTab={tab}
        onSelectTab={setTab}
        onNewClaim={() => setSelectedClaim(blankClaim())}
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
          onNewClaim={() => setSelectedClaim(blankClaim())}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* DYNAMIC PAGE VIEWS */}
        <main className="page-content-wrapper">
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
              onSelectClaim={setSelectedClaim}
              onNewClaim={() => setSelectedClaim(blankClaim())}
            />
          )}

          {tab === 'Create Claim' && (
            <ClaimRegisterPage
              claims={claims}
              config={config}
              initialFilter="all"
              initialQuery=""
              onSelectClaim={setSelectedClaim}
              onNewClaim={() => setSelectedClaim(blankClaim())}
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

          {(tab === 'User / Profile' || tab === 'ERP / Admin' || tab === 'Administration') && (
            <AdminPage
              onResetData={handleResetData}
            />
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

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
