import React from 'react';
import { X, Mail, ShieldCheck, Download, Paperclip } from 'lucide-react';
import { DeliveryRecord } from '../../types';

interface EmailSandboxModalProps {
  record: DeliveryRecord | null;
  emailTemplate: string;
  onClose: () => void;
}

export const EmailSandboxModal: React.FC<EmailSandboxModalProps> = ({
  record,
  emailTemplate,
  onClose
}) => {
  if (!record) return null;

  const renderedBody = emailTemplate
    .replace(/\{FirstName\}/g, record.employeeName.split(' ')[0] || '')
    .replace(/\{LastName\}/g, record.employeeName.split(' ').slice(1).join(' ') || '')
    .replace(/\{Matricule\}/g, record.matricule)
    .replace(/\{Department\}/g, record.department)
    .replace(/\{NetPay\}/g, record.netPay.toFixed(2))
    .replace(/\{Month\}/g, record.payPeriod.split(' ')[0] || 'July')
    .replace(/\{Year\}/g, record.payPeriod.split(' ')[1] || '2026');

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Email Inbox Simulator</h3>
              <p className="text-xs text-slate-300">Recipient Sandbox View — {record.employeeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">From:</span>
            <span className="font-bold text-slate-800">Enterprise Global Payroll Service &lt;payroll-no-reply@enterprise-corp.com&gt;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">To:</span>
            <span className="font-bold text-blue-600 font-mono">{record.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Date Sent:</span>
            <span className="text-slate-700">{record.sentAt || '2026-07-31 10:00 AM'}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-500 font-semibold">Subject:</span>
            <span className="font-bold text-slate-900">Your Confidential Monthly Payslip - {record.payPeriod}</span>
          </div>
        </div>

        {/* Email Body */}
        <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
          <div className="whitespace-pre-wrap text-xs text-slate-800 font-sans leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            {renderedBody}
          </div>

          {/* Attachment Box */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                <Paperclip className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{record.pdfFileName}</div>
                <div className="text-[11px] text-blue-700 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit Encrypted PDF Document (Password: {record.matricule})</span>
                </div>
              </div>
            </div>

            {record.pdfBlobUrl && (
              <a
                href={record.pdfBlobUrl}
                download={record.pdfFileName}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
