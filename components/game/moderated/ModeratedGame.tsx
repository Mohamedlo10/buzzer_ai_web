'use client';

import {
  Eye,
  XCircle,
  PlayCircle,
  PauseCircle,
  SkipForward,
  Users,
} from 'lucide-react';

import { ConfirmModal } from '~/components/ui/ConfirmModal';
import { BuzzerButton } from '~/components/game/BuzzerButton';
import { AnswerRevealOverlay } from '~/components/game/AnswerRevealOverlay';
import { GameHeader } from '~/components/game/shared/GameHeader';
import { PauseOverlay } from '~/components/game/shared/PauseOverlay';
import { CategoryChangeOverlay } from '~/components/game/shared/CategoryChangeOverlay';
import { GameFooter } from '~/components/game/shared/GameFooter';
import { teamColor } from '~/lib/game/teamColors';
import type { PlayerResponse, TeamResponse } from '~/types/api';

import { BuzzAlertOverlay } from './BuzzAlertOverlay';
import { BuzzQueueView } from './BuzzQueueView';
import { QuestionAndAnswerDisplay } from './QuestionAndAnswerDisplay';
import { PlayerActionView } from './PlayerActionView';
import { useModeratedGame } from '~/lib/hooks/useModeratedGame';

interface ModeratedGameProps {
  sessionId: string;
  isManager: boolean;
  isSpectator: boolean;
  currentPlayer: PlayerResponse | undefined;
  players: PlayerResponse[];
  teams: TeamResponse[];
  isTeamMode: boolean;
  handlePause: () => Promise<void>;
  handleResume: () => Promise<void>;
  isPauseToggling: boolean;
}

