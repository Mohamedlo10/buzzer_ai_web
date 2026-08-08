import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Palette } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg px-6 justify-center items-center">
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-accent/15 items-center justify-center mb-4">
          <Sparkles size={40} color="#B8462A" />
        </View>
        <Text className="text-txt font-bold text-3xl mb-1 tracking-tight">
          Xalaat
        </Text>
        <Text className="text-txt-60 font-medium text-base mb-2">
          Jeu de Quiz &amp; Buzzer Multijoueur
        </Text>
        <View className="bg-surface px-3 py-1 rounded-full border border-line">
          <Text className="text-txt-40 font-semibold text-xs">
            v1.0.0 — Phase 2B (Expo Router)
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/dev/tokens')}
        activeOpacity={0.8}
        className="w-full max-w-xs py-4 px-6 rounded-2xl bg-accent flex-row items-center justify-center shadow-sm"
      >
        <Palette size={20} color="#FBF4DF" />
        <Text className="text-btn-fg font-bold text-base ml-2">
          Banc d&apos;essai des tokens
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
