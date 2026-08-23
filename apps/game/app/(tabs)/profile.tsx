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
  Lock,
  Trophy,
  Zap,
  Check,
  X,
  Shield,
  HelpCircle,
  FileText,
  ArrowRight,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import { useMyGlobalRank, useDashboard } from '~/lib/query/hooks';
import * as usersApi from '~/lib/api/users';
import { palette, font } from '~/lib/theme/tokens';
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
  const [resendingEmail, setResendingEmail] = useState(false);

  const { data: myRank, isLoading: isRankLoading, refetch: refetchRank } = useMyGlobalRank();
  const { data: dashboard, isLoading: isDashboardLoading, refetch: refetchDashboard } = useDashboard();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchRank(), refetchDashboard()]);
    setRefreshing(false);
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      await usersApi.resendVerificationEmail();
      notify.success('Email de confirmation renvoyé !');
    } catch (err: any) {
      notifyApiError(err, "Impossible de renvoyer l'email");
    } finally {
      setResendingEmail(false);
    }
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

  const username = user?.username || 'Momo';
  const totalGames = myRank?.totalGames || 0;
  const rank = myRank?.rank || 154;
  const totalWins = myRank?.totalWins || 0;
  const winRatePct = myRank?.winRate != null ? Math.round(myRank.winRate) : 0;
  const glickoRating = myRank?.glickoRating != null ? Math.round(myRank.glickoRating) : 1500;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {/* Avatar & User info */}
        <View style={{ alignItems: 'center', marginVertical: 6 }}>
          <View style={{ position: 'relative', width: 88, height: 88, marginBottom: 12 }}>
            <Avatar name={username} avatarUrl={user?.avatarUrl} size={88} hue={30} />
            <TouchableOpacity
              onPress={() => router.push('/profile/edit' as any)}
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: palette.surface,
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 13, color: palette.txt }}>✎</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 22,
              letterSpacing: -0.3,
              color: palette.txt,
              marginBottom: 8,
            }}
          >
            {username}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 9999,
                backgroundColor: palette.surface2,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: palette.inkSoft }}>
                👤 Joueur
              </Text>
            </View>

            {!user?.email || !user.emailVerified ? (
              <TouchableOpacity
                onPress={handleResendEmail}
                disabled={resendingEmail}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(184, 70, 42, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(184, 70, 42, 0.3)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: palette.bad }}>
                  {resendingEmail ? 'Envoi…' : '⚠ Email non confirmé'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(45, 133, 89, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(45, 133, 89, 0.3)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: palette.good }}>
                  ✓ Email confirmé
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats 2x2 Grid */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Rang Global */}
          <View
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 6 }}>🏆</Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 20,
                color: palette.gold,
              }}
            >
              #{rank}
            </Text>
            <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>Rang global</Text>
          </View>

          {/* Glicko Rating */}
          <View
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 6 }}>⚡</Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 20,
                color: palette.primary,
              }}
            >
              {glickoRating}
            </Text>
            <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>Cote Glicko-2</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Total Games */}
          <View
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 6 }}>🎮</Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 20,
                color: palette.txt,
              }}
            >
              {totalGames}
            </Text>
            <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>Parties jouées</Text>
          </View>

          {/* Win Rate */}
          <View
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 6 }}>🎯</Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 20,
                color: palette.good,
              }}
            >
              {winRatePct}%
            </Text>
            <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>
              {totalWins} victoires
            </Text>
          </View>
        </View>

        {/* Action Menu */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
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
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: palette.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <User size={18} color={palette.txt} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.txt }}>
                Modifier le profil
              </Text>
            </View>
            <ArrowRight size={16} color={palette.inkSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: palette.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Lock size={18} color={palette.txt} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.txt }}>
                Changer le mot de passe
              </Text>
            </View>
            <ArrowRight size={16} color={palette.inkSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/support' as any)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: palette.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <HelpCircle size={18} color={palette.txt} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.txt }}>
                Aide &amp; Support
              </Text>
            </View>
            <ArrowRight size={16} color={palette.inkSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/privacy' as any)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: palette.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Shield size={18} color={palette.txt} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.txt }}>
                Confidentialité
              </Text>
            </View>
            <ArrowRight size={16} color={palette.inkSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/terms' as any)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: palette.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <FileText size={18} color={palette.txt} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.txt }}>
                Conditions &amp; CLUF
              </Text>
            </View>
            <ArrowRight size={16} color={palette.inkSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LogOut size={18} color={palette.bad} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: palette.bad }}>
                Se déconnecter
              </Text>
            </View>
            <ArrowRight size={16} color={palette.bad} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 18, color: palette.txt }}>
                Changer le mot de passe
              </Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                activeOpacity={0.7}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: palette.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={palette.txt} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: palette.txt, fontWeight: '600', fontSize: 12, marginBottom: 4 }}>
              Mot de passe actuel
            </Text>
            <TextInput
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={palette.inkSoft}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                padding: 12,
                color: palette.txt,
                fontSize: 14,
                marginBottom: 12,
              }}
            />

            <Text style={{ color: palette.txt, fontWeight: '600', fontSize: 12, marginBottom: 4 }}>
              Nouveau mot de passe
            </Text>
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Au moins 6 caractères"
              placeholderTextColor={palette.inkSoft}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                padding: 12,
                color: palette.txt,
                fontSize: 14,
                marginBottom: 12,
              }}
            />

            <Text style={{ color: palette.txt, fontWeight: '600', fontSize: 12, marginBottom: 4 }}>
              Confirmer le nouveau mot de passe
            </Text>
            <TextInput
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={palette.inkSoft}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                padding: 12,
                color: palette.txt,
                fontSize: 14,
                marginBottom: 18,
              }}
            />

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={isChangingPassword}
              activeOpacity={0.85}
              style={{
                backgroundColor: palette.primary,
                paddingVertical: 14,
                borderRadius: 9999,
                alignItems: 'center',
                justifyContent: 'center',
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
