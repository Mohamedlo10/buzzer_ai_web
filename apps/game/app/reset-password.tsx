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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Sparkles } from 'lucide-react-native';
import { authApi } from '@xalaat/core';
import { palette, inkAlpha } from '~/lib/theme/tokens';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token = '' } = useLocalSearchParams<{ token?: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; general?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!newPassword) e.newPassword = 'Mot de passe requis';
    else if (newPassword.length < 8) e.newPassword = 'Minimum 8 caractères';
    if (newPassword && newPassword !== confirmPassword) {
      e.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!validate()) return;
    if (!token) {
      setErrors({ general: 'Token manquant. Utilisez le lien reçu par email.' });
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      await authApi.resetPassword(token, newPassword);
      setDone(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Lien invalide ou expiré. Recommencez la procédure.';
      setErrors({ general: msg });
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
            {!done ? (
              <>
                {!token ? (
                  <View className="flex-col items-center text-center">
                    <View className="w-14 h-14 rounded-2xl bg-bad/15 border border-bad/30 flex-col items-center justify-center mb-5">
                      <XCircle size={28} color={palette.bad} />
                    </View>
                    <Text className="text-txt font-bold text-2xl mb-3 font-display text-center">
                      Lien invalide
                    </Text>
                    <Text className="text-txt-60 text-sm mb-6 text-center">
                      Utilisez le lien reçu par email pour réinitialiser votre mot de passe.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.replace('/forgot-password')}
                      activeOpacity={0.7}
                    >
                      <Text className="text-accent text-sm font-semibold">
                        Nouvelle demande de réinitialisation
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex-col items-center justify-center mb-5">
                      <Lock size={28} color={palette.primary} />
                    </View>

                    <Text className="text-txt font-bold text-2xl mb-2 font-display">
                      Nouveau mot de passe
                    </Text>
                    <Text className="text-txt-60 text-sm mb-6 leading-relaxed">
                      Définissez votre nouveau mot de passe (minimum 8 caractères).
                    </Text>

                    {errors.general && (
                      <View className="flex-row items-start gap-2 p-3 rounded-xl mb-5 bg-bad/15 border border-bad/30">
                        <XCircle size={16} color={palette.bad} className="mt-0.5" />
                        <Text className="text-buzz text-sm flex-1">{errors.general}</Text>
                      </View>
                    )}

                    {/* New password */}
                    <View className="flex-col mb-4">
                      <Text className="text-txt-60 text-sm font-medium mb-1.5">
                        Nouveau mot de passe
                      </Text>
                      <View className="relative flex-col justify-center">
                        <View className="absolute left-4 z-10">
                          <Lock size={20} color={inkAlpha.muted} />
                        </View>
                        <TextInput
                          value={newPassword}
                          onChangeText={(t) => {
                            setNewPassword(t);
                            setErrors((p) => ({ ...p, newPassword: undefined }));
                          }}
                          placeholder="Minimum 8 caractères"
                          placeholderTextColor={inkAlpha.faint}
                          secureTextEntry={!showNew}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isLoading}
                          className={`w-full pl-12 pr-14 py-3.5 rounded-2xl bg-bg text-txt text-base border ${
                            errors.newPassword ? 'border-buzz' : 'border-line'
                          }`}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNew(!showNew)}
                          activeOpacity={0.7}
                          className="absolute right-4 p-1 z-10"
                        >
                          {showNew ? (
                            <EyeOff size={22} color={inkAlpha.muted} />
                          ) : (
                            <Eye size={22} color={inkAlpha.muted} />
                          )}
                        </TouchableOpacity>
                      </View>
                      {errors.newPassword && (
                        <Text className="text-buzz text-sm mt-1 ml-2">{errors.newPassword}</Text>
                      )}
                    </View>

                    {/* Confirm password */}
                    <View className="flex-col mb-6">
                      <Text className="text-txt-60 text-sm font-medium mb-1.5">
                        Confirmer le mot de passe
                      </Text>
                      <View className="relative flex-col justify-center">
                        <View className="absolute left-4 z-10">
                          <Lock size={20} color={inkAlpha.muted} />
                        </View>
                        <TextInput
                          value={confirmPassword}
                          onChangeText={(t) => {
                            setConfirmPassword(t);
                            setErrors((p) => ({ ...p, confirmPassword: undefined }));
                          }}
                          placeholder="Répétez votre mot de passe"
                          placeholderTextColor={inkAlpha.faint}
                          secureTextEntry={!showConfirm}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isLoading}
                          onSubmitEditing={handleReset}
                          className={`w-full pl-12 pr-14 py-3.5 rounded-2xl bg-bg text-txt text-base border ${
                            errors.confirmPassword ? 'border-buzz' : 'border-line'
                          }`}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirm(!showConfirm)}
                          activeOpacity={0.7}
                          className="absolute right-4 p-1 z-10"
                        >
                          {showConfirm ? (
                            <EyeOff size={22} color={inkAlpha.muted} />
                          ) : (
                            <Eye size={22} color={inkAlpha.muted} />
                          )}
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword && (
                        <Text className="text-buzz text-sm mt-1 ml-2">{errors.confirmPassword}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={handleReset}
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
                            Mise à jour...
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-white font-bold text-lg">
                          Réinitialiser le mot de passe
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <View className="flex-col items-center text-center">
                <View className="w-14 h-14 rounded-2xl bg-good/15 border border-good/30 flex-col items-center justify-center mb-5">
                  <CheckCircle size={28} color={palette.good} />
                </View>
                <Text className="text-txt font-bold text-2xl mb-3 font-display text-center">
                  Mot de passe modifié !
                </Text>
                <Text className="text-txt-60 text-sm leading-relaxed mb-6 text-center">
                  Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/(auth)/login')}
                  activeOpacity={0.8}
                  className="w-full py-3.5 rounded-2xl bg-host flex-row items-center justify-center"
                >
                  <Text className="text-primary-ink font-bold text-base">
                    Se connecter
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
