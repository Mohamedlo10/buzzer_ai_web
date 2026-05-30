'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Eye,
  Trash2,
  ArrowRightLeft,
  X,
  FolderOpen,
  Users,
  Gamepad2,
} from 'lucide-react';

import { DataTable } from '~/components/admin/DataTable';
import * as adminApi from '~/lib/api/admin';
import type { AdminRoomResponse } from '~/types/api';

const PAGE_SIZE = 20;

export default function AdminRoomsPage() {
  const router = useRouter();
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

  const { data, isLoading, refetch } = useQuery({
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

  const handleDelete = (room: AdminRoomResponse) => {
    if (!window.confirm(`Supprimer la salle "${room.name}" ?`)) return;
    deleteMutation.mutate(room.id);
  };

  const handleTransfer = () => {
    if (!transferRoom || !newOwnerId.trim()) return;
    transferMutation.mutate({ roomId: transferRoom.id, newOwnerId: newOwnerId.trim() });
  };

  const rooms = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns = [
    {
      key: 'name',
      header: 'Nom',
      render: (row: AdminRoomResponse) => (
        <div className="flex items-center gap-2">
          <FolderOpen size={16} color="#9B59B6" />
          <span className="text-white font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: 'code', header: 'Code' },
    { key: 'ownerUsername', header: 'Propriétaire' },
    {
      key: 'memberCount',
      header: 'Membres',
      render: (row: AdminRoomResponse) => (
        <div className="flex items-center gap-1">
          <Users size={14} color="#FFFFFF60" />
          <span>{row.memberCount}</span>
        </div>
      ),
    },
    {
      key: 'sessionCount',
      header: 'Sessions',
      render: (row: AdminRoomResponse) => (
        <div className="flex items-center gap-1">
          <Gamepad2 size={14} color="#FFFFFF60" />
          <span>{row.sessionCount}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (row: AdminRoomResponse) => (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: row.isActive ? '#00D39720' : '#D5442F20',
            color: row.isActive ? '#00D397' : '#D5442F',
          }}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: AdminRoomResponse) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/rooms/${row.id}`);
            }}
            className="p-1.5 rounded-lg bg-[#3E3666] hover:bg-[#4E4676] text-white/70 hover:text-white transition-colors"
            title="Voir détail"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTransferRoom(row);
            }}
            className="p-1.5 rounded-lg bg-[#3E3666] hover:bg-[#4E4676] text-white/70 hover:text-white transition-colors"
            title="Transférer propriété"
          >
            <ArrowRightLeft size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="p-1.5 rounded-lg bg-[#D5442F20] hover:bg-[#D5442F30] text-[#D5442F] transition-colors"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#292349] flex flex-col">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666]">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">Salles</p>
            <p className="text-white/60 text-xs">
              {data?.totalElements ?? 0} salle{(data?.totalElements ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-[#00D397] text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {isLoading ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <DataTable
          columns={columns}
          data={rooms}
          keyExtractor={(row) => row.id}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          searchPlaceholder="Rechercher par nom ou code..."
          onSearch={setSearch}
          searchQuery={search}
          isLoading={isLoading}
        />
      </div>

      {/* Transfer modal */}
      {transferRoom && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="absolute inset-0" onClick={() => setTransferRoom(null)} />
          <div className="relative bg-[#342D5B] rounded-2xl border border-[#3E3666] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Transférer la salle</h3>
              <button onClick={() => setTransferRoom(null)} className="p-1 text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Salle : <span className="text-white font-medium">{transferRoom.name}</span>
            </p>
            <label className="text-white/60 text-sm block mb-2">Nouveau propriétaire (userId)</label>
            <input
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              placeholder="ID utilisateur..."
              className="w-full bg-[#292349] text-white px-4 py-3 rounded-xl border border-[#3E3666] focus:border-[#9B59B6] focus:outline-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setTransferRoom(null)}
                className="flex-1 py-3 rounded-xl bg-[#3E3666] text-white text-sm font-medium hover:bg-[#4E4676] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleTransfer}
                disabled={!newOwnerId.trim() || transferMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-[#9B59B6] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {transferMutation.isPending ? 'Transfert...' : 'Transférer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
