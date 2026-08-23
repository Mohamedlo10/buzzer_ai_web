import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Trophy,
  Award,
  Users,
  Clock,
  UserPlus,
  UserCheck,
  UserX,
  Target,
  Zap,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import * as friendsApi from '~/lib/api/friends';
import { useFriendStore } from '~/stores/useFriendStore';
import type { FriendshipStatus } from '~/types/api';
import { palette } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const { sendRequest, removeFriend } = useFriendStore();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['friendProfile', userId],
    queryFn: () => friendsApi.getFriendProfile(userId!),
    enabled: !!userId,
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => sendRequest(userId!),
    onSuccess: () => {
      notify.success('Demande d\'ami envoyée !');
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
    }
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
  const totalWins = profile.totalWins || 0;
  const totalGames = profile.totalGames || 0;
  const winRate = profile.winRate != null
    ? Math.round(profile.winRate)
    : totalGames > 0
      ? Math.round((totalWins / totalGames) * 100)
      : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
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
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.txt, flex: 1 }}>
          Profil joueur
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
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
          <Avatar name={profile.username} avatarUrl={profile.avatarUrl} size={88} hue={30} />

          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: palette.txt }}>
              {profile.username}
            </Text>
          </View>

          {/* Friendship Action Button */}
          {friendshipStatus !== 'SELF' && (
            <TouchableOpacity
              onPress={handleFriendAction}
              disabled={friendshipStatus === 'PENDING' || sendRequestMutation.isPending || removeFriendMutation.isPending}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor:
                  friendshipStatus === 'ACCEPTED'
                    ? palette.bad + '1A'
                    : friendshipStatus === 'PENDING'
                      ? palette.surface2
                      : palette.primary,
                marginTop: 4,
              }}
            >
              {friendshipStatus === 'ACCEPTED' ? (
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
          )}
        </View>

        {/* Stats Grid */}
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
            <Text style={{ fontSize: 20, fontWeight: '800', color: palette.good }}>
              {totalWins}
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
              Victoires
            </Text>
          </View>

          <View style={{ width: 1, height: 32, backgroundColor: palette.line }} />

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: palette.txt }}>
              {totalGames}
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
              Parties
            </Text>
          </View>

          <View style={{ width: 1, height: 32, backgroundColor: palette.line }} />

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: palette.primary }}>
              {winRate}%
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
              Précision
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
