import { useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';

import { useRouter } from 'expo-router';
import {
  User,
  LogOut,
  Lock,
  X,
  Shield,
  HelpCircle,
  Handshake,
  FileText,
  ArrowRight,
  History,
  Award,
  TrendingUp,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import { useProfileSummary, useUnseenAchievements, useMarkAchievementsSeen } from '~/lib/query/hooks';
import { usePullToRefresh } from '~/lib/query/usePullToRefresh';
import * as usersApi from '~/lib/api/users';
import { AdSlot } from '~/components/shared/AdSlot';
import { AdAwareScrollView } from '~/components/partner/AdAwareScrollView';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { AppTopBar } from '~/components/shared/AppTopBar';
import { FormInput } from '~/components/shared/FormInput';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';
import { LoadingState, ErrorState } from '~/components/ui/StateViews';
import { BadgeUnlockedModal } from '~/components/achievements/BadgeUnlockedModal';
import { ProfilePrestigeCard } from '~/components/profile/ProfilePrestigeCard';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useProfileSummary();

  const { data: unseenBadges } = useUnseenAchievements();
  const { mutate: markSeen } = useMarkAchievementsSeen();

  const { refreshing, onRefresh } = usePullToRefresh();

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      await usersApi.resendVerificationEmail();
      notify.success('Email de confirmation renvoyé !');
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      notifyApiError(err, 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const username = user?.username ?? '';

  // ── Écrans d'état ─────────────────────────────────────────────────────────
  if (isProfileLoading && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <AppTopBar title="Xalaat" tag="PROFIL JOUEUR" />
        <LoadingState label="Chargement du profil…" fullScreen />
      </View>
    );
  }

  if (isProfileError && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <AppTopBar title="Xalaat" tag="PROFIL JOUEUR" />
        <ErrorState
          fallbackMessage="Impossible de charger le profil."
          onRetry={refetchProfile}
          fullScreen
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>

      {/* Modale badges non vus — filet de rattrapage au montage (§23) */}
      {unseenBadges && unseenBadges.length > 0 && (
        <BadgeUnlockedModal
          badges={unseenBadges}
          onClose={(ids) => markSeen(ids)}
        />
      )}

      <AppTopBar title="Xalaat" tag="PROFIL JOUEUR" />

      <AdAwareScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {/* ── Avatar & User info ── */}
        <View style={{ alignItems: 'center', marginVertical: 6 }}>
          <View style={{ position: 'relative', width: 88, height: 88, marginBottom: 12 }}>
            <Avatar name={username} avatarSpec={user?.avatarSpec} avatarUrl={user?.avatarUrl} size={88} hue={30} />
            {/* Le crayon posé sur l'avatar mène au créateur d'avatar, pas au formulaire de
                profil : c'est l'avatar qu'on touche, c'est donc l'avatar qu'on s'attend à
                modifier. Le pseudo et l'e-mail restent accessibles plus bas dans l'écran. */}
            <TouchableOpacity
              onPress={() => router.push('/profile/avatar' as any)}
              accessibilityLabel="Personnaliser mon avatar"
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
              lineHeight: 30,
              letterSpacing: -0.3,
              color: palette.txt,
              paddingTop: 4,
              marginBottom: 8,
            }}
          >
            {username}
          </Text>

          {/* Invitation, pas obstacle : le compte a déjà un avatar valide et distinct, celui-ci
              propose seulement d'en composer un qui lui ressemble. Elle disparaît d'elle-même dès
              que le joueur a choisi. */}
          {user && user.avatarCustomized === false && (
            <TouchableOpacity
              onPress={() => router.push('/profile/avatar' as any)}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                alignSelf: 'stretch',
                marginBottom: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor: `${palette.violet}14`,
                borderWidth: 1.5,
                borderColor: palette.violet,
              }}
            >
              <Text style={{ fontSize: 20 }}>🎨</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 13 }}>
                  Cet avatar t'a été attribué
                </Text>
                <Text style={{ color: palette.inkSoft, fontSize: 11, marginTop: 2 }}>
                  Compose le tien : personnages, voiles, animaux, paysages.
                </Text>
              </View>
              <Text style={{ color: palette.violet, fontWeight: '700', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          )}

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

        {/* ── Stats § 19 — 7 statistiques serveur ── */}
        {profile && (
          <>
            <ProfilePrestigeCard profile={profile} />

            {/* Progression — rang null si pas encore joué ce mois-ci (§17 : ne rien inventer) */}
            <View
              style={{
                backgroundColor: palette.indigo,
                borderRadius: 20,
                padding: 18,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="rgba(255,255,255,0.85)" />
                <Text
                  style={{
                    fontFamily: font.nativeFamily.ui,
                    fontWeight: '700',
                    fontSize: 12,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.65)',
                  }}
                >
                  Progression
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontFamily: font.nativeFamily.ui, fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Rang de saison</Text>
                  <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 22, color: '#FFFFFF', paddingTop: 2 }}>
                    {/* null = pas de rang ce mois-ci — ne rien inventer (§17) */}
                    {profile.seasonRank !== null ? `#${profile.seasonRank}` : '—'}
                  </Text>
                  {profile.seasonLabel && (
                    <Text style={{ fontFamily: font.nativeFamily.ui, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                      {profile.seasonLabel}
                    </Text>
                  )}
                </View>
                <View style={{ gap: 4, alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: font.nativeFamily.ui, fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Badges</Text>
                  {/* Totaux viennent du serveur — jamais 8 en dur (§5 interdit) */}
                  <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 22, color: '#FFFFFF', paddingTop: 2 }}>
                    {profile.achievementsUnlocked} / {profile.achievementsTotal}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Carte partenaire — entre la progression et le menu, hors de tout parcours de jeu. */}
        <AdSlot placement="PROFILE" />

        {/* ── Menu ── */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            overflow: 'hidden',
          }}
        >
          <MenuRow icon={<User size={18} color={palette.txt} />} label="Modifier le profil" onPress={() => router.push('/profile/edit' as any)} />
          <MenuRow icon={<History size={18} color={palette.txt} />} label="Mes parties" onPress={() => router.push('/profile/history' as any)} />
          <MenuRow icon={<Award size={18} color={palette.txt} />} label="Mes badges" onPress={() => router.push('/profile/badges' as any)} />
          <MenuRow icon={<Lock size={18} color={palette.txt} />} label="Changer le mot de passe" onPress={() => setShowPasswordModal(true)} />
          <MenuRow icon={<Handshake size={18} color={palette.txt} />} label="Partenaires de Xalaat" onPress={() => router.push('/partners' as any)} />
          <MenuRow icon={<HelpCircle size={18} color={palette.txt} />} label="Aide & Support" onPress={() => router.push('/support' as any)} />
          <MenuRow icon={<Shield size={18} color={palette.txt} />} label="Confidentialité" onPress={() => router.push('/privacy' as any)} />
          <MenuRow icon={<FileText size={18} color={palette.txt} />} label="Conditions & CLUF" onPress={() => router.push('/terms' as any)} />

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
      </AdAwareScrollView>

      {/* ── Modale changement de mot de passe ── */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
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

            <FormInput
              label="Mot de passe actuel"
              leftIcon={Lock}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              isPassword
            />

            <FormInput
              label="Nouveau mot de passe"
              leftIcon={Lock}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Au moins 6 caractères"
              isPassword
            />

            <FormInput
              label="Confirmer le nouveau mot de passe"
              leftIcon={Lock}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              isPassword
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
    </View>
  );
}

// ─── Micro-composants ────────────────────────────────────────────────────────


function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
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
        {icon}
        <Text style={{ fontSize: 14, fontWeight: '600', color: palette.txt }}>{label}</Text>
      </View>
      <ArrowRight size={16} color={palette.inkSoft} />
    </TouchableOpacity>
  );
}
