'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Dumbbell, Sparkles } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { useAuthStore } from '~/stores/useAuthStore';
import { useDashboardV2 } from '~/lib/query/hooks';

import { PatternLozenge } from '~/components/shared/PatternLozenge';
import { Avatar } from '~/components/shared/Avatar';
import { AnimatedCounter } from '~/components/shared/AnimatedCounter';
import { QuizOfTheDayCard } from '~/components/shared/QuizOfTheDayCard';
import { GlobalRankCard } from '~/components/shared/GlobalRankCard';
import { UserProfileModal } from '~/components/shared/UserProfileModal';
import * as rankingsApi from '~/lib/api/rankings';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';
import type { GlobalRanking } from '~/types/api';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useDashboardV2();

  const [aiPrompt, setAiPrompt] = useState('');
  const [topRankings, setTopRankings] = useState<GlobalRanking[]>([]);
  const [selectedUserModal, setSelectedUserModal] = useState<GlobalRanking | null>(null);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      router.replace('/admin');
    }
  }, [user, router]);

  useEffect(() => {
    let isMounted = true;
    async function loadTopRankings() {
      try {
        const res = await rankingsApi.getGlobalRankings({ page: 0, size: 3 });
        if (isMounted && res?.content) {
          setTopRankings(res.content);
        }
      } catch (err) {
        console.error('Failed to load top 3 rankings on dashboard:', err);
      }
    }

    loadTopRankings();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center min-h-[100dvh]">
        <Spinner size="large" text="Chargement..." />
      </SafeScreen>
    );
  }

  if (isError || !data) {
    return (
      <SafeScreen className="bg-bg">
        <div className="flex flex-col flex-1 items-center justify-center px-4 min-h-[100dvh]">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
            <span className="text-3xl">😵</span>
          </div>
          <p className="text-buzz text-lg font-semibold mb-2">Erreur de chargement</p>
          <p className="text-txt-60 text-center mb-4">Impossible de charger la page d'accueil</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer border-none text-white font-bold"
            style={{ background: 'var(--color-primary)' }}
          >
            Réessayer
          </button>
        </div>
      </SafeScreen>
    );
  }

  const username = user?.username || 'Awa';
  const dayName = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
  const activeRooms = data.recentRooms?.filter((room) => room.hasActiveSession) || [];
  const globalRank = data.globalStats?.rank || 154;

  const leaderboardList = [
    { rank: 1, name: username, score: data.globalStats?.totalScore || 18420, hue: 60 },
    { rank: 2, name: 'Modou Fall', score: 17105, hue: 30 },
    { rank: 3, name: 'Fatou Ndiaye', score: 16780, hue: 350 },
  ];

  const handleAiPromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (aiPrompt.trim()) {
      router.push(`/solo/career/new?theme=${encodeURIComponent(aiPrompt.trim())}`);
    } else {
      router.push('/solo/career/new');
    }
  };

  return (
    <SafeScreen className="bg-transparent relative flex flex-col flex-1">
      {/* Main Content Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '8px 20px 120px',
        }}
      >
        {/* Greeting */}
        <div style={{ marginTop: 6, marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 4 }}>
            Salaam, {username} <span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic' }}>·</span> {dayName}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 34,
              lineHeight: 1,
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            Que veux-tu<br />
            <span style={{ color: 'var(--color-primary)' }}>deviner</span> aujourd'hui ?
          </h1>
        </div>



        {/* AI Prompt Input Bar */}
        <form
          onSubmit={handleAiPromptSubmit}
          style={{
            background: 'var(--color-surface)',
            borderRadius: 18,
            border: '1px solid var(--color-line)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 18 }}>✨</span>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Tape un sujet…"
            style={{
              flex: 1,
              fontSize: 14,
              color: 'var(--color-ink)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-primary)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-primary-ink)',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            →
          </button>
        </form>

        {/* Chips / Shortcut Badges */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            flexWrap: 'nowrap',
            marginBottom: 20,
            paddingBottom: 4,
          }}
          className="scrollbar-hide"
        >
          {[
            { label: 'Mbalax', action: () => router.push('/solo/career/new?theme=Mbalax'), active: true },
            { label: 'Carrière 🏆', action: () => router.push('/solo/career'), active: false },
            { label: 'Entraînement 🎯', action: () => router.push('/solo/training'), active: false },
            { label: 'Multijoueur 👥', action: () => router.push('/rooms?join=1'), active: false },
            { label: 'Cinéma', action: () => router.push('/solo/career/new?theme=Cinema'), active: false },
            { label: 'Histoire 🇸🇳', action: () => router.push('/solo/career/new?theme=Histoire'), active: false },
            { label: 'Géo', action: () => router.push('/solo/career/new?theme=Geo'), active: false },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.action}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                background: chip.active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: chip.active ? 'var(--color-primary-ink)' : 'var(--color-ink)',
                border: chip.active ? 'none' : '1px solid var(--color-line)',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Quick Access Cards: Mode Carrière & Entraînement */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => router.push('/solo/career')}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 120,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(232, 166, 48, 0.15)', display: 'grid', placeItems: 'center' }}>
              <Trophy size={18} className="text-accent" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-weight)' as any, fontSize: 15, color: 'var(--color-ink)' }}>
                Carrière
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                12 niveaux de difficulté
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/solo/training')}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 120,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(184, 70, 42, 0.15)', display: 'grid', placeItems: 'center' }}>
              <Dumbbell size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-weight)' as any, fontSize: 15, color: 'var(--color-ink)' }}>
                Entraînement
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                Sets IA & thèmes libres
              </div>
            </div>
          </button>
        </div>

        {/* Featured Card (Quiz du jour / Active Session) */}
        <QuizOfTheDayCard activeRoom={activeRooms[0] ?? null} style={{ marginBottom: 18 }} />

        {/* Mini Leaderboard */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 18,
              letterSpacing: '-0.015em',
            }}
          >
            Top de la semaine
          </div>
          <button
            type="button"
            onClick={() => router.push('/rankings')}
            style={{ fontSize: 12, color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Voir tout
          </button>
        </div>

        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--card-radius)',
            border: '1px solid var(--color-line)',
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          {topRankings.length > 0 ? (
            topRankings.map((p, i, arr) => {
              const score = Math.round(p.glickoRating ?? p.totalScore ?? 0);
              const rank = i + 1;
              return (
                <div
                  key={p.userId || i}
                  onClick={() => setSelectedUserModal(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-line)' : 'none',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-surface-2/40 transition-colors"
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 'var(--font-display-weight)' as any,
                      fontSize: 14,
                      width: 18,
                      color:
                        rank === 1
                          ? 'var(--color-accent)'
                          : rank === 2
                          ? 'var(--color-primary)'
                          : 'var(--color-secondary)',
                    }}
                  >
                    {rank}
                  </div>
                  <Avatar name={p.username} avatarUrl={p.avatarUrl} size={30} ring={rank === 1 ? 'var(--color-accent)' : undefined} />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }} className="truncate">
                    {p.username}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    <AnimatedCounter to={score} motion="subtle" duration={1100 + i * 80} /> pts
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--color-ink-soft)', textAlign: 'center' }}>
              Chargement du classement…
            </div>
          )}
        </div>

        {/* Classement mondial — clôture la section « Top de la semaine » */}
        <GlobalRankCard rank={globalRank} style={{ marginBottom: 4 }} />
      </div>
      <UserProfileModal
        visible={!!selectedUserModal}
        userId={selectedUserModal?.userId ?? null}
        username={selectedUserModal?.username}
        avatarUrl={selectedUserModal?.avatarUrl}
        onClose={() => setSelectedUserModal(null)}
      />
    </SafeScreen>
  );
}
