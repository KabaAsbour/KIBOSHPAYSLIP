import React from 'react';
import { FileText, ArrowDownToLine, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

export const PdfImportVisual: React.FC = () => {
  return (
    <div className="relative w-full p-5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Decorative background grid and glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            Étape 1 · Ingestion du Lot Multipages
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
          Source : Logiciel de Paie
        </span>
      </div>

      {/* Ingestion Conduit / Card */}
      <div className="relative z-10 flex flex-col items-center justify-center py-2">
        {/* Animated Drop Indicator */}
        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center mb-3 animate-bounce">
          <ArrowDownToLine className="w-5 h-5" />
        </div>

        {/* Master PDF Document Graphic */}
        <div className="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-850 rounded-xl border border-blue-500/40 p-4 shadow-lg relative group">
          {/* Top Document Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>LOT_PAIE_CONSOLIDE_OCT.pdf</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-cyan-300 font-semibold">148 pages</span>
                  <span>·</span>
                  <span>148 salariés</span>
                  <span>·</span>
                  <span>24.8 Mo</span>
                </div>
              </div>
            </div>

            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Validé
            </span>
          </div>

          {/* Document Content Skeleton Lines simulating actual payslip layout */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span>ENTREPRISE SA · SIRET 482 109 432 00021</span>
              <span className="text-blue-400 font-semibold">PÉRIODE : 10/2026</span>
            </div>

            <div className="h-1.5 bg-slate-700/80 rounded-full w-full overflow-hidden">
              <div className="h-full bg-cyan-500/60 rounded-full w-4/5 animate-pulse" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <div className="text-slate-500 text-[9px]">TOTAL BRUT</div>
                <div className="text-slate-200 font-bold mt-0.5">426 890 €</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <div className="text-slate-500 text-[9px]">COTISATIONS</div>
                <div className="text-slate-200 font-bold mt-0.5">149 411 €</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <div className="text-cyan-400 text-[9px]">NET À PAYER</div>
                <div className="text-cyan-300 font-bold mt-0.5">277 479 €</div>
              </div>
            </div>
          </div>

          {/* Micro Stack effect behind the card */}
          <div className="absolute -bottom-1.5 left-4 right-4 h-2 bg-slate-800/80 rounded-b-xl border-x border-b border-slate-700/50 -z-10" />
          <div className="absolute -bottom-3 left-8 right-8 h-2 bg-slate-900/80 rounded-b-xl border-x border-b border-slate-800/50 -z-20" />
        </div>
      </div>

      {/* Processing Pipeline Footnote */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Fichier unique consolidé prêt pour analyse</span>
        </span>
        <span className="text-cyan-400 font-medium">Flux entrant chiffré</span>
      </div>
    </div>
  );
};
