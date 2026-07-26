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
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'public' | 'my'>('all');
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<any>(null);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isSubmittingPasscode, setIsSubmittingPasscode] = useState(false);

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

  if (!mounted || !visible) return null;

  const allRooms = data?.recentRooms || [];

  const filteredRooms = allRooms.filter((room) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      room.name.toLowerCase().includes(query) ||
      room.code.toLowerCase().includes(query) ||
      (room.ownerName && room.ownerName.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    if (activeFilter === 'active') return !!room.hasActiveSession;
    if (activeFilter === 'public') return !(room as any).isPrivate;
    if (activeFilter === 'my') return (room as any).isOwner;
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'var(--scrim)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '85vh',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--card-radius)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-[pop_.25s_ease-out_both]"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--color-line)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, margin: 0 }}>
              Rechercher un salon
            </h3>
            <div style={{ fontSize: 11.5, color: 'var(--color-ink-soft)', marginTop: 2 }}>
              Rejoins ou consulte les salons de la communauté
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-2)',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-ink-soft)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          {/* Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-pill)',
              padding: '10px 14px',
              marginBottom: 14,
            }}
          >
            <Search size={16} style={{ color: 'var(--color-ink-soft)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, hôte ou code…"
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
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }} className="scrollbar-hide">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'active', label: 'En direct 🔴' },
              { id: 'public', label: 'Publics 🌐' },
              { id: 'my', label: 'Mes salons 🔑' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as any)}
                style={{
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  background: activeFilter === f.id ? 'var(--color-primary)' : 'transparent',
                  color: activeFilter === f.id ? 'var(--color-primary-ink)' : 'var(--color-ink)',
                  border: activeFilter === f.id ? 'none' : '1px solid var(--color-line)',
                  fontWeight: 500,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleJoinClick(room)}
                  style={{
                    background: 'var(--color-bg)',
                    borderRadius: 14,
                    border: '1px solid var(--color-line)',
                    padding: 14,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={room.ownerName} size={34} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>
                          {room.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>
                          Hôte: {room.ownerName}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--color-accent)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(232, 166, 48, 0.12)',
                        fontWeight: 700,
                      }}
                    >
                      #{room.code}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--color-ink-soft)' }}>
                    <span>👥 {room.memberCount} membres {room.hasActiveSession ? '· 🔴 En direct' : ''}</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Rejoindre →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-ink-soft)', fontSize: 13 }}>
              Aucun salon correspondant
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
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-display)' }}>Salon privé #{selectedPrivateRoom.code}</h4>
              <button
                type="button"
                onClick={() => setSelectedPrivateRoom(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePasscodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Mot de passe du salon"
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-line)',
                  color: 'var(--color-ink)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {passcodeError && (
                <div style={{ color: 'var(--color-primary)', fontSize: 12 }}>{passcodeError}</div>
              )}
              <button
                type="submit"
                disabled={isSubmittingPasscode || !passcode.trim()}
                style={{
                  padding: '12px 0',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-ink)',
                  fontWeight: 700,
                  fontSize: 14,
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
