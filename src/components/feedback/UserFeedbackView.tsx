import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  PlusCircle, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  Paperclip, 
  Send, 
  Eye, 
  FileText, 
  Building2, 
  User, 
  ShieldAlert, 
  ChevronRight, 
  ArrowLeft,
  X,
  Lock,
  Download,
  Info,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  AlertOctagon
} from 'lucide-react';
import { 
  UserSession, 
  FeedbackTicket, 
  FeedbackCategory, 
  FeedbackStatus, 
  FeedbackPriority, 
  FeedbackResponse, 
  FeedbackAttachment 
} from '../../types';
import { StorageService } from '../../services/storageService';
import { UserFeedbackModal } from './UserFeedbackModal';

interface UserFeedbackViewProps {
  currentUserSession: UserSession;
  onLogAudit: (action: string, category: 'SECURITY' | 'PLATFORM_ADMIN', details: string) => void;
  onPushNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const UserFeedbackView: React.FC<UserFeedbackViewProps> = ({
  currentUserSession,
  onLogAudit,
  onPushNotification
}) => {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Multi-Selection State for Bulk Actions
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [ticketToDelete, setTicketToDelete] = useState<FeedbackTicket | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Selected Ticket Drawer / Detail
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<FeedbackAttachment[]>([]);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);

  // Load Tickets (BR-13: Company level visibility constraint, unless Platform Owner)
  const refreshTickets = () => {
    if (currentUserSession.isPlatformOwner || currentUserSession.role === 'Platform Super Admin') {
      setTickets(StorageService.getFeedbackTickets());
    } else {
      setTickets(StorageService.getFeedbackTicketsForCompany(currentUserSession.companyId));
    }
  };

  useEffect(() => {
    refreshTickets();
  }, [currentUserSession]);

  // Handle Single Delete Confirmation
  const handleConfirmSingleDelete = () => {
    if (!ticketToDelete) return;
    const ticketNum = ticketToDelete.ticketNumber;
    const ticketTitle = ticketToDelete.title;
    const success = StorageService.deleteFeedbackTicket(ticketToDelete.id);

    if (success) {
      setSelectedTicketIds(prev => prev.filter(id => id !== ticketToDelete.id));
      if (selectedTicket?.id === ticketToDelete.id) {
        setSelectedTicket(null);
      }
      refreshTickets();
      onPushNotification(
        'Ticket Supprimé',
        `Le ticket ${ticketNum} ("${ticketTitle}") a été supprimé avec succès.`,
        'success'
      );
      onLogAudit(
        'FEEDBACK_TICKET_DELETED',
        'SECURITY',
        `User ${currentUserSession.name} (${currentUserSession.role}) deleted feedback ticket ${ticketNum}: "${ticketTitle}".`
      );
    }
    setTicketToDelete(null);
  };

  // Handle Bulk Delete Confirmation
  const handleConfirmBulkDelete = () => {
    if (selectedTicketIds.length === 0) return;
    const countToDelete = selectedTicketIds.length;
    const deletedCount = StorageService.deleteFeedbackTickets(selectedTicketIds);

    if (selectedTicket && selectedTicketIds.includes(selectedTicket.id)) {
      setSelectedTicket(null);
    }
    setSelectedTicketIds([]);
    refreshTickets();
    setIsBulkDeleteModalOpen(false);
    onPushNotification(
      'Tickets Supprimés en Masse',
      `${deletedCount} ticket(s) de support ont été définitivement supprimés.`,
      'success'
    );
    onLogAudit(
      'FEEDBACK_TICKETS_BULK_DELETED',
      'SECURITY',
      `User ${currentUserSession.name} (${currentUserSession.role}) bulk deleted ${deletedCount} feedback ticket(s).`
    );
  };

