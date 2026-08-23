import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, UserPlus, Users, X, Check, ArrowRight } from 'lucide-react-native';

import { useFriendStore } from '~/stores/useFriendStore';
import * as usersApi from '~/lib/api/users';
import type { UserResponse } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { notify, notifyApiError } from '~/lib/ui/notify';

type TabType = 'friends' | 'requests' | 'search';

export default function FriendsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    friends,
    pendingRequests,
    sentRequests: storeSentRequests,
    isLoading,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    acceptRequest,
    declineRequest,
    cancelRequest,
    sendRequest,
  } = useFriendStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchFriends(), fetchPendingRequests(), fetchSentRequests()]);
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);
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

  const totalRequests = pendingRequests.length + storeSentRequests.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10 }}>
        {/* Header */}
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 26,
            letterSpacing: -0.4,
            color: palette.txt,
            marginBottom: 14,
          }}
        >
          Amis
        </Text>

        {/* Tab Switch Pills */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: palette.surface2,
            borderRadius: 9999,
            padding: 4,
            marginBottom: 16,
            gap: 4,
          }}
        >
          {[
            { id: 'friends', label: `Amis (${friends.length})` },
            { id: 'requests', label: `Demandes${totalRequests > 0 ? ` (${totalRequests})` : ''}` },
            { id: 'search', label: 'Recherche' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as TabType)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: isActive ? palette.primary : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: isActive ? palette.primaryInk : palette.inkSoft,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        {isLoading && friends.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 110 }}>
            {activeTab === 'friends' && (
              friends.length === 0 ? (
                <View
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 32,
                    alignItems: 'center',
                  }}
                >
                  <Users size={40} color={palette.inkSoft} style={{ marginBottom: 12 }} />
                  <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt, marginBottom: 4 }}>
                    Aucun ami pour le moment
                  </Text>
                  <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center', marginBottom: 16 }}>
                    Ajoute des amis pour les défier en duel de buzzer !
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab('search')}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: palette.primary,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ color: palette.primaryInk, fontSize: 13, fontWeight: '700' }}>
                      Rechercher des amis
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    onPress={() => router.push(`/profile/${friend.id}` as any)}
                    activeOpacity={0.85}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={{ position: 'relative' }}>
                        <Avatar name={friend.username} avatarUrl={friend.avatarUrl} size={42} />
                        {friend.isOnline && (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: palette.good,
                              borderWidth: 2,
                              borderColor: palette.surface,
                            }}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: font.nativeFamily.display,
                            fontSize: 15,
                            color: palette.txt,
                          }}
                          numberOfLines={1}
                        >
                          {friend.username}
                        </Text>
                        <Text style={{ fontSize: 11.5, color: friend.isOnline ? palette.good : palette.inkSoft, marginTop: 2 }}>
                          {friend.isOnline ? 'En ligne' : 'Hors ligne'}
                        </Text>
                      </View>
                    </View>

                    <ArrowRight size={16} color={palette.inkSoft} />
                  </TouchableOpacity>
                ))
              )
            )}

            {activeTab === 'requests' && (
              pendingRequests.length === 0 && storeSentRequests.length === 0 ? (
                <View
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 32,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: palette.inkSoft, fontSize: 13.5 }}>
                    Aucune demande en attente
                  </Text>
                </View>
              ) : (
                <>
                  {pendingRequests.map((req) => (
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Avatar name={req.requester.username} avatarUrl={req.requester.avatarUrl} size={38} />
                        <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: palette.txt }}>
                          {req.requester.username}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => acceptRequest(req.id)}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: palette.primary,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 9999,
                          }}
                        >
                          <Text style={{ color: palette.primaryInk, fontSize: 12, fontWeight: '700' }}>Accepter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => declineRequest(req.id)}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: palette.surface2,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 9999,
                          }}
                        >
                          <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>Refuser</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )
            )}

            {activeTab === 'search' && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: palette.surface,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: palette.line,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <Search size={16} color={palette.inkSoft} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher par pseudo…"
                    placeholderTextColor={palette.inkSoft}
                    style={{ flex: 1, color: palette.txt, fontSize: 13.5 }}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                      <X size={16} color={palette.inkSoft} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {isSearching ? (
                  <ActivityIndicator size="small" color={palette.primary} style={{ marginTop: 20 }} />
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Avatar name={u.username} avatarUrl={u.avatarUrl} size={38} />
                        <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: palette.txt }}>
                          {u.username}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleSendRequest(u.id)}
                        disabled={sentRequests.has(u.id)}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: sentRequests.has(u.id) ? palette.surface2 : palette.primary,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 9999,
                        }}
                      >
                        <Text
                          style={{
                            color: sentRequests.has(u.id) ? palette.inkSoft : palette.primaryInk,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          {sentRequests.has(u.id) ? 'Envoyé ✓' : '+ Ajouter'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
