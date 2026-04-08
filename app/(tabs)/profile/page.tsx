'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  User,
  Mail,
  Shield,
  Crown,
  Calendar,
  AlertCircle,
  X,
  Edit3,
  Lock,
  Trophy,
  Gamepad2,
  Target,
  Award,
  ChevronRight,
  BarChart3,
  Star,
} from 'lucide-react';
import { useAuthStore } from '~/stores/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '~/lib/api/users';
import * as rankingsApi from '~/lib/api/rankings';
import * as dashboardApi from '~/lib/api/dashboard';
import type { CategoryRankingResponse } from '~/types/api';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';

// Role configuration
const ROLE_CONFIG = {
  USER: {
    color: '#3B82F6',
    bgColor: '#3B82F620',
    icon: User,
    label: 'Joueur',
  },
  ADMIN: {
    color: '#8B5CF6',
    bgColor: '#8B5CF620',
    icon: Shield,
    label: 'Admin',
  },
  SUPER_ADMIN: {
    color: '#F59E0B',
    bgColor: '#F59E0B20',
    icon: Crown,
    label: 'Super Admin',
  },
};

// ──────────────────────────────────────────────
// Modal overlay helper
// ──────────────────────────────────────────────
function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
      onClick={onClose}
    >
      <div
        className="bg-[#342D5B] rounded-3xl w-full max-w-sm border border-[#3E3666] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Profile Page
