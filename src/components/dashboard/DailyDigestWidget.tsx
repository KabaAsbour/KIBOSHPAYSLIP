import React, { useState } from 'react';
import { 
  Calendar, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  Layers, 
  ChevronRight, 
  Info,
  MailWarning,
  FileCheck2,
  Users
} from 'lucide-react';
import { DistributionCampaign, Employee } from '../../types';

interface DailyDigestWidgetProps {
  campaigns: DistributionCampaign[];
  employees: Employee[];
  onViewFailures: () => void;
  onStartCampaign: () => void;
  onImportEmployees: () => void;
  onViewCampaigns: () => void;
}

export const DailyDigestWidget: React.FC<DailyDigestWidgetProps> = ({
  campaigns,
  employees,
  onViewFailures,
  onStartCampaign,
  onImportEmployees,
  onViewCampaigns,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute yesterday's stats
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);

  // Filter campaigns created or updated yesterday/recently
  const yesterdayCampaigns = campaigns.filter(c => {
    return (c.createdAt && c.createdAt.startsWith(yesterdayStr)) || (c.updatedAt && c.updatedAt.startsWith(yesterdayStr));
  });

  // Calculate metrics
  let yesterdayDelivered = 0;
  let yesterdayFailed = 0;
  let yesterdayTotal = 0;

  (yesterdayCampaigns.length > 0 ? yesterdayCampaigns : campaigns).forEach(c => {
    yesterdayDelivered += c.deliveredCount;
    yesterdayFailed += c.failedCount;
    yesterdayTotal += c.totalEmployees;
  });

  // Default values for display if no yesterday campaigns exist
  if (yesterdayTotal === 0 && campaigns.length > 0) {
    yesterdayDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
    yesterdayFailed = campaigns.reduce((acc, c) => acc + c.failedCount, 0);
    yesterdayTotal = campaigns.reduce((acc, c) => acc + c.totalEmployees, 0);
  }

  // Pending Tasks
  const employeesMissingEmail = employees.filter(e => !e.email || e.email.includes('invalid') || !e.email.includes('@'));
  const pendingDraftCampaigns = campaigns.filter(c => c.status === 'Draft' || c.status === 'Pending Validation');
  const failedDeliveriesCount = campaigns.reduce((acc, c) => acc + c.failedCount, 0);

  const pendingTasksCount = employeesMissingEmail.length + pendingDraftCampaigns.length + failedDeliveriesCount;

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Afficher la Synthèse Quotidienne</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Daily Digest Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-xl relative overflow-hidden animate-in fade-in duration-200">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Calendar className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Rapport du Jour — Synthèse Quotidienne
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Mise à jour à 08:00
                </span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">
                Bilan des Distributions de la Veille & Actions en Attente
              </h3>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Voici le récapitulatif des livraisons de bulletins de paie, des échecs d'envoi et des tâches prioritaires nécessitant votre validation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Synthèse Détaillée</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Masquer le récapitulatif"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Digest Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 relative z-10">
          
          {/* Card 1: Yesterday's Deliveries */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Distributions de la Veille
              </div>
              <div className="text-lg font-black text-emerald-400 mt-0.5 flex items-baseline gap-1.5">
                <span>{yesterdayDelivered} Livrés</span>
                <span className="text-xs text-slate-400 font-normal">/ {yesterdayTotal || 20}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {yesterdayCampaigns.length || campaigns.length} campagne(s) exécutée(s)
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Failed Deliveries */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Échecs & Bounces
              </div>
              <div className="text-lg font-black text-rose-400 mt-0.5 flex items-baseline gap-1.5">
                <span>{failedDeliveriesCount} Erreurs</span>
              </div>
              <button
                onClick={onViewFailures}
                className="text-[10px] text-rose-300 font-bold hover:underline flex items-center gap-0.5 mt-0.5 cursor-pointer"
              >
                <span>Résoudre maintenant</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
              <MailWarning className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Pending Tasks */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tâches en Attente
              </div>
              <div className="text-lg font-black text-amber-400 mt-0.5 flex items-baseline gap-1.5">
                <span>{pendingTasksCount} Action(s)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {employeesMissingEmail.length} e-mails manquants | {pendingDraftCampaigns.length} brouillon(s)
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>

      {/* Expanded Daily Digest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Synthèse Quotidienne Complète</h3>
                  <p className="text-xs text-slate-400">
                    Rapport consolidé du {yesterday.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Section 1: Yesterday Distribution Status */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  1. Statut des Distributions de la Veille
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-semibold text-[10px] uppercase block">Campagnes actives</span>
                    <span className="text-base font-bold text-slate-900 mt-1 block">
                      {yesterdayCampaigns.length || campaigns.length}
                    </span>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 font-semibold text-[10px] uppercase block">Bulletins Livrés</span>
                    <span className="text-base font-bold text-emerald-800 mt-1 block">
                      {yesterdayDelivered}
                    </span>
                  </div>

                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                    <span className="text-rose-700 font-semibold text-[10px] uppercase block">Bounces / Échecs</span>
                    <span className="text-base font-bold text-rose-800 mt-1 block">
                      {yesterdayFailed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Failed Deliveries Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <MailWarning className="w-4 h-4 text-rose-600" />
                  2. Alertes sur les Échecs de Livraison ({failedDeliveriesCount})
                </h4>

                {failedDeliveriesCount > 0 ? (
                  <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900">
                        {failedDeliveriesCount} bulletin(s) n'ont pas pu être acheminés.
                      </span>
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          onViewFailures();
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        Résoudre dans l'Ajusteur
                      </button>
                    </div>
                    <p className="text-rose-700 leading-relaxed">
                      Principales causes : adresses e-mail inexactes dans le registre RH ou rejets de sécurité du serveur destinataire.
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Aucun échec de livraison enregistré ! Toutes les notifications sont transmises.</span>
                  </div>
                )}
              </div>

              {/* Section 3: Pending Tasks & HR Workflows */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  3. Tâches RH & Validations en Attente ({pendingTasksCount})
                </h4>

                <div className="space-y-2">
                  {employeesMissingEmail.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-slate-800">
                          {employeesMissingEmail.length} salarié(s) sans e-mail valide dans le registre RH.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          onImportEmployees();
                        }}
                        className="text-amber-800 font-bold hover:underline cursor-pointer"
                      >
                        Mettre à jour
                      </button>
                    </div>
                  )}

                  {pendingDraftCampaigns.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-slate-800">
                          {pendingDraftCampaigns.length} campagne(s) en brouillon prêtes pour lancement.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          onViewCampaigns();
                        }}
                        className="text-blue-800 font-bold hover:underline cursor-pointer"
                      >
                        Consulter
                      </button>
                    </div>
                  )}

                  {pendingTasksCount === 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 font-semibold">
                      Toutes les tâches RH quotidiennes sont à jour !
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Généré automatiquement par KIBOSH Daily Digest Engine
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
