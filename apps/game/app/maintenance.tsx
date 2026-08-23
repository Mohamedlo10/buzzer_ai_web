import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, RefreshCw } from 'lucide-react-native';
import { apiClient } from '@xalaat/core';
import { palette, font } from '~/lib/theme/tokens';
import { XalaatMark } from '~/components/shared/XalaatMark';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* Header Logo */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
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
            <XalaatMark size={34} color={palette.primaryInk} accent={palette.gold} />
          </View>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 28,
              lineHeight: 36,
              color: palette.txt,
              paddingTop: 4,
            }}
          >
            Xalaat
          </Text>
        </View>

        {/* Maintenance Card */}
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: palette.surface,
            borderRadius: 28,
            padding: 28,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: palette.gold + '26',
              borderWidth: 1,
              borderColor: palette.gold + '4D',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Wrench size={32} color={palette.gold} />
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 22,
              lineHeight: 30,
              color: palette.txt,
              textAlign: 'center',
              paddingTop: 2,
              marginBottom: 10,
            }}
          >
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
