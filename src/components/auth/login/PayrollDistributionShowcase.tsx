import React, { useState, useEffect } from 'react';
import { 
  FileUp, 
  Scan, 
  Scissors, 
  Users, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck2,
  Lock
} from 'lucide-react';
import { PdfImportVisual } from './visuals/PdfImportVisual';
import { MatriculeIdentificationVisual } from './visuals/MatriculeIdentificationVisual';
import { PayslipExtractionVisual } from './visuals/PayslipExtractionVisual';
import { EmployeeMatchingVisual } from './visuals/EmployeeMatchingVisual';
import { EmailDistributionVisual } from './visuals/EmailDistributionVisual';

export type WorkflowStage = 1 | 2 | 3 | 4 | 5;

interface StageInfo {
  id: WorkflowStage;
  shortLabel: string;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const STAGES: StageInfo[] = [
  {
    id: 1,
    shortLabel: 'Import',
    title: 'Importation PDF',
    tagline: 'Fichier global multipages',
    icon: FileUp,
    accentColor: 'text-cyan-400'
  },
  {
    id: 2,
    shortLabel: 'Matricules',
    title: 'Identification des matricules',
    tagline: 'OCR & Regex intelligent',
    icon: Scan,
    accentColor: 'text-purple-400'
  },
  {
    id: 3,
    shortLabel: 'Découpage',
    title: 'Découpage automatique',
    tagline: '1 page = 1 bulletin isolé',
    icon: Scissors,
    accentColor: 'text-cyan-400'
  },
  {
    id: 4,
    shortLabel: 'Employés',
    title: 'Correspondance employés',
    tagline: 'Appariement avec l\'annuaire',
    icon: Users,
    accentColor: 'text-blue-400'
  },
  {
    id: 5,
    shortLabel: 'Distribution',
    title: 'Distribution sécurisée',
    tagline: 'Délivré en boîte de réception',
    icon: Send,
    accentColor: 'text-emerald-400'
  }
];

export const PayrollDistributionShowcase: React.FC = () => {
  const [activeStage, setActiveStage] = useState<WorkflowStage>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto-cycle through the 5 stages smoothly
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev >= 5 ? 1 : ((prev + 1) as WorkflowStage)));
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <div 
      className="h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 text-white relative select-none overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Section: Main Heading & Value Proposition */}
      <div className="relative z-10 space-y-3">
        {/* Brand Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>Automatisez votre distribution de bulletins de paie</span>
        </div>

        {/* Main Heading */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
          De votre paie à chaque collaborateur.
        </h2>

        {/* Supporting Description */}
        <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
          Importez vos fichiers PDF de paie, identifiez automatiquement les matricules, découpez les bulletins et distribuez chaque document à son destinataire.
        </p>

        {/* Brand Motto Callout */}
        <div className="pt-1 text-xs font-medium text-slate-400 flex flex-wrap items-center gap-2">
          <span className="text-white font-semibold italic">
            « Chaque bulletin. Le bon salarié. La bonne destination. »
          </span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline text-slate-400">
            Every Payslip. The Right Employee. The Right Inbox.
          </span>
        </div>
      </div>

      {/* Middle Section: 5-Stage Interactive Workflow & Animated Visual Showcase */}
      <div className="relative z-10 my-6 space-y-4">
        {/* 5-Step Progress Timeline Bar */}
        <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isActive = activeStage === s.id;
            const isCompleted = activeStage > s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveStage(s.id);
                  setIsAutoPlaying(false);
                }}
                className={`py-2 px-1 sm:px-2 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                    : isCompleted
                    ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-mono font-bold ${
                    isActive ? 'text-blue-100' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    0{s.id}
                  </span>
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : s.accentColor
                  }`} />
                </div>
                <div className="text-[11px] font-bold truncate leading-tight">
                  {s.shortLabel}
                </div>
                <div className={`text-[9px] truncate mt-0.5 hidden sm:block ${
                  isActive ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {s.tagline}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Visual Content according to Active Stage */}
        <div className="transition-all duration-300">
          {activeStage === 1 && <PdfImportVisual />}
          {activeStage === 2 && <MatriculeIdentificationVisual />}
          {activeStage === 3 && <PayslipExtractionVisual />}
          {activeStage === 4 && <EmployeeMatchingVisual />}
          {activeStage === 5 && <EmailDistributionVisual />}
        </div>
      </div>

      {/* Bottom Section: Three Concise Business Benefits */}
      <div className="relative z-10 pt-4 border-t border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Benefit 1 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Scan className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Traitement intelligent</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Identification et extraction des bulletins par matricule.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Send className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Distribution automatisée</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chaque bulletin est associé à son destinataire.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Traçabilité des opérations</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Suivi des traitements et des distributions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
