import React from 'react';
import kiboshLogo from '../../assets/images/kibosh_official_logo_1785747358174.jpg';
import { 
  LayoutDashboard, 
  FileUp, 
  Users, 
  History, 
  AlertTriangle, 
  FileBarChart2, 
  ShieldAlert, 
  Settings,
  HelpCircle,
  Sparkles,
  Lock
} from 'lucide-react';
import { UserRole, UserSession } from '../../types';
import { PermissionKey, CustomRole } from '../../types/rbac';
import { hasPermission } from '../../utils/rbac';

export type NavTab = 
  | 'dashboard'
  | 'upload'
  | 'employees'
  | 'campaigns'
  | 'failures'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'feedback'
  | 'platform_owner';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  userRole: UserRole;
  isPlatformOwner?: boolean;
  failedCount: number;
  userSession?: UserSession | null;
  customRoles?: CustomRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  isPlatformOwner = false,
  failedCount,
  userSession,
  customRoles
}) => {
  const menuItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    permission?: PermissionKey;
    requiresPlatformOwner?: boolean;
    badge?: string;
    alertBadge?: number;
    highlight?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
      permission: 'view_reports'
    },
    {
      id: 'upload',
      label: 'Nouveau Dépôt Lot',
      icon: FileUp,
      permission: 'upload_payroll_pdf',
      badge: 'Étape 1'
    },
    {
      id: 'employees',
      label: 'Annuaire Employés',
      icon: Users,
      permission: 'export_employees'
    },
    {
      id: 'campaigns',
      label: 'Campagnes & Historique',
      icon: History,
      permission: 'view_reports'
    },
    {
      id: 'failures',
      label: 'Échecs d\'Envoi',
      icon: AlertTriangle,
      permission: 'retry_failed_emails',
      alertBadge: failedCount > 0 ? failedCount : undefined
    },
    {
      id: 'reports',
      label: 'Rapports & Exports',
      icon: FileBarChart2,
      permission: 'view_reports'
    },
    {
      id: 'audit',
      label: 'Journal d\'Audit',
      icon: ShieldAlert,
      requiresPlatformOwner: true,
      permission: 'view_audit_logs'
    },
    {
      id: 'settings',
      label: 'Paramètres & Rôles',
      icon: Settings,
      permission: 'manage_company_settings'
    },
    {
      id: 'feedback',
      label: 'Support & Retours',
      icon: HelpCircle
    },
    {
      id: 'platform_owner',
      label: 'Portail Propriétaire SaaS',
      icon: Sparkles,
      requiresPlatformOwner: true,
      permission: 'manage_companies',
      highlight: true
    }
  ];

  // Filter out unauthorized menu items strictly according to RB-04 ("Unauthorized menus and actions shall not be displayed")
  const visibleMenuItems = menuItems.filter(item => {
    if (item.id === 'audit') {
      return isPlatformOwner || userRole === 'Platform Super Admin';
    }
    if (item.requiresPlatformOwner) {
      return isPlatformOwner || userRole === 'Platform Super Admin';
    }
    if (!item.permission) return true;
    return hasPermission(userRole, item.permission, userSession, customRoles);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700/80 shadow-md shadow-blue-500/20 bg-slate-900 shrink-0">
          <img 
            src={kiboshLogo} 
            alt="KIBOSH Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <div className="font-extrabold text-white tracking-wider text-base flex items-center gap-1.5 font-mono">
            KIBOSH
          </div>
          <div className="text-[11px] text-slate-400 font-medium tracking-tight">
            Plateforme Paie & RBAC
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Menu Autorisé</span>
        </div>

        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? item.highlight 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 font-bold'
                    : 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.alertBadge !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">
                  {item.alertBadge}
                </span>
              )}

              {item.badge && !item.alertBadge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Role Footer */}
      <div className="p-3 m-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Rôle Actif (RBAC)
        </div>
        <div className="font-bold text-white text-xs mt-0.5 truncate flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">{userRole}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 truncate">
          {userSession?.company || 'Espace Entreprise'}
        </div>
      </div>
    </aside>
  );
};
