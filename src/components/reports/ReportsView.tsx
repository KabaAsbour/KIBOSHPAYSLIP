import React, { useState } from 'react';
import { 
  FileBarChart2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar,
  Users,
  Globe,
  Coins,
  Calculator,
  Filter,
  Building2,
  PieChart
} from 'lucide-react';
import { DistributionCampaign, Employee, AuditLog, EmailSettings, RegionSettings } from '../../types';
import { ReportService } from '../../services/reportService';
import { ExcelService } from '../../services/excelService';
import { REGIONAL_PRESETS } from '../settings/SystemSettingsView';

interface ReportsViewProps {
  campaigns: DistributionCampaign[];
  employees: Employee[];
  auditLogs: AuditLog[];
  settings?: EmailSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  campaigns,
  employees,
  auditLogs,
  settings
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id || '');
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>(
    settings?.regionSettings?.countryCode || 'GN'
  );
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('ALL');

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  // Resolve current active region settings
  const currentRegion: RegionSettings = REGIONAL_PRESETS[selectedRegionKey] || settings?.regionSettings || REGIONAL_PRESETS.GN || REGIONAL_PRESETS.FR;

  // Filter records based on selected department filter
  const filteredRecords = activeCampaign ? activeCampaign.records.filter(r => {
    if (selectedDepartmentFilter !== 'ALL' && r.department.toUpperCase() !== selectedDepartmentFilter.toUpperCase()) {
      return false;
    }
    return true;
  }) : [];

  // Unique departments for filter dropdown
  const departments = Array.from(new Set(employees.map(e => e.department))).filter(Boolean);

  // Financial calculations formatted for region
  const totalNetPay = filteredRecords.reduce((acc, r) => acc + r.netPay, 0);
  const taxRate = currentRegion.defaultTaxRate || 12.5;
  const socialRate = currentRegion.employerSocialRate || 28.0;

  const estGrossPay = totalNetPay / (1 - taxRate / 100);
  const estTaxWithheld = estGrossPay * (taxRate / 100);
  const estEmployerSocial = estGrossPay * (socialRate / 100);

  const formatCurr = (val: number) => ReportService.formatCurrency(val, currentRegion);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Module 12 — Moteur de Rapports & d'Exportation
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-600" />
              Juridiction Fiscale : {currentRegion.countryName} ({currentRegion.currencyCode} {currentRegion.currencySymbol})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Rapports de Conformité, d'Audit & de Fiscalité Régionalisée
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Générez des synthèses exécutives officielles en PDF et des tableaux de données Excel brutes filtrées selon le régime fiscal et la devise du territoire sélectionné.
          </p>
        </div>
      </div>

      {/* Regional Filtering & Configuration Control Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Barre de Filtrage Régional & Paramètres de Fiscalité Localisée
            </h3>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Régime : <span className="text-emerald-400 font-bold">{currentRegion.taxRegime}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Region / Country Selector */}
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Secteur Juridique & Pays :</span>
            </label>
            <select
              value={selectedRegionKey}
              onChange={(e) => setSelectedRegionKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-bold text-white outline-none focus:border-blue-500 cursor-pointer"
            >
              {Object.entries(REGIONAL_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.countryName} — Devise: {preset.currencyCode} ({preset.currencySymbol})
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Selector */}
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campagne de Paie :</span>
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.payrollMonth} ({c.totalEmployees} Employés)
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Département Organisationnel :</span>
            </label>
            <select
              value={selectedDepartmentFilter}
              onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-bold text-white outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="ALL">Tous les Départements (Vue Globale)</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Regional Payroll KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Masse Salariale Brute Est.</span>
            <div className="text-sm font-bold font-mono text-white mt-0.5">{formatCurr(estGrossPay)}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-rose-300 uppercase font-semibold">Impôts Retenus ({taxRate}%)</span>
            <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">{formatCurr(estTaxWithheld)}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-amber-300 uppercase font-semibold">Charges Patronales ({socialRate}%)</span>
            <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">{formatCurr(estEmployerSocial)}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-emerald-300 uppercase font-semibold">Total Net Distribuable</span>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{formatCurr(totalNetPay)}</div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report Card 1: Regional Tax & Social Contributions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <PieChart className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rapport Régional d'Imposition & Cotisations Sociales
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calcul détaillé des retenues à la source, cotisations patronales, salaires bruts et conformité SMIC/SMIG selon la juridiction <strong>{currentRegion.countryName}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Campagne Active :</span>
                <span className="font-bold text-slate-900">{activeCampaign?.id} ({activeCampaign?.payrollMonth})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Régime de Retenue :</span>
                <span className="font-bold text-slate-900">{currentRegion.taxRegime}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Législation Légal :</span>
                <span className="font-bold text-slate-900">{currentRegion.legalFramework}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
            {activeCampaign && (
              <>
                <button
                  onClick={() => ReportService.generateRegionalTaxPdfReport(activeCampaign, currentRegion)}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Rapport PDF Fiscal</span>
                </button>

                <button
                  onClick={() => ExcelService.exportRegionalTaxReport(activeCampaign, currentRegion)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Excel Détaillé</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Report Card 2: Campaign Distribution Audit Report */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rapport d'Audit de Campagne de Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Métadonnées détaillées, statistiques de livraison, statut des bulletins des employés et blocs de validation.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Employés Filtrés :</span>
                <span className="font-bold text-slate-900">{filteredRecords.length} / {activeCampaign?.totalEmployees || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Devise Régionale :</span>
                <span className="font-bold text-slate-900">{currentRegion.currencyCode} ({currentRegion.currencySymbol})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taux de Succès :</span>
                <span className="font-bold text-emerald-700">
                  {activeCampaign ? Math.round((activeCampaign.deliveredCount / activeCampaign.totalEmployees) * 100) : 100}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
            {activeCampaign && (
              <>
                <button
                  onClick={() => ReportService.generateCampaignPdfReport(activeCampaign, currentRegion)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Rapport PDF Campagne</span>
                </button>

                <button
                  onClick={() => ExcelService.exportCampaignReport(activeCampaign, currentRegion)}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exporter Excel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Report Card 3: Employee Master Roster */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Annuaire Master des Employés & Registre E-mail</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Liste complète des employés enregistrés, codes matricules, postes, départements et statut e-mail actif.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Total Employés Actifs Enregistrés : {employees.length} lignes
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => ExcelService.exportEmployeesToExcel(employees)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exporter l'Annuaire Employés (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Report Card 4: Security & Audit Trail */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sécurité du Système & Rapport d'Audit</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Journal complet des connexions, exécutions de découpes PDF, envois d'e-mails, modifications de configuration et adresses IP.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Total des Événements de Sécurité Enregistrés : {auditLogs.length} événements
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => ReportService.generateAuditPdfReport(auditLogs)}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger Journal PDF</span>
            </button>

            <button
              onClick={() => ExcelService.exportAuditLogsToExcel(auditLogs)}
              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exporter Journaux Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
