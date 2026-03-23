'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Shield, Crown, User, Trash2, X } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { Avatar } from '~/components/ui/Avatar';
import * as adminApi from '~/lib/api/admin';
import type { UserResponse, UserRole } from '~/types/api';

const ROLES = ['USER', 'SUPER_ADMIN'] as const;
type AdminRole = (typeof ROLES)[number];

const roleColors: Record<AdminRole, string> = {
  USER:        '#00D397',
  SUPER_ADMIN: '#FFD700',
};

const roleIcons: Record<AdminRole, React.ComponentType<{ size: number; color: string }>> = {
  USER:        User,
  SUPER_ADMIN: Crown,
};

function formatLastSeen(iso: string | null): string {
  if (!iso) return 'Jamais connecté';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  if (h < 24) return `Il y a ${h}h`;
  if (d < 30) return `Il y a ${d}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const loadUsers = async (pageNum = 0, append = false) => {
    try {
      const response = await adminApi.getAllUsers(pageNum, 20);
      if (append) {
        setUsers((prev) => [...prev, ...response.content]);
      } else {
        setUsers(response.content);
      }
      setHasMore(!response.last);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    await loadUsers(0, false);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadUsers(nextPage, true);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      handleLoadMore();
    }
  };

  const handleRoleChange = async (userId: string, newRole: AdminRole) => {
    const confirmed = window.confirm(`Changer le rôle en ${newRole} ?`);
    if (!confirmed) return;
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as UserRole } : u))
      );
    } catch {
      window.alert('Impossible de changer le rôle');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmed = window.confirm(
      `Supprimer ${username} ? Cette action est irréversible.`
    );
    if (!confirmed) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUser(null);
    } catch {
      window.alert("Impossible de supprimer l'utilisateur");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement des utilisateurs..." />
      </div>
    );
  }

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
            <p className="text-white font-bold text-xl">Utilisateurs</p>
            <p className="text-white/60 text-xs">{filteredUsers.length} / {users.length} utilisateur{users.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-[#00D397] text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center bg-[#342D5B] rounded-xl px-4 gap-3">
          <Search size={18} color="#FFFFFF60" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="flex-1 text-white py-3 bg-transparent outline-none placeholder-white/25"
          />
          {searchQuery.length > 0 && (
            <button onClick={() => setSearchQuery('')}>
              <X size={16} color="#FFFFFF60" />
            </button>
          )}
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto px-4" onScroll={handleScroll}>
        {filteredUsers.map((user) => {
          const role = (ROLES.includes(user.role as AdminRole) ? user.role : 'USER') as AdminRole;
          const roleColor = roleColors[role];
          const RoleIcon = roleIcons[role];

          return (
            <Card key={user.id} className="mb-3">
              <div className="flex items-center gap-3">
                {/* Avatar with online dot */}
                <div className="relative shrink-0">
                  <Avatar avatarUrl={user.avatarUrl} username={user.username} size={48} />
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#342D5B] ${
                      user.isOnline ? 'bg-[#00D397]' : 'bg-[#6B7280]'
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold truncate">{user.username}</p>
                    {user.role === 'SUPER_ADMIN' && (
                      <Crown size={12} color="#FFD700" />
                    )}
                  </div>
                  <p className="text-white/40 text-xs truncate">
                    {user.isOnline ? (
                      <span className="text-[#00D397]">En ligne</span>
                    ) : (
                      formatLastSeen(user.lastSeenAt)
                    )}
                  </p>
                  <p className="text-white/30 text-xs">Inscrit le {formatDate(user.createdAt)}</p>
                </div>

                {/* Role badge */}
                <button
                  onClick={() => setSelectedUser(user)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
                  style={{ backgroundColor: `${roleColor}20` }}
                >
                  <RoleIcon size={12} color={roleColor} />
                  <span className="text-xs font-semibold" style={{ color: roleColor }}>
                    {role === 'SUPER_ADMIN' ? 'Admin' : 'User'}
                  </span>
                </button>
              </div>
            </Card>
          );
        })}

        {filteredUsers.length === 0 && (
          <Card className="flex items-center justify-center py-12">
            <p className="text-white/50">Aucun utilisateur trouvé</p>
          </Card>
        )}

        {hasMore && !searchQuery && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 text-[#00D397] text-sm font-medium hover:opacity-80 transition-opacity mb-4"
          >
            Charger plus
          </button>
        )}
        <div className="h-8" />
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-0" onClick={() => setSelectedUser(null)} />
          <div className="relative bg-[#292349] rounded-t-3xl p-6 w-full max-w-2xl">
            {/* User header */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar avatarUrl={selectedUser.avatarUrl} username={selectedUser.username} size={56} />
              <div className="flex-1">
                <p className="text-white font-bold text-xl">{selectedUser.username}</p>
                {selectedUser.email && (
                  <p className="text-white/50 text-sm">{selectedUser.email}</p>
                )}
                <p className="text-white/30 text-xs mt-0.5">
                  {selectedUser.isOnline ? (
                    <span className="text-[#00D397]">● En ligne</span>
                  ) : (
                    `Dernière connexion : ${formatLastSeen(selectedUser.lastSeenAt)}`
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-9 h-9 rounded-full bg-[#342D5B] flex items-center justify-center"
              >
                <X size={16} color="#FFFFFF80" />
              </button>
            </div>

            {/* Info grid */}
            <div className="bg-[#342D5B] rounded-2xl p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Rôle actuel</span>
                <span className="text-white text-sm font-medium">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Avatar</span>
                <span className="text-white text-sm">{selectedUser.avatarStyle ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Inscrit le</span>
                <span className="text-white text-sm">{formatDate(selectedUser.createdAt)}</span>
              </div>
            </div>

            {/* Change role */}
            <p className="text-white/60 text-xs uppercase tracking-wider mb-2 ml-1">Changer le rôle</p>
            {ROLES.map((role) => {
              const RoleIcon = roleIcons[role];
              const isSelected = selectedUser.role === role;
              return (
                <button
                  key={role}
                  onClick={() => {
                    handleRoleChange(selectedUser.id, role);
                    setSelectedUser(null);
                  }}
                  className={`flex items-center w-full py-3.5 px-1 border-b border-[#3E3666] last:border-b-0 transition-colors ${
                    isSelected ? 'opacity-50 cursor-default' : 'hover:bg-white/5'
                  }`}
                  disabled={isSelected}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${roleColors[role]}20` }}
                  >
                    <RoleIcon size={16} color={roleColors[role]} />
                  </div>
                  <span className={`flex-1 text-left ${isSelected ? 'text-[#00D397] font-bold' : 'text-white'}`}>
                    {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Utilisateur'}
                  </span>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#00D397]" />}
                </button>
              );
            })}

            {/* Delete */}
            <button
              onClick={() => handleDeleteUser(selectedUser.id, selectedUser.username)}
              className="mt-5 w-full py-4 rounded-xl bg-[#D5442F15] hover:bg-[#D5442F25] transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} color="#D5442F" />
              <span className="text-[#D5442F] font-bold">Supprimer l'utilisateur</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
