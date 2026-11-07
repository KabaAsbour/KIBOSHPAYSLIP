import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Building2, 
  Users, 
  CreditCard,
  HardDrive,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { ExportJobRecord } from '../../types';

interface DataExportCenterTabProps {
  onExport: (target: 'companies' | 'admins' | 'users' | 'employees' | 'subscriptions', format: 'xlsx' | 'csv' | 'pdf') => Promise<{
    downloadToken: string;
    filename: string;
    fileSize: string;
    recordCount: number;
    downloadUrl: string;
  }>;
  recentJobs?: ExportJobRecord[];
  onRefreshHistory?: () => void;
}

export const DataExportCenterTab: React.FC<DataExportCenterTabProps> = ({
  onExport,
  recentJobs = [],
  onRefreshHistory
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'companies' | 'admins' | 'users' | 'employees' | 'subscriptions'>('companies');
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportResult, setLastExportResult] = useState<{
    downloadToken: string;
    filename: string;
    fileSize: string;
    recordCount: number;
    downloadUrl: string;
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const targets = [
    {
      id: 'companies' as const,
      title: 'Registre des Entreprises',
      description: 'Coordonnées complètes, pays, secteur, forfait, dates d\'inscription et statuts contractuels.',
      icon: Building2,
      badge: 'Recommandé'
    },
    {
      id: 'admins' as const,
      title: 'Administrateurs d\'Entreprises',
      description: 'Identifiants, adresses e-mail professionnelles, statut d\'activation et état de sécurité MFA.',
      icon: ShieldCheck,
      badge: 'Audit & Sécurité'
    },
    {
      id: 'users' as const,
      title: 'Annuaire Central des Utilisateurs',
      description: 'Répertoire consolidé avec répartition par catégorie (SaaS Owner, Admin Tenant, Utilisateur Simple).',
      icon: Users,
      badge: 'Gouvernance'
    },
    {
      id: 'employees' as const,
      title: 'Registre Consolidé des Employés',
      description: 'Matricules RH, noms, départements et entreprises rattachées (Salaires strictement exclus).',
      icon: FileSpreadsheet,
      badge: 'RGPD Garanti'
    },
    {
      id: 'subscriptions' as const,
      title: 'Portefeuille des Abonnements',
      description: 'Offres souscrites, statuts, montants mensuels, dates d\'échéance et références de règlement.',
      icon: CreditCard,
      badge: 'Finance SaaS'
    }
  ];

  const handleTriggerExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setLastExportResult(null);

    try {
      const result = await onExport(selectedTarget, selectedFormat);
      setLastExportResult(result);
      if (onRefreshHistory) onRefreshHistory();

      // Trigger automatic browser download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setExportError(err.message || 'Erreur lors de la génération du fichier d\'exportation.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            Centre d'Exportation Sécurisé des Données Plateforme
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Génération serveur de rapports certifiés aux formats Excel (XLSX), CSV UTF-8 (compatible accents français) et PDF sécurisé.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshHistory && (
            <button
              onClick={onRefreshHistory}
              title="Rafraîchir l'historique"
              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Security & Data Hygiene Guarantee Notice */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900 space-y-1">
        <div className="font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Garantie de Sécurité & Filtrage Cryptographique :</span>
        </div>
        <p className="text-indigo-800 leading-relaxed">
          Toutes les exportations sont générées côté serveur avec sanitisation systématique : les mots de passe, hachages de mots de passe, clés secrètes MFA, jetons de rafraîchissement et montants salariaux individuels sont <strong>strictement purgés</strong> avant encodage. Chaque opération est consignée dans le registre d'audit immuable.
        </p>
      </div>

      {/* Export Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-3">
            1. Sélectionnez le Domaine de Données à Exporter :
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {targets.map(t => {
              const Icon = t.icon;
              const isSelected = selectedTarget === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTarget(t.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.badge}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mb-1">{t.title}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{t.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-3">
            2. Choisissez le Format de Sortie :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* XLSX */}
            <div
              onClick={() => setSelectedFormat('xlsx')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                selectedFormat === 'xlsx'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${selectedFormat === 'xlsx' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-emerald-700'}`}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">Microsoft Excel (.xlsx)</div>
                <div className="text-[11px] text-slate-500">Feuille de calcul native avec styles</div>
              </div>
            </div>

            {/* CSV */}
            <div
              onClick={() => setSelectedFormat('csv')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                selectedFormat === 'csv'
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${selectedFormat === 'csv' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-700'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">Fichier CSV UTF-8 (.csv)</div>
                <div className="text-[11px] text-slate-500">Encodage BOM pour accents français</div>
              </div>
            </div>

            {/* PDF */}
            <div
              onClick={() => setSelectedFormat('pdf')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                selectedFormat === 'pdf'
                  ? 'border-red-600 bg-red-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${selectedFormat === 'pdf' ? 'bg-red-600 text-white' : 'bg-slate-100 text-red-700'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">Document PDF Sécurisé (.pdf)</div>
                <div className="text-[11px] text-slate-500">Bannière officielle & certification</div>
              </div>
            </div>
          </div>
        </div>

        {exportError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
            {exportError}
          </div>
        )}

        {lastExportResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-emerald-950">Fichier généré avec succès !</div>
                <div className="text-emerald-800 text-[11px]">
                  {lastExportResult.filename} • {lastExportResult.fileSize} • {lastExportResult.recordCount} enregistrement(s)
                </div>
              </div>
            </div>
            <a
              href={lastExportResult.downloadUrl}
              download={lastExportResult.filename}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger à nouveau</span>
            </a>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleTriggerExport}
            disabled={isExporting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Génération du rapport en cours...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Générer et Télécharger l'Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Export Jobs History */}
      {recentJobs && recentJobs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs flex items-center justify-between">
            <span>Historique des Tâches d'Exportation Récentes</span>
            <span className="text-slate-400 font-normal">{recentJobs.length} tâche(s) enregistrée(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Fichier & Cible</th>
                  <th className="py-2.5 px-4">Format</th>
                  <th className="py-2.5 px-4">Lignes & Taille</th>
                  <th className="py-2.5 px-4">Demandé Par</th>
                  <th className="py-2.5 px-4">Horodatage</th>
                  <th className="py-2.5 px-4 text-right">Téléchargement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJobs.slice(0, 10).map(job => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {job.filename}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-slate-100 text-slate-700">
                        {job.format}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {job.recordCount} lignes • {job.fileSize}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {job.requestedBy}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {job.requestedAt.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/api/platform/export/download/${job.token}`}
                        download={job.filename}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
