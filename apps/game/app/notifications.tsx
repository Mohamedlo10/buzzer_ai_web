import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Bell,
  UserPlus,
  Gamepad2,
  Check,
  X,
  DoorOpen,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useNotifications } from '~/lib/query/hooks';
import { queryKeys } from '~/lib/query/keys';
import * as friendsApi from '~/lib/api/friends';
import * as invitationsApi from '~/lib/api/invitations';
import * as roomsApi from '~/lib/api/rooms';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import type {
  NotificationFriendRequest,
  NotificationGameInvitation,
  NotificationRoomInvitation,
} from '~/types/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useNotifications();

  useEffect(() => {
    refetch();
  }, []);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardV2 });
    qc.invalidateQueries({ queryKey: queryKeys.friends });
    qc.invalidateQueries({ queryKey: queryKeys.pendingRequests });
  };

  const handleAcceptFriend = async (requestId: string) => {
    try {
      await friendsApi.acceptFriendRequest(requestId);
      notify.success('Demande d\'ami acceptée !');
      invalidate();
    } catch (err: any) {
      notifyApiError(err, "Impossible d'accepter la demande");
    }
  };

  const handleDeclineFriend = async (requestId: string) => {
    try {
      await friendsApi.declineFriendRequest(requestId);
      notify.info('Demande refusée');
      invalidate();
    } catch (err: any) {
      notifyApiError(err, 'Impossible de refuser la demande');
    }
  };

  const handleAcceptGame = async (invitationId: string, sessionCode: string) => {
    try {
      await invitationsApi.acceptInvitation(invitationId);
      invalidate();
      router.push(`/session/${sessionCode}/lobby` as any);
    } catch (err: any) {
      notifyApiError(err, "Impossible d'accepter l'invitation");
    }
  };

  const handleDeclineGame = async (invitationId: string) => {
    try {
      await invitationsApi.declineInvitation(invitationId);
      invalidate();
    } catch (err: any) {
      notifyApiError(err, "Impossible de refuser l'invitation");
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    try {
      const res = await roomsApi.joinRoom(roomCode);
      invalidate();
      router.push(`/room/${res.room.id}` as any);
    } catch (err: any) {
      notifyApiError(err, 'Impossible de rejoindre la salle');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ChevronLeft size={20} color={palette.txt} />
        </TouchableOpacity>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 22,
              lineHeight: 28,
              color: palette.txt,
              paddingTop: 4,
            }}
          >
            Notifications
          </Text>
          {data && data.total > 0 && (
            <View
              style={{
                backgroundColor: palette.bad,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 9999,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                {data.total}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.primary} />
        }
      >
        {isLoading && !data ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement des notifications…</Text>
          </View>
        ) : !data || data.total === 0 ? (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 32,
              alignItems: 'center',
              gap: 12,
              marginTop: 16,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: palette.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={32} color={palette.inkSoft} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
              Aucune notification
            </Text>
            <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center', maxWidth: 280 }}>
              Vos demandes d'amis, invitations de jeu et de salle apparaîtront ici.
            </Text>
          </View>
        ) : (
          <>
            {/* Friend Requests */}
            {data.friendRequests.length > 0 && (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <UserPlus size={16} color={palette.primary} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Demandes d'amis ({data.friendRequests.length})
                  </Text>
                </View>

                {data.friendRequests.map((req: NotificationFriendRequest) => (
                  <View
                    key={req.id}
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
                    <Avatar name={req.requester.username} size={42} />

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
                        {req.requester.username}
                      </Text>
                      <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                        Veut vous ajouter en ami
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleAcceptFriend(req.id)}
                        activeOpacity={0.8}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: palette.good,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeclineFriend(req.id)}
                        activeOpacity={0.8}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: palette.surface2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={18} color={palette.bad} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Game Invitations */}
            {data.gameInvitations.length > 0 && (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Gamepad2 size={16} color={palette.gold} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Invitations de jeu ({data.gameInvitations.length})
                  </Text>
                </View>

                {data.gameInvitations.map((inv: NotificationGameInvitation) => (
                  <View
                    key={inv.id}
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
                    <Avatar name={inv.senderName} size={42} />

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
                        {inv.senderName}
                      </Text>
                      <Text style={{ fontSize: 12, color: palette.gold, fontWeight: '600' }}>
                        Session #{inv.sessionCode}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleAcceptGame(inv.id, inv.sessionCode)}
                        activeOpacity={0.8}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: palette.primary,
                        }}
                      >
                        <Text style={{ color: palette.primaryInk, fontSize: 12, fontWeight: '700' }}>
                          Rejoindre
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeclineGame(inv.id)}
                        activeOpacity={0.8}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: palette.surface2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={16} color={palette.bad} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Room Invitations */}
            {data.roomInvitations.length > 0 && (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <DoorOpen size={16} color={palette.violet} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Invitations de salon ({data.roomInvitations.length})
                  </Text>
                </View>

                {data.roomInvitations.map((inv: NotificationRoomInvitation) => (
                  <View
                    key={inv.id}
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
                    <Avatar name={inv.senderUsername} avatarUrl={inv.senderAvatarUrl} size={42} />

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
                        {inv.senderUsername}
                      </Text>
                      <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                        Vous invite dans « {inv.roomName} »
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleJoinRoom(inv.roomCode)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: palette.violet,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                        Entrer
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
