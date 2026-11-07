import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Eye, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  CalendarClock,
  Trash2,
  AlertOctagon,
  CheckSquare,
  Square
} from 'lucide-react';
import { DistributionCampaign, DeliveryRecord } from '../../types';
import { ReportService } from '../../services/reportService';
import { ExcelService } from '../../services/excelService';
import { StorageService } from '../../services/storageService';
import { CampaignDetailsModal } from './CampaignDetailsModal';

interface CampaignHistoryViewProps {
  campaigns: DistributionCampaign[];
  onRetryRecord: (record: DeliveryRecord) => void;
  onNewCampaign: () => void;
  onDeleteCampaign?: (id: string) => void;
  onBulkDeleteCampaigns?: (ids: string[]) => void;
}

export const CampaignHistoryView: React.FC<CampaignHistoryViewProps> = ({
  campaigns,
  onRetryRecord,
  onNewCampaign,
  onDeleteCampaign,
  onBulkDeleteCampaigns
}) => {
  const [selectedCampaign, setSelectedCampaign] = useState<DistributionCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Multi-Selection State for Bulk Actions
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [campaignToDelete, setCampaignToDelete] = useState<DistributionCampaign | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.payrollMonth.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pdfFileName.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'scheduled') return matchesSearch && c.status === 'Scheduled';
    if (statusFilter === 'completed') return matchesSearch && c.status === 'Completed';
    if (statusFilter === 'errors') return matchesSearch && (c.status === 'Completed with Errors' || c.failedCount > 0);

    return matchesSearch;
  });

  // Single Delete Confirmation
  const handleConfirmSingleDelete = () => {
    if (!campaignToDelete) return;
    const campaignId = campaignToDelete.id;

    if (onDeleteCampaign) {
      onDeleteCampaign(campaignId);
    } else {
      StorageService.deleteCampaign(campaignId);
    }

    setSelectedCampaignIds(prev => prev.filter(id => id !== campaignId));
    if (selectedCampaign?.id === campaignId) {
      setSelectedCampaign(null);
    }
    setCampaignToDelete(null);
  };

  // Bulk Delete Confirmation
  const handleConfirmBulkDelete = () => {
    if (selectedCampaignIds.length === 0) return;

    if (onBulkDeleteCampaigns) {
      onBulkDeleteCampaigns(selectedCampaignIds);
    } else {
      StorageService.deleteCampaigns(selectedCampaignIds);
    }

    if (selectedCampaign && selectedCampaignIds.includes(selectedCampaign.id)) {
      setSelectedCampaign(null);
    }
    setSelectedCampaignIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  // Selection helpers
  const handleToggleSelect = (campaignId: string) => {
    setSelectedCampaignIds(prev =>
      prev.includes(campaignId) ? prev.filter(id => id !== campaignId) : [...prev, campaignId]
    );
  };

  const handleToggleSelectAll = () => {
    const filteredIds = filteredCampaigns.map(c => c.id);
    const isAllSelected = filteredCampaigns.length > 0 && filteredCampaigns.every(c => selectedCampaignIds.includes(c.id));

    if (isAllSelected) {
      const idSet = new Set(filteredIds);
      setSelectedCampaignIds(prev => prev.filter(id => !idSet.has(id)));
    } else {
      const union = new Set([...selectedCampaignIds, ...filteredIds]);
      setSelectedCampaignIds(Array.from(union));
    }
  };

  const isAllFilteredSelected = filteredCampaigns.length > 0 && filteredCampaigns.every(c => selectedCampaignIds.includes(c.id));
  const isPartiallySelected = filteredCampaigns.some(c => selectedCampaignIds.includes(c.id)) && !isAllFilteredSelected;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Module 10 — Distribution Campaign History
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Payroll Distribution Campaigns Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Complete historical repository of every payslip distribution campaign. Download audit PDFs, export Excel matrices, or launch retries.
          </p>
        </div>

        <button
          onClick={onNewCampaign}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Launch New Campaign</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaign ID, month, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-medium bg-slate-50 outline-none cursor-pointer"
          >
            <option value="all">All Campaigns ({campaigns.length})</option>
            <option value="scheduled">Scheduled ({campaigns.filter(c => c.status === 'Scheduled').length})</option>
            <option value="completed">Fully Completed</option>
            <option value="errors">Completed with Errors</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar Banner (when campaigns are selected) */}
      {selectedCampaignIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 px-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold font-mono">
              {selectedCampaignIds.length}
            </span>
            <span className="text-xs font-medium text-slate-200">
              campagne(s) sélectionnée(s) sur {filteredCampaigns.length} affichée(s)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isAllFilteredSelected && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Tout sélectionner ({filteredCampaigns.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedCampaignIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Désélectionner
            </button>

            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer la sélection ({selectedCampaignIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Aucune campagne trouvée</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' 
                ? "Aucune campagne ne correspond à vos critères de recherche ou de filtre."
                : "Aucune campagne de distribution n'a encore été enregistrée."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Sélectionner toutes les campagnes"
                      checked={isAllFilteredSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = isPartiallySelected;
                        }
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Campaign ID</th>
                  <th className="py-3 px-4">Payroll Period</th>
                  <th className="py-3 px-4">Upload Info</th>
                  <th className="py-3 px-4 text-center">Employees</th>
                  <th className="py-3 px-4 text-center">Delivered</th>
                  <th className="py-3 px-4 text-center">Failed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions & Exports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampaigns.map((c) => {
                  const isSelected = selectedCampaignIds.includes(c.id);
                  return (
                    <tr 
                      key={c.id} 
                      className={`transition-colors ${isSelected ? 'bg-blue-50/70 hover:bg-blue-100/60' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner la campagne ${c.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{c.payrollMonth}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{c.uploadedBy}</div>
                        <div className="text-[11px] text-slate-400">{c.uploadedAt}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {c.totalEmployees}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                        {c.deliveredCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-red-600">
                        {c.failedCount}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.status === 'Scheduled' ? (
                          <div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <CalendarClock className="w-3 h-3 text-indigo-600" />
                              <span>Scheduled</span>
                            </span>
                            {c.scheduledAt && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {c.scheduledAt}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            c.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {c.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            <span>{c.status}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCampaign(c)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Full Delivery Log"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Logs</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => ReportService.generateCampaignPdfReport(c)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Download PDF Audit Report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => ExcelService.exportCampaignReport(c)}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                            title="Export Excel Matrix"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCampaignToDelete(c)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer border border-rose-200"
                            title={`Supprimer la campagne ${c.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Campaign Deletion Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Supprimer la Campagne ?
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {campaignToDelete.id}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Période : {campaignToDelete.payrollMonth}</span>
                <span className="text-[11px] font-normal text-slate-500">{campaignToDelete.uploadedAt}</span>
              </div>
              <div className="text-slate-600 text-[11px] flex items-center justify-between">
                <span>Fichier source : <strong className="font-mono">{campaignToDelete.pdfFileName}</strong></span>
                <span>{campaignToDelete.totalEmployees} employé(s)</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Par : {campaignToDelete.uploadedBy}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Cette action est <strong>irréversible</strong>. L'ensemble de l'historique et des logs d'envoi de cette campagne seront définitivement supprimés.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer Définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && selectedCampaignIds.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Suppression en Masse
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  {selectedCampaignIds.length} campagne(s) sélectionnée(s)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement les <strong>{selectedCampaignIds.length} campagnes</strong> sélectionnées ?
            </p>

            <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5">
              {selectedCampaignIds.map(id => {
                const c = campaigns.find(camp => camp.id === id);
                return (
                  <span key={id} className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-700 shadow-2xs">
                    {c ? `${c.id} (${c.payrollMonth})` : id}
                  </span>
                );
              })}
            </div>

            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Cette opération supprimera définitivement ces campagnes, leurs bulletins associés et leurs journaux de distribution.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer les {selectedCampaignIds.length} campagnes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <CampaignDetailsModal
        campaign={selectedCampaign}
        onRetryRecord={onRetryRecord}
        onClose={() => setSelectedCampaign(null)}
      />
    </div>
  );
};

