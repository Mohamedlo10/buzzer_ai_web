import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  Clock,
  UserPlus,
  UserCheck,
  UserX,
  ShieldAlert,
  ShieldOff,
  Trophy,
  Swords,
  Sparkles,
  Flame,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import * as friendsApi from '~/lib/api/friends';
import { useFriendStore } from '~/stores/useFriendStore';
import { useAuthStore } from '~/stores/useAuthStore';
import type { FriendshipStatus, CategoryStat } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

export interface PlayerProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

export function PlayerProfileModal({ userId, onClose }: PlayerProfileModalProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { sendRequest, removeFriend, blockUser, unblockUser } = useFriendStore();

  const isOpen = Boolean(userId);
  const isSelf = currentUser?.id === userId;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['friendProfile', userId],
    queryFn: () => friendsApi.getFriendProfile(userId!),
    enabled: !!userId,
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => sendRequest(userId!),
    onSuccess: () => {
      notify.success("Demande d'ami envoyée !");
      queryClient.invalidateQueries({ queryKey: ['friendProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err: any) => {
      notifyApiError(err, "Impossible d'envoyer la demande");
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: () => removeFriend(userId!),
    onSuccess: () => {
      notify.info('Ami retiré');
      queryClient.invalidateQueries({ queryKey: ['friendProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err: any) => {
      notifyApiError(err, "Impossible de retirer l'ami");
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: () =>
      blockUser(
        userId!,
        profile
          ? {
              id: userId!,
              username: profile.username,
              avatarUrl: profile.avatarUrl,
              isOnline: false,
              lastSeenAt: null,
            }
          : undefined
      ),
    onSuccess: () => {
      notify.info(`${profile?.username ?? 'Utilisateur'} a été bloqué`);
      queryClient.invalidateQueries({ queryKey: ['friendProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err: any) => {
      notifyApiError(err, 'Impossible de bloquer cet utilisateur');
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: () => unblockUser(userId!),
    onSuccess: () => {
      notify.success(`${profile?.username ?? 'Utilisateur'} a été débloqué`);
      queryClient.invalidateQueries({ queryKey: ['friendProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err: any) => {
      notifyApiError(err, 'Impossible de débloquer cet utilisateur');
    },
  });

  if (!isOpen) return null;

  const handleFriendAction = async () => {
    if (!profile?.friendshipStatus) return;
    const status = profile.friendshipStatus;
    if (status === 'NONE') {
      sendRequestMutation.mutate();
    } else if (status === 'ACCEPTED') {
      const ok = await confirmAsync({
        title: 'Retirer cet ami',
        message: `Voulez-vous retirer ${profile.username} de vos amis ?`,
        tone: 'danger',
      });
      if (!ok) return;
      removeFriendMutation.mutate();
    } else if (status === 'BLOCKED') {
      unblockUserMutation.mutate();
    }
  };

  const handleBlockUser = async () => {
    if (!profile) return;
    const ok = await confirmAsync({
      title: 'Bloquer cet utilisateur',
      message: `Voulez-vous bloquer ${profile.username} ? Vous ne recevrez plus d'invitations ni de messages de cette personne.`,
      tone: 'danger',
    });
    if (!ok) return;
    blockUserMutation.mutate();
  };

  const friendshipStatus: FriendshipStatus = profile?.friendshipStatus || 'NONE';
  const isBlocked = friendshipStatus === 'BLOCKED';
  const totalWins = profile?.totalWins || 0;
  const totalGames = profile?.totalGames || 0;
  const totalScore = profile?.totalScore || 0;
  const rank = profile?.globalRank;
  const winRate =
    profile?.winRate != null
      ? Math.round(profile.winRate)
      : totalGames > 0
      ? Math.round((totalWins / totalGames) * 100)
      : 0;

  const topCategories: CategoryStat[] =
    profile?.topCategories && profile.topCategories.length > 0
      ? profile.topCategories
      : profile?.categories && profile.categories.length > 0
      ? profile.categories.slice(0, 4)
      : [];

  const isMutating =
    sendRequestMutation.isPending ||
    removeFriendMutation.isPending ||
    blockUserMutation.isPending ||
    unblockUserMutation.isPending;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          style={{ flex: 1, width: '100%' }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: palette.line,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 36 : 24,
            paddingHorizontal: 20,
            maxHeight: '85%',
            width: '100%',
            maxWidth: 540,
          }}
        >
          {/* Bottom Sheet Handle */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: palette.line,
              }}
            />
          </View>

          {/* Close button */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 18,
                color: palette.txt,
                paddingTop: 2,
              }}
            >
              Profil joueur
            </Text>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: palette.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={17} color={palette.inkSoft} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={{ color: palette.inkSoft, fontSize: 13 }}>
                Chargement du profil…
              </Text>
            </View>
          ) : error || !profile ? (
            <View style={{ paddingVertical: 32, alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: palette.bad + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserX size={28} color={palette.bad} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
                Profil introuvable
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingBottom: 16 }}
            >
              {/* User Hero */}
              <View
                style={{
                  backgroundColor: palette.bg,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 16,
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <View style={{ position: 'relative' }}>
                  <Avatar
                    name={profile.username}
                    avatarSpec={profile.avatarSpec}
                    avatarUrl={profile.avatarUrl}
                    size={72}
                    hue={30}
                  />
                  {rank && rank <= 3 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        backgroundColor: palette.surface,
                        borderRadius: 12,
                        padding: 2,
                        borderWidth: 1,
                        borderColor: palette.line,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      fontSize: 19,
                      lineHeight: 26,
                      color: palette.txt,
                      paddingTop: 2,
                    }}
                  >
                    {profile.username}
                  </Text>

                  <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                    {isSelf
                      ? '(C’est vous)'
                      : rank && rank > 0
                      ? `Rang #${rank} mondial`
                      : 'Joueur Xalaat'}
                  </Text>

                  {isBlocked && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        backgroundColor: palette.bad + '18',
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 9999,
                        borderWidth: 1,
                        borderColor: palette.bad + '40',
                        marginTop: 4,
                      }}
                    >
                      <ShieldAlert size={12} color={palette.bad} />
                      <Text style={{ color: palette.bad, fontSize: 11, fontWeight: '700' }}>
                        Utilisateur bloqué
                      </Text>
                    </View>
                  )}
                </View>

                {/* Friendship Action Button */}
                {!isSelf && friendshipStatus !== 'SELF' && (
                  <View style={{ alignItems: 'center', gap: 8, marginTop: 4, width: '100%' }}>
                    <TouchableOpacity
                      onPress={handleFriendAction}
                      disabled={friendshipStatus === 'PENDING' || isMutating}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor:
                          friendshipStatus === 'BLOCKED'
                            ? palette.surface2
                            : friendshipStatus === 'ACCEPTED'
                            ? palette.bad + '1A'
                            : friendshipStatus === 'PENDING'
                            ? palette.surface2
                            : palette.primary,
                        borderWidth: friendshipStatus === 'BLOCKED' ? 1 : 0,
                        borderColor: palette.line,
                        width: '100%',
                      }}
                    >
                      {isBlocked ? (
                        <>
                          <ShieldOff size={15} color={palette.txt} />
                          <Text style={{ color: palette.txt, fontSize: 13, fontWeight: '700' }}>
                            Débloquer l'utilisateur
                          </Text>
                        </>
                      ) : friendshipStatus === 'ACCEPTED' ? (
                        <>
                          <UserCheck size={15} color={palette.bad} />
                          <Text style={{ color: palette.bad, fontSize: 13, fontWeight: '700' }}>
                            Retirer des amis
                          </Text>
                        </>
                      ) : friendshipStatus === 'PENDING' ? (
                        <>
                          <Clock size={15} color={palette.inkSoft} />
                          <Text style={{ color: palette.inkSoft, fontSize: 13, fontWeight: '700' }}>
                            Demande envoyée
                          </Text>
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} color={palette.primaryInk} />
                          <Text style={{ color: palette.primaryInk, fontSize: 13, fontWeight: '700' }}>
                            Ajouter en ami
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Block user button */}
                    {!isBlocked && (
                      <TouchableOpacity
                        onPress={handleBlockUser}
                        disabled={isMutating}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                        }}
                      >
                        <ShieldAlert size={13} color={palette.bad} />
                        <Text style={{ color: palette.bad, fontSize: 11.5, fontWeight: '600' }}>
                          Bloquer cet utilisateur
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Stats Grid 1 */}
              <View
                style={{
                  backgroundColor: palette.bg,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Trophy size={15} color={palette.gold} style={{ marginBottom: 3 }} />
                  <Text style={{ fontSize: 17, fontWeight: '800', color: palette.gold }}>
                    {totalScore}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: palette.inkSoft, marginTop: 1 }}>
                    Points
                  </Text>
                </View>

                <View style={{ width: 1, height: 32, backgroundColor: palette.line }} />

                <View style={{ alignItems: 'center' }}>
                  <Swords size={15} color={palette.primary} style={{ marginBottom: 3 }} />
                  <Text style={{ fontSize: 17, fontWeight: '800', color: palette.txt }}>
                    {totalGames}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: palette.inkSoft, marginTop: 1 }}>
                    Parties
                  </Text>
                </View>

                <View style={{ width: 1, height: 32, backgroundColor: palette.line }} />

                <View style={{ alignItems: 'center' }}>
                  <Sparkles size={15} color={palette.violet} style={{ marginBottom: 3 }} />
                  <Text style={{ fontSize: 17, fontWeight: '800', color: palette.good }}>
                    {winRate}%
                  </Text>
                  <Text style={{ fontSize: 10.5, color: palette.inkSoft, marginTop: 1 }}>
                    Victoires
                  </Text>
                </View>
              </View>

              {/* Stats Grid 2: Extra info */}
              {(profile.bestScore != null || profile.totalWins != null || profile.avgScore != null) && (
                <View
                  style={{
                    backgroundColor: palette.bg,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                  }}
                >
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: palette.good }}>
                      {totalWins}
                    </Text>
                    <Text style={{ fontSize: 10, color: palette.inkSoft, marginTop: 1 }}>
                      Victoires nettes
                    </Text>
                  </View>

                  <View style={{ width: 1, height: 26, backgroundColor: palette.line }} />

                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: palette.primary }}>
                      {profile.bestScore ?? totalScore}
                    </Text>
                    <Text style={{ fontSize: 10, color: palette.inkSoft, marginTop: 1 }}>
                      Meilleur score
                    </Text>
                  </View>

                  {profile.avgScore != null && (
                    <>
                      <View style={{ width: 1, height: 26, backgroundColor: palette.line }} />
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: palette.txt }}>
                          {Math.round(profile.avgScore)}
                        </Text>
                        <Text style={{ fontSize: 10, color: palette.inkSoft, marginTop: 1 }}>
                          Moyenne
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Top Categories */}
              {topCategories.length > 0 && (
                <View
                  style={{
                    backgroundColor: palette.bg,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 14,
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '700',
                      letterSpacing: 1.2,
                      color: palette.inkSoft,
                      textTransform: 'uppercase',
                    }}
                  >
                    Top Catégories
                  </Text>

                  <View style={{ gap: 6 }}>
                    {topCategories.map((cat, i) => (
                      <View
                        key={cat.category || i}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: palette.surface,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: palette.line,
                          padding: 10,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              backgroundColor: `${palette.primary}18`,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Flame size={14} color={palette.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: palette.txt,
                              }}
                              numberOfLines={1}
                            >
                              {cat.category}
                            </Text>
                            <Text style={{ fontSize: 10.5, color: palette.inkSoft }}>
                              {cat.gamesPlayed} partie{cat.gamesPlayed > 1 ? 's' : ''} ·{' '}
                              {Math.round(cat.winRate || 0)}% victoires
                            </Text>
                          </View>
                        </View>

                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.primary, marginLeft: 8 }}>
                          {cat.totalScore} pts
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
