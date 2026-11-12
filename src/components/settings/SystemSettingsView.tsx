import React, { useState } from 'react';
import { 
  Settings, 
  Mail, 
  ShieldCheck, 
  Code, 
  Save, 
  Check, 
  Server, 
  Lock, 
  Plus, 
  Trash2,
  RefreshCw,
  Sliders,
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  HelpCircle,
  MessageSquare,
  Phone,
  ExternalLink,
  Send,
  Users,
  Globe,
  Coins,
  Calculator,
  FileCheck,
  Building2,
  Download,
  HardDriveUpload,
  FileJson,
  X,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { EmailSettings, ExtractionRule, PasswordPolicy, WhatsAppSettings, UserSession, AuditLog, RegionSettings } from '../../types';
import { TenantUserManagementTab } from './TenantUserManagementTab';
import { HealthCheckModal } from './HealthCheckModal';
import { StorageService } from '../../services/storageService';

export const REGIONAL_PRESETS: { [key: string]: RegionSettings } = {
  GN: {
    countryCode: 'GN',
    countryName: 'Guinée (Conakry)',
    currencyCode: 'GNF',
    currencySymbol: 'FG',
    taxRegime: 'Code du Travail Guinéen & RTS (Retenue sur Traitements et Salaires / CNSS)',
    defaultTaxRate: 10.0,
    employerSocialRate: 18.0,
    locale: 'fr-GN',
    timeZone: 'Africa/Conakry',
    legalFramework: 'Code du Travail de la République de Guinée & CNSS',
    minWage: 550000
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    currencyCode: 'EUR',
    currencySymbol: '€',
    taxRegime: 'Code du Travail & PAS (Prélèvement à la Source - CSG/CRDS)',
    defaultTaxRate: 12.5,
    employerSocialRate: 28.0,
    locale: 'fr-FR',
    timeZone: 'Europe/Paris',
    legalFramework: 'RGPD & Code du Travail Français (Droit de la Paie)',
    minWage: 1766.92
  },
  CI: {
    countryCode: 'CI',
    countryName: 'Côte d\'Ivoire (UEMOA)',
    currencyCode: 'XOF',
    currencySymbol: 'FCFA',
    taxRegime: 'Code du Travail CI & Impôt sur Traitements et Salaires (ITS/CNPS)',
    defaultTaxRate: 8.5,
    employerSocialRate: 18.5,
    locale: 'fr-CI',
    timeZone: 'Africa/Abidjan',
    legalFramework: 'OHADA & Code du Travail Ivoirien',
    minWage: 75000
  },
  SN: {
    countryCode: 'SN',
    countryName: 'Sénégal (UEMOA)',
    currencyCode: 'XOF',
    currencySymbol: 'FCFA',
    taxRegime: 'Code du Travail SN & Impôt sur le Revenu (IR/IPRES/CSS)',
    defaultTaxRate: 10.0,
    employerSocialRate: 19.0,
    locale: 'fr-SN',
    timeZone: 'Africa/Dakar',
    legalFramework: 'OHADA & Code du Travail Sénégalais',
    minWage: 64223
  },
  CM: {
    countryCode: 'CM',
    countryName: 'Cameroun (CEMAC)',
    currencyCode: 'XAF',
    currencySymbol: 'FCFA',
    taxRegime: 'Code du Travail CM & IRPP / CNPS / Crédit Foncier',
    defaultTaxRate: 11.0,
    employerSocialRate: 16.5,
    locale: 'fr-CM',
    timeZone: 'Africa/Douala',
    legalFramework: 'CEMAC & Code du Travail Camerounais',
    minWage: 60000
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    currencyCode: 'USD',
    currencySymbol: '$',
    taxRegime: 'IRS Federal & State Income Tax Withholding (FICA/FUTA)',
    defaultTaxRate: 15.0,
    employerSocialRate: 7.65,
    locale: 'en-US',
    timeZone: 'America/New_York',
    legalFramework: 'FLSA & IRS Tax Regulations',
    minWage: 2400
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currencyCode: 'GBP',
    currencySymbol: '£',
    taxRegime: 'HMRC PAYE & National Insurance Contributions (NI)',
    defaultTaxRate: 20.0,
    employerSocialRate: 13.8,
    locale: 'en-GB',
    timeZone: 'Europe/London',
    legalFramework: 'HMRC & UK Employment Rights Act',
    minWage: 1950
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada (Québec / Fédéral)',
    currencyCode: 'CAD',
    currencySymbol: '$',
    taxRegime: 'Agence du Revenu du Canada (CRA) & Revenu Québec (EI/CPP/QPP)',
    defaultTaxRate: 15.0,
    employerSocialRate: 12.5,
    locale: 'fr-CA',
    timeZone: 'America/Montreal',
    legalFramework: 'Code Canadien du Travail & CRA Compliance',
    minWage: 2600
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Deutschland (EU)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    taxRegime: 'Lohnsteuer & Sozialversicherung (GKV/PV/RV/AV)',
    defaultTaxRate: 18.0,
    employerSocialRate: 20.0,
    locale: 'de-DE',
    timeZone: 'Europe/Berlin',
    legalFramework: 'DSGVO & Arbeitsrecht Deutschland',
    minWage: 2080
  }
};

interface SystemSettingsViewProps {
  settings: EmailSettings;
  rules: ExtractionRule[];
  currentSession: UserSession;
  onSaveSettings: (settings: EmailSettings) => void;
  onSaveRules: (rules: ExtractionRule[]) => void;
  onLogAudit: (action: string, category: AuditLog['category'], details: string, result?: AuditLog['result']) => void;
  onClose?: () => void;
  onHasChangesChange?: (hasChanges: boolean) => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  settings: initialSettings,
  rules: initialRules,
  currentSession,
  onSaveSettings,
  onSaveRules,
  onLogAudit,
  onClose,
  onHasChangesChange
}) => {
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<'users' | 'smtp' | 'password_policy' | 'extraction_rules' | 'region'>('users');
  const [settings, setSettings] = useState<EmailSettings>(initialSettings);
  const [regionSettings, setRegionSettings] = useState<RegionSettings>(
    initialSettings.regionSettings || REGIONAL_PRESETS.GN || REGIONAL_PRESETS.FR
  );
  const [simulatedGrossSalary, setSimulatedGrossSalary] = useState<number>(3500000);
  const [rules, setRules] = useState<ExtractionRule[]>(initialRules);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasSignificantChanges, setHasSignificantChanges] = useState(false);
  const [showBackupPromptModal, setShowBackupPromptModal] = useState(false);
  const [showHealthCheckModal, setShowHealthCheckModal] = useState(false);

  // Email test dispatch state
  const [testRecipientEmail, setTestRecipientEmail] = useState(initialSettings.senderEmail || currentSession.email || 'admin@enterprise-corp.com');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{ success: boolean; message: string } | null>(null);

  // WhatsApp test state
  const [testWhatsAppPhone, setTestWhatsAppPhone] = useState('+33612345678');
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [testWhatsAppStatus, setTestWhatsAppStatus] = useState<{ success: boolean; message: string; waMeLink?: string } | null>(null);

  // Password Complexity Policy State
  const [policy, setPolicy] = useState<PasswordPolicy>(
    initialSettings.passwordPolicy || {
      minLength: 8,
      requireNumbers: true,
      requireSpecialChars: true,
      requireUppercase: true,
      defaultFormat: 'Matricule',
      customSaltPrefix: 'ENT-'
    }
  );

  // Password Tester State
  const [candidatePassword, setCandidatePassword] = useState('EMP000245#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);

  // Regex testing tool
  const [testSampleText, setTestSampleText] = useState('EMPLOYEE MATRICULE: EMP000245 \nFull Name: Alexandre Dubois');
  const [testRegexPattern, setTestRegexPattern] = useState('(?:MATRICULE|EMPLOYEE ID|EMP ID|MAT|ID)\\s*[:#-]?\\s*([A-Z]{3}\\d{6}|\\d{6})');
  const [testResult, setTestResult] = useState<string | null>(null);

  // Password complexity checks evaluation
  const evalLength = candidatePassword.length >= policy.minLength;
  const evalNumber = !policy.requireNumbers || /\d/.test(candidatePassword);
  const evalSpecial = !policy.requireSpecialChars || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(candidatePassword);
  const evalUppercase = !policy.requireUppercase || /[A-Z]/.test(candidatePassword);

  const isPasswordValid = evalLength && evalNumber && evalSpecial && evalUppercase;

  // Calculate Strength Score (0 to 100)
  const calculateStrengthScore = (): { score: number; label: string; color: string } => {
    let score = 0;
    if (candidatePassword.length >= policy.minLength) score += 30;
    if (candidatePassword.length >= policy.minLength + 4) score += 15;
    if (/\d/.test(candidatePassword)) score += 20;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(candidatePassword)) score += 20;
    if (/[A-Z]/.test(candidatePassword)) score += 15;

    if (score < 40) return { score, label: 'Faible', color: 'bg-rose-500 text-rose-700' };
    if (score < 70) return { score, label: 'Moyen', color: 'bg-amber-500 text-amber-700' };
    if (score < 90) return { score, label: 'Fort', color: 'bg-blue-600 text-blue-700' };
    return { score, label: 'Qualité Entreprise', color: 'bg-emerald-600 text-emerald-700' };
  };

  const strength = calculateStrengthScore();

  const handleGenerateSamplePassword = () => {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*#';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';

    let res = 'EMP';
    if (policy.requireUppercase) res += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    if (policy.requireNumbers) res += '987' + numberChars[Math.floor(Math.random() * numberChars.length)];
    if (policy.requireSpecialChars) res += specialChars[Math.floor(Math.random() * specialChars.length)];
    res += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];

    // Ensure min length requirement
    while (res.length < policy.minLength) {
      res += numberChars[Math.floor(Math.random() * numberChars.length)];
    }

    setCandidatePassword(res);
  };

  const handleTestRegex = () => {
    try {
      const reg = new RegExp(testRegexPattern, 'i');
      const match = testSampleText.match(reg);
      if (match) {
        setTestResult(`SUCCÈS CORRESPONDANCE ! Groupe Extrait : "${match[1] || match[0]}"`);
      } else {
        setTestResult('AUCUNE CORRESPONDANCE TROUVÉE avec le motif indiqué.');
      }
    } catch (e: any) {
      setTestResult(`Erreur Regex : ${e.message}`);
    }
  };

  const handleSaveAll = () => {
    const updatedSettings: EmailSettings = {
      ...settings,
      passwordPolicy: policy,
      regionSettings: regionSettings
    };
    onSaveSettings(updatedSettings);
    onSaveRules(rules);
    onLogAudit('REGION_SETTINGS_UPDATE', 'SECURITY', `Mise à jour de la configuration régionale : ${regionSettings.countryName} (${regionSettings.currencyCode} ${regionSettings.currencySymbol}) — Régime : ${regionSettings.taxRegime}`, 'Success');
    setSavedSuccess(true);
    setHasSignificantChanges(true);
    if (onHasChangesChange) onHasChangesChange(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const filename = StorageService.downloadSystemBackup(currentSession.email);
    onLogAudit('SYSTEM_BACKUP_EXPORT', 'SECURITY', `Exportation réussie de la sauvegarde JSON de configuration système : ${filename}`, 'Success');
    setHasSignificantChanges(false);
    if (onHasChangesChange) onHasChangesChange(false);
  };

  const handleCloseAttempt = () => {
    if (hasSignificantChanges) {
      setShowBackupPromptModal(true);
    } else if (onClose) {
      onClose();
    }
  };

  const handleAddRule = () => {
    const newRule: ExtractionRule = {
      id: `rule-${Date.now()}`,
      name: 'Motif Regex Personnalisé',
      regexPattern: '\\b[A-Z]{3}\\d{6}\\b',
      searchLocation: 'Header',
      ocrFallback: true,
      minConfidence: 90,
      isDefault: false
    };
    setRules([...rules, newRule]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {currentSession.company} — Paramètres Entreprise & Sécurité
            </span>
            {hasSignificantChanges && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 animate-pulse">
                <HardDriveUpload className="w-3 h-3 text-amber-600" />
                Sauvegarde Requise
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Administration du Tenant & Configuration Système
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Gérez les comptes utilisateurs de l'entreprise, le relais SMTP, le chiffrement des PDF et les règles d'extraction OCR.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <button
            onClick={() => setShowHealthCheckModal(true)}
            title="Lancer le diagnostic de disponibilité des services (Database, SMTP, Rate Limiter, Redis)"
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Audit de Santé (Live)</span>
          </button>

          <button
            onClick={handleDownloadBackup}
            title="Exporter la sauvegarde JSON de l'état système"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FileJson className="w-4 h-4 text-amber-400" />
            <span>Sauvegarde (.JSON)</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Paramètres Enregistrés !' : 'Enregistrer la Configuration'}</span>
          </button>

          {onClose && (
            <button
              onClick={handleCloseAttempt}
              title="Quitter les paramètres système"
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Fermer</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSettingsSubTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSettingsSubTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestion Utilisateurs & Rôles (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveSettingsSubTab('smtp')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSettingsSubTab === 'smtp' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Serveur SMTP & Canaux</span>
        </button>

        <button
          onClick={() => setActiveSettingsSubTab('password_policy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSettingsSubTab === 'password_policy' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Chiffrement PDF & Mots de Passe</span>
        </button>

        <button
          onClick={() => setActiveSettingsSubTab('region')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSettingsSubTab === 'region' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-400" />
          <span>Région & Fiscalité Localisée</span>
        </button>

        <button
          onClick={() => setActiveSettingsSubTab('extraction_rules')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSettingsSubTab === 'extraction_rules' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Règles Regex PDF</span>
        </button>
      </div>

      {/* Sub-Tab 1: Tenant Users Management */}
      {activeSettingsSubTab === 'users' && (
        <TenantUserManagementTab currentSession={currentSession} onLogAudit={onLogAudit} />
      )}

      {/* Sub-Tab 3: Password Complexity Policy & Live Interactive Validator */}
      {activeSettingsSubTab === 'password_policy' && (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Politique de Complexité & Sécurité des Mots de Passe PDF
              </h3>
              <p className="text-xs text-slate-500">
                Appliquez les règles de mots de passe lors du chiffrement des bulletins PDF individuels envoyés aux employés.
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            Conforme RGPD & AES-256
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: HR Password Rule Configuration Controls */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Paramètres des Règles de Complexité</span>
              </h4>

              {/* Minimum Length */}
              <div>
                <div className="flex justify-between items-center mb-1 font-bold text-slate-700">
                  <label htmlFor="min-length-input">Longueur Minimale du Mot de Passe</label>
                  <span className="font-mono text-blue-700 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                    {policy.minLength} Caractères
                  </span>
                </div>
                <input
                  id="min-length-input"
                  type="range"
                  min={6}
                  max={24}
                  value={policy.minLength}
                  onChange={(e) => setPolicy({ ...policy, minLength: parseInt(e.target.value) || 8 })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>6 car. (Basique)</span>
                  <span>12 car. (Recommandé)</span>
                  <span>24 car. (Max)</span>
                </div>
              </div>

              {/* Requirements checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
                  <span className="font-semibold text-slate-800">Exiger un Chiffre Numérique (0-9)</span>
                  <input
                    type="checkbox"
                    checked={policy.requireNumbers}
                    onChange={(e) => setPolicy({ ...policy, requireNumbers: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
                  <span className="font-semibold text-slate-800">Exiger un Caractère Spécial (!@#$%^&*)</span>
                  <input
                    type="checkbox"
                    checked={policy.requireSpecialChars}
                    onChange={(e) => setPolicy({ ...policy, requireSpecialChars: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
                  <span className="font-semibold text-slate-800">Exiger une Majuscule (A-Z)</span>
                  <input
                    type="checkbox"
                    checked={policy.requireUppercase}
                    onChange={(e) => setPolicy({ ...policy, requireUppercase: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Password Format Strategy */}
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block font-bold text-slate-700 mb-1">Format de Génération du Mot de Passe</label>
                <select
                  value={policy.defaultFormat}
                  onChange={(e) => setPolicy({ ...policy, defaultFormat: e.target.value as any })}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 font-medium bg-white"
                >
                  <option value="Matricule">Code Matricule de l'Employé (ex: EMP000245)</option>
                  <option value="Birthdate">Date de Naissance de l'Employé (AAAAMMJJ)</option>
                  <option value="Custom">Prefixe Salt RH + Matricule (ex: ENT-EMP000245#)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Password Tester & Real-time Validation Engine */}
          <div className="lg:col-span-7 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Validateur Interactif de Mots de Passe en Temps Réel</span>
              </h4>

              <button
                onClick={handleGenerateSamplePassword}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Générer un Exemple Conforme</span>
              </button>
            </div>

            {/* Candidate Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-400 font-semibold">Chaine du Mot de Passe à Tester</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={candidatePassword}
                  onChange={(e) => setCandidatePassword(e.target.value)}
                  placeholder="Tapez le mot de passe à valider..."
                  className="w-full px-3 py-2 pr-20 rounded-lg bg-slate-950 border border-slate-700 font-mono text-sm text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(candidatePassword);
                      setCopiedSample(true);
                      setTimeout(() => setCopiedSample(false), 2000);
                    }}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Copier dans le presse-papier"
                  >
                    {copiedSample ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Strength Meter Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-400 font-sans">Niveau de Robustesse de Sécurité :</span>
                <span className={`font-mono font-bold ${
                  strength.score >= 90 ? 'text-emerald-400' : strength.score >= 70 ? 'text-blue-400' : strength.score >= 40 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {strength.label} ({strength.score}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    strength.score >= 90 ? 'bg-emerald-500' : strength.score >= 70 ? 'bg-blue-500' : strength.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>

            {/* Criteria Validation Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {/* Length Rule */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                evalLength ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  {evalLength ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>Min. {policy.minLength} Caractères</span>
                </div>
                <span className="font-mono text-[11px]">({candidatePassword.length}/{policy.minLength})</span>
              </div>

              {/* Number Rule */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                evalNumber ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  {evalNumber ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>Chiffre Numérique (0-9)</span>
                </div>
                <span className="font-mono text-[10px]">{policy.requireNumbers ? 'Requis' : 'Optionnel'}</span>
              </div>

              {/* Special Chars Rule */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                evalSpecial ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  {evalSpecial ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>Caractère Spécial (!@#$)</span>
                </div>
                <span className="font-mono text-[10px]">{policy.requireSpecialChars ? 'Requis' : 'Optionnel'}</span>
              </div>

              {/* Uppercase Rule */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                evalUppercase ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  {evalUppercase ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>Lettre Majuscule (A-Z)</span>
                </div>
                <span className="font-mono text-[10px]">{policy.requireUppercase ? 'Requis' : 'Optionnel'}</span>
              </div>
            </div>

            {/* Validation Outcome Alert Card */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
              isPasswordValid
                ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-900/40 border-rose-500/40 text-rose-200'
            }`}>
              {isPasswordValid ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  {isPasswordValid
                    ? 'VALIDE : Répond aux exigences de la politique de mot de passe RH & Sécurité'
                    : 'INVALIDE : Le mot de passe ne respecte pas les exigences de sécurité configurées'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {isPasswordValid
                    ? 'Ce format de mot de passe assure la conformité au chiffrement PDF AES-256.'
                    : 'Ajustez la longueur du mot de passe ou incluez les chiffres et symboles requis.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Sub-Tab 2: SMTP & WhatsApp Settings */}
      {activeSettingsSubTab === 'smtp' && (

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: SMTP Email Server Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Serveur d'Envoi E-mail SMTP</span>
            </h3>

            <button
              type="button"
              id="test-smtp-connection-btn"
              onClick={async () => {
                setIsTestingEmail(true);
                setTestEmailStatus(null);
                const recipient = testRecipientEmail || settings.senderEmail || 'admin@enterprise-corp.com';
                try {
                  const res = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      to: recipient,
                      subject: '[Test Connexion SMTP] KIBOSH Payroll Distribution',
                      text: `Bonjour Administrateur,\n\nCeci est un message de confirmation automatique pour valider le bon fonctionnement de votre serveur SMTP (${settings.smtpHost}:${settings.smtpPort}).\n\n- Expéditeur: ${settings.senderEmail || 'paie@enterprise-corp.com'}\n- Date de Test: ${new Date().toLocaleString('fr-FR')}\n\nLe système KIBOSH est prêt pour la distribution des bulletins de paie.`,
                      fromEmail: settings.senderEmail || 'paie@enterprise-corp.com',
                      fromName: settings.senderName || 'KIBOSH Service Paie System',
                      smtpSettings: settings
                    })
                  });
                  // Safe response parsing: Check raw text before JSON parsing
                  const rawText = await res.text();
                  if (!rawText || !rawText.trim()) {
                    throw new Error(`Le serveur d'envoi a renvoyé une réponse vide (Code HTTP ${res.status} ${res.statusText || ''})`);
                  }

                  let data: any;
                  try {
                    data = JSON.parse(rawText);
                  } catch {
                    throw new Error(`Format de réponse non valide (Code HTTP ${res.status}): ${rawText.slice(0, 150)}`);
                  }

                  if (res.ok && data.success) {
                    setTestEmailStatus({
                      success: true,
                      message: `Connexion validée ! E-mail de test envoyé à ${recipient} avec succès (${data.note || 'Service d\'envoi opérationnel'}).`
                    });
                  } else {
                    setTestEmailStatus({
                      success: false,
                      message: data.error || data.message || `Échec de la connexion ou rejet du message par le serveur (Code HTTP ${res.status}).`
                    });
                  }
                } catch (e: any) {
                  setTestEmailStatus({
                    success: false,
                    message: e.message || 'Erreur réseau lors du test de connexion.'
                  });
                } finally {
                  setIsTestingEmail(false);
                }
              }}
              disabled={isTestingEmail}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isTestingEmail ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{isTestingEmail ? 'Test en cours...' : 'Test SMTP Connection'}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Hôte Serveur SMTP</label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Port</label>
                <input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Adresse E-mail de l'Expéditeur</label>
              <input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value, smtpUser: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom d'utilisateur SMTP</label>
                <input
                  type="text"
                  value={settings.smtpUser ?? settings.senderEmail}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  placeholder="ex: paie@enterprise-corp.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mot de Passe SMTP / App Password
                </label>
                <input
                  type="password"
                  value={settings.smtpPass || ''}
                  onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                  placeholder="Mot de passe d'application (16 caractères)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            {/* Quick Provider Presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Fournisseurs SMTP Prédéfinis</label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    smtpHost: 'smtp.gmail.com',
                    smtpPort: 587,
                    useTLS: true
                  })}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                    settings.smtpHost === 'smtp.gmail.com'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Gmail (smtp.gmail.com)
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    smtpHost: 'smtp-relay.brevo.com',
                    smtpPort: 587,
                    useTLS: true
                  })}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                    settings.smtpHost === 'smtp-relay.brevo.com'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Brevo / Sendinblue
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    smtpHost: 'smtp.sendgrid.net',
                    smtpPort: 587,
                    useTLS: true
                  })}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                    settings.smtpHost === 'smtp.sendgrid.net'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  SendGrid
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    smtpHost: 'smtp.office365.com',
                    smtpPort: 587,
                    useTLS: true
                  })}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                    settings.smtpHost === 'smtp.office365.com'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Outlook / Office 365
                </button>
              </div>
            </div>

            {/* Gmail App Password Step-by-Step Resolution Box */}
            <div className="p-4 bg-amber-50/90 rounded-xl border border-amber-300 text-amber-950 text-xs space-y-2.5 shadow-2xs">
              <div className="font-bold flex items-center gap-2 text-amber-900 border-b border-amber-200/80 pb-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-sm">Pourquoi l'erreur « Le paramètre n'est pas disponible pour votre compte » s'affiche ?</span>
              </div>

              <p className="leading-relaxed text-slate-800 font-medium">
                Google masque la page des <strong>Mots de passe d'application</strong> si la <strong>Validation en deux étapes (2FA)</strong> n'est pas activée sur votre compte Gmail.
              </p>

              <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2 font-medium text-slate-800">
                <div className="font-bold text-slate-900 text-xs">Procédure simple en 3 étapes pour débloquer Gmail :</div>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                  <li>
                    Activez la <strong>Validation en 2 étapes</strong> sur votre compte Google :{' '}
                    <a
                      href="https://myaccount.google.com/signinoptions/two-step-verification"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      Activer la 2FA Google ↗
                    </a>
                  </li>
                  <li>
                    Une fois la 2FA active, retournez sur la page des Mots de passe d'application :{' '}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      Créer le Mot de passe d'application Google ↗
                    </a>
                  </li>
                  <li>
                    Tapez <strong>« KIBOSH Paie »</strong> comme nom d'application, puis copiez le code à <strong>16 lettres</strong> généré et collez-le ci-dessus dans la case <em>« Mot de Passe SMTP / App Password »</em>.
                  </li>
                </ol>
              </div>

              <div className="text-[11px] text-amber-800 flex items-center justify-between pt-1">
                <span>💡 Sans mot de passe d'application, les e-mails sont générés et testés en mode simulation sécurisé (sans échec de campagne).</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom d'Affichage de l'Expéditeur</label>
              <input
                type="text"
                value={settings.senderName}
                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Limite d'Envoi (E-mails/Min)</label>
                <input
                  type="number"
                  value={settings.throttleRatePerMin}
                  onChange={(e) => setSettings({ ...settings, throttleRatePerMin: parseInt(e.target.value) || 120 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tentatives Max de Réessai</label>
                <input
                  type="number"
                  value={settings.maxRetries}
                  onChange={(e) => setSettings({ ...settings, maxRetries: parseInt(e.target.value) || 3 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700">Appliquer le Chiffrement TLS/SSL</span>
              <input
                type="checkbox"
                checked={settings.useTLS}
                onChange={(e) => setSettings({ ...settings, useTLS: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>

            {/* Test Email Dispatch Tool */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Tester l'envoi direct d'e-mail</span>
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={testRecipientEmail}
                  onChange={(e) => setTestRecipientEmail(e.target.value)}
                  placeholder="Adresse e-mail destinataire (ex: admin@enterprise-corp.com)"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingEmail(true);
                    setTestEmailStatus(null);
                    try {
                      const res = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          to: testRecipientEmail,
                          subject: 'Test de Configuration SMTP KIBOSH',
                          text: 'Ceci est un message de test envoyé depuis le système de distribution de fiches de paie KIBOSH.',
                          fromEmail: settings.senderEmail || 'paie@enterprise-corp.com',
                          fromName: settings.senderName || 'KIBOSH Service Paie System',
                          smtpSettings: settings
                        })
                      });
                      // Safe response parsing: Check raw text before JSON parsing
                      const rawText = await res.text();
                      if (!rawText || !rawText.trim()) {
                        throw new Error(`Le serveur d'envoi a renvoyé une réponse vide (Code HTTP ${res.status} ${res.statusText || ''})`);
                      }

                      let data: any;
                      try {
                        data = JSON.parse(rawText);
                      } catch {
                        throw new Error(`Format de réponse non valide (Code HTTP ${res.status}): ${rawText.slice(0, 150)}`);
                      }

                      if (res.ok && data.success) {
                        if (data.isRealSmtp) {
                          setTestEmailStatus({
                            success: true,
                            message: `✅ E-mail réel envoyé à ${testRecipientEmail} ! (${data.note || 'Livraison confirmée'})`
                          });
                        } else {
                          setTestEmailStatus({
                            success: false,
                            message: `⚠️ Mode simulation : ${data.note || 'L\'envoi est validé en interne, mais aucun e-mail réel n\'est transmis tant que RESEND_API_KEY ou les identifiants SMTP ne sont pas configurés.'}`
                          });
                        }
                      } else {
                        setTestEmailStatus({
                          success: false,
                          message: data.error || data.message || `Échec de l'envoi du message (Code HTTP ${res.status})`
                        });
                      }
                    } catch (e: any) {
                      setTestEmailStatus({
                        success: false,
                        message: e.message || 'Erreur lors de l\'envoi'
                      });
                    } finally {
                      setIsTestingEmail(false);
                    }
                  }}
                  disabled={isTestingEmail || !testRecipientEmail}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {isTestingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>{isTestingEmail ? 'Envoi...' : 'Envoyer Test'}</span>
                </button>
              </div>

              {testEmailStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  testEmailStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testEmailStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                  <span>{testEmailStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 1B: WhatsApp Business API & Channel Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Paramètres WhatsApp Business & Distribution</span>
            </h3>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                settings.whatsappSettings?.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {settings.whatsappSettings?.enabled ? 'Actif' : 'Simulé / Standard'}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Activer l'envoi WhatsApp</div>
                <div className="text-[11px] text-slate-500">Autorise l'envoi direct de fiches de paie sur WhatsApp</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsappSettings?.enabled ?? true}
                  onChange={(e) => {
                    const ws = settings.whatsappSettings || {
                      enabled: true,
                      provider: 'meta_cloud',
                      defaultChannel: 'Both',
                      defaultTemplateName: 'payslip_notification'
                    };
                    setSettings({ ...settings, whatsappSettings: { ...ws, enabled: e.target.checked } });
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fournisseur API WhatsApp</label>
                <select
                  value={settings.whatsappSettings?.provider || 'meta_cloud'}
                  onChange={(e) => {
                    const ws = settings.whatsappSettings || { enabled: true, provider: 'meta_cloud', defaultChannel: 'Both' };
                    setSettings({ ...settings, whatsappSettings: { ...ws, provider: e.target.value as any } });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                >
                  <option value="meta_cloud">Meta Cloud API (Officiel WhatsApp)</option>
                  <option value="twilight_gateway">GateWay WhatsApp Entreprise (SMS/WA)</option>
                  <option value="custom_webhook">Custom Webhook HTTP / Simulation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ID du Numéro WhatsApp (Phone ID)</label>
                <input
                  type="text"
                  placeholder="e.g. 1048204928194"
                  value={settings.whatsappSettings?.phoneNumberId || ''}
                  onChange={(e) => {
                    const ws = settings.whatsappSettings || { enabled: true, provider: 'meta_cloud', defaultChannel: 'Both' };
                    setSettings({ ...settings, whatsappSettings: { ...ws, phoneNumberId: e.target.value } });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jeton d'Accès Permanent / Access Token Meta</label>
              <input
                type="password"
                placeholder="EAAG... (Jeton d'accès Meta WhatsApp Cloud)"
                value={settings.whatsappSettings?.accessToken || ''}
                onChange={(e) => {
                  const ws = settings.whatsappSettings || { enabled: true, provider: 'meta_cloud', defaultChannel: 'Both' };
                  setSettings({ ...settings, whatsappSettings: { ...ws, accessToken: e.target.value } });
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            {/* Test WhatsApp sending panel */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block font-bold text-slate-700">Tester l'envoi d'un message WhatsApp</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="+33612345678"
                  value={testWhatsAppPhone}
                  onChange={(e) => setTestWhatsAppPhone(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingWhatsApp(true);
                    setTestWhatsAppStatus(null);
                    try {
                      const res = await fetch('/api/send-whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          phone: testWhatsAppPhone,
                          employeeName: 'Jean Dupont (Test Administrateur)',
                          payrollMonth: 'Juillet 2026',
                          netPay: 2850.50,
                          whatsappSettings: settings.whatsappSettings
                        })
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        setTestWhatsAppStatus({
                          success: true,
                          message: `Message WhatsApp expédié avec succès à ${testWhatsAppPhone} !`,
                          waMeLink: data.waMeLink
                        });
                      } else {
                        setTestWhatsAppStatus({
                          success: false,
                          message: data.error || 'Erreur lors de l\'envoi du message WhatsApp.'
                        });
                      }
                    } catch (e: any) {
                      setTestWhatsAppStatus({
                        success: false,
                        message: e.message || 'Erreur réseau lors de l\'envoi WhatsApp.'
                      });
                    } finally {
                      setIsTestingWhatsApp(false);
                    }
                  }}
                  disabled={isTestingWhatsApp || !testWhatsAppPhone}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {isTestingWhatsApp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  <span>{isTestingWhatsApp ? 'Envoi...' : 'Tester WhatsApp'}</span>
                </button>
              </div>

              {testWhatsAppStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold space-y-1 ${
                  testWhatsAppStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {testWhatsAppStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    <span>{testWhatsAppStatus.message}</span>
                  </div>
                  {testWhatsAppStatus.waMeLink && (
                    <div className="pt-1">
                      <a
                        href={testWhatsAppStatus.waMeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 underline text-[11px] font-bold"
                      >
                        <span>Ouvrir la conversation WhatsApp directe (wa.me)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Guide Card for WhatsApp Configuration */}
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2 mt-3">
              <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>Guide de Configuration WhatsApp (2 Options Disponibles) :</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900 leading-relaxed font-medium">
                <li>
                  <strong>Option A — Envoi automatique en masse via Meta Cloud API :</strong>
                  <ul className="list-disc list-inside ml-4 text-emerald-800 space-y-0.5 mt-0.5">
                    <li>Rendez-vous sur <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-700">Meta for Developers</a> et créez une application Business.</li>
                    <li>Dans la section <strong>WhatsApp &gt; API Setup</strong>, copiez le <strong>Phone Number ID</strong> et le <strong>System User Access Token</strong>.</li>
                    <li>Collez-les ci-dessus dans "ID du Numéro WhatsApp" et "Access Token Meta".</li>
                  </ul>
                </li>
                <li>
                  <strong>Option B — Mode WhatsApp Web / Click-to-Chat (Sans configuration requise) :</strong>
                  <ul className="list-disc list-inside ml-4 text-emerald-800 space-y-0.5 mt-0.5">
                    <li>Si les champs API restent vides, l'application génère automatiquement des liens de discussion directe (<code>wa.me/&lt;numéro&gt;</code>) avec le message et le lien PDF préremplis.</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Sub-Tab: Region Configuration & Localized Tax Laws */}
      {activeSettingsSubTab === 'region' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Configuration Régionale, Devise & Régime Fiscal Localisé
                </h3>
                <p className="text-xs text-slate-500">
                  Définissez la juridiction fiscale de l'entreprise, le symbole monétaire, les taux de retenues à la source et le cadre légal de conformité.
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
              Juridiction Active : {regionSettings.countryName} ({regionSettings.currencyCode} {regionSettings.currencySymbol})
            </span>
          </div>

          {/* Presets Quick Selector Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Présélections Régionales Prédéfinies (Gabarits Juridiques) :</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(REGIONAL_PRESETS).map(([key, preset]) => {
                const isSelected = regionSettings.countryCode === preset.countryCode;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRegionSettings({ ...preset })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{preset.countryName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {preset.currencyCode} {preset.currencySymbol}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-1">
                      {preset.taxRegime}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields & Live Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Region Configuration Inputs */}
            <div className="lg:col-span-7 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Détails de la Juridiction Fiscale</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pays / Territoire</label>
                    <input
                      type="text"
                      value={regionSettings.countryName}
                      onChange={(e) => setRegionSettings({ ...regionSettings, countryName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Code Pays ISO (2 lettres)</label>
                    <input
                      type="text"
                      value={regionSettings.countryCode}
                      onChange={(e) => setRegionSettings({ ...regionSettings, countryCode: e.target.value.toUpperCase() })}
                      maxLength={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Devise ISO (ex: EUR, XOF, USD)</label>
                    <input
                      type="text"
                      value={regionSettings.currencyCode}
                      onChange={(e) => setRegionSettings({ ...regionSettings, currencyCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Symbole Monétaire (ex: €, FCFA, $)</label>
                    <input
                      type="text"
                      value={regionSettings.currencySymbol}
                      onChange={(e) => setRegionSettings({ ...regionSettings, currencySymbol: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Régime Fiscal de la Paie & Retenues à la Source</label>
                  <input
                    type="text"
                    value={regionSettings.taxRegime}
                    onChange={(e) => setRegionSettings({ ...regionSettings, taxRegime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Taux d'Impôt Salarial Moy. (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={regionSettings.defaultTaxRate}
                      onChange={(e) => setRegionSettings({ ...regionSettings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cotisations Patronales (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={regionSettings.employerSocialRate}
                      onChange={(e) => setRegionSettings({ ...regionSettings, employerSocialRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Format Locale (ex: fr-FR, en-US)</label>
                    <input
                      type="text"
                      value={regionSettings.locale}
                      onChange={(e) => setRegionSettings({ ...regionSettings, locale: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Salaire Minimum Légal (SMIC / SMIG)</label>
                    <input
                      type="number"
                      value={regionSettings.minWage}
                      onChange={(e) => setRegionSettings({ ...regionSettings, minWage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cadre Réglementaire & Norme de Conformité</label>
                  <input
                    type="text"
                    value={regionSettings.legalFramework}
                    onChange={(e) => setRegionSettings({ ...regionSettings, legalFramework: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Regional Tax Calculator & Preview */}
            <div className="lg:col-span-5 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <span>Simulateur de Paie & Fiscalité Régionale</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                    Calcul Temps Réel
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                    Salaire Brut à Simuler ({regionSettings.currencyCode} {regionSettings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={simulatedGrossSalary}
                    onChange={(e) => setSimulatedGrossSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-base text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Calculations Summary Card */}
                {(() => {
                  const gross = simulatedGrossSalary;
                  const taxAmount = gross * (regionSettings.defaultTaxRate / 100);
                  const employerSocial = gross * (regionSettings.employerSocialRate / 100);
                  const netPay = gross - taxAmount;

                  const formatVal = (num: number) => {
                    const isZeroDecimal = regionSettings.currencyCode === 'GNF';
                    try {
                      const fmt = new Intl.NumberFormat(regionSettings.locale, {
                        minimumFractionDigits: isZeroDecimal ? 0 : 2,
                        maximumFractionDigits: isZeroDecimal ? 0 : 2
                      }).format(num);
                      return regionSettings.currencyCode === 'XOF' || regionSettings.currencyCode === 'XAF' || regionSettings.currencyCode === 'GNF'
                        ? `${fmt} ${regionSettings.currencySymbol}`
                        : `${regionSettings.currencySymbol} ${fmt}`;
                    } catch {
                      return `${num.toLocaleString()} ${regionSettings.currencySymbol}`;
                    }
                  };

                  const isAboveMinWage = gross >= regionSettings.minWage;

                  return (
                    <div className="space-y-3 pt-2 text-xs">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Salaire Brut de Base :</span>
                          <span className="font-mono font-bold text-white">{formatVal(gross)}</span>
                        </div>

                        <div className="flex justify-between items-center text-rose-300">
                          <span>Impôts & Retenue ({regionSettings.defaultTaxRate}%) :</span>
                          <span className="font-mono font-bold">- {formatVal(taxAmount)}</span>
                        </div>

                        <div className="flex justify-between items-center text-amber-300 text-[11px] border-t border-slate-800/80 pt-1.5">
                          <span>Charges Patronales ({regionSettings.employerSocialRate}%) :</span>
                          <span className="font-mono font-bold">+ {formatVal(employerSocial)}</span>
                        </div>

                        <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-slate-800 pt-2 text-sm">
                          <span>Net à Payer Estimé :</span>
                          <span className="font-mono">{formatVal(netPay)}</span>
                        </div>
                      </div>

                      {/* Minimum Wage Check Badge */}
                      <div className={`p-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-2 ${
                        isAboveMinWage
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                      }`}>
                        {isAboveMinWage ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        <span>
                          {isAboveMinWage
                            ? `Conforme au salaire minimum local (Min: ${formatVal(regionSettings.minWage)})`
                            : `Attention : Inférieur au salaire minimum légal (${formatVal(regionSettings.minWage)})`}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-500/30 text-blue-200 text-[11px] leading-relaxed mt-4">
                <div className="font-bold text-blue-300 mb-1 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Impact sur le Module de Rapports & d'Exportation :</span>
                </div>
                Les rapports PDF et tableurs Excel générés appliqueront automatiquement les règles de formatage monétaire <strong>({regionSettings.currencyCode} {regionSettings.currencySymbol})</strong> et les filtres de la juridiction fiscale <strong>{regionSettings.countryName}</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: PDF Extraction Rules & Live Tester */}
      {activeSettingsSubTab === 'extraction_rules' && (
      <div className="space-y-6">
        {/* Section 2: PDF Extraction Rules */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-600" />
              <span>Règles d'Extraction PDF & Regex</span>
            </h3>
            <button
              onClick={handleAddRule}
              className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une Règle</span>
            </button>
          </div>

          <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
            {rules.map((rule, idx) => (
              <div key={rule.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[idx].name = e.target.value;
                      setRules(updated);
                    }}
                    className="font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-purple-600 outline-none w-2/3"
                  />
                  {rules.length > 1 && (
                    <button
                      onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Motif Regex</label>
                  <input
                    type="text"
                    value={rule.regexPattern}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[idx].regexPattern = e.target.value;
                      setRules(updated);
                    }}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regex Rule Live Tester */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Testeur en Direct du Motif d'Extraction Regex</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">En-tête de Texte Exemple du PDF</label>
              <textarea
                rows={4}
                value={testSampleText}
                onChange={(e) => setTestSampleText(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Motif Regex à Tester</label>
              <input
                type="text"
                value={testRegexPattern}
                onChange={(e) => setTestRegexPattern(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs mb-3"
              />

              <button
                onClick={handleTestRegex}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Lancer le Testeur Regex</span>
              </button>

              {testResult && (
                <div className={`mt-3 p-3 rounded-lg text-xs font-mono font-bold border ${
                  testResult.includes('SUCCÈS') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {testResult}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Quality-of-life System Configuration Backup Prompt Modal */}
      {showBackupPromptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 font-bold">
                <HardDriveUpload className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
                    Sauvegarde Recommandée
                  </span>
                  <span className="text-xs text-slate-400 font-mono">JSON Backup</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Télécharger la Sauvegarde de Configuration ?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vous avez enregistré des modifications importantes de la configuration système (SMTP, Région & Fiscalité, Sécurité PDF, Règles Regex ou Rôles RBAC). Souhaitez-vous télécharger une copie de sauvegarde au format JSON avant de quitter ?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Dernière Modification :</span>
                <span className="font-bold text-slate-800">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auteur de la Session :</span>
                <span className="font-bold text-slate-800">{currentSession.fullName} ({currentSession.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Format d'Exportation :</span>
                <span className="font-bold font-mono text-blue-700">JSON KIBOSH v2.6.4</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handleDownloadBackup();
                  setShowBackupPromptModal(false);
                  if (onClose) onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger Sauvegarde (.JSON)</span>
              </button>

              <button
                onClick={() => {
                  setHasSignificantChanges(false);
                  if (onHasChangesChange) onHasChangesChange(false);
                  setShowBackupPromptModal(false);
                  if (onClose) onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Quitter sans Sauvegarder
              </button>

              <button
                onClick={() => setShowBackupPromptModal(false)}
                className="w-full sm:w-auto px-3.5 py-2.5 text-slate-400 hover:text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Check Diagnostics Modal */}
      <HealthCheckModal
        isOpen={showHealthCheckModal}
        onClose={() => setShowHealthCheckModal(false)}
        onLogAudit={onLogAudit}
      />
    </div>
  );
};

