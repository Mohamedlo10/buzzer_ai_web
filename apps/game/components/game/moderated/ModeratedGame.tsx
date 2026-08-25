import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Eye, XCircle, PlayCircle, PauseCircle, SkipForward, Users } from 'lucide-react-native';
import { BuzzerButton } from '~/components/game/BuzzerButton';
import { AnswerRevealOverlay } from '~/components/game/AnswerRevealOverlay';
import { GameHeader } from '~/components/game/shared/GameHeader';
import { PauseOverlay } from '~/components/game/shared/PauseOverlay';
import { CategoryChangeOverlay } from '~/components/game/shared/CategoryChangeOverlay';
import { GameFooter } from '~/components/game/shared/GameFooter';
import { ConfirmModal } from '~/components/shared/ConfirmModal';
import { BuzzAlertOverlay } from './BuzzAlertOverlay';
import { BuzzQueueView } from './BuzzQueueView';
import { QuestionAndAnswerDisplay } from './QuestionAndAnswerDisplay';
import { PlayerActionView } from './PlayerActionView';
import { useModeratedGame } from '~/lib/hooks/useModeratedGame';
import { teamColor } from '~/lib/game/teamColors';
import { palette, font } from '~/lib/theme/tokens';
import type { PlayerResponse, TeamResponse } from '~/types/api';

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
  sessionId, isManager, isSpectator, currentPlayer, players, teams, isTeamMode, handlePause, handleResume, isPauseToggling
}: ModeratedGameProps) {
  const {
    session, currentQuestion, questionIndex, isPaused, game, isSubmitting, isSkipping, showSkipConfirm, setShowSkipConfirm,
    pendingWrong, setPendingWrong, isValidating, isResettingBuzzer, manualQuestions, showAnswer, setShowAnswer, myPlayerId,
    amIAnswering, myQueuePosition, buzzerOpen, answeringPlayer, countdownSeconds, displayedWordCount, actualHasBuzzed,
    answeredWrongThisQuestion, teamBuzzed, firstBuzzer, handleBuzz, handleValidate, handleSkip, handleAdvanceAfterAllWrong, handleResetBuzzer
  } = useModeratedGame({ sessionId, isManager, isSpectator, currentPlayer, players, teams, isTeamMode });

  if (!session || !currentQuestion) return null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
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
        onSkip={handleSkip}
      />
      <CategoryChangeOverlay currentQuestion={currentQuestion} />

      {/* Alerte Buzz 1.5s pour avertir le manager de cesser la lecture */}
      <BuzzAlertOverlay
        isManager={isManager}
        phase={game.phase}
        firstBuzzer={firstBuzzer}
      />

      {/* Modal de confirmation : Faux (avec pénalité ou sans pénalité) */}
      <ConfirmModal
        visible={pendingWrong !== null}
        title={pendingWrong?.applyPenalty ? 'Faux avec pénalité ?' : 'Faux sans pénalité ?'}
        message={
          pendingWrong?.applyPenalty
            ? `${firstBuzzer?.playerName ?? 'Le joueur'} sera pénalisé et retiré de la file d'attente.`
            : `${firstBuzzer?.playerName ?? 'Le joueur'} sera retiré de la file sans perdre de points.`
        }
        confirmText={pendingWrong?.applyPenalty ? 'Pénaliser (-)' : 'Sans pénalité'}
        cancelText="Annuler"
        variant={pendingWrong?.applyPenalty ? 'danger' : 'warning'}
        onConfirm={() => {
          if (pendingWrong) {
            const { applyPenalty } = pendingWrong;
            setPendingWrong(null);
            handleValidate(false, applyPenalty);
          }
        }}
        onCancel={() => setPendingWrong(null)}
      />

      {/* Modal de confirmation : Passer la question */}
      <ConfirmModal
        visible={showSkipConfirm}
        title="Passer la question ?"
        message="Cette action est irréversible et passera directement à la question suivante."
        confirmText="Passer"
        cancelText="Annuler"
        variant="warning"
        onConfirm={() => {
          setShowSkipConfirm(false);
          handleSkip();
        }}
        onCancel={() => setShowSkipConfirm(false)}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {isManager && (
          <QuestionAndAnswerDisplay
            isManager={isManager}
            currentQuestion={currentQuestion}
            questionIndex={questionIndex}
            manualQuestions={manualQuestions}
            showAnswer={showAnswer}
            setShowAnswer={setShowAnswer}
            displayedWordCount={displayedWordCount}
            phase={game.phase}
            totalWordCount={currentQuestion.text ? currentQuestion.text.split(' ').length : 0}
          />
        )}

        <PlayerActionView
          isManager={isManager}
          isSpectator={isSpectator}
          amIAnswering={amIAnswering}
          phase={game.phase}
          answeringPlayer={answeringPlayer}
          countdownSeconds={countdownSeconds}
          answeredWrongThisQuestion={answeredWrongThisQuestion}
        />

        {/* Spectator */}
        {isSpectator && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={{ backgroundColor: palette.surface, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: palette.line, alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: palette.warn + '26', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Eye size={32} color={palette.warn} />
              </View>
              <Text style={{ fontFamily: font.nativeFamily.display, color: palette.warn, fontSize: 20, paddingTop: 2, marginBottom: 8 }}>Mode spectateur</Text>
              <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 14 }}>Vous observez la partie</Text>
            </View>
          </View>
        )}

        {/* Buzzer Button */}
        {!isSpectator && !isManager && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}>
            <BuzzerButton
              onBuzz={handleBuzz}
              disabled={isSubmitting || !buzzerOpen || actualHasBuzzed || answeredWrongThisQuestion}
              hasBuzzed={actualHasBuzzed}
              queuePosition={myQueuePosition}
              teamBuzzed={teamBuzzed}
            />
            {teamBuzzed && firstBuzzer && (() => {
              const tColor = teamColor(teams.find(t => t.id === firstBuzzer.teamId)?.color);
              return (
                <View style={{ marginTop: 8, width: '100%', maxWidth: 360, borderRadius: 16, padding: 16, borderWidth: 1, backgroundColor: tColor + '1A', borderColor: tColor, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: tColor + '33', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={14} color={tColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 13.5, paddingTop: 2 }}>Votre équipe a déjà buzzé</Text>
                    <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.inkSoft, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      <Text style={{ fontWeight: '700' }}>{firstBuzzer.playerName}</Text> répond pour {firstBuzzer.teamName || 'votre équipe'}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>
        )}

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

        {/* Manager Controls */}
        {isManager && (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setShowSkipConfirm(true)} disabled={isSkipping} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center', opacity: isSkipping ? 0.6 : 1 }}>
                {isSkipping ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={{ fontFamily: font.nativeFamily.display, color: palette.inkSoft, fontSize: 14, paddingTop: 2 }}>Passer</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResetBuzzer} disabled={game.buzzQueue.length === 0 || isResettingBuzzer} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: game.buzzQueue.length > 0 ? palette.bad + '33' : palette.surface2, alignItems: 'center', justifyContent: 'center', opacity: (game.buzzQueue.length === 0 || isResettingBuzzer) ? 0.5 : 1 }}>
                {isResettingBuzzer ? <ActivityIndicator size="small" color={palette.bad} /> : <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: game.buzzQueue.length > 0 ? palette.bad : palette.inkSoft, paddingTop: 2 }}>Reset</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={isPaused ? handleResume : handlePause} disabled={isPauseToggling} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: isPaused ? palette.primary : palette.warn + '33', borderWidth: isPaused ? 0 : 1, borderColor: palette.warn + '4D', alignItems: 'center', justifyContent: 'center', opacity: isPauseToggling ? 0.6 : 1, flexDirection: 'row', gap: 6 }}>
                {isPauseToggling ? (
                  <ActivityIndicator size="small" color={isPaused ? '#FFFFFF' : palette.warn} />
                ) : isPaused ? (
                  <><PlayCircle size={18} color="#FFFFFF" /><Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: '#FFFFFF', paddingTop: 2 }}>Reprendre</Text></>
                ) : (
                  <><PauseCircle size={18} color={palette.warn} /><Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: palette.warn, paddingTop: 2 }}>Pause</Text></>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <GameFooter sessionId={sessionId} players={players} teams={teams} isTeamMode={isTeamMode} isManager={isManager} currentUserId={myPlayerId} />
      </ScrollView>

      {game.reveal && (
        <AnswerRevealOverlay
          visible={!!game.reveal}
          correctAnswer={game.reveal.correctAnswer}
          winnerId={game.reveal.winnerId}
          winnerName={game.reveal.winnerName}
          allAnswersWrong={game.reveal.allAnswersWrong}
          isManager={isManager}
          onAdvance={handleAdvanceAfterAllWrong}
        />
      )}
    </View>
  );
}
