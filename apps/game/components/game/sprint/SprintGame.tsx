import { useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, XCircle, Eye } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { AnswerChoicesPanel } from '~/components/game/AnswerChoicesPanel';
import { GlobalTimerBar } from '~/components/game/GlobalTimerBar';
import { GameHeader } from '~/components/game/shared/GameHeader';
import { GameFooter } from '~/components/game/shared/GameFooter';
import { useDeadlineSeconds } from '~/lib/game/useDeadline';
import * as gameApi from '~/lib/api/game';
import type { PlayerResponse, TeamResponse } from '~/types/api';

interface SprintGameProps {
  sessionId: string;
  myPlayer?: PlayerResponse | null;
  players: PlayerResponse[];
  teams?: TeamResponse[];
  isManager?: boolean;
  isSpectator?: boolean;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Vue du mode Sprint : tous les joueurs répondent en même temps.
 *
 * Port fidèle de web-legacy SprintGame.tsx.
 * CSS Grid 2-colonnes → flexWrap + width 50%.
 * `router.replace` Next.js → expo-router.
 */
export function SprintGame({
  sessionId,
  myPlayer,
  players,
  teams,
  isManager,
  isSpectator,
}: SprintGameProps) {
  const router = useRouter();
  const {
    game,
    session,
    sessionCode,
    myChoice,
    myAnswerCorrect,
    isSubmittingAnswer,
    questionIndex,
  } = useBuzzStore();
  const currentQuestion = useBuzzStore((state) => state.currentQuestion);

  const phase = game.phase;
  const remainingSeconds = useDeadlineSeconds(game.phaseEndsAtEpochMs);
  const questionSeconds = session?.globalQuestionSeconds ?? 10;
  const awaitingServer = game.stateVersion === 0;

  useEffect(() => {
    if (phase === 'FINISHED') {
      router.replace(`/session/${sessionCode}/results` as any);
    }
  }, [phase, router, sessionCode]);

  const handleSubmit = async (chosenAnswer: string) => {
    if (chosenAnswer === '__timeout__') return;
    if (myChoice !== null || isSpectator) return;

    useBuzzStore.setState({ myChoice: chosenAnswer });
    useBuzzStore.getState().setIsSubmittingAnswer(true);
    try {
      await gameApi.submitAnswer(sessionId, {
        chosenAnswer,
        questionId: game.packetQuestionId,
      });
    } catch (err: any) {
      if (err?.response?.status === 409) {
        try {
          const state = await gameApi.getGameState(sessionId);
          useBuzzStore.getState().applyStatePacket(state.statePacket);
        } catch { /* prochain paquet */ }
      }
    } finally {
      useBuzzStore.getState().setIsSubmittingAnswer(false);
    }
  };

  // ── Awaiting server ───────────────────────────────────────────────────────
  if (awaitingServer) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Synchronisation avec la partie…</Text>
      </View>
    );
  }

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (phase === 'COUNTDOWN') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: palette.primary }}>
        <Text style={{ fontSize: 96, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>
          {remainingSeconds > 0 ? remainingSeconds : 'GO'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
          Préparez-vous
        </Text>
      </View>
    );
  }

  if (!session) return null;

  const isRevealing = phase === 'REVEAL' || phase === 'ADVANCING';
  const choices = game.choices ?? [];
  const correctAnswer = game.reveal?.correctAnswer ?? null;
  const canAnswer = phase === 'QUESTION' && myChoice === null && !isSpectator;

  return (
    <View style={{ flex: 1 }}>
      {currentQuestion && (
        <GameHeader
          session={session}
          currentQuestion={currentQuestion}
          questionIndex={questionIndex}
          isConnected
          isManager={isManager ?? false}
          isSpectator={isSpectator ?? false}
          currentPlayer={myPlayer ?? undefined}
          teams={teams ?? []}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Timer */}
        {phase === 'QUESTION' && game.phaseEndsAtEpochMs != null && (
          <GlobalTimerBar
            totalSeconds={questionSeconds}
            remainingSeconds={Math.max(0, remainingSeconds)}
          />
        )}

        {/* Answer count */}
        {phase === 'QUESTION' && game.answeredCount != null && game.expectedAnswerCount != null && (
          <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: '600', color: palette.inkSoft, fontVariant: ['tabular-nums'] }}>
            {game.answeredCount} / {game.expectedAnswerCount} joueurs ont répondu
          </Text>
        )}

        {/* Spectator badge */}
        {isSpectator && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.warn + '1A', borderWidth: 1, borderColor: palette.warn + '50', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Eye size={16} color={palette.warn} />
            <Text style={{ color: palette.warn, fontSize: 12, fontWeight: '600' }}>Mode spectateur — vous observez la partie</Text>
          </View>
        )}

        {/* Question text */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', color: palette.txt }}>
            {currentQuestion?.text}
          </Text>
        </View>

        {/* Interactive choices */}
        {canAnswer && choices.length > 0 && (
          <AnswerChoicesPanel
            choices={choices}
            answerTimeSeconds={questionSeconds}
            deadlineEpochMs={game.phaseEndsAtEpochMs}
            onSubmit={handleSubmit}
            isSubmitting={isSubmittingAnswer}
          />
        )}

        {/* Locked choices */}
        {!canAnswer && choices.length > 0 && (
          <View style={{ gap: 8 }}>
            {choices.map((choice, index) => {
              const isMine = myChoice === choice;
              const isCorrect = isRevealing && correctAnswer === choice;
              const isMineAndWrong = isRevealing && isMine && !isCorrect;
              return (
                <View
                  key={choice}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderColor: isCorrect ? palette.good : isMineAndWrong ? palette.bad : isMine ? palette.indigo : palette.line,
                    backgroundColor: isCorrect ? palette.good + '1A' : isMineAndWrong ? palette.bad + '1A' : isMine ? palette.indigo + '26' : palette.surface,
                    opacity: (!isMine && !isCorrect && (phase === 'QUESTION' || isRevealing)) ? 0.6 : 1,
                  }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: isCorrect ? palette.good : isMineAndWrong ? palette.bad : isMine ? palette.indigo : palette.surface2 }}>
                    <Text style={{ color: isCorrect || isMineAndWrong || isMine ? '#FFFFFF' : palette.txt, fontSize: 12, fontWeight: '700' }}>
                      {CHOICE_LABELS[index] ?? index + 1}
                    </Text>
                  </View>
                  <Text style={{ color: palette.txt, fontSize: 14, flex: 1, fontWeight: '500' }}>{choice}</Text>
                  {isCorrect && <CheckCircle2 size={18} color={palette.good} />}
                  {isMineAndWrong && <XCircle size={18} color={palette.bad} />}
                  {isMine && !isRevealing && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: palette.indigo + '33' }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.indigo }} />
                      <Text style={{ color: palette.indigo, fontSize: 11, fontWeight: '700' }}>Choix enregistré</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Reveal verdict */}
        {isRevealing && (
          <View style={{ marginTop: 16, alignItems: 'center', gap: 4 }}>
            {myChoice === null ? (
              <Text style={{ color: palette.inkSoft, fontSize: 14, fontWeight: '600' }}>Aucune réponse donnée</Text>
            ) : myAnswerCorrect ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color={palette.good} />
                <Text style={{ color: palette.good, fontSize: 18, fontWeight: '700' }}>Bonne réponse</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <XCircle size={20} color={palette.bad} />
                <Text style={{ color: palette.bad, fontSize: 18, fontWeight: '700' }}>Mauvaise réponse</Text>
              </View>
            )}
            {correctAnswer && (
              <Text style={{ color: palette.inkSoft, fontSize: 12 }}>
                Réponse attendue : <Text style={{ color: palette.txt, fontWeight: '600' }}>{correctAnswer}</Text>
              </Text>
            )}
          </View>
        )}

        {/* Waiting state */}
        {phase === 'QUESTION' && myChoice !== null && (
          <Text style={{ marginTop: 16, textAlign: 'center', color: palette.inkSoft, fontSize: 12 }}>
            Réponse enregistrée — en attente des autres joueurs…
          </Text>
        )}
      </ScrollView>

      <GameFooter
        sessionId={sessionId}
        players={players}
        teams={teams ?? []}
        isTeamMode={session?.isTeamMode ?? false}
        isManager={isManager ?? false}
        currentUserId={myPlayer?.id}
      />
    </View>
  );
}
