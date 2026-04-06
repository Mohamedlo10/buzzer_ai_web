'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Gamepad2, Brain, DollarSign, Crown, ChevronRight, Cpu, LogOut, Trophy, AlertTriangle, CheckCircle, FolderOpen, BookOpen } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { StatCard } from '~/components/admin/StatCard';
import * as adminApi from '~/lib/api/admin';
import * as rankingsApi from '~/lib/api/rankings';
import type { AdminStatsResponse } from '~/types/api';
import { useAuthStore } from '~/stores/useAuthStore';

export default function AdminDashboardPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateResult, setRecalculateResult] = useState<{ ok: boolean; message: string } | null>(null);

  const loadStats = async () => {
    try {
      const data = await adminApi.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setRecalculateResult(null);
    try {
      const res = await rankingsApi.recalculateGlobalRankings();
      setRecalculateResult({ ok: true, message: res.message });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors du recalcul';
      setRecalculateResult({ ok: false, message });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <p className="text-white/60">Erreur de chargement</p>
          <button
            onClick={loadStats}
            className="mt-4 bg-[#00D397] px-6 py-3 rounded-xl hover:bg-[#00B377] transition-colors"
          >
            <span className="text-[#292349] font-bold">Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  const totalTokens = stats.aiInputTokensThisMonth + stats.aiOutputTokensThisMonth;

  return (
    <div className="min-h-screen bg-[#292349]">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666]">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-white font-bold text-xl">Admin Dashboard</p>
            <div className="flex items-center mt-0.5 gap-1">
              <Crown size={12} color="#FFD700" />
              <span className="text-[#FFD700] text-xs">Super Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-[#00D397] text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
            >
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
            <button
              onClick={async () => { await logout(); router.replace('/login'); }}
              className="w-9 h-9 rounded-full bg-[#D5442F20] flex items-center justify-center hover:bg-[#D5442F40] transition-colors"
            >
              <LogOut size={16} color="#D5442F" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto">
        {/* Stats Grid */}
        <div className="px-4 pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="w-[calc(50%-6px)]">
              <StatCard
                title="Utilisateurs"
                value={stats.totalUsers}
                icon={Users}
                color="#00D397"
              />
            </div>
            <div className="w-[calc(50%-6px)]">
              <StatCard
                title="Sessions actives"
                value={stats.activeSessions}
                icon={Gamepad2}
                color="#FFD700"
              />
            </div>
            <div className="w-[calc(50%-6px)]">
              <StatCard
                title="Total sessions"
                value={stats.totalSessions}
                icon={Brain}
                color="#9B59B6"
              />
            </div>
            <div className="w-[calc(50%-6px)]">
              <StatCard
                title="Coût AI (mois)"
                value={`$${stats.aiCostThisMonth.toFixed(3)}`}
                icon={DollarSign}
                color="#D5442F"
              />
            </div>
          </div>
        </div>

        {/* AI Tokens */}
        <div className="px-4 pt-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={16} color="#9B59B6" />
              <p className="text-white font-semibold">Tokens AI ce mois</p>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-white/60 text-sm">Input tokens</span>
              <span className="text-white font-medium">{stats.aiInputTokensThisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-white/60 text-sm">Output tokens</span>
              <span className="text-white font-medium">{stats.aiOutputTokensThisMonth.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-[#3E3666] rounded-full overflow-hidden flex">
              {totalTokens > 0 && (
                <>
                  <div
                    className="h-full bg-[#4A90D9]"
                    style={{ width: `${(stats.aiInputTokensThisMonth / totalTokens) * 100}%` }}
                  />
                  <div
                    className="h-full bg-[#9B59B6]"
                    style={{ width: `${(stats.aiOutputTokensThisMonth / totalTokens) * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#4A90D9]" />
                <span className="text-white/40 text-xs">Input</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#9B59B6]" />
                <span className="text-white/40 text-xs">Output</span>
              </div>
              <span className="text-white/40 text-xs ml-auto">Total: {totalTokens.toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pt-4 pb-8">
          <p className="text-white font-bold text-lg mb-3">Actions rapides</p>

          <button
            onClick={() => router.push('/admin/users')}
            className="w-full bg-[#342D5B] rounded-xl p-4 border border-[#3E3666] mb-3 hover:opacity-80 transition-opacity text-left"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-[#00D39720] flex items-center justify-center mr-3">
                <Users size={20} color="#00D397" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Gestion utilisateurs</p>
                <p className="text-white/50 text-sm">Voir et modifier les rôles</p>
              </div>
              <ChevronRight size={20} color="#FFFFFF" />
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/sessions')}
            className="w-full bg-[#342D5B] rounded-xl p-4 border border-[#3E3666] mb-3 hover:opacity-80 transition-opacity text-left"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-[#FFD70020] flex items-center justify-center mr-3">
                <Gamepad2 size={20} color="#FFD700" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Gestion sessions</p>
                <p className="text-white/50 text-sm">Forcer l'arrêt des sessions</p>
              </div>
              <ChevronRight size={20} color="#FFFFFF" />
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/rooms')}
            className="w-full bg-[#342D5B] rounded-xl p-4 border border-[#3E3666] mb-3 hover:opacity-80 transition-opacity text-left"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-[#4A90D920] flex items-center justify-center mr-3">
                <FolderOpen size={20} color="#4A90D9" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Gestion salles</p>
                <p className="text-white/50 text-sm">Membres et sessions par salle</p>
              </div>
              <ChevronRight size={20} color="#FFFFFF" />
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/questions')}
            className="w-full bg-[#342D5B] rounded-xl p-4 border border-[#3E3666] mb-3 hover:opacity-80 transition-opacity text-left"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-[#E67E2220] flex items-center justify-center mr-3">
                <BookOpen size={20} color="#E67E22" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Historique questions</p>
                <p className="text-white/50 text-sm">Questions par catégorie et vainqueurs</p>
              </div>
              <ChevronRight size={20} color="#FFFFFF" />
            </div>
          </button>

          {/* Recalculate global rankings */}
          <div className="bg-[#342D5B] rounded-xl border border-[#3E3666] p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#9B59B620] flex items-center justify-center mr-3 flex-shrink-0">
                <Trophy size={20} color="#9B59B6" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Classement global</p>
                <p className="text-white/50 text-sm">Recalcul depuis toutes les parties</p>
              </div>
            </div>

            <div className="bg-[#FFD70010] rounded-lg p-3 border border-[#FFD70030] flex gap-2 mb-3">
              <AlertTriangle size={14} color="#FFD700" className="flex-shrink-0 mt-0.5" />
              <p className="text-[#FFD700] text-xs leading-relaxed">
                Cette action remet à zéro et recalcule l'intégralité du classement global depuis toutes les parties terminées. Les parties jouées en tant que manager sont exclues. À n'utiliser qu'une seule fois après la mise à jour.
              </p>
            </div>

            {recalculateResult && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-3 ${
                  recalculateResult.ok
                    ? 'bg-[#00D39715] border border-[#00D39740]'
                    : 'bg-[#D5442F15] border border-[#D5442F40]'
                }`}
              >
                {recalculateResult.ok ? (
                  <CheckCircle size={14} color="#00D397" />
                ) : (
                  <AlertTriangle size={14} color="#D5442F" />
                )}
                <span className={`text-xs font-medium ${recalculateResult.ok ? 'text-[#00D397]' : 'text-[#D5442F]'}`}>
                  {recalculateResult.message}
                </span>
              </div>
            )}

            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 bg-[#9B59B630] border border-[#9B59B650] hover:bg-[#9B59B650]"
            >
              {isRecalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#9B59B6] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[#9B59B6] font-semibold text-sm">Recalcul en cours...</span>
                </>
              ) : (
                <>
                  <Trophy size={16} color="#9B59B6" />
                  <span className="text-[#9B59B6] font-semibold text-sm">Recalculer le classement global</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
