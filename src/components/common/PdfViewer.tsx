import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, RefreshCw, FileText, AlertTriangle, Maximize2 } from 'lucide-react';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  pdfBlobUrl?: string;
  pdfBytes?: Uint8Array;
  matricule?: string;
  employeeName?: string;
  className?: string;
  minHeight?: string;
  highlightMatricule?: string;
  showOcrOverlay?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfBlobUrl,
  pdfBytes,
  matricule,
  employeeName,
  className = '',
  minHeight = '480px',
  highlightMatricule,
  showOcrOverlay = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    let doc: pdfjsLib.PDFDocumentProxy | null = null;

    const loadDocument = async () => {
      setIsLoading(true);
      setRenderError(null);

      try {
        let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

        if (pdfBytes && pdfBytes.length > 0) {
          const safeBytes = new Uint8Array(pdfBytes);
          loadingTask = pdfjsLib.getDocument({ data: safeBytes });
        } else if (pdfBlobUrl) {
          loadingTask = pdfjsLib.getDocument({ url: pdfBlobUrl });
        } else {
          throw new Error('Aucune source PDF fournie.');
        }

        doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDocProxy(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err: any) {
        console.warn('PdfViewer document load error:', err);
        if (isMounted) {
          setRenderError(err?.message || 'Erreur d\'ouverture du fichier PDF.');
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      if (doc) {
        try {
          if (typeof (doc as any).destroy === 'function') {
            (doc as any).destroy();
          } else if (typeof doc.cleanup === 'function') {
            doc.cleanup();
          }
        } catch (e) {}
      }
    };
  }, [pdfBlobUrl, pdfBytes]);

  // Render Page to Canvas
  useEffect(() => {
    if (!pdfDocProxy || !canvasRef.current) return;

    let renderTask: any = null;
    let isMounted = true;

    const renderCurrentPage = async () => {
      try {
        setIsLoading(true);
        const page = await pdfDocProxy.getPage(currentPage);
        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        // Draw OCR Matricule Highlight Overlay if enabled
        if (showOcrOverlay && (highlightMatricule || matricule)) {
          const targetMatricule = (highlightMatricule || matricule || '').trim().toUpperCase();
          try {
            const textContent = await page.getTextContent();
            let foundMatch = false;

            for (const item of textContent.items as any[]) {
              const str = (item.str || '').toUpperCase();
              if (targetMatricule && (str.includes(targetMatricule) || (targetMatricule.length > 3 && str.includes(targetMatricule.substring(targetMatricule.length - 6))))) {
                const tx = item.transform;
                if (tx && tx.length >= 6) {
                  const pdfX = tx[4];
                  const pdfY = tx[5];
                  const pdfW = item.width || 120;
                  const pdfH = Math.abs(tx[3]) || 14;

                  const [vX1, vY1, vX2, vY2] = viewport.convertToViewportRectangle([pdfX, pdfY - 2, pdfX + pdfW, pdfY + pdfH + 2]);
                  const rectX = Math.min(vX1, vX2);
                  const rectY = Math.min(vY1, vY2);
                  const rectW = Math.max(Math.abs(vX2 - vX1), 140);
                  const rectH = Math.max(Math.abs(vY2 - vY1), 22);

                  ctx.save();
                  // Translucent yellow/emerald background
                  ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
                  ctx.strokeStyle = '#eab308';
                  ctx.lineWidth = 2.5;

                  ctx.beginPath();
                  ctx.rect(rectX - 4, rectY - 4, rectW + 8, rectH + 8);
                  ctx.fill();
                  ctx.stroke();

                  // OCR Tag badge above highlight box
                  ctx.fillStyle = '#0f172a';
                  ctx.beginPath();
                  ctx.rect(rectX - 4, rectY - 22, Math.max(rectW + 8, 170), 18);
                  ctx.fill();

                  ctx.font = 'bold 10px sans-serif';
                  ctx.fillStyle = '#facc15';
                  ctx.fillText(`🔍 MATRICULE OCR : ${targetMatricule}`, rectX, rectY - 9);
                  ctx.restore();

                  foundMatch = true;
                  break;
                }
              }
            }

            // Fallback highlight banner over typical top employee details section if exact text box wasn't located
            if (!foundMatch && targetMatricule) {
              const bannerX = 35 * scale;
              const bannerY = 115 * scale;
              const bannerW = (viewport.width - 70 * scale);
              const bannerH = 32 * scale;

              ctx.save();
              ctx.fillStyle = 'rgba(254, 240, 138, 0.55)';
              ctx.strokeStyle = '#d97706';
              ctx.lineWidth = 2;
              ctx.setLineDash([6, 3]);

              ctx.beginPath();
              ctx.rect(bannerX, bannerY, bannerW, bannerH);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#1e293b';
              ctx.beginPath();
              ctx.rect(bannerX, bannerY - 18, 200, 18);
              ctx.fill();

              ctx.font = 'bold 10px sans-serif';
              ctx.fillStyle = '#f59e0b';
              ctx.fillText(`🔍 MATRICULE DÉTECTÉ: ${targetMatricule}`, bannerX + 6, bannerY - 5);
              ctx.restore();
            }
          } catch (ocrErr) {
            console.warn('OCR canvas highlight error:', ocrErr);
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('PdfViewer page render error:', err);
          if (isMounted) {
            setRenderError('Impossible d\'afficher la page PDF.');
            setIsLoading(false);
          }
        }
      }
    };

    renderCurrentPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocProxy, currentPage, scale]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));
  const handleFitWidth = () => setScale(1.15);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages));

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl ${className}`}
      style={{ minHeight }}
    >
      {/* Viewer Toolbar */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 select-none z-10">
        {/* Page Controls */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Page Précédente"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>
          <span className="px-2 font-mono font-bold text-slate-200 text-[11px]">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Page Suivante"
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Zoom Arrière"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-300" />
          </button>
          <button
            onClick={handleFitWidth}
            className="px-2 font-mono text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Réinitialiser Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Zoom Avant"
          >
            <ZoomIn className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>

        {/* Actions */}
        {pdfBlobUrl && (
          <a
            href={pdfBlobUrl}
            download={`Document_${matricule || 'Payslip'}.pdf`}
            className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Télécharger</span>
          </a>
        )}
      </div>

      {/* PDF View Canvas Stage */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900 relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-20 text-slate-300">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-xs font-semibold">Rendu de la Page PDF...</span>
          </div>
        )}

        {renderError ? (
          <div className="text-center p-6 bg-slate-950/80 rounded-xl border border-rose-900/50 max-w-md space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <div className="text-xs font-bold text-slate-200">Aperçu PDF Non Disponible</div>
            <div className="text-[11px] text-slate-400">{renderError}</div>
            {matricule && (
              <div className="text-[11px] font-mono text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800">
                Document de Paie pour Matricule: {matricule}
              </div>
            )}
          </div>
        ) : (
          <div className="shadow-2xl rounded-sm overflow-hidden bg-white border border-slate-700">
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        )}
      </div>
    </div>
  );
};
