'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Search, Lock, Globe, Radio, Key } from 'lucide-react';
import { Avatar } from './Avatar';
import { useDashboardV2 } from '~/lib/query/hooks';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';

interface AllRoomsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllRoomsModal({ visible, onClose }: AllRoomsModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useDashboardV2();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active'>('all');
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<any>(null);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isSubmittingPasscode, setIsSubmittingPasscode] = useState(false);

  const [fetchedRooms, setFetchedRooms] = useState<any[]>([]);
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  // Fetch rooms dynamically when modal opens
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;

    async function loadRoomsData() {
      setIsFetchingRooms(true);
      try {
        const [userRooms, searchRes] = await Promise.all([
          roomsApi.getUserRooms().catch(() => []),
          roomsApi.searchRooms({ size: 50 }).catch(() => null),
        ]);

        if (!isMounted) return;

        const publicRooms = searchRes?.content || [];
        const roomMap = new Map<string, any>();

        (data?.recentRooms || []).forEach((r) => roomMap.set(r.id, r));
        userRooms.forEach((r) => roomMap.set(r.id, { ...r, isMember: true }));
        publicRooms.forEach((r) => {
          if (!roomMap.has(r.id)) roomMap.set(r.id, r);
        });

        setFetchedRooms(Array.from(roomMap.values()));
      } catch (err) {
        console.error('Failed to load rooms in modal:', err);
      } finally {
        if (isMounted) setIsFetchingRooms(false);
      }
    }

    loadRoomsData();
    return () => {
      isMounted = false;
    };
  }, [visible, data?.recentRooms]);

  if (!mounted || !visible) return null;

  const allRooms = fetchedRooms.length > 0 ? fetchedRooms : (data?.recentRooms || []);

  const filteredRooms = allRooms.filter((room) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      room.name.toLowerCase().includes(query) ||
      room.code.toLowerCase().includes(query) ||
      (room.ownerName && room.ownerName.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    if (activeFilter === 'active') return !!room.hasActiveSession;
    return true;
  });

  const handleJoinClick = (room: any) => {
    if ((room as any).isPrivate && !(room as any).isMember && !(room as any).isOwner) {
      setSelectedPrivateRoom(room);
      setPasscode('');
      setPasscodeError(null);
      return;
    }
    onClose();
    router.push(`/room/${room.id}`);
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrivateRoom || !passcode.trim()) return;

    setIsSubmittingPasscode(true);
    setPasscodeError(null);

    try {
      const trimmedCode = selectedPrivateRoom.code.toUpperCase();
      const sessionCheck = await sessionsApi.joinCheck(trimmedCode).catch(() => null);

      if (sessionCheck?.session?.id) {
        await appStorage.setActiveSession({
          sessionId: sessionCheck.session.id,
          code: trimmedCode,
        });
      }

      await roomsApi.joinRoom(trimmedCode);
      setSelectedPrivateRoom(null);
      onClose();
      router.push(`/room/${selectedPrivateRoom.id}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setPasscodeError('Mot de passe incorrect');
      } else {
        setPasscodeError(err?.response?.data?.message || 'Impossible de rejoindre ce salon');
      }
    } finally {
      setIsSubmittingPasscode(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'var(--scrim)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          height: '88vh',
          maxHeight: '92vh',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-line)',
          borderLeft: '1px solid var(--color-line)',
          borderRight: '1px solid var(--color-line)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-[slideUp_0.3s_ease-out_both]"
      >
        {/* Handle indicator bar */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-line)', margin: '10px auto 4px', opacity: 0.8 }} className="shrink-0" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 14px', borderBottom: '1px solid var(--color-line)' }} className="shrink-0">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, margin: 0 }}>
              Tous les salons
            </h3>
            <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2 }}>
              Rejoins ou consulte les salons de la communauté ({filteredRooms.length})
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-2)',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-ink-soft)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body - scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 30px' }} className="flex-1 overflow-y-auto">
          {/* Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-pill)',
              padding: '11px 16px',
              marginBottom: 14,
            }}
          >
            <Search size={16} style={{ color: 'var(--color-ink-soft)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom du salon, hôte ou code…"
              style={{
                flex: 1,
                fontSize: 14,
                color: 'var(--color-ink)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }} className="scrollbar-hide">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'active', label: 'En direct 🔴' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as any)}
                style={{
                  fontSize: 12,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: activeFilter === f.id ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: activeFilter === f.id ? 'var(--color-primary-ink)' : 'var(--color-ink)',
                  border: activeFilter === f.id ? 'none' : '1px solid var(--color-line)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Rooms List */}
          {filteredRooms.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleJoinClick(room)}
                  style={{
                    background: 'var(--color-bg)',
                    borderRadius: 16,
                    border: '1px solid var(--color-line)',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:opacity-95 hover:border-primary/50"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={room.ownerName || 'Owner'} size={38} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                          {room.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 1 }}>
                          Hôte: {room.ownerName || 'Anonyme'}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--color-accent)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(232, 166, 48, 0.12)',
                        fontWeight: 700,
                      }}
                    >
                      #{room.code}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--color-ink-soft)', paddingTop: 6, borderTop: '1px solid var(--color-line)' }}>
                    <span>👥 {room.memberCount ?? 1} membre{(room.memberCount ?? 1) > 1 ? 's' : ''} {room.hasActiveSession ? '· 🔴 En direct' : ''}</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Rejoindre →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-ink-soft)', fontSize: 14 }}>
              {isFetchingRooms || isLoading ? 'Chargement des salons…' : 'Aucun salon correspondant'}
            </div>
          )}
        </div>

        {/* Private room password sub-modal */}
        {selectedPrivateRoom && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: 'var(--color-surface)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Salon privé #{selectedPrivateRoom.code}</h4>
              <button
                type="button"
                onClick={() => setSelectedPrivateRoom(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasscodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Mot de passe du salon"
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-line)',
                  color: 'var(--color-ink)',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
              {passcodeError && (
                <div style={{ color: 'var(--color-primary)', fontSize: 13 }}>{passcodeError}</div>
              )}
              <button
                type="submit"
                disabled={isSubmittingPasscode || !passcode.trim()}
                style={{
                  padding: '14px 0',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-ink)',
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Rejoindre le salon
              </button>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
