import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  LogOut,
  Edit3,
  Bell,
  Lock,
  Trophy,
  Award,
  Zap,
  Check,
  X,
  Shield,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import { useMyGlobalRank, useDashboard } from '~/lib/query/hooks';
import * as usersApi from '~/lib/api/users';
import { palette } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: myRank, isLoading: isRankLoading, refetch: refetchRank } = useMyGlobalRank();
  const { data: dashboard, isLoading: isDashboardLoading, refetch: refetchDashboard } = useDashboard();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchRank(), refetchDashboard()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    const ok = await confirmAsync({
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter de votre compte ?',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await logout();
      router.replace('/(auth)/login' as any);
    } catch {
      router.replace('/(auth)/login' as any);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      notify.error('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      notify.error('Le nouveau mot de passe doit faire au moins 6 caractères');
      return;
    }

    setIsChangingPassword(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      notify.success('Mot de passe mis à jour avec succès !');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      notifyApiError(err, 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const username = user?.username || 'Joueur';
  const totalGames = myRank?.totalGames || 0;
  const rank = myRank?.rank || 1;
  const totalWins = myRank?.totalWins || 0;
  const winRatePct = myRank?.winRate != null ? Math.round(myRank.winRate) : 0;
  const glickoRating = myRank?.glickoRating != null ? Math.round(myRank.glickoRating) : 1500;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 18 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {/* Profile Hero Card */}
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
            <Avatar
              name={username}
              avatarUrl={user?.avatarUrl}
              size={88}
              hue={30}
              ring={palette.primary}
            />
            <TouchableOpacity
              onPress={() => router.push('/profile/edit' as any)}
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: palette.surface,
              }}
            >
              <Edit3 size={14} color={palette.primaryInk} />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: palette.txt }}>
              {username}
            </Text>
            {user?.email && (
              <Text style={{ fontSize: 13, color: palette.inkSoft }}>
                {user.email}
              </Text>
            )}
          </View>

          {/* Quick Level / Rating Pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: palette.gold + '26',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9999,
            }}
          >
            <Trophy size={14} color={palette.gold} />
            <Text style={{ color: palette.gold, fontSize: 12, fontWeight: '800' }}>
              Cote {glickoRating} pts · Rang #{rank}
            </Text>
          </View>
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
              {winRatePct}%
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
              Précision
            </Text>
          </View>
        </View>

        {/* Menu Actions */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/profile/edit' as any)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: palette.line,
              gap: 14,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: palette.primary + '26', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color={palette.primary} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: palette.txt, flex: 1 }}>
              Modifier mon profil
            </Text>
            <Text style={{ color: palette.inkSoft, fontSize: 14 }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: palette.line,
              gap: 14,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: palette.gold + '26', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color={palette.gold} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: palette.txt, flex: 1 }}>
              Notifications
            </Text>
            <Text style={{ color: palette.inkSoft, fontSize: 14 }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              gap: 14,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: palette.violet + '26', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} color={palette.violet} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: palette.txt, flex: 1 }}>
              Changer de mot de passe
            </Text>
            <Text style={{ color: palette.inkSoft, fontSize: 14 }}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 16,
            borderRadius: 18,
            backgroundColor: palette.bad + '1A',
            borderWidth: 1,
            borderColor: palette.bad + '40',
          }}
        >
          <LogOut size={18} color={palette.bad} />
          <Text style={{ color: palette.bad, fontSize: 15, fontWeight: '700' }}>
            Se déconnecter
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: palette.txt }}>
                Changer de mot de passe
              </Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} activeOpacity={0.7}>
                <X size={20} color={palette.inkSoft} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              <View>
                <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                  Mot de passe actuel
                </Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={palette.inkSoft}
                  style={{
                    backgroundColor: palette.bg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: palette.line,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: palette.txt,
                    fontSize: 14,
                  }}
                />
              </View>

              <View>
                <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                  Nouveau mot de passe
                </Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Min. 6 caractères"
                  placeholderTextColor={palette.inkSoft}
                  style={{
                    backgroundColor: palette.bg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: palette.line,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: palette.txt,
                    fontSize: 14,
                  }}
                />
              </View>

              <View>
                <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                  Confirmer le mot de passe
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={palette.inkSoft}
                  style={{
                    backgroundColor: palette.bg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: palette.line,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: palette.txt,
                    fontSize: 14,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={isChangingPassword}
              activeOpacity={0.8}
              style={{
                backgroundColor: palette.primary,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
              }}
            >
              {isChangingPassword ? (
                <ActivityIndicator size="small" color={palette.primaryInk} />
              ) : (
                <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 14 }}>
                  Mettre à jour
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
