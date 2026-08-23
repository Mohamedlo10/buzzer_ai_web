import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react-native';
import { authApi } from '@xalaat/core';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';
import { XalaatMark } from '~/components/shared/XalaatMark';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email requis');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Format d'email invalide");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(trimmed);
      setSubmitted(true);
    } catch {
      // Same message regardless of error to avoid revealing if email exists
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                shadowColor: palette.primary,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <XalaatMark size={36} color={palette.primaryInk} accent={palette.gold} />
            </View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 32,
                lineHeight: 42,
                letterSpacing: -0.5,
                color: palette.txt,
                paddingTop: 4,
              }}
            >
              Xalaat
            </Text>
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
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}
            >
              <ArrowLeft size={18} color={palette.txt} />
              <Text style={{ color: palette.inkSoft, fontSize: 13, fontWeight: '600' }}>Retour</Text>
            </TouchableOpacity>

            {!submitted ? (
              <>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: palette.primary + '1A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Mail size={24} color={palette.primary} />
                </View>

                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 22,
                    lineHeight: 30,
                    color: palette.txt,
                    paddingTop: 2,
                    marginBottom: 8,
                  }}
                >
                  Mot de passe oublié ?
                </Text>
                <Text className="text-txt-60 text-sm mb-6 leading-relaxed">
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </Text>

                <View className="flex-col mb-5">
                  <Text className="text-txt-60 text-sm font-medium mb-2">Email</Text>
                  <View className="relative flex-col justify-center">
                    <View className="absolute left-4 z-10">
                      <Mail size={20} color={inkAlpha.muted} />
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setError('');
                      }}
                      placeholder="votre@email.com"
                      placeholderTextColor={inkAlpha.faint}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      onSubmitEditing={handleSubmit}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-bg text-txt text-base border ${
                        error ? 'border-buzz' : 'border-line'
                      }`}
                    />
                  </View>
                  {error ? (
                    <Text className="text-buzz text-sm mt-1.5 ml-2">{error}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${
                    isLoading ? 'bg-surface2 opacity-70' : 'bg-buzz'
                  }`}
                >
                  {isLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white font-bold text-lg ml-2">
                        Envoi...
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      Envoyer le lien
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="w-14 h-14 rounded-2xl bg-good/15 border border-good/30 flex-col items-center justify-center mb-5">
                  <CheckCircle size={28} color={palette.good} />
                </View>
                <Text className="text-txt font-bold text-2xl mb-3 font-display">
                  Email envoyé !
                </Text>
                <Text className="text-txt-60 text-sm leading-relaxed mb-6">
                  Si un compte est associé à <Text className="text-txt font-semibold">{email}</Text>, vous recevrez un lien de réinitialisation dans quelques instants.
                </Text>
                <Text className="text-txt-40 text-xs leading-relaxed mb-6">
                  Vérifiez également votre dossier spam. Le lien est valable 1 heure.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/(auth)/login')}
                  activeOpacity={0.8}
                  className="w-full py-3.5 rounded-2xl bg-host flex-row items-center justify-center"
                >
                  <Text className="text-primary-ink font-bold text-base">
                    Retour à la connexion
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
