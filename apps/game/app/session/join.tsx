import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FolderOpen } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';

/**
 * Écran "Rejoindre une session".
 *
 * Les sessions se créent désormais depuis les salles.
 * Cet écran sert de page d'information et redirige vers les salles.
 */
export default function JoinSessionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>
        <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 20 }}>Rejoindre</Text>
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 32,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: palette.primary + '26',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <FolderOpen size={28} color={palette.primary} />
          </View>
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
            Nouveau fonctionnement
          </Text>
          <Text
            style={{
              color: palette.inkSoft,
              textAlign: 'center',
              fontSize: 14,
              lineHeight: 20,
              paddingHorizontal: 24,
              marginBottom: 24,
            }}
          >
            Les sessions se créent maintenant dans les salles. Rejoignez une salle pour participer aux parties.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/rooms')}
            activeOpacity={0.8}
            style={{
              backgroundColor: palette.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
              Voir mes salles
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
