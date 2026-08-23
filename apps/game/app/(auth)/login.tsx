import React, { useState } from 'react';
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
import { Check } from 'lucide-react-native';
import { useLoginForm } from '~/lib/hooks/useLoginForm';
import { GoogleSignInButton } from '~/components/auth/GoogleSignInButton';
import { AppleSignInButton } from '~/components/auth/AppleSignInButton';
import { XalaatMark } from '~/components/shared/XalaatMark';
import { FormInput } from '~/components/shared/FormInput';
import { palette, font } from '~/lib/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(true);
  const {
    username,
    setUsername,
    password,
    setPassword,
    errors,
    isLoading,
    isEmailInput,
    handleLogin,
  } = useLoginForm({
    onNavigate: (path) => {
      if (path === '/rooms' || path.startsWith('/(tabs)')) {
        router.replace('/(tabs)/rooms');
      } else {
        router.replace(path as any);
      }
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
            <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
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
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 30,
                  lineHeight: 38,
                  letterSpacing: -0.5,
                  color: palette.txt,
                  paddingTop: 2,
                }}
              >
                Connecte-toi à ton compte.
              </Text>

              <Text
                style={{
                  fontFamily: font.nativeFamily.serif,
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: palette.inkSoft,
                  marginTop: 6,
                }}
              >
                Ravi de te revoir !
              </Text>
            </View>

            {/* Form Inputs (Floating Notch Labels) */}
            <FormInput
              label="E-mail ou pseudo"
              value={username}
              onChangeText={setUsername}
              placeholder="exemple@email.com"
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <FormInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Ton mot de passe"
              error={errors.password}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              onSubmitEditing={handleLogin}
            />

            {/* Remember Me & Forgot Password Row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 22,
                marginTop: 2,
                paddingHorizontal: 2,
              }}
            >
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 1.5,
                    borderColor: rememberMe ? palette.primary : palette.line,
                    backgroundColor: rememberMe ? palette.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {rememberMe && <Check size={12} color={palette.primaryInk} strokeWidth={3} />}
                </View>
                <Text style={{ fontSize: 13, color: palette.inkSoft, fontWeight: '600' }}>
                  Se souvenir
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/forgot-password' as any)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, color: palette.inkSoft, fontWeight: '600' }}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
              style={{
                height: 50,
                borderRadius: 14,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
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
                  Connexion
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 22,
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

            {/* Switch to Register */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 26,
              }}
            >
              <Text style={{ fontSize: 13.5, color: palette.inkSoft }}>
                Pas encore de compte ?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register' as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: palette.primary,
                  }}
                >
                  Créer un compte
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
