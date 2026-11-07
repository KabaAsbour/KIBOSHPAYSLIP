import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  KeyRound, 
  Lock, 
  Unlock, 
  Mail, 
  Phone, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { CompanyUser, CompanyTenant } from '../../types';

interface CompanyAdminsTabProps {
  administrators: CompanyUser[];
  companies: CompanyTenant[];
  onToggleStatus: (userId: string) => void;
  onTriggerPasswordReset: (user: CompanyUser) => void;
}

export const CompanyAdminsTab: React.FC<CompanyAdminsTabProps> = ({
  administrators,
  companies,
  onToggleStatus,
  onTriggerPasswordReset
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resetModalUser, setResetModalUser] = useState<CompanyUser | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const filteredAdmins = administrators.filter(admin => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      admin.fullName.toLowerCase().includes(q) ||
      admin.email.toLowerCase().includes(q) ||
      admin.username?.toLowerCase().includes(q) ||
      admin.companyName.toLowerCase().includes(q)
    );

    const matchesCompany = companyFilter === 'all' || admin.companyId === companyFilter;
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  const handleConfirmReset = () => {
    if (!resetModalUser) return;
    onTriggerPasswordReset(resetModalUser);
    setResetSuccessMessage(`Le lien de réinitialisation sécurisé a été généré pour ${resetModalUser.email}. L'administrateur sera invité à définir son nouveau mot de passe.`);
    setTimeout(() => {
      setResetModalUser(null);
      setResetSuccessMessage(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Administrateurs d'Entreprises (Comptes Tenants)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gouvernance centralisée des administrateurs délégués, gestion des statuts d'accès et réinitialisation sécurisée des identifiants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700">
            {filteredAdmins.length} administrateur(s) répertorié(s)
          </div>
        </div>
      </div>

      {/* Security Disclaimer Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Protection de confidentialité :</strong> Conformément aux règles de sécurité KIBOSH, aucun mot de passe en clair ni hachage cryptographique n'est exposé.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, identifiant ou entreprise..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Toutes les Entreprises</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Tous les Statuts</option>
          <option value="Active">Actif</option>
          <option value="Disabled">Désactivé</option>
          <option value="Locked">Verrouillé</option>
        </select>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Administrateur</th>
                <th className="py-3 px-4">Organisation Rattachée</th>
                <th className="py-3 px-4">Identifiant & Contact</th>
                <th className="py-3 px-4">Statut Compte</th>
                <th className="py-3 px-4">Sécurité MFA</th>
                <th className="py-3 px-4">Dernière Connexion</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">Aucun administrateur trouvé</p>
                    <p className="text-xs text-slate-400 mt-1">Ajustez les filtres ou effectuez une recherche différente.</p>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map(admin => (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {admin.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {admin.jobPosition || 'Administrateur Principal'}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{admin.companyName}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {admin.companyId}
                      </div>
                    </td>

                    {/* Username & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">
                        {admin.email}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>@{admin.username}</span>
                        {admin.phone && <span>• {admin.phone}</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {admin.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                          <Lock className="w-3 h-3 text-red-600" />
                          {admin.status}
                        </span>
                      )}
                    </td>

                    {/* MFA */}
                    <td className="py-3.5 px-4">
                      {admin.mfaEnabled ? (
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md font-bold text-[10px] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                          MFA Actif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-medium text-[10px] w-fit">
                          MFA Inactif
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{admin.lastLogin || 'Jamais connecté'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Trigger Password Reset */}
                        <button
                          onClick={() => setResetModalUser(admin)}
                          title="Déclencher la réinitialisation de mot de passe"
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 border border-amber-200"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Réinitialiser</span>
                        </button>

                        {/* Disable / Enable Account */}
                        <button
                          onClick={() => onToggleStatus(admin.id)}
                          title={admin.status === 'Active' ? 'Désactiver le compte' : 'Réactiver le compte'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            admin.status === 'Active'
                              ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          }`}
                        >
                          {admin.status === 'Active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Confirmation Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-200" />
                <h3 className="text-sm font-black text-white">Réinitialisation de Mot de Passe</h3>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {resetSuccessMessage ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{resetSuccessMessage}</span>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 leading-relaxed">
                    Vous êtes sur le point de déclencher la procédure de réinitialisation sécurisée du mot de passe pour :
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{resetModalUser.fullName}</div>
                    <div className="text-slate-500 font-mono">{resetModalUser.email}</div>
                    <div className="text-slate-500 font-semibold text-[11px]">{resetModalUser.companyName}</div>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Un jeton à usage unique sera généré. Le compte sera configuré pour forcer le renouvellement du mot de passe dès sa prochaine tentative de connexion.
                  </p>
                </>
              )}
            </div>

            {!resetSuccessMessage && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Confirmer la Réinitialisation</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
