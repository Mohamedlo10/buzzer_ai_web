import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gamepad2 } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg px-6 justify-center items-center">
      <View className="flex-col items-center">
        <View className="w-16 h-16 rounded-full bg-accent/15 flex-col items-center justify-center mb-4">
          <Gamepad2 size={32} color={palette.primary} />
        </View>
        <Text className="text-txt font-bold text-2xl mb-2 text-center">
          Mode Solo
        </Text>
        <Text className="text-txt-60 text-sm text-center">
          Entraînement et mode carrière disponibles prochainement.
        </Text>
      </View>
    </SafeAreaView>
  );
}
