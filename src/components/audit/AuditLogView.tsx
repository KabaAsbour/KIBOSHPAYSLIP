import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Download, 
  FileSpreadsheet, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Filter,
  Trash2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { AuditLog } from '../../types';
import { ExcelService } from '../../services/excelService';
import { ReportService } from '../../services/reportService';
import { StorageService } from '../../services/storageService';

interface AuditLogViewProps {
  logs: AuditLog[];
  onRefreshLogs?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onRefreshLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  const handleManualPurge = () => {
    const result = StorageService.purgeOldAuditLogs(90);
    if (result.purgedCount > 0) {
      setPurgeFeedback(`Purge réussie : ${result.purgedCount} journal(x) de plus de 90 jours supprimé(s).`);
    } else {
      setPurgeFeedback(`Tous les journaux sont à jour (${result.totalAfter} entrée(s) conservée(s) dans la fenêtre de 90 jours).`);
    }
    if (onRefreshLogs) {
      onRefreshLogs();
    }
    setTimeout(() => setPurgeFeedback(null), 5000);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesRes = resultFilter === 'all' || log.result === resultFilter;

    return matchesSearch && matchesCat && matchesRes;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            Module 14 — Journal d'Audit Inaltérable
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Journal d'Audit de Sécurité & Opérations Système
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-xs text-slate-500 max-w-2xl">
              Journal inaltérable de toutes les connexions utilisateurs, exécutions de découpes PDF, envois d'e-mails, mises à jour de configuration et événements système.
            </p>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              Rétention Automatique : 90 Jours
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleManualPurge}
            title="Purger manuellement les journaux de plus de 90 jours"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Purger (&gt;90j)</span>
          </button>
          <button
            onClick={() => ReportService.generateAuditPdfReport(logs)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger PDF d'Audit</span>
          </button>
          <button
            onClick={() => ExcelService.exportAuditLogsToExcel(logs)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exporter Excel</span>
          </button>
        </div>
      </div>

      {purgeFeedback && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{purgeFeedback}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher action, utilisateur, adresse IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 font-medium bg-slate-50 outline-none"
          >
            <option value="all">Toutes les Catégories</option>
            <option value="AUTHENTICATION">Authentification</option>
            <option value="UPLOAD">Téléversement PDF</option>
            <option value="SPLITTING">Découpe PDF</option>
            <option value="DISTRIBUTION">Distribution E-mail</option>
            <option value="EMPLOYEE">Fiche Employé</option>
            <option value="SECURITY">Config Sécurité</option>
            <option value="REPORT">Exportation Rapport</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 font-medium bg-slate-50 outline-none"
          >
            <option value="all">Tous les Résultats</option>
            <option value="Success">Succès</option>
            <option value="Warning">Avertissement</option>
            <option value="Failure">Échec</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Utilisateur & Rôle</th>
                <th className="py-3 px-4">Adresse IP</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Événement Action</th>
                <th className="py-3 px-4">Résultat</th>
                <th className="py-3 px-4">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{log.user}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{log.userRole}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{log.ipAddress}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{log.action}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                      log.result === 'Success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : log.result === 'Warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {log.result === 'Success' ? <CheckCircle2 className="w-3 h-3" /> : log.result === 'Warning' ? <AlertTriangle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{log.result === 'Success' ? 'Succès' : log.result === 'Warning' ? 'Avertissement' : 'Échec'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
