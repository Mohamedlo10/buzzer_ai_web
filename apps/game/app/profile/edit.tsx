import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Sparkles,
  User,
  Mail,
} from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '~/stores/useAuthStore';
import * as usersApi from '~/lib/api/users';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { FormInput } from '~/components/shared/FormInput';
import { GoogleSignInButton } from '~/components/auth/GoogleSignInButton';
import { notify, notifyApiError } from '~/lib/ui/notify';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  const hasChanges =
    username.trim() !== (user?.username || '') ||
    email.trim() !== (user?.email || '');

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({ username: username.trim(), email: email.trim() }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      notify.success('Profil mis à jour avec succès !');
      router.back();
    },
    onError: (err: any) => {
      notifyApiError(err, 'Erreur lors de la modification du profil');
    },
  });

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
          <Avatar
            name={username}
            avatarSpec={user.avatarSpec}
            avatarUrl={user.avatarUrl}
            size={96}
            ring={palette.primary}
          />

          <TouchableOpacity
            onPress={() => router.push('/profile/avatar')}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 9999,
              backgroundColor: palette.primary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={15} color={palette.primaryInk} />
            <Text style={{ color: palette.primaryInk, fontSize: 13, fontWeight: '700' }}>
              Personnaliser mon avatar
            </Text>
          </TouchableOpacity>

          <Text style={{ color: palette.inkSoft, fontSize: 11, textAlign: 'center' }}>
            Personnages, voiles, animaux et paysages
          </Text>
        </View>

        {/* Inputs Section */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 20,
          }}
        >
          <FormInput
            label="Nom d'utilisateur *"
            leftIcon={User}
            value={username}
            onChangeText={setUsername}
            placeholder="Votre pseudo"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormInput
            label="Adresse e-mail"
            leftIcon={Mail}
            value={email}
            onChangeText={setEmail}
            placeholder="votre.email@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
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
