import React from 'react';
import kiboshLogo from '../../../assets/images/kibosh_official_logo_1785747358174.jpg';

interface LoginHeaderProps {
  subtitle?: string;
  title?: string;
  description?: string;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({
  subtitle = 'Payroll Distribution Platform',
  title = 'Bienvenue sur KIBOSH',
  description = 'Connectez-vous pour gérer, traiter et distribuer les bulletins de paie de votre organisation.'
}) => {
  return (
    <div className="space-y-4">
      {/* Brand Lockup */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-950 shrink-0 flex items-center justify-center p-1 ring-2 ring-slate-100">
          <img
            src={kiboshLogo}
            alt="KIBOSH Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-xl tracking-wider text-slate-900">
              KIBOSH
            </span>
          </div>
          <p className="text-xs font-semibold text-blue-700 tracking-wide">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Primary Heading & Supporting Copy */}
      <div className="space-y-1.5 pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
};
