import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  DistributionCampaign, 
  AuditLog, 
  ExtractionRule, 
  EmailSettings, 
  UserSession, 
  UserRole,
  NotificationItem,
  ExtractedPayslip,
  DeliveryRecord
} from './types';
import { StorageService } from './services/storageService';
import { EmailEngine, EmailSendProgress } from './services/emailEngine';

// Components
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { BatchUploadView } from './components/upload/BatchUploadView';
import { CampaignVerificationView } from './components/verification/CampaignVerificationView';
import { EmployeeManagementView } from './components/employees/EmployeeManagementView';
import { CampaignHistoryView } from './components/campaigns/CampaignHistoryView';
import { FailedDeliveriesView } from './components/failures/FailedDeliveriesView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { SystemSettingsView } from './components/settings/SystemSettingsView';
import { SendingQueueProgressModal } from './components/campaigns/SendingQueueProgressModal';
import { PlatformOwnerPortal } from './components/platform/PlatformOwnerPortal';
import { LoginTenantModal } from './components/auth/LoginTenantModal';
import { LoginPage } from './components/auth/LoginPage';
import { CompanyRegistrationModal } from './components/auth/CompanyRegistrationModal';
import { UserFeedbackView } from './components/feedback/UserFeedbackView';
import { SessionTimeoutModal } from './components/auth/SessionTimeoutModal';
import { HealthCheckModal } from './components/settings/HealthCheckModal';
import { ChangePasswordView } from './components/auth/ChangePasswordView';
import { useSessionTimeout } from './hooks/useSessionTimeout';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab | 'verification'>('dashboard');

  // Core Data States
  const [userSession, setUserSession] = useState<UserSession | null>(() => StorageService.getCurrentUserSession());
  const [employees, setEmployees] = useState<Employee[]>(StorageService.getEmployees());
  const [campaigns, setCampaigns] = useState<DistributionCampaign[]>(StorageService.getCampaigns());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(StorageService.getAuditLogs());
  const [rules, setRules] = useState<ExtractionRule[]>(StorageService.getExtractionRules());
  const [settings, setSettings] = useState<EmailSettings>(StorageService.getEmailSettings());
  const [notifications, setNotifications] = useState<NotificationItem[]>(StorageService.getNotifications());

  // Multi-Tenant Auth & Registration Modals State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);

  // Active Upload / Verification Campaign State
  const [stagedCampaignData, setStagedCampaignData] = useState<Partial<DistributionCampaign>>({});
  const [stagedExtractedPayslips, setStagedExtractedPayslips] = useState<ExtractedPayslip[]>([]);

  // Sending Progress Modal State
  const [sendingProgress, setSendingProgress] = useState<EmailSendProgress | null>(null);
  const [activeSendingCampaign, setActiveSendingCampaign] = useState<DistributionCampaign | null>(null);

  // Notification Drawer state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isHealthCheckModalOpen, setIsHealthCheckModalOpen] = useState(false);

  // User Explicit Logout Handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (userSession) {
      logAudit('LOGOUT', 'AUTHENTICATION', `Déconnexion utilisateur effectuée pour ${userSession.email}`);
    }
    StorageService.clearCurrentUserSession();
    setUserSession(null);
    pushNotification('Déconnexion', 'Vous avez été déconnecté avec succès.', 'info');
  };

  // Inactivity Timeout Logout Handler
  const handleTimeoutLogout = () => {
    logAudit('SESSION_TIMEOUT', 'AUTHENTICATION', 'Automatic logout executed after 15 minutes of user inactivity.');
    StorageService.clearCurrentUserSession();
    setUserSession(null);
    pushNotification(
      'Session Expirée',
      'Vous avez été déconnecté automatiquement après 15 minutes d\'inactivité pour des raisons de sécurité.',
      'warning'
    );
  };

  // Periodic check for account expiration lockdown (every 30 seconds)
  useEffect(() => {
    const checkExpirationLock = () => {
      if (!userSession || userSession.isPlatformOwner || userSession.role === 'Platform Super Admin') {
        return;
      }
      if (
        userSession.email?.toLowerCase() === 'dkamdkamcbg@gmail.com' ||
        userSession.email?.toLowerCase() === 'devperso140@gmail.com' ||
        userSession.username?.toLowerCase() === 'ama1234'
      ) {
        return;
      }

      const now = new Date();
      const companies = StorageService.getCompanies();
      const companyUsers = StorageService.getCompanyUsers();

      const userCompany = companies.find(c => c.id === userSession.companyId);
      const companyUser = companyUsers.find(u => u.id === userSession.id || u.email?.toLowerCase() === userSession.email?.toLowerCase());

      const isCompanyExpired = userCompany?.accessExpiresAt && new Date(userCompany.accessExpiresAt) < now;
      const isUserExpired = companyUser?.accessExpiresAt && new Date(companyUser.accessExpiresAt) < now;

      if (isCompanyExpired || isUserExpired) {
        logAudit('ACCOUNT_ACCESS_EXPIRED_LOCKOUT', 'SECURITY', `Accès expiré verrouillé automatiquement pour ${userSession.email}`);
        pushNotification(
          'Accès Expiré',
          `Votre période d'accès à l'application est arrivée à échéance. Votre session a été verrouillée.`,
          'warning'
        );
        setIsLoginModalOpen(true);
      }
    };

    checkExpirationLock();
    const interval = setInterval(checkExpirationLock, 30000);
    return () => clearInterval(interval);
  }, [userSession]);

  // Passive Session Timeout Warning Mechanism (15 minutes threshold + 60s warning modal)
  const {
    isWarningOpen: isTimeoutWarningOpen,
    countdownSeconds: timeoutCountdownSeconds,
    handleStayLoggedIn
  } = useSessionTimeout({
    inactivityTimeoutMs: 15 * 60 * 1000, // 15 minutes inactive limit
    warningDurationSeconds: 60,
    onTimeoutLogout: handleTimeoutLogout,
    enabled: !isLoginModalOpen && !isRegisterModalOpen
  });

  // Helpers to add audit logs & notifications
  const logAudit = (
    action: string,
    category: AuditLog['category'],
    details: string,
    result: AuditLog['result'] = 'Success'
  ) => {
    const newLog = StorageService.addAuditLog({
      user: userSession.name,
      userRole: userSession.role,
      ipAddress: '192.168.10.45',
      action,
      category,
      details,
      result
    });
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const pushNotification = (title: string, message: string, type: NotificationItem['type'] = 'info') => {
    const newItem: NotificationItem = {
      id: `n-${Date.now()}`,
      timestamp: 'Just now',
      title,
      message,
      type,
      read: false
    };
    const updated = [newItem, ...notifications];
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  // Role switching
  const handleSwitchRole = (newRole: UserRole) => {
    const updated = { ...userSession, role: newRole };
    setUserSession(updated);
    StorageService.saveCurrentUserSession(updated);
    logAudit('ROLE_SWITCH', 'AUTHENTICATION', `User switched role to ${newRole}`);
    pushNotification('Role Changed', `Current session role updated to ${newRole}`, 'info');
  };

  // Demo Reset
  const handleResetDemoData = () => {
    StorageService.resetToDemoData();
    setUserSession(StorageService.getCurrentUserSession());
    setEmployees(StorageService.getEmployees());
    setCampaigns(StorageService.getCampaigns());
    setAuditLogs(StorageService.getAuditLogs());
    setRules(StorageService.getExtractionRules());
    setSettings(StorageService.getEmailSettings());
    setNotifications(StorageService.getNotifications());
    setActiveTab('dashboard');
    pushNotification('Factory Reset', 'Demo system data restored to initial factory benchmarks', 'info');
  };

  // Workflow Handlers
  const handleUploadComplete = (
    campaignData: Partial<DistributionCampaign>,
    extractedPayslips: ExtractedPayslip[],
    rawPdfBlobUrl?: string
  ) => {
    setStagedCampaignData(campaignData);
    setStagedExtractedPayslips(extractedPayslips);
    setActiveTab('verification');
    logAudit('PDF_SPLIT_EXECUTION', 'SPLITTING', `Processed PDF ${campaignData.pdfFileName} (${extractedPayslips.length} pages split cleanly)`);
    pushNotification('PDF Splitting Complete', `Extracted ${extractedPayslips.length} individual employee payslips`, 'success');
  };

  const handleLaunchCampaign = async (
    payslipsToDistribute: ExtractedPayslip[],
    subject: string,
    template: string,
    throttleRatePerMin?: number
  ) => {
    const newCampaignId = `CAMP-2026-${Math.floor(10 + Math.random() * 90)}`;
    const effectiveSettings: EmailSettings = {
      ...settings,
      throttleRatePerMin: throttleRatePerMin || settings.throttleRatePerMin || 120
    };

    const newCampaign: DistributionCampaign = {
      id: newCampaignId,
      title: stagedCampaignData.title || `Payroll Distribution ${stagedCampaignData.payrollMonth}`,
      payrollMonth: stagedCampaignData.payrollMonth || 'July 2026',
      uploadedBy: userSession.name,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      pdfFileName: stagedCampaignData.pdfFileName || 'Master_Payroll.pdf',
      pdfFileSize: stagedCampaignData.pdfFileSize || '12 MB',
      totalPages: stagedCampaignData.totalPages || payslipsToDistribute.length,
      totalEmployees: payslipsToDistribute.length,
      matchedCount: payslipsToDistribute.filter(p => p.status === 'Matched').length,
      unmatchedCount: payslipsToDistribute.filter(p => p.status !== 'Matched').length,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      pendingCount: payslipsToDistribute.length,
      status: 'Distributing',
      emailSubject: subject,
      emailTemplate: template,
      requirePasswordProtect: stagedCampaignData.requirePasswordProtect || true,
      passwordFormat: stagedCampaignData.passwordFormat || 'Matricule',
      payslips: payslipsToDistribute,
      records: []
    };

    setActiveSendingCampaign(newCampaign);

    logAudit('CAMPAIGN_LAUNCH', 'DISTRIBUTION', `Launched campaign ${newCampaignId} for ${payslipsToDistribute.length} employees (Rate Limit: ${effectiveSettings.throttleRatePerMin} emails/min).`);
    pushNotification('Campaign Launched', `Queue runner started for ${newCampaignId} with ${effectiveSettings.throttleRatePerMin} emails/min throttling`, 'info');

    const finalCampaign = await EmailEngine.executeDistributionCampaign(
      newCampaign,
      effectiveSettings,
      (progress, currentCampaignState) => {
        setSendingProgress(progress);
        setActiveSendingCampaign(currentCampaignState);
      }
    );

    // Save final state
    StorageService.saveSingleCampaign(finalCampaign);
    setCampaigns(StorageService.getCampaigns());

    logAudit(
      'CAMPAIGN_COMPLETED',
      'DISTRIBUTION',
      `Campaign ${finalCampaign.id} finished. Delivered: ${finalCampaign.deliveredCount}, Failed: ${finalCampaign.failedCount}`
    );

    pushNotification(
      'Distribution Complete',
      `Finished sending ${finalCampaign.id}. ${finalCampaign.deliveredCount} delivered, ${finalCampaign.failedCount} bounced.`,
      finalCampaign.failedCount > 0 ? 'warning' : 'success'
    );
  };

  const handleScheduleCampaign = (
    payslipsToDistribute: ExtractedPayslip[],
    subject: string,
    template: string,
    scheduledAt: string,
    timezone: string,
    throttleRatePerMin?: number
  ) => {
    const newCampaignId = `CAMP-2026-${Math.floor(10 + Math.random() * 90)}`;

    const newCampaign: DistributionCampaign = {
      id: newCampaignId,
      title: stagedCampaignData.title || `Payroll Distribution ${stagedCampaignData.payrollMonth || 'July 2026'}`,
      payrollMonth: stagedCampaignData.payrollMonth || 'Juillet 2026',
      uploadedBy: userSession.name,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      pdfFileName: stagedCampaignData.pdfFileName || 'Master_Payroll.pdf',
      pdfFileSize: stagedCampaignData.pdfFileSize || '12 MB',
      totalPages: stagedCampaignData.totalPages || payslipsToDistribute.length,
      totalEmployees: payslipsToDistribute.length,
      matchedCount: payslipsToDistribute.filter(p => p.status === 'Matched').length,
      unmatchedCount: payslipsToDistribute.filter(p => p.status !== 'Matched').length,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      pendingCount: payslipsToDistribute.length,
      status: 'Scheduled',
      scheduledAt: `${scheduledAt} (${timezone})`,
      emailSubject: subject,
      emailTemplate: template,
      requirePasswordProtect: stagedCampaignData.requirePasswordProtect ?? true,
      passwordFormat: stagedCampaignData.passwordFormat || 'Matricule',
      payslips: payslipsToDistribute,
      records: payslipsToDistribute.map(p => ({
        id: `rec-${p.id}`,
        payslipId: p.id,
        matricule: p.matricule,
        employeeName: p.employeeName,
        email: p.email,
        phone: p.phone,
        channel: p.deliveryChannel || 'Both',
        department: p.department,
        netPay: p.netPay,
        payPeriod: p.payPeriod,
        status: 'Pending',
        whatsappStatus: 'Pending',
        retryCount: 0,
        pdfFileName: p.generatedFileName || `Fiche_de_paie_${p.matricule}.pdf`
      }))
    };

    StorageService.saveSingleCampaign(newCampaign);
    setCampaigns(StorageService.getCampaigns());

    logAudit(
      'CAMPAIGN_SCHEDULED',
      'DISTRIBUTION',
      `Scheduled campaign ${newCampaignId} for ${payslipsToDistribute.length} employees on ${scheduledAt} (${timezone}).`
    );

    pushNotification(
      'Campagne Planifiée',
      `La distribution ${newCampaignId} a été programmée pour le ${scheduledAt} (${timezone}).`,
      'info'
    );

    setActiveTab('campaigns');
  };

  const handleCloseSendingModal = () => {
    setSendingProgress(null);
    setActiveSendingCampaign(null);
    setActiveTab('campaigns');
  };

  // Employee CRUD
  const handleAddEmployee = (empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().substring(0, 10);
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    const updated = [newEmp, ...employees];
    setEmployees(updated);
    StorageService.saveEmployees(updated);
    logAudit('EMPLOYEE_CREATED', 'EMPLOYEE', `Added employee ${newEmp.firstName} ${newEmp.lastName} (Matricule: ${newEmp.matricule})`);
    pushNotification('Employee Added', `Created record for ${newEmp.matricule}`, 'success');
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const updated = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setEmployees(updated);
    StorageService.saveEmployees(updated);
    logAudit('EMPLOYEE_UPDATED', 'EMPLOYEE', `Updated employee record for ${updatedEmp.matricule}`);
  };

  const handleBatchImportEmployees = (newEmps: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString().substring(0, 10);
    const addedList: Employee[] = newEmps.map((data, idx) => ({
      ...data,
      id: `emp-imp-${Date.now()}-${idx}`,
      createdAt: now,
      updatedAt: now
    }));
    const updated = [...addedList, ...employees];
    setEmployees(updated);
    StorageService.saveEmployees(updated);
    logAudit('EMPLOYEE_BATCH_IMPORT', 'EMPLOYEE', `Imported ${addedList.length} employees from Excel spreadsheet`);
    pushNotification('Excel Import Successful', `Added ${addedList.length} employee records to directory`, 'success');
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    StorageService.saveEmployees(updated);
    logAudit('EMPLOYEE_DELETED', 'EMPLOYEE', `Removed employee ${emp?.matricule}`);
  };

  const handleBulkDeleteEmployees = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const updated = employees.filter(e => !ids.includes(e.id));
    setEmployees(updated);
    StorageService.saveEmployees(updated);
    logAudit('EMPLOYEES_BULK_DELETED', 'EMPLOYEE', `Suppression groupée de ${ids.length} employé(s)`);
    pushNotification('Suppression Réussie', `${ids.length} employé(s) supprimé(s) de l'annuaire`, 'info');
  };

  const handleDeleteCampaign = (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    StorageService.saveCampaigns(updated);
    logAudit('CAMPAIGN_DELETED', 'DISTRIBUTION', `Suppression de la campagne de distribution ${id} (${campaign?.payrollMonth || 'N/A'})`);
    pushNotification('Campagne Supprimée', `La campagne ${id} a été supprimée avec succès`, 'info');
  };

  const handleBulkDeleteCampaigns = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const updated = campaigns.filter(c => !ids.includes(c.id));
    setCampaigns(updated);
    StorageService.saveCampaigns(updated);
    logAudit('CAMPAIGNS_BULK_DELETED', 'DISTRIBUTION', `Suppression groupée de ${ids.length} campagne(s) de distribution`);
    pushNotification('Suppression Réussie', `${ids.length} campagne(s) de distribution supprimée(s) de l'historique`, 'info');
  };

  // Retry single failure record
  const handleUpdateDeliveryRecord = (updatedRecord: DeliveryRecord) => {
    const updatedCampaigns = campaigns.map(c => {
      const recIdx = c.records.findIndex(r => r.id === updatedRecord.id);
      if (recIdx >= 0) {
        const newRecords = [...c.records];
        newRecords[recIdx] = updatedRecord;

        const deliveredCount = newRecords.filter(r => r.status === 'Delivered').length;
        const failedCount = newRecords.filter(r => r.status === 'Failed').length;
        const status = failedCount === 0 ? 'Completed' : 'Completed with Errors';

        return {
          ...c,
          records: newRecords,
          deliveredCount,
          failedCount,
          status
        };
      }
      return c;
    });

    setCampaigns(updatedCampaigns);
    StorageService.saveCampaigns(updatedCampaigns);
    logAudit('DELIVERY_RETRY', 'DISTRIBUTION', `Retried delivery for ${updatedRecord.matricule}. Status: ${updatedRecord.status}`);
  };

  // Multi-Tenant Auth Handlers
  const handleLoginSuccess = (newSession: UserSession) => {
    setUserSession(newSession);
    setEmployees(StorageService.getEmployees());
    setCampaigns(StorageService.getCampaigns());
    setAuditLogs(StorageService.getAuditLogs());
    setIsLoginModalOpen(false);
    
    // Role-based destination routing:
    // SaaS Owner -> Platform Owner Portal
    // Admin / Manager -> Company Administration Dashboard
    // Simple User / Collaborator -> User Workspace
    if (newSession.isPlatformOwner || newSession.role === 'Platform Super Admin' || newSession.role === 'Super Administrator') {
      setActiveTab('platform_owner');
    } else if (newSession.role === 'Company Administrator' || newSession.role === 'HR Administrator' || newSession.role === 'Payroll Manager') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('campaigns');
    }

    pushNotification('Connexion Réussie', `Connecté en tant que ${newSession.name} (${newSession.company})`, 'success');
  };

  const handleCompanyRegistered = (newSession: UserSession) => {
    setUserSession(newSession);
    setEmployees(StorageService.getEmployees());
    setCampaigns(StorageService.getCampaigns());
    setAuditLogs(StorageService.getAuditLogs());
    setIsRegisterModalOpen(false);
    setActiveTab('dashboard');

    pushNotification('Inscriptions Réussie !', `Entreprise ${newSession.company} enregistrée avec succès. Bienvenue !`, 'success');
  };

  // Compute total failed count across campaigns
  const failedCountTotal = campaigns.reduce((acc, c) => acc + c.failedCount, 0);

  // Active view title mapping
  const titles: Record<string, string> = {
    dashboard: 'Aperçu Général des Distributions',
    upload: 'Moteur de Dépôt & Découpage des Fiches de Paie PDF',
    verification: 'Vérification Pré-Envoi des Bulletins de Paie',
    employees: 'Annuaire des Employés & Registre des E-mails',
    campaigns: 'Historique des Campagnes de Distribution',
    failures: 'Centre de Résolution des Échecs d\'Envoi',
    reports: 'Exportateur de Rapports d\'Analyse & Conformité',
    audit: 'Journaux d\'Audit Sécurité & Opérations Immuables',
    settings: 'Gestion des Utilisateurs, SMTP & Règles Regex',
    feedback: 'Support Client & Retours Utilisateurs',
    platform_owner: 'Portail d\'Administration Globale SaaS & Multi-Tenant'
  };

  // Unauthenticated State: Show Premium Full-Page KIBOSH LoginPage
  if (!userSession) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans antialiased text-slate-800">
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onOpenRegister={() => setIsRegisterModalOpen(true)}
        />

        <CompanyRegistrationModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          currentUserSession={{
            id: 'usr-guest',
            name: 'Visiteur',
            username: 'guest',
            email: 'contact@kibosh.com',
            role: 'Company Administrator',
            company: 'Nouvelle Organisation',
            companyId: 'comp-new',
            department: 'Direction RH',
            mfaEnabled: false,
            lastLogin: '',
            isPlatformOwner: false
          }}
          onRegistrationSuccess={(_company, _user, session) => handleCompanyRegistered(session)}
          onOpenLogin={() => setIsRegisterModalOpen(false)}
        />
      </div>
    );
  }

  // Mandatory Password Change Redirection (Blocks access to all other tabs)
  if (userSession.forcePasswordChange) {
    return (
      <div className="min-h-screen bg-slate-900">
        <ChangePasswordView
          currentSession={userSession}
          onPasswordChanged={(updatedSession) => {
            setUserSession(updatedSession);
            pushNotification(
              'Mot de passe mis à jour',
              'Votre nouveau mot de passe a été enregistré avec succès. Accès déverrouillé !',
              'success'
            );
          }}
          onLogout={handleLogout}
        />

        {/* Multi-Tenant Auth Modal on Logout */}
        <LoginTenantModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSelectSession={handleLoginSuccess}
          onOpenRegister={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab === 'verification' ? 'upload' : activeTab}
        setActiveTab={(t) => setActiveTab(t)}
        userRole={userSession.role}
        isPlatformOwner={userSession.isPlatformOwner}
        failedCount={failedCountTotal}
        userSession={userSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          currentSession={userSession}
          onSwitchRole={handleSwitchRole}
          notifications={notifications}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          activeViewTitle={titles[activeTab] || 'KIBOSH Dashboard'}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          onOpenHealthCheck={() => setIsHealthCheckModalOpen(true)}
        />

        {/* Dynamic View Route */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <OverviewDashboard
              campaigns={campaigns}
              employees={employees}
              userRole={userSession.role}
              userSession={userSession}
              onStartCampaign={() => setActiveTab('upload')}
              onGenerateDemoBatch={() => setActiveTab('upload')}
              onImportEmployees={() => setActiveTab('employees')}
              onViewCampaigns={() => setActiveTab('campaigns')}
              onViewFailures={() => setActiveTab('failures')}
            />
          )}

          {activeTab === 'upload' && (
            <BatchUploadView
              extractionRules={rules}
              registeredEmployees={employees}
              onUploadComplete={handleUploadComplete}
              onRegisterNewEmployee={handleAddEmployee}
            />
          )}

          {activeTab === 'verification' && (
            <CampaignVerificationView
              campaignData={stagedCampaignData}
              extractedPayslips={stagedExtractedPayslips}
              emailSettings={settings}
              onLaunchCampaign={handleLaunchCampaign}
              onScheduleCampaign={handleScheduleCampaign}
              onCancel={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagementView
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onBatchImport={handleBatchImportEmployees}
              onDeleteEmployee={handleDeleteEmployee}
              onBulkDeleteEmployees={handleBulkDeleteEmployees}
            />
          )}

          {activeTab === 'campaigns' && (
            <CampaignHistoryView
              campaigns={campaigns}
              onRetryRecord={handleUpdateDeliveryRecord}
              onNewCampaign={() => setActiveTab('upload')}
              onDeleteCampaign={handleDeleteCampaign}
              onBulkDeleteCampaigns={handleBulkDeleteCampaigns}
            />
          )}

          {activeTab === 'failures' && (
            <FailedDeliveriesView
              campaigns={campaigns}
              onUpdateRecord={handleUpdateDeliveryRecord}
              onRefreshCampaigns={() => setCampaigns(StorageService.getCampaigns())}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              campaigns={campaigns}
              employees={employees}
              auditLogs={auditLogs}
              settings={settings}
            />
          )}

          {activeTab === 'audit' && (userSession.isPlatformOwner || userSession.role === 'Platform Super Admin') && (
            <AuditLogView
              logs={auditLogs}
              onRefreshLogs={() => setAuditLogs(StorageService.getAuditLogs())}
            />
          )}

          {activeTab === 'settings' && (
            <SystemSettingsView
              settings={settings}
              rules={rules}
              currentSession={userSession}
              onLogAudit={(action, cat, details, res) => logAudit(action, cat, details, res)}
              onSaveSettings={(s) => {
                setSettings(s);
                StorageService.saveEmailSettings(s);
                logAudit('SETTINGS_UPDATE', 'SECURITY', 'Updated SMTP email server configuration');
              }}
              onSaveRules={(r) => {
                setRules(r);
                StorageService.saveExtractionRules(r);
                logAudit('RULES_UPDATE', 'SPLITTING', 'Updated PDF extraction Regex rules');
              }}
              onClose={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'feedback' && (
            <UserFeedbackView
              currentUserSession={userSession}
              onLogAudit={(action, cat, details) => logAudit(action, cat, details)}
              onPushNotification={pushNotification}
            />
          )}

          {activeTab === 'platform_owner' && (
            <PlatformOwnerPortal
              currentSession={userSession}
              onSwitchTenantSession={handleLoginSuccess}
              onLogAudit={(action, cat, details, res) => logAudit(action, cat, details, res)}
              onOpenRegisterCompany={() => setIsRegisterModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Login & Tenant Switcher Modal */}
      <LoginTenantModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSelectSession={handleLoginSuccess}
        onOpenRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      {/* Independent Company Registration Modal */}
      <CompanyRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        currentUserSession={userSession}
        onRegistrationSuccess={(_company, _user, session) => handleCompanyRegistered(session)}
        onOpenLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Sending Queue Progress Modal */}
      {sendingProgress && (
        <SendingQueueProgressModal
          progress={sendingProgress}
          campaign={activeSendingCampaign}
          onClose={handleCloseSendingModal}
        />
      )}

      {/* Session Inactivity Timeout Warning Modal */}
      <SessionTimeoutModal
        isOpen={isTimeoutWarningOpen}
        countdownSeconds={timeoutCountdownSeconds}
        onStayLoggedIn={handleStayLoggedIn}
        onSignOut={handleTimeoutLogout}
        inactiveMinutes={15}
        userSession={userSession}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        notifications={notifications}
        onClose={() => setIsNotificationOpen(false)}
        onClearAll={() => {
          setNotifications([]);
          StorageService.saveNotifications([]);
        }}
        onMarkRead={(id) => {
          const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
          setNotifications(updated);
          StorageService.saveNotifications(updated);
        }}
      />

      {/* Health Check Diagnostics Modal */}
      <HealthCheckModal
        isOpen={isHealthCheckModalOpen}
        onClose={() => setIsHealthCheckModalOpen(false)}
        onLogAudit={logAudit}
      />
    </div>
  );
}
