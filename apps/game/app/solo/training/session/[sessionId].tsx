import { useState, useEffect, useRef } from 'react';
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
  BookOpen,
  Zap,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

import { useTrainingStore } from '~/stores/useTrainingStore';
import { NotionCard } from '~/components/training/NotionCard';
import { ChallengeView } from '~/components/training/ChallengeView';
import { MasteryBar } from '~/components/training/MasteryBar';
import { palette, font } from '~/lib/theme/tokens';
import { FadeInUpView } from '~/components/anim';

/**
 * Écran principal de la session d'entraînement v2.
 *
 * Alterne entre deux modes d'affichage :
 * - NOTION : affiche les points essentiels d'une notion
 * - CHALLENGE / BOSS : affiche le défi à résoudre
 *
 * Après réponse : affiche le résultat avec explication courte.
 * Le frontend ne fait qu'afficher le state reçu du backend.
 */
export default function TrainingSessionScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const {
    session,
    isLoading,
    isAdvancing,
    isSubmitting,
    error,
    loadSession,
    advance,
    submitAnswer,
    reset: _reset,
  } = useTrainingStore();

  const [startTime, setStartTime] = useState(Date.now());
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (sessionId && !hasLoaded.current) {
      hasLoaded.current = true;
      // If store already has this session, use it; otherwise load from backend
      const state = useTrainingStore.getState();
      if (state.session?.sessionId === sessionId) {
        setStartTime(Date.now());
      } else {
        loadSession(sessionId).then(() => setStartTime(Date.now()));
      }
    }
  }, [sessionId]);

  const handleAdvance = async () => {
    try {
      await advance();
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to advance', err);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    const timeSpentMs = Math.max(100, Date.now() - startTime);
    try {
      await submitAnswer(answer, timeSpentMs);
    } catch (err) {
      console.error('Failed to submit answer', err);
    }
  };

  // Aucune confirmation : la progression est enregistrée côté serveur à chaque
  // étape et la session se reprend telle quelle.
  const handleQuit = () => {
    router.replace('/solo/training' as any);
  };

  // Loading state
  if ((isLoading && !session) || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement de la session…</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.bad }}>Erreur</Text>
        <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={() => router.replace('/solo/training' as any)}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: palette.surface }}
        >
          <Text style={{ color: palette.txt, fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Completed → redirect to results
  if (session.phase === 'COMPLETED' || session.stepType === 'RESULT') {
    router.replace(`/solo/training/result/${session.sessionId}` as any);
    return null;
  }

  const isNotion = session.stepType === 'NOTION';
  const isChallenge = session.stepType === 'CHALLENGE' || session.stepType === 'BOSS';
  const hasResult = !!session.lastResult;
  const showCorrect = hasResult && session.lastResult!.correct;
  const showWrong = hasResult && !session.lastResult!.correct;

  const phaseLabel =
    session.phase === 'REMEDIATION' ? '🔄 Révision' :
    session.stepType === 'BOSS' ? '🏆 Boss Final' :
    `📖 Notion ${session.currentUnit}/${session.totalUnits}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
        }}
      >
        <TouchableOpacity
          onPress={handleQuit}
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

        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: palette.inkSoft }}>
            {phaseLabel}
          </Text>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 14,
              color: palette.txt,
              paddingTop: 1,
            }}
            numberOfLines={1}
          >
            {session.subject}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: palette.surface,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text style={{ color: palette.good, fontSize: 12, fontWeight: '800' }}>
            {session.progress.correctChallenges}/{session.progress.totalChallenges}
          </Text>
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <MasteryBar score={session.progress.percentComplete} size="sm" />
      </View>

      {/* ── Main Content ── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* NOTION VIEW */}
        {isNotion && session.currentNotion && (
          <View style={{ gap: 14 }}>
            {/* Notion Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 4,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: palette.primary + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={18} color={palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: palette.primary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  À retenir
                </Text>
                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 18,
                    color: palette.txt,
                    paddingTop: 2,
                  }}
                >
                  {session.currentNotion.title}
                </Text>
              </View>
            </View>

            {/* Essential Points */}
            {session.currentNotion.essentialPoints.map((point, idx) => (
              <NotionCard key={idx} point={point} index={idx} />
            ))}

            {/* CTA: Move to challenge */}
            <TouchableOpacity
              onPress={handleAdvance}
              disabled={isAdvancing}
              activeOpacity={0.85}
              style={{
                backgroundColor: palette.primary,
                borderRadius: 18,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 8,
                shadowColor: palette.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {isAdvancing ? (
                <ActivityIndicator size="small" color={palette.primaryInk} />
              ) : (
                <>
                  <Text style={{ color: palette.primaryInk, fontSize: 15, fontWeight: '800' }}>
                    J'ai compris → Tester
                  </Text>
                  <Zap size={16} color={palette.primaryInk} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* CHALLENGE VIEW */}
        {isChallenge && session.currentChallenge && !hasResult && (
          <ChallengeView
            challenge={session.currentChallenge}
            onSubmit={handleSubmitAnswer}
            isSubmitting={isSubmitting}
          />
        )}

        {/* CHALLENGE RESULT */}
        {isChallenge && hasResult && (
          <FadeInUpView
            duration={300}
            style={{ gap: 16 }}
          >
            {/* Result Banner */}
            <View
              style={{
                backgroundColor: showCorrect ? palette.good + '1A' : palette.bad + '1A',
                borderColor: showCorrect ? palette.good + '60' : palette.bad + '60',
                borderWidth: 1.5,
                borderRadius: 20,
                padding: 18,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {showCorrect ? (
                  <CheckCircle size={26} color={palette.good} />
                ) : (
                  <XCircle size={26} color={palette.bad} />
                )}
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: showCorrect ? palette.good : palette.bad,
                  }}
                >
                  {showCorrect ? 'Bonne réponse !' : 'Incorrect'}
                </Text>
              </View>

              {showWrong && (
                <Text style={{ color: palette.txt, fontSize: 14 }}>
                  Bonne réponse :{' '}
                  <Text style={{ fontWeight: '800', color: palette.good }}>
                    {session.lastResult!.correctAnswer}
                  </Text>
                </Text>
              )}

              {session.lastResult!.explanation ? (
                <Text style={{ color: palette.inkSoft, fontSize: 13, lineHeight: 18 }}>
                  {session.lastResult!.explanation}
                </Text>
              ) : null}
            </View>

            {/* Next Step CTA */}
            <TouchableOpacity
              onPress={handleAdvance}
              disabled={isAdvancing}
              activeOpacity={0.85}
              style={{
                backgroundColor: palette.primary,
                borderRadius: 18,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                shadowColor: palette.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {isAdvancing ? (
                <ActivityIndicator size="small" color={palette.primaryInk} />
              ) : (
                <>
                  <Text style={{ color: palette.primaryInk, fontSize: 15, fontWeight: '800' }}>
                    {session.stepType === 'BOSS' ? 'Voir le bilan' : 'Notion suivante'}
                  </Text>
                  <ChevronRight size={16} color={palette.primaryInk} />
                </>
              )}
            </TouchableOpacity>
          </FadeInUpView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
