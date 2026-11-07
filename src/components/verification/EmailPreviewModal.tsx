import React, { useState } from 'react';
import { X, Mail, Paperclip, User, Sparkles, CheckCircle2, Send, RefreshCw, AlertCircle, MessageSquare, Phone, ExternalLink, CheckCheck } from 'lucide-react';
import { ExtractedPayslip, EmailSettings } from '../../types';
import { EmailEngine } from '../../services/emailEngine';

interface EmailPreviewModalProps {
  payslips: ExtractedPayslip[];
  initialPayslipId?: string;
  emailSubject: string;
  emailTemplate: string;
  emailSettings: EmailSettings;
  payrollMonth?: string;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  payslips,
  initialPayslipId,
  emailSubject,
  emailTemplate,
  emailSettings,
  payrollMonth = 'Juillet 2026',
  onClose
}) => {
  const activePayslips = payslips.filter(p => !p.isExcluded);
  const displayList = activePayslips.length > 0 ? activePayslips : payslips;

  const [selectedId, setSelectedId] = useState<string>(
    initialPayslipId || displayList[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email');

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; waMeLink?: string } | null>(null);

  const selectedPayslip = displayList.find(p => p.id === selectedId) || displayList[0];

  if (!selectedPayslip) {
    return null;
  }

  // Render subject and template with variable substitution
  const renderedSubject = EmailEngine.renderTemplate(emailSubject, selectedPayslip, payrollMonth);
  const renderedEmailBody = EmailEngine.renderTemplate(emailTemplate, selectedPayslip, payrollMonth);
  
  const defaultWaTemplate = emailSettings.whatsappSettings?.defaultTemplate || `🟢 *BULLETIN DE PAIE CONFIDENTIEL — {Month} {Year}*

Bonjour *{FirstName} {LastName}*,

Votre bulletin de paie électronique est disponible.

📌 *Détails de la Paie :*
• Matricule : {Matricule}
• Département : {Department}
• Net à Payer : *{NetPay} €*

📄 *Télécharger votre Bulletin PDF sécurisé :*
{PdfLink}

_Ce message est strictement confidentiel. KIBOSH Service Paie System._`;

  const renderedWaBody = EmailEngine.renderTemplate(defaultWaTemplate, selectedPayslip, payrollMonth);

  const senderEmail = emailSettings.senderEmail || 'paie@enterprise-corp.com';
  const senderName = emailSettings.senderName || 'KIBOSH Service Paie System';

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      if (activeTab === 'email') {
        const pdfBase64 = await EmailEngine.bytesToBase64(selectedPayslip.pdfBytes);
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedPayslip.email && selectedPayslip.email.includes('@') && !selectedPayslip.email.includes('invalid') 
              ? selectedPayslip.email 
              : (emailSettings.senderEmail || 'contact@enterprise-corp.com'),
            subject: `[Aperçu Test] ${renderedSubject}`,
            text: renderedEmailBody,
            fromEmail: senderEmail,
            fromName: senderName,
            pdfBase64,
            filename: `Fiche_de_paie_${selectedPayslip.matricule}.pdf`,
            smtpSettings: emailSettings
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const recipient = selectedPayslip.email && selectedPayslip.email.includes('@') && !selectedPayslip.email.includes('invalid')
            ? selectedPayslip.email
            : (emailSettings.senderEmail || 'contact@enterprise-corp.com');

          if (data.isRealSmtp) {
            setTestResult({
              success: true,
              message: `✅ E-mail SMTP réel transmis à ${recipient} ! (Consultez votre boîte de réception Gmail / Spams).`
            });
          } else {
            setTestResult({
              success: false,
              message: `⚠️ Mode Simulation (Bac à Sable) : Test validé en interne, mais aucun e-mail réel n'a été transmis à ${recipient} car le "Mot de Passe SMTP (App Password)" n'est pas renseigné dans les Paramètres Système.`
            });
          }
        } else {
          setTestResult({
            success: false,
            message: data.error || 'Erreur lors de l\'envoi du test SMTP'
          });
        }
      } else {
        // WhatsApp Test
        const targetPhone = selectedPayslip.phone || '+33 6 12 34 56 78';
        const pdfLink = EmailEngine.getPdfLink(selectedPayslip);

        const res = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toPhone: targetPhone,
            employeeName: selectedPayslip.employeeName,
            messageText: renderedWaBody,
            pdfLink,
            whatsappSettings: emailSettings.whatsappSettings
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setTestResult({
            success: true,
            message: data.isRealWhatsApp
              ? `✅ Message WhatsApp réel envoyé à ${targetPhone} via Meta Cloud API !`
              : `💬 Message WhatsApp simulé pour ${targetPhone}. Vous pouvez aussi l'ouvrir directement dans WhatsApp Web.`,
            waMeLink: data.waMeLink
          });
        } else {
          setTestResult({
            success: false,
            message: data.error || 'Échec de l\'envoi WhatsApp'
          });
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erreur réseau lors du test d\'envoi'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const pdfDirectLink = EmailEngine.getPdfLink(selectedPayslip);
  const cleanPhone = (selectedPayslip.phone || '').replace(/[^0-9]/g, '');
  const waWebLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(renderedWaBody)}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
              activeTab === 'email' ? 'bg-blue-600' : 'bg-emerald-600'
            }`}>
              {activeTab === 'email' ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {activeTab === 'email' ? 'Aperçu du Message E-mail' : 'Aperçu de la Notification WhatsApp'}
              </h3>
              <p className="text-xs text-slate-300">
                Visualisation de l'envoi avec substitution dynamique des variables ({payrollMonth})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Email vs WhatsApp */}
        <div className="bg-slate-900 px-6 pb-2 flex items-center gap-2 border-t border-slate-800">
          <button
            onClick={() => { setActiveTab('email'); setTestResult(null); }}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>📧 Canal E-mail SMTP</span>
          </button>

          <button
            onClick={() => { setActiveTab('whatsapp'); setTestResult(null); }}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>💬 Canal WhatsApp Business</span>
          </button>
        </div>

        {/* Toolbar: Select Employee */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <User className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Sélectionner un employé :</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none flex-1 sm:w-64"
            >
              {displayList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.employeeName} ({p.matricule}) — € {p.netPay.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'whatsapp' && (
              <a
                href={waWebLink}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ouvrir WhatsApp Web</span>
              </a>
            )}

            <button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className={`px-3.5 py-1.5 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'email' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSendingTest ? 'Envoi...' : activeTab === 'email' ? 'Envoyer Test E-mail' : 'Envoyer Test WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
            testResult.success 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{testResult.message}</span>
              {testResult.waMeLink && (
                <a href={testResult.waMeLink} target="_blank" rel="noreferrer" className="underline font-bold text-emerald-700 ml-2">
                  Lien direct WhatsApp Web →
                </a>
              )}
            </div>
            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">Effacer</button>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-100/60 flex-1">
          
          {/* Substituted Variables Chips */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Variables Injectées pour cet Employé</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md border border-blue-200 font-medium">
                <strong className="font-bold">{'{name}'}</strong>: {selectedPayslip.employeeName}
              </span>
              <span className="px-2.5 py-1 bg-slate-50 text-slate-800 rounded-md border border-slate-200 font-medium">
                <strong className="font-bold">{'{Matricule}'}</strong>: {selectedPayslip.matricule}
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 font-medium">
                <strong className="font-bold">{'{NetPay}'}</strong>: € {selectedPayslip.netPay.toFixed(2)}
              </span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200 font-medium">
                <strong className="font-bold">{'{Month}'}</strong>: {payrollMonth.split(' ')[0]}
              </span>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-800 rounded-md border border-purple-200 font-medium">
                <strong className="font-bold">{'{Department}'}</strong>: {selectedPayslip.department}
              </span>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-md border border-indigo-200 font-medium">
                <strong className="font-bold">{'{PdfLink}'}</strong>: {pdfDirectLink}
              </span>
            </div>
          </div>

          {activeTab === 'email' ? (
            /* Realistic Mail Card */
            <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
              {/* Mail Headers */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium w-20">Expéditeur :</span>
                  <span className="font-bold text-slate-800 flex-1">
                    {senderName} <span className="text-slate-500 font-mono font-normal">&lt;{senderEmail}&gt;</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium w-20">Destinataire :</span>
                  <span className="font-bold text-slate-800 flex-1">
                    {selectedPayslip.employeeName} {' '}
                    <span className={`font-mono font-normal ${!selectedPayslip.email || selectedPayslip.email.includes('invalid') ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                      &lt;{selectedPayslip.email || 'Adresse email manquante'}&gt;
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium w-20">Objet :</span>
                  <span className="font-extrabold text-slate-900 flex-1 text-sm">
                    {renderedSubject}
                  </span>
                </div>
              </div>

              {/* Email Body Content */}
              <div className="p-6 text-xs text-slate-800 whitespace-pre-line leading-relaxed min-h-[160px]">
                {renderedEmailBody}
              </div>

              {/* Attachment & Direct Link Box */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 border border-red-200">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Fiche_de_paie_{selectedPayslip.matricule}.pdf</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase tracking-wide">
                        Pièce Jointe + Lien Direct
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Lien direct: {pdfDirectLink}
                    </div>
                  </div>
                </div>

                <a
                  href={pdfDirectLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <span>Ouvrir Lien PDF</span>
                </a>
              </div>
            </div>
          ) : (
            /* Realistic WhatsApp Chat Box */
            <div className="bg-[#0b141a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden max-w-lg mx-auto font-sans">
              {/* WhatsApp Header */}
              <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between text-white border-b border-[#2a3942]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs font-mono">
                    KIBOSH
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>KIBOSH Service Paie System</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-900 font-black text-[9px] flex items-center justify-center">✓</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      Compte Officiel Business • {selectedPayslip.phone || '+33 6 12 34 56 78'}
                    </div>
                  </div>
                </div>
                <Phone className="w-5 h-5 text-slate-400" />
              </div>

              {/* WhatsApp Chat Canvas */}
              <div className="p-4 space-y-3 bg-[#0b141a] bg-[radial-gradient(#202c33_1px,transparent_1px)] [background-size:16px_16px] min-h-[300px]">
                <div className="text-center">
                  <span className="px-3 py-1 bg-[#182229] text-slate-400 text-[10px] rounded-md font-medium border border-[#222e35]">
                    AUJOURD'HUI
                  </span>
                </div>

                {/* Received Bubble */}
                <div className="max-w-[88%] bg-[#005c4b] text-slate-100 p-3.5 rounded-2xl rounded-tr-none ml-auto shadow-sm text-xs space-y-2 relative border border-emerald-800/40">
                  <div className="whitespace-pre-line leading-relaxed font-sans text-slate-100">
                    {renderedWaBody}
                  </div>

                  {/* Attachment Card inside WhatsApp Bubble */}
                  <div className="mt-2 p-2.5 bg-[#025142] rounded-xl border border-emerald-600/40 flex items-center gap-3">
                    <div className="p-2 bg-red-600 text-white rounded-lg font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-100 text-xs truncate">
                        Fiche_de_paie_{selectedPayslip.matricule}.pdf
                      </div>
                      <div className="text-[10px] text-emerald-200">
                        Document chiffré KIBOSH • 1 page
                      </div>
                    </div>
                    <a
                      href={pdfDirectLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-300 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                </div>
              </div>

              {/* WhatsApp Chat Footer Bar */}
              <div className="p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2 text-xs text-slate-400">
                <span className="flex-1 italic text-[11px]">Message sécurisé avec le chiffrement de bout en bout WhatsApp.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Aperçu en direct conforme au modèle {activeTab === 'email' ? 'SMTP' : 'WhatsApp Cloud API'}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Fermer l'Aperçu
          </button>
        </div>

      </div>
    </div>
  );
};

