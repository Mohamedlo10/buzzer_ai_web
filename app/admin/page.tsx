'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Gamepad2, Brain, DollarSign, Crown, ChevronRight } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { StatCard } from '~/components/admin/StatCard';
import * as adminApi from '~/lib/api/admin';
import type { AdminStatsResponse } from '~/types/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const aiCostPercentage = (stats.aiCost.consumed / stats.aiCost.budget) * 100;

  return (
    <div className="min-h-screen bg-[#292349]">
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
            <p className="text-white font-bold text-xl">Admin Dashboard</p>
            <div className="flex items-center mt-0.5 gap-1">
              <Crown size={12} color="#FFD700" />
              <span className="text-[#FFD700] text-xs">Super Admin</span>
            </div>
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
                title="Questions générées"
                value={stats.questionsGenerated}
                icon={Brain}
                color="#9B59B6"
              />
            </div>
            <div className="w-[calc(50%-6px)]">
              <StatCard
                title="Coût AI"
                value={`${stats.aiCost.consumed}${stats.aiCost.currency}`}
                icon={DollarSign}
                color="#D5442F"
              />
            </div>
          </div>
        </div>

        {/* AI Budget Progress */}
        <div className="px-4 pt-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold">Budget AI</p>
              <span
                className={`font-bold ${
                  aiCostPercentage > 90
                    ? 'text-[#D5442F]'
                    : aiCostPercentage > 70
                    ? 'text-[#FFD700]'
                    : 'text-[#00D397]'
                }`}
              >
                {aiCostPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-[#3E3666] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  aiCostPercentage > 90
                    ? 'bg-[#D5442F]'
                    : aiCostPercentage > 70
                    ? 'bg-[#FFD700]'
                    : 'bg-[#00D397]'
                }`}
                style={{ width: `${Math.min(aiCostPercentage, 100)}%` }}
              />
            </div>
            <p className="text-white/50 text-sm mt-2">
              {stats.aiCost.consumed}{stats.aiCost.currency} / {stats.aiCost.budget}{stats.aiCost.currency}
            </p>
          </Card>
        </div>

        {/* Top Categories */}
        <div className="px-4 pt-4">
          <Card>
            <p className="text-white font-semibold mb-4">Top Catégories</p>
            {stats.topCategories.map((cat, index) => (
              <div
                key={cat.name}
                className="flex items-center py-2 border-b border-[#3E3666] last:border-b-0"
              >
                <span className="text-white/60 w-6">{index + 1}.</span>
                <span className="text-white flex-1">{cat.name}</span>
                <span className="text-[#00D397] font-medium">{cat.count}</span>
              </div>
            ))}
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
        </div>
      </div>
    </div>
  );
}
