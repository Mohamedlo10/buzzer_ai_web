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
import { palette, inkAlpha } from '~/lib/theme/tokens';

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
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View className="flex-col items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-accent/15 flex-col items-center justify-center mb-3 border border-line">
              <Sparkles size={36} color={palette.primary} />
            </View>
            <Text className="text-txt font-bold text-3xl mb-1 tracking-tight font-display">
              Xalaat
            </Text>
          </View>

          {/* Form Card */}
          <View className="w-full max-w-md self-center bg-surface rounded-3xl p-6 border border-line shadow-md">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="flex-row items-center gap-2 mb-6"
            >
              <ArrowLeft size={18} color={palette.txt} />
              <Text className="text-txt-60 text-sm font-semibold">Retour</Text>
            </TouchableOpacity>

            {!submitted ? (
              <>
                <View className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex-col items-center justify-center mb-5">
                  <Mail size={28} color={palette.primary} />
                </View>

                <h1 className="hidden">Mot de passe oublié</h1>
                <Text className="text-txt font-bold text-2xl mb-2 font-display">
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
