import React, { useState } from 'react';
import { 
  AlertOctagon, 
  RefreshCw, 
  Edit3, 
  Mail, 
  MessageSquare,
  Search, 
  CheckCircle2, 
  ShieldAlert,
  Phone,
  ExternalLink,
  Share2
} from 'lucide-react';
import { DistributionCampaign, DeliveryRecord } from '../../types';
import { EmailEngine } from '../../services/emailEngine';

interface FailedDeliveriesViewProps {
  campaigns: DistributionCampaign[];
  onUpdateRecord: (updatedRecord: DeliveryRecord) => void;
  onRefreshCampaigns: () => void;
}

export const FailedDeliveriesView: React.FC<FailedDeliveriesViewProps> = ({
  campaigns,
  onUpdateRecord,
  onRefreshCampaigns
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp'>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEmailValue, setNewEmailValue] = useState('');
  const [newPhoneValue, setNewPhoneValue] = useState('');
  const [isBulkRetrying, setIsBulkRetrying] = useState(false);

  // Extract all failed records (either Email or WhatsApp failure) across all campaigns
  const failedRecords: { record: DeliveryRecord; campaignId: string; campaignMonth: string }[] = [];

  campaigns.forEach(c => {
    c.records.forEach(r => {
      const isEmailFailed = r.status === 'Failed';
      const isWhatsAppFailed = r.whatsappStatus === 'Failed';
      if (isEmailFailed || isWhatsAppFailed) {
        failedRecords.push({
          record: r,
          campaignId: c.id,
          campaignMonth: c.payrollMonth
        });
      }
    });
  });

  const handleSingleRetry = async (item: typeof failedRecords[0]) => {
    setRetryingId(item.record.id);
    const updated = await EmailEngine.retryFailedRecord(
      item.record,
      editingId === item.record.id ? newEmailValue : undefined,
      editingId === item.record.id ? newPhoneValue : undefined
    );
    onUpdateRecord(updated);
    setRetryingId(null);
    setEditingId(null);
  };

  const handleBulkRetry = async () => {
    setIsBulkRetrying(true);
    for (let i = 0; i < failedRecords.length; i++) {
      const item = failedRecords[i];
      const fixedEmail = item.record.email.replace('.invalid-domain', '@enterprise-corp.com');
      const fixedPhone = item.record.phone || '+33612345678';
      const updated = await EmailEngine.retryFailedRecord(item.record, fixedEmail, fixedPhone);
      onUpdateRecord(updated);
      await new Promise(r => setTimeout(r, 400));
    }
    setIsBulkRetrying(false);
    onRefreshCampaigns();
  };

  const filtered = failedRecords.filter(item => {
    const matchesSearch = 
      item.record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.record.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.record.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.record.phone && item.record.phone.includes(searchQuery)) ||
      item.campaignId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (channelFilter === 'email') return item.record.status === 'Failed';
    if (channelFilter === 'whatsapp') return item.record.whatsappStatus === 'Failed';
    return true;
  });

  const emailFailuresCount = failedRecords.filter(i => i.record.status === 'Failed').length;
  const whatsappFailuresCount = failedRecords.filter(i => i.record.whatsappStatus === 'Failed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            Module 11 — Gestion & Suivi Multicanal des Échecs
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Envois de Bulletins Échoués et Rejetés (E-mail & WhatsApp)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Supervisez les échecs de livraison SMTP ainsi que les rejets API WhatsApp Business. Corrigez les coordonnées des salariés et relancez la distribution en un clic.
          </p>
        </div>

        {failedRecords.length > 0 && (
          <button
            onClick={handleBulkRetry}
            disabled={isBulkRetrying}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isBulkRetrying ? 'animate-spin' : ''}`} />
            <span>{isBulkRetrying ? 'Nouvelle Tentative de la File...' : 'Auto-Corriger & Réessayer Tout'}</span>
          </button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer par nom, matricule, e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>

            {/* Channel filter tabs */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg border border-slate-300/60 text-xs">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  channelFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous ({failedRecords.length})
              </button>
              <button
                onClick={() => setChannelFilter('email')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  channelFilter === 'email' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Mail className="w-3 h-3" />
                <span>Échecs E-mail ({emailFailuresCount})</span>
              </button>
              <button
                onClick={() => setChannelFilter('whatsapp')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  channelFilter === 'whatsapp' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>Échecs WhatsApp ({whatsappFailuresCount})</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            {filtered.length} Échecs Nécessitant Intervention
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-900">Aucun Échec d'Envoi Restant !</div>
            <div className="text-xs text-slate-500">Tous les bulletins de paie sélectionnés ont été distribués avec succès.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Campagne</th>
                  <th className="py-3 px-4">Employé</th>
                  <th className="py-3 px-4">Coordonnées (E-mail / WhatsApp)</th>
                  <th className="py-3 px-4">Statuts Multicanaux</th>
                  <th className="py-3 px-4">Raison des Échecs</th>
                  <th className="py-3 px-4 text-center">Essais</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const r = item.record;
                  const isEmailFail = r.status === 'Failed';
                  const isWaFail = r.whatsappStatus === 'Failed';
                  const isEditing = editingId === r.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div>{item.campaignId}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.campaignMonth}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div>{r.employeeName}</div>
                        <div className="font-mono text-[11px] text-slate-400 font-medium">Mat: {r.matricule}</div>
                      </td>

                      {/* Coordonnées Column */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="space-y-1.5 p-2 bg-blue-50/70 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <input
                                type="email"
                                value={newEmailValue}
                                onChange={(e) => setNewEmailValue(e.target.value)}
                                placeholder="E-mail..."
                                className="px-2 py-0.5 rounded border border-slate-300 text-xs w-48 font-mono outline-none bg-white"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <input
                                type="text"
                                value={newPhoneValue}
                                onChange={(e) => setNewPhoneValue(e.target.value)}
                                placeholder="Téléphone WhatsApp..."
                                className="px-2 py-0.5 rounded border border-slate-300 text-xs w-48 font-mono outline-none bg-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className={isEmailFail ? 'text-red-600 font-bold' : 'text-slate-700'}>
                                {r.email || 'Aucun email'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className={isWaFail ? 'text-red-600 font-bold' : 'text-slate-600'}>
                                {r.phone || 'Aucun numéro'}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Statuts Multicanaux Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {/* E-mail Badge */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold w-12">E-mail:</span>
                            {r.status === 'Delivered' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Livré
                              </span>
                            ) : r.status === 'Failed' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                Échec SMTP
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                Non concerné
                              </span>
                            )}
                          </div>

                          {/* WhatsApp Badge */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold w-12">WhatsApp:</span>
                            {r.whatsappStatus === 'Delivered' || r.whatsappStatus === 'Read' || r.whatsappStatus === 'Sent' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {r.whatsappStatus}
                              </span>
                            ) : r.whatsappStatus === 'Failed' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                Échec WA
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                Non configuré
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Raison de l'échec Column */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          {isEmailFail && (
                            <div className="text-[11px] text-red-700 font-medium bg-red-50/60 p-1.5 rounded border border-red-100" title={r.errorMessage}>
                              <span className="font-bold">E-mail:</span> {r.errorMessage || 'Erreur SMTP'}
                            </div>
                          )}
                          {isWaFail && (
                            <div className="text-[11px] text-amber-800 font-medium bg-amber-50/60 p-1.5 rounded border border-amber-200/60" title={r.whatsappErrorMessage}>
                              <span className="font-bold">WhatsApp:</span> {r.whatsappErrorMessage || 'Erreur API Meta WhatsApp'}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {r.retryCount}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <button
                              onClick={() => handleSingleRetry(item)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Sauvegarder & Réessayer
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(r.id);
                                  setNewEmailValue(r.email.includes('invalid') ? r.email.replace('.invalid-domain', '@enterprise-corp.com') : r.email);
                                  setNewPhoneValue(r.phone || '+33612345678');
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="Modifier les coordonnées"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Éditer</span>
                              </button>

                              {r.phone && r.phone.length > 5 && (
                                <a
                                  href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${r.employeeName}, voici votre bulletin de paie ${r.payPeriod}`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-semibold flex items-center gap-1 border border-emerald-200 cursor-pointer"
                                  title="Envoyer via WhatsApp Web direct"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>WA Direct</span>
                                </a>
                              )}

                              <button
                                onClick={() => handleSingleRetry(item)}
                                disabled={retryingId === r.id}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${retryingId === r.id ? 'animate-spin' : ''}`} />
                                <span>Réessayer</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

