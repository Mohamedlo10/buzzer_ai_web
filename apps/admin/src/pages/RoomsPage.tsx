import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Eye,
  Trash2,
  ArrowRightLeft,
  X,
  FolderOpen,
  Users,
  Gamepad2,
} from 'lucide-react';

import { DataTable, type Column } from '../components/admin/DataTable';
import { adminApi, confirmAsync, type AdminRoomResponse } from '@xalaat/core';

const PAGE_SIZE = 20;

export function RoomsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [transferRoom, setTransferRoom] = useState<AdminRoomResponse | null>(null);
  const [newOwnerId, setNewOwnerId] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminRooms', page, debouncedSearch],
    queryFn: () =>
      adminApi.getAdminRooms({
        search: debouncedSearch || undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (roomId: string) => adminApi.deleteAdminRoom(roomId),
    onSuccess: () => {
      toast.success('Salle supprimée');
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
    },
    onError: () => toast.error('Impossible de supprimer la salle'),
  });

  const transferMutation = useMutation({
    mutationFn: ({ roomId, newOwnerId: ownerId }: { roomId: string; newOwnerId: string }) =>
      adminApi.transferRoomOwnership(roomId, ownerId),
    onSuccess: () => {
      toast.success('Propriété transférée');
      setTransferRoom(null);
      setNewOwnerId('');
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
    },
    onError: () => toast.error('Impossible de transférer la propriété'),
  });

  const handleDelete = async (room: AdminRoomResponse) => {
    const confirmed = await confirmAsync({
      title: 'Supprimer la salle ?',
      message: `"${room.name}" et toutes ses statistiques seront supprimées.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;
    deleteMutation.mutate(room.id);
  };

  const handleTransfer = () => {
    if (!transferRoom || !newOwnerId.trim()) return;
    transferMutation.mutate({ roomId: transferRoom.id, newOwnerId: newOwnerId.trim() });
  };

  const rooms = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns: Column<AdminRoomResponse>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FolderOpen size={16} color="var(--violet)" />
          <span className="text-txt font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: 'code', header: 'Code' },
    { key: 'ownerUsername', header: 'Propriétaire' },
    {
      key: 'memberCount',
      header: 'Membres',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Users size={14} color="var(--txt-60)" />
          <span>{row.memberCount}</span>
        </div>
      ),
    },
    {
      key: 'sessionCount',
      header: 'Sessions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Gamepad2 size={14} color="var(--txt-60)" />
          <span>{row.sessionCount}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (row) => (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: row.isActive ? 'rgba(224, 86, 36, 0.125)' : 'rgba(231, 76, 60, 0.125)',
            color: row.isActive ? 'var(--primary)' : 'var(--bad)',
          }}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/rooms/${row.id}`)}
            className="p-1.5 rounded-lg text-txt-60 hover:text-txt hover:bg-surface-2 transition-colors cursor-pointer"
            title="Détails"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setTransferRoom(row)}
            className="p-1.5 rounded-lg text-txt-60 hover:text-warn hover:bg-warn/10 transition-colors cursor-pointer"
            title="Transférer la propriété"
          >
            <ArrowRightLeft size={16} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 rounded-lg text-txt-60 hover:text-bad hover:bg-bad/10 transition-colors cursor-pointer"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-txt text-2xl font-bold font-display">Salles</h1>
          <p className="text-txt-60 text-sm">Gestion des espaces multijoueurs</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        keyExtractor={(r) => r.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchPlaceholder="Rechercher par nom, code ou propriétaire..."
        searchQuery={search}
        onSearch={setSearch}
        isLoading={isLoading}
        onRowClick={(r) => navigate(`/rooms/${r.id}`)}
      />

      {/* Transfer modal */}
      {transferRoom && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-line shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-txt font-bold text-lg font-display">Transférer la propriété</h3>
              <button
                onClick={() => setTransferRoom(null)}
                className="text-txt-60 hover:text-txt cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-txt-60 text-sm mb-4">
              Salle : <strong className="text-txt">{transferRoom.name}</strong> (#{transferRoom.code})
            </p>
            <input
              type="text"
              placeholder="UUID du nouveau propriétaire"
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full bg-bg rounded-xl px-4 py-3 text-txt text-sm border border-line mb-4 outline-none focus:border-host"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setTransferRoom(null)}
                className="px-4 py-2 rounded-xl bg-surface-2 text-txt text-sm font-medium hover:bg-surface-2/80 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferMutation.isPending || !newOwnerId.trim()}
                className="px-4 py-2 rounded-xl bg-host text-primary-ink text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
              >
                {transferMutation.isPending ? 'Transfert...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
