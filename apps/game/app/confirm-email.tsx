import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, CheckCircle, XCircle, RefreshCw, Sparkles, ArrowRight } from 'lucide-react-native';
import { useAuthStore, authApi, usersApi } from '@xalaat/core';
import { palette } from '~/lib/theme/tokens';

type PageState = 'waiting' | 'verifying' | 'success' | 'error';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [pageState, setPageState] = useState<PageState>(token ? 'verifying' : 'waiting');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Case B: token in URL
  useEffect(() => {
    if (!token) return;

    authApi
      .verifyEmail(token)
      .then((verifiedUser) => {
        if (isAuthenticated && user && user.id === verifiedUser.id) {
          setUser(verifiedUser);
        }
        setPageState('success');
      })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? 'Lien de confirmation invalide ou expiré.';
        setErrorMessage(msg);
        setPageState('error');
      });
  }, [token, isAuthenticated, user, setUser]);

  // Case A: no token — poll until emailVerified
  useEffect(() => {
    if (token) return;
    if (!isAuthenticated) return;

    pollingRef.current = setInterval(async () => {
      try {
        const freshUser = await usersApi.getMe();
        if (freshUser.emailVerified) {
          clearInterval(pollingRef.current!);
          setUser(freshUser);
          setPageState('success');
        }
      } catch {
        // silent — keep polling
      }
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [token, isAuthenticated, setUser]);

  async function handleResend() {
    if (resendLoading || !isAuthenticated) return;
    setResendLoading(true);
    try {
      await usersApi.resendVerificationEmail();
      setResendSent(true);
    } catch {
      // ignore
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="px-6 py-8"
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

        {/* Card */}
        <View className="w-full max-w-md self-center bg-surface rounded-3xl p-6 border border-line shadow-md">
          {/* Waiting state */}
          {pageState === 'waiting' && (
            <View className="flex-col items-center text-center">
              <View className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex-col items-center justify-center mb-5">
                <Mail size={32} color={palette.primary} />
              </View>

              <Text className="text-txt font-bold text-2xl mb-2 font-display text-center">
                Vérifiez votre boîte mail
              </Text>

              {user?.email && (
                <Text className="text-txt-60 text-sm mb-6 text-center leading-relaxed">
                  Un lien de confirmation a été envoyé à{'\n'}
                  <Text className="text-txt font-semibold">{user.email}</Text>.{'\n'}
                  Cliquez sur le lien pour continuer.
                </Text>
              )}

              <View className="flex-row items-center justify-center gap-2 mb-6">
                <ActivityIndicator size="small" color={palette.primary} />
                <Text className="text-txt-60 text-xs">En attente de confirmation…</Text>
              </View>

              {!resendSent ? (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendLoading}
                  activeOpacity={0.8}
                  className="w-full py-3.5 rounded-2xl bg-surface2 border border-line flex-row items-center justify-center gap-2"
                >
                  <RefreshCw size={16} color={palette.txt} />
                  <Text className="text-txt font-semibold text-sm">
                    {resendLoading ? 'Envoi...' : "Renvoyer l'email"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="p-3 bg-good/15 rounded-xl border border-good/30 flex-row items-center justify-center gap-2">
                  <CheckCircle size={16} color={palette.good} />
                  <Text className="text-good font-medium text-xs">Email renvoyé !</Text>
                </View>
              )}
            </View>
          )}

          {/* Verifying state */}
          {pageState === 'verifying' && (
            <View className="flex-col items-center text-center py-6">
              <ActivityIndicator size="large" color={palette.primary} />
              <Text className="text-txt font-bold text-xl mt-4 mb-2 font-display">
                Vérification en cours...
              </Text>
              <Text className="text-txt-60 text-sm">Validation de votre adresse email</Text>
            </View>
          )}

          {/* Success state */}
          {pageState === 'success' && (
            <View className="flex-col items-center text-center">
              <View className="w-16 h-16 rounded-2xl bg-good/15 border border-good/30 flex-col items-center justify-center mb-5">
                <CheckCircle size={32} color={palette.good} />
              </View>

              <Text className="text-txt font-bold text-2xl mb-2 font-display text-center">
                Email confirmé !
              </Text>

              <Text className="text-txt-60 text-sm mb-6 text-center leading-relaxed">
                Votre adresse email a été validée avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de Xalaat.
              </Text>

              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/rooms')}
                activeOpacity={0.8}
                className="w-full py-4 rounded-2xl bg-host flex-row items-center justify-center shadow-md"
              >
                <Text className="text-primary-ink font-bold text-lg mr-2">
                  Accéder aux salons
                </Text>
                <ArrowRight size={20} color={palette.primaryInk} />
              </TouchableOpacity>
            </View>
          )}

          {/* Error state */}
          {pageState === 'error' && (
            <View className="flex-col items-center text-center">
              <View className="w-16 h-16 rounded-2xl bg-bad/15 border border-bad/30 flex-col items-center justify-center mb-5">
                <XCircle size={32} color={palette.bad} />
              </View>

              <Text className="text-txt font-bold text-2xl mb-2 font-display text-center">
                Erreur de validation
              </Text>

              <Text className="text-buzz text-sm mb-6 text-center leading-relaxed">
                {errorMessage || 'Le lien de confirmation est invalide ou a expiré.'}
              </Text>

              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}
                className="w-full py-3.5 rounded-2xl bg-surface2 border border-line flex-row items-center justify-center"
              >
                <Text className="text-txt font-bold text-base">
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
