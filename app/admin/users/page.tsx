'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Shield, Crown, User } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as adminApi from '~/lib/api/admin';
import type { UserResponse } from '~/types/api';

const ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const;
type UserRole = (typeof ROLES)[number];

const roleColors: Record<UserRole, string> = {
  USER:       '#00D397',
  ADMIN:      '#9B59B6',
  SUPER_ADMIN:'#FFD700',
};

const roleIcons: Record<UserRole, React.ComponentType<{ size: number; color: string }>> = {
  USER:       User,
  ADMIN:      Shield,
  SUPER_ADMIN:Crown,
};

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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment changer le rôle de cet utilisateur en ${newRole} ?`
    );
    if (!confirmed) return;
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      window.alert('Impossible de changer le rôle');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${username} ? Cette action est irréversible.`
    );
    if (!confirmed) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      window.alert("Impossible de supprimer l'utilisateur");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <p className="text-white/60 text-xs">{users.length} utilisateurs</p>
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
        </div>
      </div>

      {/* Users list */}
      <div
        className="flex-1 overflow-y-auto px-4"
        onScroll={handleScroll}
      >
        {filteredUsers.map((user) => {
          const RoleIcon = roleIcons[user.role as UserRole] || User;
          const roleColor = roleColors[user.role as UserRole] || '#FFFFFF';

          return (
            <Card key={user.id} className="mb-3">
              <div className="flex items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${roleColor}20` }}
                >
                  <RoleIcon size={18} color={roleColor} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{user.username}</p>
                  <p className="text-white/50 text-sm">{user.email || "Pas d'email"}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="px-3 py-1.5 rounded-lg bg-[#3E3666] hover:bg-[#4A4080] transition-colors"
                >
                  <span style={{ color: roleColor }} className="text-sm font-medium">
                    {user.role}
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

        <div className="h-8" />
      </div>

      {/* Role Selection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedUser(null)}
          />
          <div className="relative bg-[#292349] rounded-t-3xl p-6 w-full max-w-2xl">
            <p className="text-white font-bold text-xl mb-2">{selectedUser.username}</p>
            <p className="text-white/60 mb-6">Changer le rôle</p>

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
                  className={`flex items-center w-full py-4 border-b border-[#3E3666] last:border-b-0 transition-colors ${
                    isSelected ? 'bg-[#00D39720]' : 'hover:bg-white/5'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${roleColors[role]}20` }}
                  >
                    <RoleIcon size={18} color={roleColors[role]} />
                  </div>
                  <span className={`flex-1 text-left ${isSelected ? 'text-[#00D397] font-bold' : 'text-white'}`}>
                    {role.replace('_', ' ')}
                  </span>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#00D397]" />}
                </button>
              );
            })}

            <button
              onClick={() => {
                handleDeleteUser(selectedUser.id, selectedUser.username);
                setSelectedUser(null);
              }}
              className="mt-6 w-full py-4 rounded-xl bg-[#D5442F20] hover:bg-[#D5442F30] transition-colors"
            >
              <span className="text-[#D5442F] font-bold">Supprimer l'utilisateur</span>
            </button>

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-3 w-full py-4 rounded-xl bg-[#3E3666] hover:bg-[#4A4080] transition-colors"
            >
              <span className="text-white">Annuler</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
