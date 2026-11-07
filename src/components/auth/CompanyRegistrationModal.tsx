import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Briefcase,
  Sparkles,
  Users,
  Calendar,
  Clock,
  KeyRound
} from 'lucide-react';
import { CompanyTenant, CompanyUser, UserSession, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';

interface CompanyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess: (company: CompanyTenant, user: CompanyUser, session: UserSession) => void;
  onOpenLogin?: () => void;
  currentUserSession?: UserSession | null;
}

export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistrationSuccess,
  onOpenLogin,
  currentUserSession
}) => {
  const isCurrentSuperAdmin = Boolean(
    currentUserSession?.isPlatformOwner || 
    currentUserSession?.role === 'Platform Super Admin' ||
    currentUserSession?.email?.toLowerCase() === 'dkamdkamcbg@gmail.com' ||
    currentUserSession?.email?.toLowerCase() === 'devperso140@gmail.com' ||
    currentUserSession?.username?.toLowerCase() === 'ama1234'
  );

  const [superAdminAuthCode, setSuperAdminAuthCode] = useState('');
  const [superAdminUnlocked, setSuperAdminUnlocked] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Company Information & App Access Time Limit
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState<'1-10' | '11-50' | '51-200' | '201-500' | '500+'>('11-50');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('Guinée (Conakry)');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState<CompanyTenant['subscriptionPlan']>('Professional');
  const [durationPreset, setDurationPreset] = useState<'30' | '90' | '180' | '365' | 'custom' | 'unlimited'>('90');
  const [customExpirationDate, setCustomExpirationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });

  // Step 2: Account Information (First User / Company Admin Default Password)
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [jobPosition, setJobPosition] = useState('Directeur / Responsable RH');
  const [adminRole, setAdminRole] = useState<UserRole>('Company Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [confirmPassword, setConfirmPassword] = useState('Password123!');
  const [forcePasswordChangeOnFirstLogin, setForcePasswordChangeOnFirstLogin] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isAuthorized = isCurrentSuperAdmin || superAdminUnlocked;

  const handleVerifySuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (superAdminAuthCode.trim() === '1234' || superAdminAuthCode.trim().toLowerCase() === 'admin123' || superAdminAuthCode.trim() === '123456') {
      setSuperAdminUnlocked(true);
    } else {
      setErrorMsg('Code d\'autorisation Super Admin incorrect (utilisez 1234 pour l\'environnement démo).');
    }
  };

  // Password Policy meter validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasNumber && hasSpecial;

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!companyName.trim()) {
      setErrorMsg('Veuillez saisir le nom de l\'entreprise.');
      return;
    }
    if (!companyEmail.trim() || !companyEmail.includes('@')) {
      setErrorMsg('Veuillez fournir un e-mail d\'entreprise valide.');
      return;
    }

    // Auto-fill admin email & phone if empty
    if (!adminEmail) {
      setAdminEmail(companyEmail);
    }
    if (!adminPhone && companyPhone) {
      setAdminPhone(companyPhone);
    }

    setStep(2);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Veuillez renseigner le nom d\'utilisateur (Username).');
      return;
    }

    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setErrorMsg('Veuillez renseigner une adresse e-mail valide.');
      return;
    }

    if (!adminPhone.trim()) {
      setErrorMsg('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    if (!companyName.trim()) {
      setErrorMsg('Veuillez renseigner le nom de l\'entreprise.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Le mot de passe par défaut ne respecte pas la politique de sécurité requise (min. 8 caractères, majuscule, chiffre, symbole).');
      return;
    }

    // Compute expiration date
    let expirationIso: string | undefined = undefined;
    let durationDays: number | undefined = undefined;
    if (durationPreset === 'unlimited') {
      expirationIso = undefined;
      durationDays = undefined;
    } else if (durationPreset === 'custom') {
      expirationIso = customExpirationDate ? `${customExpirationDate}T23:59:59` : undefined;
    } else {
      const days = parseInt(durationPreset, 10);
      durationDays = days;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      expirationIso = `${targetDate.toISOString().split('T')[0]}T23:59:59`;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const result = StorageService.registerCompany(
          {
            name: companyName,
            size: companySize,
            industry: industry || 'Général',
            country: country,
            companyEmail: companyEmail || adminEmail,
            companyPhone: companyPhone || adminPhone,
            subscriptionPlan: subscriptionPlan,
            accessExpiresAt: expirationIso,
            accessDurationDays: durationDays,
            defaultPassword: password
          },
          {
            fullName: fullName || username,
            username: username.trim(),
            jobPosition: jobPosition || 'Company Administrator',
            email: adminEmail.trim().toLowerCase(),
            phone: adminPhone.trim(),
            phoneNumber: adminPhone.replace(/\D/g, ''),
            password: password,
            defaultPassword: password,
            mustChangePassword: forcePasswordChangeOnFirstLogin
          }
        );

        setIsSubmitting(false);
        onRegistrationSuccess(result.company, result.user, result.session);
        onClose();
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMsg('Une erreur est survenue lors de la création de l\'entreprise.');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Création d'Entreprise & Déploiement Utilisateur
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Réservé Super Admin SaaS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Seul le Propriétaire Plateforme SaaS (Super Admin) est autorisé à créer des entreprises et leurs utilisateurs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthorized ? (
          /* Super Admin Authorization Check Screen */
          <div className="p-6 space-y-5">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <div className="font-bold text-sm text-amber-950">
                  Autorisation Super Admin Requise
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Conformément à la politique d'isolation et de gouvernance KIBOSH, <strong>seul le Propriétaire Plateforme SaaS (Super Admin)</strong> a le privilège de créer des nouvelles entreprises (Tenants) et de leur provisionner un premier compte utilisateur.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifySuperAdmin} className="space-y-4 max-w-md mx-auto py-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Code d'Autorisation ou Mot de Passe Super Admin</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Saisissez le code d'accès Super Admin (ex. 1234)"
                  value={superAdminAuthCode}
                  onChange={(e) => setSuperAdminAuthCode(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Environnement de démonstration : Utilisez le code <strong>1234</strong> (ou connectez-vous avec <em>devperso140@gmail.com</em>).
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Valider Autorisation</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Wizard Steps Indicator */}
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 font-bold ${step === 1 ? 'text-blue-700' : 'text-slate-500'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>
                    1
                  </span>
                  <span>Informations Entreprise</span>
                </div>

                <div className="w-8 h-0.5 bg-slate-300 rounded-full hidden sm:block" />

                <div className={`flex items-center gap-2 font-bold ${step === 2 ? 'text-blue-700' : 'text-slate-500'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>
                    2
                  </span>
                  <span>Compte Utilisateur Entreprise</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Super Admin Authentifié</span>
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6">
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

          {step === 1 ? (
            <form onSubmit={handleNextStep1} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Company Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nom de l'Entreprise *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Kibosh Global Banking, AcroTech Digital"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Company Size */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Taille de l'Effectif *</span>
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  >
                    <option value="1-10">1 - 10 Salariés (Très Petite Entreprise)</option>
                    <option value="11-50">11 - 50 Salariés (PME)</option>
                    <option value="51-200">51 - 200 Salariés (Moyenne Entreprise)</option>
                    <option value="201-500">201 - 500 Salariés (Grande Entreprise)</option>
                    <option value="500+">Plus de 500 Salariés (Groupe / Multinationale)</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pays d'Implantation *</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  >
                    <option value="Guinée (Conakry)">Guinée (Conakry)</option>
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Cameroun">Cameroun</option>
                    <option value="France">France</option>
                    <option value="Canada">Canada</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Maroc">Maroc</option>
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>Secteur d'Activité (Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex. Banque, IT, Logistique, Santé"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Company Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Téléphone Général (Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex. +33 1 40 50 60 70"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Company Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>E-mail Officiel Entreprise / RH *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@votre-entreprise.com"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* SaaS Subscription & App Usage Limit */}
                <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Durée de Validité & Limite d'Accès à l'Application *</span>
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Verrouillage Automatique à l'Échéance
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      { id: '30', label: '30 Jours' },
                      { id: '90', label: '90 Jours' },
                      { id: '180', label: '6 Mois' },
                      { id: '365', label: '1 An' },
                      { id: 'custom', label: 'Date Précise' },
                      { id: 'unlimited', label: 'Illimité' }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setDurationPreset(opt.id as any)}
                        className={`py-2 px-2 text-center rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          durationPreset === opt.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {durationPreset === 'custom' && (
                    <div className="pt-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-600">Date de verrouillage automatique :</span>
                      <input
                        type="date"
                        required
                        value={customExpirationDate}
                        onChange={(e) => setCustomExpirationDate(e.target.value)}
                        className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 leading-normal">
                    À expiration de cette durée, le compte de l'entreprise sera automatiquement verrouillé et les sessions seront bloquées jusqu'au renouvellement par le Super Admin.
                  </p>
                </div>

              </div>

              {/* Automatic Configuration Preview */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Provisionnement Automatique Inclus</span>
                </div>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  La création de votre entreprise générera automatiquement votre Espace Client (Tenant), vos rôles par défaut, les règles d'extraction OCR de paie et votre coffre-fort chiffré de 5 GB.
                </p>
              </div>

              {/* Submit / Next Button */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>Étape Suivante : Créer l'Administrateur</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Admin Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nom & Prénom Administrateur *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Claire Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Identifiant / Nom d'Utilisateur *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex. c.dupont.admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Job Position */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fonction / Poste *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex. DRH, Responsable Paie"
                    value={jobPosition}
                    onChange={(e) => setJobPosition(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Adresse E-mail Administrateur *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="claire.dupont@entreprise.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Numéro de Téléphone *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="ex. +33 6 12 34 56 78"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Default Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      <span>Mot de Passe Temporaire / Par Défaut *</span>
                    </span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Confirmer le Mot de Passe *</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

              </div>

              {/* Force Password Change on First Login setting */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={forcePasswordChangeOnFirstLogin}
                    onChange={(e) => setForcePasswordChangeOnFirstLogin(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-amber-900 block">
                      Obliger le changement de mot de passe à la 1ère connexion
                    </span>
                    <span className="text-[11px] text-amber-800 leading-tight block">
                      L'administrateur se connectera avec ce mot de passe par défaut, puis le système lui imposera immédiatement de définir son propre mot de passe sécurisé.
                    </span>
                  </div>
                </label>
              </div>

              {/* Password Policy Meter Checklist */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Exigences de Sécurité du Mot de Passe par Défaut (Argon2 / bcrypt)</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Au moins 8 caractères</span>
                  </div>

                  <div className={`flex items-center gap-1.5 font-medium ${hasUpper ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${hasUpper ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Au moins 1 majuscule</span>
                  </div>

                  <div className={`flex items-center gap-1.5 font-medium ${hasNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Au moins 1 chiffre</span>
                  </div>

                  <div className={`flex items-center gap-1.5 font-medium ${hasSpecial ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${hasSpecial ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Au moins 1 symbole spécial</span>
                  </div>
                </div>
              </div>

              {/* Automatic Role Notice */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Role Automatique Attribué : Administrateur Entreprise (Company Administrator).</strong>
                  <p className="mt-0.5 text-amber-800">
                    En tant que premier utilisateur inscrit, vous aurez le contrôle total sur la gestion des utilisateurs, l'import des salariés, les campagnes de paie et la configuration SMTP de <strong>{companyName || 'votre entreprise'}</strong>.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour Étape 1</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Déploiement en cours...</span>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4" />
                        <span>Créer le Compte Entreprise & Connexion</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>
        </>
      )}

      </div>
    </div>
  );
};
