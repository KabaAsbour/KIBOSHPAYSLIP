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
    <div className="space-y-4 text-center flex flex-col items-center">
      {/* Brand Lockup */}
      <div className="flex flex-col items-center justify-center gap-2.5 text-center">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-950 shrink-0 flex items-center justify-center p-1 ring-2 ring-slate-100">
          <img
            src={kiboshLogo}
            alt="KIBOSH Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono font-black text-xl tracking-wider text-slate-900">
              KIBOSH
            </span>
          </div>
          <p className="text-xs font-bold text-blue-700 tracking-wide">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Primary Heading & Supporting Copy */}
      <div className="space-y-2 pt-1 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-center">
          {title}
        </h1>
        <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-md mx-auto text-center">
          {description}
        </p>
      </div>
    </div>
  );
};
