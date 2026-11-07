import React from 'react';
import { Scan, Search, Check, Sparkles, Binary } from 'lucide-react';

export const MatriculeIdentificationVisual: React.FC = () => {
  return (
    <div className="relative w-full p-5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Decorative ambient glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:12px_12px]" />
      <div className="absolute -top-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
            Étape 2 · Reconnaissance des Matricules
          </span>
        </div>
        <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/50 flex items-center gap-1">
          <Scan className="w-3 h-3 text-purple-400" />
          OCR & Regex Intelligent
        </span>
      </div>

      {/* Interactive Page Scanner Viewport */}
      <div className="relative z-10 max-w-sm mx-auto bg-slate-850 rounded-xl border border-purple-500/40 p-4 shadow-lg overflow-hidden">
        {/* Animated Scanner Laser Bar */}
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_12px_#a855f7] animate-pulse top-14" />

        {/* Page Header Mockup */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/70 text-[11px]">
          <span className="font-semibold text-slate-300">Page 1 / 148</span>
          <span className="text-purple-400 font-mono font-medium">Analyse sémantique active</span>
        </div>

        {/* Main Document Body with Targeted Bounding Box */}
        <div className="mt-3 space-y-2.5">
          {/* Target Zone: Highlighted Matricule */}
          <div className="relative p-2.5 rounded-lg bg-purple-950/40 border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] flex items-center justify-between">
            {/* Crosshair Corner Markers */}
            <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-purple-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-purple-300" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-purple-300" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-purple-300" />

            <div>
              <div className="text-[10px] text-purple-300 uppercase tracking-wider font-bold flex items-center gap-1">
                <Search className="w-3 h-3" />
                Matricule Détecté
              </div>
              <div className="font-mono text-base font-black text-white tracking-widest mt-0.5">
                EMP-84920
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold inline-flex items-center gap-1">
                <Check className="w-3 h-3" />
                99.8%
              </span>
              <div className="text-[9px] text-slate-400 mt-0.5">Zone En-tête</div>
            </div>
          </div>

          {/* Secondary Extracted Fields */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
              <span className="text-slate-400">Salarié :</span>
              <div className="text-slate-200 font-semibold truncate mt-0.5">
                Sophie Laurent
              </div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
              <span className="text-slate-400">Département :</span>
              <div className="text-slate-200 font-semibold truncate mt-0.5">
                Direction Produit
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 font-mono">
            <span>Règle active : STRICT_MATRICULE_V2</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Binary className="w-3 h-3" />
              148 / 148 identifiés
            </span>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Localisation infaillible du matricule sur chaque page</span>
        </span>
        <span className="text-purple-300 font-medium">Zéro intervention manuelle</span>
      </div>
    </div>
  );
};
