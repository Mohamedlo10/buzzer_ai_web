import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Users,
  X,
  ArrowRight,
  Shield,
} from 'lucide-react-native';


import { useFriendStore } from '~/stores/useFriendStore';
import * as usersApi from '~/lib/api/users';
import type { UserResponse } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { AppTopBar } from '~/components/shared/AppTopBar';
import { BlockedUsersModal } from '~/components/friend/BlockedUsersModal';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { LoadingState } from '~/components/ui/StateViews';

type FilterType = 'all' | 'online' | 'requests';

export default function FriendsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    friends,
    pendingRequests,
    sentRequests: storeSentRequests,
    blockedUsers,
    isLoading: isFriendsLoading,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    fetchBlockedUsers,
    acceptRequest,
    declineRequest,
    cancelRequest,
    sendRequest,
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

  // Live search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 400);
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
      notify.success('Demande envoyée !');
    } catch (err: any) {
      notifyApiError(err, "Impossible d'envoyer la demande");
    }
  };

  const onlineFriends = friends.filter((f) => f.isOnline);
  const totalRequests = pendingRequests.length + storeSentRequests.length;
  const displayedFriends = filter === 'online' ? onlineFriends : friends;

  // Affiche un chargement centré lors du premier chargement (liste vide + spinner actif)
  if (isFriendsLoading && friends.length === 0 && pendingRequests.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <AppTopBar title="Xalaat" tag="AMIS & DUELS" />
        <LoadingState label="Chargement de vos amis…" fullScreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <AppTopBar title="Xalaat" tag="AMIS & DUELS" />

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 6 }}>
        {/* ── Search Bar + Quick Blocked Action ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: searchQuery ? palette.primary : palette.line,
              paddingHorizontal: 14,
              paddingVertical: 10,
              gap: 10,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <Search size={17} color={searchQuery ? palette.primary : palette.inkSoft} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher ou ajouter un joueur…"
              placeholderTextColor={palette.inkSoft}
              style={{
                flex: 1,
                color: palette.txt,
                fontSize: 14,
                padding: 0,
              }}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <X size={16} color={palette.inkSoft} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Shield Button for Blocked Users */}
          <TouchableOpacity
            onPress={() => setIsBlockedModalOpen(true)}
            activeOpacity={0.8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: blockedUsers.length > 0 ? palette.bad + '18' : palette.surface,
              borderWidth: 1,
              borderColor: blockedUsers.length > 0 ? palette.bad + '40' : palette.line,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Shield size={18} color={blockedUsers.length > 0 ? palette.bad : palette.inkSoft} />
            {blockedUsers.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: palette.bad,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '700' }}>
                  {blockedUsers.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── If Searching: Live Search Results ── */}
        {searchQuery.trim().length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Résultats de recherche
              </Text>
              {isSearching && <ActivityIndicator size="small" color={palette.primary} />}
            </View>

            {searchResults.length === 0 && !isSearching ? (
              <View style={{ backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.line, padding: 32, alignItems: 'center', gap: 6 }}>
                <Users size={32} color={palette.inkSoft} />
                <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 15, color: palette.txt, paddingTop: 4 }}>
                  Aucun joueur trouvé
                </Text>
                <Text style={{ fontSize: 12.5, color: palette.inkSoft }}>
                  Vérifiez l'orthographe du pseudo recherché.
                </Text>
              </View>
            ) : (
              searchResults.map((u) => (
                <View
                  key={u.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: palette.surface,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 14,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => router.push(`/profile/${u.id}` as any)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}
                  >
                    <Avatar name={u.username} avatarUrl={u.avatarUrl} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.display,
                          fontSize: 15,
                          color: palette.txt,
                          paddingTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {u.username}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: palette.primary, marginTop: 1, fontWeight: '600' }}>
                        Voir le profil →
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSendRequest(u.id)}
                    disabled={sentRequests.has(u.id)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: sentRequests.has(u.id) ? palette.surface2 : palette.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 9999,
                    }}
                  >
                    <Text
                      style={{
                        color: sentRequests.has(u.id) ? palette.inkSoft : palette.primaryInk,
                        fontSize: 12.5,
                        fontWeight: '700',
                      }}
                    >
                      {sentRequests.has(u.id) ? 'Envoyé ✓' : '+ Ajouter'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          /* ── Main Social Hub (No search active) ── */
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
            {/* ── Filter Chips Bar with Tous, En ligne, Demandes ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Tous */}
              <TouchableOpacity
                onPress={() => setFilter('all')}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 9999,
                  backgroundColor: filter === 'all' ? palette.primary : palette.surface,
                  borderWidth: 1,
                  borderColor: filter === 'all' ? palette.primary : palette.line,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: filter === 'all' ? palette.primaryInk : palette.txt,
                  }}
                >
                  Tous ({friends.length})
                </Text>
              </TouchableOpacity>

              {/* En ligne */}
              <TouchableOpacity
                onPress={() => setFilter('online')}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 9999,
                  backgroundColor: filter === 'online' ? palette.primary : palette.surface,
                  borderWidth: 1,
                  borderColor: filter === 'online' ? palette.primary : palette.line,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: filter === 'online' ? palette.primaryInk : palette.good,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: filter === 'online' ? palette.primaryInk : palette.txt,
                  }}
                >
                  En ligne ({onlineFriends.length})
                </Text>
              </TouchableOpacity>

              {/* Demandes */}
              <TouchableOpacity
                onPress={() => setFilter('requests')}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 9999,
                  backgroundColor: filter === 'requests' ? palette.primary : palette.surface,
                  borderWidth: 1,
                  borderColor: filter === 'requests' ? palette.primary : palette.line,
                }}
              >
                {pendingRequests.length > 0 && (
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: filter === 'requests' ? palette.primaryInk : palette.warn,
                    }}
                  />
                )}
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: filter === 'requests' ? palette.primaryInk : palette.txt,
                  }}
                >
                  Demandes ({totalRequests})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── View when Filter === 'requests' ── */}
            {filter === 'requests' ? (
              <View style={{ gap: 12 }}>
                {/* Reçues */}
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4 }}>
                    Demandes reçues ({pendingRequests.length})
                  </Text>

                  {pendingRequests.length === 0 ? (
                    <View style={{ backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.line, padding: 24, alignItems: 'center' }}>
                      <Text style={{ color: palette.inkSoft, fontSize: 13 }}>
                        Aucune demande reçue
                      </Text>
                    </View>
                  ) : (
                    pendingRequests.map((req) => (
                      <View
                        key={req.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: palette.surface,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: palette.line,
                          padding: 14,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => router.push(`/profile/${req.requester.id}` as any)}
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}
                        >
                          <Avatar name={req.requester.username} avatarUrl={req.requester.avatarUrl} size={38} />
                          <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: palette.txt, paddingTop: 2 }}>
                            {req.requester.username}
                          </Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => acceptRequest(req.id)}
                            activeOpacity={0.8}
                            style={{
                              backgroundColor: palette.primary,
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              borderRadius: 9999,
                            }}
                          >
                            <Text style={{ color: palette.primaryInk, fontSize: 12, fontWeight: '700' }}>
                              Accepter
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => declineRequest(req.id)}
                            activeOpacity={0.8}
                            style={{
                              backgroundColor: palette.surface2,
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              borderRadius: 9999,
                            }}
                          >
                            <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>
                              Refuser
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* Envoyées */}
                {storeSentRequests.length > 0 && (
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4 }}>
                      Demandes envoyées ({storeSentRequests.length})
                    </Text>

                    {storeSentRequests.map((req) => (
                      <View
                        key={req.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: palette.surface,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: palette.line,
                          padding: 14,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => router.push(`/profile/${req.receiver.id}` as any)}
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}
                        >
                          <Avatar name={req.receiver.username} avatarUrl={req.receiver.avatarUrl} size={38} />
                          <View>
                            <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: palette.txt, paddingTop: 2 }}>
                              {req.receiver.username}
                            </Text>
                            <Text style={{ fontSize: 11, color: palette.inkSoft }}>
                              En attente de réponse
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => cancelRequest(req.id)}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: palette.surface2,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 9999,
                          }}
                        >
                          <Text style={{ color: palette.bad, fontSize: 12, fontWeight: '700' }}>
                            Annuler
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              /* ── Friends List (Tous / En ligne) ── */
              displayedFriends.length === 0 ? (
                <View
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 32,
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: palette.primary + '18',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Users size={28} color={palette.primary} />
                  </View>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      fontSize: 17,
                      color: palette.txt,
                      paddingTop: 4,
                    }}
                  >
                    {filter === 'online' ? 'Aucun ami en ligne' : 'Aucun ami pour le moment'}
                  </Text>
                  <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 }}>
                    {filter === 'online'
                      ? 'Vos amis apparaîtront ici dès qu’ils se connectent.'
                      : 'Recherchez des joueurs ci-dessus pour lancer des parties et des duels de buzzer !'}
                  </Text>
                </View>
              ) : (
                displayedFriends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    onPress={() => router.push(`/profile/${friend.id}` as any)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: palette.surface,
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: palette.line,
                      padding: 14,
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 }}>
                      <View style={{ position: 'relative' }}>
                        <Avatar name={friend.username} avatarUrl={friend.avatarUrl} size={46} />
                        {friend.isOnline && (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 13,
                              height: 13,
                              borderRadius: 6.5,
                              backgroundColor: palette.good,
                              borderWidth: 2.5,
                              borderColor: palette.surface,
                            }}
                          />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: font.nativeFamily.display,
                            fontSize: 15.5,
                            color: palette.txt,
                            paddingTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {friend.username}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text
                            style={{
                              fontSize: 11.5,
                              color: friend.isOnline ? palette.good : palette.inkSoft,
                              fontWeight: friend.isOnline ? '700' : '500',
                            }}
                          >
                            {friend.isOnline ? 'En ligne' : 'Hors ligne'}
                          </Text>
                          {friend.globalRank != null && friend.globalRank > 0 && (
                            <>
                              <Text style={{ fontSize: 11, color: palette.inkSoft }}>•</Text>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: palette.primary }}>
                                Rang #{friend.globalRank}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 9999,
                          backgroundColor: palette.surface2,
                        }}
                      >
                        <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>
                          Profil
                        </Text>
                      </View>
                      <ArrowRight size={15} color={palette.inkSoft} />
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Blocked Users Bottom Sheet Modal ── */}
      <BlockedUsersModal
        visible={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
      />
    </View>
  );
}
