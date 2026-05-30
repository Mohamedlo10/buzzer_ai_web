'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Users,
  Crown,
  User,
  ShieldCheck,
  ShieldX,
  Trash2,
  Eye,
  ChevronDown,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { DataTable, type Column } from '~/components/admin/DataTable';
import { Avatar } from '~/components/ui/Avatar';
import * as adminApi from '~/lib/api/admin';
import type { UserRole } from '~/types/api';

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isOnline: boolean;
  banned: boolean;
  createdAt: string;
}

const ALL_ROLES: UserRole[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];

const roleMeta: Record<
  UserRole,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; color: string }> }
> = {
  USER:        { label: 'User',        color: '#00D397', bg: '#00D39720', icon: User },
  ADMIN:       { label: 'Admin',       color: '#3B82F6', bg: '#3B82F620', icon: ShieldCheck },
  SUPER_ADMIN: { label: 'Super Admin', color: '#FFD700', bg: '#FFD70020', icon: Crown },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 15;
  const [roleOpenId, setRoleOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, page, size],
    queryFn: () =>
      adminApi.getAdminUsers({ search: search || undefined, page, size }),
    placeholderData: (previousData) => previousData,
  });

  const users: AdminUser[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  }, [queryClient]);

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      toast.success('Rôle mis à jour');
      invalidateUsers();
    },
    onError: () => {
      toast.error("Impossible de mettre à jour le rôle");
    },
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => adminApi.banUser(userId, 'Banni par un administrateur'),
    onSuccess: () => {
      toast.success('Utilisateur banni');
      invalidateUsers();
    },
    onError: () => {
      toast.error("Impossible de bannir l'utilisateur");
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: () => {
      toast.success('Utilisateur débanni');
      invalidateUsers();
    },
    onError: () => {
      toast.error("Impossible de débannir l'utilisateur");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteAdminUser(userId),
    onSuccess: () => {
      toast.success('Utilisateur supprimé');
      invalidateUsers();
    },
    onError: () => {
      toast.error("Impossible de supprimer l'utilisateur");
    },
  });

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(0);
  };

  const handleDelete = (user: AdminUser) => {
    if (window.confirm(`Supprimer ${user.username} ? Cette action est irréversible.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'username',
      header: 'Utilisateur',
      width: '240px',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar avatarUrl={row.avatarUrl} username={row.username} size={36} />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#342D5B] ${
                row.isOnline ? 'bg-[#00D397]' : 'bg-[#6B7280]'
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{row.username}</p>
            <p className="text-white/40 text-xs truncate">{row.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-white/70 text-sm">{row.email ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'Rôle',
      width: '140px',
      render: (row) => {
        const meta = roleMeta[row.role] ?? roleMeta.USER;
        const Icon = meta.icon;
        return (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            <Icon size={12} color={meta.color} />
            {meta.label}
          </div>
        );
      },
    },
    {
      key: 'isOnline',
      header: 'Statut',
      width: '110px',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            row.isOnline ? 'text-[#00D397]' : 'text-white/40'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${row.isOnline ? 'bg-[#00D397]' : 'bg-white/30'}`} />
          {row.isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      ),
    },
    {
      key: 'banned',
      header: 'Banni',
      width: '90px',
      render: (row) =>
        row.banned ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#EF4444]">
            <Ban size={12} />
            Oui
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-white/40">
            <CheckCircle2 size={12} />
            Non
          </span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Inscription',
      width: '120px',
      render: (row) => <span className="text-white/60 text-sm">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/admin/users/${row.id}`)}
            className="p-1.5 rounded-lg bg-[#3E3666] hover:bg-[#4E4676] text-white/70 hover:text-white transition-colors"
            title="Voir le détail"
          >
            <Eye size={14} />
          </button>

          <div className="relative">
            <button
              onClick={() => setRoleOpenId(roleOpenId === row.id ? null : row.id)}
              className="p-1.5 rounded-lg bg-[#3E3666] hover:bg-[#4E4676] text-white/70 hover:text-white transition-colors flex items-center gap-1"
              title="Changer le rôle"
            >
              <ShieldCheck size={14} />
              <ChevronDown size={12} />
            </button>
            {roleOpenId === row.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setRoleOpenId(null)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-[#342D5B] border border-[#3E3666] rounded-xl shadow-xl overflow-hidden">
                  {ALL_ROLES.map((r) => {
                    const m = roleMeta[r];
                    const Icon = m.icon;
                    return (
                      <button
                        key={r}
                        disabled={row.role === r || updateRoleMutation.isPending}
                        onClick={() => {
                          updateRoleMutation.mutate({ userId: row.id, role: r });
                          setRoleOpenId(null);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                          row.role === r
                            ? 'text-white/30 cursor-default'
                            : 'text-white hover:bg-[#3E3666]'
                        }`}
                      >
                        <Icon size={14} color={row.role === r ? '#FFFFFF30' : m.color} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {row.banned ? (
            <button
              onClick={() => unbanMutation.mutate(row.id)}
              disabled={unbanMutation.isPending}
              className="p-1.5 rounded-lg bg-[#00D39720] hover:bg-[#00D39730] text-[#00D397] transition-colors"
              title="Débannir"
            >
              <CheckCircle2 size={14} />
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm(`Bannir ${row.username} ?`)) {
                  banMutation.mutate(row.id);
                }
              }}
              disabled={banMutation.isPending}
              className="p-1.5 rounded-lg bg-[#EF444420] hover:bg-[#EF444430] text-[#EF4444] transition-colors"
              title="Bannir"
            >
              <ShieldX size={14} />
            </button>
          )}

          <button
            onClick={() => handleDelete(row)}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded-lg bg-[#EF444420] hover:bg-[#EF444430] text-[#EF4444] transition-colors"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            <Users size={24} color="#9B59B6" />
            Utilisateurs
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {data?.totalElements ?? 0} utilisateur{data?.totalElements !== 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(row) => row.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchPlaceholder="Rechercher par nom ou email..."
        onSearch={handleSearch}
        searchQuery={search}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
      />
    </div>
  );
}
