import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  Eye, 
  Calendar, 
  Globe, 
  CreditCard, 
  Layers, 
  Users, 
  FileText, 
  ExternalLink,
  ArrowUpDown,
  Mail,
  Phone,
  Clock,
  Sparkles,
  AlertTriangle,
  X
} from 'lucide-react';
import { CompanyTenant, CompanyUser, SubscriptionRecord } from '../../types';

interface CompanyManagementTabProps {
  companies: CompanyTenant[];
  allUsers: CompanyUser[];
  subscriptions: SubscriptionRecord[];
  onUpdateStatus: (companyId: string, status: CompanyTenant['status']) => void;
  onUpdateSubscription: (companyId: string, plan: CompanyTenant['subscriptionPlan'], expirationIso: string) => void;
  onStartSupportSession: (company: CompanyTenant) => void;
  onOpenCreateCompanyModal: () => void;
}

export const CompanyManagementTab: React.FC<CompanyManagementTabProps> = ({
  companies,
  allUsers,
  subscriptions,
  onUpdateStatus,
  onUpdateSubscription,
  onStartSupportSession,
  onOpenCreateCompanyModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedCompany, setSelectedCompany] = useState<CompanyTenant | null>(null);
  const [planModalCompany, setPlanModalCompany] = useState<CompanyTenant | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CompanyTenant['subscriptionPlan']>('Professional');
  const [planExpirationMonths, setPlanExpirationMonths] = useState<number>(12);

  // Distinct countries for filter
  const distinctCountries = Array.from(new Set(companies.map(c => c.country).filter(Boolean)));

  // Filtered & Sorted list
  const filtered = companies.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || (
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.country && c.country.toLowerCase().includes(q)) ||
      (c.companyEmail && c.companyEmail.toLowerCase().includes(q)) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );

    const matchCountry = countryFilter === 'all' || c.country === countryFilter;
    const matchPlan = planFilter === 'all' || c.subscriptionPlan === planFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;

    let matchSub = true;
    if (subStatusFilter !== 'all') {
      const sub = subscriptions.find(s => s.companyId === c.id);
      matchSub = !!sub && sub.status === subStatusFilter;
    }

    return matchSearch && matchCountry && matchPlan && matchStatus && matchSub;
  }).sort((a, b) => {
    if (sortField === 'name') {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? cmp : -cmp;
    }
    const da = new Date(a.registrationDate || 0).getTime();
    const db = new Date(b.registrationDate || 0).getTime();
    return sortOrder === 'asc' ? da - db : db - da;
  });

  const handleSavePlanUpgrade = () => {
    if (!planModalCompany) return;
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + planExpirationMonths);
    onUpdateSubscription(planModalCompany.id, selectedPlan, nextDate.toISOString());
    setPlanModalCompany(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Gestion des Entreprises & Organisations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance, approbations, activation, suspension et gestion contractuelle des tenants KIBOSH.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateCompanyModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enregistrer une Organisation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom d'entreprise, ID, pays, secteur ou email..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Country filter */}
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les Pays ({distinctCountries.length})</option>
            {distinctCountries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Plan filter */}
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les Forfaits</option>
            <option value="Free Trial">Essai Gratuit</option>
            <option value="Starter">Starter</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les Statuts</option>
            <option value="Active">Actif</option>
            <option value="Pending Activation">En attente d'activation</option>
            <option value="Suspended">Suspendu</option>
            <option value="Expired">Expiré</option>
          </select>

          {/* Subscription status */}
          <select
            value={subStatusFilter}
            onChange={e => setSubStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Statut Abonnement</option>
            <option value="Active">Abonnement Actif</option>
            <option value="Trial">En Période d'Essai</option>
            <option value="Pending">Paiement en Attente</option>
            <option value="Expired">Abonnement Échu</option>
            <option value="Suspended">Abonnement Suspendu</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button
              onClick={() => {
                if (sortField === 'date') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                else { setSortField('date'); setSortOrder('desc'); }
              }}
              title="Trier par date d'enregistrement"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                sortField === 'date' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
            </button>
            <button
              onClick={() => {
                if (sortField === 'name') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                else { setSortField('name'); setSortOrder('asc'); }
              }}
              title="Trier par nom alphabétique"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                sortField === 'name' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Nom {sortField === 'name' && (sortOrder === 'asc' ? 'A-Z' : 'Z-A')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>{filtered.length} entreprise(s) affichée(s) sur {companies.length} au total</span>
          {(searchQuery || countryFilter !== 'all' || planFilter !== 'all' || statusFilter !== 'all' || subStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCountryFilter('all');
                setPlanFilter('all');
                setStatusFilter('all');
                setSubStatusFilter('all');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Entreprise & ID</th>
                <th className="py-3 px-4">Pays & Secteur</th>
                <th className="py-3 px-4">Effectif & Contact</th>
                <th className="py-3 px-4">Offre & Échéance</th>
                <th className="py-3 px-4">Statut Organisation</th>
                <th className="py-3 px-4">Utilisateurs / Paies</th>
                <th className="py-3 px-4 text-right">Actions de Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">Aucune entreprise trouvée</p>
                    <p className="text-xs text-slate-400 mt-1">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(company => {
                  const companyAdmins = allUsers.filter(u => u.companyId === company.id && u.role === 'Company Administrator');
                  const primaryAdmin = companyAdmins[0];
                  const sub = subscriptions.find(s => s.companyId === company.id);

                  return (
                    <tr key={company.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {company.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{company.id}</span>
                          <span className="text-slate-300">•</span>
                          <span>Inscrit le {company.registrationDate}</span>
                        </div>
                      </td>

                      {/* Country & Industry */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{company.country}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]" title={company.industry}>
                          {company.industry || 'Général'}
                        </div>
                      </td>

                      {/* Size & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">
                          {company.size} salariés
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]" title={company.companyEmail}>
                          {company.companyEmail || (primaryAdmin ? primaryAdmin.email : 'N/A')}
                        </div>
                      </td>

                      {/* Plan & Expiration */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            company.subscriptionPlan === 'Enterprise' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            company.subscriptionPlan === 'Professional' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            company.subscriptionPlan === 'Starter' ? 'bg-teal-100 text-teal-700 border border-teal-200' :
                            'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {company.subscriptionPlan}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Échéance : {company.accessExpiresAt ? company.accessExpiresAt.split('T')[0] : 'Indéterminée'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {company.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Actif
                            </span>
                          ) : company.status === 'Pending Activation' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              En attente
                            </span>
                          ) : company.status === 'Suspended' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                              <Lock className="w-3 h-3 text-red-600" />
                              Suspendu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {company.status}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">
                          {company.totalUsersCount || 1} admin / {company.totalEmployeesCount || 0} emp.
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {company.totalPayslipsProcessed || 0} bulletins traités
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setSelectedCompany(company)}
                            title="Consulter la fiche profil complète"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Upgrade Plan */}
                          <button
                            onClick={() => {
                              setPlanModalCompany(company);
                              setSelectedPlan(company.subscriptionPlan);
                            }}
                            title="Gérer le plan d'abonnement"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Pending Approval / Rejection */}
                          {company.status === 'Pending Activation' ? (
                            <>
                              <button
                                onClick={() => onUpdateStatus(company.id, 'Active')}
                                title="Approuver et activer l'organisation"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approuver</span>
                              </button>
                              <button
                                onClick={() => onUpdateStatus(company.id, 'Suspended')}
                                title="Rejeter l'inscription"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            /* Activate / Suspend */
                            <button
                              onClick={() => onUpdateStatus(company.id, company.status === 'Active' ? 'Suspended' : 'Active')}
                              title={company.status === 'Active' ? 'Suspendre l\'organisation' : 'Réactiver l\'organisation'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                company.status === 'Active'
                                  ? 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              }`}
                            >
                              {company.status === 'Active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Support Impersonation Session */}
                          <button
                            onClick={() => onStartSupportSession(company)}
                            title="Ouvrir session support déléguée (auditée)"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Full Company Profile Drawer/Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                  <Building2 className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedCompany.name}</h3>
                  <p className="text-xs text-indigo-200 font-mono">ID Système : {selectedCompany.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Section 1: Business Metadata */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informations Légales & Contact</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block">Pays d'Implantation :</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedCompany.country}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Secteur d'Activité :</span>
                    <span className="font-semibold text-slate-800">{selectedCompany.industry || 'Non spécifié'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Taille de l'Organisation :</span>
                    <span className="font-semibold text-slate-800">{selectedCompany.size} collaborateurs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Date d'Enregistrement :</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedCompany.registrationDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">E-mail Institutionnel :</span>
                    <span className="font-semibold text-slate-800">{selectedCompany.companyEmail || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Téléphone Standard :</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedCompany.companyPhone || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Subscription & Expiration */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Abonnement & Droits d'Accès</h4>
                <div className="grid grid-cols-3 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <div>
                    <span className="text-indigo-400 block">Plan Souscrit :</span>
                    <span className="font-bold text-indigo-900 text-sm">{selectedCompany.subscriptionPlan}</span>
                  </div>
                  <div>
                    <span className="text-indigo-400 block">Statut Contractuel :</span>
                    <span className="font-bold text-indigo-900">{selectedCompany.status}</span>
                  </div>
                  <div>
                    <span className="text-indigo-400 block">Date d'Échéance :</span>
                    <span className="font-bold text-indigo-900 font-mono">
                      {selectedCompany.accessExpiresAt ? selectedCompany.accessExpiresAt.split('T')[0] : 'Indéterminée'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Administrators for this Company */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Administrateurs Rattachés</h4>
                <div className="space-y-2">
                  {allUsers.filter(u => u.companyId === selectedCompany.id && u.role === 'Company Administrator').length === 0 ? (
                    <p className="text-slate-400 italic">Aucun compte administrateur direct trouvé pour cette entreprise.</p>
                  ) : (
                    allUsers
                      .filter(u => u.companyId === selectedCompany.id && u.role === 'Company Administrator')
                      .map(adm => (
                        <div key={adm.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{adm.fullName}</div>
                            <div className="text-slate-500 font-mono text-[11px]">{adm.email} • {adm.username}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${adm.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {adm.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  onStartSupportSession(selectedCompany);
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Basculer en Mode Assistance</span>
              </button>
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Plan Upgrade / Subscription Modifier */}
      {planModalCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-blue-300" />
                <h3 className="text-sm font-black text-white">Modifier l'Abonnement</h3>
              </div>
              <button onClick={() => setPlanModalCompany(null)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Ajustez le niveau de forfait et la durée contractuelle pour <strong>{planModalCompany.name}</strong>.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Forfait KIBOSH :</label>
                <select
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                >
                  <option value="Free Trial">Essai Gratuit (30 Jours, 100 paies)</option>
                  <option value="Starter">Starter (79 €/mois, 50 employés)</option>
                  <option value="Professional">Professional (189 €/mois, 250 employés)</option>
                  <option value="Enterprise">Enterprise (490 €/mois, 1 000+ employés)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Durée d'Extension :</label>
                <select
                  value={planExpirationMonths}
                  onChange={e => setPlanExpirationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                >
                  <option value={1}>1 Mois</option>
                  <option value={3}>3 Mois (Trimestre)</option>
                  <option value={6}>6 Mois (Semestre)</option>
                  <option value={12}>12 Mois (Annuel - Recommandé)</option>
                  <option value={24}>24 Mois (Pluriannuel)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setPlanModalCompany(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePlanUpgrade}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 cursor-pointer"
              >
                Enregistrer & Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
