import React, { useEffect, useState } from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import { UserSession } from '../../types';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  countdownSeconds: number;
  onStayLoggedIn: () => void;
  onSignOut: () => void;
  inactiveMinutes?: number;
  userSession: UserSession;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  countdownSeconds,
  onStayLoggedIn,
  onSignOut,
  inactiveMinutes = 15,
  userSession
}) => {
  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${mins > 0 ? `${mins}m ` : ''}${remSec < 10 ? '0' : ''}${remSec}s`;
  };

  const progressPercentage = Math.max(0, Math.min(100, (countdownSeconds / 60) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Clock className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Alerte d'Inactivité de Session
            </h3>
            <p className="text-xs text-amber-100 font-medium">
              Inactivité de {inactiveMinutes} minutes détectée
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold">
                Pour protéger la confidentialité des données de paie de {userSession.company}...
              </p>
              <p className="text-amber-800 leading-relaxed">
                Aucune activité n'a été enregistrée au cours des <strong>{inactiveMinutes} dernières minutes</strong>. Sans réaction de votre part, vous serez automatiquement déconnecté.
              </p>
            </div>
          </div>

          {/* Countdown timer badge & progress bar */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 text-center space-y-2">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Déconnexion Automatique Dans</span>
            </div>
            
            <div className="text-3xl font-black font-mono tracking-wider text-amber-300">
              {formatSeconds(countdownSeconds)}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 font-medium">
            Session active : <strong className="text-slate-800">{userSession.name}</strong> ({userSession.email})
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onSignOut}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer w-1/2"
            >
              <LogOut className="w-4 h-4" />
              <span>Se Déconnecter</span>
            </button>

            <button
              type="button"
              onClick={onStayLoggedIn}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer w-1/2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Rester Connecté</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
