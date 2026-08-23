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
import { User, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react-native';
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
            paddingHorizontal: 20,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Branding */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            {/* Logo Squircle */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                shadowColor: palette.primary,
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <XalaatMark size={40} color={palette.primaryInk} accent={palette.gold} />
            </View>

            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 34,
                lineHeight: 44,
                letterSpacing: -0.5,
                color: palette.txt,
                paddingTop: 4,
              }}
            >
              Xalaat
            </Text>

            {/* Tag Pill */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                borderWidth: 1,
                borderColor: 'rgba(217, 119, 6, 0.28)',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
                marginTop: 6,
              }}
            >
              <Sparkles size={12} color={palette.gold} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1,
                  color: palette.gold,
                  marginLeft: 6,
                  textTransform: 'uppercase',
                }}
              >
                Rejoins l&apos;arène
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              alignSelf: 'center',
              backgroundColor: palette.surface,
              borderRadius: 28,
              padding: 24,
              borderWidth: 1,
              borderColor: palette.line,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            {/* Card Header */}
            <View style={{ marginBottom: 18 }}>
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 24,
                  lineHeight: 32,
                  color: palette.txt,
                  paddingTop: 2,
                }}
              >
                Créer un compte
              </Text>
              <Text
                style={{
                  fontFamily: font.nativeFamily.serif,
                  fontStyle: 'italic',
                  fontSize: 14.5,
                  color: palette.inkSoft,
                  marginTop: 2,
                }}
              >
                Deviens le maître du buzzer et défie tes amis
              </Text>
            </View>

            {/* Username Input */}
            <FormInput
              label="Nom d'utilisateur"
              leftIcon={User}
              value={username}
              onChangeText={setUsername}
              placeholder="Choisis un pseudo unique"
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Email Input */}
            <FormInput
              label="Adresse email"
              leftIcon={Mail}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com (pour récupérer ton compte)"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Password Input */}
            <FormInput
              label="Mot de passe"
              leftIcon={Lock}
              value={password}
              onChangeText={setPassword}
              placeholder="Au moins 8 caractères"
              error={errors.password}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Confirm Password Input */}
            <FormInput
              label="Confirmer le mot de passe"
              leftIcon={Lock}
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

            {/* Register CTA Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
              style={{
                height: 52,
                borderRadius: 16,
                backgroundColor: palette.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
                shadowColor: palette.primary,
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 3,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={palette.primaryInk} />
                  <Text
                    style={{
                      color: palette.primaryInk,
                      fontWeight: '700',
                      fontSize: 16,
                      marginLeft: 8,
                    }}
                  >
                    Création en cours...
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      color: palette.primaryInk,
                      fontWeight: '700',
                      fontSize: 16,
                      marginRight: 8,
                    }}
                  >
                    Créer mon compte
                  </Text>
                  <ArrowRight size={18} color={palette.primaryInk} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 18,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: palette.inkSoft,
                  paddingHorizontal: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                ou
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
            </View>

            {/* Social Logins */}
            <View style={{ gap: 10 }}>
              <GoogleSignInButton
                onSuccess={() => router.replace('/(tabs)/rooms')}
                disabled={isLoading}
              />
              <AppleSignInButton
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
                marginTop: 20,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: palette.line,
              }}
            >
              <Text style={{ fontSize: 13.5, color: palette.inkSoft }}>
                Déjà inscrit ?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 13.5,
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
