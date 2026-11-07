import React, { useState } from 'react';
import { 
  X, 
  CalendarClock, 
  Clock, 
  Calendar, 
  Globe, 
  BellRing, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  AlertCircle,
  Users
} from 'lucide-react';
import { ExtractedPayslip } from '../../types';

interface ScheduleCampaignModalProps {
  payrollMonth: string;
  activePayslips: ExtractedPayslip[];
  initialSubject: string;
  initialTemplate: string;
  initialThrottleRate: number;
  onConfirmSchedule: (
    scheduledAt: string,
    timezone: string,
    notifyHr: boolean,
    preNotifyEmployees: boolean,
    throttleRate: number
  ) => void;
  onClose: () => void;
}

export const ScheduleCampaignModal: React.FC<ScheduleCampaignModalProps> = ({
  payrollMonth,
  activePayslips,
  initialThrottleRate,
  onConfirmSchedule,
  onClose
}) => {
  // Default date to tomorrow at 09:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().substring(0, 10);

  const [scheduledDate, setScheduledDate] = useState(defaultDateStr);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [timezone, setTimezone] = useState('Europe/Paris (UTC+2 / CEST)');
  const [throttleRate, setThrottleRate] = useState<number>(initialThrottleRate || 120);
  const [notifyHr, setNotifyHr] = useState(true);
  const [preNotifyEmployees, setPreNotifyEmployees] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Format date nicely for display
  const getFormattedDateTime = () => {
    if (!scheduledDate) return 'Date non sélectionnée';
    try {
      const [year, month, day] = scheduledDate.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const formattedDate = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return `${formattedDate} à ${scheduledTime}`;
    } catch {
      return `${scheduledDate} à ${scheduledTime}`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!scheduledDate || !scheduledTime) {
      setErrorMsg('Veuillez sélectionner une date et une heure valides.');
      return;
    }

    // Validate that date/time is in the future
    const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const now = new Date();
    if (selectedDateTime <= now) {
      setErrorMsg('La date et l\'heure de distribution doivent être dans le futur.');
      return;
    }

    const fullScheduledAt = `${scheduledDate} ${scheduledTime}:00`;
    onConfirmSchedule(
      fullScheduledAt,
      timezone,
      notifyHr,
      preNotifyEmployees,
      throttleRate
    );
  };

  // Calculate today for min date
  const todayStr = new Date().toISOString().substring(0, 10);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Planifier la Distribution Automatique
              </h3>
              <p className="text-xs text-slate-300">
                Campagne de paie {payrollMonth} • {activePayslips.length} destinataire(s)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Date d'Envoi Différé</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Heure d'Envoi</span>
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Timezone Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Fuseau Horaire de la Campagne</span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-slate-50/50"
            >
              <option value="Europe/Paris (UTC+2 / CEST)">Europe/Paris (UTC+2 / CEST - Heure de Paris)</option>
              <option value="GMT / UTC (+00:00)">GMT / UTC (+00:00 - Temps Universel)</option>
              <option value="Africa/Abidjan (UTC+0)">Africa/Abidjan (UTC+0 - Heure d'Afrique de l'Ouest)</option>
              <option value="Africa/Casablanca (UTC+1)">Africa/Casablanca (UTC+1)</option>
              <option value="America/New_York (UTC-4)">America/New_York (UTC-4 / EDT)</option>
            </select>
          </div>

          {/* Throttling Cadence */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Cadencement & Débit d'Envoi Réseau</span>
              <span className="text-[10px] text-blue-600 font-mono font-bold">
                ~{Math.max(50, Math.round(60000 / (throttleRate || 120)))}ms par e-mail
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="1000"
                value={throttleRate}
                onChange={(e) => setThrottleRate(parseInt(e.target.value) || 120)}
                className="w-full text-xs px-3 py-2 pr-20 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-800 bg-slate-50/50"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">
                e-mails/min
              </span>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-800 mb-1">
              Options d'Alerte et Notifications RH
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={notifyHr}
                onChange={(e) => setNotifyHr(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <BellRing className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Recevoir une confirmation e-mail RH au lancement de la file programmée</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={preNotifyEmployees}
                onChange={(e) => setPreNotifyEmployees(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Pré-avertir les {activePayslips.length} salariés sur WhatsApp / SMS avant l'envoi du bulletin</span>
            </label>
          </div>

          {/* Dynamic Summary Banner */}
          <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-950 text-xs space-y-1.5">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-blue-600" />
              <span>Récapitulatif de la Programmation</span>
            </div>
            <p className="text-blue-800 leading-relaxed">
              La distribution automatique pour <strong className="capitalize">{getFormattedDateTime()}</strong> ({timezone}) est prête.
              À cette heure-ci, le moteur KIBOSH traitera les <strong>{activePayslips.length} bulletins de paie</strong> avec chiffrement PDF individuel et envoi multicanal.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <CalendarClock className="w-4 h-4" />
              <span>Confirmer & Planifier ({activePayslips.length} Employés)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
