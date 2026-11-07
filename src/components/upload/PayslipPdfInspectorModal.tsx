import React, { useState } from 'react';
import { X, Scissors, CheckCircle2, AlertTriangle, Download, ExternalLink, ShieldCheck, User, Mail, Building, DollarSign, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { ExtractedPayslip } from '../../types';
import { PdfViewer } from '../common/PdfViewer';

interface PayslipPdfInspectorModalProps {
  payslip: ExtractedPayslip | null;
  onClose: () => void;
  onExcludeToggle?: (id: string) => void;
  onUpdateEmail?: (id: string, newEmail: string) => void;
  onUpdatePassword?: (id: string, newPassword: string) => void;
}

export const PayslipPdfInspectorModal: React.FC<PayslipPdfInspectorModalProps> = ({
  payslip,
  onClose,
  onExcludeToggle,
  onUpdateEmail,
  onUpdatePassword
}) => {
  if (!payslip) return null;

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailVal, setEmailVal] = useState(payslip.email);

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordVal, setPasswordVal] = useState(payslip.pdfPassword || payslip.matricule);
  const [showPasswordText, setShowPasswordText] = useState(false);

  const handleSaveEmail = () => {
    if (onUpdateEmail && emailVal) {
      onUpdateEmail(payslip.id, emailVal);
    }
    setIsEditingEmail(false);
  };

  const handleSavePassword = () => {
    if (onUpdatePassword && passwordVal) {
      onUpdatePassword(payslip.id, passwordVal);
    }
    setIsEditingPassword(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Inspecteur des Limites de Document</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  Matricule: {payslip.matricule}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Page {payslip.startPage} du PDF Master • Limite de Découpe Extraite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {payslip.pdfBlobUrl && (
              <a
                href={payslip.pdfBlobUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir le PDF Brut</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view (PDF Canvas/Iframe preview + Extracted Metadata inspection) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Side: Live Rendered PDF Document Preview */}
          <div className="lg:col-span-7 bg-slate-900 p-4 flex flex-col justify-between min-h-[460px] relative">
            <div className="mb-2 z-10 bg-slate-950/80 text-white px-2.5 py-1 rounded text-[11px] font-bold border border-slate-800 flex items-center justify-between backdrop-blur-xs">
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-blue-400" />
                <span>Plage de Découpe : Page {payslip.startPage} - {payslip.endPage}</span>
              </div>
              <span className="font-mono text-emerald-400 text-[10px]">98% Correspondance</span>
            </div>

            <PdfViewer
              pdfBlobUrl={payslip.pdfBlobUrl}
              pdfBytes={payslip.pdfBytes}
              matricule={payslip.matricule}
              employeeName={payslip.employeeName}
              className="flex-1 w-full"
              minHeight="440px"
            />
          </div>

          {/* Right Side: Extracted Field Metadata & Boundary Diagnostics */}
          <div className="lg:col-span-5 p-6 space-y-6 bg-white overflow-y-auto">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostic de Découpe du Document</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-base font-bold text-slate-900">{payslip.employeeName}</div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  payslip.isExcluded
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : payslip.status === 'Matched'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {payslip.isExcluded ? 'Exclus du Lot' : payslip.status === 'Matched' ? 'Correspondant' : payslip.status}
                </span>
              </div>
            </div>

            {/* Field Breakdown Grid */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Matricule Employé :
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {payslip.matricule}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Building className="w-3.5 h-3.5 text-blue-600" /> Département :
                  </span>
                  <span className="font-semibold text-slate-800">{payslip.department}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Montant Net à Payer :
                  </span>
                  <span className="font-bold text-emerald-700 text-sm font-mono">
                    €{payslip.netPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Recipient Email & Edit */}
              <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Adresse E-mail du Destinataire</span>
                  </span>
                  {!isEditingEmail && (
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Modifier l'E-mail
                    </button>
                  )}
                </div>

                {isEditingEmail ? (
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={emailVal}
                      onChange={(e) => setEmailVal(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-blue-300 bg-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingEmail(false)}
                        className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveEmail}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-xs font-bold text-slate-800 bg-white p-2 rounded border border-blue-100">
                    {payslip.email || <span className="text-rose-500 italic">Aucun e-mail assigné</span>}
                  </div>
                )}
              </div>

              {/* PDF Encryption & Security Password Control */}
              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>Mot de Passe PDF de Déchiffrement</span>
                  </span>
                  {!isEditingPassword && (
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Modifier le Mot de Passe
                    </button>
                  )}
                </div>

                {isEditingPassword ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showPasswordText ? "text" : "password"}
                        value={passwordVal}
                        onChange={(e) => setPasswordVal(e.target.value)}
                        placeholder="Ex: EMP000245 ou Secret2026"
                        className="w-full text-xs px-2.5 py-1.5 pr-8 rounded border border-emerald-300 bg-white font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingPassword(false)}
                        className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSavePassword}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-900 bg-white p-2 rounded border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{showPasswordText ? (payslip.pdfPassword || payslip.matricule) : '••••••••••••'}</span>
                    </div>
                    <button
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="text-slate-400 hover:text-slate-700 text-[11px] font-sans font-normal cursor-pointer flex items-center gap-1"
                    >
                      {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPasswordText ? 'Masquer' : 'Afficher'}</span>
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-emerald-800">
                  L'employé devra utiliser ce mot de passe (Chiffrement AES-256) pour déverrouiller son PDF.
                </p>
              </div>
            </div>

            {/* Boundary Details */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
              <div className="font-bold text-slate-800">Détails des Limites d'Extraction</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">Page de Début :</span>
                  <span className="font-bold text-slate-800 font-mono">Page {payslip.startPage}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">Page de Fin :</span>
                  <span className="font-bold text-slate-800 font-mono">Page {payslip.endPage}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">Score de Confiance :</span>
                  <span className="font-bold text-emerald-700 font-mono">{payslip.confidenceScore}% Correspondance</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">Protection par Chiffrement :</span>
                  <span className="font-bold text-blue-700">Mot de passe PDF AES-256</span>
                </div>
              </div>
            </div>

            {/* Exclude Toggle Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  if (onExcludeToggle) onExcludeToggle(payslip.id);
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                  payslip.isExcluded
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                }`}
              >
                {payslip.isExcluded ? 'Ré-inclure le Bulletin dans le Lot' : 'Exclure cette Découpe de la Distribution'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
