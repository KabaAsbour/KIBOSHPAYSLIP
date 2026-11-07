import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Monitor, 
  Globe, 
  Building2, 
  User, 
  Clock, 
  ShieldAlert, 
  HelpCircle,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';
import { 
  UserSession, 
  FeedbackCategory, 
  FeedbackPriority, 
  FeedbackAttachment, 
  FeedbackTicket 
} from '../../types';
import { StorageService } from '../../services/storageService';

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserSession: UserSession;
  currentPageName?: string;
  onFeedbackSubmitted: (newTicket: FeedbackTicket) => void;
}

export const UserFeedbackModal: React.FC<UserFeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUserSession,
  currentPageName = 'Tableau de Bord de Distribution',
  onFeedbackSubmitted
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('Bug Report');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<FeedbackPriority>('Medium');
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const [showAutoContext, setShowAutoContext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Auto detect environment
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown Browser';
  const isMobile = /Mobi|Android/i.test(userAgent);
  const isTablet = /Tablet|iPad/i.test(userAgent);
  const deviceType = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';

  let browserName = 'Browser';
  if (userAgent.includes('Chrome')) browserName = 'Google Chrome';
  else if (userAgent.includes('Firefox')) browserName = 'Mozilla Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserName = 'Apple Safari';
  else if (userAgent.includes('Edg')) browserName = 'Microsoft Edge';

  let osName = 'Operating System';
  if (userAgent.includes('Win')) osName = 'Windows 11/10';
  else if (userAgent.includes('Mac')) osName = 'macOS';
  else if (userAgent.includes('Linux')) osName = 'Linux';
  else if (userAgent.includes('Android')) osName = 'Android OS';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) osName = 'iOS';

  const userLanguage = typeof window !== 'undefined' ? window.navigator.language : 'fr-FR';
  const userTimeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Paris';

  // Handle File Attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesArray: File[] = Array.from(e.target.files);

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit
    const validFiles: FeedbackAttachment[] = [];

    filesArray.forEach(file => {
      if (file.size > maxSizeBytes) {
        setErrorMessage(`Le fichier "${file.name}" dépasse la taille maximale autorisée de 10 Mo.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: FeedbackAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Veuillez saisir un titre pour votre retour.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Veuillez détailler votre demande ou problème dans la description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const newTicket = StorageService.createFeedbackTicket({
        title: title.trim(),
        category,
        subject: subject.trim() || title.trim(),
        description: description.trim(),
        priority,
        status: 'New',
        attachments,
        context: {
          userId: currentUserSession.id || 'usr-default',
          userName: currentUserSession.name,
          username: currentUserSession.username || currentUserSession.email.split('@')[0],
          email: currentUserSession.email,
          companyName: currentUserSession.company,
          companyId: currentUserSession.companyId || 'cmp-default',
          userRole: currentUserSession.role,
          browser: `${browserName} (${osName})`,
          os: osName,
          deviceType,
          ipAddress: '192.168.10.45',
          appVersion: 'v2.4.0-prod',
          currentPage: currentPageName,
          language: userLanguage,
          timeZone: userTimeZone
        }
      });

      // Log Audit Action
      StorageService.addAuditLog({
        user: currentUserSession.name,
        userRole: currentUserSession.role,
        ipAddress: '192.168.10.45',
        action: 'FEEDBACK_SUBMITTED',
        category: 'SECURITY',
        details: `User submitted feedback ticket ${newTicket.ticketNumber} [${newTicket.category}] with priority ${newTicket.priority}.`,
        result: 'Success'
      });

      onFeedbackSubmitted(newTicket);
      onClose();
      // Reset form
      setTitle('');
      setSubject('');
      setDescription('');
      setAttachments([]);
    } catch (err) {
      console.error(err);
      setErrorMessage('Une erreur est survenue lors de l\'envoi du ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <HelpCircle className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Transmettre un Retour & Support Technique</h2>
              <p className="text-xs text-blue-200/80">
                Communiquez directement avec l'équipe de support et la direction SaaS KIBOSH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Titre du Retour <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Erreur lors de la génération du rapport PDF ou Suggestion..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
              >
                <option value="Bug Report">🐛 Rapport de Bug (Bug Report)</option>
                <option value="Feature Request">💡 Demande de Fonctionnalité</option>
                <option value="Improvement Suggestion">📈 Suggestion d'Amélioration</option>
                <option value="Technical Support">🎧 Support Technique</option>
                <option value="Performance Issue font-bold">⚡ Problème de Performance</option>
                <option value="User Experience (UI/UX)">🎨 Ergonomie / UX-UI</option>
                <option value="Security Concern">🛡️ Inquiétude de Sécurité</option>
                <option value="Billing or Subscription">💳 Facturation / Abonnement</option>
                <option value="Complaint">⚠️ Réclamation / Plainte</option>
                <option value="General Comment">💬 Commentaire Général</option>
                <option value="Other">❓ Autre</option>
              </select>
            </div>
          </div>

          {/* Subject & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sujet / Module Concerné
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Module d'Envoi WhatsApp, Découpage PDF, Export CSV..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Niveau de Priorité <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
              >
                <option value="Low">🟢 Faible (Low) - Simple question/suggestion</option>
                <option value="Medium">🟡 Moyenne (Medium) - Gêne mineure</option>
                <option value="High">🟠 Élevée (High) - Fonctionnalité bloquée</option>
                <option value="Critical">🔴 Critique (Critical) - Blocage système complet</option>
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description Détaillée <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez précisément votre problème, la procédure pour le reproduire, ou les attentes de votre entreprise..."
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-normal focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all resize-y"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Fichiers Joint & Captures d'Écran (Optionnel)</span>
              <span className="text-[10px] text-slate-500 font-normal">Max 10 Mo par fichier (PNG, JPG, PDF, LOG, ZIP)</span>
            </label>

            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-xl p-4 text-center transition-colors cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.log,.zip"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                <Paperclip className="w-5 h-5 text-blue-600 mb-0.5" />
                <span className="text-xs font-semibold text-slate-700">
                  Cliquez ou glissez des fichiers ici
                </span>
                <span className="text-[10px] text-slate-400">
                  Captures d'écran, fichiers de log, spécifications ou documents justificatifs
                </span>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {attachments.map((att) => (
                  <div key={att.id} className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      {att.type?.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="font-medium text-slate-800 truncate" title={att.name}>{att.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({(att.size / 1024).toFixed(0)} Ko)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Automatic Information Collection Accordion / Preview */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/80">
            <button
              type="button"
              onClick={() => setShowAutoContext(!showAutoContext)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-600" />
                <span>Informations Techniques Capturées Automatiquement</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  Diagnostics
                </span>
              </div>
              <span className="text-slate-400 text-xs">
                {showAutoContext ? 'Masquer ▲' : 'Afficher ▼'}
              </span>
            </button>

            {showAutoContext && (
              <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-slate-600">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Utilisateur</div>
                  <div className="font-semibold text-slate-800 truncate">{currentUserSession.name} ({currentUserSession.role})</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Email & Entreprise</div>
                  <div className="font-semibold text-slate-800 truncate">{currentUserSession.email} • {currentUserSession.company}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Navigateur</div>
                  <div className="font-semibold text-slate-800 truncate">{browserName} ({osName})</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Type d'Appareil</div>
                  <div className="font-semibold text-slate-800">{deviceType}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Page Actuelle</div>
                  <div className="font-semibold text-slate-800 truncate">{currentPageName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Version App & Fuseau</div>
                  <div className="font-semibold text-slate-800 truncate">v2.4.0-prod ({userTimeZone})</div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer le Ticket de Support'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
