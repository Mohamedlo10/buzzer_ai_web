import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Palette, LogIn } from 'lucide-react-native';
import { useAuthStore } from '~/stores/useAuthStore';
import { palette, inkAlpha } from '~/lib/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/rooms');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <SafeAreaView className="flex-1 bg-bg px-6 justify-center items-center">
      <View className="flex-col items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-accent/15 flex-col items-center justify-center mb-4">
          <Sparkles size={40} color={palette.primary} />
        </View>
        <Text className="text-txt font-bold text-3xl mb-1 tracking-tight">
          Xalaat
        </Text>
        <Text className="text-txt-60 font-medium text-base mb-4 text-center">
          Jeu de Quiz &amp; Buzzer Multijoueur
        </Text>
        <ActivityIndicator size="small" color={palette.primary} />
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        activeOpacity={0.8}
        className="w-full max-w-xs py-4 px-6 rounded-2xl bg-buzz flex-row items-center justify-center shadow-sm mb-3"
      >
        <LogIn size={20} color="#FFFFFF" />
        <Text className="text-white font-bold text-base ml-2">
          Se connecter
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/dev/tokens')}
        activeOpacity={0.8}
        className="w-full max-w-xs py-3 px-6 rounded-2xl bg-surface border border-line flex-row items-center justify-center"
      >
        <Palette size={18} color={inkAlpha.soft} />
        <Text className="text-txt-60 font-semibold text-sm ml-2">
          Banc d&apos;essai des tokens
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
