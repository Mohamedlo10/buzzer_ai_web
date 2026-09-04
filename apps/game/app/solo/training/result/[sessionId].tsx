import { useEffect } from 'react';
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
  ArrowLeft,
  Trophy,
  RotateCcw,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';

import { useTrainingStore } from '~/stores/useTrainingStore';
import { MasteryBar } from '~/components/training/MasteryBar';
import { GamificationSummaryCard } from '~/components/training/GamificationSummaryCard';
import { palette, font } from '~/lib/theme/tokens';
import { PopView, FadeInUpView } from '~/components/anim';

export default function TrainingResultScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const { result, isLoading, error: _error, loadResult, startRemediation, session: _session, reset } = useTrainingStore();

  useEffect(() => {
    if (sessionId && !result) {
      loadResult();
    }
  }, [sessionId]);

  const handleRemediation = async () => {
    try {
      await startRemediation();
      const state = useTrainingStore.getState();
      if (state.session) {
        router.replace(`/solo/training/session/${state.session.sessionId}` as any);
      }
    } catch (err) {
      console.error('Failed to start remediation', err);
    }
  };

  const handleFinish = () => {
    reset();
    router.replace('/solo/training' as any);
  };

  if (isLoading || !result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Calcul de vos résultats…</Text>
      </SafeAreaView>
    );
  }

  const isGood = result.masteryScore >= 70;
  const deltaPositive = result.progression.delta >= 0;

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
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleFinish}
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

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 20,
            color: palette.txt,
            paddingTop: 3,
            flex: 1,
          }}
        >
          Bilan
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* ── Mastery Score Card ── */}
        <PopView
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: isGood ? palette.good + '60' : palette.warn + '60',
            padding: 24,
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: isGood ? palette.good + '20' : palette.warn + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isGood ? (
              <Trophy size={36} color={palette.good} />
            ) : (
              <Brain size={34} color={palette.warn} />
            )}
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 44,
              color: isGood ? palette.good : palette.warn,
              paddingTop: 4,
            }}
          >
            {result.masteryScore}%
          </Text>

          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
            Score de maîtrise
          </Text>

          <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center' }}>
            {result.subject} · {result.correctChallenges}/{result.totalChallenges} bonnes réponses
          </Text>
        </PopView>

        {/* ── Gamification Summary (XP, Streak, Badges) ── */}
        {result.gamification && (
          <GamificationSummaryCard gamification={result.gamification} />
        )}

        {/* ── Dimension Scores ── */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 18,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', color: palette.txt }}>
            Scores par dimension
          </Text>
          <MasteryBar score={result.comprehensionScore} label="🧠 Compréhension" />
          <MasteryBar score={result.memorizationScore} label="📚 Mémorisation" />
          <MasteryBar score={result.applicationScore} label="⚡ Application" />
        </View>

        {/* ── Progression ── */}
        {result.progression.totalSessions > 1 && (
          <FadeInUpView
            duration={400}
            style={{
              backgroundColor: deltaPositive ? palette.good + '12' : palette.warn + '12',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: deltaPositive ? palette.good + '40' : palette.warn + '40',
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: deltaPositive ? palette.good + '22' : palette.warn + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {deltaPositive ? (
                <TrendingUp size={22} color={palette.good} />
              ) : (
                <TrendingDown size={22} color={palette.warn} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: deltaPositive ? palette.good : palette.warn }}>
                {deltaPositive ? '+' : ''}{result.progression.delta}%
              </Text>
              <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                Par rapport à la session précédente ({result.progression.previousScore}%)
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                Session {result.progression.totalSessions} sur ce sujet
              </Text>
            </View>
          </FadeInUpView>
        )}

        {/* ── Weaknesses ── */}
        {result.weaknesses.length > 0 && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 18,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color={palette.warn} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: palette.txt }}>
                Points à retravailler
              </Text>
            </View>

            {result.weaknesses.map((w, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: palette.bg,
                  borderRadius: 14,
                  padding: 14,
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
                  {w.notionTitle}
                </Text>
                <MasteryBar score={w.score} size="sm" />
              </View>
            ))}
          </View>
        )}

        {/* ── Action Buttons ── */}
        <View style={{ gap: 10, marginTop: 8 }}>
          {result.remediationAvailable && (
            <TouchableOpacity
              onPress={handleRemediation}
              activeOpacity={0.85}
              style={{
                backgroundColor: palette.warn,
                borderRadius: 18,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <RotateCcw size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
                Réviser mes erreurs
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleFinish}
            activeOpacity={0.85}
            style={{
              backgroundColor: palette.primary,
              borderRadius: 18,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Text style={{ color: palette.primaryInk, fontSize: 15, fontWeight: '800' }}>
              Terminer
            </Text>
            <ChevronRight size={16} color={palette.primaryInk} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
