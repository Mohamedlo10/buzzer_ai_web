'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowLeft, Users, Lock, Globe, Plus, Play } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { PatternLozenge } from '~/components/shared/PatternLozenge';
import { Avatar } from '~/components/shared/Avatar';

import * as roomsApi from '~/lib/api/rooms';
import * as dashboardApi from '~/lib/api/dashboard';
import { useAuthStore } from '~/stores/useAuthStore';

type FilterType = 'all' | 'active' | 'public' | 'my';

export interface UICombinedRoom {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  memberCount: number;
  hasActiveSession?: boolean;
  isPrivate?: boolean;
  isOwner?: boolean;
}

export default function AllRoomsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [rooms, setRooms] = useState<UICombinedRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Access code modal for private rooms
  const [selectedRoom, setSelectedRoom] = useState<UICombinedRoom | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const [dashV2, userRooms] = await Promise.all([
        dashboardApi.getDashboardV2().catch(() => null),
        roomsApi.getUserRooms().catch(() => []),
      ]);

      const map = new Map<string, UICombinedRoom>();

      if (dashV2?.recentRooms) {
        dashV2.recentRooms.forEach((r) => {
          map.set(r.id, {
            id: r.id,
            name: r.name,
            code: r.code,
            ownerName: r.ownerName,
            memberCount: r.memberCount,
            hasActiveSession: r.hasActiveSession,
            isOwner: r.ownerName === user?.username,
          });
        });
      }

      userRooms.forEach((r) => {
        map.set(r.id, {
          id: r.id,
          name: r.name,
          code: r.code,
          ownerName: r.ownerName,
          memberCount: r.memberCount,
          hasActiveSession: r.hasActiveSession,
          isOwner: r.ownerId === user?.id || r.ownerName === user?.username,
        });
      });

      setRooms(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  const handleJoinClick = (room: UICombinedRoom) => {
    if (room.isPrivate) {
      setSelectedRoom(room);
      setAccessCodeInput('');
      setJoinError(null);
    } else {
      router.push(`/room/${room.id}`);
    }
  };

  const handleConfirmCodeJoin = async () => {
    if (!selectedRoom || !accessCodeInput.trim()) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      await roomsApi.joinRoom(accessCodeInput.trim().toUpperCase());
      router.push(`/room/${selectedRoom.id}`);
    } catch (err: any) {
      setJoinError(err?.response?.data?.message || 'Code d&apos;accès incorrect');
    } finally {
      setIsJoining(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = r.name?.toLowerCase().includes(q);
      const matchOwner = r.ownerName?.toLowerCase().includes(q);
      const matchCode = r.code?.toLowerCase().includes(q);
      if (!matchName && !matchOwner && !matchCode) return false;
    }

    if (activeFilter === 'active') return !!r.hasActiveSession;
    if (activeFilter === 'my') return !!r.isOwner;
    if (activeFilter === 'public') return !r.isPrivate;

    return true;
  });

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center min-h-[100dvh]">
        <Spinner size="large" text="Chargement de tous les salons…" />
      </SafeScreen>
    );
  }

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
          padding: '12px 20px 28px',
        }}
        className="overflow-y-auto"
      >
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => router.push('/rooms')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-ink)',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-display-weight)' as any,
                fontSize: 24,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Tous les salons
            </h1>
            <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
              {filteredRooms.length} salons disponibles
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/room/create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--color-primary)',
              color: 'var(--color-primary-ink)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '9px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            <span>Nouveau</span>
          </button>
        </div>

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
            marginBottom: 16,
          }}
        >
          <Search size={16} style={{ opacity: 0.6 }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, hôte ou code…"
            style={{
              flex: 1,
              fontSize: 13.5,
              color: 'var(--color-ink)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={14} className="text-txt-60" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            marginBottom: 18,
            paddingBottom: 4,
          }}
          className="scrollbar-hide"
        >
          {[
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'En direct 🔴' },
            { id: 'public', label: 'Publics 🌐' },
            { id: 'my', label: 'Mes salons 🔑' },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as FilterType)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: isActive ? 'var(--color-primary-ink)' : 'var(--color-ink-soft)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: 'none',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Rooms List */}
        {filteredRooms.length === 0 ? (
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--card-radius)',
              border: '1px solid var(--color-line)',
              padding: '36px 20px',
              textAlign: 'center',
            }}
          >
            <Users size={36} className="text-txt-40 mx-auto mb-3" />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Aucun salon trouvé
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
              Essaye avec d&apos;autres termes de recherche ou crée un nouveau salon.
            </div>
            <button
              onClick={() => router.push('/room/create')}
              type="button"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-primary-ink)',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Créer un salon +
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredRooms.map((room) => {
              const isLive = !!room.hasActiveSession;

              return (
                <div
                  key={room.id}
                  onClick={() => handleJoinClick(room)}
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--card-radius)',
                    border: '1px solid var(--color-line)',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                  }}
                  className="hover:opacity-90"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={room.ownerName || 'Hôte'} size={36} />
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 'var(--font-display-weight)' as any,
                            fontSize: 16,
                            letterSpacing: '-0.015em',
                          }}
                        >
                          {room.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-ink-soft)' }}>
                          Hôte : {room.ownerName}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isLive && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: '#FFFFFF',
                            background: '#D14A2E',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          ● EN DIRECT
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--color-ink-soft)',
                          background: 'var(--color-surface-2)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        {room.isPrivate ? <Lock size={12} style={{ display: 'inline' }} /> : <Globe size={12} style={{ display: 'inline' }} />}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--color-ink-soft)' }}>
                      <span>👥 {room.memberCount || 1} membre{(room.memberCount || 1) > 1 ? 's' : ''}</span>
                      <span>· Code : <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>{room.code}</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinClick(room);
                      }}
                      style={{
                        background: isLive ? 'var(--color-primary)' : 'var(--color-surface-2)',
                        color: isLive ? 'var(--color-primary-ink)' : 'var(--color-ink)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '7px 14px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {isLive ? 'Rejoindre 🔴' : 'Accéder →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Access Code Modal */}
      {selectedRoom && (
        <div
          className="fixed inset-0 bg-scrim/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            className="bg-surface rounded-2xl border border-line p-6 w-full max-w-xs text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              Salon privé
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
              Entre le code d&apos;accès pour rejoindre &quot;{selectedRoom.name}&quot;
            </div>

            <input
              type="text"
              value={accessCodeInput}
              onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
              placeholder="Ex: 7B2K"
              maxLength={10}
              style={{
                width: '100%',
                textAlign: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                letterSpacing: '0.15em',
                padding: '10px',
                borderRadius: 'var(--card-radius)',
                border: '1px solid var(--color-line)',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                marginBottom: 12,
                outline: 'none',
              }}
            />

            {joinError && (
              <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 700, marginBottom: 12 }}>
                {joinError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setSelectedRoom(null)}
                type="button"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-ink)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmCodeJoin}
                disabled={isJoining || !accessCodeInput.trim()}
                type="button"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-ink)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  opacity: isJoining || !accessCodeInput.trim() ? 0.5 : 1,
                }}
              >
                {isJoining ? '...' : 'Rejoindre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SafeScreen>
  );
}
