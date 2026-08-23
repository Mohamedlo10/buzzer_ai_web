import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Dumbbell,
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  ThumbsUp,
  RotateCcw,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import { useSoloStore } from '~/stores/useSoloStore';
import type { SoloTrainingPlanResponse, TrainingLevelInfo } from '~/types/solo';
import { palette } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';

export default function TrainingPlanDetailScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const startNewSession = useSoloStore((s) => s.startNewSession);

  const [plan, setPlan] = useState<SoloTrainingPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingSubLevel, setIsStartingSubLevel] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const data = await soloApi.getTrainingPlan(planId!);
        setPlan(data);
      } catch (err) {
        console.error('Failed to fetch plan', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (planId) fetchPlan();
  }, [planId]);

  const handleStartSubLevel = async (subLevel: number) => {
    setIsStartingSubLevel(subLevel);
    try {
      const startData = await soloApi.startTrainingLevel(planId!, subLevel);
      startNewSession(startData);
      router.push(`/solo/game/${startData.sessionId}` as any);
    } catch (err: any) {
      notifyApiError(err, 'Erreur lors du lancement de la série');
    } finally {
      setIsStartingSubLevel(null);
    }
  };

  const handleVote = async () => {
    setIsVoting(true);
    try {
      const res = await soloApi.voteRegeneration(planId!);
      notify.success('Vote enregistré !');
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              voteCount: res.voteCount,
              hasVoted: true,
            }
          : null
      );
    } catch (err: any) {
      notifyApiError(err, 'Impossible de voter');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement du plan…</Text>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.txt }}>Plan introuvable</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: palette.surface }}
        >
          <Text style={{ color: palette.txt, fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          backgroundColor: palette.bg,
          gap: 12,
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
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: palette.txt }} numberOfLines={1}>
            {plan.theme}
          </Text>
          <Text style={{ fontSize: 12, color: palette.inkSoft }}>
            Difficulté : {plan.parentDifficulty}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* 3 Sublevels List */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
            Séries d'entraînement (3 niveaux)
          </Text>

          {plan.levels.map((level) => {
            const isCompleted = level.userStatus === 'COMPLETED';
            const isStarting = isStartingSubLevel === level.subLevel;

            return (
              <View
                key={level.subLevel}
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isCompleted ? palette.good + '40' : palette.line,
                  padding: 16,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
                      Série {level.subLevel} · {level.label || level.subDifficulty}
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                      {level.questionCount} questions
                    </Text>
                  </View>

                  {isCompleted && (
                    <View
                      style={{
                        backgroundColor: palette.good + '26',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 9999,
                      }}
                    >
                      <Text style={{ color: palette.good, fontSize: 10, fontWeight: '800' }}>
                        COMPLÉTÉ ✓
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleStartSubLevel(level.subLevel)}
                  disabled={isStarting}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isCompleted ? palette.surface2 : palette.primary,
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {isStarting ? (
                    <ActivityIndicator size="small" color={palette.primaryInk} />
                  ) : (
                    <>
                      <Play size={16} color={isCompleted ? palette.txt : palette.primaryInk} />
                      <Text
                        style={{
                          color: isCompleted ? palette.txt : palette.primaryInk,
                          fontSize: 14,
                          fontWeight: '700',
                        }}
                      >
                        {isCompleted ? 'Rejouer cette série' : 'Démarrer la série'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Community Vote / Regeneration section */}
        {plan.planType === 'PREDEFINED' && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
              Régénération communautaire
            </Text>
            <Text style={{ fontSize: 12, color: palette.inkSoft, lineHeight: 16 }}>
              {plan.voteCount} / {plan.votesNeeded} votes pour renouveler automatiquement la banque de questions par IA.
            </Text>
            <TouchableOpacity
              onPress={handleVote}
              disabled={plan.hasVoted || isVoting}
              activeOpacity={0.8}
              style={{
                backgroundColor: plan.hasVoted ? palette.surface2 : palette.gold + '26',
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <ThumbsUp size={16} color={plan.hasVoted ? palette.inkSoft : palette.gold} />
              <Text style={{ color: plan.hasVoted ? palette.inkSoft : palette.gold, fontSize: 13, fontWeight: '700' }}>
                {plan.hasVoted ? 'Vous avez déjà voté' : 'Voter pour de nouvelles questions'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
