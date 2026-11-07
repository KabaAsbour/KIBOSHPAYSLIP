import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  Check, 
  Lock, 
  Info, 
  Users,
  Copy,
  Sparkles
} from 'lucide-react';
import { UserSession } from '../../types';
import { CustomRole, ALL_PERMISSIONS, PERMISSION_CATEGORY_LABELS, PermissionCategory, PermissionKey } from '../../types/rbac';
import { DEFAULT_ROLE_PERMISSIONS } from '../../utils/rbac';
import { StorageService } from '../../services/storageService';

interface RoleManagementTabProps {
  currentSession: UserSession;
  onLogAudit: (action: string, category: 'SECURITY', details: string, result?: 'Success' | 'Failure') => void;
  onRolesUpdated?: () => void;
}

export const RoleManagementTab: React.FC<RoleManagementTabProps> = ({
  currentSession,
  onLogAudit,
  onRolesUpdated
}) => {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => 
    StorageService.getCustomRoles(currentSession.companyId)
  );

  const [activeTab, setActiveTab] = useState<'system_roles' | 'custom_roles'>('custom_roles');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const predefinedRolesList = [
    { name: 'Company Administrator', description: 'Administrateur principal du compte entreprise. Accès complet à la gestion d\'entreprise.' },
    { name: 'HR Administrator', description: 'Gestion de l\'annuaire, téléversement des paies, validation et distribution.' },
    { name: 'Payroll Manager', description: 'Traitement des bulletins, validation du découpage et relance des échecs.' },
    { name: 'Manager', description: 'Consultation des rapports de paie et synthèses des employés (lecture seule).' },
    { name: 'IT Administrator', description: 'Paramètres SMTP, clés API, réinitialisation des accès et sécurité.' },
    { name: 'Auditor', description: 'Consultation du registre d\'audit, preuves de traçabilité et rapports.' },
    { name: 'Standard User', description: 'Accès restreint aux tableaux de bord et soumission de retours.' }
  ];

  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (role: CustomRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions([...role.permissions]);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleTogglePermission = (key: PermissionKey) => {
    setSelectedPermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleToggleCategory = (category: PermissionCategory) => {
    const categoryPerms = ALL_PERMISSIONS.filter(p => p.category === category).map(p => p.key);
    const allSelected = categoryPerms.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...categoryPerms])));
    }
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!roleName.trim()) {
      setErrorMsg('Veuillez renseigner un nom pour le rôle.');
      return;
    }

    if (selectedPermissions.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins une permission.');
      return;
    }

    const allRoles = StorageService.getCustomRoles();

    if (editingRole) {
      // Update custom role
      const updatedList = customRoles.map(r => {
        if (r.id === editingRole.id) {
          return {
            ...r,
            name: roleName.trim(),
            description: roleDescription.trim(),
            permissions: selectedPermissions,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });
      setCustomRoles(updatedList);

      const allUpdated = allRoles.map(r => r.id === editingRole.id ? {
        ...r,
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions: selectedPermissions,
        updatedAt: new Date().toISOString()
      } : r);
      StorageService.saveCustomRoles(allUpdated);

      onLogAudit(
        'ROLE_UPDATED',
        'SECURITY',
        `Rôle personnalisé mis à jour : "${roleName}" avec ${selectedPermissions.length} permissions.`
      );
    } else {
      // Create new custom role
      const newRole: CustomRole = {
        id: `role-${Date.now()}`,
        companyId: currentSession.companyId,
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions: selectedPermissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedList = [newRole, ...customRoles];
      setCustomRoles(updatedList);

      allRoles.unshift(newRole);
      StorageService.saveCustomRoles(allRoles);

      onLogAudit(
        'ROLE_CREATED',
        'SECURITY',
        `Nouveau rôle personnalisé créé : "${roleName}" (${selectedPermissions.length} autorisations).`
      );
    }

    setShowModal(false);
    if (onRolesUpdated) onRolesUpdated();
  };

  const handleDeleteRole = (role: CustomRole) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le rôle "${role.name}" ?`)) return;

    const updatedList = customRoles.filter(r => r.id !== role.id);
    setCustomRoles(updatedList);

    const all = StorageService.getCustomRoles().filter(r => r.id !== role.id);
    StorageService.saveCustomRoles(all);

    onLogAudit(
      'ROLE_DELETED',
      'SECURITY',
      `Rôle personnalisé supprimé : "${role.name}"`
    );

    if (onRolesUpdated) onRolesUpdated();
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-Header */}
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Gestion des Rôles & Accès sur Mesure (RBAC)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Définissez les autorisations granulaires pour chaque fonction au sein de {currentSession.company}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('custom_roles')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'custom_roles' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rôles Personnalisés ({customRoles.length})
            </button>
            <button
              onClick={() => setActiveTab('system_roles')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'system_roles' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rôles Système Définis
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Rôle</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Custom Roles List */}
      {activeTab === 'custom_roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customRoles.map(role => (
            <div key={role.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-purple-200 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-100">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{role.name}</h4>
                      <div className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-purple-200">
                        {role.permissions.length} autorisations actives
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(role)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                      title="Modifier les autorisations"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer le rôle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {role.description || 'Aucune description fournie pour ce rôle sur mesure.'}
                </p>

                {/* Permission badges preview */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {role.permissions.slice(0, 5).map(perm => {
                    const def = ALL_PERMISSIONS.find(p => p.key === perm);
                    return (
                      <span key={perm} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200">
                        {def?.label || perm}
                      </span>
                    );
                  })}
                  {role.permissions.length > 5 && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold">
                      +{role.permissions.length - 5} autres
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Tenant : {currentSession.company}</span>
                <span>Créé le {new Date(role.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {customRoles.length === 0 && (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-800">Aucun rôle personnalisé configuré</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Créez des rôles sur mesure (ex: Assistants RH, Responsables Validation, Contrôleurs) pour accorder des privilèges spécifiques.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Créer le Premier Rôle Custom</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Default System Roles */}
      {activeTab === 'system_roles' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Les rôles système par défaut sont prédéfinis pour garantir la sécurité et la conformité multi-entreprises (RB-07).</span>
          </div>

          <div className="divide-y divide-slate-100">
            {predefinedRolesList.map(item => {
              const perms = DEFAULT_ROLE_PERMISSIONS[item.name] || [];
              return (
                <div key={item.name} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                        {perms.length} permissions
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-w-xl">
                    {perms.map(p => {
                      const def = ALL_PERMISSIONS.find(ap => ap.key === p);
                      return (
                        <span key={p} className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] rounded-md font-medium border border-slate-200/80">
                          {def?.label || p}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Custom Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRole ? `Modifier le Rôle : ${editingRole.name}` : 'Nouveau Rôle Personnalisé'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Attribuez des permissions granulaires à ce rôle pour l'entreprise {currentSession.company}.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveRole} className="p-6 space-y-6 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom du Rôle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Payroll Supervisor, Assistant RH..."
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description Fonctionnelle
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Responsable du contrôle qualité des bulletins découpés."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>

              {/* Permissions Grid Grouped by Category */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Matrice des Permissions Granulaires ({selectedPermissions.length} sélectionnées)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPermissions.length === ALL_PERMISSIONS.filter(p => p.category !== 'platform_administration').length) {
                        setSelectedPermissions([]);
                      } else {
                        setSelectedPermissions(ALL_PERMISSIONS.filter(p => p.category !== 'platform_administration').map(p => p.key));
                      }
                    }}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                  >
                    {selectedPermissions.length > 0 ? 'Tout Décocher' : 'Tout Sélectionner'}
                  </button>
                </div>

                <div className="space-y-4">
                  {(Object.keys(PERMISSION_CATEGORY_LABELS) as PermissionCategory[])
                    .filter(cat => cat !== 'platform_administration')
                    .map(category => {
                      const categoryInfo = PERMISSION_CATEGORY_LABELS[category];
                      const categoryPerms = ALL_PERMISSIONS.filter(p => p.category === category);
                      const allCatSelected = categoryPerms.every(p => selectedPermissions.includes(p.key));

                      return (
                        <div key={category} className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <div>
                              <span className="text-xs font-bold text-slate-900">{categoryInfo.label}</span>
                              <p className="text-[10px] text-slate-500">{categoryInfo.description}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleCategory(category)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                allCatSelected ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              {allCatSelected ? 'Catégorie Sélectionnée' : 'Sélectionner Tout'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {categoryPerms.map(perm => {
                              const isChecked = selectedPermissions.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  onClick={() => handleTogglePermission(perm.key)}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                    isChecked 
                                      ? 'bg-purple-50/80 border-purple-300 text-purple-900 font-medium' 
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // Handled by label click
                                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs">{perm.label}</div>
                                    <div className="text-[10px] text-slate-500 leading-tight">{perm.description}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRole ? 'Mettre à jour' : 'Enregistrer le Rôle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