export function ModeratedGame({
  sessionId,
  isManager,
  isSpectator,
  currentPlayer,
  players,
  teams,
  isTeamMode,
  handlePause,
  handleResume,
  isPauseToggling,
}: ModeratedGameProps) {
  const {
    session,
    currentQuestion,
    questionIndex,
    isPaused,
    game,
    isSubmitting,
    isSkipping,
    showSkipConfirm,
    setShowSkipConfirm,
    pendingWrong,
    setPendingWrong,
    isValidating,
    isResettingBuzzer,
    manualQuestions,
    showAnswer,
    setShowAnswer,
    myPlayerId,
    amIAnswering,
    myQueuePosition,
    buzzerOpen,
    answeringPlayer,
    countdownSeconds,
    displayedWordCount,
    actualHasBuzzed,
    answeredWrongThisQuestion,
    teamBuzzed,
    firstBuzzer,
    handleBuzz,
    handleValidate,
    handleSkip,
    handleAdvanceAfterAllWrong,
    handleResetBuzzer,
  } = useModeratedGame({
    sessionId,
    isManager,
    isSpectator,
    currentPlayer,
    players,
    teams,
    isTeamMode,
  });

  if (!session || !currentQuestion) return null;

  return (
    <>
      <GameHeader
        session={session}
        currentQuestion={currentQuestion}
        questionIndex={questionIndex}
        isConnected={true}
        isManager={isManager}
        isSpectator={isSpectator}
        currentPlayer={currentPlayer}
        teams={teams}
      />

      <PauseOverlay
        isPaused={isPaused}
        isManager={isManager}
        isPauseToggling={isPauseToggling}
        onResume={handleResume}
      />

      <CategoryChangeOverlay currentQuestion={currentQuestion} />

      <BuzzAlertOverlay
        isManager={isManager}
        phase={game.phase}
        firstBuzzer={firstBuzzer}
        buzzQueue={game.buzzQueue}
        players={players}
        myPlayerId={myPlayerId}
        isTeamMode={isTeamMode}
        teams={teams}
      />

      <QuestionAndAnswerDisplay
        isManager={isManager}
        currentQuestion={currentQuestion}
        questionIndex={questionIndex}
        manualQuestions={manualQuestions}
        showAnswer={showAnswer}
        setShowAnswer={setShowAnswer}
        displayedWordCount={displayedWordCount}
        phase={game.phase}
        totalWordCount={game.totalWordCount}
      />

      <PlayerActionView
        isManager={isManager}
        isSpectator={isSpectator}
        amIAnswering={amIAnswering}
        phase={game.phase}
        answeringPlayer={answeringPlayer}
        countdownSeconds={countdownSeconds}
        answeredWrongThisQuestion={answeredWrongThisQuestion}
      />

      {/* Spectator View */}
      {isSpectator && (
        <div className="px-4 pt-4">
          <div className="bg-surface rounded-3xl p-8 border border-line flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-energy/15 flex items-center justify-center mb-4">
              <Eye size={32} color="var(--gold)" />
            </div>
            <p className="text-energy text-xl font-semibold text-center mb-2">Mode spectateur</p>
            <p className="text-txt-60 text-center">Vous observez la partie</p>
          </div>
        </div>
      )}

      {/* Buzzer Button */}
      {!isSpectator && !isManager && (
        <div className="px-4 py-3 flex flex-col items-center">
          <BuzzerButton
            onBuzz={handleBuzz}
            disabled={isSubmitting || !buzzerOpen || actualHasBuzzed || answeredWrongThisQuestion}
            hasBuzzed={actualHasBuzzed}
            queuePosition={myQueuePosition}
            teamBuzzed={teamBuzzed}
          />
          {teamBuzzed && firstBuzzer && (
            <div
              className="mt-2 w-full max-w-sm rounded-2xl p-4 border flex items-center gap-3 animate-[rise_0.25s_both]"
              style={{
                backgroundColor: `color-mix(in oklab, ${teamColor(teams.find((t) => t.id === firstBuzzer.teamId)?.color)} 10%, var(--surface))`,
                borderColor: teamColor(teams.find((t) => t.id === firstBuzzer.teamId)?.color),
              }}
            >
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `color-mix(in oklab, ${teamColor(teams.find((t) => t.id === firstBuzzer.teamId)?.color)} 20%, transparent)`,
                }}
              >
                <Users size={14} style={{ color: teamColor(teams.find((t) => t.id === firstBuzzer.teamId)?.color) }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-txt font-bold text-[13.5px] leading-tight">
                  Votre équipe a déjà buzzé
                </p>
                <p className="text-txt-60 text-xs mt-0.5 truncate">
                  <strong>{firstBuzzer.playerName}</strong> répond pour {firstBuzzer.teamName || 'votre équipe'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buzz Queue */}
      <BuzzQueueView
        buzzQueue={game.buzzQueue}
        phase={game.phase}
        countdownSeconds={countdownSeconds}
        isManager={isManager}
        isValidating={isValidating}
        players={players}
        myPlayerId={myPlayerId}
        isTeamMode={isTeamMode}
        teams={teams}
        onValidate={handleValidate}
        onSetPendingWrong={setPendingWrong}
      />

      {/* Manager Secondary Controls */}
      {isManager && (
        <div className="px-4 pt-3">
          <div className="flex flex-row gap-2">
            <button
              onClick={() => setShowSkipConfirm(true)}
              disabled={isSkipping}
              className="flex-1 py-3 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSkipping ? (
                <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-txt-60 font-medium text-sm">Passer</span>
              )}
            </button>
            <button
              onClick={handleResetBuzzer}
              disabled={game.buzzQueue.length === 0 || isResettingBuzzer}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-colors ${
                game.buzzQueue.length > 0 && !isResettingBuzzer
                  ? 'bg-buzz/20 hover:bg-buzz/30 cursor-pointer'
                  : 'bg-surface-2 opacity-50 cursor-not-allowed'
              }`}
            >
              {isResettingBuzzer ? (
                <div className="w-4 h-4 border-2 border-buzz border-t-transparent rounded-full animate-spin" />
              ) : (
                <span
                  className={`font-medium text-sm ${
                    game.buzzQueue.length > 0 ? 'text-buzz' : 'text-txt-40'
                  }`}
                >
                  Reset
                </span>
              )}
            </button>
            <button
              onClick={isPaused ? handleResume : handlePause}
              disabled={isPauseToggling}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-60 cursor-pointer ${
                isPaused
                  ? 'bg-accent hover:bg-accent-d'
                  : 'bg-energy/20 border border-energy/30 hover:bg-energy/30'
              }`}
            >
              <div className="flex flex-row items-center justify-center">
                {isPauseToggling ? (
                  <div
                    className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                      isPaused ? 'border-btn-fg' : 'border-energy'
                    }`}
                  />
                ) : isPaused ? (
                  <>
                    <PlayCircle size={18} className="text-btn-fg mr-1.5" />
                    <span className="font-bold text-sm text-btn-fg">Reprendre</span>
                  </>
                ) : (
                  <>
                    <PauseCircle size={18} color="var(--gold)" className="mr-1.5" />
                    <span className="font-bold text-sm text-energy">Pause</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Révélation */}
      {game.reveal && (
        <AnswerRevealOverlay
          correctAnswer={game.reveal.correctAnswer}
          winnerId={game.reveal.winnerId}
          winnerName={game.reveal.winnerName}
          allAnswersWrong={game.reveal.allAnswersWrong}
          isManager={isManager}
          onAdvance={handleAdvanceAfterAllWrong}
        />
      )}

      <ConfirmModal
        open={pendingWrong !== null}
        title={pendingWrong?.applyPenalty ? 'Faux avec pénalité ?' : 'Faux sans pénalité ?'}
        message={
          pendingWrong?.applyPenalty
            ? `${firstBuzzer?.playerName ?? 'Le joueur'} sera pénalisé et retiré de la file d'attente.`
            : `${firstBuzzer?.playerName ?? 'Le joueur'} sera retiré de la file sans perdre de points.`
        }
        confirmLabel={pendingWrong?.applyPenalty ? 'Faux' : 'Sans pénalité'}
        cancelLabel="Annuler"
        tone="danger"
        icon={<XCircle size={24} color="var(--bad)" />}
        onConfirm={() => {
          const p = pendingWrong;
          setPendingWrong(null);
          if (p) handleValidate(false, p.applyPenalty);
        }}
        onCancel={() => setPendingWrong(null)}
      />
      <ConfirmModal
        open={showSkipConfirm}
        title="Passer la question ?"
        message="Cette question sera ignorée et vous passerez à la suivante. Cette action est irréversible."
        confirmLabel="Passer"
        cancelLabel="Annuler"
        tone="warning"
        icon={<SkipForward size={24} color="var(--gold)" />}
        onConfirm={() => {
          setShowSkipConfirm(false);
          handleSkip();
        }}
        onCancel={() => setShowSkipConfirm(false)}
      />

      <GameFooter
        sessionId={sessionId}
        players={players}
        teams={teams}
        isTeamMode={isTeamMode}
        isManager={isManager}
        currentUserId={myPlayerId}
      />
    </>
  );
}
