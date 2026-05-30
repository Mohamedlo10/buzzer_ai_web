'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Users,
  Gamepad2,
  Brain,
  DollarSign,
  Trophy,
  Flame,
  DoorOpen,
  BookOpen,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { KpiCard } from '~/components/admin/KpiCard';
import * as adminApi from '~/lib/api/admin';
import Link from 'next/link';

const PERIOD_TABS = [
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '90 jours', value: '90d' },
];

const CHART_TABS = [
  { label: 'Utilisateurs', key: 'userGrowth', color: '#3B82F6' },
  { label: 'Sessions', key: 'sessionCreated', color: '#10B981' },
  { label: 'Coût AI', key: 'aiCost', color: '#F59E0B' },
  { label: 'Joueurs actifs', key: 'activePlayers', color: '#9B59B6' },
];

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('30d');
  const [chartTab, setChartTab] = useState('userGrowth');

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getAdminStats,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['adminTimeline', period],
    queryFn: () => adminApi.getAdminTimeline(period),
  });

  const { data: topStats, isLoading: topLoading } = useQuery({
    queryKey: ['adminTopStats'],
    queryFn: adminApi.getAdminTopStats,
  });

  const { data: activeSessions, isLoading: activeLoading } = useQuery({
    queryKey: ['adminActiveSessions'],
    queryFn: adminApi.getAdminActiveSessions,
    refetchInterval: 10000,
  });

  const chartData = timeline
    ? (timeline as any)[chartTab]?.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        value: d.costValue != null ? d.costValue : d.value,
      }))
    : [];

  const chartConfig = CHART_TABS.find((c) => c.key === chartTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-white/50 text-sm">Vue d'ensemble de la plateforme</p>
        </div>
        <button
          onClick={() => refetchStats()}
          className="flex items-center gap-2 px-4 py-2 bg-[#3E3666] rounded-xl text-white/70 hover:text-white hover:bg-[#4E4676] transition-colors text-sm"
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          title="Utilisateurs"
          value={stats?.totalUsers ?? '-'}
          icon={Users}
          iconColor="#3B82F6"
          iconBg="#3B82F620"
        />
        <KpiCard
          title="Sessions totales"
          value={stats?.totalSessions ?? '-'}
          icon={Gamepad2}
          iconColor="#10B981"
          iconBg="#10B98120"
        />
        <KpiCard
          title="Sessions actives"
          value={stats?.activeSessions ?? '-'}
          icon={Activity}
          iconColor="#F59E0B"
          iconBg="#F59E0B20"
        />
        <KpiCard
          title="Coût AI (mois)"
          value={stats ? `$${stats.aiCostThisMonth.toFixed(2)}` : '-'}
          icon={DollarSign}
          iconColor="#EF4444"
          iconBg="#EF444420"
        />
        <KpiCard
          title="Questions générées"
          value={stats?.totalQuestions ?? '-'}
          icon={Brain}
          iconColor="#8B5CF6"
          iconBg="#8B5CF620"
        />
        <KpiCard
          title="Tokens input"
          value={stats?.aiInputTokensThisMonth ?? '-'}
          icon={BookOpen}
          iconColor="#06B6D4"
          iconBg="#06B6D420"
        />
        <KpiCard
          title="Tokens output"
          value={stats?.aiOutputTokensThisMonth ?? '-'}
          icon={BookOpen}
          iconColor="#EC4899"
          iconBg="#EC489920"
        />
        <KpiCard
          title="Salles actives"
          value={activeSessions?.length ?? '-'}
          icon={DoorOpen}
          iconColor="#00D397"
          iconBg="#00D39720"
        />
      </div>

      {/* Main Chart */}
      <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-white font-bold text-lg">Évolution temporelle</h2>
          <div className="flex items-center gap-2">
            {PERIOD_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setPeriod(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === t.value
                    ? 'bg-[#9B59B6] text-white'
                    : 'bg-[#3E3666] text-white/60 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {CHART_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setChartTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                chartTab === t.key
                  ? 'bg-[#292349] text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-60 lg:h-72">
          {timelineLoading ? (
            <div className="h-full flex items-center justify-center text-white/50">Chargement...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartConfig?.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartConfig?.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3E3666" />
                <XAxis dataKey="date" stroke="#FFFFFF40" fontSize={12} />
                <YAxis stroke="#FFFFFF40" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1A40',
                    border: '1px solid #3E3666',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartConfig?.color}
                  fill="url(#chartGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row : Top stats + Active sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Top Players */}
        <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} color="#FFD700" />
            <h3 className="text-white font-bold">Top Joueurs</h3>
          </div>
          {topLoading ? (
            <div className="text-white/50 text-sm">Chargement...</div>
          ) : (
            <div className="space-y-3">
              {topStats?.topPlayers.slice(0, 5).map((p, i) => (
                <div key={p.userId} className="flex items-center gap-3">
                  <span className={`w-6 text-center font-bold text-sm ${
                    i === 0 ? 'text-[#FFD700]' : i === 1 ? 'text-[#C0C0C0]' : i === 2 ? 'text-[#CD7F32]' : 'text-white/40'
                  }`}>
                    {i + 1}
                  </span>
                  <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-[#292349]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.username}</p>
                    <p className="text-white/40 text-xs">{p.totalWins} victoires</p>
                  </div>
                  <span className="text-[#9B59B6] font-bold text-sm">{p.glickoRating?.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} color="#F97316" />
            <h3 className="text-white font-bold">Top Catégories</h3>
          </div>
          {topLoading ? (
            <div className="text-white/50 text-sm">Chargement...</div>
          ) : (
            <div className="space-y-3">
              {topStats?.topCategories.slice(0, 5).map((c, i) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-6 text-center text-white/40 text-sm font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.category}</p>
                    <div className="w-full h-1.5 bg-[#292349] rounded-full mt-1">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${Math.min(100, (c.questionCount / (topStats.topCategories[0]?.questionCount || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-white/60 text-xs">{c.questionCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} color="#00D397" />
            <h3 className="text-white font-bold">Sessions en cours</h3>
            <span className="ml-auto px-2 py-0.5 bg-[#00D39720] text-[#00D397] text-xs rounded-full font-semibold">
              {activeSessions?.length ?? 0} live
            </span>
          </div>
          {activeLoading ? (
            <div className="text-white/50 text-sm">Chargement...</div>
          ) : activeSessions?.length === 0 ? (
            <div className="text-white/40 text-sm text-center py-6">Aucune session active</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activeSessions?.slice(0, 6).map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/sessions/${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#292349] hover:bg-[#3E3666] transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    s.status === 'PLAYING' ? 'bg-green-500 animate-pulse' :
                    s.status === 'PAUSED' ? 'bg-yellow-500' :
                    s.status === 'LOBBY' ? 'bg-blue-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">#{s.code}</p>
                    <p className="text-white/40 text-xs">{s.playerCount}/{s.maxPlayers} joueurs • Q{s.currentQuestionIndex}/{s.totalQuestions}</p>
                  </div>
                  <span className="text-white/30 text-xs">{formatDuration(s.secondsElapsed)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}
