import { useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, XCircle, Eye, PauseCircle, PlayCircle, SkipForward } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { AnswerChoicesPanel } from '~/components/game/AnswerChoicesPanel';
import { GlobalTimerBar } from '~/components/game/GlobalTimerBar';
import { GameHeader } from '~/components/game/shared/GameHeader';
import { GameFooter } from '~/components/game/shared/GameFooter';
import { PauseOverlay } from '~/components/game/shared/PauseOverlay';
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
  isPaused?: boolean;
  isPauseToggling?: boolean;
  handlePause?: () => Promise<void>;
  handleResume?: () => Promise<void>;
  handleSkip?: () => Promise<void>;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Vue du mode Sprint : tous les joueurs répondent en même temps.
 *
 * Port fidèle de web-legacy SprintGame.tsx.
 * CSS Grid 2-colonnes → flexWrap + width 50%.
 * `router.replace` Next.js → expo-router.
 */
function SprintCountdownScreen({ deadlineEpochMs }: { deadlineEpochMs?: number | null }) {
  const remainingSeconds = useDeadlineSeconds(deadlineEpochMs);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: palette.primary }}>
      <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 96, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>
        {remainingSeconds > 0 ? remainingSeconds : 'GO'}
      </Text>
      <Text style={{ fontFamily: font.nativeFamily.display, color: 'rgba(255,255,255,0.7)', fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>
        Préparez-vous
      </Text>
    </View>
  );
}

export function SprintGame({
  sessionId,
  myPlayer,
  players,
  teams,
  isManager,
  isSpectator,
  isPaused = false,
  isPauseToggling = false,
  handlePause,
  handleResume,
  handleSkip,
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
  const questionSeconds = session?.globalQuestionSeconds ?? 10;
  const awaitingServer = game.stateVersion === 0;

  useEffect(() => {
    if (phase === 'FINISHED' || session?.status === 'RESULTS') {
      router.replace(`/session/${sessionCode}/results` as any);
    }
  }, [phase, session?.status, router, sessionCode]);

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
        <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.inkSoft, fontSize: 14 }}>Synchronisation avec la partie…</Text>
      </View>
    );
  }

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (phase === 'COUNTDOWN') {
    return <SprintCountdownScreen deadlineEpochMs={game.phaseEndsAtEpochMs} />;
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

      {/* Pause overlay — blocks UI for all players */}
      <PauseOverlay
        isPaused={isPaused}
        isManager={isManager ?? false}
        isPauseToggling={isPauseToggling}
        onResume={handleResume ?? (() => { })}
        onSkip={handleSkip}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Timer */}
        {phase === 'QUESTION' && game.phaseEndsAtEpochMs != null && (
          <GlobalTimerBar
            totalSeconds={questionSeconds}
            deadlineEpochMs={game.phaseEndsAtEpochMs}
            paused={isPaused}
          />
        )}

        {/* Answer count */}
        {phase === 'QUESTION' && game.answeredCount != null && game.expectedAnswerCount != null && (
          <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', textAlign: 'center', fontSize: 13, color: palette.inkSoft, fontVariant: ['tabular-nums'] }}>
            {game.answeredCount} / {game.expectedAnswerCount} joueurs ont répondu
          </Text>
        )}

        {/* Spectator badge */}
        {isSpectator && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.warn + '1A', borderWidth: 1, borderColor: palette.warn + '50', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Eye size={16} color={palette.warn} />
            <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.warn, fontSize: 12, fontWeight: '600' }}>Mode spectateur — vous observez la partie</Text>
          </View>
        )}

        {/* Question text */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
          <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 21, lineHeight: 30, textAlign: 'center', color: palette.txt, paddingTop: 4 }}>
            {currentQuestion?.text}
          </Text>
        </View>

        {/* Choices Grid — Stable, persistent layout with zero jump */}
        {choices.length > 0 && (
          <AnswerChoicesPanel
            choices={choices}
            myChoice={myChoice}
            correctAnswer={correctAnswer}
            isRevealing={isRevealing}
            canAnswer={canAnswer}
            onSubmit={handleSubmit}
            isSubmitting={isSubmittingAnswer}
          />
        )}

        {/* Reveal verdict */}
        {isRevealing && (
          <View style={{ marginTop: 16, alignItems: 'center', gap: 4 }}>
            {myChoice === null ? (
              <Text style={{ fontFamily: font.nativeFamily.display, color: palette.inkSoft, fontSize: 15 }}>Aucune réponse donnée</Text>
            ) : myAnswerCorrect ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color={palette.good} />
                <Text style={{ fontFamily: font.nativeFamily.display, color: palette.good, fontSize: 18, paddingTop: 3 }}>Bonne réponse</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <XCircle size={20} color={palette.bad} />
                <Text style={{ fontFamily: font.nativeFamily.display, color: palette.bad, fontSize: 18, paddingTop: 3 }}>Mauvaise réponse</Text>
              </View>
            )}
            {correctAnswer && (
              <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.inkSoft, fontSize: 12 }}>
                Réponse attendue : <Text style={{ color: palette.txt, fontWeight: '700' }}>{correctAnswer}</Text>
              </Text>
            )}
          </View>
        )}

        {/* Waiting state */}
        {phase === 'QUESTION' && myChoice !== null && (
          <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', marginTop: 16, textAlign: 'center', color: palette.inkSoft, fontSize: 13 }}>
            Réponse enregistrée — en attente des autres joueurs…
          </Text>
        )}
        {/* Manager Host Controls: Passer & Pause/Reprendre */}
        {isManager && (
          <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 8 }}>
            {handleSkip && (
              <TouchableOpacity
                onPress={handleSkip}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: palette.surface2,
                  borderWidth: 1,
                  borderColor: palette.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <SkipForward size={16} color={palette.warn} />
                <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: palette.txt, paddingTop: 2 }}>
                  Passer
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={isPaused ? handleResume : handlePause}
              disabled={isPauseToggling}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: isPaused ? palette.primary : palette.warn + '33',
                borderWidth: isPaused ? 0 : 1,
                borderColor: palette.warn + '4D',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isPauseToggling ? 0.6 : 1,
              }}
            >
              {isPauseToggling ? (
                <ActivityIndicator size="small" color={isPaused ? '#FFFFFF' : palette.warn} />
              ) : isPaused ? (
                <>
                  <PlayCircle size={18} color="#FFFFFF" />
                  <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: '#FFFFFF', paddingTop: 2 }}>Reprendre</Text>
                </>
              ) : (
                <>
                  <PauseCircle size={18} color={palette.warn} />
                  <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: palette.warn, paddingTop: 2 }}>Pause</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        <GameFooter
          sessionId={sessionId}
          players={players}
          teams={teams ?? []}
          isTeamMode={session?.isTeamMode ?? false}
          isManager={isManager ?? false}
          currentUserId={myPlayer?.id}
        />
      </ScrollView>


    </View>
  );
}
