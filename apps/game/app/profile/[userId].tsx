import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
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
import { AdSlot } from '~/components/shared/AdSlot';
import { AdAwareScrollView } from '~/components/partner/AdAwareScrollView';

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { sendRequest, removeFriend, blockUser, unblockUser } = useFriendStore();

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
      blockUser(userId!, profile ? {
        id: userId!,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        isOnline: false,
        lastSeenAt: null,
      } : undefined),
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

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement du profil…</Text>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.bad + '1A', alignItems: 'center', justifyContent: 'center' }}>
          <UserX size={32} color={palette.bad} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.txt }}>
          Profil non trouvé
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text style={{ color: palette.txt, fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const friendshipStatus: FriendshipStatus = profile.friendshipStatus || 'NONE';
  const isBlocked = friendshipStatus === 'BLOCKED';
  const totalWins = profile.totalWins || 0;
  const totalGames = profile.totalGames || 0;
  const totalScore = profile.totalScore || 0;
  const rank = profile.globalRank;
  const winRate = profile.winRate != null
    ? Math.round(profile.winRate)
    : totalGames > 0
      ? Math.round((totalWins / totalGames) * 100)
      : 0;

  const topCategories: CategoryStat[] = (profile.topCategories && profile.topCategories.length > 0)
    ? profile.topCategories
    : (profile.categories && profile.categories.length > 0)
    ? profile.categories.slice(0, 4)
    : [];

  const isMutating =
    sendRequestMutation.isPending ||
    removeFriendMutation.isPending ||
    blockUserMutation.isPending ||
    unblockUserMutation.isPending;

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
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 20,
            lineHeight: 26,
            color: palette.txt,
            paddingTop: 4,
            flex: 1,
          }}
        >
          Profil joueur
        </Text>
      </View>

      <AdAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16, maxWidth: 540, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Hero Card */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 24,
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ position: 'relative' }}>
            <Avatar name={profile.username} avatarSpec={profile.avatarSpec} avatarUrl={profile.avatarUrl} size={88} hue={30} />
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
                <Text style={{ fontSize: 18 }}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </Text>
              </View>
            )}
          </View>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 22,
                lineHeight: 30,
                color: palette.txt,
                paddingTop: 4,
              }}
            >
              {profile.username}
            </Text>

            <Text style={{ fontSize: 12.5, color: palette.inkSoft }}>
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
                  gap: 6,
                  backgroundColor: palette.bad + '18',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: palette.bad + '40',
                  marginTop: 4,
                }}
              >
                <ShieldAlert size={13} color={palette.bad} />
                <Text style={{ color: palette.bad, fontSize: 12, fontWeight: '700' }}>
                  Utilisateur bloqué
                </Text>
              </View>
            )}
          </View>

          {/* Friendship Action Button */}
          {!isSelf && friendshipStatus !== 'SELF' && (
            <View style={{ alignItems: 'center', gap: 10, marginTop: 4, width: '100%' }}>
              <TouchableOpacity
                onPress={handleFriendAction}
                disabled={friendshipStatus === 'PENDING' || isMutating}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
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
                  minWidth: 180,
                  width: '100%',
                }}
              >
                {isBlocked ? (
                  <>
                    <ShieldOff size={16} color={palette.txt} />
                    <Text style={{ color: palette.txt, fontSize: 13, fontWeight: '700' }}>
                      Débloquer l'utilisateur
                    </Text>
                  </>
                ) : friendshipStatus === 'ACCEPTED' ? (
                  <>
                    <UserCheck size={16} color={palette.bad} />
                    <Text style={{ color: palette.bad, fontSize: 13, fontWeight: '700' }}>
                      Retirer des amis
                    </Text>
                  </>
                ) : friendshipStatus === 'PENDING' ? (
                  <>
                    <Clock size={16} color={palette.inkSoft} />
                    <Text style={{ color: palette.inkSoft, fontSize: 13, fontWeight: '700' }}>
                      Demande envoyée
                    </Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} color={palette.primaryInk} />
                    <Text style={{ color: palette.primaryInk, fontSize: 13, fontWeight: '700' }}>
                      Ajouter en ami
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Block user button if not blocked and not self */}
              {!isBlocked && (
                <TouchableOpacity
                  onPress={handleBlockUser}
                  disabled={isMutating}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <ShieldAlert size={14} color={palette.bad} />
                  <Text style={{ color: palette.bad, fontSize: 12, fontWeight: '600' }}>
                    Bloquer cet utilisateur
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Stats Grid 1: Main Numbers */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Trophy size={16} color={palette.gold} style={{ marginBottom: 4 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: palette.gold }}>
              {totalScore}
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
              Points
            </Text>
          </View>

          <View style={{ width: 1, height: 36, backgroundColor: palette.line }} />

          <View style={{ alignItems: 'center' }}>
            <Swords size={16} color={palette.primary} style={{ marginBottom: 4 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: palette.txt }}>
              {totalGames}
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
              Parties
            </Text>
          </View>

          <View style={{ width: 1, height: 36, backgroundColor: palette.line }} />

          <View style={{ alignItems: 'center' }}>
            <Sparkles size={16} color={palette.violet} style={{ marginBottom: 4 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: palette.good }}>
              {winRate}%
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
              Victoires
            </Text>
          </View>
        </View>

        {/* Stats Grid 2: Additional Metrics */}
        {(profile.bestScore != null || profile.totalWins != null || profile.avgScore != null) && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: palette.good }}>
                {totalWins}
              </Text>
              <Text style={{ fontSize: 10.5, color: palette.inkSoft, marginTop: 2 }}>
                Victoires nettes
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: palette.line }} />

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: palette.primary }}>
                {profile.bestScore ?? totalScore}
              </Text>
              <Text style={{ fontSize: 10.5, color: palette.inkSoft, marginTop: 2 }}>
                Meilleur score
              </Text>
            </View>

            {profile.avgScore != null && (
              <>
                <View style={{ width: 1, height: 28, backgroundColor: palette.line }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
                    {Math.round(profile.avgScore)}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: palette.inkSoft, marginTop: 2 }}>
                    Moyenne
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Top Categories Section */}
        {topCategories.length > 0 && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  color: palette.inkSoft,
                  textTransform: 'uppercase',
                }}
              >
                Top Catégories
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {topCategories.map((cat, i) => (
                <View
                  key={cat.category || i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: palette.bg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: `${palette.primary}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Flame size={16} color={palette.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13.5,
                          fontWeight: '700',
                          color: palette.txt,
                        }}
                        numberOfLines={1}
                      >
                        {cat.category}
                      </Text>
                      <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 1 }}>
                        {cat.gamesPlayed} partie{cat.gamesPlayed > 1 ? 's' : ''} · {Math.round(cat.winRate || 0)}% victoires
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: '800', color: palette.primary, marginLeft: 8 }}>
                    {cat.totalScore} pts
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Carte partenaire — en fin de contenu, hors de tout parcours de jeu. */}
        <AdSlot placement="PLAYER_PROFILE" />
      </AdAwareScrollView>
    </SafeAreaView>
  );
}
