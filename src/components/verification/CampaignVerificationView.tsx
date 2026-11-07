import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Mail, 
  Edit2, 
  Sliders, 
  Send, 
  ShieldCheck, 
  FileText,
  UserX,
  UserCheck,
  Search,
  RotateCw,
  MessageSquare,
  Phone,
  Share2,
  CalendarClock
} from 'lucide-react';
import { ExtractedPayslip, DistributionCampaign, EmailSettings, DeliveryChannel } from '../../types';
import { PayslipPreviewModal } from './PayslipPreviewModal';
import { EmailTemplateModal } from './EmailTemplateModal';
import { EmailPreviewModal } from './EmailPreviewModal';
import { ScheduleCampaignModal } from './ScheduleCampaignModal';

interface CampaignVerificationViewProps {
  campaignData: Partial<DistributionCampaign>;
  extractedPayslips: ExtractedPayslip[];
  emailSettings: EmailSettings;
  onLaunchCampaign: (
    payslipsToDistribute: ExtractedPayslip[],
    subject: string,
    template: string,
    throttleRatePerMin?: number
  ) => void;
  onScheduleCampaign?: (
    payslipsToDistribute: ExtractedPayslip[],
    subject: string,
    template: string,
    scheduledAt: string,
    timezone: string,
    throttleRatePerMin?: number
  ) => void;
  onCancel: () => void;
}