  // Selection helpers
  const handleToggleSelect = (ticketId: string) => {
    setSelectedTicketIds(prev =>
      prev.includes(ticketId) ? prev.filter(id => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleToggleSelectAll = (filteredList: FeedbackTicket[]) => {
    const filteredIds = filteredList.map(t => t.id);
    const isAllSelected = filteredList.length > 0 && filteredList.every(t => selectedTicketIds.includes(t.id));

    if (isAllSelected) {
      // Unselect filtered
      const idSet = new Set(filteredIds);
      setSelectedTicketIds(prev => prev.filter(id => !idSet.has(id)));
    } else {
      // Select all filtered
      const union = new Set([...selectedTicketIds, ...filteredIds]);
      setSelectedTicketIds(Array.from(union));
    }
  };

  // Handle Reply Submission
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    const updated = StorageService.addTicketResponse(
      selectedTicket.id,
      {
        authorId: currentUserSession.id || 'usr-default',
        authorName: currentUserSession.name,
        authorRole: currentUserSession.role,
        authorEmail: currentUserSession.email,
        isInternalNote: false,
        message: replyMessage.trim(),
        attachments: replyAttachments
      },
      selectedTicket.status === 'Waiting for User' ? 'In Progress' : undefined
    );

    if (updated) {
      setSelectedTicket(updated);
      refreshTickets();
      setReplyMessage('');
      setReplyAttachments([]);
      onPushNotification(
        'Réponse envoyée',
        `Votre message a été ajouté au ticket ${updated.ticketNumber}.`,
        'success'
      );
    }
  };

  // Handle Reopen Ticket (BR-16)
  const handleReopenTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reopenReason.trim()) return;

    const updated = StorageService.reopenTicket(selectedTicket.id, reopenReason.trim(), {
      authorId: currentUserSession.id || 'usr-default',
      authorName: currentUserSession.name,
      authorRole: currentUserSession.role,
      authorEmail: currentUserSession.email
    });

    if (updated) {
      setSelectedTicket(updated);
      refreshTickets();
      setIsReopenModalOpen(false);
      setReopenReason('');
      onPushNotification(
        'Ticket Réouvert',
        `Le ticket ${updated.ticketNumber} a été réouvert avec succès.`,
        'info'
      );
      onLogAudit(
        'FEEDBACK_TICKET_REOPENED',
        'SECURITY',
        `User ${currentUserSession.name} reopened ticket ${updated.ticketNumber}. Reason: ${reopenReason.trim()}`
      );
    }
  };

