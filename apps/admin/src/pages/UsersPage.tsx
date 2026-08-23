import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
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

import { DataTable, type Column } from '../components/admin/DataTable';
import { Avatar } from '../components/ui/Avatar';
import { adminApi, confirmAsync, type UserRole } from '@xalaat/core';

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
  USER: { label: 'User', color: 'var(--primary)', bg: 'rgba(224, 86, 36, 0.125)', icon: User },
  ADMIN: { label: 'Admin', color: 'var(--indigo)', bg: 'rgba(78, 140, 255, 0.125)', icon: ShieldCheck },
  SUPER_ADMIN: { label: 'Super Admin', color: 'var(--gold)', bg: 'rgba(217, 119, 6, 0.125)', icon: Crown },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 15;
  const [roleOpenId, setRoleOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, page, size],
    queryFn: () => adminApi.getAdminUsers({ search: search || undefined, page, size }),
  });

  const users: AdminUser[] = (data?.content as any) ?? [];
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
      toast.error('Impossible de mettre à jour le rôle');
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

  const handleDelete = async (user: AdminUser) => {
    const confirmed = await confirmAsync({
      title: 'Supprimer ce compte ?',
      message: `${user.username} sera définitivement supprimé. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;
    deleteMutation.mutate(user.id);
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      header: 'Utilisateur',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar url={u.avatarUrl} username={u.username} size={36} />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                u.isOnline ? 'bg-accent' : 'bg-txt-40'
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-txt font-semibold text-sm truncate">{u.username}</p>
            {u.email && <p className="text-txt-60 text-xs truncate">{u.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (u) => {
        const meta = roleMeta[u.role] ?? roleMeta.USER;
        const Icon = meta.icon;
        const isOpen = roleOpenId === u.id;

        return (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setRoleOpenId(isOpen ? null : u.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 cursor-pointer"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              <Icon size={12} color={meta.color} />
              <span>{meta.label}</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>

            {isOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setRoleOpenId(null)} />
                <div className="absolute left-0 mt-1.5 w-36 rounded-xl bg-surface border border-line shadow-lg z-30 overflow-hidden">
                  {ALL_ROLES.map((r) => {
                    const rMeta = roleMeta[r];
                    const RIcon = rMeta.icon;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          setRoleOpenId(null);
                          if (r !== u.role) {
                            updateRoleMutation.mutate({ userId: u.id, role: r });
                          }
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-surface-2 transition-colors cursor-pointer ${
                          r === u.role ? 'text-txt font-bold' : 'text-txt-60'
                        }`}
                      >
                        <RIcon size={13} color={rMeta.color} />
                        <span>{rMeta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (u) =>
        u.banned ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-buzz">
            <ShieldX size={13} /> Banni
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
            <CheckCircle2 size={13} /> Actif
          </span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Inscrit le',
      render: (u) => <span className="text-txt-60 text-xs">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/users/${u.id}`)}
            className="p-1.5 rounded-lg text-txt-60 hover:text-txt hover:bg-surface-2 transition-colors cursor-pointer"
            title="Voir le profil"
          >
            <Eye size={15} />
          </button>

          {u.banned ? (
            <button
              onClick={() => unbanMutation.mutate(u.id)}
              className="p-1.5 rounded-lg text-accent hover:bg-accent/15 transition-colors cursor-pointer"
              title="Débannir"
            >
              <CheckCircle2 size={15} />
            </button>
          ) : (
            <button
              onClick={() => banMutation.mutate(u.id)}
              className="p-1.5 rounded-lg text-txt-40 hover:text-buzz hover:bg-buzz/15 transition-colors cursor-pointer"
              title="Bannir"
            >
              <Ban size={15} />
            </button>
          )}

          <button
            onClick={() => handleDelete(u)}
            className="p-1.5 rounded-lg text-txt-40 hover:text-buzz hover:bg-buzz/15 transition-colors cursor-pointer"
            title="Supprimer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-txt text-2xl font-bold font-display">Utilisateurs</h1>
          <p className="text-txt-60 text-sm">Gestion des comptes et des permissions</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchPlaceholder="Rechercher un pseudo, un email…"
        searchQuery={search}
        onSearch={handleSearch}
        isLoading={isLoading}
        onRowClick={(u) => navigate(`/users/${u.id}`)}
      />
    </div>
  );
}
