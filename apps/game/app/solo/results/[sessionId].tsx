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
  Trophy,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import type { SoloSessionResultResponse, AnswerSummary } from '~/types/solo';
import { palette } from '~/lib/theme/tokens';
import { PopView, FadeInUpView } from '~/components/anim';

function AnswerRow({ answer }: { answer: AnswerSummary }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.line,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
        style={{
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }} numberOfLines={1}>
            {answer.questionText}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: answer.correct ? palette.good : palette.bad,
              }}
            >
              {answer.correct ? 'Correct' : 'Incorrect'}
            </Text>
            <Text style={{ color: palette.inkSoft, fontSize: 11 }}>•</Text>
            <Text style={{ fontSize: 12, color: palette.inkSoft }} numberOfLines={1}>
              Votre choix : {answer.userAnswer || '(temps écoulé)'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {answer.correct ? (
            <CheckCircle size={18} color={palette.good} />
          ) : (
            <XCircle size={18} color={palette.bad} />
          )}
          {isOpen ? (
            <ChevronUp size={16} color={palette.inkSoft} />
          ) : (
            <ChevronDown size={16} color={palette.inkSoft} />
          )}
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 14,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: palette.line,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: palette.bg, padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase' }}>
                Votre réponse
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: answer.correct ? palette.good : palette.bad, marginTop: 2 }}>
                {answer.userAnswer || '(temps écoulé)'}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: palette.bg, padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase' }}>
                Bonne réponse
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.good, marginTop: 2 }}>
                {answer.correctAnswer}
              </Text>
            </View>
          </View>

          {answer.explanation ? (
            <View style={{ backgroundColor: palette.surface2, padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: palette.txt, marginBottom: 2 }}>
                Explication :
              </Text>
              <Text style={{ fontSize: 12, color: palette.inkSoft, lineHeight: 16 }}>
                {answer.explanation}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function SoloResultsScreen() {
  const router = useRouter();
  const { sessionId, careerId: paramCareerId, planId: paramPlanId } = useLocalSearchParams<{
    sessionId: string;
    careerId?: string;
    planId?: string;
  }>();

  const storeCareerId = useSoloStore((s) => s.careerId);
  const storePlanId = useSoloStore((s) => s.planId);

  const [results, setResults] = useState<SoloSessionResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const effectiveCareerId =
    results?.careerLevelResult?.careerId || paramCareerId || storeCareerId;
  const effectivePlanId = paramPlanId || storePlanId;

  const navigateToProfile = () => {
    if (effectiveCareerId) {
      router.replace(`/solo/career/${effectiveCareerId}` as any);
    } else if (effectivePlanId) {
      router.replace(`/solo/training/${effectivePlanId}` as any);
    } else {
      router.replace('/(tabs)/dashboard' as any);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await soloApi.getResults(sessionId!);
        setResults(data);
      } catch (err) {
        console.error('Failed to fetch results', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (sessionId) fetchResults();
  }, [sessionId]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Calcul de vos scores…</Text>
      </SafeAreaView>
    );
  }

  if (!results) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <AlertCircle size={40} color={palette.bad} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.txt }}>Résultats introuvables</Text>
        <TouchableOpacity
          onPress={navigateToProfile}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: palette.surface }}
        >
          <Text style={{ color: palette.txt, fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCareer = !!results.careerLevelResult;
  const isPassed = results.passed;

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
          onPress={navigateToProfile}
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

        <Text style={{ fontSize: 20, fontWeight: '800', color: palette.txt, flex: 1 }}>
          Résultats
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <PopView
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: isPassed ? palette.good : palette.warn,
            padding: 24,
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isPassed ? palette.good + '26' : palette.warn + '26',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPassed ? (
              <Trophy size={32} color={palette.good} />
            ) : (
              <RotateCcw size={30} color={palette.warn} />
            )}
          </View>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: isPassed ? palette.good : palette.txt }}>
              {isPassed ? 'Niveau Validé !' : 'Niveau Non Validé'}
            </Text>
            <Text style={{ fontSize: 13, color: palette.inkSoft }}>
              {isPassed
                ? 'Félicitations, vous débloquez le palier supérieur !'
                : `Seuil de réussite requis : ${Math.round(results.threshold * 100)}%`}
            </Text>
          </View>

          {/* Stats Bar */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              width: '100%',
              backgroundColor: palette.bg,
              borderRadius: 16,
              padding: 14,
              marginTop: 4,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: palette.gold }}>
                +{results.score} pts
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                Score gagné
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: palette.line }} />

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: palette.txt }}>
                {results.correctAnswers} / {results.totalQuestions}
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                Bonnes réponses
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: palette.line }} />

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: isPassed ? palette.good : palette.warn }}>
                {Math.round(results.accuracy * 100)}%
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                Précision
              </Text>
            </View>
          </View>
        </PopView>

        {/* Answers Detailed Breakdown */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
            Détail des questions
          </Text>

          {results.answers && results.answers.length > 0 ? (
            results.answers.map((ans, idx) => (
              <AnswerRow key={idx} answer={ans} />
            ))
          ) : null}
        </View>

        {/* Return Button */}
        <TouchableOpacity
          onPress={navigateToProfile}
          activeOpacity={0.8}
          style={{
            backgroundColor: palette.primary,
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ color: palette.primaryInk, fontSize: 15, fontWeight: '700' }}>
            Continuer
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
