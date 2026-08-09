import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '~/stores/useAuthStore';
import { palette } from '~/lib/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg px-6 justify-center items-center">
      <View className="flex-col items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-accent/15 flex-col items-center justify-center mb-4 border border-line">
          <User size={40} color={palette.primary} />
        </View>
        <Text className="text-txt font-bold text-2xl mb-1 text-center">
          {user?.username || 'Joueur'}
        </Text>
        {user?.email ? (
          <Text className="text-txt-60 text-sm text-center mb-2">
            {user.email}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.8}
        className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-buzz flex-row items-center justify-center shadow-sm"
      >
        <LogOut size={20} color="#FFFFFF" />
        <Text className="text-white font-bold text-base ml-2">
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
