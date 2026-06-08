'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowLeft,
  Crown,
  User,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Trash2,
  Gamepad2,
  Trophy,
  Star,
  Target,
  Zap,
  Crosshair,
  Users,
  DoorOpen,
  Calendar,
  Mail,
  Clock,
  ShieldX,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from '~/components/ui/Avatar';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/Card';
import { KpiCard } from '~/components/admin/KpiCard';
import * as adminApi from '~/lib/api/admin';
import type { UserRole } from '~/types/api';

interface PageProps {
  params: Promise<{ userId: string }>;
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

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [roleOpen, setRoleOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['adminUserDetail', userId],
    queryFn: () => adminApi.getAdminUserDetail(userId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminUserDetail', userId] });
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  };

  const updateRoleMutation = useMutation({
    mutationFn: (role: UserRole) => adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      toast.success('Rôle mis à jour');
      invalidate();
      setRoleOpen(false);
    },
    onError: () => toast.error("Impossible de mettre à jour le rôle"),
  });

  const banMutation = useMutation({
    mutationFn: () => adminApi.banUser(userId, 'Banni par un administrateur'),
    onSuccess: () => {
      toast.success('Utilisateur banni');
      invalidate();
    },
    onError: () => toast.error("Impossible de bannir l'utilisateur"),
  });

