import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  DollarSign, 
  HardDrive, 
  Users, 
  FileCheck,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';
import { SubscriptionRecord } from '../../types';

interface SubscriptionsTabProps {
  subscriptions: SubscriptionRecord[];
  onVerifyPayment: (subscriptionId: string, paymentMethod: string, paymentReference: string, notes?: string) => void;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({
  subscriptions,
  onVerifyPayment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify payment modal state
  const [targetSub, setTargetSub] = useState<SubscriptionRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Virement Bancaire SEPA');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const filtered = subscriptions.filter(sub => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || (
      sub.companyName.toLowerCase().includes(q) ||
      sub.id.toLowerCase().includes(q) ||
      (sub.paymentReference && sub.paymentReference.toLowerCase().includes(q))
    );

    const matchPlan = planFilter === 'all' || sub.plan === planFilter;
    const matchStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchSearch && matchPlan && matchStatus;
  });

  const handleConfirmVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);

    if (!paymentReference.trim()) {
      setVerifyError('Veuillez renseigner la référence bancaire ou transactionnelle.');
      return;
    }

    if (!targetSub) return;

    onVerifyPayment(targetSub.id, paymentMethod, paymentReference.trim(), paymentNotes.trim());
    setVerifySuccess(`Paiement vérifié avec succès pour ${targetSub.companyName}. L'abonnement est actif pour 12 mois.`);
    setTimeout(() => {
      setTargetSub(null);
      setVerifySuccess(null);
      setPaymentReference('');
      setPaymentNotes('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Portefeuille & Gestion des Abonnements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des forfaits, cycles de renouvellement, quotas contractuels et validation manuelle des règlements d'entreprises.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{subscriptions.filter(s => s.status === 'Active' || s.status === 'Trial').length} Actifs / {subscriptions.length} Total</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par entreprise, ID d'abonnement ou référence..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Tous les Forfaits</option>
          <option value="Free Trial">Essai Gratuit</option>
          <option value="Starter">Starter (79 €/m)</option>
          <option value="Professional">Professional (189 €/m)</option>
          <option value="Enterprise">Enterprise (490 €/m)</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Tous les Statuts</option>
          <option value="Active">Actif</option>
          <option value="Trial">Période d'Essai</option>
          <option value="Pending">Paiement en Attente</option>
          <option value="Expired">Expiré</option>
          <option value="Suspended">Suspendu</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Organisation Cliente</th>
                <th className="py-3 px-4">Forfait & Tarif</th>
                <th className="py-3 px-4">Statut Abonnement</th>
                <th className="py-3 px-4">Quotas Contractuels</th>
                <th className="py-3 px-4">Période de Validité</th>
                <th className="py-3 px-4">Vérification Paiement</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">Aucun abonnement trouvé</p>
                    <p className="text-xs text-slate-400 mt-1">Ajustez vos filtres de recherche.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sub.companyName}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {sub.id}
                      </div>
                    </td>

                    {/* Plan & Pricing */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-indigo-900">
                        {sub.plan}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {sub.monthlyPriceEUR > 0 ? `${sub.monthlyPriceEUR} € / mois` : 'Gratuit (Évaluation)'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        sub.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                        sub.status === 'Trial' ? 'bg-blue-100 text-blue-800' :
                        sub.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {sub.status}
                      </span>
                    </td>

                    {/* Limits */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium text-[11px]">
                        {sub.maxUsers} admins • {sub.maxEmployees} emp.
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Quota : {sub.maxStorageMB} Mo
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-slate-800">
                        Du {sub.startDate}
                      </div>
                      <div className="text-slate-500">
                        Au {sub.expirationDate}
                      </div>
                    </td>

                    {/* Payment Verification */}
                    <td className="py-3.5 px-4">
                      {sub.paymentVerified ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Vérifié
                          </span>
                          {sub.paymentReference && (
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={sub.paymentReference}>
                              Réf: {sub.paymentReference}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          En attente de règlement
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setTargetSub(sub);
                          setPaymentReference(sub.paymentReference || `SEPA-${new Date().getFullYear()}-${sub.companyId.slice(-4).toUpperCase()}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
                          sub.paymentVerified
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{sub.paymentVerified ? 'Modifier' : 'Valider Paiement'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Verification Modal */}
      {targetSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-300" />
                <h3 className="text-sm font-black text-white">Vérification de Paiement</h3>
              </div>
              <button onClick={() => setTargetSub(null)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmVerification} className="p-6 space-y-4 text-xs">
              {verifyError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                  {verifyError}
                </div>
              )}
              {verifySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{verifySuccess}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400">Organisation :</div>
                <div className="font-bold text-slate-900 text-sm">{targetSub.companyName}</div>
                <div className="text-slate-600 font-semibold mt-1">Forfait : {targetSub.plan} ({targetSub.monthlyPriceEUR} €/mois)</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Moyen de Paiement *</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                >
                  <option value="Virement Bancaire SEPA">Virement Bancaire SEPA Entreprise</option>
                  <option value="Virement Bancaire Swift International">Virement Swift International</option>
                  <option value="Carte Bancaire Professionnelle">Carte Bancaire Visa / Mastercard Pro</option>
                  <option value="Prélèvement Automatique B2B">Prélèvement Automatique SEPA B2B</option>
                  <option value="Chèque d'Entreprise">Chèque d'Entreprise Certifié</option>
                  <option value="Offre Partenaire / Accord Cadre">Offre Partenaire / Accord Spécifique</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Référence Transactionnelle / Bancaire *</label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="ex: SEPA-2026-VIR-89104"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes Internes / Justificatif</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Observations, accord contractuel..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 resize-none"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTargetSub(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmer la Validation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
