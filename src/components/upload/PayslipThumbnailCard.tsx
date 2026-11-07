import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ExtractedPayslip } from '../../types';
import { Eye, ZoomIn, FileText, CheckCircle2, AlertTriangle, Maximize2, X, Scissors, Layers, Check, Lock, Key, EyeOff } from 'lucide-react';

// Set up pdf.js worker URL dynamically using unpkg CDN matching pdfjs-dist version
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PayslipThumbnailCardProps {
  payslip: ExtractedPayslip;
  index: number;
  onExcludeToggle?: (id: string) => void;
  onOpenFullModal?: (payslip: ExtractedPayslip) => void;
}

export const PayslipThumbnailCard: React.FC<PayslipThumbnailCardProps> = ({
  payslip,
  index,
  onExcludeToggle,
  onOpenFullModal
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderStatus, setRenderStatus] = useState<'loading' | 'success' | 'fallback'>('loading');

  useEffect(() => {
    let isMounted = true;

    async function renderPdfThumbnail() {
      if (!canvasRef.current || (!payslip.pdfBlobUrl && !payslip.pdfBytes)) {
        setRenderStatus('fallback');
        return;
      }

      try {
        setRenderStatus('loading');
        let loadingTask;

        if (payslip.pdfBytes) {
          loadingTask = pdfjsLib.getDocument({ data: payslip.pdfBytes });
        } else if (payslip.pdfBlobUrl) {
          loadingTask = pdfjsLib.getDocument({ url: payslip.pdfBlobUrl });
        } else {
          setRenderStatus('fallback');
          return;
        }

        const pdfDoc = await loadingTask.promise;
        if (!isMounted) return;

        const page = await pdfDoc.getPage(1);
        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale: 0.45 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        if (isMounted) {
          setRenderStatus('success');
        }
      } catch (error) {
        console.warn('PDF.js thumbnail render error, using visual fallback preview:', error);
        if (isMounted) {
          setRenderStatus('fallback');
        }
      }
    }

    renderPdfThumbnail();

    return () => {
      isMounted = false;
    };
  }, [payslip.pdfBlobUrl, payslip.pdfBytes]);

  const isInvalid = payslip.status === 'Unmatched Matricule' || payslip.status === 'Missing Email';
  const [showPassword, setShowPassword] = useState(false);
  const pdfPassword = payslip.pdfPassword || payslip.matricule;

  return (
    <div
      className={`group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
        payslip.isExcluded
          ? 'border-slate-300 bg-slate-50 opacity-60 grayscale-[40%]'
          : isInvalid
          ? 'border-amber-300 bg-amber-50/10 hover:border-amber-400'
          : 'border-slate-200 hover:border-blue-400'
      }`}
    >
      {/* Top Header Card Info */}
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-mono">
            #{index + 1}
          </span>
          <span className="font-mono text-slate-800">{payslip.matricule}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 flex items-center gap-1">
            <Scissors className="w-2.5 h-2.5 text-slate-500" />
            Page {payslip.startPage}
          </span>

          {payslip.isExcluded ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
              Exclus
            </span>
          ) : isInvalid ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {payslip.status === 'Unmatched Matricule' ? 'Matricule Inconnu' : payslip.status === 'Missing Email' ? 'E-mail Manquant' : payslip.status}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" /> Prêt
            </span>
          )}
        </div>
      </div>

      {/* Canvas / Visual PDF Thumbnail Container */}
      <div className="relative p-3 flex items-center justify-center bg-slate-100/70 min-h-[160px] overflow-hidden">
        {/* Actual PDF rendered canvas */}
        <canvas
          ref={canvasRef}
          className={`max-h-[160px] max-w-full rounded shadow-xs border border-slate-300 object-contain transition-opacity duration-300 ${
            renderStatus === 'success' ? 'block' : 'hidden'
          }`}
        />

        {/* Fallback / Loading Document Render Representation */}
        {renderStatus !== 'success' && (
          <div className="w-full max-w-[130px] h-[160px] bg-white rounded border border-slate-300 p-2.5 flex flex-col justify-between shadow-xs text-[8px] select-none">
            <div className="space-y-1">
              <div className="h-2 w-full bg-slate-900 rounded-xs" />
              <div className="h-1.5 w-2/3 bg-blue-600 rounded-xs" />
              <div className="my-2 border-b border-dashed border-slate-200" />
              <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
              <div className="h-1.5 w-4/5 bg-slate-200 rounded-xs" />
              <div className="h-1.5 w-3/4 bg-slate-200 rounded-xs" />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-1 rounded text-center font-mono font-bold text-blue-900 text-[9px]">
              {payslip.matricule}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>NET À PAYER :</span>
                <span className="text-emerald-700 font-bold">€{payslip.netPay.toFixed(2)}</span>
              </div>
              <div className="h-1 w-full bg-slate-300 rounded-xs" />
            </div>
          </div>
        )}

        {/* Visual Boundary Line Overlay */}
        <div className="absolute inset-x-2 top-2 border-t-2 border-dashed border-rose-500/60 pointer-events-none flex items-center justify-between px-1">
          <span className="text-[8px] bg-rose-600 text-white font-mono px-1 rounded-b font-bold">
            Limite de Découpe : Page {payslip.startPage}
          </span>
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2 p-2 backdrop-blur-[1px]">
          <button
            onClick={() => onOpenFullModal && onOpenFullModal(payslip)}
            className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
            <span>Inspecter la Découpe</span>
          </button>
        </div>
      </div>

      {/* Footer Information & Exclusion Toggle */}
      <div className="p-3 border-t border-slate-100 text-xs space-y-1 bg-white">
        <div className="font-bold text-slate-900 truncate" title={payslip.employeeName}>
          {payslip.employeeName}
        </div>
        
        {/* Generated Filename Display */}
        {payslip.generatedFileName && (
          <div className="bg-slate-50 border border-slate-200 rounded p-1 text-[10px] font-mono text-slate-600 truncate flex items-center gap-1 my-1" title={payslip.generatedFileName}>
            <FileText className="w-3 h-3 text-blue-600 shrink-0" />
            <span className="truncate">{payslip.generatedFileName}</span>
          </div>
        )}

        <div className="text-[11px] text-slate-500 flex items-center justify-between">
          <span className="truncate">{payslip.department}</span>
          <span className="font-bold text-slate-700">€{payslip.netPay.toFixed(2)}</span>
        </div>

        {/* Password Protection Badge */}
        {payslip.pdfPasswordProtected !== false && (
          <div className="bg-slate-100 rounded-lg p-1.5 border border-slate-200 flex items-center justify-between text-[10px] my-1">
            <div className="flex items-center gap-1 text-slate-700 font-medium">
              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Pass PDF :</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {showPassword ? pdfPassword : '•'.repeat(Math.min(pdfPassword.length, 8))}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPassword(!showPassword);
              }}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={() => onExcludeToggle && onExcludeToggle(payslip.id)}
            className={`w-full py-1 px-2 rounded text-[11px] font-bold transition-colors border flex items-center justify-center gap-1 cursor-pointer ${
              payslip.isExcluded
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {payslip.isExcluded ? 'Inclure dans le Lot' : 'Exclure du Découpage'}
          </button>
        </div>
      </div>
    </div>
  );
};
