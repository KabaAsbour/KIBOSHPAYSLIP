import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Building2, 
  ShieldAlert, 
  UserCheck, 
  Mail, 
  Phone, 
  Briefcase,
  Lock,
  EyeOff
} from 'lucide-react';
import { Employee, CompanyTenant } from '../../types';

interface CrossCompanyEmployeesTabProps {
  employees: Employee[];
  companies: CompanyTenant[];
}

export const CrossCompanyEmployeesTab: React.FC<CrossCompanyEmployeesTabProps> = ({
  employees,
  companies
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = !q || (
      emp.matricule.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      emp.company.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q))
    );

    const matchesCompany = companyFilter === 'all' || emp.companyId === companyFilter || emp.company === companyFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Registre Consolidé des Employés (Multi-Entreprises)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vue d'ensemble des collaborateurs enregistrés à travers les organisations clientes pour le suivi des quotas et l'attribution des matricules.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700">
          {filteredEmployees.length} collaborateur(s) référencé(s)
        </div>
      </div>

      {/* Critical GDPR & Privacy Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-center gap-3">
        <EyeOff className="w-5 h-5 text-emerald-700 shrink-0" />
        <div className="leading-relaxed">
          <strong>Garantie de Confidentialité & RGPD Paie :</strong> Ce registre centralisé n'affiche que les métadonnées de liaison administrative (Matricule, Identité, Organisation, Département). Conformément au protocole de cloisonnement strict, <em>aucun montant de salaire, rémunération ou document de bulletin individuel</em> n'est accessible au niveau SaaS Owner.
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
            placeholder="Rechercher par matricule, nom de collaborateur, email ou département..."
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
          <option value="On Leave">En Congé</option>
          <option value="Terminated">Sorti / Terminé</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-4">Organisation Employeur</th>
                <th className="py-3 px-4">Département & Poste</th>
                <th className="py-3 px-4">E-mail Professionnel</th>
                <th className="py-3 px-4">Statut RH</th>
                <th className="py-3 px-4 text-right">Protection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">Aucun collaborateur trouvé</p>
                    <p className="text-xs text-slate-400 mt-1">Ajustez vos critères de filtrage ou réinitialisez la recherche.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Matricule */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {emp.matricule}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Réf interne : {emp.id}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.company}</span>
                      </div>
                    </td>

                    {/* Department & Position */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {emp.department || 'Non spécifié'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {emp.position || 'Salarié'}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-mono text-[11px]">
                        {emp.email}
                      </div>
                      {emp.phone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp.phone}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        emp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                        emp.status === 'On Leave' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {emp.status}
                      </span>
                    </td>

                    {/* Privacy Lock Badge */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-semibold" title="Rémunération masquée par sécurité">
                        <Lock className="w-3 h-3 text-slate-400" />
                        Salaire Masqué
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
