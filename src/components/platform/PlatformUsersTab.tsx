import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Lock, 
  Unlock, 
  KeyRound, 
  Crown, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Mail,
  Shield,
  X
} from 'lucide-react';
import { CompanyUser, CompanyTenant, UserRole } from '../../types';

interface PlatformUsersTabProps {
  users: CompanyUser[];
  companies: CompanyTenant[];
  onToggleStatus: (userId: string) => void;
  onTriggerPasswordReset: (user: CompanyUser) => void;
  onCreateUser: (userData: Partial<CompanyUser>) => void;
}

export const PlatformUsersTab: React.FC<PlatformUsersTabProps> = ({
  users,
  companies,
  onToggleStatus,
  onTriggerPasswordReset,
  onCreateUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create User Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+33 6 12 34 56 78');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [role, setRole] = useState<UserRole>('Payroll Manager');
  const [password, setPassword] = useState('Password123!');
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const getRoleCategory = (userRole: UserRole) => {
    if (userRole === 'Platform Super Admin' || userRole === 'Super Administrator') return 'SAAS_OWNER';
    if (userRole === 'Company Administrator') return 'COMPANY_ADMIN';
    return 'SIMPLE_USER';
  };

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      user.fullName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q) ||
      user.companyName.toLowerCase().includes(q)
    );

    const cat = getRoleCategory(user.role);
    const matchesRole = roleFilter === 'all' || cat === roleFilter || user.role === roleFilter;
    const matchesCompany = companyFilter === 'all' || user.companyId === companyFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesCompany && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setCreateError('Veuillez renseigner le nom, le nom d\'utilisateur et l\'email.');
      return;
    }

    const targetCompany = companies.find(c => c.id === companyId);
    if (!targetCompany && companyId !== 'platform-control') {
      setCreateError('Entreprise sélectionnée invalide.');
      return;
    }

    // Role safety check: ordinary user cannot be created as SaaS Owner
    if (role === 'Platform Super Admin' && companyId !== 'platform-control') {
      setCreateError('Le rôle Propriétaire SaaS (Platform Super Admin) ne peut pas être assigné à une entreprise cliente.');
      return;
    }

    onCreateUser({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      phoneNumber: phone.replace(/\D/g, ''),
      companyId: targetCompany?.id || companyId,
      companyName: targetCompany?.name || 'KIBOSH Platform Management',
      role,
      password,
      mustChangePassword: forcePasswordChange,
      mfaEnabled
    });

    setCreateSuccess(`L'utilisateur ${fullName} a été créé avec succès.`);
    setTimeout(() => {
      setShowCreateModal(false);
      setCreateSuccess(null);
      setFullName('');
      setUsername('');
      setEmail('');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Annuaire Centralisé des Utilisateurs de la Plateforme
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Répertoire consolidé de tous les utilisateurs KIBOSH avec ségrégation stricte des rôles (SaaS Owner, Administrateurs Entreprises, Utilisateurs Simples).
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Créer un Utilisateur</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
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

        {/* Role Category Filter */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Tous les Rôles ({users.length})</option>
          <option value="SAAS_OWNER">Propriétaires SaaS (Super Admin)</option>
          <option value="COMPANY_ADMIN">Administrateurs Entreprises</option>
          <option value="SIMPLE_USER">Utilisateurs Simples (Gestionnaires Paie / RH)</option>
        </select>

        {/* Company Filter */}
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Toutes les Organisations</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Status Filter */}
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

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Utilisateur & ID</th>
                <th className="py-3 px-4">Organisation</th>
                <th className="py-3 px-4">Catégorie de Rôle</th>
                <th className="py-3 px-4">Statut Compte</th>
                <th className="py-3 px-4">Date de Création</th>
                <th className="py-3 px-4">Dernière Connexion</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">Aucun utilisateur trouvé</p>
                    <p className="text-xs text-slate-400 mt-1">Ajustez vos filtres ou effectuez une recherche différente.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const roleCat = getRoleCategory(user.role);
                  const isMasterOwner = user.username?.toLowerCase() === 'kibosh1234';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Full Name & Username */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {user.fullName}
                          {isMasterOwner && (
                            <span title="Propriétaire Maître SaaS">
                              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {user.email} • @{user.username}
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {user.companyName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {user.companyId}
                        </div>
                      </td>

                      {/* Role Category Badge */}
                      <td className="py-3.5 px-4">
                        {roleCat === 'SAAS_OWNER' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 w-fit">
                            <Crown className="w-3 h-3 text-purple-600" />
                            SaaS Owner (Platform)
                          </span>
                        ) : roleCat === 'COMPANY_ADMIN' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit">
                            <Shield className="w-3 h-3 text-blue-600" />
                            Company Admin
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-fit">
                            <Users className="w-3 h-3 text-slate-500" />
                            Simple User ({user.role})
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                            <Lock className="w-3 h-3 text-red-600" />
                            {user.status}
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-600 text-[11px]">
                          {user.registrationDate}
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-600 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{user.lastLogin || 'Jamais connecté'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Password Reset */}
                          <button
                            onClick={() => onTriggerPasswordReset(user)}
                            title="Déclencher la réinitialisation de mot de passe"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Status (disabled for master owner) */}
                          {!isMasterOwner ? (
                            <button
                              onClick={() => onToggleStatus(user.id)}
                              title={user.status === 'Active' ? 'Désactiver le compte' : 'Réactiver le compte'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                user.status === 'Active'
                                  ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              }`}
                            >
                              {user.status === 'Active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold px-2 py-1 bg-slate-100 rounded-md">
                              Protégé
                            </span>
                          )}
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

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-indigo-300" />
                <h3 className="text-sm font-black text-white">Créer un Nouvel Utilisateur</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom & Prénom *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="ex: Jean Dupont"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Identifiant (Username) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="ex: j.dupont"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail Professionnel *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nom@entreprise.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+33 6..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Organisation Rattachée *</label>
                  <select
                    value={companyId}
                    onChange={e => setCompanyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rôle RBAC *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Company Administrator">Company Administrator (Admin Tenant)</option>
                    <option value="Payroll Manager">Payroll Manager (Gestionnaire Paie)</option>
                    <option value="HR Administrator">HR Administrator (Admin RH)</option>
                    <option value="Auditor">Auditor (Auditeur en Lecture Seule)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mot de passe temporaire</label>
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forcePasswordChange}
                    onChange={e => setForcePasswordChange(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700">Forcer le changement de mot de passe à la première connexion</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mfaEnabled}
                    onChange={e => setMfaEnabled(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700">Activer l'authentification double facteur (MFA/TOTP)</span>
                </label>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Créer l'Utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
