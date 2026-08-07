'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { AnswerChoicesPanel } from '~/components/game/AnswerChoicesPanel';
import { GlobalTimerBar } from '~/components/game/GlobalTimerBar';
import { AnswerRevealOverlay } from '~/components/game/AnswerRevealOverlay';
import { GameHeader } from '~/components/game/shared/GameHeader';
import { GameFooter } from '~/components/game/shared/GameFooter';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { useDeadlineSeconds } from '~/lib/game/useDeadline';
import * as gameApi from '~/lib/api/game';
import type { PlayerResponse } from '~/types/api';

interface SprintGameProps {
  sessionId: string;
  myPlayer?: PlayerResponse | null;
  players: PlayerResponse[];
  teams?: any[];
  isManager?: boolean;
  isSpectator?: boolean;
}

export function SprintGame({ sessionId, myPlayer, players, isManager, isSpectator, teams }: SprintGameProps) {
  const router = useRouter();
  const { game, session, sessionCode, myChoice, myAnswerCorrect, isSubmittingAnswer, questionIndex } = useBuzzStore();
  const currentQuestion = useBuzzStore((state) => state.currentQuestion);

  const phase = game.phase;
  const remainingSeconds = useDeadlineSeconds(game.phaseEndsAtEpochMs);
  const timerTotal = session?.globalQuestionSeconds || 10;

  useEffect(() => {
    if (phase === 'FINISHED') {
      router.replace(`/session/${sessionCode}/results`);
    }
  }, [phase, router, sessionCode]);

  const handleSubmit = async (choice: string) => {
    // Ne pas soumettre si c'est le timeout et qu'on a déjà répondu
    if (choice === '__timeout__') {
      if (myChoice !== null) return;
      choice = ''; // le serveur considère "" comme NO_ANSWER
    }

    useBuzzStore.getState().setIsSubmittingAnswer(true);
    // On met à jour myChoice localement. applyStatePacket s'en servira.
    useBuzzStore.setState({ myChoice: choice });
    try {
      await gameApi.submitAnswer(sessionId, { chosenAnswer: choice, questionId: game.packetQuestionId });
    } catch (err) {
      console.error('Erreur lors de la soumission :', err);
    } finally {
      useBuzzStore.getState().setIsSubmittingAnswer(false);
    }
  };

  if (phase === 'COUNTDOWN') {
    return (
      <SafeScreen className="h-[100dvh] w-full flex items-center justify-center bg-primary">
        <span className="text-9xl font-bold text-white animate-pulse">
          {remainingSeconds > 0 ? remainingSeconds : 'GO'}
        </span>
      </SafeScreen>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      <GameHeader
        session={session!}
        currentQuestion={currentQuestion!}
        questionIndex={questionIndex}
        isConnected={true}
        isManager={isManager ?? false}
        isSpectator={isSpectator ?? false}
        currentPlayer={myPlayer ?? undefined}
        teams={teams ?? []}
      />
      
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="mb-4">
          <GlobalTimerBar 
            totalSeconds={timerTotal}
            remainingSeconds={Math.max(0, remainingSeconds)} 
          />
          {game.answeredCount != null && game.expectedAnswerCount != null && (
            <div className="text-center text-sm font-semibold mt-2 text-txt-60">
              {game.answeredCount} / {game.expectedAnswerCount} joueurs ont répondu
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-center mb-8">
          <h2 className="text-2xl font-bold text-center text-txt">{currentQuestion?.text}</h2>
        </div>
        
        {phase === 'QUESTION' && game.choices && (
          <AnswerChoicesPanel
            choices={game.choices}
            answerTimeSeconds={timerTotal}
            deadlineEpochMs={game.phaseEndsAtEpochMs}
            onSubmit={handleSubmit}
            isSubmitting={isSubmittingAnswer || myChoice !== null}
          />
        )}
      </div>

      {(phase === 'REVEAL' || phase === 'ADVANCING') && game.reveal && (
        <AnswerRevealOverlay
          correctAnswer={game.reveal.correctAnswer}
          winnerId={myAnswerCorrect ? myPlayer?.id ?? 'me' : null}
          winnerName={myAnswerCorrect ? 'Tu' : null}
        />
      )}
      
      <GameFooter
        sessionId={sessionId}
        players={players}
        teams={teams ?? []}
        isTeamMode={session?.isTeamMode ?? false}
        isManager={isManager ?? false}
      />
    </div>
  );
}