export const CampaignVerificationView: React.FC<CampaignVerificationViewProps> = ({
  campaignData,
  extractedPayslips: initialPayslips,
  emailSettings,
  onLaunchCampaign,
  onScheduleCampaign,
  onCancel
}) => {
  const [payslips, setPayslips] = useState<ExtractedPayslip[]>(initialPayslips);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [defaultChannel, setDefaultChannel] = useState<DeliveryChannel>('Both');

  // Preview & Modal States
  const [previewPayslip, setPreviewPayslip] = useState<ExtractedPayslip | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEmailPayslipId, setSelectedEmailPayslipId] = useState<string | undefined>(undefined);

  // Email Config & Throttling Rate
  const [emailSubject, setEmailSubject] = useState(
    emailSettings.defaultSubject.replace('{Month}', campaignData.payrollMonth?.split(' ')[0] || 'July').replace('{Year}', '2026')
  );
  const [emailTemplate, setEmailTemplate] = useState(emailSettings.defaultTemplate);
  const [throttleRate, setThrottleRate] = useState<number>(emailSettings.throttleRatePerMin || 120);

  // Editing email/phone inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');
  const [editingPhoneValue, setEditingPhoneValue] = useState('');

  const handleSaveContactInfo = (id: string) => {
    setPayslips(prev => prev.map(p => {
      if (p.id === id) {
        const isEmailVal = editingEmailValue.includes('@') && !editingEmailValue.includes('invalid');
        return {
          ...p,
          email: editingEmailValue,
          phone: editingPhoneValue,
          status: isEmailVal || editingPhoneValue.length > 5 ? 'Matched' : 'Missing Email'
        };
      }
      return p;
    }));
    setEditingId(null);
  };

  const handleSetGlobalChannel = (channel: DeliveryChannel) => {
    setDefaultChannel(channel);
    setPayslips(prev => prev.map(p => ({ ...p, deliveryChannel: channel })));
  };

  const handleSetRowChannel = (id: string, channel: DeliveryChannel) => {
    setPayslips(prev => prev.map(p => p.id === id ? { ...p, deliveryChannel: channel } : p));
  };

  const handleAutoAssignTestEmails = (targetEmail: string = 'contact@enterprise-corp.com') => {
    setPayslips(prev => prev.map((p, idx) => {
      if (!p.email || p.email.includes('invalid') || p.status === 'Missing Email') {
        const cleanName = p.employeeName.toLowerCase().replace(/[^a-z]/g, '');
        const generatedEmail = targetEmail || `${cleanName || 'employee'}${idx + 1}@enterprise-corp.com`;
        return {
          ...p,
          email: generatedEmail,
          status: 'Matched'
        };
      }
      return p;
    }));
  };

  const handleToggleExclude = (id: string) => {
    setPayslips(prev => prev.map(p => p.id === id ? { ...p, isExcluded: !p.isExcluded } : p));
  };

  const filteredPayslips = payslips.filter(p => {
    const matchesSearch = 
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'matched') return matchesSearch && p.status === 'Matched' && !p.isExcluded;
    if (statusFilter === 'missing') return matchesSearch && (p.status === 'Missing Email' || !p.email);
    if (statusFilter === 'excluded') return matchesSearch && p.isExcluded;

    return matchesSearch;
  });

  const activePayslips = payslips.filter(p => !p.isExcluded);
  const matchedCount = activePayslips.filter(p => p.status === 'Matched').length;
  const missingEmailCount = activePayslips.filter(p => p.status === 'Missing Email' || !p.email).length;
  const totalNetPaySum = activePayslips.reduce((acc, p) => acc + p.netPay, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Module 7 — Vérification Avant Distribution Multicanale
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Vérifier les Bulletins Extraits pour {campaignData.payrollMonth || 'Juillet 2026'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Validez les fiches employés, choisissez le canal de distribution (E-mail, WhatsApp ou Les deux), ajustez les coordonnées et prévisualisez les messages avant l'envoi.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Annuler
          </button>
          
          <button
            onClick={() => setShowScheduleModal(true)}
            disabled={activePayslips.length === 0}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 disabled:opacity-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <CalendarClock className="w-4 h-4 text-indigo-600" />
            <span>Planifier la Distribution</span>
          </button>

          <button
            onClick={() => onLaunchCampaign(activePayslips, emailSubject, emailTemplate, throttleRate)}
            disabled={activePayslips.length === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Lancer la Campagne ({activePayslips.length} Employés)</span>
          </button>
        </div>
      </div>

      {/* Global Channel Selector Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <span>Sélection Globale du Canal de Envoi des Bulletins PDF</span>
          </div>
          <p className="text-xs text-slate-300">
            Choisissez si les bulletins de paie seront envoyés par E-mail, sur le WhatsApp de l'employé, ou sur les deux canaux.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => handleSetGlobalChannel('Email')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              defaultChannel === 'Email' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-mail</span>
          </button>

          <button
            onClick={() => handleSetGlobalChannel('WhatsApp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              defaultChannel === 'WhatsApp' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => handleSetGlobalChannel('Both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              defaultChannel === 'Both' ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Les deux (E-mail + WhatsApp)</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Bulletins Découpés</div>
          <div className="text-xl font-black text-slate-900 mt-1">{payslips.length} Documents</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{activePayslips.length} Inclus dans la File</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">E-mails / Téléphones Valides</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{matchedCount} Valides</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Prêts pour envoi immédiat</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">E-mails Manquants / Invalides</div>
          <div className="text-xl font-black text-amber-600 mt-1">{missingEmailCount} Avertissements</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Cliquez sur l'icône éditer pour corriger</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Net à Payer Envoyé</div>
          <div className="text-xl font-black text-blue-600 mt-1">€ {totalNetPaySum.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Fiches Confidentielles</div>
        </div>
      </div>

      {/* Missing Email Diagnostic Banner */}
      {missingEmailCount > 0 && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-amber-950 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm text-amber-900">
                Pourquoi les destinataires ne reçoivent pas les e-mails ({missingEmailCount} avertissements sur {payslips.length} employés) ?
              </div>
              <p className="text-amber-800 leading-relaxed max-w-3xl">
                Actuellement, <strong>{missingEmailCount} employés</strong> n'ont pas d'adresse e-mail associée (<em>"Aucun e-mail enregistré"</em>). Vous pouvez soit corriger leur adresse e-mail, basculer vers <strong>WhatsApp</strong>, soit attribuer l'e-mail de test.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleAutoAssignTestEmails('contact@enterprise-corp.com')}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors shrink-0 whitespace-nowrap shadow-xs cursor-pointer flex items-center gap-2"
          >
            <span>⚡ Attribuer contact@enterprise-corp.com aux {missingEmailCount} fiches</span>
          </button>
        </div>
      )}

      {/* Config Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:w-auto">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Objet de l'E-mail / Titre de la Notification
          </label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Email Throttling Rate Control */}
        <div className="w-full md:w-64">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Débit d'Envoi (Cadencement)</span>
            <span className="text-[10px] text-blue-600 font-mono font-bold">
              ~{Math.max(50, Math.round(60000 / (throttleRate || 120)))}ms délai
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="1000"
              value={throttleRate}
              onChange={(e) => setThrottleRate(parseInt(e.target.value) || 120)}
              className="w-full text-xs px-3 py-2 pr-20 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
            <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">
              e-mails/min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
          <button
            onClick={() => {
              setSelectedEmailPayslipId(undefined);
              setShowEmailPreviewModal(true);
            }}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-blue-200 whitespace-nowrap cursor-pointer shadow-2xs"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Aperçu E-mail / WhatsApp</span>
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-slate-300 whitespace-nowrap cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Personnaliser le Modèle</span>
          </button>
        </div>
      </div>

      {/* Main Payslips Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher employé, matricule, département..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-semibold">Filtrer :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-medium bg-slate-50 outline-none"
            >
              <option value="all">Tous les Enregistrements ({payslips.length})</option>
              <option value="matched">Coordonnées Valides ({matchedCount})</option>
              <option value="missing">Coordonnées Manquantes ({missingEmailCount})</option>
              <option value="excluded">Éléments Exclus ({payslips.filter(p => p.isExcluded).length})</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Nom de l'Employé</th>
                <th className="py-3 px-4">Canal d'Envoi</th>
                <th className="py-3 px-4">Adresse E-mail & Téléphone</th>
                <th className="py-3 px-4 text-right">Net à Payer (€)</th>
                <th className="py-3 px-4 text-center">Confiance</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayslips.map((p) => {
                const currentChannel = p.deliveryChannel || defaultChannel;
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      p.isExcluded ? 'opacity-40 bg-slate-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {p.matricule}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.employeeName}</div>
                      <div className="text-[11px] text-slate-400">{p.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={currentChannel}
                        onChange={(e) => handleSetRowChannel(p.id, e.target.value as DeliveryChannel)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-bold outline-none cursor-pointer ${
                          currentChannel === 'Email' 
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : currentChannel === 'WhatsApp'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        <option value="Email">📧 E-mail</option>
                        <option value="WhatsApp">💬 WhatsApp</option>
                        <option value="Both">🚀 E-mail + WhatsApp</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {editingId === p.id ? (
                        <div className="space-y-1.5 p-2 bg-slate-50 rounded-lg border border-blue-300">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                            <input
                              type="email"
                              value={editingEmailValue}
                              onChange={(e) => setEditingEmailValue(e.target.value)}
                              placeholder="E-mail..."
                              className="text-xs px-2 py-0.5 rounded border border-slate-300 outline-none w-52 font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <input
                              type="text"
                              value={editingPhoneValue}
                              onChange={(e) => setEditingPhoneValue(e.target.value)}
                              placeholder="Téléphone WhatsApp (+33...)"
                              className="text-xs px-2 py-0.5 rounded border border-slate-300 outline-none w-52 font-mono"
                            />
                          </div>
                          <button
                            onClick={() => handleSaveContactInfo(p.id)}
                            className="w-full py-1 bg-blue-600 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            Enregistrer Coordonnées
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-0.5 group">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className={`font-mono text-xs ${
                              !p.email || p.email.includes('invalid') ? 'text-amber-600 font-bold' : 'text-slate-700'
                            }`}>
                              {p.email || 'Aucun e-mail'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingId(p.id);
                                setEditingEmailValue(p.email || '');
                                setEditingPhoneValue(p.phone || '');
                              }}
                              className="text-slate-400 hover:text-blue-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-1"
                              title="Modifier les coordonnées"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="font-mono text-[11px] text-slate-500 font-semibold">
                              {p.phone || '+33 6 12 34 56 78'}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      € {p.netPay.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.confidenceScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.isExcluded ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          Exclu
                        </span>
                      ) : p.status === 'Matched' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Conforme
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Avertissement
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewPayslip(p)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Aperçu PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedEmailPayslipId(p.id);
                            setShowEmailPreviewModal(true);
                          }}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Aperçu E-mail / WhatsApp Destinataire"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span>Message</span>
                        </button>

                        <button
                          onClick={() => handleToggleExclude(p.id)}
                          className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                            p.isExcluded
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={p.isExcluded ? "Inclure dans l'envoi" : "Exclure de l'envoi"}
                        >
                          {p.isExcluded ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PayslipPreviewModal
        payslip={previewPayslip}
        onClose={() => setPreviewPayslip(null)}
      />

      {/* Email Template Modal */}
      {showTemplateModal && (
        <EmailTemplateModal
          settings={emailSettings}
          onSave={(sub, tmpl) => {
            setEmailSubject(sub);
            setEmailTemplate(tmpl);
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {/* Email Preview Modal */}
      {showEmailPreviewModal && (
        <EmailPreviewModal
          payslips={payslips}
          initialPayslipId={selectedEmailPayslipId}
          emailSubject={emailSubject}
          emailTemplate={emailTemplate}
          emailSettings={emailSettings}
          payrollMonth={campaignData.payrollMonth || 'Juillet 2026'}
          onClose={() => {
            setShowEmailPreviewModal(false);
            setSelectedEmailPayslipId(undefined);
          }}
        />
      )}

      {/* Schedule Campaign Modal */}
      {showScheduleModal && (
        <ScheduleCampaignModal
          payrollMonth={campaignData.payrollMonth || 'Juillet 2026'}
          activePayslips={activePayslips}
          initialSubject={emailSubject}
          initialTemplate={emailTemplate}
          initialThrottleRate={throttleRate}
          onConfirmSchedule={(schedAt, tz, notifHr, preNotif, rate) => {
            setShowScheduleModal(false);
            if (onScheduleCampaign) {
              onScheduleCampaign(activePayslips, emailSubject, emailTemplate, schedAt, tz, rate);
            } else {
              // Fallback to onLaunchCampaign if not explicitly passed
              onLaunchCampaign(activePayslips, emailSubject, emailTemplate, rate);
            }
          }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
};

