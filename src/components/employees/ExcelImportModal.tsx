import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { Employee } from '../../types';
import { ExcelService, ExcelImportResult } from '../../services/excelService';

interface ExcelImportModalProps {
  existingEmployees: Employee[];
  onImportConfirm: (newEmployees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  existingEmployees,
  onImportConfirm,
  onClose
}) => {
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (file: File) => {
    setFileName(file.name);
    setIsAnalyzing(true);
    try {
      const result = await ExcelService.parseEmployeeFile(file, existingEmployees);
      setImportResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Importer les Employés depuis Excel / CSV</h3>
              <p className="text-xs text-slate-300">Module 3 — Validation par lot & correspondance des matricules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {!importResult && !isAnalyzing && (
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-10 text-center space-y-3 cursor-pointer bg-slate-50/50">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="excel-file-input"
              />
              <label htmlFor="excel-file-input" className="cursor-pointer block space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Cliquez pour importer un tableau Excel (.xlsx, .xls, .csv)
                </div>
                <div className="text-xs text-slate-500">
                  Colonnes requises : <strong>Matricule</strong>, <strong>Prénom</strong>, <strong>Nom</strong>, <strong>Email</strong>, <strong>Département</strong>
                </div>
              </label>
            </div>
          )}

          {isAnalyzing && (
            <div className="p-10 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-800">Analyse des lignes Excel et validation de la structure des e-mails...</div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              {/* Summary Pills */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold">
                  <div>Enregistrements Valides</div>
                  <div className="text-lg font-black text-emerald-600 mt-0.5">{importResult.validEmployees.length}</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 font-bold">
                  <div>Lignes Invalides / Erreurs</div>
                  <div className="text-lg font-black text-red-600 mt-0.5">{importResult.invalidRows.length}</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-bold">
                  <div>Matricules Doublons</div>
                  <div className="text-lg font-black text-amber-600 mt-0.5">{importResult.duplicateMatricules.length}</div>
                </div>
              </div>

              {/* Invalid Rows Warning Box */}
              {importResult.invalidRows.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-xs text-red-800">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Erreurs Détectées dans le Fichier :</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
                    {importResult.invalidRows.map((err, idx) => (
                      <li key={idx}>Ligne {err.rowNumber}: {err.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table of Valid Imports */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">
                  Aperçu des Employés Valides ({importResult.validEmployees.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2 px-3">Matricule</th>
                        <th className="py-2 px-3">Nom</th>
                        <th className="py-2 px-3">Département</th>
                        <th className="py-2 px-3">Adresse E-mail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importResult.validEmployees.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{emp.matricule}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{emp.firstName} {emp.lastName}</td>
                          <td className="py-2 px-3 text-slate-600">{emp.department}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{emp.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Annuler
          </button>
          {importResult && importResult.validEmployees.length > 0 && (
            <button
              onClick={() => {
                onImportConfirm(importResult.validEmployees);
                onClose();
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmer l'Importation ({importResult.validEmployees.length} Enregistrements)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
