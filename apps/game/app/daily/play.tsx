/**
 * daily/play.tsx — Boucle de jeu du Défi du Jour
 *
 * Cinq règles architecturales respectées :
 *
 * §1. Aucune mise à jour optimiste.
 *     onChoicePress() → état pending → submitAnswer() → verdict du serveur → UI.
 *
 * §2. Le timer ne décide rien.
 *     onTimerExpire() → soumet selectedIndex: null → serveur tranche.
 *
 * §3. Horodatage absolu dans DailyTimerBar (voir ce composant).
 *
 * §4. router.replace + isNavigatingRef pour éviter double déclenchement.
 *
 * §5. Reprise via serveur : montage → getCurrentAttempt() → restaure la question.
 *     Aucun AsyncStorage.
 *
 * §409 STALE_QUESTION : si le serveur répond 409, on resynchronise via
 *     getCurrentAttempt() et on n'affiche pas d'erreur rouge.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

import * as dailyApi from '~/lib/api/daily';
import { LoadingState, ErrorState } from '~/components/ui/StateViews';
import { DailyQuestionCard } from '~/components/daily/DailyQuestionCard';
import { palette, font } from '~/lib/theme/tokens';
import type { DailyAttemptStateResponse, DailyQuestionView, DailyAnswerResultResponse } from '~/types/daily';
import type { ChoiceState } from '~/components/daily/DailyChoiceButton';

type ScreenState =
  | { phase: 'loading' }
  | { phase: 'error'; error: unknown }
  | { phase: 'question'; attemptState: DailyAttemptStateResponse; choiceStates: ChoiceState[] }
  | { phase: 'feedback'; attemptState: DailyAttemptStateResponse; result: DailyAnswerResultResponse; choiceStates: ChoiceState[] }
  | { phase: 'done' };

// Durée d'affichage du feedback avant passage à la question suivante (ms).
const FEEDBACK_DELAY_MS = 1800;

export default function DailyPlayScreen() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>({ phase: 'loading' });
  const isNavigatingRef = useRef(false);
  // Référence à attemptId pour éviter de le perdre si l'état change
  const attemptIdRef = useRef<string | null>(null);

  // ── Reprise via serveur (§5) ─────────────────────────────────────────────
  const loadCurrentAttempt = useCallback(async () => {
    try {
      const attemptState = await dailyApi.getCurrentAttempt();
      attemptIdRef.current = attemptState.attemptId;

      if (attemptState.status === 'COMPLETED' || !attemptState.question) {
        // Tentative déjà finie — naviguer vers résultat (§4 : replace)
        if (!isNavigatingRef.current) {
          isNavigatingRef.current = true;
          router.replace(`/daily/result?attemptId=${attemptState.attemptId}` as any);
        }
        return;
      }

      setState({
        phase: 'question',
        attemptState,
        choiceStates: buildIdleStates(attemptState.question),
      });
    } catch (err) {
      // Aucune tentative en cours → démarre une nouvelle
      try {
        const attemptState = await dailyApi.startAttempt();
        attemptIdRef.current = attemptState.attemptId;

        if (attemptState.status === 'COMPLETED' || !attemptState.question) {
          if (!isNavigatingRef.current) {
            isNavigatingRef.current = true;
            router.replace(`/daily/result?attemptId=${attemptState.attemptId}` as any);
          }
          return;
        }

        setState({
          phase: 'question',
          attemptState,
          choiceStates: buildIdleStates(attemptState.question),
        });
      } catch (startErr: unknown) {
        // 409 ALREADY_COMPLETED ou CHALLENGE_NOT_LIVE
        const code = extractErrorCode(startErr);
        if (code === 'ALREADY_COMPLETED') {
          // Redirige vers l'intro qui affichera l'état déjà joué
          router.replace('/daily' as any);
          return;
        }
        if (code === 'CHALLENGE_NOT_LIVE') {
          router.replace('/daily' as any);
          return;
        }
        setState({ phase: 'error', error: startErr });
      }
    }
  }, [router]);

  useEffect(() => {
    loadCurrentAttempt();
  }, [loadCurrentAttempt]);

  // ── Soumission d'une réponse ─────────────────────────────────────────────
  const submitAnswer = useCallback(async (selectedIndex: number | null) => {
    if (state.phase !== 'question') return;
    const { attemptState } = state;
    const question = attemptState.question!;
    const attemptId = attemptIdRef.current;
    if (!attemptId) return;

    // §1 : état pending immédiat, pas de verdict avant serveur
    setState((prev) => {
      if (prev.phase !== 'question') return prev;
      const next = buildPendingStates(prev.choiceStates, selectedIndex);
      return { ...prev, choiceStates: next };
    });

    try {
      const result = await dailyApi.submitAnswer(attemptId, {
        questionId: question.id,
        selectedIndex,
      });

      // Révèle le verdict (correct/wrong/missed) depuis la réponse serveur
      const newChoiceStates = buildVerdictStates(question, result, selectedIndex);

      setState({
        phase: 'feedback',
        attemptState,
        result,
        choiceStates: newChoiceStates,
      });

      // Après feedback → question suivante ou résultat
      setTimeout(() => {
        if (result.finished || !result.next) {
          // §4 : replace + garde
          if (!isNavigatingRef.current) {
            isNavigatingRef.current = true;
            router.replace(`/daily/result?attemptId=${attemptId}` as any);
          }
        } else {
          const nextAttemptState: DailyAttemptStateResponse = {
            ...attemptState,
            currentIndex: attemptState.currentIndex + 1,
            runningScore: result.runningScore,
            question: result.next,
          };
          setState({
            phase: 'question',
            attemptState: nextAttemptState,
            choiceStates: buildIdleStates(result.next),
          });
        }
      }, FEEDBACK_DELAY_MS);
    } catch (err: unknown) {
      // §409 STALE_QUESTION : resynchroniser via getCurrentAttempt()
      const code = extractErrorCode(err);
      if (code === 'STALE_QUESTION') {
        await loadCurrentAttempt();
        return;
      }
      // Autre erreur : remettre l'état idle pour permettre une nouvelle tentative
      setState((prev) => {
        if (prev.phase !== 'question' && prev.phase !== 'feedback') return prev;
        return {
          phase: 'question',
          attemptState: (prev as any).attemptState,
          choiceStates: buildIdleStates((prev as any).attemptState.question),
        };
      });
    }
  }, [state, router, loadCurrentAttempt]);

  // ── Timer expiré ────────────────────────────────────────────────────────
  const onTimerExpire = useCallback(() => {
    // §2 : envoie selectedIndex: null — le serveur tranche
    submitAnswer(null);
  }, [submitAnswer]);

  // ── Rendu ────────────────────────────────────────────────────────────────
  if (state.phase === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <LoadingState label="Chargement de la question…" fullScreen />
      </SafeAreaView>
    );
  }

  if (state.phase === 'error') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <ErrorState
          error={state.error}
          onRetry={loadCurrentAttempt}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  if (state.phase === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <LoadingState label="Calcul du résultat…" fullScreen />
      </SafeAreaView>
    );
  }

  const { attemptState, choiceStates } = state as Extract<ScreenState, { phase: 'question' | 'feedback' }>;
  const question = attemptState.question;

  if (!question) return null;

  const isAnswering = state.phase === 'feedback';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Progress bar linéaire en haut */}
      <View
        style={{
          height: 3,
          backgroundColor: palette.bgDeep,
          marginHorizontal: 20,
          marginTop: 8,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            backgroundColor: palette.primary,
            borderRadius: 2,
            width: `${((attemptState.currentIndex + (isAnswering ? 1 : 0)) / attemptState.totalQuestions) * 100}%`,
          }}
        />
      </View>

      {/* Label */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '700',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: palette.inkSoft,
          }}
        >
          Défi du jour
        </Text>
      </View>

      {/* Question + choices */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <DailyQuestionCard
          question={question}
          currentIndex={attemptState.currentIndex}
          totalQuestions={attemptState.totalQuestions}
          runningScore={attemptState.runningScore}
          maxPoints={attemptState.maxPoints}
          choiceStates={choiceStates}
          onChoicePress={(idx) => {
            if (state.phase !== 'question') return;
            submitAnswer(idx);
          }}
          onTimerExpire={onTimerExpire}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Helpers d'état des boutons ──────────────────────────────────────────────

function buildIdleStates(question: DailyQuestionView): ChoiceState[] {
  return question.choices.map(() => 'idle');
}

function buildPendingStates(prev: ChoiceState[], selectedIndex: number | null): ChoiceState[] {
  return prev.map((_, idx) => {
    if (selectedIndex === null) return 'pending';
    return idx === selectedIndex ? 'pending' : 'idle';
  });
}

function buildVerdictStates(
  question: DailyQuestionView,
  result: DailyAnswerResultResponse,
  selectedIndex: number | null,
): ChoiceState[] {
  return question.choices.map((_, idx) => {
    if (idx === result.correctIndex) return 'correct';
    if (idx === selectedIndex && !result.correct) return 'wrong';
    if (selectedIndex === null && idx === result.correctIndex) return 'missed';
    return 'idle';
  });
}

// ─── Extraction du code d'erreur backend ─────────────────────────────────────

function extractErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const axiosErr = err as { response?: { data?: { code?: string } } };
  return axiosErr.response?.data?.code ?? null;
}
