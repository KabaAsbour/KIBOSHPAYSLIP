import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  onForgotPassword: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  isLoading,
  errorMessage,
  successMessage
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setValidationError('Veuillez renseigner votre identifiant, e-mail ou téléphone.');
      return;
    }

    if (!password) {
      setValidationError('Veuillez entrer votre mot de passe.');
      return;
    }

    await onSubmit(trimmedIdentifier, password, rememberMe);
  };

  const activeError = validationError || errorMessage;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Alert Error Message */}
      {activeError && (
        <div 
          role="alert"
          className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-semibold leading-relaxed">{activeError}</span>
        </div>
      )}

      {/* Alert Success Message */}
      {successMessage && (
        <div 
          role="status"
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-semibold leading-relaxed">{successMessage}</span>
        </div>
      )}

      {/* Field 1: Identifiant, e-mail ou téléphone */}
      <div>
        <label 
          htmlFor="kibosh-identifier" 
          className="block text-xs font-bold text-slate-700 mb-1.5"
        >
          Identifiant, e-mail ou téléphone
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="kibosh-identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="nom@entreprise.com"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (validationError) setValidationError(null);
            }}
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-3 focus:ring-blue-500/15 text-xs font-medium text-slate-900 outline-none transition-all placeholder-slate-400 bg-slate-50/60 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Field 2: Mot de passe */}
      <div>
        <label 
          htmlFor="kibosh-password" 
          className="block text-xs font-bold text-slate-700 mb-1.5"
        >
          Mot de passe
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="kibosh-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Entrez votre mot de passe"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationError) setValidationError(null);
            }}
            disabled={isLoading}
            className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-3 focus:ring-blue-500/15 text-xs font-medium text-slate-900 outline-none transition-all placeholder-slate-400 bg-slate-50/60 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Row: Remember Me + Forgot Password */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-slate-600 font-medium">Se souvenir de moi</span>
        </label>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
        >
          Mot de passe oublié ?
        </button>
      </div>

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Vérification en cours...</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </>
        )}
      </button>
    </form>
  );
};
