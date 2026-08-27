import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Brain, ChevronRight, Sparkles } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { SoloCareerProgressResponse } from '~/types/solo';
import type { TrainingSessionSummary } from '~/types/training';

interface SoloHubCardProps {
  activeCareer?: SoloCareerProgressResponse | null;
  trainingSession?: TrainingSessionSummary | null;
}

const BRIGHT_YELLOW = '#FFC72C';

export function SoloHubCard({ activeCareer, trainingSession }: SoloHubCardProps) {
  const router = useRouter();

  const hasActiveCareer = !!(activeCareer && activeCareer.status === 'ACTIVE');
  const hasActiveTraining = !!(trainingSession && trainingSession.status === 'IN_PROGRESS');

  return (
    <View
      style={{
        backgroundColor: palette.txt,
        borderRadius: 24,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 5,
      }}
    >
      {/* Decorative background glow circle */}
      <View
        style={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(255, 199, 44, 0.1)',
        }}
      />

      {/* ── Header Tag ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              backgroundColor: 'rgba(255, 199, 44, 0.22)',
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: 'rgba(255, 199, 44, 0.4)',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: BRIGHT_YELLOW,
                fontWeight: '900',
              }}
            >
              Hub Solo
            </Text>
          </View>
          <Sparkles size={12} color={palette.primary} />
        </View>

        <Text style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.55)', fontWeight: '600' }}>
          Profils & Parcours
        </Text>
      </View>

      {/* ── Section 1 : Profil Carrière (Jaune Lumineux) ── */}
      <TouchableOpacity
        onPress={() => router.push('/solo/career' as any)}
        activeOpacity={0.82}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          paddingVertical: 14,
          gap: 14,
        }}
      >
        {/* Concentric Dual Gold Badge */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 2,
            borderColor: BRIGHT_YELLOW,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 199, 44, 0.22)',
          }}
        >
          <Trophy size={22} color={BRIGHT_YELLOW} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 18,
                lineHeight: 26,
                color: palette.bg,
                paddingTop: 4,
              }}
            >
              Carrière
            </Text>
            {hasActiveCareer && (
              <View
                style={{
                  backgroundColor: 'rgba(255, 199, 44, 0.25)',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 199, 44, 0.4)',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: BRIGHT_YELLOW }}>
                  Niv. {activeCareer!.currentLevel}
                </Text>
              </View>
            )}
          </View>

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
            12 niveaux par palier, classements & historique
          </Text>
        </View>

        {/* Arrow High-Contrast Button */}
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(255, 199, 44, 0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={18} color={BRIGHT_YELLOW} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>

      {/* Subtle Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          marginHorizontal: 18,
        }}
      />

      {/* ── Section 2 : Profil Entraînement ── */}
      <TouchableOpacity
        onPress={() => router.push('/solo/training' as any)}
        activeOpacity={0.82}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          paddingVertical: 14,
          paddingBottom: 16,
          gap: 14,
        }}
      >
        {/* Concentric Dual Terracotta Badge */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 2,
            borderColor: palette.primary,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(209, 87, 58, 0.18)',
          }}
        >
          <Brain size={22} color={palette.primary} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 18,
                lineHeight: 26,
                color: palette.bg,
                paddingTop: 4,
              }}
            >
              Entraînement
            </Text>
            {hasActiveTraining && (
              <View
                style={{
                  backgroundColor: 'rgba(209, 87, 58, 0.25)',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: palette.primary }}>
                  En cours
                </Text>
              </View>
            )}
          </View>

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
            Fiches de synthèse, détection des lacunes & IA
          </Text>
        </View>

        {/* Arrow High-Contrast Button */}
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(209, 87, 58, 0.35)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={18} color={palette.primary} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
