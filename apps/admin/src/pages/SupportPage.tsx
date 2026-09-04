import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Tag,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/loading/Spinner';
import {
  supportApi,
  type AdminSupportTicketResponse,
  type SupportTicketStatus,
  type AdminUpdateTicketStatusRequest,
} from '@xalaat/core';

const STATUS_CONFIG: Record<
  SupportTicketStatus,
  { label: string; bg: string; text: string; icon: typeof Clock }
> = {
  OPEN: {
    label: 'Ouvert',
    bg: 'bg-amber-500/15 border-amber-500/30',
    text: 'text-amber-400',
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: 'En cours',
    bg: 'bg-blue-500/15 border-blue-500/30',
    text: 'text-blue-400',
    icon: Clock,
  },
  RESOLVED: {
    label: 'Résolu',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    text: 'text-emerald-400',
    icon: CheckCircle2,
  },
  CLOSED: {
    label: 'Fermé',
    bg: 'bg-zinc-500/15 border-zinc-500/30',
    text: 'text-zinc-400',
    icon: XCircle,
  },
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'OPEN', label: 'Ouverts' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'RESOLVED', label: 'Résolus' },
  { value: 'CLOSED', label: 'Fermés' },
];

export function SupportPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicketResponse | null>(null);
  const [editStatus, setEditStatus] = useState<SupportTicketStatus>('OPEN');
  const [adminNote, setAdminNote] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminSupportTickets', selectedStatus, page],
    queryFn: () =>
      supportApi.getAdminTickets({
        status: selectedStatus || undefined,
        page,
        size: pageSize,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: AdminUpdateTicketStatusRequest }) =>
      supportApi.updateAdminTicketStatus(id, req),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      toast.success('Ticket mis à jour');
      setSelectedTicket(updated);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du ticket');
    },
  });

  const openTicketDetail = (ticket: AdminSupportTicketResponse) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setAdminNote(ticket.adminNote ?? '');
  };

  const closeTicketDetail = () => {
    setSelectedTicket(null);
  };

  const handleSaveStatus = () => {
    if (!selectedTicket) return;
    updateMutation.mutate({
      id: selectedTicket.id,
      req: {
        status: editStatus,
        adminNote: adminNote.trim() || undefined,
      },
    });
  };

  const tickets = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Top Header */}
      <div className="border-b border-line bg-bg-deep px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-host/15 flex items-center justify-center">
              <LifeBuoy size={22} className="text-host" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-txt font-display">Support & Assistance</h1>
              <p className="text-xs text-txt-60">
                {totalElements} demande{totalElements > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => {
            const isActive = selectedStatus === f.value;
            return (
              <button
                key={f.value}
                onClick={() => {
                  setSelectedStatus(f.value);
                  setPage(0);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-host text-white shadow-sm'
                    : 'bg-surface-2 text-txt-60 hover:text-txt hover:bg-surface'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-5xl w-full mx-auto pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner text="Chargement des tickets..." />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-txt-40">
              <MessageSquare size={24} />
            </div>
            <p className="text-txt-60 text-sm font-medium">Aucun ticket trouvé</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
              const StatusIcon = cfg.icon;
              return (
                <Card
                  key={ticket.id}
                  onClick={() => openTicketDetail(ticket)}
                  className="cursor-pointer hover:border-host/40 transition-all group p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}
                        >
                          <StatusIcon size={12} />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-txt-40 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(ticket.createdAt).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                        {ticket.username && (
                          <span className="text-xs text-txt-60 flex items-center gap-1">
                            <User size={12} />
                            {ticket.username}
                          </span>
                        )}
                        {ticket.contactEmail && (
                          <span className="text-xs text-txt-40 flex items-center gap-1">
                            <Mail size={12} />
                            {ticket.contactEmail}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-txt group-hover:text-host transition-colors">
                        {ticket.subject}
                      </h3>

                      <p className="text-sm text-txt-60 line-clamp-2 mt-1 leading-relaxed">
                        {ticket.message}
                      </p>

                      {ticket.adminNote && (
                        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-line/60 text-xs text-txt-60">
                          <span className="font-semibold text-txt">Note :</span> {ticket.adminNote}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openTicketDetail(ticket);
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-host hover:text-white text-txt-60 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Traiter
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-line">
            <p className="text-xs text-txt-60">
              Page {page + 1} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-2 rounded-xl bg-surface-2 border border-line text-txt-60 hover:text-txt disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-xl bg-surface-2 border border-line text-txt-60 hover:text-txt disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail & Action Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeTicketDetail} />
          <div className="relative bg-surface rounded-3xl border border-line max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-line">
              <div className="space-y-1">
                <span className="text-xs font-mono text-txt-40">Ticket ID : {selectedTicket.id}</span>
                <h2 className="text-lg font-bold text-txt font-display">{selectedTicket.subject}</h2>
              </div>
              <button
                onClick={closeTicketDetail}
                className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-txt-60 hover:text-txt cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Author Info */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-bg border border-line text-xs">
              <div>
                <span className="text-txt-40 block mb-0.5">Joueur</span>
                <span className="text-txt font-semibold flex items-center gap-1.5">
                  <User size={13} className="text-host" />
                  {selectedTicket.username || 'Compte supprimé'}
                </span>
              </div>
              <div>
                <span className="text-txt-40 block mb-0.5">Email de contact</span>
                <span className="text-txt font-semibold flex items-center gap-1.5 truncate">
                  <Mail size={13} className="text-host" />
                  {selectedTicket.contactEmail || 'Non spécifié'}
                </span>
              </div>
              <div>
                <span className="text-txt-40 block mb-0.5">Date de soumission</span>
                <span className="text-txt">
                  {new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>
              {selectedTicket.resolvedAt && (
                <div>
                  <span className="text-txt-40 block mb-0.5">Résolu le</span>
                  <span className="text-txt">
                    {new Date(selectedTicket.resolvedAt).toLocaleString('fr-FR')}
                    {selectedTicket.resolvedByUsername && ` par ${selectedTicket.resolvedByUsername}`}
                  </span>
                </div>
              )}
            </div>

            {/* User Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-txt-60 uppercase tracking-wider">
                Message du joueur
              </label>
              <div className="p-4 rounded-2xl bg-bg-deep border border-line text-sm text-txt leading-relaxed whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            {/* Change Status & Admin Note */}
            <div className="space-y-4 pt-2 border-t border-line">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-txt-60 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={13} />
                  Statut du ticket
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as SupportTicketStatus)}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg text-txt border border-line text-sm focus:outline-none focus:border-host cursor-pointer"
                >
                  <option value="OPEN">Ouvert (OPEN)</option>
                  <option value="IN_PROGRESS">En cours (IN_PROGRESS)</option>
                  <option value="RESOLVED">Résolu (RESOLVED)</option>
                  <option value="CLOSED">Fermé (CLOSED)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-txt-60 uppercase tracking-wider">
                  Note interne / Solution
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ajouter une note de suivi ou la résolution..."
                  rows={3}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg text-txt border border-line text-sm focus:outline-none focus:border-host resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={closeTicketDetail}
                className="px-4 py-2 rounded-xl bg-surface-2 text-txt-60 hover:text-txt text-sm font-semibold transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-host text-white text-sm font-semibold hover:bg-host/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Save size={16} />
                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
