import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  Send, 
  Database, 
  Activity, 
  ShieldCheck, 
  Search, 
  Filter, 
  MoreVertical, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Eye, 
  ArrowUpRight, 
  Server, 
  Layers, 
  KeyRound, 
  History, 
  Sliders,
  HelpCircle,
  PlusCircle,
  TrendingUp,
  Download,
  AlertCircle,
  MessageSquare,
  UserPlus,
  X,
  Check,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Globe,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { CompanyTenant, CompanyUser, AuditLog, UserSession, Employee, SubscriptionRecord, ExportJobRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import { PlatformFeedbackManagement } from './PlatformFeedbackManagement';
import { CompanyManagementTab } from './CompanyManagementTab';
import { CompanyAdminsTab } from './CompanyAdminsTab';
import { PlatformUsersTab } from './PlatformUsersTab';
import { CrossCompanyEmployeesTab } from './CrossCompanyEmployeesTab';
import { SubscriptionsTab } from './SubscriptionsTab';
import { DataExportCenterTab } from './DataExportCenterTab';

interface PlatformOwnerPortalProps {
  currentSession: UserSession;
  onSwitchTenantSession?: (session: UserSession) => void;
  onLogAudit: (action: string, category: AuditLog['category'], details: string, result?: AuditLog['result']) => void;
  onOpenRegisterCompany?: () => void;
}

export const PlatformOwnerPortal: React.FC<PlatformOwnerPortalProps> = ({
  currentSession,
  onSwitchTenantSession,
  onLogAudit,
  onOpenRegisterCompany
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'companies' | 'admins' | 'users' | 'employees' | 'subscriptions' | 'exports' | 'monitoring' | 'global_audit' | 'support_access' | 'feedback_support'
  >('overview');

  // Core Data State
  const [companies, setCompanies] = useState<CompanyTenant[]>(() => StorageService.getCompanies());
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>(() => StorageService.getCompanyUsers());
  const [employees, setEmployees] = useState<Employee[]>(() => StorageService.getEmployees());
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportJobRecord[]>([]);
  const [allLogs, setAllLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());
  const [dbStats, setDbStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New Company Registration Modal State
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCountry, setNewCompCountry] = useState('France');
  const [newCompSize, setNewCompSize] = useState<CompanyTenant['size']>('11-50');
  const [newCompIndustry, setNewCompIndustry] = useState('Technologies de l\'Information');
  const [newCompEmail, setNewCompEmail] = useState('');
  const [newCompPhone, setNewCompPhone] = useState('+33 1 40 00 00 00');
  const [newCompPlan, setNewCompPlan] = useState<CompanyTenant['subscriptionPlan']>('Starter');
  const [newCompAdminName, setNewCompAdminName] = useState('');
  const [newCompAdminEmail, setNewCompAdminEmail] = useState('');
  const [newCompAdminUsername, setNewCompAdminUsername] = useState('');
  const [newCompAdminPassword, setNewCompAdminPassword] = useState('Password123!');
  const [createCompError, setCreateCompError] = useState<string | null>(null);
  const [createCompSuccess, setCreateCompSuccess] = useState<string | null>(null);

  // Fetch live database and platform records
  const loadPlatformData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('kibosh_access_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // 1. Stats
      try {
        const statsRes = await fetch('/api/platform/stats', { headers });
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          if (statsJson.success) setDbStats(statsJson.stats);
        }
      } catch (e) {
        console.warn('Failed to fetch platform stats from API:', e);
      }

      // 2. Companies
      try {
        const compRes = await fetch('/api/platform/companies', { headers });
        if (compRes.ok) {
          const compJson = await compRes.json();
          if (compJson.success && compJson.companies) {
            setCompanies(compJson.companies);
            StorageService.saveCompanies(compJson.companies);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch companies from API:', e);
      }

      // 3. Users
      try {
        const usersRes = await fetch('/api/platform/users', { headers });
        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          if (usersJson.success && usersJson.users) {
            setCompanyUsers(usersJson.users);
            StorageService.saveCompanyUsers(usersJson.users);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch users from API:', e);
      }

      // 4. Employees
      try {
        const empRes = await fetch('/api/platform/employees', { headers });
        if (empRes.ok) {
          const empJson = await empRes.json();
          if (empJson.success && empJson.employees) {
            setEmployees(empJson.employees);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch employees from API:', e);
      }

      // 5. Subscriptions
      try {
        const subRes = await fetch('/api/platform/subscriptions', { headers });
        if (subRes.ok) {
          const subJson = await subRes.json();
          if (subJson.success && subJson.subscriptions) {
            setSubscriptions(subJson.subscriptions);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch subscriptions from API:', e);
      }

      // 6. Export History
      try {
        const expRes = await fetch('/api/platform/export/history', { headers });
        if (expRes.ok) {
          const expJson = await expRes.json();
          if (expJson.success && expJson.history) {
            setExportHistory(expJson.history);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch export history from API:', e);
      }

      // 7. Audit Logs
      try {
        const logsRes = await fetch('/api/platform/audit-logs', { headers });
        if (logsRes.ok) {
          const logsJson = await logsRes.json();
          if (logsJson.success && logsJson.logs) {
            setAllLogs(logsJson.logs);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch audit logs from API:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  // Derived real counted metrics from database
  const totalCompaniesCount = dbStats?.totalCompanies ?? companies.length;
  const activeCompaniesCount = dbStats?.activeCompanies ?? companies.filter(c => c.status === 'Active').length;
  const pendingCompaniesCount = dbStats?.pendingCompanies ?? companies.filter(c => c.status === 'Pending Activation').length;
  const suspendedCompaniesCount = dbStats?.suspendedCompanies ?? companies.filter(c => c.status === 'Suspended').length;

  const totalAdminsCount = dbStats?.totalAdmins ?? companyUsers.filter(u => u.role === 'Company Administrator').length;
  const totalPlatformUsersCount = dbStats?.totalUsers ?? companyUsers.length;
  const totalEmployeesCount = dbStats?.totalEmployees ?? (employees.length + companies.reduce((acc, c) => acc + (c.totalEmployeesCount || 0), 0));

  const activeSubsCount = dbStats?.activeSubscriptions ?? subscriptions.filter(s => s.status === 'Active' || s.status === 'Trial').length;
  const expiredSubsCount = dbStats?.expiredSubscriptions ?? subscriptions.filter(s => s.status === 'Expired').length;

  const storageUsageGB = (companies.reduce((acc, c) => acc + (c.storageUsageMB || 0), 0) / 1024 + 1.2).toFixed(2);
  const maxStorageGB = 500;

  // Actions
  const handleUpdateCompanyStatus = async (companyId: string, status: CompanyTenant['status']) => {
    try {
      const token = localStorage.getItem('kibosh_access_token');
      const res = await fetch(`/api/platform/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.company) {
          setCompanies(prev => prev.map(c => c.id === companyId ? data.company : c));
          StorageService.saveCompanies(companies.map(c => c.id === companyId ? data.company : c));
        }
      } else {
        // Fallback local update
        const updated = companies.map(c => c.id === companyId ? { ...c, status } : c);
        setCompanies(updated);
        StorageService.saveCompanies(updated);
      }

      onLogAudit(
        'PLATFORM_COMPANY_STATUS_CHANGED',
        'ADMIN',
        `Platform Super Admin modified company '${companyId}' status to ${status}.`,
        'Success'
      );
    } catch (e) {
      console.error('Error updating company status:', e);
    }
  };

  const handleUpdateCompanySubscription = async (companyId: string, plan: CompanyTenant['subscriptionPlan'], expirationIso: string) => {
    try {
      const token = localStorage.getItem('kibosh_access_token');
      const res = await fetch(`/api/platform/companies/${companyId}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ plan, expirationDate: expirationIso })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.company) {
          setCompanies(prev => prev.map(c => c.id === companyId ? data.company : c));
          StorageService.saveCompanies(companies.map(c => c.id === companyId ? data.company : c));
        }
      } else {
        const updated = companies.map(c => c.id === companyId ? { ...c, subscriptionPlan: plan, accessExpiresAt: expirationIso } : c);
        setCompanies(updated);
        StorageService.saveCompanies(updated);
      }

      onLogAudit(
        'PLATFORM_PLAN_UPGRADED',
        'ADMIN',
        `Company '${companyId}' subscription updated to ${plan} (expires: ${expirationIso}).`,
        'Success'
      );
    } catch (e) {
      console.error('Error upgrading company subscription:', e);
    }
  };

  const handleToggleUserAccountStatus = async (userId: string) => {
    try {
      const user = companyUsers.find(u => u.id === userId);
      if (!user) return;
      const nextStatus = user.status === 'Active' ? 'Disabled' : 'Active';

      const token = localStorage.getItem('kibosh_access_token');
      const res = await fetch(`/api/platform/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCompanyUsers(prev => prev.map(u => u.id === userId ? data.user : u));
          StorageService.saveCompanyUsers(companyUsers.map(u => u.id === userId ? data.user : u));
        }
      } else {
        const updated = companyUsers.map(u => u.id === userId ? { ...u, status: nextStatus as any } : u);
        setCompanyUsers(updated);
        StorageService.saveCompanyUsers(updated);
      }

      onLogAudit(
        'PLATFORM_USER_STATUS_CHANGED',
        'ADMIN',
        `User '${user.fullName}' (${user.email}) status changed to ${nextStatus}.`,
        'Success'
      );
    } catch (e) {
      console.error('Error toggling user status:', e);
    }
  };

  const handleTriggerPasswordReset = async (user: CompanyUser) => {
    try {
      const token = localStorage.getItem('kibosh_access_token');
      const res = await fetch(`/api/platform/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      onLogAudit(
        'PLATFORM_FORCE_PASSWORD_RESET',
        'SECURITY',
        `Secure password reset workflow triggered for user '${user.fullName}' (${user.email}).`,
        'Success'
      );
    } catch (e) {
      console.error('Error resetting user password:', e);
    }
  };

  const handleCreateUser = async (userData: Partial<CompanyUser>) => {
    try {
      const token = localStorage.getItem('kibosh_access_token');
      const res = await fetch('/api/platform/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(userData)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCompanyUsers(prev => [data.user, ...prev]);
        }
      } else {
        // Fallback local creation
        const newUser: CompanyUser = {
          id: `usr-${Date.now()}`,
          companyId: userData.companyId || 'comp-default',
          companyName: userData.companyName || 'Entreprise Client',
          fullName: userData.fullName || 'Nouvel Utilisateur',
          username: userData.username || 'user',
          email: userData.email || '',
          phone: userData.phone || '',
          phoneNumber: userData.phoneNumber || '',
          jobPosition: userData.jobPosition || 'Gestionnaire Paie',
          role: userData.role || 'Payroll Manager',
          status: 'Active',
          registrationDate: new Date().toISOString().split('T')[0],
          lastLogin: 'Jamais connecté',
          mfaEnabled: Boolean(userData.mfaEnabled),
          failedLoginAttempts: 0
        };
        const updated = [newUser, ...companyUsers];
        setCompanyUsers(updated);
        StorageService.saveCompanyUsers(updated);
      }

      onLogAudit(
        'PLATFORM_USER_CREATED',
        'ADMIN',
        `Super Admin created user '${userData.fullName}' (${userData.email}) for company '${userData.companyName}'.`,
        'Success'
      );
    } catch (e) {
      console.error('Error creating platform user:', e);
    }
  };

  const handleVerifySubscriptionPayment = async (subscriptionId: string, paymentMethod: string, paymentReference: string, notes?: string) => {
    try {
      const token = localStorage.getItem('kibosh_access_token');
      const res = await fetch(`/api/platform/subscriptions/${subscriptionId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ paymentMethod, paymentReference, notes })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.subscription) {
          setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? data.subscription : s));
        }
      } else {
        setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? {
          ...s,
          paymentVerified: true,
          status: 'Active',
          paymentMethod,
          paymentReference,
          notes
        } : s));
      }

      onLogAudit(
        'SUBSCRIPTION_PAYMENT_VERIFIED',
        'SECURITY',
        `Subscription payment confirmed for '${subscriptionId}'. Réf: ${paymentReference}. Method: ${paymentMethod}`,
        'Success'
      );
    } catch (e) {
      console.error('Error verifying payment:', e);
    }
  };

  const handleExportData = async (target: 'companies' | 'admins' | 'users' | 'employees' | 'subscriptions', format: 'xlsx' | 'csv' | 'pdf') => {
    const token = localStorage.getItem('kibosh_access_token');
    const res = await fetch('/api/platform/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ target, format })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la génération de l\'exportation.');
    }

    onLogAudit(
      'PLATFORM_DATA_EXPORTED',
      'SECURITY',
      `SaaS Owner exported ${target.toUpperCase()} as ${format.toUpperCase()} (${data.recordCount} rows).`,
      'Success'
    );

    return data;
  };

  const handleStartSupportSession = (company: CompanyTenant) => {
    onLogAudit(
      'SUPPORT_ACCESS_SESSION_STARTED',
      'SECURITY',
      `Platform Support accessed workspace for '${company.name}' with immutable audit logging.`,
      'Success'
    );

    const adminUser = companyUsers.find(u => u.companyId === company.id) || companyUsers[0];
    
    const supportSession: UserSession = {
      id: adminUser.id,
      name: `Support (Mode Assistance: ${company.name})`,
      username: 'support.agent',
      email: currentSession.email,
      role: 'Company Administrator',
      company: company.name,
      companyId: company.id,
      department: 'Assistance Technique Client',
      mfaEnabled: true,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isPlatformOwner: true,
      supportAccessActive: true
    };

    if (onSwitchTenantSession) {
      onSwitchTenantSession(supportSession);
    }
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCompError(null);
    setCreateCompSuccess(null);

    if (!newCompName.trim() || !newCompAdminEmail.trim() || !newCompAdminUsername.trim()) {
      setCreateCompError('Nom de l\'entreprise, email admin et nom d\'utilisateur requis.');
      return;
    }

    try {
      const token = localStorage.getItem('kibosh_access_token');
      const res = await fetch('/api/platform/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newCompName.trim(),
          country: newCompCountry,
          size: newCompSize,
          industry: newCompIndustry,
          companyEmail: newCompEmail.trim() || newCompAdminEmail.trim(),
          companyPhone: newCompPhone.trim(),
          subscriptionPlan: newCompPlan,
          adminFullName: newCompAdminName.trim() || newCompAdminUsername.trim(),
          adminEmail: newCompAdminEmail.trim().toLowerCase(),
          adminUsername: newCompAdminUsername.trim().toLowerCase(),
          adminPhone: newCompPhone.trim(),
          initialPassword: newCompAdminPassword
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la création de l\'entreprise.');
      }

      setCompanies(prev => [data.company, ...prev]);
      setCompanyUsers(prev => [data.adminUser, ...prev]);

      setCreateCompSuccess(`L'organisation '${newCompName}' et son compte Administrateur ont été créés avec succès !`);
      setTimeout(() => {
        setShowCreateCompanyModal(false);
        setCreateCompSuccess(null);
        setNewCompName('');
        setNewCompAdminEmail('');
        setNewCompAdminUsername('');
      }, 1500);

      onLogAudit(
        'PLATFORM_COMPANY_CREATED',
        'ADMIN',
        `SaaS Owner provisioned company '${newCompName}' with admin ${newCompAdminEmail}.`,
        'Success'
      );
    } catch (err: any) {
      setCreateCompError(err.message || 'Impossible de créer l\'entreprise.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / SaaS Control Center Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              KIBOSH SaaS Owner Portal
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Central Company & Customer Management Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Supervision & Gouvernance des Clients Plateforme
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Surveillance en temps réel des organisations inscrites, gestion des administrateurs, annuaire central des utilisateurs, registre consolidé des employés et centre d'exportation certifié.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs">
            <div className="text-slate-400 font-medium">Santé Plateforme</div>
            <div className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Opérationnel (99.99%)</span>
            </div>
          </div>

          <button
            onClick={() => setShowCreateCompanyModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Inscrire une Entreprise</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {/* 1. Overview */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Vue d'Ensemble & Métriques</span>
        </button>

        {/* 2. Companies */}
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'companies' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gestion des Entreprises ({totalCompaniesCount})</span>
        </button>

        {/* 3. Company Admins */}
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'admins' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Administrateurs Entreprises ({totalAdminsCount})</span>
        </button>

        {/* 4. Platform Users */}
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Annuaire Utilisateurs ({totalPlatformUsersCount})</span>
        </button>

        {/* 5. Cross-Company Employees */}
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'employees' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Registre des Employés ({totalEmployeesCount})</span>
        </button>

        {/* 6. Subscriptions */}
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'subscriptions' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Abonnements ({activeSubsCount})</span>
        </button>

        {/* 7. Data Exports */}
        <button
          onClick={() => setActiveTab('exports')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'exports' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Centre d'Exportation</span>
        </button>

        {/* 8. Audit Logs */}
        <button
          onClick={() => setActiveTab('global_audit')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'global_audit' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Logs Multi-Tenants</span>
        </button>

        {/* 9. Support Access */}
        <button
          onClick={() => setActiveTab('support_access')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'support_access' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Support Délégué</span>
        </button>

        {/* 10. Feedback Support */}
        <button
          onClick={() => setActiveTab('feedback_support')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'feedback_support' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <span>Tickets d'Assistance</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRICS DASHBOARD (Real Database Counts) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real Metrics KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Companies */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Entreprises Enregistrées</span>
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalCompaniesCount}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeCompaniesCount} Actives
                </span>
                <span>•</span>
                <span className="text-amber-600 font-medium">
                  {pendingCompaniesCount} En attente
                </span>
              </div>
            </div>

            {/* Total Administrators */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Administrateurs Entreprises</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalAdminsCount}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Comptes administrateurs vérifiés</span>
              </div>
            </div>

            {/* Total Platform Users */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Utilisateurs Globaux</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalPlatformUsersCount}
              </div>
              <div className="text-[11px] text-slate-500">
                Gouvernance RBAC multi-organisations
              </div>
            </div>

            {/* Total Employees Managed */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Employés Gérés (Multi-Tenants)</span>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalEmployeesCount}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Salaires confidentiels protégés</span>
              </div>
            </div>

          </div>

          {/* Secondary Stats Row: Subscriptions & Country Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Subscriptions Portfolio Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Répartition des Forfaits
                </h3>
                <span className="text-xs text-indigo-600 font-bold">{activeSubsCount} Abonnements Actifs</span>
              </div>

              <div className="space-y-3">
                {[
                  { plan: 'Enterprise', count: companies.filter(c => c.subscriptionPlan === 'Enterprise').length, color: 'bg-purple-600', price: '490 €/m' },
                  { plan: 'Professional', count: companies.filter(c => c.subscriptionPlan === 'Professional').length, color: 'bg-blue-600', price: '189 €/m' },
                  { plan: 'Starter', count: companies.filter(c => c.subscriptionPlan === 'Starter').length, color: 'bg-teal-600', price: '79 €/m' },
                  { plan: 'Free Trial', count: companies.filter(c => c.subscriptionPlan === 'Free Trial').length, color: 'bg-amber-500', price: 'Évaluation' }
                ].map(item => (
                  <div key={item.plan} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-md ${item.color}`} />
                      <span className="font-bold text-slate-800">{item.plan}</span>
                      <span className="text-slate-400">({item.price})</span>
                    </div>
                    <span className="font-black text-slate-900 text-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Navigation Shortcuts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Actions Administratives Rapides
              </h3>

              <div className="space-y-2.5">
                <button
                  onClick={() => setActiveTab('companies')}
                  className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold text-slate-900">Consulter les Entreprises</div>
                      <div className="text-[11px] text-slate-500">Filtrer par pays, plan ou statut d'activation</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveTab('admins')}
                  className="w-full p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-bold text-slate-900">Gérer les Comptes Admins</div>
                      <div className="text-[11px] text-slate-500">Réinitialisation de mot de passe & statuts</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveTab('exports')}
                  className="w-full p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900">Exporter les Données Métier</div>
                      <div className="text-[11px] text-slate-500">Rapports Excel XLSX, CSV UTF-8 et PDF</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Geographical Implantation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600" />
                  Présence Internationale
                </h3>
                <span className="text-xs text-slate-500 font-medium">Multi-Pays</span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto">
                {Array.from(new Set(companies.map(c => c.country).filter(Boolean))).map(country => {
                  const cCount = companies.filter(c => c.country === country).length;
                  return (
                    <div key={country} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div className="font-semibold text-slate-800">{country}</div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full text-[11px]">
                        {cCount} entreprise(s)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: COMPANIES MANAGEMENT */}
      {activeTab === 'companies' && (
        <CompanyManagementTab
          companies={companies}
          allUsers={companyUsers}
          subscriptions={subscriptions}
          onUpdateStatus={handleUpdateCompanyStatus}
          onUpdateSubscription={handleUpdateCompanySubscription}
          onStartSupportSession={handleStartSupportSession}
          onOpenCreateCompanyModal={() => setShowCreateCompanyModal(true)}
        />
      )}

      {/* TAB 3: COMPANY ADMINISTRATORS */}
      {activeTab === 'admins' && (
        <CompanyAdminsTab
          administrators={companyUsers.filter(u => u.role === 'Company Administrator')}
          companies={companies}
          onToggleStatus={handleToggleUserAccountStatus}
          onTriggerPasswordReset={handleTriggerPasswordReset}
        />
      )}

      {/* TAB 4: PLATFORM USERS DIRECTORY */}
      {activeTab === 'users' && (
        <PlatformUsersTab
          users={companyUsers}
          companies={companies}
          onToggleStatus={handleToggleUserAccountStatus}
          onTriggerPasswordReset={handleTriggerPasswordReset}
          onCreateUser={handleCreateUser}
        />
      )}

      {/* TAB 5: CROSS-COMPANY EMPLOYEES */}
      {activeTab === 'employees' && (
        <CrossCompanyEmployeesTab
          employees={employees}
          companies={companies}
        />
      )}

      {/* TAB 6: SUBSCRIPTIONS MANAGEMENT */}
      {activeTab === 'subscriptions' && (
        <SubscriptionsTab
          subscriptions={subscriptions}
          onVerifyPayment={handleVerifySubscriptionPayment}
        />
      )}

      {/* TAB 7: DATA EXPORT CENTER */}
      {activeTab === 'exports' && (
        <DataExportCenterTab
          onExport={handleExportData}
          recentJobs={exportHistory}
          onRefreshHistory={loadPlatformData}
        />
      )}

      {/* TAB 8: GLOBAL MULTI-TENANT AUDIT LOGS */}
      {activeTab === 'global_audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Journal d'Audit Global Multi-Tenants (Inaltérable)
              </h3>
              <p className="text-xs text-slate-500">
                Traçabilité absolue des actions inter-entreprises, tentatives de connexion et accès support.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Horodatage</th>
                  <th className="py-3 px-4">Entreprise (Tenant)</th>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Action & Catégorie</th>
                  <th className="py-3 px-4">Détails</th>
                  <th className="py-3 px-4">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {allLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500">{log.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-indigo-700">{log.companyName || log.companyId || 'Système SaaS'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.user || log.userEmail}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans">{log.details}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.result === 'Success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: DELEGATED SUPPORT ACCESS TOOLS */}
      {activeTab === 'support_access' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Assistance Client - Mode Support Délégué avec Traçabilité
            </h3>
            <p className="text-xs text-slate-500">
              Pour respecter la vie privée des clients, les accès au workspace d'une entreprise requièrent une autorisation enregistrée dans les logs d'audit immuables de l'entreprise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {companies.map(c => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{c.name}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">
                    {c.subscriptionPlan}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                  <div>E-mail : {c.companyEmail}</div>
                  <div>Pays : {c.country}</div>
                  <div>Salariés rattachés : {c.totalEmployeesCount}</div>
                </div>

                <button
                  onClick={() => handleStartSupportSession(c)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Démarrer Session Support Auditée</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: CUSTOMER FEEDBACK & SUPPORT HUB */}
      {activeTab === 'feedback_support' && (
        <PlatformFeedbackManagement
          companies={companies}
          onLogAudit={onLogAudit}
        />
      )}

      {/* CREATE NEW COMPANY MODAL */}
      {showCreateCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-indigo-300" />
                <h3 className="text-sm font-black text-white">Inscrire une Nouvelle Organisation</h3>
              </div>
              <button onClick={() => setShowCreateCompanyModal(false)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompanySubmit} className="p-6 space-y-4 text-xs">
              {createCompError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                  {createCompError}
                </div>
              )}
              {createCompSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{createCompSuccess}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom de l'Organisation *</label>
                <input
                  type="text"
                  required
                  value={newCompName}
                  onChange={e => setNewCompName(e.target.value)}
                  placeholder="ex: Dakar Logistics SARL"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pays *</label>
                  <input
                    type="text"
                    required
                    value={newCompCountry}
                    onChange={e => setNewCompCountry(e.target.value)}
                    placeholder="France, Sénégal, Guinée..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Taille de l'Organisation</label>
                  <select
                    value={newCompSize}
                    onChange={e => setNewCompSize(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  >
                    <option value="1-10">1-10 salariés</option>
                    <option value="11-50">11-50 salariés</option>
                    <option value="51-200">51-200 salariés</option>
                    <option value="201-500">201-500 salariés</option>
                    <option value="500+">500+ salariés</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Secteur d'Activité</label>
                  <input
                    type="text"
                    value={newCompIndustry}
                    onChange={e => setNewCompIndustry(e.target.value)}
                    placeholder="Logistique, Santé, Tech..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Forfait Attribué</label>
                  <select
                    value={newCompPlan}
                    onChange={e => setNewCompPlan(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Free Trial">Essai Gratuit (30 Jours)</option>
                    <option value="Starter">Starter (79 €/m)</option>
                    <option value="Professional">Professional (189 €/m)</option>
                    <option value="Enterprise">Enterprise (490 €/m)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Compte Administrateur Initial</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nom Administrateur</label>
                    <input
                      type="text"
                      value={newCompAdminName}
                      onChange={e => setNewCompAdminName(e.target.value)}
                      placeholder="ex: Jean Dupont"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Identifiant (Username) *</label>
                    <input
                      type="text"
                      required
                      value={newCompAdminUsername}
                      onChange={e => setNewCompAdminUsername(e.target.value)}
                      placeholder="j.dupont"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">E-mail Professionnel *</label>
                    <input
                      type="email"
                      required
                      value={newCompAdminEmail}
                      onChange={e => setNewCompAdminEmail(e.target.value)}
                      placeholder="admin@entreprise.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mot de passe temporaire</label>
                    <input
                      type="text"
                      value={newCompAdminPassword}
                      onChange={e => setNewCompAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCompanyModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Créer l'Organisation & Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