  // Filtered List
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.context.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  // Analytics Cards
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => ['New', 'Under Review', 'In Progress', 'Waiting for User'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' || t.priority === 'High').length;

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'New':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold border border-blue-200">Nouveau</span>;
      case 'Under Review':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-[11px] font-bold border border-purple-200">En Examen</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold border border-amber-200">En Traitement</span>;
      case 'Waiting for User':
        return <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full text-[11px] font-bold border border-orange-200">En Attente Utilisateur</span>;
      case 'Resolved':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200">Résolu</span>;
      case 'Closed':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold border border-slate-300">Clôturé</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-[11px] font-bold border border-red-200">Rejeté</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: FeedbackPriority) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 bg-red-600 text-white rounded font-bold text-[10px] animate-pulse">🔴 CRITIQUE</span>;
      case 'High':
        return <span className="px-2 py-0.5 bg-orange-500 text-white rounded font-bold text-[10px]">🟠 ÉLEVÉE</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px]">🟡 MOYENNE</span>;
      case 'Low':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded font-bold text-[10px]">🟢 FAIBLE</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span>Support & Retours Utilisateurs</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Centre de Support Client & Feedback Produit
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Proposez des suggestions, signalez des bogues ou demandez de l'aide technique directement à l'équipe plateforme SaaS.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Transmettre un Nouveau Retour</span>
        </button>
      </div>

      {/* Analytics Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Total Tickets Soumis</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">En Cours / Ouverts</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{openCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Tickets Résolus</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Priorité Élevée / Critique</div>
            <div className="text-2xl font-black text-red-600 mt-1">{criticalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par n° ticket, sujet, mots clés..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Toutes Catégories</option>
            <option value="Bug Report">Rapport de Bug</option>
            <option value="Feature Request">Demande de Fonctionnalité</option>
            <option value="Improvement Suggestion">Suggestion d'Amélioration</option>
            <option value="Technical Support">Support Technique</option>
            <option value="Performance Issue">Problème de Performance</option>
            <option value="User Experience (UI/UX)">Ergonomie UI/UX</option>
            <option value="Security Concern">Sécurité</option>
            <option value="Billing or Subscription">Facturation</option>
            <option value="Other">Autre</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les Statuts</option>
            <option value="New">Nouveau</option>
            <option value="Under Review">En Examen</option>
            <option value="In Progress">En Traitement</option>
            <option value="Waiting for User">En Attente Utilisateur</option>
            <option value="Resolved">Résolu</option>
            <option value="Closed">Clôturé</option>
            <option value="Rejected">Rejeté</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Toutes Priorités</option>
            <option value="Critical">Critique</option>
            <option value="High">Élevée</option>
            <option value="Medium">Moyenne</option>
            <option value="Low">Faible</option>
          </select>

          <button
            onClick={refreshTickets}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Action Toolbar Banner (when tickets are selected) */}
      {selectedTicketIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 px-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold font-mono">
              {selectedTicketIds.length}
            </span>
            <span className="text-xs font-medium text-slate-200">
              ticket(s) sélectionné(s) sur {filteredTickets.length} visible(s)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedTicketIds.length < filteredTickets.length && (
              <button
                type="button"
                onClick={() => handleToggleSelectAll(filteredTickets)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Tout sélectionner ({filteredTickets.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedTicketIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Désélectionner
            </button>

            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer la sélection ({selectedTicketIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Tickets Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">Aucun ticket de support trouvé</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Vous n'avez pas encore soumis de retour correspondant aux critères sélectionnés.
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              Soumettre une demande
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Sélectionner tous les tickets"
                      checked={filteredTickets.length > 0 && filteredTickets.every(t => selectedTicketIds.includes(t.id))}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = filteredTickets.some(t => selectedTicketIds.includes(t.id)) && !filteredTickets.every(t => selectedTicketIds.includes(t.id));
                        }
                      }}
                      onChange={() => handleToggleSelectAll(filteredTickets)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Ticket #</th>
                  <th className="py-3 px-4">Sujet & Titre</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Priorité</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Date de Création</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTickets.map((ticket) => {
                  const isSelected = selectedTicketIds.includes(ticket.id);
                  return (
                    <tr 
                      key={ticket.id} 
                      className={`transition-colors ${isSelected ? 'bg-blue-50/70 hover:bg-blue-100/60' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner le ticket ${ticket.ticketNumber}`}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(ticket.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {ticket.ticketNumber}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{ticket.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{ticket.subject}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {ticket.createdAt}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Consulter les détails du ticket"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Consulter</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTicketToDelete(ticket)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title={`Supprimer le ticket ${ticket.ticketNumber}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Detail Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950 px-2.5 py-1 rounded border border-blue-800">
                  {selectedTicket.ticketNumber}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white line-clamp-1">{selectedTicket.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{selectedTicket.category}</span>
                    <span>•</span>
                    <span>Créé le {selectedTicket.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}

                <button
                  type="button"
                  onClick={() => setTicketToDelete(selectedTicket)}
                  className="px-3 py-1.5 bg-rose-900/50 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Supprimer ce ticket"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Ticket Original Problem Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{selectedTicket.context.userName}</span>
                    <span className="text-slate-400 font-normal">({selectedTicket.context.userRole})</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">{selectedTicket.context.companyName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{selectedTicket.createdAt}</span>
                </div>

                <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {selectedTicket.description}
                </div>

                {/* Attachments */}
                {selectedTicket.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pièces jointes fournies</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.dataUrl || '#'}
                          download={att.name}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                          <span>{att.name}</span>
                          <span className="text-[10px] text-slate-400">({(att.size / 1024).toFixed(0)} Ko)</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Conversation Timeline & Support Responses */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Historique des Échanges ({selectedTicket.responses.filter(r => !r.isInternalNote || currentUserSession.isPlatformOwner).length})</span>
                </h3>

                {selectedTicket.responses.length === 0 ? (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-center text-xs text-blue-800">
                    ℹ️ Votre demande est enregistrée. L'équipe de support examinera votre message sous peu.
                  </div>
                ) : (
                  selectedTicket.responses.map((resp) => {
                    // Hide internal notes from non-platform owner
                    if (resp.isInternalNote && !currentUserSession.isPlatformOwner) return null;

                    return (
                      <div
                        key={resp.id}
                        className={`p-4 rounded-xl border text-xs space-y-2 ${
                          resp.isInternalNote
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : resp.authorRole === 'Platform Super Admin' || resp.authorName.includes('Support')
                            ? 'bg-blue-50/80 border-blue-200 text-slate-900 ml-4'
                            : 'bg-white border-slate-200 text-slate-900 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                          <div className="flex items-center gap-2 font-bold">
                            {resp.isInternalNote && (
                              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] rounded font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Note Interne Support
                              </span>
                            )}
                            <span className="text-slate-900">{resp.authorName}</span>
                            <span className="text-slate-400 font-normal">({resp.authorRole})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{resp.timestamp}</span>
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">{resp.message}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form Section */}
              {['New', 'Under Review', 'In Progress', 'Waiting for User'].includes(selectedTicket.status) && (
                <form onSubmit={handleSendReply} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="text-xs font-bold text-slate-700">Ajouter une Réponse ou un Complément</div>
                  <textarea
                    rows={3}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Tapez votre réponse pour l'équipe de support..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      L'équipe de support sera notifiée immédiatement.
                    </span>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer la Réponse</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Reopen Ticket Banner (BR-16) */}
              {['Resolved', 'Closed'].includes(selectedTicket.status) && (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Ce ticket est actuellement {selectedTicket.status === 'Resolved' ? 'résolu' : 'clôturé'}.</span> Si le problème persiste ou si vous avez des questions complémentaires, vous pouvez réouvrir ce ticket.
                  </div>
                  <button
                    onClick={() => setIsReopenModalOpen(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Réouvrir le Ticket</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single Ticket Deletion Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Supprimer ce Ticket ?
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {ticketToDelete.ticketNumber}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 line-clamp-1">{ticketToDelete.title}</div>
              <div className="text-slate-500 text-[11px]">
                <span className="font-semibold">Catégorie:</span> {ticketToDelete.category} • <span className="font-semibold">Créé le:</span> {ticketToDelete.createdAt}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Cette action est <strong>irréversible</strong>. Le ticket et l'ensemble de ses réponses seront définitivement effacés.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer Définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && selectedTicketIds.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Suppression en Masse
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  {selectedTicketIds.length} ticket(s) sélectionné(s)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement les <strong>{selectedTicketIds.length} tickets</strong> sélectionnés ?
            </p>

            <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5">
              {selectedTicketIds.map(id => {
                const t = tickets.find(ticket => ticket.id === id);
                return (
                  <span key={id} className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-700 shadow-2xs">
                    {t ? t.ticketNumber : id}
                  </span>
                );
              })}
            </div>

            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Cette opération supprimera définitivement ces tickets et tous leurs échanges associés.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer les {selectedTicketIds.length} tickets</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal (BR-16) */}
      {isReopenModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              <span>Réouvrir le Ticket {selectedTicket.ticketNumber}</span>
            </h3>
            <p className="text-xs text-slate-600">
              Veuillez indiquer brièvement la raison pour laquelle vous réouvrez ce ticket.
            </p>

            <textarea
              rows={4}
              required
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Ex: Le problème se produit toujours après la mise à jour..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReopenTicketSubmit}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Confirmer la Réouverture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Ticket Modal */}
      <UserFeedbackModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        currentUserSession={currentUserSession}
        onFeedbackSubmitted={(newTicket) => {
          refreshTickets();
          onPushNotification(
            'Ticket Créé avec Succès',
            `Le ticket ${newTicket.ticketNumber} a été soumis. L'équipe SaaS KIBOSH étudiera votre demande.`,
            'success'
          );
        }}
      />
    </div>
  );
};
