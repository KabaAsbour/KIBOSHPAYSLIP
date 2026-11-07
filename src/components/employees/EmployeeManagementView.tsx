import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Edit3, 
  CheckCircle2, 
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { Employee } from '../../types';
import { ExcelService } from '../../services/excelService';
import { ExcelImportModal } from './ExcelImportModal';

interface EmployeeManagementViewProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onBatchImport: (emps: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onDeleteEmployee: (id: string) => void;
  onBulkDeleteEmployees?: (ids: string[]) => void;
}

export const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onBatchImport,
  onDeleteEmployee,
  onBulkDeleteEmployees
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [singleDeleteEmp, setSingleDeleteEmp] = useState<Employee | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Add/Edit Form state
  const [formData, setFormData] = useState({
    matricule: '',
    firstName: '',
    lastName: '',
    company: 'Enterprise Global Inc.',
    department: 'Software Engineering',
    position: 'Staff Engineer',
    email: '',
    status: 'Active' as const
  });

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      matricule: emp.matricule,
      firstName: emp.firstName,
      lastName: emp.lastName,
      company: emp.company,
      department: emp.department,
      position: emp.position,
      email: emp.email,
      status: emp.status
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      onUpdateEmployee({
        ...editingEmp,
        ...formData,
        updatedAt: new Date().toISOString().substring(0, 10)
      });
    } else {
      onAddEmployee(formData);
    }
    setShowAddModal(false);
    setEditingEmp(null);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = Array.from(new Set(employees.map(e => e.department)));

  // Selection Logic
  const isAllFilteredSelected = filteredEmployees.length > 0 && filteredEmployees.every(e => selectedIds.includes(e.id));
  const selectedCount = selectedIds.length;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredEmployees.map(e => e.id));
      setSelectedIds(prev => prev.filter(id => !filteredSet.has(id)));
    } else {
      const filteredIds = filteredEmployees.map(e => e.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    if (onBulkDeleteEmployees) {
      onBulkDeleteEmployees(selectedIds);
    } else {
      selectedIds.forEach(id => onDeleteEmployee(id));
    }
    setSelectedIds([]);
    setShowBulkDeleteModal(false);
  };

  const handleConfirmSingleDelete = () => {
    if (singleDeleteEmp) {
      onDeleteEmployee(singleDeleteEmp.id);
      setSelectedIds(prev => prev.filter(id => id !== singleDeleteEmp.id));
      setSingleDeleteEmp(null);
    }
  };

  const selectedEmployeesList = employees.filter(e => selectedIds.includes(e.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Modules 2 & 3 — Annuaire Master des Employés
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Annuaire des Employés & Registre des E-mails
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Gérez les matricules uniques, les adresses e-mail, les départements et les statuts d'emploi. Téléversez des fichiers Excel pour importer la liste du personnel par lot ou effectuez des suppressions groupées.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => ExcelService.exportEmployeesToExcel(employees)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-slate-300 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exporter l'Effectif</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importer Fichier Excel</span>
          </button>

          <button
            onClick={() => {
              setEditingEmp(null);
              setFormData({
                matricule: `EMP000${245 + employees.length}`,
                firstName: '',
                lastName: '',
                company: 'Enterprise Global Inc.',
                department: 'Génie Logiciel',
                position: 'Ingénieur',
                email: '',
                status: 'Active'
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Employé</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher matricule, nom, e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 font-medium bg-slate-50 outline-none"
          >
            <option value="all">Tous les Départements ({departments.length})</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 font-medium bg-slate-50 outline-none"
          >
            <option value="all">Tous les Statuts</option>
            <option value="Active">Actif</option>
            <option value="On Leave">En Congé</option>
            <option value="Terminated">Inactif / Parti</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when 1 or more employees are selected) */}
      {selectedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
              {selectedCount}
            </span>
            <span className="text-xs font-bold text-red-900">
              {selectedCount === 1 ? '1 employé sélectionné' : `${selectedCount} employés sélectionnés`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
            >
              Décocher Tout
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer la sélection ({selectedCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden employee-management-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 employee-management-table">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    title={isAllFilteredSelected ? "Tout décocher" : "Tout sélectionner les employés filtrés"}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Nom de l'Employé</th>
                <th className="py-3 px-4">Département & Poste</th>
                <th className="py-3 px-4">Adresse E-mail</th>
                <th className="py-3 px-4">Société</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Aucun employé trouvé.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedIds.includes(emp.id);
                  return (
                    <tr 
                      key={emp.id} 
                      onClick={() => handleToggleSelectOne(emp.id)}
                      className={`transition-all duration-200 ease-in-out cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50/90 hover:bg-blue-100/80 shadow-xs border-l-4 border-l-blue-600' 
                          : 'bg-white hover:bg-slate-50/90 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(emp.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 transition-transform active:scale-90"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <span className={`px-2 py-0.5 rounded border transition-colors duration-200 ${
                          isSelected ? 'bg-blue-100 text-blue-900 border-blue-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {emp.matricule}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{emp.department}</div>
                        <div className="text-[11px] text-slate-400">{emp.position}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={emp.email.includes('invalid') ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                          {emp.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.company}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.status === 'On Leave'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {emp.status === 'Active' ? 'Actif' : emp.status === 'On Leave' ? 'En Congé' : 'Parti'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(emp);
                            }}
                            className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Modifier l'employé"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSingleDeleteEmp(emp);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Supprimer l'employé"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Suppression groupée de {selectedCount} employé(s)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Êtes-vous sûr de vouloir supprimer définitivement ces {selectedCount} enregistrement(s) de l'annuaire master ? Cette action ne peut pas être annulée.
                </p>
              </div>
            </div>

            {/* List preview */}
            <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
              {selectedEmployeesList.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between py-1 px-2 bg-white rounded border border-slate-200">
                  <span className="font-mono font-bold text-slate-800">{emp.matricule}</span>
                  <span className="font-medium text-slate-900">{emp.firstName} {emp.lastName}</span>
                  <span className="text-slate-500 text-[11px]">{emp.department}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {singleDeleteEmp && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Supprimer l'employé
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Confirmez-vous la suppression de <span className="font-bold text-slate-900">{singleDeleteEmp.firstName} {singleDeleteEmp.lastName}</span> (<span className="font-mono font-bold">{singleDeleteEmp.matricule}</span>) de l'annuaire ?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSingleDeleteEmp(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ExcelImportModal
          existingEmployees={employees}
          onImportConfirm={onBatchImport}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Add / Edit Single Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingEmp ? 'Modifier la Fiche Employé' : 'Enregistrer un Nouvel Employé'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Code Matricule Employé</label>
                <input
                  type="text"
                  required
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse E-mail Enregistrée</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Département</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Titre du Poste</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
