'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Crown, Trophy } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { PlayerProfileModal } from '~/components/ui/PlayerProfileModal';
import { Podium } from '~/components/results/Podium';
import { useAuthStore } from '~/stores/useAuthStore';
import { useBuzzStore } from '~/stores/useBuzzStore';
import * as rankingsApi from '~/lib/api/rankings';
import { appStorage } from '~/lib/utils/storage';
import type { SessionRankingEntry, CategoryRankingResponse } from '~/types/api';

import { XalaatMark } from '~/components/shared/XalaatMark';
import { PatternLozenge } from '~/components/shared/PatternLozenge';
import { AnimatedCounter } from '~/components/shared/AnimatedCounter';

// ── Team Rankings Card ────────────────────────────────────────────────────────
interface TeamEntry {
  id: string;
  name: string;
  color: string;
  score: number;
  players: SessionRankingEntry[];
}

function TeamRankingsCard({ teamRankings }: { teamRankings: TeamEntry[] }) {
  const rankColors = ['var(--color-accent)', '#C0C0C0', '#CD7F32'];

  return (
    <div className="bg-surface rounded-[var(--card-radius)] border border-line overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-accent" />
          <p className="text-txt-60 font-bold text-xs tracking-widest uppercase">Classement par équipe</p>
        </div>
        <p className="text-txt-40 text-xs font-semibold tracking-wider uppercase">Points équipe</p>
      </div>

      {teamRankings.map((team, index) => {
        const scoreColor = index < 3 ? rankColors[index] : '#FFFFFF';
        return (
          <div
            key={team.id}
            className={`px-4 py-3 ${index < teamRankings.length - 1 ? 'border-b border-line' : ''}`}
            style={{ borderLeft: `3px solid ${team.color}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {index === 0 && <Crown size={14} className="text-accent" />}
                <span className="font-bold text-base" style={{ color: team.color }}>{team.name}</span>
                <span className="text-txt-40 text-xs">{team.players.length} joueur{team.players.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-lg" style={{ color: scoreColor }}>{team.score}</span>
                <span className="text-txt-40 text-xs">pts</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {team.players.map((p) => (
                <span key={p.player.id} className="text-xs bg-bg rounded-full px-2 py-0.5 text-txt-60">
                  {p.player.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Session Results Page ──────────────────────────────────────────────────
export default function SessionResultsPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = params.code;
  const roomIdFromUrl = searchParams.get('roomId');

  const user = useAuthStore((s) => s.user);
  const sessionCode = useBuzzStore((s) => s.sessionCode);
  const leaveSession = useBuzzStore((s) => s.leaveSession);

  const [rankings, setRankings] = useState<SessionRankingEntry[]>([]);
  const [categoryRankings, setCategoryRankings] = useState<CategoryRankingResponse | null>(null);
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [resolvedRoomId, setResolvedRoomId] = useState<string | null>(roomIdFromUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const storedSession = await appStorage.getActiveSession();
        if (storedSession?.code === code && storedSession?.sessionId) {
          if (isMounted) setResolvedRoomId(storedSession.sessionId);
        }

        const data = await rankingsApi.getSessionRankings(code);
        if (!isMounted) return;

        setRankings(Array.isArray(data) ? data : []);

        if (sessionCode === code) {
          leaveSession();
          await appStorage.clearActiveSession();
        }
      } catch (err) {
        console.error('Failed to load rankings:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [code, sessionCode, leaveSession]);

  const handleBack = () => {
    if (resolvedRoomId) router.replace(`/room/${resolvedRoomId}`);
    else router.replace('/dashboard');
  };

  const currentUserRanking = rankings.find(
    (r) => (r.player.userId ?? r.player.id) === user?.id
  );

  const finalScore = currentUserRanking?.finalScore ?? 0;

  return (
    <SafeScreen className="bg-bg min-h-[100dvh] relative overflow-hidden flex flex-col">
      {/* Background lozenge pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <PatternLozenge color="var(--color-primary)" opacity={0.06} size={28} />
      </div>

      {/* Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <XalaatMark size={28} color="var(--color-primary)" accent="var(--color-accent)" />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 20,
              letterSpacing: '-0.02em',
            }}
          >
            Xalaat
          </span>
        </div>
        <button
          onClick={handleBack}
          type="button"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-line)',
            color: 'var(--color-ink)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Fermer ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '24px 20px 40px',
          textAlign: 'center',
        }}
        className="overflow-y-auto"
      >
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-primary)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Quiz terminé · Partie #{code}
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--font-display-weight)' as any,
            fontSize: 38,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            margin: '0 0 10px',
          }}
        >
          <span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', color: 'var(--color-ink-soft)', fontWeight: 400, fontSize: 30 }}>
            Mashallah,{' '}
          </span>
          tu es <span style={{ color: 'var(--color-primary)' }}>borom xalaat</span>.
        </h1>

        <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', margin: '0 0 24px' }}>
          Tu termines à la position{' '}
          <strong style={{ color: 'var(--color-ink)' }}>
            #{currentUserRanking?.rank ?? 1}
          </strong>{' '}
          sur {rankings.length} joueur{rankings.length > 1 ? 's' : ''}.
        </p>

        {/* Big score + medal */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
          {/* Gold medal lozenge */}
          <div style={{ position: 'relative', width: 110, height: 110 }}>
            <svg width="110" height="110" viewBox="0 0 160 160">
              <path d="M80 8 L152 80 L80 152 L8 80 Z" fill="var(--color-accent)" />
              <path d="M80 22 L138 80 L80 138 L22 80 Z" fill="none" stroke="var(--color-ink)" strokeOpacity="0.2" strokeWidth="2" />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--color-ink)',
                letterSpacing: '0.04em',
              }}
            >
              OR
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
              Score final
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-display-weight)' as any,
                fontSize: 64,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                color: 'var(--color-ink)',
              }}
            >
              <AnimatedCounter to={finalScore} duration={1600} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic' }}>xalaat-points</span>
            </div>
          </div>
        </div>

        {/* Podium section */}
        <div style={{ marginBottom: 24 }}>
          <Podium
            rankings={rankings}
            currentUserId={user?.id}
            onPlayerTap={(entry) => {
              const uid = entry.player.userId ?? entry.player.id;
              if (uid) setProfileUserId(uid);
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={handleBack}
            type="button"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-ink)',
              border: 'none',
              padding: '14px 24px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {resolvedRoomId ? 'Retour à la salle' : 'Retour à l\'accueil'}
          </button>
          {resolvedRoomId && (
            <button
              onClick={() => router.replace(`/session/create?roomId=${resolvedRoomId}`)}
              type="button"
              style={{
                background: 'var(--color-ink)',
                color: 'var(--color-bg)',
                border: 'none',
                padding: '14px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Rejouer 🔁
            </button>
          )}
        </div>
      </div>

      <PlayerProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </SafeScreen>
  );
}
