import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Paperclip, 
  Send, 
  Eye, 
  FileText, 
  Building2, 
  User, 
  ShieldAlert, 
  X, 
  Lock, 
  Download, 
  TrendingUp, 
  PieChart, 
  BarChart2, 
  Sliders, 
  CheckSquare, 
  UserCheck, 
  Sparkles,
  Info,
  Trash2,
  AlertOctagon
} from 'lucide-react';
import { 
  FeedbackTicket, 
  FeedbackCategory, 
  FeedbackStatus, 
  FeedbackPriority, 
  FeedbackResponse, 
  CompanyTenant, 
  AuditLog 
} from '../../types';
import { StorageService } from '../../services/storageService';

interface PlatformFeedbackManagementProps {
  companies: CompanyTenant[];
  onLogAudit: (action: string, category: AuditLog['category'], details: string) => void;
}

export const PlatformFeedbackManagement: React.FC<PlatformFeedbackManagementProps> = ({
  companies,
  onLogAudit
}) => {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Multi-Selection State for Bulk Actions
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [ticketToDelete, setTicketToDelete] = useState<FeedbackTicket | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Selected Ticket Drawer
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState('Support Level 2 - Platform Team');
  const [editStatus, setEditStatus] = useState<FeedbackStatus>('In Progress');
  const [editPriority, setEditPriority] = useState<FeedbackPriority>('Medium');

  const refreshTickets = () => {
    setTickets(StorageService.getFeedbackTickets());
  };

  useEffect(() => {
    refreshTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      setEditStatus(selectedTicket.status);
      setEditPriority(selectedTicket.priority);
      setAssignedAgent(selectedTicket.assignedAgent || 'Support Level 2 - Platform Team');
    }
  }, [selectedTicket]);

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
      onLogAudit(
        'FEEDBACK_TICKET_DELETED',
        'PLATFORM_ADMIN',
        `Platform Admin deleted feedback ticket ${ticketNum}: "${ticketTitle}".`
      );
    }
    setTicketToDelete(null);
  };

  // Handle Bulk Delete Confirmation
  const handleConfirmBulkDelete = () => {
    if (selectedTicketIds.length === 0) return;
    const deletedCount = StorageService.deleteFeedbackTickets(selectedTicketIds);

    if (selectedTicket && selectedTicketIds.includes(selectedTicket.id)) {
      setSelectedTicket(null);
    }
    setSelectedTicketIds([]);
    refreshTickets();
    setIsBulkDeleteModalOpen(false);
    onLogAudit(
      'FEEDBACK_TICKETS_BULK_DELETED',
      'PLATFORM_ADMIN',
      `Platform Admin bulk deleted ${deletedCount} feedback ticket(s).`
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
      const idSet = new Set(filteredIds);
      setSelectedTicketIds(prev => prev.filter(id => !idSet.has(id)));
    } else {
      const union = new Set([...selectedTicketIds, ...filteredIds]);
      setSelectedTicketIds(Array.from(union));
    }
  };

  // Analytics & Statistics
  const totalFeedback = tickets.length;
  const openCount = tickets.filter(t => ['New', 'Under Review', 'In Progress', 'Waiting for User'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' || t.priority === 'High').length;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  tickets.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  // Priority breakdown
  const priorityCounts: Record<string, number> = {};
  tickets.forEach(t => {
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  });

  // Filtered list
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.context.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.context.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = companyFilter === 'all' || ticket.context.companyId === companyFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesCompany && matchesCategory && matchesStatus && matchesPriority;
  });

  // Export Data
  const handleExportCSV = () => {
    if (tickets.length === 0) return;
    const headers = ['Ticket Number', 'Company', 'User', 'Email', 'Category', 'Priority', 'Status', 'Title', 'Created At', 'App Version', 'Browser', 'OS'];
    const rows = filteredTickets.map(t => [
      t.ticketNumber,
      `"${t.context.companyName}"`,
      `"${t.context.userName}"`,
      t.context.email,
      t.category,
      t.priority,
      t.status,
      `"${t.title.replace(/"/g, '""')}"`,
      t.createdAt,
      t.context.appVersion,
      `"${t.context.browser}"`,
      `"${t.context.os}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KIBOSH_Feedback_Tickets_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onLogAudit('FEEDBACK_TICKETS_EXPORTED', 'PLATFORM_ADMIN', 'Platform Super Admin exported feedback tickets to CSV.');
  };

  // Reply / Note Submission
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const updated = StorageService.addTicketResponse(
      selectedTicket.id,
      {
        authorId: 'usr-owner-1',
        authorName: 'Support Client SaaS',
        authorRole: 'Platform Super Admin',
        authorEmail: 'support@kibosh-saas.io',
        isInternalNote,
        message: replyText.trim()
      },
      !isInternalNote && selectedTicket.status === 'New' ? 'Under Review' : editStatus
    );

    if (updated) {
      // Update Agent & Status
      const finalUpdated = StorageService.updateTicketStatus(updated.id, editStatus, assignedAgent);
      setSelectedTicket(finalUpdated || updated);
      refreshTickets();
      setReplyText('');
      setIsInternalNote(false);

      onLogAudit(
        'FEEDBACK_RESPONSE_ADDED',
        'PLATFORM_ADMIN',
        `Platform Owner responded to ticket ${updated.ticketNumber}. Status: ${editStatus}, Internal Note: ${isInternalNote}`
      );
    }
  };

  // Status Change directly
  const handleStatusChange = (newStatus: FeedbackStatus) => {
    if (!selectedTicket) return;
    const updated = StorageService.updateTicketStatus(selectedTicket.id, newStatus, assignedAgent);
    if (updated) {
      setSelectedTicket(updated);
      setEditStatus(newStatus);
      refreshTickets();
      onLogAudit('FEEDBACK_STATUS_CHANGED', 'PLATFORM_ADMIN', `Ticket ${selectedTicket.ticketNumber} status changed to ${newStatus}.`);
    }
  };

  // Priority Change directly
  const handlePriorityChange = (newPriority: FeedbackPriority) => {
    if (!selectedTicket) return;
    const updated = StorageService.updateTicketPriority(selectedTicket.id, newPriority);
    if (updated) {
      setSelectedTicket(updated);
      setEditPriority(newPriority);
      refreshTickets();
      onLogAudit('FEEDBACK_PRIORITY_CHANGED', 'PLATFORM_ADMIN', `Ticket ${selectedTicket.ticketNumber} priority changed to ${newPriority}.`);
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'New':
        return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold border border-blue-200">Nouveau</span>;
      case 'Under Review':
        return <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[11px] font-bold border border-purple-200">En Examen</span>;
      case 'In Progress':
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold border border-amber-200">En Traitement</span>;
      case 'Waiting for User':
        return <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[11px] font-bold border border-orange-200">En Attente Utilisateur</span>;
      case 'Resolved':
        return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200">Résolu</span>;
      case 'Closed':
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold border border-slate-300">Clôturé</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-[11px] font-bold border border-red-200">Rejeté</span>;
    }
  };

  const getPriorityBadge = (priority: FeedbackPriority) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 bg-red-600 text-white rounded font-bold text-[10px]">🔴 CRITIQUE</span>;
      case 'High':
        return <span className="px-2 py-0.5 bg-orange-500 text-white rounded font-bold text-[10px]">🟠 ÉLEVÉE</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px]">🟡 MOYENNE</span>;
      case 'Low':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded font-bold text-[10px]">🟢 FAIBLE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Total Retours Reçus</span>
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalFeedback}</div>
          <p className="text-[10px] text-slate-400">Ensemble des entreprises clientes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold uppercase">
            <span>Tickets Ouverts / En Cours</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{openCount}</div>
          <p className="text-[10px] text-slate-400">Requiert une réponse du support</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold uppercase">
            <span>Tickets Résolus / Clôturés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{resolvedCount}</div>
          <p className="text-[10px] text-slate-400">Temps de résolution moyen: 4.2h</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-red-600 text-xs font-bold uppercase">
            <span>Priorité Élevée / Critique</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">{criticalCount}</div>
          <p className="text-[10px] text-slate-400">Prise en charge prioritaire SLA</p>
        </div>
      </div>

      {/* Reports & Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown visual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Répartition par Catégorie</span>
          </h3>

          <div className="space-y-2.5">
            {Object.entries(categoryCounts).map(([cat, cnt]) => {
              const pct = Math.round((cnt / (totalFeedback || 1)) * 100);
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{cat}</span>
                    <span className="font-mono font-bold text-slate-900">{cnt} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority breakdown visual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-600" />
            <span>Niveau de Priorité Global</span>
          </h3>

          <div className="space-y-3">
            {(['Critical', 'High', 'Medium', 'Low'] as FeedbackPriority[]).map((prio) => {
              const cnt = priorityCounts[prio] || 0;
              const pct = Math.round((cnt / (totalFeedback || 1)) * 100);
              return (
                <div key={prio} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(prio)}
                  </div>
                  <div className="font-mono font-bold text-slate-800">
                    {cnt} ticket(s) ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top requested features & Top reported issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tendances Produit & Retours Clés</span>
          </h3>

          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5">
              <span>💡 Fonctionnalité la plus demandée:</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Modèles WhatsApp personnalisés par département & liens dynamiques portail RH.
            </p>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1 text-xs text-blue-900">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚡ Problème le plus fréquemment signalé:</span>
            </div>
            <p className="text-[11px] text-blue-800">
              Temps de traitement OCR lors du découpage de fichiers PDF de plus de 300 pages.
            </p>
          </div>
        </div>
      </div>

      {/* Global Filter Bar & Export */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par ticket #, entreprise, utilisateur..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Toutes les Entreprises</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

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

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={refreshTickets}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Rafraîchir"
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

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                <th className="py-3 px-4">Entreprise & Utilisateur</th>
                <th className="py-3 px-4">Titre & Sujet</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Priorité</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Agent Assigné</th>
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
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ticket.context.companyName}</div>
                      <div className="text-[11px] text-slate-500">{ticket.context.userName} ({ticket.context.userRole})</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 truncate">{ticket.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{ticket.subject}</div>
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {ticket.assignedAgent || 'Non assigné'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Gérer</span>
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
      </div>

      {/* Ticket Management Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950 px-2.5 py-1 rounded border border-blue-800">
                  {selectedTicket.ticketNumber}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white line-clamp-1">{selectedTicket.title}</h2>
                  <p className="text-xs text-slate-400">
                    Entreprise: <span className="text-white font-semibold">{selectedTicket.context.companyName}</span> • Demandeur: <span className="text-white font-semibold">{selectedTicket.context.userName}</span>
                  </p>
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

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              {/* Management Controls Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Changer le Statut du Ticket
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const st = e.target.value as FeedbackStatus;
                      setEditStatus(st);
                      handleStatusChange(st);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="New">Nouveau</option>
                    <option value="Under Review">En Examen</option>
                    <option value="In Progress">En Traitement</option>
                    <option value="Waiting for User">En Attente Utilisateur</option>
                    <option value="Resolved">Résolu</option>
                    <option value="Closed">Clôturé</option>
                    <option value="Rejected">Rejeté</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Niveau de Priorité
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => {
                      const pr = e.target.value as FeedbackPriority;
                      setEditPriority(pr);
                      handlePriorityChange(pr);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="Low font-bold">Faible (Low)</option>
                    <option value="Medium font-bold">Moyenne (Medium)</option>
                    <option value="High font-bold">Élevée (High)</option>
                    <option value="Critical font-bold">Critique (Critical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Agent / Équipe Assignée
                  </label>
                  <input
                    type="text"
                    value={assignedAgent}
                    onChange={(e) => setAssignedAgent(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Automatic Environment Diagnostics Box */}
              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Diagnostics de l'Environnement Client (Auto-Capturé)</span>
                  <span className="text-[10px] text-slate-400 font-mono">IP: {selectedTicket.context.ipAddress}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Utilisateur & Rôle</div>
                    <div className="text-white font-medium truncate">{selectedTicket.context.userName} ({selectedTicket.context.userRole})</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Navigateur & OS</div>
                    <div className="text-white font-medium truncate">{selectedTicket.context.browser}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Appareil & Page</div>
                    <div className="text-white font-medium truncate">{selectedTicket.context.deviceType} • {selectedTicket.context.currentPage}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Version & Fuseau</div>
                    <div className="text-white font-medium truncate">{selectedTicket.context.appVersion} ({selectedTicket.context.timeZone})</div>
                  </div>
                </div>
              </div>

              {/* Ticket Initial Message */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span>Demande Initiale de l'Utilisateur</span>
                  <span className="text-[11px] text-slate-400 font-normal">{selectedTicket.createdAt}</span>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {selectedTicket.description}
                </p>

                {selectedTicket.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    {selectedTicket.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.dataUrl || '#'}
                        download={att.name}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>{att.name}</span>
                        <span className="text-[10px] text-slate-400">({(att.size / 1024).toFixed(0)} Ko)</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation History */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Historique des Messages ({selectedTicket.responses.length})</span>
                </h3>

                {selectedTicket.responses.map((resp) => (
                  <div
                    key={resp.id}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                      resp.isInternalNote
                        ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                        : resp.authorRole === 'Platform Super Admin'
                        ? 'bg-blue-50 border-blue-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                      <div className="flex items-center gap-2 font-bold">
                        {resp.isInternalNote && (
                          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] rounded font-bold flex items-center gap-1 border border-amber-300">
                            <Lock className="w-3 h-3" /> Note Interne Support (Masqué du client)
                          </span>
                        )}
                        <span>{resp.authorName}</span>
                        <span className="text-slate-500 font-normal">({resp.authorRole})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{resp.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{resp.message}</p>
                  </div>
                ))}
              </div>

              {/* Response / Internal Note Form */}
              <form onSubmit={handleSendReply} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Répondre à l'Utilisateur ou Ajouter une Note Interne
                  </span>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Note Interne (Non visible par le client)</span>
                  </label>
                </div>

                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? "Rédiger une note interne réservée à l'équipe plateforme..."
                      : "Saisir la réponse destinée au client (notification envoyée)..."
                  }
                  className={`w-full p-3 border rounded-xl text-xs font-normal focus:outline-none ${
                    isInternalNote
                      ? 'bg-amber-50/50 border-amber-300 text-amber-900 focus:ring-2 focus:ring-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500'
                  }`}
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{isInternalNote ? 'Enregistrer Note Interne' : 'Envoyer la Réponse au Client'}</span>
                  </button>
                </div>
              </form>
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
                <span className="font-semibold">Entreprise:</span> {ticketToDelete.context.companyName} • <span className="font-semibold">Demandeur:</span> {ticketToDelete.context.userName}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Cette action est <strong>irréversible</strong>. Le ticket et l'ensemble de ses réponses seront définitivement effacés de la plateforme.
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
    </div>
  );
};
