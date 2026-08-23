import { useState } from 'react';
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
import {
  ArrowLeft,
  Check,
  Save,
  Pencil,
  Sparkles,
  Shuffle,
} from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '~/stores/useAuthStore';
import * as usersApi from '~/lib/api/users';
import { AVATAR_STYLES, AVATAR_SEEDS, getAvatarUrl } from '~/lib/utils/avatar';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { GoogleSignInButton } from '~/components/auth/GoogleSignInButton';
import { notify, notifyApiError } from '~/lib/ui/notify';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Extract user's current avatar style & seed if available
  const parsedFromUrl = (() => {
    if (!user?.avatarUrl) return { style: null, seed: null };
    try {
      const match = user.avatarUrl.match(/dicebear\.com\/[^/]+\/([^/]+)\/svg\?seed=([^&]+)/);
      if (match) {
        return { style: match[1], seed: decodeURIComponent(match[2]) };
      }
    } catch {}
    return { style: null, seed: null };
  })();

  const rawStyle = user?.avatarStyle || parsedFromUrl.style || 'adventurer';
  const initialStyle = AVATAR_STYLES.some((s) => s.id === rawStyle) ? rawStyle : 'adventurer';
  const initialSeed = user?.avatarSeed || parsedFromUrl.seed || user?.username || 'Felix';

  const [selectedStyle, setSelectedStyle] = useState<string>(initialStyle);
  const [selectedSeed, setSelectedSeed] = useState<string>(initialSeed);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const previewUrl = getAvatarUrl(selectedStyle, selectedSeed);
  const hasChanges =
    username.trim() !== (user?.username || '') ||
    email.trim() !== (user?.email || '') ||
    selectedStyle !== initialStyle ||
    selectedSeed !== initialSeed;

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      let updated = await usersApi.updateProfile({
        username: username.trim(),
        email: email.trim(),
      });
      if (user?.id) {
        const withAvatar = await usersApi.updateAvatar(user.id, selectedStyle, selectedSeed);
        updated = withAvatar;
      }
      return updated;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      notify.success('Profil mis à jour avec succès !');
      router.back();
    },
    onError: (err: any) => {
      notifyApiError(err, 'Erreur lors de la modification du profil');
    },
  });

  const handleRandomizeAvatar = () => {
    const randomStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)].id;
    const randomSeed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
    setSelectedStyle(randomStyle);
    setSelectedSeed(randomSeed);
  };

  if (!user) return null;

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
          Modifier le profil
        </Text>

        <TouchableOpacity
          onPress={() => updateProfileMutation.mutate()}
          disabled={updateProfileMutation.isPending || !username.trim() || !hasChanges}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: hasChanges && username.trim() ? palette.primary : palette.surface2,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator size="small" color={palette.primaryInk} />
          ) : (
            <>
              <Check size={16} color={hasChanges && username.trim() ? palette.primaryInk : palette.inkSoft} strokeWidth={2.5} />
              <Text
                style={{
                  color: hasChanges && username.trim() ? palette.primaryInk : palette.inkSoft,
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                Enregistrer
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 24,
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View style={{ position: 'relative' }}>
            <Avatar name={username} avatarUrl={previewUrl} size={96} ring={palette.primary} />
            <TouchableOpacity
              onPress={handleRandomizeAvatar}
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: palette.violet,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: palette.surface,
              }}
            >
              <Shuffle size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setShowAvatarPicker((s) => !s)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: palette.surface2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Pencil size={14} color={palette.primary} />
            <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>
              {showAvatarPicker ? "Masquer les styles d'avatar" : "Choisir un style d'avatar"}
            </Text>
          </TouchableOpacity>

          {/* Avatar Styles Grid */}
          {showAvatarPicker && (
            <View style={{ width: '100%', gap: 14, paddingTop: 8 }}>
              <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
                Styles DiceBear
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {AVATAR_STYLES.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      onPress={() => setSelectedStyle(style.id)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: isSelected ? palette.primary : palette.surface2,
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{style.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: isSelected ? palette.primaryInk : palette.txt,
                        }}
                      >
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 }}>
                Variations
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {AVATAR_SEEDS.map((seed) => {
                  const isSelected = selectedSeed === seed;
                  return (
                    <TouchableOpacity
                      key={seed}
                      onPress={() => setSelectedSeed(seed)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 9999,
                        backgroundColor: isSelected ? palette.primary : palette.surface2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: isSelected ? palette.primaryInk : palette.txt,
                        }}
                      >
                        {seed}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Inputs Section */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 20,
            gap: 16,
          }}
        >
          <View style={{ gap: 6 }}>
            <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
              Nom d'utilisateur *
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Votre pseudo"
              placeholderTextColor={palette.inkSoft}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: palette.txt,
                fontSize: 15,
                fontWeight: '600',
              }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
              Adresse e-mail
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="votre.email@exemple.com"
              placeholderTextColor={palette.inkSoft}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: palette.txt,
                fontSize: 15,
              }}
            />
          </View>
        </View>

        {/* Linked Accounts Section */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 20,
            gap: 12,
          }}
        >
          <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
            Comptes associés
          </Text>
          <GoogleSignInButton
            onSuccess={() => {
              notify.success('Compte Google synchronisé !');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
