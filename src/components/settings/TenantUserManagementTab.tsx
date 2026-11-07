import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  KeyRound, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Mail, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { CompanyUser, UserRole, UserSession } from '../../types';
import { StorageService } from '../../services/storageService';
import { RoleManagementTab } from './RoleManagementTab';

interface TenantUserManagementTabProps {
  currentSession: UserSession;
  onLogAudit: (action: string, category: 'AUTHENTICATION' | 'SECURITY', details: string, result?: 'Success' | 'Failure') => void;
}

export const TenantUserManagementTab: React.FC<TenantUserManagementTabProps> = ({
  currentSession,
  onLogAudit
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users_list' | 'roles_matrix'>('users_list');
  const [users, setUsers] = useState<CompanyUser[]>(() => {
    const all = StorageService.getCompanyUsers();
    return all.filter(u => u.companyId === currentSession.companyId);
  });

  const [customRoles, setCustomRoles] = useState(() => 
    StorageService.getCustomRoles(currentSession.companyId)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);

  // New User Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [jobPosition, setJobPosition] = useState('Gestionnaire Paie');
  const [selectedRole, setSelectedRole] = useState<UserRole | string>('Payroll Manager');
  const [defaultPassword, setDefaultPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshCustomRoles = () => {
    setCustomRoles(StorageService.getCustomRoles(currentSession.companyId));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDefaultPassword(`${res}A1!`);
  };

  const predefinedRoles: UserRole[] = [
    'Company Administrator',
    'HR Administrator',
    'Payroll Manager',
    'IT Administrator',
    'Auditor'
  ];

  const allAvailableRoles = [
    ...predefinedRoles,
    ...customRoles.map(r => r.name as UserRole)
  ];

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const allUsers = StorageService.getCompanyUsers();

    if (editingUser) {
      // Edit User
      const updated = users.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            fullName,
            username,
            email,
            jobPosition,
            role: selectedRole
          };
        }
        return u;
      });
      setUsers(updated);

      const updatedAll = allUsers.map(u => u.id === editingUser.id ? { ...u, fullName, username, email, jobPosition, role: selectedRole } : u);
      StorageService.saveCompanyUsers(updatedAll);

      onLogAudit(
        'USER_UPDATED',
        'SECURITY',
        `Compte utilisateur mis à jour : ${fullName} (${selectedRole}).`
      );
    } else {
      // Create User with Default Password & Forced Rotation on First Login
      const pwd = defaultPassword.trim() || 'Password123!';
      const newUser: CompanyUser = {
        id: `usr-${Date.now()}`,
        companyId: currentSession.companyId,
        companyName: currentSession.company,
        fullName,
        username,
        email,
        jobPosition,
        role: selectedRole,
        status: 'Active',
        password: pwd,
        defaultPassword: pwd,
        mustChangePassword: mustChangePassword,
        registrationDate: new Date().toISOString().split('T')[0],
        lastLogin: 'Jamais connecté',
        mfaEnabled: false,
        failedLoginAttempts: 0
      };

      const updatedUsers = [newUser, ...users];
      setUsers(updatedUsers);

      allUsers.unshift(newUser);
      StorageService.saveCompanyUsers(allUsers);

      onLogAudit(
        'USER_CREATED',
        'SECURITY',
        `Nouveau compte créé : ${fullName} (${selectedRole}). Mot de passe par défaut défini. Renouvellement forcé à la première connexion : ${mustChangePassword ? 'Oui' : 'Non'}.`
      );
    }

    setShowAddUserModal(false);
    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setJobPosition('Gestionnaire Paie');
    setSelectedRole('Payroll Manager');
    setDefaultPassword('Password123!');
    setShowPassword(false);
    setMustChangePassword(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (u: CompanyUser) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setUsername(u.username);
    setEmail(u.email);
    setJobPosition(u.jobPosition);
    setSelectedRole(u.role);
    setShowAddUserModal(true);
  };

  const handleToggleStatus = (u: CompanyUser) => {
    const nextStatus: CompanyUser['status'] = u.status === 'Active' ? 'Disabled' : 'Active';
    const updated = users.map(item => item.id === u.id ? { ...item, status: nextStatus } : item);
    setUsers(updated);

    const all = StorageService.getCompanyUsers();
    const updatedAll = all.map(item => item.id === u.id ? { ...item, status: nextStatus } : item);
    StorageService.saveCompanyUsers(updatedAll);

    onLogAudit(
      'USER_STATUS_TOGGLED',
      'SECURITY',
      `Statut de ${u.fullName} modifié vers : ${nextStatus}`
    );
  };

  const handleDeleteUser = (u: CompanyUser) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${u.fullName} ?`)) return;

    const updated = users.filter(item => item.id !== u.id);
    setUsers(updated);

    const all = StorageService.getCompanyUsers().filter(item => item.id !== u.id);
    StorageService.saveCompanyUsers(all);

    onLogAudit(
      'USER_DELETED',
      'SECURITY',
      `Utilisateur supprimé : ${u.fullName} (${u.email})`
    );
  };

  const handleResetPassword = (u: CompanyUser) => {
    onLogAudit(
      'PASSWORD_RESET_TRIGGERED',
      'SECURITY',
      `Réinitialisation de mot de passe déclenchée pour ${u.fullName}`
    );
    alert(`Un lien sécurisé de réinitialisation de mot de passe a été transmis à ${u.email}.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Subtab Switcher Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('users_list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'users_list' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Membres & Comptes ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              refreshCustomRoles();
              setActiveSubTab('roles_matrix');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'roles_matrix' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Gestion des Rôles & Permissions (RBAC)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Tenant : <strong className="text-slate-900">{currentSession.company}</strong>
        </div>
      </div>

      {activeSubTab === 'roles_matrix' ? (
        <RoleManagementTab 
          currentSession={currentSession} 
          onLogAudit={onLogAudit} 
          onRolesUpdated={refreshCustomRoles} 
        />
      ) : (
        <>
          {/* Top Controls Header */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Gestion des Utilisateurs - {currentSession.company}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajoutez, modifiez les rôles ou désactivez les accès des membres de votre entreprise.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
                />
              </div>

              <button
                onClick={() => { resetForm(); setEditingUser(null); setShowAddUserModal(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Créer un Utilisateur</span>
              </button>
            </div>
          </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-4">Utilisateur & Identifiant</th>
              <th className="py-3.5 px-4">Poste & Fonction</th>
              <th className="py-3.5 px-4">Rôle Attribué (RBAC)</th>
              <th className="py-3.5 px-4">E-mail</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions Administrateur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  <div>{u.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-mono font-normal">@{u.username}</div>
                </td>

                <td className="py-3.5 px-4 text-slate-700 font-medium">
                  {u.jobPosition}
                </td>

                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    u.role === 'Company Administrator' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    u.role === 'HR Administrator' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    u.role === 'Payroll Manager' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {u.role}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                  {u.email}
                </td>

                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700'
                  }`}>
                    {u.status}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    
                    <button
                      onClick={() => handleOpenEdit(u)}
                      title="Modifier l'utilisateur"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleResetPassword(u)}
                      title="Réinitialiser le mot de passe"
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        u.status === 'Active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {u.status === 'Active' ? 'Désactiver' : 'Activer'}
                    </button>

                    {u.id !== currentSession.id && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="Supprimer l'utilisateur"
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit User */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{editingUser ? 'Modifier Utilisateur' : 'Créer un Nouvel Utilisateur'}</span>
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom & Prénom *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex. Marc Valois"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Identifiant / Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex. m.valois"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Professionnel *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m.valois@entreprise.com"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Poste / Fonction *</label>
                <input
                  type="text"
                  required
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="ex. Chargé de Paie Senior"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rôle d'Accès (RBAC) *</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <optgroup label="Rôles Système Prédéfinis">
                    {predefinedRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </optgroup>
                  {customRoles.length > 0 && (
                    <optgroup label="Rôles Personnalisés (Compte)">
                      {customRoles.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Default Password Configuration (Visible when creating a new user) */}
              {!editingUser && (
                <div className="pt-2 pb-1 border-t border-slate-100 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Mot de Passe par Défaut *</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Générer un mot de passe</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={defaultPassword}
                        onChange={(e) => setDefaultPassword(e.target.value)}
                        placeholder="ex. Password123!"
                        className="w-full text-xs px-3 py-2 pr-10 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ce mot de passe provisoire permettra à l'utilisateur de se connecter la toute première fois.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mustChangePassword}
                      onChange={(e) => setMustChangePassword(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-amber-950 block">
                        Exiger le changement de mot de passe à la première connexion
                      </span>
                      <span className="text-[10px] text-amber-800 leading-tight block mt-0.5">
                        Dès sa première authentification réussie, l'utilisateur sera immédiatement invité à définir son mot de passe personnel sécurisé avant d'accéder à l'application.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {editingUser ? 'Enregistrer les Modifications' : 'Créer l\'Utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
};
