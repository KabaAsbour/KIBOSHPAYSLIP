import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Server,
  Database,
  Mail,
  ShieldCheck,
  Cpu,
  HardDrive,
  Clock,
  Layers,
  X,
  Zap,
  Info
} from 'lucide-react';
import { HealthCheckUtility, FullSystemHealthCheckResult } from '../../services/healthCheckService';

interface HealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogAudit?: (action: string, category: 'SECURITY' | 'SYSTEM' | 'SPLITTING', details: string, result?: 'Success' | 'Failed' | 'Warning') => void;
}

export const HealthCheckModal: React.FC<HealthCheckModalProps> = ({
  isOpen,
  onClose,
  onLogAudit
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<FullSystemHealthCheckResult | null>(null);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await HealthCheckUtility.runDiagnostics();
      setReport(res);
      if (onLogAudit) {
        onLogAudit(
          'HEALTH_CHECK_EXECUTION',
          'SYSTEM',
          `Diagnostic système exécuté — Score : ${res.healthScore}/100, Statut : ${res.overallStatus}`,
          res.overallStatus === 'CRITICAL' ? 'Failed' : res.overallStatus === 'DEGRADED' ? 'Warning' : 'Success'
        );
      }
    } catch (err) {
      console.error('Error running health check:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report) {
      runHealthCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = (status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OPERATIONAL' | 'UNAVAILABLE') => {
    switch (status) {
      case 'HEALTHY':
      case 'OPERATIONAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Opérationnel</span>
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Dégradé / Mode Bac à sable</span>
          </span>
        );
      case 'CRITICAL':
      case 'UNAVAILABLE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Indisponible / Critique</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                  Contrôle de Production
                </span>
                <span className="text-xs text-slate-400 font-mono">OWASP & Multi-Service Health Check</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5 tracking-tight">
                Bilan de Santé & Disponibilité des Services Système
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Header Summary & Gauge */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut Global d'Exploitation</span>
                {report && getStatusBadge(report.overallStatus)}
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                {loading ? 'Analyse des composants système en cours...' : report?.summary}
              </p>
              {report?.serverReport && (
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Uptime : {Math.floor(report.serverReport.uptimeSeconds / 60)} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    Node : {report.serverReport.nodeVersion}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-700">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    RAM : {report.serverReport.memory.heapUsedMB} MB / {report.serverReport.memory.heapTotalMB} MB
                  </span>
                </div>
              )}
            </div>

            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      report?.healthScore && report.healthScore >= 90
                        ? 'text-emerald-500'
                        : report?.healthScore && report.healthScore >= 60
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }
                    strokeDasharray={`${report ? report.healthScore : 0}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? '...' : `${report?.healthScore ?? 0}%`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Readiness</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Breakdown Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Contrôle Individuel des Services Critiques</span>
            </h3>

            {loading ? (
              <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-medium text-slate-600">
                  Vérification de la connectivité Base de Données, du serveur SMTP, du limiteur de débit et du cache Redis...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Database & Primary Storage */}
                {report?.serverReport?.components.find(c => c.category === 'database') && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">Base de Données & Stockage</span>
                      </div>
                      {getStatusBadge(report.serverReport.components.find(c => c.category === 'database')!.status)}
                    </div>
                    <p className="text-xs text-slate-600">
                      {report.serverReport.components.find(c => c.category === 'database')?.details}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1 border-t border-slate-100">
                      <span>Moteur : StorageService v2.6.4</span>
                      <span>Latence : {report.serverReport.components.find(c => c.category === 'database')?.latencyMs} ms</span>
                    </div>
                  </div>
                )}

                {/* 2. SMTP Server */}
                {report?.serverReport?.components.find(c => c.category === 'smtp') && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900">Serveur SMTP & Protections SSRF</span>
                      </div>
                      {getStatusBadge(report.serverReport.components.find(c => c.category === 'smtp')!.status)}
                    </div>
                    <p className="text-xs text-slate-600">
                      {report.serverReport.components.find(c => c.category === 'smtp')?.details}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1 border-t border-slate-100">
                      <span>TLS & SSRF : OWASP Standard</span>
                      <span>Latence : {report.serverReport.components.find(c => c.category === 'smtp')?.latencyMs} ms</span>
                    </div>
                  </div>
                )}

                {/* 3. Cache & Session Storage */}
                {report?.serverReport?.components.find(c => c.category === 'cache') && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-900">Cache Redis & Sessions</span>
                      </div>
                      {getStatusBadge(report.serverReport.components.find(c => c.category === 'cache')!.status)}
                    </div>
                    <p className="text-xs text-slate-600">
                      {report.serverReport.components.find(c => c.category === 'cache')?.details}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1 border-t border-slate-100">
                      <span>Keys en mémoire : {report.serverReport.components.find(c => c.category === 'cache')?.metrics?.cachedKeys ?? 0}</span>
                      <span>Latence : {report.serverReport.components.find(c => c.category === 'cache')?.latencyMs} ms</span>
                    </div>
                  </div>
                )}

                {/* 4. API Rate Limiter */}
                {report?.serverReport?.components.find(c => c.category === 'rate_limiter') && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-slate-900">Limiteur de Débit & Anti-DDoS</span>
                      </div>
                      {getStatusBadge(report.serverReport.components.find(c => c.category === 'rate_limiter')!.status)}
                    </div>
                    <p className="text-xs text-slate-600">
                      {report.serverReport.components.find(c => c.category === 'rate_limiter')?.details}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1 border-t border-slate-100">
                      <span>Plafond Global : 200 req / 15 min</span>
                      <span>Plafond Auth : 15 req / 15 min</span>
                    </div>
                  </div>
                )}

                {/* Client Browser Checks */}
                {report?.clientChecks.map(chk => (
                  <div key={chk.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">{chk.name}</span>
                      </div>
                      {getStatusBadge(chk.status)}
                    </div>
                    <p className="text-xs text-slate-600">{chk.details}</p>
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1 border-t border-slate-100">
                      <span>Type : Client Check</span>
                      <span>Latence : {chk.latencyMs} ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actionable Recommendations Panel */}
          {report && (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Recommandations d'Exploitation</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                {!report.serverReport?.components.find(c => c.category === 'smtp')?.metrics?.isRealSmtp && (
                  <li>
                    <strong className="text-slate-800">SMTP Envoi Réel :</strong> Renseignez le mot de passe SMTP dans les Paramètres Système pour activer la livraison réelle des bulletins par courriel.
                  </li>
                )}
                {report.serverReport?.components.find(c => c.category === 'cache')?.status === 'DEGRADED' && (
                  <li>
                    <strong className="text-slate-800">Cluster Redis :</strong> Pour la haute disponibilité sur plusieurs instances Cloud Run, fournissez l'URL d'un serveur Redis.
                  </li>
                )}
                <li>
                  <strong className="text-slate-800">OWASP Compliance :</strong> Toutes les vérifications SSRF, filtres anti-pilonnage et signatures HMAC sont activées par défaut.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Horodatage : {report ? new Date(report.timestamp).toLocaleString('fr-FR') : '—'}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={runHealthCheck}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Relancer le Diagnostic</span>
            </button>

            {report && (
              <button
                onClick={() => {
                  HealthCheckUtility.downloadHealthAuditReport(report);
                  if (onLogAudit) {
                    onLogAudit('HEALTH_REPORT_DOWNLOAD', 'SECURITY', 'Téléchargement de l’audit de disponibilité système (.JSON)', 'Success');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger Rapport (.JSON)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
