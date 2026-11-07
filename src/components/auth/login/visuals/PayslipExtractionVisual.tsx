import React from 'react';
import { Scissors, FileText, CheckCircle2, SplitSquareVertical, ArrowRight } from 'lucide-react';

export const PayslipExtractionVisual: React.FC = () => {
  return (
    <div className="relative w-full p-5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Decorative ambient glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px]" />
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            Étape 3 · Découpage & Renommage Automatique
          </span>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50 flex items-center gap-1">
          <Scissors className="w-3 h-3 text-cyan-400" />
          Division Page par Page
        </span>
      </div>

      {/* Visual Pipeline: 1 PDF -> Splitting Stream -> Individual Payslips */}
      <div className="relative z-10 py-1 space-y-3">
        {/* Source File Micro Header */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/70 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <SplitSquareVertical className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">Lot global (148 pages)</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
            Découpage en cours <ArrowRight className="w-3 h-3 animate-pulse" />
          </span>
        </div>

        {/* Individual Generated Payslips Fanning Out */}
        <div className="space-y-2">
          {[
            {
              id: 'EMP-84920',
              name: 'Sophie Laurent',
              fileName: 'Bulletin_EMP84920_S_Laurent.pdf',
              size: '182 Ko',
              page: 'Page 1'
            },
            {
              id: 'EMP-84921',
              name: 'Marc Dubois',
              fileName: 'Bulletin_EMP84921_M_Dubois.pdf',
              size: '179 Ko',
              page: 'Page 2'
            },
            {
              id: 'EMP-84922',
              name: 'Amina Bensaid',
              fileName: 'Bulletin_EMP84922_A_Bensaid.pdf',
              size: '185 Ko',
              page: 'Page 3'
            }
          ].map((item, idx) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 transition-all flex items-center justify-between gap-3 shadow-xs"
              style={{ transform: `translateX(${idx * 4}px)` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate font-mono">
                    {item.fileName}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="text-cyan-300 font-semibold">{item.id}</span>
                    <span>·</span>
                    <span className="truncate">{item.name}</span>
                    <span>·</span>
                    <span className="text-slate-500">{item.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  {item.page}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footnote */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-cyan-400" />
          <span>Extraction unitaire avec nommage normalisé personnalisé</span>
        </span>
        <span className="text-cyan-300 font-medium font-mono">148 bulletins générés</span>
      </div>
    </div>
  );
};
