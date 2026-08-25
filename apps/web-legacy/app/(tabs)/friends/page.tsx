'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, UserPlus, Users, X } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { FriendCard } from '~/components/friend/FriendCard';
import { FriendRequestCard } from '~/components/friend/FriendRequestCard';
import { useFriendStore } from '~/stores/useFriendStore';
import { wsManager } from '~/lib/websocket';
import * as usersApi from '~/lib/api/users';
import type { UserResponse } from '~/types/api';

import { PatternLozenge } from '~/components/shared/PatternLozenge';
import { Avatar } from '~/components/shared/Avatar';
import { UserProfileModal } from '~/components/shared/UserProfileModal';
import { notifyApiError } from '~/lib/ui/notify';

type TabType = 'friends' | 'requests' | 'blocked' | 'search';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [selectedUserModal, setSelectedUserModal] = useState<{ id: string; username: string; avatarUrl?: string | null } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    friends,
    pendingRequests,
    sentRequests: storeSentRequests,
    blockedUsers,
    isLoading,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    fetchBlockedUsers,
    acceptRequest,
    declineRequest,
    cancelRequest,
    sendRequest,
    unblockUser,
  } = useFriendStore();

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchFriends(),
      fetchPendingRequests(),
      fetchSentRequests(),
      fetchBlockedUsers(),
    ]);
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests, fetchBlockedUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = wsManager.subscribe((event: any) => {
      if (event.type === '_connection_change' && event.connected) {
        setTimeout(() => fetchFriends(), 500);
      }
    });
    return unsubscribe;
  }, [fetchFriends]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await usersApi.searchUsers(query);
      setSearchResults(results.content || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest(userId);
      setSentRequests((prev) => new Set(prev).add(userId));
    } catch (err: any) {
      notifyApiError(err, "Impossible d'envoyer la demande");
    }
  };

  const totalRequests = pendingRequests.length + storeSentRequests.length;

  return (
    <SafeScreen className="bg-transparent relative flex flex-col flex-1">
      {/* Main Content Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '12px 20px 120px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--font-display-weight)' as any,
            fontSize: 26,
            letterSpacing: '-0.02em',
            margin: '4px 0 18px',
          }}
        >
          Amis
        </h1>

        {/* Tab switch pills */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-pill)',
            padding: 4,
            marginBottom: 18,
          }}
        >
          {[
            { id: 'friends', label: `Amis (${friends.length})` },
            { id: 'requests', label: `Demandes${totalRequests > 0 ? ` (${totalRequests})` : ''}` },
            { id: 'blocked', label: `Bloqués${blockedUsers.length > 0 ? ` (${blockedUsers.length})` : ''}` },
            { id: 'search', label: 'Recherche' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '9px 0',
                  borderRadius: 'var(--radius-pill)',
                  background: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'var(--color-primary-ink)' : 'var(--color-ink-soft)',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Tabs */}
        {isLoading ? (
          <Spinner text="Chargement..." className="py-12" />
        ) : (
          <>
            {activeTab === 'friends' && (
              friends.length === 0 ? (
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
                    Aucun ami
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
                    Ajoute des amis pour les défier en duel.
                  </div>
                  <button
                    onClick={() => setActiveTab('search')}
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
                    Rechercher des amis
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {friends.map((friend, i) => (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedUserModal({ id: friend.id, username: friend.username, avatarUrl: friend.avatarUrl })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-line)',
                        borderRadius: 'var(--card-radius)',
                        padding: 14,
                        cursor: 'pointer',
                      }}
                      className="hover:bg-surface-2/40 transition-colors"
                    >
                      <Avatar name={friend.username} avatarUrl={friend.avatarUrl} hue={30 + i * 40} size={42} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 'var(--font-display-weight)' as any,
                            fontSize: 15,
                          }}
                        >
                          {friend.username}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                          {friend.isOnline ? 'En ligne' : 'Hors ligne'}{' '}
                          {friend.globalRank != null && (
                            <>
                              · <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>#{friend.globalRank}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'requests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingRequests.map((req) => (
                  <FriendRequestCard
                    key={req.id}
                    type="received"
                    request={req}
                    onAccept={() => acceptRequest(req.id)}
                    onDecline={() => declineRequest(req.id)}
                  />
                ))}
                {storeSentRequests.map((req) => (
                  <FriendRequestCard
                    key={req.id}
                    type="sent"
                    request={req}
                    onCancel={() => cancelRequest(req.id)}
                  />
                ))}
                {pendingRequests.length === 0 && storeSentRequests.length === 0 && (
                  <div
                    style={{
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--card-radius)',
                      border: '1px solid var(--color-line)',
                      padding: 32,
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--color-ink-soft)',
                    }}
                  >
                    Aucune demande en attente
                  </div>
                )}
              </div>
            )}

            {activeTab === 'blocked' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {blockedUsers.length === 0 ? (
                  <div
                    style={{
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--card-radius)',
                      border: '1px solid var(--color-line)',
                      padding: 32,
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--color-ink-soft)',
                    }}
                  >
                    Aucun utilisateur bloqué
                  </div>
                ) : (
                  blockedUsers.map((user, i) => (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-line)',
                        borderRadius: 'var(--card-radius)',
                        padding: 14,
                      }}
                    >
                      <Avatar name={user.username} avatarUrl={user.avatarUrl} hue={30 + i * 40} size={42} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
                          {user.username}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-bad)', fontWeight: 600 }}>
                          Bloqué
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => unblockUser(user.id)}
                        style={{
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-line)',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: 'var(--color-txt)',
                        }}
                      >
                        Débloquer
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div>
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
                    placeholder="Rechercher un pseudo…"
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: 'var(--color-ink)',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                  />
                </div>

                {searchResults.map((u, i) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserModal({ id: u.id, username: u.username, avatarUrl: u.avatarUrl })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-line)',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      cursor: 'pointer',
                    }}
                    className="hover:bg-surface-2/40 transition-colors"
                  >
                    <Avatar name={u.username} avatarUrl={u.avatarUrl} hue={20 + i * 35} size={36} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700 }}>
                      {u.username}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendRequest(u.id);
                      }}
                      style={{
                        background: 'var(--color-primary)',
                        color: 'var(--color-primary-ink)',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ajouter +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <UserProfileModal
        visible={!!selectedUserModal}
        userId={selectedUserModal?.id ?? null}
        username={selectedUserModal?.username}
        avatarUrl={selectedUserModal?.avatarUrl}
        onClose={() => setSelectedUserModal(null)}
      />
    </SafeScreen>
  );
}
