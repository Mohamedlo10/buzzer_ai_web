import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  UserPlus,
  Users,
  Check,
  X,
  UserCheck,
  Send,
  Trash2,
  Clock,
} from 'lucide-react-native';

import { useFriendStore } from '~/stores/useFriendStore';
import * as usersApi from '~/lib/api/users';
import type { UserResponse, FriendResponse, FriendRequestResponse } from '~/types/api';
import { palette } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

type TabType = 'friends' | 'requests' | 'search';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

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
    sendRequest,
    removeFriend,
  } = useFriendStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchFriends(), fetchPendingRequests(), fetchSentRequests()]);
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await usersApi.searchUsers(searchQuery);
        setSearchResults(results.content || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest(userId);
      setSentRequests((prev) => new Set(prev).add(userId));
      notify.success('Demande d\'ami envoyée !');
    } catch (err: any) {
      notifyApiError(err, "Impossible d'envoyer la demande");
    }
  };

  const handleAccept = async (reqId: string) => {
    try {
      await acceptRequest(reqId);
      notify.success('Demande acceptée !');
      await loadData();
    } catch (err: any) {
      notifyApiError(err, "Impossible d'accepter la demande");
    }
  };

  const handleDecline = async (reqId: string) => {
    try {
      await declineRequest(reqId);
      notify.info('Demande refusée');
      await loadData();
    } catch (err: any) {
      notifyApiError(err, 'Impossible de refuser la demande');
    }
  };

  const handleRemoveFriend = async (friend: FriendResponse) => {
    const ok = await confirmAsync({
      title: 'Supprimer un ami',
      message: `Êtes-vous sûr de vouloir retirer ${friend.username} de votre liste d'amis ?`,
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await removeFriend(friend.id);
      notify.success('Ami retiré');
      await loadData();
    } catch (err: any) {
      notifyApiError(err, "Impossible de retirer l'ami");
    }
  };

  const totalRequests = pendingRequests.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: palette.txt }}>
          Amis
        </Text>
      </View>

      {/* Tabs Bar */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 8,
          gap: 8,
          backgroundColor: palette.bg,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: activeTab === 'friends' ? palette.primary : palette.surface,
            borderWidth: 1,
            borderColor: activeTab === 'friends' ? palette.primary : palette.line,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: activeTab === 'friends' ? palette.primaryInk : palette.txt,
            }}
          >
            Mes Amis ({friends.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: activeTab === 'requests' ? palette.primary : palette.surface,
            borderWidth: 1,
            borderColor: activeTab === 'requests' ? palette.primary : palette.line,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: activeTab === 'requests' ? palette.primaryInk : palette.txt,
            }}
          >
            Demandes {totalRequests > 0 ? `(${totalRequests})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: activeTab === 'search' ? palette.primary : palette.surface,
            borderWidth: 1,
            borderColor: activeTab === 'search' ? palette.primary : palette.line,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: activeTab === 'search' ? palette.primaryInk : palette.txt,
            }}
          >
            Ajouter ＋
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <>
            {friends.length > 0 ? (
              friends.map((friend) => (
                <View
                  key={friend.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: palette.surface,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 14,
                    gap: 12,
                  }}
                >
                  <Avatar
                    name={friend.username}
                    avatarUrl={friend.avatarUrl}
                    size={42}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
                      {friend.username}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: friend.isOnline ? palette.good : palette.inkSoft,
                        }}
                      />
                      <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                        {friend.isOnline ? 'En ligne' : 'Hors ligne'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveFriend(friend)}
                    activeOpacity={0.7}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: palette.bad + '1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} color={palette.bad} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={32} color={palette.inkSoft} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
                  Aucun ami pour l'instant
                </Text>
                <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center', maxWidth: 260 }}>
                  Utilisez l'onglet « Ajouter » pour trouver des joueurs et les inviter.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Tab 2: Requests */}
        {activeTab === 'requests' && (
          <>
            {pendingRequests.length > 0 ? (
              pendingRequests.map((req) => (
                <View
                  key={req.id}
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 16,
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar
                      name={req.requester.username}
                      avatarUrl={req.requester.avatarUrl}
                      size={40}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
                        {req.requester.username}
                      </Text>
                      <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                        Demande d'ami reçue
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => handleAccept(req.id)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: palette.good,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                        Accepter
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDecline(req.id)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: palette.surface2,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <X size={16} color={palette.bad} strokeWidth={2.5} />
                      <Text style={{ color: palette.bad, fontWeight: '700', fontSize: 13 }}>
                        Refuser
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={32} color={palette.inkSoft} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
                  Aucune demande en attente
                </Text>
                <Text style={{ fontSize: 13, color: palette.inkSoft }}>
                  Vous êtes à jour dans vos invitations.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Tab 3: Search / Add Friends */}
        {activeTab === 'search' && (
          <View style={{ gap: 14 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: palette.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.line,
                paddingHorizontal: 14,
                paddingVertical: 8,
                gap: 10,
              }}
            >
              <Search size={18} color={palette.inkSoft} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher par nom d'utilisateur…"
                placeholderTextColor={palette.inkSoft}
                autoCapitalize="none"
                style={{
                  flex: 1,
                  color: palette.txt,
                  fontSize: 14,
                  paddingVertical: 6,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <X size={16} color={palette.inkSoft} />
                </TouchableOpacity>
              )}
            </View>

            {isSearching && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={palette.primary} />
              </View>
            )}

            {searchResults.length > 0 && (
              <View style={{ gap: 10 }}>
                {searchResults.map((searchUser) => {
                  const isSent = sentRequests.has(searchUser.id);
                  const isFriend = friends.some((f) => f.id === searchUser.id);

                  return (
                    <View
                      key={searchUser.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: palette.surface,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: palette.line,
                        padding: 14,
                        gap: 12,
                      }}
                    >
                      <Avatar
                        name={searchUser.username}
                        avatarUrl={searchUser.avatarUrl}
                        size={40}
                      />

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
                          {searchUser.username}
                        </Text>
                      </View>

                      {isFriend ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 9999,
                            backgroundColor: palette.good + '26',
                          }}
                        >
                          <UserCheck size={14} color={palette.good} />
                          <Text style={{ color: palette.good, fontSize: 12, fontWeight: '700' }}>
                            Ami
                          </Text>
                        </View>
                      ) : isSent ? (
                        <View
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 9999,
                            backgroundColor: palette.surface2,
                          }}
                        >
                          <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '600' }}>
                            Envoyée
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleSendRequest(searchUser.id)}
                          activeOpacity={0.8}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: palette.primary,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 12,
                          }}
                        >
                          <UserPlus size={14} color={palette.primaryInk} />
                          <Text style={{ color: palette.primaryInk, fontSize: 12, fontWeight: '700' }}>
                            Ajouter
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <Text style={{ textAlign: 'center', color: palette.inkSoft, fontSize: 13, marginTop: 16 }}>
                Aucun joueur trouvé pour « {searchQuery} »
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
