'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Users,
  Gamepad2,
  Brain,
  DollarSign,
} from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { KpiCard } from '~/components/admin/KpiCard';
import * as rankingsApi from '~/lib/api/rankings';
import * as adminApi from '~/lib/api/admin';

export default function AdminSettingsPage() {
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getAdminStats,
  });

  const globalRecalc = useMutation({
    mutationFn: rankingsApi.recalculateGlobalRankings,
    onSuccess: (data) => toast.success(data.message || 'Classements globaux recalculés'),
    onError: () => toast.error('Erreur lors du recalcul global'),
  });

  const roomRecalc = useMutation({
    mutationFn: rankingsApi.recalculateRoomRankings,
    onSuccess: (data) => toast.success(data.message || 'Classements par salle recalculés'),
    onError: () => toast.error('Erreur lors du recalcul par salle'),
  });

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-bg pt-6 pb-4 px-4 border-b border-line">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-3 hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-txt font-bold text-xl">Paramètres</p>
            <p className="text-txt-60 text-xs">Maintenance et statistiques</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Maintenance */}
        <div>
          <h2 className="text-txt font-bold text-lg mb-4 flex items-center gap-2">
            <RefreshCw size={20} color="#9B59B6" />
            Maintenance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="flex flex-col gap-3">
              <div>
                <p className="text-txt font-semibold">Recalcul global</p>
                <p className="text-txt-60 text-xs mt-1">
                  Recalcule tous les classements globaux des joueurs.
                </p>
              </div>
              <button
                onClick={() => globalRecalc.mutate()}
                disabled={globalRecalc.isPending}
                className="w-full py-3 rounded-xl bg-[#9B59B6] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={globalRecalc.isPending ? 'animate-spin' : ''} />
                {globalRecalc.isPending ? 'Recalcul en cours...' : 'Recalculer classements globaux'}
              </button>
            </Card>

            <Card className="flex flex-col gap-3">
              <div>
                <p className="text-txt font-semibold">Recalcul par salle</p>
                <p className="text-txt-60 text-xs mt-1">
                  Recalcule les classements pour chaque salle.
                </p>
              </div>
              <button
                onClick={() => roomRecalc.mutate()}
                disabled={roomRecalc.isPending}
                className="w-full py-3 rounded-xl bg-[#9B59B6] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={roomRecalc.isPending ? 'animate-spin' : ''} />
                {roomRecalc.isPending ? 'Recalcul en cours...' : 'Recalculer classements par salle'}
              </button>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className="text-txt font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 size={20} color="#00D397" />
            Statistiques rapides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Utilisateurs"
              value={stats?.totalUsers ?? '-'}
              icon={Users}
              iconColor="#3B82F6"
              iconBg="#3B82F620"
            />
            <KpiCard
              title="Sessions"
              value={stats?.totalSessions ?? '-'}
              icon={Gamepad2}
              iconColor="#10B981"
              iconBg="#10B98120"
            />
            <KpiCard
              title="Questions"
              value={stats?.totalQuestions ?? '-'}
              icon={Brain}
              iconColor="#8B5CF6"
              iconBg="#8B5CF620"
            />
            <KpiCard
              title="Coût AI (mois)"
              value={stats ? `$${stats.aiCostThisMonth.toFixed(2)}` : '-'}
              icon={DollarSign}
              iconColor="#EF4444"
              iconBg="#EF444420"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
