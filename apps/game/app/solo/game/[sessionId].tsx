import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronRight,
  HelpCircle,
} from 'lucide-react-native';

import { AnswerChoicesPanel } from '~/components/game/AnswerChoicesPanel';
import { useSoloStore } from '~/stores/useSoloStore';
import { palette } from '~/lib/theme/tokens';
import { confirmAsync } from '~/lib/ui/confirm';
import { PopView, FadeInUpView } from '~/components/anim';

export default function SoloGameScreen() {
  const router = useRouter();
  const { sessionId, careerId: paramCareerId, planId: paramPlanId } = useLocalSearchParams<{
    sessionId: string;
    careerId?: string;
    planId?: string;
  }>();

  const storeCareerId = useSoloStore((s) => s.careerId);
  const storePlanId = useSoloStore((s) => s.planId);

  const effectiveCareerId = paramCareerId || storeCareerId;
  const effectivePlanId = paramPlanId || storePlanId;

  const navigateToProfile = () => {
    if (effectiveCareerId) {
      router.replace(`/solo/career/${effectiveCareerId}` as any);
    } else if (effectivePlanId) {
      router.replace(`/solo/training/${effectivePlanId}` as any);
    } else {
      router.replace('/(tabs)/solo' as any);
    }
  };

  const {
    currentQuestion,
    reveal,
    phase,
    totalQuestions,
    isSubmitting,
    isLoading,
    error,
    loadSession,
    answerQuestion,
    advanceQuestion,
    resetStore,
  } = useSoloStore();

  const [startTime, setStartTime] = useState<number>(Date.now());
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (sessionId) {
      const state = useSoloStore.getState();
      if (state.sessionId === sessionId && state.currentQuestion) {
        setStartTime(Date.now());
        hasLoadedRef.current = true;
      } else {
        loadSession(sessionId)
          .then(() => {
            setStartTime(Date.now());
            hasLoadedRef.current = true;
          })
          .catch((err) => {
            console.error('Failed to load solo session', err);
          });
      }
    }
  }, [sessionId, loadSession]);

  useEffect(() => {
    if (phase === 'QUESTION' && hasLoadedRef.current) {
      setStartTime(Date.now());
    }
  }, [phase]);

  const handleSubmitAnswer = async (chosenAnswer: string) => {
    if (phase !== 'QUESTION') return;
    const timeSpentMs = Math.max(100, Date.now() - startTime);
    const finalAnswer = chosenAnswer === '__timeout__' ? '' : chosenAnswer;
    try {
      await answerQuestion(finalAnswer, timeSpentMs);
    } catch (err: any) {
      console.error('Failed to submit answer', err?.response?.data || err);
    }
  };

  const handleNext = async () => {
    try {
      const { completed } = await advanceQuestion();
      if (completed) {
        const queryParams = effectiveCareerId
          ? `?careerId=${effectiveCareerId}`
          : effectivePlanId
            ? `?planId=${effectivePlanId}`
            : '';
        router.replace(`/solo/results/${sessionId}${queryParams}` as any);
      }
    } catch (err) {
      console.error('Failed to advance question', err);
    }
  };

  const handleQuit = async () => {
    const ok = await confirmAsync({
      title: 'Quitter la partie',
      message: 'Voulez-vous quitter ? Votre progression actuelle est sauvegardée.',
    });
    if (ok) {
      navigateToProfile();
    }
  };

  if (isLoading && !currentQuestion) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Préparation des questions…</Text>
      </SafeAreaView>
    );
  }

  if (error && !currentQuestion) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.bad }}>Erreur de chargement</Text>
        <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={navigateToProfile}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: palette.surface }}
        >
          <Text style={{ color: palette.txt, fontWeight: '700' }}>Quitter la session</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) return null;

  const showCorrect = reveal?.correct === true;
  const showWrong = reveal?.correct === false;
  const isLast = reveal?.isLastQuestion || currentQuestion.questionNumber === totalQuestions;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
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
          onPress={handleQuit}
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

        <View
          style={{
            backgroundColor: palette.surface,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text style={{ color: palette.txt, fontSize: 13, fontWeight: '700' }}>
            Question {currentQuestion.questionNumber} / {totalQuestions}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Identification Image */}
        {currentQuestion.questionType === 'IDENTIFICATION' && currentQuestion.imageUrl && (
          <View
            style={{
              width: '100%',
              aspectRatio: 16 / 10,
              borderRadius: 20,
              overflow: 'hidden',
              backgroundColor: palette.surface2,
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <Image
              source={{ uri: currentQuestion.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Question Text Box */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 20,
            minHeight: 110,
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: palette.txt, textAlign: 'center', lineHeight: 24 }}>
            {currentQuestion.text}
          </Text>
        </View>

        {/* Answer Choices Panel */}
        <AnswerChoicesPanel
          choices={currentQuestion.answerChoices}
          myChoice={reveal?.userAnswer ?? null}
          correctAnswer={reveal?.correctAnswer}
          isRevealing={!!reveal}
          canAnswer={phase === 'QUESTION' && !reveal && !isSubmitting}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isSubmitting}
        />

        {/* Reveal Overlay / Explanations */}
        {reveal && (
          <FadeInUpView
            duration={300}
            style={{
              backgroundColor: showCorrect ? palette.good + '1A' : palette.bad + '1A',
              borderColor: showCorrect ? palette.good + '60' : palette.bad + '60',
              borderWidth: 1.5,
              borderRadius: 20,
              padding: 16,
              gap: 12,
              marginTop: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {showCorrect ? (
                <CheckCircle size={24} color={palette.good} />
              ) : (
                <XCircle size={24} color={palette.bad} />
              )}
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: showCorrect ? palette.good : palette.bad,
                }}
              >
                {showCorrect ? 'Bonne réponse !' : 'Incorrect'}
              </Text>
            </View>

            {showWrong && (
              <Text style={{ color: palette.txt, fontSize: 13 }}>
                Bonne réponse : <Text style={{ fontWeight: '800', color: palette.good }}>{reveal.correctAnswer}</Text>
              </Text>
            )}

            {reveal.explanation && (
              <Text style={{ color: palette.inkSoft, fontSize: 12, lineHeight: 17 }}>
                {reveal.explanation}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              style={{
                backgroundColor: palette.primary,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 4,
              }}
            >
              <Text style={{ color: palette.primaryInk, fontSize: 14, fontWeight: '700' }}>
                {isLast ? 'Voir les résultats' : 'Question suivante'}
              </Text>
              <ChevronRight size={16} color={palette.primaryInk} />
            </TouchableOpacity>
          </FadeInUpView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
