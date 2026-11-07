import React from 'react';
import { Users, FileCheck, Check, Mail, Lock, Link2 } from 'lucide-react';

export const EmployeeMatchingVisual: React.FC = () => {
  return (
    <div className="relative w-full p-5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Decorative ambient glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px]" />
      <div className="absolute -top-12 -left-12 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
            Étape 4 · Correspondance & Profils Salariés
          </span>
        </div>
        <span className="text-[11px] font-mono text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/50 flex items-center gap-1">
          <Users className="w-3 h-3 text-blue-400" />
          Annuaire RH Connecté
        </span>
      </div>

      {/* Matching Cards Stream */}
      <div className="relative z-10 space-y-2.5 py-1">
        {[
          {
            initials: 'SL',
            avatarColor: 'bg-indigo-600',
            name: 'Sophie Laurent',
            role: 'Product Lead · R&D',
            matricule: 'EMP-84920',
            email: 's.laurent@entreprise.com',
            pdfName: 'Bulletin_EMP84920.pdf',
            status: 'Matched'
          },
          {
            initials: 'MD',
            avatarColor: 'bg-blue-600',
            name: 'Marc Dubois',
            role: 'Dir. Administratif & Financier',
            matricule: 'EMP-84921',
            email: 'm.dubois@entreprise.com',
            pdfName: 'Bulletin_EMP84921.pdf',
            status: 'Matched'
          },
          {
            initials: 'AB',
            avatarColor: 'bg-emerald-600',
            name: 'Amina Bensaid',
            role: 'Spécialiste Talents & RH',
            matricule: 'EMP-84922',
            email: 'a.bensaid@entreprise.com',
            pdfName: 'Bulletin_EMP84922.pdf',
            status: 'Matched'
          }
        ].map((emp) => (
          <div
            key={emp.matricule}
            className="p-3 rounded-xl bg-slate-850 border border-slate-700/80 hover:border-blue-500/50 transition-all shadow-xs space-y-2"
          >
            {/* Top Row: Employee Profile + Match Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full ${emp.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-slate-700`}>
                  {emp.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                    <span>{emp.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 border border-slate-700">
                      {emp.matricule}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-slate-300 font-mono">{emp.email}</span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Apparié
              </span>
            </div>

            {/* Bottom Row: Associated PDF + Cryptographic Lock */}
            <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800 text-slate-400">
              <div className="flex items-center gap-1.5 font-mono text-cyan-300 truncate">
                <Link2 className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{emp.pdfName}</span>
              </div>
              <span className="text-slate-400 flex items-center gap-1 shrink-0 font-mono">
                <Lock className="w-3 h-3 text-blue-400" />
                Chiffré individuel
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Synchronisation automatique matricule ↔ adresse e-mail</span>
        </span>
        <span className="text-emerald-400 font-semibold">Taux de succès 100%</span>
      </div>
    </div>
  );
};
