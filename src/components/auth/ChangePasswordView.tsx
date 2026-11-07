import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  User, 
  LogOut, 
  ArrowRight, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import kiboshLogo from '../../assets/images/kibosh_official_logo_1785747358174.jpg';
import { UserSession } from '../../types';
import { StorageService } from '../../services/storageService';

interface ChangePasswordViewProps {
  currentSession: UserSession;
  onPasswordChanged: (updatedSession: UserSession) => void;
  onLogout: () => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({
  currentSession,
  onPasswordChanged,
  onLogout
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password policy criteria checks
  const criteria = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword
  };

  const validCriteriaCount = Object.values(criteria).filter(Boolean).length;
  const isFormValid = criteria.length && criteria.upper && criteria.lower && criteria.number && criteria.special && criteria.match;

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return { label: 'Requis', color: 'bg-slate-200 text-slate-500', width: 'w-0' };
    if (validCriteriaCount <= 2) return { label: 'Faible', color: 'bg-red-500 text-red-700', width: 'w-1/4' };
    if (validCriteriaCount <= 4) return { label: 'Moyen', color: 'bg-amber-500 text-amber-700', width: 'w-2/4' };
    if (validCriteriaCount === 5) return { label: 'Fort', color: 'bg-blue-500 text-blue-700', width: 'w-3/4' };
    return { label: 'Excellent', color: 'bg-emerald-500 text-emerald-700', width: 'w-full' };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isFormValid) {
      setErrorMsg('Veuillez respecter l\'ensemble des critères de sécurité du mot de passe.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update in storage service for company users
      StorageService.updateUserPassword(currentSession.id, newPassword);
      StorageService.updateUserPassword(currentSession.email, newPassword);

      // Create updated session with forcePasswordChange cleared
      const updatedSession: UserSession = {
        ...currentSession,
        forcePasswordChange: false,
        mustChangePassword: false,
        lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      StorageService.saveCurrentUserSession(updatedSession);

      // Add audit log
      StorageService.addAuditLog({
        companyId: currentSession.companyId,
        companyName: currentSession.company,
        user: currentSession.name,
        userRole: currentSession.role,
        ipAddress: '192.168.1.50',
        action: 'PASSWORD_CHANGE_MANDATORY_COMPLETED',
        category: 'SECURITY',
        details: `Changement de mot de passe obligatoire effectué avec succès par ${currentSession.name} (${currentSession.email}). Accès déverrouillé.`,
        result: 'Success'
      });

      setIsSubmitting(false);
      onPasswordChanged(updatedSession);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg('Une erreur inattendue est survenue lors de la mise à jour du mot de passe.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Top Branding Card */}
        <div className="text-center mb-6">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-3.5 rounded-3xl bg-slate-800/90 border border-slate-700/90 shadow-xl shadow-black/30 backdrop-blur-md mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-600 bg-slate-950 shrink-0 p-1.5 ring-4 ring-blue-500/20 flex items-center justify-center">
              <img 
                src={kiboshLogo} 
                alt="KIBOSH Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xl font-black text-white tracking-wider font-mono flex items-center justify-center sm:justify-start gap-2">
                <span>KIBOSH</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SaaS Paie
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">
                Plateforme de Fiches de Paie Sécurisées
              </div>
              <div className="text-[11px] text-blue-400 font-semibold mt-0.5">
                Distribution & Découpage Automatisé
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            Changement de Mot de Passe Obligatoire
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Pour garantir l'intégrité et la conformité de vos fiches de paie, vous devez définir un nouveau mot de passe personnel avant d'accéder à la plateforme.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 overflow-hidden">
          
          {/* User Account Context Box */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {currentSession.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentSession.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {currentSession.email}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>{currentSession.company}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {currentSession.role}
              </span>
            </div>
          </div>

          {/* Security Notice Banner */}
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Accès restreint temporaire :</span> L'accès aux fonctionnalités, documents et tableaux de bord est bloqué jusqu'à la mise en conformité de vos identifiants.
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Current Password Field (Optional / Informational) */}
            <div>
              <label 
                htmlFor="current-password-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Mot de passe actuel / temporaire
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="current-password-input"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe temporaire"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? 'Masquer le mot de passe actuel' : 'Afficher le mot de passe actuel'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="new-password-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                {newPassword.length > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    validCriteriaCount >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Force : {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Définissez un mot de passe robuste"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Progress Bar */}
              {newPassword.length > 0 && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      validCriteriaCount <= 2 ? 'bg-red-500 w-1/4' :
                      validCriteriaCount <= 4 ? 'bg-amber-500 w-2/4' :
                      validCriteriaCount === 5 ? 'bg-blue-500 w-3/4' : 'bg-emerald-500 w-full'
                    }`} 
                  />
                </div>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label 
                htmlFor="confirm-password-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez votre nouveau mot de passe"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Policy Checklist */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Exigences de Sécurité KIBOSH
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className={`flex items-center gap-1.5 ${criteria.length ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${criteria.length ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Au moins 8 caractères</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.upper ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${criteria.upper ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Une lettre majuscule (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.lower ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${criteria.lower ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Une lettre minuscule (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.number ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${criteria.number ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Au moins un chiffre (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.special ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${criteria.special ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Un caractère spécial (@, #, $, ...)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.match ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${criteria.match ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Mots de passe identiques</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onLogout}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Déconnexion</span>
              </button>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                  isFormValid && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mise à jour en cours...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Valider et Déverrouiller mon Accès</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chiffrement AES-256</span>
          </span>
          <span>•</span>
          <span>Protection des données de paie</span>
          <span>•</span>
          <span>Multi-Tenant isolé</span>
        </div>
      </div>
    </div>
  );
};
