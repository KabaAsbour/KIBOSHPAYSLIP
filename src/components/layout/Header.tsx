import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  LogOut, 
  ChevronDown, 
  Mail, 
  Briefcase, 
  Calendar 
} from 'lucide-react';
import { UserSession, UserRole, NotificationItem } from '../../types';

interface HeaderProps {
  currentSession: UserSession;
  onSwitchRole?: (role: UserRole) => void;
  notifications?: NotificationItem[];
  onOpenNotifications?: () => void;
  activeViewTitle: string;
  onOpenLoginModal: () => void;
  onLogout?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenHealthCheck?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  activeViewTitle,
  onOpenLoginModal,
  onLogout
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: View Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {activeViewTitle}
        </h1>
      </div>

      {/* Right: Déconnecter button & Connected User */}
      <div className="flex items-center gap-3">
        {/* Déconnecter Button */}
        <button
          onClick={onLogout || onOpenLoginModal}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-all border border-slate-200 hover:border-red-200 cursor-pointer"
          title="Se déconnecter de la session"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
          <span>Déconnecter</span>
        </button>

        {/* Connected User Badge */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
            title="Afficher les détails de l'utilisateur connecté"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {currentSession.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                {currentSession.name}
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-slate-500 font-medium text-[11px]">{currentSession.role}</div>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header: User identity */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {currentSession.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {currentSession.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{currentSession.email}</span>
                  </p>
                </div>
              </div>

              {/* Connected User Details List */}
              <div className="py-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Rôle attribué :
                  </span>
                  <span className="font-semibold text-slate-800 text-right">
                    {currentSession.role}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Organisation :
                  </span>
                  <span className="font-semibold text-blue-700 text-right">
                    {currentSession.company}
                  </span>
                </div>

                {currentSession.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Département :
                    </span>
                    <span className="font-semibold text-slate-700">
                      {currentSession.department}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Statut Sécurité :
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    MFA / TOTP Actif
                  </span>
                </div>

                {currentSession.lastLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Dernière session :
                    </span>
                    <span className="text-[11px] font-medium text-slate-600">
                      {currentSession.lastLogin}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    if (onLogout) {
                      onLogout();
                    } else {
                      onOpenLoginModal();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all border border-red-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span>Se Déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
