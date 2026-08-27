import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Brain, ChevronRight } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { SoloCareerProgressResponse } from '~/types/solo';
import type { TrainingSessionSummary } from '~/types/training';

interface SoloModeCardsProps {
  activeCareer?: SoloCareerProgressResponse | null;
  trainingSession?: TrainingSessionSummary | null;
}

const BRIGHT_YELLOW = '#FFC72C';
const YELLOW_DARK = '#C98A00';

export function SoloModeCards({ activeCareer, trainingSession }: SoloModeCardsProps) {
  const router = useRouter();

  const hasActiveCareer = !!(activeCareer && activeCareer.status === 'ACTIVE');
  const hasActiveTraining = !!(trainingSession && trainingSession.status === 'IN_PROGRESS');

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* ── 1. Carte Carrière (Thème Jaune Éclatant) ── */}
      <TouchableOpacity
        onPress={() => {
          if (hasActiveCareer) {
            router.push(`/solo/career/${activeCareer!.careerId}` as any);
          } else {
            router.push('/solo/career/new' as any);
          }
        }}
        activeOpacity={0.85}
        style={{
          flex: 1,
          backgroundColor: palette.surface,
          borderRadius: 20,
          borderWidth: 0.2,
          borderColor: hasActiveCareer ? YELLOW_DARK : palette.line,
          padding: 14,
          minHeight: 120,
          justifyContent: 'space-between',
          shadowColor: BRIGHT_YELLOW,
          shadowOpacity: hasActiveCareer ? 0.15 : 0.02,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: 'rgba(255, 199, 44, 0.22)',
              borderWidth: 1,
              borderColor: BRIGHT_YELLOW,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={17} color={YELLOW_DARK} />
          </View>

          <View
            style={{
              backgroundColor: 'rgba(255, 199, 44, 0.25)',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: 'rgba(255, 199, 44, 0.5)',
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '900', color: YELLOW_DARK, textTransform: 'uppercase' }}>
              {hasActiveCareer ? `Niv. ${activeCareer!.currentLevel}/12` : 'Carrière'}
            </Text>
          </View>
        </View>

        <View style={{ gap: 2, marginVertical: 4 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 16,
              lineHeight: 20,
              color: palette.txt,
              paddingTop: 6,
            }}
            numberOfLines={1}
          >
            {hasActiveCareer ? activeCareer!.category : 'Mode 12 Niveaux'}
          </Text>
          <Text style={{ fontSize: 11, color: palette.inkSoft }} numberOfLines={1}>
            {hasActiveCareer
              ? `${activeCareer!.completionPercentage}% complété`
              : 'Progresse de palier'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
          <Text style={{ fontSize: 11.5, fontWeight: '900', color: YELLOW_DARK }}>
            {hasActiveCareer ? 'Continuer' : 'Démarrer'}
          </Text>
          <ChevronRight size={13} color={YELLOW_DARK} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>

      {/* ── 2. Carte Entraînement (Thème Orange) ── */}
      <TouchableOpacity
        onPress={() => {
          if (hasActiveTraining) {
            router.push(`/solo/training/session/${trainingSession!.sessionId}` as any);
          } else {
            router.push('/solo/training' as any);
          }
        }}
        activeOpacity={0.85}
        style={{
          flex: 1,
          backgroundColor: palette.surface,
          borderRadius: 20,
          borderWidth: 0.3,
          borderColor: hasActiveTraining ? palette.primary : palette.line,
          padding: 14,
          minHeight: 120,
          justifyContent: 'space-between',
          shadowColor: palette.primary,
          shadowOpacity: hasActiveTraining ? 0.12 : 0.02,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: palette.primary + '22',
              borderWidth: 1,
              borderColor: palette.primary + '60',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={17} color={palette.primary} />
          </View>

          <View
            style={{
              backgroundColor: palette.primary + '18',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: palette.primary + '40',
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '900', color: palette.primary, textTransform: 'uppercase' }}>
              {hasActiveTraining ? `Unité ${trainingSession!.currentUnit}/${trainingSession!.totalUnits}` : 'Entraînement'}
            </Text>
          </View>
        </View>

        <View style={{ gap: 2, marginVertical: 4 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 16,
              lineHeight: 20,
              color: palette.txt,
              paddingTop: 6,
            }}
            numberOfLines={1}
          >
            {hasActiveTraining ? trainingSession!.subject : 'Apprendre & Tester'}
          </Text>
          <Text style={{ fontSize: 11, color: palette.inkSoft }} numberOfLines={1}>
            {hasActiveTraining
              ? `${trainingSession!.percentComplete}% terminé`
              : 'Fiches et micro-défis IA'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
          <Text style={{ fontSize: 11.5, fontWeight: '800', color: palette.primary }}>
            {hasActiveTraining ? 'Reprendre' : 'Explorer'}
          </Text>
          <ChevronRight size={13} color={palette.primary} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
