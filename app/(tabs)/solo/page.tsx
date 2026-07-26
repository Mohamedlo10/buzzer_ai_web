'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Dumbbell, Sparkles, ArrowRight } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { useAuthStore } from '~/stores/useAuthStore';
import { useDashboardV2 } from '~/lib/query/hooks';

import { PatternLozenge } from '~/components/shared/PatternLozenge';
import { PatternZigzag } from '~/components/shared/PatternZigzag';
import { Avatar } from '~/components/shared/Avatar';
import { AnimatedCounter } from '~/components/shared/AnimatedCounter';

export default function SoloPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data } = useDashboardV2();

  const [aiPrompt, setAiPrompt] = useState('');

  const username = user?.username || 'Joueur';
  const dayName = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });

  const leaderboardList = [
    { rank: 1, name: username, score: data?.globalStats?.totalScore || 18420, hue: 60 },
    { rank: 2, name: 'Modou Fall', score: 17105, hue: 30 },
    { rank: 3, name: 'Fatou Ndiaye', score: 16780, hue: 350 },
  ];

  const handleAiPromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (aiPrompt.trim()) {
      router.push(`/solo/training?prompt=${encodeURIComponent(aiPrompt.trim())}`);
    } else {
      router.push('/solo/training');
    }
  };

  return (
    <SafeScreen className="bg-bg min-h-[100dvh] relative overflow-hidden flex flex-col">
      {/* Background pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <PatternLozenge color="var(--color-primary)" opacity={0.05} size={26} />
      </div>

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '8px 20px 24px',
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

        {/* Chips */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            flexWrap: 'nowrap',
            marginBottom: 22,
            paddingBottom: 4,
          }}
          className="scrollbar-hide"
        >
          {[
            { label: 'Mbalax', action: () => router.push('/solo/training?prompt=Mbalax'), active: true },
            { label: 'Carrière 🏆', action: () => router.push('/solo/career'), active: false },
            { label: 'Entraînement 🎯', action: () => router.push('/solo/training'), active: false },
            { label: 'Cinéma', action: () => router.push('/solo/training?prompt=Cinema'), active: false },
            { label: 'Histoire 🇸🇳', action: () => router.push('/solo/training?prompt=Histoire'), active: false },
            { label: 'Géo', action: () => router.push('/solo/training?prompt=Geo'), active: false },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.action}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                background: chip.active ? 'var(--color-primary)' : 'transparent',
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
                Sets IA & thèmes libre
              </div>
            </div>
          </button>
        </div>

        {/* Featured Card (Quiz du jour) */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--color-secondary)',
            color: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: 18,
            marginBottom: 18,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.7, pointerEvents: 'none' }}>
            <PatternZigzag color="var(--color-accent)" opacity={0.22} size={20} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>
              Quiz du jour
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-display-weight)' as any,
                fontSize: 24,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                margin: '8px 0 14px',
              }}
            >
              Lutte sénégalaise
              <br />
              <span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontWeight: 400, opacity: 0.85 }}>
                les années d'or
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.85 }}>
                <span>10 questions</span>·<span>4 min</span>·<span>+1 200 pts max</span>
              </div>
              <button
                type="button"
                onClick={() => router.push('/solo/training?prompt=Lutte%20senegalaise')}
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-ink)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Jouer →
              </button>
            </div>
          </div>
        </div>

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
          {leaderboardList.map((p, i, arr) => (
            <div
              key={p.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-line)' : 'none',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 'var(--font-display-weight)' as any,
                  fontSize: 14,
                  width: 18,
                  color:
                    p.rank === 1
                      ? 'var(--color-accent)'
                      : p.rank === 2
                      ? 'var(--color-primary)'
                      : 'var(--color-secondary)',
                }}
              >
                {p.rank}
              </div>
              <Avatar name={p.name} hue={p.hue} size={30} ring={p.rank === 1 ? 'var(--color-accent)' : undefined} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedCounter to={p.score} motion="subtle" duration={1100 + i * 80} /> pts
              </div>
            </div>
          ))}
        </div>
      </div>
    </SafeScreen>
  );
}
