import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, font } from '~/lib/theme/tokens';
import { Trophy, Target, Sparkles, ChevronRight, Zap } from 'lucide-react-native';

interface SoloHubCardProps {
  activeCareersCount?: number;
  sessionsCount?: number;
}

export function SoloHubCard({ activeCareersCount, sessionsCount }: SoloHubCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/solo' as any)}
      activeOpacity={0.88}
      style={{
        backgroundColor: palette.txt,
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 20,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 5,
        gap: 16,
      }}
    >
      {/* Decorative background glow circle */}
      <View
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(232, 166, 48, 0.08)',
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* Concentric Dual Badge */}
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            borderWidth: 2.5,
            borderColor: 'rgba(232, 166, 48, 0.35)',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(232, 166, 48, 0.06)',
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              borderWidth: 2,
              borderColor: palette.gold,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(232, 166, 48, 0.18)',
            }}
          >
            <Trophy size={24} color={palette.gold} />
          </View>
        </View>

        {/* Text info */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                backgroundColor: 'rgba(232, 166, 48, 0.22)',
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 9999,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: palette.gold,
                  fontWeight: '800',
                }}
              >
                Mode Solo
              </Text>
            </View>
            <Sparkles size={13} color={palette.primary} />
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 19,
              lineHeight: 24,
              color: palette.bg,
              paddingTop: 2,
            }}
          >
            Carrière & Entraînement
          </Text>

          <Text
            style={{
              fontFamily: font.nativeFamily.serif,
              fontStyle: 'italic',
              fontSize: 12.5,
              color: palette.bg,
              opacity: 0.85,
              lineHeight: 16,
            }}
          >
            Défiez l'IA en 12 niveaux ou maîtrisez de nouveaux sujets
          </Text>
        </View>
      </View>

      {/* Bottom Action Footer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Zap size={13} color={palette.gold} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>
              12 Niveaux
            </Text>
          </View>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Target size={13} color={palette.primary} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>
              Micro-défis IA
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: palette.primary }}>
            Jouer
          </Text>
          <ChevronRight size={15} color={palette.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
