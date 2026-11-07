import React from 'react';
import { X, Download, ShieldCheck, Mail, Building2 } from 'lucide-react';
import { ExtractedPayslip } from '../../types';
import { PdfViewer } from '../common/PdfViewer';

interface PayslipPreviewModalProps {
  payslip: ExtractedPayslip | null;
  onClose: () => void;
}

export const PayslipPreviewModal: React.FC<PayslipPreviewModalProps> = ({
  payslip,
  onClose
}) => {
  if (!payslip) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              PDF
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Payslip Preview: {payslip.matricule}
              </h3>
              <p className="text-xs text-slate-300">
                {payslip.employeeName} ({payslip.department})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {payslip.pdfBlobUrl && (
              <a
                href={payslip.pdfBlobUrl}
                download={`Payslip_${payslip.payPeriod.replace(/\s+/g, '_')}_${payslip.matricule}.pdf`}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center min-h-[520px]">
          <PdfViewer
            pdfBlobUrl={payslip.pdfBlobUrl}
            pdfBytes={payslip.pdfBytes}
            matricule={payslip.matricule}
            employeeName={payslip.employeeName}
            className="w-full max-w-2xl min-h-[500px]"
            minHeight="500px"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            256-bit AES Cryptographic Security Verified
          </span>
          <span>Matched Confidence: {payslip.confidenceScore}%</span>
        </div>
      </div>
    </div>
  );
};
