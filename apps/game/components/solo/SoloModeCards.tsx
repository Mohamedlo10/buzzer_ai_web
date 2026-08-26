import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Brain, ChevronRight, Plus, RotateCcw, Play } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { SoloCareerProgressResponse } from '~/types/solo';
import type { TrainingSessionSummary } from '~/types/training';

interface SoloModeCardsProps {
  activeCareer?: SoloCareerProgressResponse | null;
  trainingSession?: TrainingSessionSummary | null;
}

export function SoloModeCards({ activeCareer, trainingSession }: SoloModeCardsProps) {
  const router = useRouter();

  const hasActiveCareer = !!(activeCareer && activeCareer.status === 'ACTIVE');
  const hasActiveTraining = !!(trainingSession && trainingSession.status === 'IN_PROGRESS');

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* ── 1. Carte Carrière ── */}
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
          borderWidth: 1,
          borderColor: hasActiveCareer ? palette.gold + '40' : palette.line,
          padding: 14,
          minHeight: 120,
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOpacity: 0.03,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: palette.gold + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={16} color={palette.gold} />
          </View>

          <View
            style={{
              backgroundColor: palette.gold + '18',
              paddingHorizontal: 7,
              paddingVertical: 2.5,
              borderRadius: 9999,
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: palette.gold, textTransform: 'uppercase' }}>
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
          <Text style={{ fontSize: 11.5, fontWeight: '800', color: palette.gold }}>
            {hasActiveCareer ? 'Continuer' : 'Démarrer'}
          </Text>
          <ChevronRight size={13} color={palette.gold} />
        </View>
      </TouchableOpacity>

      {/* ── 2. Carte Entraînement ── */}
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
          borderWidth: 1,
          borderColor: hasActiveTraining ? palette.primary + '40' : palette.line,
          padding: 14,
          minHeight: 120,
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOpacity: 0.03,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: palette.primary + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={16} color={palette.primary} />
          </View>

          <View
            style={{
              backgroundColor: palette.primary + '18',
              paddingHorizontal: 7,
              paddingVertical: 2.5,
              borderRadius: 9999,
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: palette.primary, textTransform: 'uppercase' }}>
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
          <ChevronRight size={13} color={palette.primary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
