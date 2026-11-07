import React, { useState } from 'react';
import { X, Code, Check, Eye } from 'lucide-react';
import { EmailSettings } from '../../types';

interface EmailTemplateModalProps {
  settings: EmailSettings;
  onSave: (newSubject: string, newTemplate: string) => void;
  onClose: () => void;
}

export const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
  settings,
  onSave,
  onClose
}) => {
  const [subject, setSubject] = useState(settings.defaultSubject);
  const [template, setTemplate] = useState(settings.defaultTemplate);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const handleInsertVar = (varName: string) => {
    setTemplate(prev => prev + ` {${varName}} `);
  };

  const samplePreview = template
    .replace(/\{name\}/gi, 'Alexandre Dubois')
    .replace(/\{FirstName\}/g, 'Alexandre')
    .replace(/\{LastName\}/g, 'Dubois')
    .replace(/\{Matricule\}/g, 'EMP000245')
    .replace(/\{Department\}/g, 'Software Engineering')
    .replace(/\{NetPay\}/g, '4,850.00')
    .replace(/\{Month\}/g, 'July')
    .replace(/\{Year\}/g, '2026')
    .replace(/\{PdfLink\}/gi, typeof window !== 'undefined' ? `${window.location.origin}/api/download-payslip/EMP000245` : 'http://localhost:3000/api/download-payslip/EMP000245');

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Email Template Customizer</h3>
              <p className="text-xs text-slate-300">Module 8 — Dynamic variable interpolation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Edit Template Code
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Inbox Preview</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {activeTab === 'edit' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Body Content
                  </label>
                  <span className="text-[11px] text-slate-400">Insert Placeholders:</span>
                </div>

                {/* Insertable variables pills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['FirstName', 'LastName', 'Matricule', 'Department', 'NetPay', 'Month', 'Year', 'PdfLink'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVar(v)}
                      className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded text-[11px] font-mono border border-slate-200 transition-colors"
                    >
                      +{v}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={10}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="text-[11px] text-slate-500 font-semibold">From: {settings.senderName} &lt;{settings.senderEmail}&gt;</div>
                <div className="text-[11px] text-slate-500 font-semibold mt-0.5">To: Alexandre Dubois &lt;alexandre.dubois@enterprise-corp.com&gt;</div>
                <div className="text-sm font-bold text-slate-900 mt-2">{subject.replace(/\{Month\}/g, 'July').replace(/\{Year\}/g, '2026')}</div>
              </div>

              <div className="whitespace-pre-wrap text-xs font-sans text-slate-800 leading-relaxed bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                {samplePreview}
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <span>Attachment: <strong>Payslip_2026_07_EMP000245.pdf</strong> (Encrypted Attachment)</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(subject, template);
              onClose();
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Apply Template Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