// ──────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  // Modals state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryRankingsData, setCategoryRankingsData] = useState<CategoryRankingResponse | null>(null);
  const [isCategoryFetching, setIsCategoryFetching] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Queries
  const { data: myRank, isLoading: isRankLoading, refetch: refetchRank } = useQuery({
    queryKey: ['myGlobalRank'],
    queryFn: rankingsApi.getMyGlobalRank,
    enabled: !!user,
  });

  const { data: dashboard, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getDashboard,
    enabled: !!user,
  });

  // Mutations
  const changePasswordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
  });

  const onRefresh = useCallback(() => {
    refetchRank();
    refetchDashboard();
  }, [refetchRank, refetchDashboard]);

  async function handleOpenCategoryRankings(sessionId: string) {
    setShowCategoryModal(true);
    setIsCategoryFetching(true);
    try {
      const data = await rankingsApi.getCategoryRankings(sessionId);
      setCategoryRankingsData(data);
    } catch (err) {
      console.error('Failed to load category rankings:', err);
      setCategoryRankingsData(null);
    } finally {
      setIsCategoryFetching(false);
    }
  }

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setCategoryRankingsData(null);
  }

  async function handleLogout() {
    setShowLogoutModal(false);
    try {
      await logout();
      router.replace('/login');
    } catch {
      // handle error silently
    }
  }

  function handleChangePassword() {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    changePasswordMutation.mutate({ currentPassword, newPassword });
  }

  if (!user) {
    return (
      <SafeScreen>
        <div className="flex-1 flex justify-center items-center min-h-screen">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        </div>
      </SafeScreen>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.USER;
  const RoleIcon = roleConfig.icon;

  const totalGames = myRank?.totalGames || 0;
  const totalScore = myRank?.totalScore || 0;
  const rank = myRank?.rank || 0;
  const totalWins = myRank?.totalWins ?? null;
  const perfIndex = myRank?.performanceIndex ?? null;
  const accuracy = myRank?.globalAccuracyRate != null
    ? Math.round(myRank.globalAccuracyRate * 100)
    : null;
  const correctAnswers = myRank?.totalCorrectAnswers ?? null;
  const questionsPlayed = myRank?.totalQuestionsPlayed ?? null;
  const winRatePct = myRank?.winRate != null ? Math.round(myRank.winRate) : null;

  return (
    <SafeScreen>
      <div className="overflow-y-auto pb-10">
        {/* Header Section */}
        <div className="flex flex-col items-center pt-20 pb-6 px-6">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
                >
                  <span className="text-white text-5xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {/* Edit button on avatar */}
            <button
              onClick={() => (() => {
                const match = user?.avatarUrl?.match(/dicebear\.com\/[\d.x]+\/([^/]+)\/svg\?seed=([^&]+)/);
                const style = match?.[1] ?? user?.avatarStyle ?? 'adventurer';
                const seed  = match?.[2] ?? user?.avatarSeed  ?? 'Felix';
                router.push(`/profile/edit?style=${encodeURIComponent(style)}&seed=${encodeURIComponent(seed)}`);
              })()}
              className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Edit3 size={18} color="#3B82F6" />
            </button>
          </div>

          {/* Username */}
          <p className="text-white text-3xl font-bold mb-2">{user.username}</p>

          {/* Role Badge */}
          <div
            className="px-4 py-2 rounded-full flex flex-row items-center gap-2"
            style={{ backgroundColor: roleConfig.bgColor }}
          >
            <RoleIcon size={16} color={roleConfig.color} />
            <span className="font-semibold text-sm" style={{ color: roleConfig.color }}>
              {roleConfig.label}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 mb-6">
          <div className="flex flex-row flex-wrap gap-3">
            {/* Rank */}
            <div className="flex-1 min-w-[45%] bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
              <div className="flex flex-row items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Trophy size={20} color="#F59E0B" />
                </div>
                {isRankLoading ? (
                  <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-yellow-500 text-2xl font-bold">
                    #{rank > 0 ? rank : '-'}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm">Rang Global</p>
            </div>

            {/* Performance Index */}
            <div className="flex-1 min-w-[45%] bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
              <div className="flex flex-row items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#9B59B620] flex items-center justify-center">
                  <BarChart3 size={20} color="#9B59B6" />
                </div>
                {isRankLoading ? (
                  <div className="w-5 h-5 border-2 border-[#9B59B6] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-[#9B59B6] text-2xl font-bold">
                    {perfIndex != null ? perfIndex.toFixed(1) : '-'}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm">Indice de perf.</p>
              {perfIndex != null && (
                <div className="mt-2 h-1.5 bg-[#292349] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#9B59B6]"
                    style={{ width: `${Math.min(100, Math.max(0, perfIndex))}%` }}
                  />
                </div>
              )}
            </div>

            {/* Games Played */}
            <div className="flex-1 min-w-[45%] bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
              <div className="flex flex-row items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Gamepad2 size={20} color="#10B981" />
                </div>
                <span className="text-green-500 text-2xl font-bold">{totalGames}</span>
              </div>
              <p className="text-white/60 text-sm">Parties</p>
            </div>

            {/* Wins */}
            <div className="flex-1 min-w-[45%] bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
              <div className="flex flex-row items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Award size={20} color="#F59E0B" />
                </div>
                <span className="text-yellow-500 text-2xl font-bold">
                  {totalWins != null ? totalWins : '-'}
                </span>
              </div>
              <p className="text-white/60 text-sm">Victoires</p>
              {winRatePct != null && (
                <p className="text-white/40 text-xs mt-0.5">{winRatePct}% taux</p>
              )}
            </div>
          </div>
        </div>

        {/* Accuracy / Questions card */}
        <div className="px-4 mb-6">
          <div className="bg-[#342D5B] rounded-2xl p-5 border border-[#3E3666]">
            <div className="flex flex-row items-center justify-between mb-3">
              <div className="flex flex-row items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Target size={24} color="#06B6D4" />
                </div>
                <div>
                  <p className="text-white text-xl font-bold">
                    {accuracy != null ? `${accuracy}%` : '-'}
                  </p>
                  <p className="text-white/60 text-sm">Précision de buzz</p>
                </div>
              </div>
              {correctAnswers != null && questionsPlayed != null && (
                <div className="flex flex-row items-center gap-1 text-right">
                  <Star size={14} color="#FFFFFF40" />
                  <span className="text-white/50 text-sm">{correctAnswers}/{questionsPlayed}</span>
                </div>
              )}
            </div>
            {accuracy != null && (
              <div className="h-2 bg-[#292349] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            )}
            {/* Score brut en secondaire */}
            <p className="text-white/30 text-xs mt-3">
              Score brut (informatif) : {totalScore.toLocaleString()} pts
            </p>
          </div>
        </div>

        {/* Account Section */}
        <div className="px-4 mb-6">
          <p className="text-white/60 text-sm font-semibold mb-3 px-1">COMPTE</p>

          {/* Profile Info Card */}
          <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden mb-4">
            {/* Email */}
            <div className="flex flex-row items-center p-4 border-b border-[#3E3666]">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4 shrink-0">
                <Mail size={20} color="#3B82F6" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-xs mb-1">Email</p>
                <p className="text-white text-base font-medium">{user.email || 'Non défini'}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex flex-row items-center p-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mr-4 shrink-0">
                <Calendar size={20} color="#F97316" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-xs mb-1">Membre depuis</p>
                <p className="text-white text-base font-medium">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => (() => {
                const match = user?.avatarUrl?.match(/dicebear\.com\/[\d.x]+\/([^/]+)\/svg\?seed=([^&]+)/);
                const style = match?.[1] ?? user?.avatarStyle ?? 'adventurer';
                const seed  = match?.[2] ?? user?.avatarSeed  ?? 'Felix';
                router.push(`/profile/edit?style=${encodeURIComponent(style)}&seed=${encodeURIComponent(seed)}`);
              })()}
            className="w-full bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666] flex flex-row items-center justify-between mb-3 hover:opacity-80 active:opacity-70 transition-opacity cursor-pointer"
          >
            <div className="flex flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Edit3 size={20} color="#6366F1" />
              </div>
              <p className="text-white text-base font-medium">Modifier le profil</p>
            </div>
            <ChevronRight size={20} color="#6B7280" />
          </button>

          {/* Change Password Button */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666] flex flex-row items-center justify-between mb-3 hover:opacity-80 active:opacity-70 transition-opacity cursor-pointer"
          >
            <div className="flex flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Lock size={20} color="#10B981" />
              </div>
              <p className="text-white text-base font-medium">Changer le mot de passe</p>
            </div>
            <ChevronRight size={20} color="#6B7280" />
          </button>
        </div>

        {/* Sessions récentes */}
        {dashboard && dashboard.recentSessions && dashboard.recentSessions.length > 0 && (
          <div className="px-4 mb-6">
            <p className="text-white/60 text-sm font-semibold mb-3 px-1">SESSIONS RÉCENTES</p>
            <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
              {dashboard.recentSessions.map((session, index) => (
                <button
                  key={session.sessionId}
                  onClick={() => handleOpenCategoryRankings(session.sessionId)}
                  className={`w-full flex flex-row items-center p-4 hover:opacity-80 transition-opacity cursor-pointer text-left ${
                    index < dashboard.recentSessions.length - 1 ? 'border-b border-[#3E3666]' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mr-4 shrink-0">
                    <Trophy size={20} color="#8B5CF6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-base font-medium">
                      Session #{session.code}
                    </p>
                    <p className="text-white/60 text-sm">
                      {new Date(session.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      • {session.playerCount} joueurs
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-yellow-500 text-sm font-semibold">{session.winnerName}</span>
                    <span className="text-white/40 text-xs">{session.winnerScore} pts</span>
                  </div>
                  <ChevronRight size={16} color="#6B7280" className="ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Refresh button */}
        <div className="px-4 mb-4">
          <button
            onClick={onRefresh}
            disabled={isRankLoading || isDashboardLoading}
            className="w-full bg-[#342D5B] rounded-2xl p-3 border border-[#3E3666] flex items-center justify-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="text-white/60 text-sm">
              {isRankLoading || isDashboardLoading ? 'Actualisation...' : 'Actualiser'}
            </span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="px-4">
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isAuthLoading}
            className="w-full bg-[#342D5B] rounded-2xl p-4 border border-red-500/30 flex flex-row items-center justify-center gap-3 hover:opacity-80 active:opacity-70 transition-opacity cursor-pointer"
          >
            <LogOut size={20} color="#EF4444" />
            <span className="text-red-500 text-base font-semibold">Se déconnecter</span>
          </button>

          <p className="text-white/30 text-xs text-center mt-6">Quiz By Mouha_Dev v1.0.0</p>
        </div>
      </div>

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <ModalOverlay onClose={() => setShowPasswordModal(false)}>
          <div className="bg-[#292349] px-6 py-5 border-b border-[#3E3666]">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Lock size={24} color="#10B981" />
                </div>
                <p className="text-white text-xl font-bold">Mot de passe</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center hover:opacity-80 cursor-pointer"
              >
                <X size={20} color="#6B7280" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6 flex flex-col gap-4">
            <div>
              <p className="text-white/60 text-sm mb-2">Mot de passe actuel</p>
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#292349] text-white px-4 py-3 rounded-xl border border-[#3E3666] focus:border-[#10B981] focus:outline-none"
              />
            </div>
            <div>
              <p className="text-white/60 text-sm mb-2">Nouveau mot de passe</p>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#292349] text-white px-4 py-3 rounded-xl border border-[#3E3666] focus:border-[#10B981] focus:outline-none"
              />
            </div>
            <div>
              <p className="text-white/60 text-sm mb-2">Confirmer le mot de passe</p>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className={`w-full bg-[#292349] text-white px-4 py-3 rounded-xl border focus:outline-none ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-500'
                    : 'border-[#3E3666] focus:border-[#10B981]'
                }`}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-3">
            <button
              onClick={handleChangePassword}
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                newPassword !== confirmPassword
              }
              className="w-full rounded-2xl py-4 flex items-center justify-center transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'linear-gradient(to right, #10B981, #059669)' }}
            >
              {changePasswordMutation.isPending ? (
                <Spinner />
              ) : (
                <span className="text-white text-base font-bold">Changer le mot de passe</span>
              )}
            </button>
            <button
              onClick={() => setShowPasswordModal(false)}
              disabled={changePasswordMutation.isPending}
              className="w-full rounded-2xl bg-[#3E3666] px-6 py-4 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="text-white text-base font-semibold text-center block">Annuler</span>
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Category Rankings Modal ── */}
      {showCategoryModal && (
        <ModalOverlay onClose={closeCategoryModal}>
          <div className="bg-[#292349] px-6 py-5 border-b border-[#3E3666]">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 size={24} color="#8B5CF6" />
                </div>
                <p className="text-white text-xl font-bold">Par catégorie</p>
              </div>
              <button
                onClick={closeCategoryModal}
                className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center hover:opacity-80 cursor-pointer"
              >
                <X size={20} color="#6B7280" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {isCategoryFetching ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                <p className="text-white/50 text-sm mt-3">Chargement...</p>
              </div>
            ) : categoryRankingsData && categoryRankingsData.categories.length > 0 ? (
              categoryRankingsData.categories.map((cat) => (
                <div key={cat.name} className="mb-5">
                  <p className="text-white font-bold text-base mb-2">{cat.name}</p>
                  {cat.rankings.map((entry, idx) => (
                    <div
                      key={entry.userId}
                      className={`flex flex-row items-center py-2 ${
                        idx < cat.rankings.length - 1 ? 'border-b border-[#3E3666]' : ''
                      }`}
                    >
                      <span
                        className={`w-7 font-bold ${
                          idx === 0
                            ? 'text-[#FFD700]'
                            : idx === 1
                            ? 'text-[#C0C0C0]'
                            : idx === 2
                            ? 'text-[#CD7F32]'
                            : 'text-white/60'
                        }`}
                      >
                        {entry.rank}.
                      </span>
                      <span
                        className={`flex-1 ${
                          entry.userId === user.id ? 'text-blue-400 font-semibold' : 'text-white'
                        }`}
                      >
                        {entry.username}
                        {entry.userId === user.id && ' (Vous)'}
                      </span>
                      <span className="text-white font-medium">{entry.score} pts</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8">
                <Trophy size={40} color="#FFFFFF30" />
                <p className="text-white/50 text-center mt-3">
                  Aucun classement par catégorie disponible
                </p>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 pt-2">
            <button
              onClick={closeCategoryModal}
              className="w-full rounded-2xl bg-[#3E3666] px-6 py-4 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="text-white text-base font-semibold text-center block">Fermer</span>
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <ModalOverlay onClose={() => setShowLogoutModal(false)}>
          <div className="bg-[#292349] px-6 py-5 border-b border-[#3E3666]">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <AlertCircle size={24} color="#EF4444" />
                </div>
                <p className="text-white text-xl font-bold">Logout</p>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center hover:opacity-80 cursor-pointer"
              >
                <X size={20} color="#9CA3AF" />
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            <p className="text-white/90 text-base leading-6 text-center">
              Are you sure you want to logout?
              <br />
              You&apos;ll need to login again to access your account.
            </p>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-3">
            <button
              onClick={handleLogout}
              disabled={isAuthLoading}
              className="w-full rounded-2xl py-4 flex flex-row items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-60"
              style={{ background: 'linear-gradient(to right, #EF4444, #F97316)' }}
            >
              {isAuthLoading ? (
                <Spinner />
              ) : (
                <>
                  <LogOut size={20} color="#fff" />
                  <span className="text-white text-base font-bold">Yes, Logout</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowLogoutModal(false)}
              disabled={isAuthLoading}
              className="w-full rounded-2xl bg-[#3E3666] px-6 py-4 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="text-white text-base font-semibold text-center block">Cancel</span>
            </button>
          </div>
        </ModalOverlay>
      )}
    </SafeScreen>
  );
}
