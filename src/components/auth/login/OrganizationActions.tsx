import React from 'react';
import { Building2, UserPlus } from 'lucide-react';

interface OrganizationActionsProps {
  onSwitchOrganization: () => void;
  onRegisterCompany: () => void;
}

export const OrganizationActions: React.FC<OrganizationActionsProps> = ({
  onSwitchOrganization,
  onRegisterCompany
}) => {
  return (
    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
      <button
        type="button"
        onClick={onSwitchOrganization}
        className="text-slate-600 hover:text-blue-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer py-1 group"
      >
        <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span>Changer d'organisation</span>
      </button>

      <button
        type="button"
        onClick={onRegisterCompany}
        className="text-slate-600 hover:text-blue-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer py-1 group"
      >
        <UserPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span>Inscrire une entreprise</span>
      </button>
    </div>
  );
};
