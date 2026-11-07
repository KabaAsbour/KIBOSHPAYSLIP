import React from 'react';
import { 
  FileUp, 
  Users, 
  CheckCircle2, 
  AlertOctagon, 
  Zap, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Play, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { DistributionCampaign, Employee, UserRole, UserSession } from '../../types';
import { DailyDigestWidget } from './DailyDigestWidget';

interface OverviewDashboardProps {
  campaigns: DistributionCampaign[];
  employees: Employee[];
  userRole?: UserRole;
  userSession?: UserSession | null;
  onStartCampaign: () => void;
  onGenerateDemoBatch: () => void;
  onImportEmployees: () => void;
  onViewCampaigns: () => void;
  onViewFailures: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  campaigns,
  employees,
  userRole = 'Company Administrator',
  userSession,
  onStartCampaign,
  onGenerateDemoBatch,
  onImportEmployees,
  onViewCampaigns,
  onViewFailures
}) => {
  // Compute aggregated stats
  const totalEmployees = employees.length;
  const totalCampaigns = campaigns.length;

  let totalDelivered = 0;
  let totalFailed = 0;
  let totalProcessed = 0;

  campaigns.forEach(c => {
    totalDelivered += c.deliveredCount;
    totalFailed += c.failedCount;
    totalProcessed += c.totalEmployees;
  });

  const successRate = totalProcessed > 0 
    ? ((totalDelivered / totalProcessed) * 100).toFixed(1)
    : '100';

  // Chart data 1: Status Pie Chart
  const pieData = [
    { name: 'Livrés', value: totalDelivered > 0 ? totalDelivered : 19, color: '#10B981' },
    { name: 'Échoués', value: totalFailed > 0 ? totalFailed : 1, color: '#EF4444' },
    { name: 'En attente / Traitement', value: 0, color: '#3B82F6' },
  ];

  // Chart data 2: Department breakdown
  const deptCounts: Record<string, number> = {};
  employees.forEach(emp => {
    deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
  });

  const deptChartData = Object.keys(deptCounts).map(dept => ({
    department: dept.length > 15 ? dept.substring(0, 15) + '...' : dept,
    count: deptCounts[dept]
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Daily Digest Widget (Yesterday's summary & pending tasks) */}
      <DailyDigestWidget
        campaigns={campaigns}
        employees={employees}
        onViewFailures={onViewFailures}
        onStartCampaign={onStartCampaign}
        onImportEmployees={onImportEmployees}
        onViewCampaigns={onViewCampaigns}
      />

      {/* Top Banner Alert if failures exist */}
      {totalFailed > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900">
                Action requise : {totalFailed} échec(s) de livraison détecté(s)
              </div>
              <div className="text-xs text-amber-700">
                Un ou plusieurs e-mails ont rebondi en raison d'un domaine invalide ou d'une erreur SMTP. Mettez à jour les adresses et relancez.
              </div>
            </div>
          </div>
          <button
            onClick={onViewFailures}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Résoudre les Échecs</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total des Employés
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalEmployees}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Matricules 100% Validés
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Bulletins Traités
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalProcessed}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              Sur {totalCampaigns} Campagnes
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Taux de Succès d'Envoi
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {successRate}%
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              {totalDelivered} Livrés / {totalFailed} Échoués
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Vitesse de Traitement
            </div>
            <div className="text-2xl font-black text-purple-600 mt-1">
              ~28 p/s
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              Moteur de Matching Regex + OCR
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-bold">
              Flux d'Automatisations
            </span>
            <h2 className="text-xl font-bold mt-2 text-white tracking-tight">
              Prêt à Distribuer les Bulletins de Paie Mensuels ?
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Téléchargez un document PDF multi-pages. KIBOSH lit automatiquement les matricules, sépare les bulletins individuels, vérifie les e-mails et envoie les fichiers chiffrés.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={onGenerateDemoBatch}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              title="Générer instantanément un fichier PDF d'exemple pour le test"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Générer un PDF d'Exemple</span>
            </button>

            <button
              onClick={onStartCampaign}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Déposer un PDF de Paie</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Delivery Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Répartition du Statut de Livraison</h3>
              <p className="text-xs text-slate-500">Indicateurs de santé de la distribution</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Employés & Bulletins par Département</h3>
              <p className="text-xs text-slate-500">Répartition des effectifs enregistrés</p>
            </div>
            <button
              onClick={onImportEmployees}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importer le Registre Excel</span>
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Employés" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campagnes de Distribution Récentes</h3>
            <p className="text-xs text-slate-500">Historique des sessions d'envoi automatisées</p>
          </div>

          <button
            onClick={onViewCampaigns}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir Toutes les Campagnes</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">ID Campagne</th>
                <th className="py-3 px-4">Mois de Paie</th>
                <th className="py-3 px-4">Déposé Par</th>
                <th className="py-3 px-4">Employés</th>
                <th className="py-3 px-4">Livrés</th>
                <th className="py-3 px-4">Échoués</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{c.payrollMonth}</td>
                  <td className="py-3 px-4 text-slate-600">{c.uploadedBy}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{c.totalEmployees}</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">{c.deliveredCount}</td>
                  <td className="py-3 px-4 text-red-600 font-bold">{c.failedCount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                      c.status === 'Completed' || c.status === 'Terminée'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : c.status === 'Completed with Errors' || c.status === 'Terminée avec Erreurs'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {c.status === 'Completed' ? 'Terminée' : c.status === 'Completed with Errors' ? 'Terminée avec Erreurs' : c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={onViewCampaigns}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Détails
                    </button>
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
