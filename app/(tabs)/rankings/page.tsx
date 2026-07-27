'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Info } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { useAuthStore } from '~/stores/useAuthStore';
import * as rankingsApi from '~/lib/api/rankings';
import * as friendsApi from '~/lib/api/friends';
import type { GlobalRanking } from '~/types/api';

import { PatternLozenge } from '~/components/shared/PatternLozenge';
import { Avatar } from '~/components/shared/Avatar';
import { UserProfileModal } from '~/components/shared/UserProfileModal';

const PAGE_SIZE = 25;

// ── Ranking Info Modal ────────────────────────────────────────────────────────
function RankingInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-[var(--card-radius)] border border-line w-full max-w-md max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <div className="font-display font-semibold text-lg">Comment fonctionne le classement ?</div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center border-none cursor-pointer text-ink"
          >
            ✕
          </button>
        </div>

        <div className="text-sm text-txt-60 space-y-3 leading-relaxed">
          <p>
            Le classement utilise le système <strong className="text-ink font-semibold">Glicko-2</strong>. Il évalue votre niveau de jeu relatif par rapport aux autres joueurs.
          </p>
          <p>
            <strong className="text-primary">Bonus d&apos;activité :</strong> Plus vous jouez de parties, plus votre score s&apos;affine et s&apos;élève.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RankingsPage() {
  const router = useRouter();
  const [rankings, setRankings] = useState<GlobalRanking[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GlobalRanking | null>(null);

  const user = useAuthStore((state) => state.user);

  const fetchRankings = async (page: number, username?: string) => {
    try {
      const params: rankingsApi.SearchRankingsParams = { page, size: PAGE_SIZE };
      if (username && username.trim()) params.username = username.trim();
      const data = await rankingsApi.getGlobalRankings(params);
      setRankings(data.content || []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setCurrentUserRank(data.currentUserRank ?? null);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    }
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchRankings(0);
      setIsLoading(false);
    })();
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchUsername(text);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(async () => {
      setIsSearching(true);
      await fetchRankings(0, text);
      setIsSearching(false);
    }, 500);
    setSearchTimer(timer);
  };

  const handleClearSearch = async () => {
    setSearchUsername('');
    setIsSearching(true);
    await fetchRankings(0);
    setIsSearching(false);
  };

  const handlePageChange = async (page: number) => {
    setIsLoading(true);
    await fetchRankings(page, searchUsername);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center min-h-[100dvh]">
        <Spinner size="large" text="Chargement du classement…" />
      </SafeScreen>
    );
  }

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumList = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  return (
    <SafeScreen className="bg-bg min-h-[100dvh] relative overflow-hidden flex flex-col">
      {/* Background lozenge pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <PatternLozenge color="var(--color-primary)" opacity={0.05} size={26} />
      </div>

      {showInfoModal && <RankingInfoModal onClose={() => setShowInfoModal(false)} />}

      {/* Main Content Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '12px 20px 24px',
        }}
        className="overflow-y-auto"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-display-weight)' as any,
                fontSize: 26,
                letterSpacing: '-0.02em',
                margin: '0 0 2px',
              }}
            >
              Classement
            </h1>
            <div style={{ fontSize: 12.5, color: 'var(--color-ink-soft)' }}>
              {totalElements} joueurs classés
            </div>
          </div>
          <button
            onClick={() => setShowInfoModal(true)}
            type="button"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-pill)',
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-ink-soft)',
            }}
          >
            <Info size={16} />
          </button>
        </div>

        {/* Podium section (first page without search) */}
        {!searchUsername && currentPage === 0 && podiumList.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 10, alignItems: 'end', marginBottom: 20 }}>
            {podiumList.map((p, i) => {
              const rankNum = i === 1 ? 1 : i === 0 ? 2 : 3;
              const isFirst = rankNum === 1;
              const isSecond = rankNum === 2;
              const name = p?.username || 'Joueur';
              const score = Math.round(p?.glickoRating ?? p?.totalScore ?? 0);

              return (
                <div
                  key={p?.userId || rankNum}
                  onClick={() => p && setSelectedUser(p)}
                  style={{ textAlign: 'center', minWidth: 0, width: '100%', cursor: p ? 'pointer' : 'default' }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <div style={{ position: 'relative', width: isFirst ? 64 : 52, height: isFirst ? 64 : 52, margin: '0 auto 8px' }}>
                    <Avatar
                      name={name}
                      avatarUrl={p?.avatarUrl}
                      hue={isFirst ? 45 : isSecond ? 320 : 200}
                      size={isFirst ? 64 : 52}
                      ring={isFirst ? 'var(--color-accent)' : isSecond ? 'var(--color-ink-soft)' : 'var(--color-secondary)'}
                    />
                    {isFirst && (
                      <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>
                        ♛
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-line)',
                      borderRadius: 'var(--card-radius)',
                      padding: '10px 6px',
                      minWidth: 0,
                      width: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 'var(--font-display-weight)' as any,
                        fontSize: 13.5,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                      title={name}
                    >
                      {name}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--color-ink-soft)' }}>{score} pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search input bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-line)',
            borderRadius: 'var(--radius-pill)',
            padding: '11px 16px',
            marginBottom: 14,
          }}
        >
          <Search size={16} style={{ opacity: 0.6 }} />
          <input
            value={searchUsername}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher un joueur…"
            style={{
              flex: 1,
              fontSize: 13.5,
              color: 'var(--color-ink)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
            }}
          />
          {searchUsername && (
            <button onClick={handleClearSearch} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={14} className="text-txt-60" />
            </button>
          )}
        </div>

        {/* Stats Pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <div
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: '12px 14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-ink)' }}>
              {totalElements}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>Joueurs</div>
          </div>
          <div
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: '12px 14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-primary)' }}>
              #{currentUserRank ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>Ton rang</div>
          </div>
        </div>

        {/* Full Rankings Header */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-soft)',
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {searchUsername ? `Résultats pour "${searchUsername}"` : 'Classement complet'}
        </div>

        {/* Rankings list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
          {rankings.map((p, index) => {
            const isMe = p.userId === user?.id;
            const rankPosition = p.rank ?? index + 1;
            const score = Math.round(p.glickoRating ?? p.totalScore ?? 0);

            return (
              <div
                key={p.userId || index}
                onClick={() => setSelectedUser(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: isMe ? 'rgba(184, 70, 42, 0.08)' : 'var(--color-surface)',
                  border: isMe ? '1px solid var(--color-primary)' : '1px solid var(--color-line)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--color-ink-soft)' }}>
                  {rankPosition}
                </div>
                <Avatar name={p.username || '?'} avatarUrl={p.avatarUrl} hue={(rankPosition * 40) % 360} size={32} />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.username} {isMe && '(Toi)'}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {score}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 18, fontSize: 12.5, color: 'var(--color-ink-soft)' }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: currentPage === 0 ? 0.3 : 1 }}
            >
              ‹
            </button>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{currentPage + 1}</span> / {totalPages}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: currentPage >= totalPages - 1 ? 0.3 : 1 }}
            >
              ›
            </button>
          </div>
        )}

        <UserProfileModal
          visible={!!selectedUser}
          userId={selectedUser?.userId ?? null}
          username={selectedUser?.username}
          avatarUrl={selectedUser?.avatarUrl}
          score={Math.round(selectedUser?.glickoRating ?? selectedUser?.totalScore ?? 0)}
          rank={selectedUser?.rank}
          onClose={() => setSelectedUser(null)}
        />
      </div>
    </SafeScreen>
  );
}