  const unbanMutation = useMutation({
    mutationFn: () => adminApi.unbanUser(userId),
    onSuccess: () => {
      toast.success('Utilisateur débanni');
      invalidate();
    },
    onError: () => toast.error("Impossible de débannir l'utilisateur"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAdminUser(userId),
    onSuccess: () => {
      toast.success('Utilisateur supprimé');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      router.push('/admin/users');
    },
    onError: () => toast.error("Impossible de supprimer l'utilisateur"),
  });

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#9B59B6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = roleMeta[user.role] ?? roleMeta.USER;
  const RoleIcon = role.icon;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-txt-60 hover:text-txt transition-colors text-sm w-fit"
        >
          <ArrowLeft size={16} />
          Retour à la liste
        </button>
      </div>

      {/* Identity card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="relative shrink-0">
            <Avatar avatarUrl={user.avatarUrl} username={user.username} size={72} />
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface ${
                user.isOnline ? 'bg-[#00D397]' : 'bg-[#6B7280]'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-txt text-2xl font-bold">{user.username}</h1>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: role.bg, color: role.color }}
              >
                <RoleIcon size={12} color={role.color} />
                {role.label}
              </div>
              {user.banned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EF444420] text-[#EF4444]">
                  <Ban size={12} />
                  Banni
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-txt-60 mt-2">
              {user.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} />
                  {user.email}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                Inscrit le {formatDate(user.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                {user.isOnline ? (
                  <span className="text-[#00D397]">En ligne</span>
                ) : (
                  <>Dernière connexion : {formatDateTime(user.lastSeenAt)}</>
                )}
              </span>
              {user.bannedAt && (
                <span className="inline-flex items-center gap-1.5 text-[#EF4444]">
                  <Ban size={14} />
                  Banni le {formatDate(user.bannedAt)}
                  {user.bannedReason && ` — ${user.bannedReason}`}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setRoleOpen(!roleOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-2 text-txt text-sm transition-colors"
              >
                <ShieldCheck size={16} />
                Changer rôle
                <ChevronDown size={14} />
              </button>
              {roleOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-surface border border-line rounded-xl shadow-xl overflow-hidden">
                    {ALL_ROLES.map((r) => {
                      const m = roleMeta[r];
                      const Icon = m.icon;
                      return (
                        <button
                          key={r}
                          disabled={user.role === r || updateRoleMutation.isPending}
                          onClick={() => updateRoleMutation.mutate(r)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                            user.role === r
                              ? 'text-txt/30 cursor-default'
                              : 'text-txt hover:bg-surface-2'
                          }`}
                        >
                          <Icon size={14} color={user.role === r ? '#FFFFFF30' : m.color} />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {user.banned ? (
              <button
                onClick={() => unbanMutation.mutate()}
                disabled={unbanMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00D39720] hover:bg-[#00D39730] text-[#00D397] text-sm transition-colors"
              >
                <CheckCircle2 size={16} />
                Débannir
              </button>
            ) : (
              <button
                onClick={() => {
                  if (window.confirm(`Bannir ${user.username} ?`)) {
                    banMutation.mutate();
                  }
                }}
                disabled={banMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EF444420] hover:bg-[#EF444430] text-[#EF4444] text-sm transition-colors"
              >
                <ShieldX size={16} />
                Bannir
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm(`Supprimer ${user.username} ? Cette action est irréversible.`)) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EF444420] hover:bg-[#EF444430] text-[#EF4444] text-sm transition-colors"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Parties jouées"
          value={user.totalGames}
          icon={Gamepad2}
          iconColor="#9B59B6"
          iconBg="#9B59B620"
        />
        <KpiCard
          title="Victoires"
          value={user.totalWins}
          icon={Trophy}
          iconColor="#FFD700"
          iconBg="#FFD70020"
        />
        <KpiCard
          title="Score total"
          value={user.totalScore}
          icon={Star}
          iconColor="#3B82F6"
          iconBg="#3B82F620"
        />
        <KpiCard
          title="Score moyen"
          value={user.avgScore.toFixed(1)}
          icon={Target}
          iconColor="#00D397"
          iconBg="#00D39720"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Glicko Rating"
          value={user.glickoRating.toFixed(0)}
          icon={Zap}
          iconColor="#F59E0B"
          iconBg="#F59E0B20"
        />
        <KpiCard
          title="Glicko Déviation"
          value={user.glickoDeviation.toFixed(0)}
          icon={Crosshair}
          iconColor="#EC4899"
          iconBg="#EC489920"
        />
        <KpiCard
          title="Meilleur score"
          value={user.bestScore}
          icon={Star}
          iconColor="#8B5CF6"
          iconBg="#8B5CF620"
        />
        <KpiCard
          title="Winrate"
          value={`${(user.winRate * 100).toFixed(0)}%`}
          icon={Trophy}
          iconColor="#10B981"
          iconBg="#10B98120"
        />
      </div>

      {/* Glicko + Accuracy row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Précision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#9B59B6"
                    strokeWidth="10"
                    strokeDasharray={`${(user.globalAccuracyRate || 0) * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-txt text-2xl font-bold">
                    {((user.globalAccuracyRate || 0) * 100).toFixed(0)}%
                  </span>
                  <span className="text-txt-40 text-xs">précision globale</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-txt-60">Bonnes réponses</span>
                <span className="text-txt font-medium">{user.totalCorrectAnswers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-txt-60">Mauvais buzz</span>
                <span className="text-txt font-medium">{user.totalWrongBuzzes}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rating Glicko actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-[#F59E0B20] flex items-center justify-center shrink-0">
                <Zap size={40} color="#F59E0B" />
              </div>
              <div className="flex-1">
                <p className="text-txt text-4xl font-bold">{user.glickoRating.toFixed(0)}</p>
                <p className="text-txt-60 text-sm mt-1">
                  Déviation ±{user.glickoDeviation.toFixed(0)}
                </p>
                <div className="w-full h-2 bg-surface-2 rounded-full mt-3">
                  <div
                    className="h-full rounded-full bg-[#F59E0B]"
                    style={{
                      width: `${Math.min(100, Math.max(0, (user.glickoRating / 2500) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-txt/30 text-xs mt-1">0 — 2500</p>
              </div>
            </div>
            <p className="text-txt-40 text-sm mt-4">
              Le rating Glicko-2 estime le niveau de compétence du joueur. Une déviation faible
              indique une estimation fiable.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 size={18} color="#9B59B6" />
            Sessions récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.recentSessions.length === 0 ? (
            <p className="text-txt-60 text-sm text-center py-6">Aucune session récente</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className="px-3 py-2 text-xs font-semibold text-txt-60 uppercase tracking-wider">Code</th>
                    <th className="px-3 py-2 text-xs font-semibold text-txt-60 uppercase tracking-wider">Statut</th>
                    <th className="px-3 py-2 text-xs font-semibold text-txt-60 uppercase tracking-wider">Score</th>
                    <th className="px-3 py-2 text-xs font-semibold text-txt-60 uppercase tracking-wider">Rang</th>
                    <th className="px-3 py-2 text-xs font-semibold text-txt-60 uppercase tracking-wider">Joueurs</th>
                    <th className="px-3 py-2 text-xs font-semibold text-txt-60 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {user.recentSessions.map((s) => (
                    <tr key={s.sessionId} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-2.5 text-sm text-txt font-medium">#{s.code}</td>
                      <td className="px-3 py-2.5 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-txt-60">
                          <span className={`w-2 h-2 rounded-full ${
                            s.status === 'RESULTS' ? 'bg-[#00D397]' :
                            s.status === 'PLAYING' ? 'bg-[#3B82F6]' :
                            s.status === 'CANCELLED' ? 'bg-[#EF4444]' :
                            'bg-[#F59E0B]'
                          }`} />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-txt">{s.score ?? '—'}</td>
                      <td className="px-3 py-2.5 text-sm text-txt">{s.rank ? `${s.rank}/${s.totalPlayers}` : '—'}</td>
                      <td className="px-3 py-2.5 text-sm text-txt-60">{s.totalPlayers}</td>
                      <td className="px-3 py-2.5 text-sm text-txt-60">{formatDate(s.endedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Friends & Rooms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} color="#3B82F6" />
              Amis ({user.friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.friends.length === 0 ? (
              <p className="text-txt-60 text-sm text-center py-6">Aucun ami</p>
            ) : (
              <div className="space-y-3">
                {user.friends.map((f) => (
                  <div
                    key={f.userId}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/users/${f.userId}`)}
                  >
                    <Avatar avatarUrl={f.avatarUrl} username={f.username} size={36} />
                    <span className="text-txt text-sm font-medium">{f.username}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen size={18} color="#00D397" />
              Salles ({user.rooms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.rooms.length === 0 ? (
              <p className="text-txt-60 text-sm text-center py-6">Aucune salle</p>
            ) : (
              <div className="space-y-3">
                {user.rooms.map((r) => (
                  <div
                    key={r.roomId}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg hover:bg-surface-2 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/rooms/${r.roomId}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-txt text-sm font-medium truncate">{r.name}</p>
                      <p className="text-txt-40 text-xs">Code : {r.code}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.isOwner && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFD70020] text-[#FFD700] text-xs font-medium">
                          Propriétaire
                        </span>
                      )}
                      <span className="text-txt/30 text-xs">{formatDate(r.joinedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

