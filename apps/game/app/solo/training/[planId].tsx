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
  Check,
  Clock,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  Zap,
  HelpCircle,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import { useSoloStore } from '~/stores/useSoloStore';
import type { SoloTrainingPlanResponse, TrainingLevelInfo } from '~/types/solo';
import { palette, font } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { QuizAiLoadingScreen } from '~/components/solo/QuizAiLoadingScreen';

const DIFFICULTY_COLORS: Record<string, string> = {
  FACILE: palette.good,
  MOYEN: palette.gold,
  DIFFICILE: palette.warn,
  EXTREME: palette.bad,
};

function formatSeriesInfo(subLevel: number, label?: string, subDifficulty?: string) {
  if (!label) {
    return {
      title: `Série ${subLevel}`,
      subtitle: subDifficulty ? `Niveau ${subDifficulty.toLowerCase()}` : 'Entraînement progressif',
    };
  }

  const match = label.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    const rawSubtitle = match[2].trim();
    return {
      title: `Série ${subLevel} · ${match[1].trim()}`,
      subtitle: rawSubtitle.charAt(0).toUpperCase() + rawSubtitle.slice(1),
    };
  }

  return {
    title: `Série ${subLevel} · ${label}`,
    subtitle: 'Série de questions générées par IA',
  };
}

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
          activeOpacity={0.8}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line }}
        >
          <Text style={{ color: palette.txt, fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const completedCount = plan.levels.filter((l) => l.userStatus === 'COMPLETED').length;
  const progressPct = Math.round((completedCount / plan.levels.length) * 100);
  const diffColor = DIFFICULTY_COLORS[plan.parentDifficulty] || palette.primary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Top Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 16,
            color: palette.txt,
            paddingTop: 2,
          }}
        >
          Entraînement Solo
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Theme Banner Card ── */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 20,
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Dumbbell size={14} color={palette.primary} />
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.primary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {plan.planType === 'CUSTOM' ? 'Plan Personnalisé' : 'Plan d’entraînement'}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: diffColor + '1A',
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: diffColor + '33',
                }}
              >
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: diffColor }}>
                  {plan.parentDifficulty}
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 22,
                color: palette.txt,
                lineHeight: 28,
                paddingTop: 4,
              }}
            >
              {plan.theme}
            </Text>
          </View>

          {/* Progress Overview Bar */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: palette.inkSoft, fontWeight: '600' }}>
                Progression globale
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: completedCount === 3 ? palette.good : palette.txt }}>
                {completedCount} / {plan.levels.length} séries ({progressPct}%)
              </Text>
            </View>

            <View style={{ height: 7, backgroundColor: palette.surface2, borderRadius: 9999, overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  backgroundColor: completedCount === 3 ? palette.good : palette.primary,
                  borderRadius: 9999,
                }}
              />
            </View>
          </View>
        </View>

        {/* ── 3 Series Progression List ── */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Séries d'entraînement (3 étapes)
            </Text>
          </View>

          {plan.levels.map((level, index) => {
            const isCompleted = level.userStatus === 'COMPLETED';
            const { title, subtitle } = formatSeriesInfo(level.subLevel, level.label, level.subDifficulty);

            return (
              <View
                key={level.subLevel}
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 22,
                  borderWidth: isCompleted ? 1.5 : 1,
                  borderColor: isCompleted ? palette.good + '50' : palette.line,
                  padding: 18,
                  gap: 14,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                {/* Header info */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  {/* Step Badge */}
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: isCompleted ? palette.good : palette.primary + '18',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    {isCompleted ? (
                      <Check size={20} color="#FFFFFF" strokeWidth={2.8} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.display,
                          fontSize: 16,
                          color: palette.primary,
                          paddingTop: 2,
                        }}
                      >
                        0{level.subLevel}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.display,
                          fontSize: 16,
                          color: palette.txt,
                          paddingTop: 2,
                        }}
                      >
                        {title}
                      </Text>

                      {isCompleted && (
                        <View
                          style={{
                            backgroundColor: palette.good + '22',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 9999,
                          }}
                        >
                          <Text style={{ color: palette.good, fontSize: 10.5, fontWeight: '800' }}>
                            COMPLÉTÉ ✓
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ fontSize: 12.5, color: palette.inkSoft, lineHeight: 17 }}>
                      {subtitle}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Zap size={13} color={palette.gold} />
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.txt }}>
                          {level.questionCount} questions
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action CTA Button */}
                <TouchableOpacity
                  onPress={() => handleStartSubLevel(level.subLevel)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: isCompleted ? palette.surface2 : palette.primary,
                    borderRadius: 16,
                    paddingVertical: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    shadowColor: isCompleted ? 'transparent' : palette.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isCompleted ? 0 : 0.2,
                    shadowRadius: 8,
                    elevation: isCompleted ? 0 : 2,
                  }}
                >
                  {isCompleted ? (
                    <>
                      <RotateCcw size={15} color={palette.txt} />
                      <Text style={{ color: palette.txt, fontSize: 14, fontWeight: '700' }}>
                        Rejouer cette série
                      </Text>
                    </>
                  ) : (
                    <>
                      <Play size={15} color={palette.primaryInk} style={{ marginLeft: 2 }} />
                      <Text style={{ color: palette.primaryInk, fontSize: 14.5, fontWeight: '800' }}>
                        Démarrer la série
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* ── Community Vote / Regeneration section ── */}
        {plan.planType === 'PREDEFINED' && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 18,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={palette.gold} />
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 15, color: palette.txt, paddingTop: 2 }}>
                Renouvellement des questions
              </Text>
            </View>

            <Text style={{ fontSize: 12.5, color: palette.inkSoft, lineHeight: 18 }}>
              Ce plan communautaire se régénère par IA dès qu’il atteint son quota de votes.
            </Text>

            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: palette.inkSoft, fontWeight: '600' }}>
                  Votes de la communauté
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: palette.gold }}>
                  {plan.voteCount} / {plan.votesNeeded}
                </Text>
              </View>

              <View style={{ height: 6, backgroundColor: palette.surface2, borderRadius: 9999, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round((plan.voteCount / plan.votesNeeded) * 100))}%`,
                    backgroundColor: palette.gold,
                    borderRadius: 9999,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleVote}
              disabled={plan.hasVoted || isVoting}
              activeOpacity={0.8}
              style={{
                backgroundColor: plan.hasVoted ? palette.surface2 : palette.gold + '20',
                borderWidth: 1,
                borderColor: plan.hasVoted ? palette.line : palette.gold + '40',
                borderRadius: 14,
                paddingVertical: 11,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                marginTop: 2,
              }}
            >
              {isVoting ? (
                <ActivityIndicator size="small" color={palette.gold} />
              ) : (
                <>
                  <ThumbsUp size={15} color={plan.hasVoted ? palette.inkSoft : palette.gold} />
                  <Text style={{ color: plan.hasVoted ? palette.inkSoft : palette.gold, fontSize: 13, fontWeight: '700' }}>
                    {plan.hasVoted ? 'Vous avez déjà voté ✓' : 'Voter pour de nouvelles questions'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── AI Brain Loading Screen ── */}
      <QuizAiLoadingScreen
        visible={isStartingSubLevel !== null}
        theme={plan.theme}
        levelLabel={`Série ${isStartingSubLevel ?? 1} · ${plan.parentDifficulty}`}
        title="Préparation de la série en cours"
      />
    </SafeAreaView>
  );
}
