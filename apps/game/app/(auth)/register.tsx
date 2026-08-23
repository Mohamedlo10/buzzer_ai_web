import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegisterForm } from '~/lib/hooks/useRegisterForm';
import { GoogleSignInButton } from '~/components/auth/GoogleSignInButton';
import { AppleSignInButton } from '~/components/auth/AppleSignInButton';
import { XalaatMark } from '~/components/shared/XalaatMark';
import { FormInput } from '~/components/shared/FormInput';
import { palette, font } from '~/lib/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const {
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    errors,
    isLoading,
    handleRegister,
  } = useRegisterForm({
    onNavigate: () => {
      router.replace('/(tabs)/rooms');
    },
  });

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 26,
            paddingVertical: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 380, alignSelf: 'center' }}>
            {/* Top Right Logo Header */}
            <View style={{ alignItems: 'flex-end', marginBottom: 14 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: palette.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: palette.primary,
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <XalaatMark size={24} color={palette.primaryInk} accent={palette.gold} />
              </View>
            </View>

            {/* Title & Subtitle */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 30,
                  lineHeight: 42,
                  letterSpacing: -0.5,
                  color: palette.txt,
                  paddingTop: 12,
                  paddingBottom: 4,
                }}
              >
                Créer un compte.
              </Text>

              <Text
                style={{
                  fontFamily: font.nativeFamily.serif,
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: palette.inkSoft,
                  marginTop: 2,
                }}
              >
                Rejoins l&apos;arène du buzzer !
              </Text>
            </View>

            {/* Form Inputs (Floating Notch Labels) */}
            <FormInput
              label="Nom d'utilisateur"
              value={username}
              onChangeText={setUsername}
              placeholder="Choisis un pseudo"
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <FormInput
              label="Adresse email"
              value={email}
              onChangeText={setEmail}
              placeholder="exemple@email.com"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <FormInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Au moins 8 caractères"
              error={errors.password}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <FormInput
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Répète ton mot de passe"
              error={errors.confirmPassword}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              onSubmitEditing={handleRegister}
            />

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
              style={{
                height: 50,
                borderRadius: 14,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                shadowColor: palette.primary,
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={palette.primaryInk} />
              ) : (
                <Text
                  style={{
                    color: palette.primaryInk,
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  S&apos;inscrire
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 20,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: palette.inkSoft,
                  paddingHorizontal: 12,
                }}
              >
                ou continuer avec
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
            </View>

            {/* Social Logins Row */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <GoogleSignInButton
                variant="icon"
                onSuccess={() => router.replace('/(tabs)/rooms')}
                disabled={isLoading}
              />
              <AppleSignInButton
                variant="icon"
                onSuccess={() => router.replace('/(tabs)/rooms')}
                disabled={isLoading}
              />
            </View>

            {/* Switch to Login */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 24,
              }}
            >
              <Text style={{ fontSize: 13.5, color: palette.inkSoft }}>
                Déjà un compte ?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: palette.primary,
                  }}
                >
                  Se connecter
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
