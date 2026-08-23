import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, RefreshCw, Sparkles } from 'lucide-react-native';
import { apiClient } from '@xalaat/core';
import { palette } from '~/lib/theme/tokens';

export default function MaintenanceScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await apiClient.get<{ status: string; maintenance?: boolean }>('/api/health');
      if (res.data && !res.data.maintenance) {
        router.replace('/(tabs)/rooms');
      }
    } catch {
      // server still unreachable or in maintenance
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Header Logo */}
        <View className="flex-col items-center mb-10">
          <View className="w-16 h-16 rounded-full bg-accent/15 flex-col items-center justify-center mb-3 border border-line">
            <Sparkles size={28} color={palette.primary} />
          </View>
          <Text className="text-txt font-bold text-2xl font-display">Xalaat</Text>
        </View>

        {/* Maintenance Card */}
        <View className="w-full max-w-md bg-surface rounded-3xl p-8 border border-line flex-col items-center text-center shadow-md">
          <View className="w-20 h-20 rounded-2xl bg-gold/15 border border-gold/30 flex-col items-center justify-center mb-6">
            <Wrench size={40} color={palette.gold} />
          </View>

          <h1 className="hidden">Maintenance en cours</h1>
          <Text className="text-txt font-bold text-2xl mb-3 font-display text-center">
            Maintenance en cours
          </Text>

          <Text className="text-txt-60 text-base text-center leading-relaxed mb-8">
            Xalaat est temporairement indisponible pour des opérations de maintenance. Nous serons de retour très bientôt !
          </Text>

          <TouchableOpacity
            onPress={checkStatus}
            disabled={isChecking}
            activeOpacity={0.8}
            className="w-full py-4 rounded-2xl bg-host flex-row items-center justify-center shadow-sm"
          >
            {isChecking ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color={palette.primaryInk} />
                <Text className="text-primary-ink font-bold text-base ml-2">
                  Vérification...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <RefreshCw size={18} color={palette.primaryInk} className="mr-2" />
                <Text className="text-primary-ink font-bold text-base">
                  Vérifier l&apos;état
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
