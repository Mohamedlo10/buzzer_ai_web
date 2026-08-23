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
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Sparkles, Crown } from 'lucide-react-native';
import { useRegisterForm } from '~/lib/hooks/useRegisterForm';
import { GoogleSignInButton } from '~/components/auth/GoogleSignInButton';
import { AppleSignInButton } from '~/components/auth/AppleSignInButton';
import { XalaatMark } from '~/components/shared/XalaatMark';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';

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
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
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
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
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

            <Text
              style={{
                fontFamily: font.nativeFamily.serif,
                fontStyle: 'italic',
                fontSize: 14.5,
                color: palette.inkSoft,
                marginTop: 2,
              }}
            >
              Rejoins la communauté des joueurs de quiz
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
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 22,
                lineHeight: 30,
                color: palette.txt,
                textAlign: 'center',
                paddingTop: 2,
                marginBottom: 20,
              }}
            >
              Créer un compte
            </Text>

            {/* Username Input */}
            <View className="flex-col mb-4">
              <Text className="text-txt-60 text-sm font-medium mb-1.5">
                Nom d&apos;utilisateur
              </Text>
              <View className="relative flex-col justify-center">
                <View className="absolute left-4 z-10">
                  <User size={20} color={inkAlpha.muted} />
                </View>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choisissez un pseudo"
                  placeholderTextColor={inkAlpha.faint}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl bg-bg text-txt text-base border ${
                    errors.username ? 'border-buzz' : 'border-line'
                  }`}
                />
              </View>
              {errors.username ? (
                <Text className="text-buzz text-sm mt-1 ml-2">
                  {errors.username}
                </Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View className="flex-col mb-4">
              <Text className="text-txt-60 text-sm font-medium mb-1.5">
                Email
              </Text>
              <View className="relative flex-col justify-center">
                <View className="absolute left-4 z-10">
                  <Mail size={20} color={inkAlpha.muted} />
                </View>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={inkAlpha.faint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl bg-bg text-txt text-base border ${
                    errors.email ? 'border-buzz' : 'border-line'
                  }`}
                />
              </View>
              {errors.email ? (
                <Text className="text-buzz text-sm mt-1 ml-2">
                  {errors.email}
                </Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View className="flex-col mb-4">
              <Text className="text-txt-60 text-sm font-medium mb-1.5">
                Mot de passe
              </Text>
              <View className="relative flex-col justify-center">
                <View className="absolute left-4 z-10">
                  <Lock size={20} color={inkAlpha.muted} />
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 8 caractères"
                  placeholderTextColor={inkAlpha.faint}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  className={`w-full pl-12 pr-14 py-3.5 rounded-2xl bg-bg text-txt text-base border ${
                    errors.password ? 'border-buzz' : 'border-line'
                  }`}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  className="absolute right-4 p-1 z-10"
                >
                  {showPassword ? (
                    <EyeOff size={22} color={inkAlpha.muted} />
                  ) : (
                    <Eye size={22} color={inkAlpha.muted} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text className="text-buzz text-sm mt-1 ml-2">
                  {errors.password}
                </Text>
              ) : null}
            </View>

            {/* Confirm Password Input */}
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
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmez votre mot de passe"
                  placeholderTextColor={inkAlpha.faint}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  onSubmitEditing={handleRegister}
                  className={`w-full pl-12 pr-14 py-3.5 rounded-2xl bg-bg text-txt text-base border ${
                    errors.confirmPassword ? 'border-buzz' : 'border-line'
                  }`}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                  className="absolute right-4 p-1 z-10"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={22} color={inkAlpha.muted} />
                  ) : (
                    <Eye size={22} color={inkAlpha.muted} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text className="text-buzz text-sm mt-1 ml-2">
                  {errors.confirmPassword}
                </Text>
              ) : null}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
              className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${
                isLoading ? 'bg-surface2 opacity-70' : 'bg-buzz'
              }`}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color={palette.txt} />
                  <Text className="text-txt font-bold text-lg ml-2">
                    Création...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Text className="text-white font-bold text-lg mr-2">
                    Créer mon compte
                  </Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-line" />
              <Text className="text-txt-40 text-xs font-semibold px-3 uppercase tracking-wider">
                ou
              </Text>
              <View className="flex-1 h-px bg-line" />
            </View>

            {/* Google & Apple Sign In */}
            <GoogleSignInButton
              onSuccess={() => router.replace('/(tabs)/rooms')}
              disabled={isLoading}
            />

            <AppleSignInButton
              onSuccess={() => router.replace('/(tabs)/rooms')}
              disabled={isLoading}
            />

            {/* Login Link */}
            <View className="mt-5 flex-row items-center justify-center flex-wrap">
              <Text className="text-txt-60 text-base">
                Déjà un compte ?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.7}
                className="flex-row items-center"
              >
                <Text className="text-accent text-base font-bold mr-1">
                  Se connecter
                </Text>
                <Sparkles size={16} color={palette.gold} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
