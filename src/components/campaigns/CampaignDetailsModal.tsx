import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileSpreadsheet, 
  Mail, 
  RefreshCw,
  Search
} from 'lucide-react';
import { DistributionCampaign, DeliveryRecord } from '../../types';
import { ReportService } from '../../services/reportService';
import { ExcelService } from '../../services/excelService';
import { EmailSandboxModal } from './EmailSandboxModal';

interface CampaignDetailsModalProps {
  campaign: DistributionCampaign | null;
  onRetryRecord: (record: DeliveryRecord) => void;
  onClose: () => void;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  onRetryRecord,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [sandboxRecord, setSandboxRecord] = useState<DeliveryRecord | null>(null);

  if (!campaign) return null;

  const filteredRecords = campaign.records.filter(r =>
    r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    r.matricule.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {campaign.id.substring(0, 4)}
            </div>
            <div>
              <h3 className="text-sm font-bold">{campaign.title}</h3>
              <p className="text-xs text-slate-300">
                Uploaded by {campaign.uploadedBy} on {campaign.uploadedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => ReportService.generateCampaignPdfReport(campaign)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>PDF Audit</span>
            </button>

            <button
              onClick={() => ExcelService.exportCampaignReport(campaign)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Matrix</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Campaign Metrics Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold text-[10px]">Total Payroll Employees</span>
            <span className="font-bold text-slate-900 text-sm">{campaign.totalEmployees}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px]">Successfully Delivered</span>
            <span className="font-bold text-emerald-600 text-sm">{campaign.deliveredCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px]">Failed Deliveries</span>
            <span className="font-bold text-red-600 text-sm">{campaign.failedCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px]">Duration</span>
            <span className="font-bold text-purple-600 text-sm">{campaign.durationSeconds || 35} seconds</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter campaign logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            Showing {filteredRecords.length} records
          </div>
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Matricule</th>
                <th className="py-2.5 px-3">Employee Name</th>
                <th className="py-2.5 px-3">Recipient Email</th>
                <th className="py-2.5 px-3">Net Pay</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{rec.matricule}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{rec.employeeName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{rec.email}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600">{ReportService.formatCurrency(rec.netPay)}</td>
                  <td className="py-2.5 px-3">
                    {rec.status === 'Delivered' ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        Delivered
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold" title={rec.errorMessage}>
                        Failed ({rec.errorMessage ? 'SMTP Error' : 'Domain Error'})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSandboxRecord(rec)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 px-2 text-[11px]"
                        title="Open Inbox Simulator"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Inbox</span>
                      </button>

                      {rec.status === 'Failed' && (
                        <button
                          onClick={() => onRetryRecord(rec)}
                          className="p-1 rounded bg-amber-500 text-white hover:bg-amber-600 text-[11px] font-bold px-2 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <EmailSandboxModal
          record={sandboxRecord}
          emailTemplate={campaign.emailTemplate}
          onClose={() => setSandboxRecord(null)}
        />
      </div>
    </div>
  );
};
