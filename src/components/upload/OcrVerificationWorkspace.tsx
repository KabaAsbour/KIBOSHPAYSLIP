import React, { useState } from 'react';
import { 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Check, 
  Search, 
  Layers, 
  Sparkles, 
  UserCheck, 
  UserX, 
  Eye, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Info, 
  FileText,
  Building,
  Mail,
  UserPlus
} from 'lucide-react';
import { ExtractedPayslip, Employee } from '../../types';
import { PdfViewer } from '../common/PdfViewer';

interface OcrVerificationWorkspaceProps {
  extractedItems: ExtractedPayslip[];
  registeredEmployees: Employee[];
  rawPdfBlobUrl?: string;
  onUpdateItem: (updated: ExtractedPayslip) => void;
  onBatchVerifyAll: () => void;
  onProceedToConflicts?: () => void;
  onProceedToCampaign: () => void;
  onRegisterNewEmployee?: (newEmp: Employee) => void;
}

export const OcrVerificationWorkspace: React.FC<OcrVerificationWorkspaceProps> = ({
  extractedItems,
  registeredEmployees,
  rawPdfBlobUrl,
  onUpdateItem,
  onBatchVerifyAll,
  onProceedToConflicts,
  onProceedToCampaign,
  onRegisterNewEmployee
}) => {
  const [selectedPayslipId, setSelectedPayslipId] = useState<string>(
    extractedItems[0]?.id || ''
  );
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNMATCHED' | 'VERIFIED' | 'CORRECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item
  const activeItem = extractedItems.find(p => p.id === selectedPayslipId) || extractedItems[0];

  // Form state for current correction
  const [editedMatricule, setEditedMatricule] = useState(activeItem?.matricule || '');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [showOcrOverlay, setShowOcrOverlay] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync state when active item changes
  React.useEffect(() => {
    if (activeItem) {
      setEditedMatricule(activeItem.matricule);
      setSelectedEmpId(activeItem.employeeId || '');
    }
  }, [activeItem?.id]);

  // Derived stats
  const totalCount = extractedItems.length;
  const verifiedCount = extractedItems.filter(p => p.ocrVerified).length;
  const correctedCount = extractedItems.filter(p => p.ocrCorrected).length;
  const unmatchedCount = extractedItems.filter(
    p => !p.isExcluded && (p.status === 'Unmatched Matricule' || !p.employeeId)
  ).length;

  // Filtered list
  const filteredItems = extractedItems.filter(item => {
    if (item.isExcluded) return false;
    const matchesSearch = 
      item.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.rawTextSnippet && item.rawTextSnippet.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMode === 'UNMATCHED') return item.status === 'Unmatched Matricule' || !item.employeeId;
    if (filterMode === 'VERIFIED') return !!item.ocrVerified;
    if (filterMode === 'CORRECTED') return !!item.ocrCorrected;
    return true;
  });

  // Handle manual matricule correction
  const handleApplyMatriculeCorrection = () => {
    if (!activeItem) return;

    const trimmed = editedMatricule.trim().toUpperCase();
    if (!trimmed) return;

    // Look up in directory
    const matchedEmp = registeredEmployees.find(e => e.id === selectedEmpId) ||
      registeredEmployees.find(e => e.matricule.toUpperCase() === trimmed);

    const updated: ExtractedPayslip = {
      ...activeItem,
      matricule: trimmed,
      originalExtractedMatricule: activeItem.originalExtractedMatricule || activeItem.matricule,
      ocrCorrected: true,
      ocrVerified: true,
      confidenceScore: 100,
    };

    if (matchedEmp) {
      const isEmailValid = matchedEmp.email && matchedEmp.email.includes('@') && !matchedEmp.email.includes('invalid');
      updated.employeeId = matchedEmp.id;
      updated.employeeName = `${matchedEmp.firstName} ${matchedEmp.lastName}`;
      updated.email = matchedEmp.email;
      updated.department = matchedEmp.department;
      updated.position = matchedEmp.position;
      updated.status = isEmailValid ? 'Matched' : 'Missing Email';
    } else {
      updated.status = 'Unmatched Matricule';
    }

    onUpdateItem(updated);
    setFeedbackMsg(`Matricule corrigé en "${trimmed}" et validé pour la Page ${activeItem.startPage}.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Mark single item as verified
  const handleMarkAsVerified = (item: ExtractedPayslip) => {
    const updated: ExtractedPayslip = {
      ...item,
      ocrVerified: true,
      confidenceScore: Math.max(item.confidenceScore, 95)
    };
    onUpdateItem(updated);
    setFeedbackMsg(`Page ${item.startPage} certifiée conforme et validée.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <Scan className="w-3.5 h-3.5 text-blue-400" />
              Étape de Vérification OCR Interactive
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {verifiedCount} / {totalCount} Pages Vérifiées
            </span>
            {correctedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {correctedCount} Correction{correctedCount > 1 ? 's' : ''} Appliquée{correctedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white mt-2 tracking-tight flex items-center gap-2">
            <span>Contrôle & Validation Visuelle des Matricules OCR</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Vérifiez le surlignage dynamique du matricule sur la page PDF rendue. Corrigez les éventuelles erreurs d'alignement ou coquilles OCR avant d'envoyer la campagne.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBatchVerifyAll}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Marquer tous les matricules extraits comme certifiés conformes"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tout Certifier (OCR 100%)</span>
          </button>

          {unmatchedCount > 0 && onProceedToConflicts && (
            <button
              onClick={onProceedToConflicts}
              className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Conflits à Résoudre ({unmatchedCount})</span>
            </button>
          )}

          <button
            onClick={onProceedToCampaign}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
          >
            <span>Lancer la Distribution</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main 3-Column Layout Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLUMN 1: Extracted Pages Selector & Status Filter (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Bulletins du Lot ({filteredItems.length})
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Page {activeItem?.startPage || 1} sur {totalCount}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher matricule, nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['ALL', 'UNMATCHED', 'VERIFIED', 'CORRECTED'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterMode === mode
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode === 'ALL' && `Tous (${totalCount})`}
                {mode === 'UNMATCHED' && `Anomalies (${unmatchedCount})`}
                {mode === 'VERIFIED' && `Vérifiés (${verifiedCount})`}
                {mode === 'CORRECTED' && `Corrigés (${correctedCount})`}
              </button>
            ))}
          </div>

          {/* Page Cards List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredItems.map(item => {
              const isSelected = item.id === selectedPayslipId;
              const isUnmatched = item.status === 'Unmatched Matricule' || !item.employeeId;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedPayslipId(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20'
                      : isUnmatched
                      ? 'border-amber-200 bg-amber-50/20 hover:bg-amber-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      P{item.startPage}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-xs text-slate-900 truncate">
                          {item.matricule}
                        </span>
                        {item.ocrCorrected && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Corrigé
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate font-medium">
                        {item.employeeName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.ocrVerified ? (
                      <span className="p-1 bg-emerald-100 text-emerald-700 rounded-full" title="Validation OCR Certifiée">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </span>
                    ) : isUnmatched ? (
                      <span className="p-1 bg-amber-100 text-amber-800 rounded-full" title="Matricule non répertorié">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        {item.confidenceScore}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Live PDF Viewer with OCR Matricule Highlight (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3 flex flex-col">
          <div className="flex items-center justify-between text-white text-xs px-2">
            <div className="flex items-center gap-2">
              <span className="font-bold flex items-center gap-1 text-blue-300">
                <Eye className="w-4 h-4" />
                Page {activeItem?.startPage || 1} — Rendu Visuel PDF
              </span>
              <span className="font-mono text-emerald-400 text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Matricule : {activeItem?.matricule}
              </span>
            </div>

            <button
              onClick={() => setShowOcrOverlay(!showOcrOverlay)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                showOcrOverlay
                  ? 'bg-amber-500 text-slate-950 border border-amber-400'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {showOcrOverlay ? 'Surlignage OCR Actif' : 'Masquer Surlignage'}
            </button>
          </div>

          {/* Interactive PDF Canvas Viewer */}
          <div className="flex-1 min-h-[500px]">
            <PdfViewer
              pdfBlobUrl={activeItem?.pdfBlobUrl || rawPdfBlobUrl}
              pdfBytes={activeItem?.pdfBytes}
              matricule={activeItem?.matricule}
              highlightMatricule={activeItem?.matricule}
              showOcrOverlay={showOcrOverlay}
              employeeName={activeItem?.employeeName}
              minHeight="480px"
            />
          </div>
        </div>

        {/* COLUMN 3: Correction & Alignment Controls (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              Panneau de Correction OCR
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-1">
              Validation pour la Page {activeItem?.startPage}
            </h3>
          </div>

          {/* OCR Confidence Gauge Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Confiance OCR Extraction :</span>
              <span className={`font-mono font-extrabold px-2 py-0.5 rounded text-[11px] ${
                activeItem?.confidenceScore >= 90
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {activeItem?.confidenceScore}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Statut de Match :</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeItem?.status === 'Matched'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {activeItem?.status === 'Matched' ? 'Employé Identifié' : 'Non Correspondant'}
              </span>
            </div>
          </div>

          {/* Extracted Raw Snippet */}
          {activeItem?.rawTextSnippet && (
            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1">
              <span className="text-amber-400 font-bold uppercase block text-[9px]">
                Texte Brut Extrait du PDF :
              </span>
              <p className="opacity-90 leading-relaxed break-words whitespace-pre-wrap">
                "{activeItem.rawTextSnippet}"
              </p>
            </div>
          )}

          {/* Correction Form */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>1. Corriger le Matricule Extrait :</span>
                {activeItem?.originalExtractedMatricule && (
                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                    Initial: {activeItem.originalExtractedMatricule}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedMatricule}
                onChange={(e) => setEditedMatricule(e.target.value.toUpperCase())}
                placeholder="Ex: EMP000245"
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. Associer à un Employé Enregistré :
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  const emp = registeredEmployees.find(x => x.id === e.target.value);
                  if (emp) {
                    setEditedMatricule(emp.matricule);
                  }
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
              >
                <option value="">-- Sélection Automatique selon Matricule --</option>
                {registeredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.matricule}) - {emp.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleApplyMatriculeCorrection}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Appliquer la Correction</span>
              </button>

              {!activeItem?.ocrVerified && (
                <button
                  onClick={() => handleMarkAsVerified(activeItem)}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Valider & Certifier la Page</span>
                </button>
              )}
            </div>
          </div>

          {/* Current Matched Employee Summary Card */}
          <div className="bg-blue-50/60 border border-blue-200 p-3.5 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
              Fiche Salarié Associée Actuelle
            </span>
            <div className="font-bold text-slate-900 text-xs">
              {activeItem?.employeeName}
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{activeItem?.email || 'Aucun e-mail'}</span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{activeItem?.department}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
