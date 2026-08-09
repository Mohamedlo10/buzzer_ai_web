import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Eye, Check, X, SkipForward, Pause, Play, RefreshCw } from 'lucide-react-native';
import { BuzzerButton } from '~/components/game/BuzzerButton';
import { useModeratedGame } from '~/lib/hooks/useModeratedGame';
import type { PlayerResponse, TeamResponse } from '~/types/api';
import { palette, inkAlpha } from '~/lib/theme/tokens';

export interface ModeratedGameProps {
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
    isValidating,
    isResettingBuzzer,
    showAnswer,
    setShowAnswer,
    myPlayerId,
    myQueuePosition,
    buzzerOpen,
    answeringPlayer,
    countdownSeconds,
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

  if (!session || !currentQuestion) {
    return (
      <View className="flex-1 bg-bg flex-col items-center justify-center p-6">
        <ActivityIndicator size="large" color={palette.primary} />
        <Text className="text-txt-60 text-sm mt-3 font-semibold">
          Préparation de la question...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      {/* Question Header */}
      <View className="bg-surface rounded-2xl border border-line p-3.5 mb-4 flex-row items-center justify-between shadow-sm">
        <View className="flex-row items-center">
          <View className="px-2.5 py-1 rounded-full bg-accent/15 mr-2.5">
            <Text className="text-accent text-xs font-bold">
              Q{questionIndex + 1} / {session.totalQuestions || '?'}
            </Text>
          </View>
          <Text className="text-txt-60 text-xs font-semibold uppercase tracking-wider">
            {currentQuestion.category || 'Général'}
          </Text>
        </View>

        {isPaused ? (
          <View className="px-2.5 py-1 rounded-full bg-gold/15">
            <Text className="text-gold text-xs font-bold">PAUSE</Text>
          </View>
        ) : null}
      </View>

      {/* Question Text Box */}
      <View className="bg-surface rounded-3xl border border-line p-5 mb-4 flex-col shadow-sm">
        <Text className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-2">
          Question
        </Text>
        <Text className="text-txt font-bold text-xl leading-relaxed mb-3">
          {currentQuestion.text}
        </Text>

        {/* Answer display for Manager / Spectator */}
        {(isManager || isSpectator || showAnswer) ? (
          <View className="mt-2 p-3 rounded-2xl bg-bg border border-line flex-col">
            <Text className="text-accent text-xs font-bold mb-1">
              RÉPONSE ATTENDUE :
            </Text>
            <Text className="text-txt font-bold text-base">
              {currentQuestion.answer}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowAnswer(true)}
            activeOpacity={0.7}
            className="flex-row items-center mt-1"
          >
            <Eye size={14} color={palette.gold} />
            <Text className="text-gold text-xs font-semibold ml-1.5 underline">
              Afficher la réponse (entraînement)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Answering Player Banner / Countdown */}
      {answeringPlayer ? (
        <View className="bg-gold/15 border border-gold/30 rounded-2xl p-4 mb-4 flex-col items-center shadow-sm">
          <Text className="text-gold text-xs font-bold tracking-wider uppercase mb-1">
            ⚡ JOUEUR EN TRAIN DE RÉPONDRE
          </Text>
          <Text className="text-txt font-bold text-xl mb-1">
            {(answeringPlayer as any).playerName || answeringPlayer.name}
          </Text>
          {countdownSeconds !== null ? (
            <Text className="text-buzz font-extrabold text-2xl">
              {countdownSeconds}s
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Spectator View */}
      {isSpectator ? (
        <View className="bg-surface rounded-3xl p-6 border border-line flex-col items-center mb-4">
          <Eye size={32} color={palette.gold} />
          <Text className="text-gold font-bold text-base mt-2">
            Mode spectateur
          </Text>
          <Text className="text-txt-60 text-xs text-center mt-1">
            Vous observez la partie en cours
          </Text>
        </View>
      ) : null}

      {/* Buzzer Button for Players */}
      {!isSpectator && !isManager ? (
        <View className="mb-4 flex-col items-center">
          <BuzzerButton
            onBuzz={handleBuzz}
            disabled={isSubmitting || !buzzerOpen || actualHasBuzzed || answeredWrongThisQuestion}
            hasBuzzed={actualHasBuzzed}
            queuePosition={myQueuePosition}
            teamBuzzed={teamBuzzed}
          />
        </View>
      ) : null}

      {/* Manager Validation Controls (if player is answering) */}
      {isManager && answeringPlayer ? (
        <View className="bg-surface rounded-3xl border border-line p-4 mb-4 flex-col">
          <Text className="text-txt font-bold text-center text-sm mb-3">
            Valider la réponse de {(answeringPlayer as any).playerName || answeringPlayer.name} :
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleValidate(true)}
              disabled={isValidating}
              activeOpacity={0.8}
              className="flex-1 py-3.5 rounded-2xl bg-good flex-row items-center justify-center shadow-sm"
            >
              <Check size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-1.5">
                CORRECT
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleValidate(false, true)}
              disabled={isValidating}
              activeOpacity={0.8}
              className="flex-1 py-3.5 rounded-2xl bg-buzz flex-row items-center justify-center shadow-sm"
            >
              <X size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-1.5">
                FAUX (-pts)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Manager Action Controls (Skip, Reset, Pause) */}
      {isManager ? (
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={handleSkip}
            disabled={isSkipping}
            activeOpacity={0.7}
            className="flex-1 py-3 rounded-xl bg-surface2 border border-line flex-row items-center justify-center"
          >
            <SkipForward size={16} color={inkAlpha.soft} />
            <Text className="text-txt-60 font-semibold text-xs ml-1.5">
              Passer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetBuzzer}
            disabled={isResettingBuzzer}
            activeOpacity={0.7}
            className="flex-1 py-3 rounded-xl bg-surface2 border border-line flex-row items-center justify-center"
          >
            <RefreshCw size={16} color={inkAlpha.soft} />
            <Text className="text-txt-60 font-semibold text-xs ml-1.5">
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isPaused ? handleResume : handlePause}
            disabled={isPauseToggling}
            activeOpacity={0.7}
            className="flex-1 py-3 rounded-xl bg-gold/15 border border-gold/30 flex-row items-center justify-center"
          >
            {isPaused ? (
              <View className="flex-row items-center">
                <Play size={16} color={palette.gold} />
                <Text className="text-gold font-bold text-xs ml-1.5">
                  Reprendre
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Pause size={16} color={palette.gold} />
                <Text className="text-gold font-bold text-xs ml-1.5">
                  Pause
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Reveal Banner if question answered */}
      {game.reveal ? (
        <View className="bg-surface rounded-3xl border border-line p-5 mb-4 flex-col items-center shadow-md">
          {game.reveal.winnerName ? (
            <>
              <Text className="text-good font-bold text-lg mb-1 text-center">
                🎉 Bonne réponse de {game.reveal.winnerName} !
              </Text>
              <Text className="text-txt-60 text-xs text-center mb-3">
                Réponse : {game.reveal.correctAnswer}
              </Text>
            </>
          ) : (
            <>
              <Text className="text-buzz font-bold text-lg mb-1 text-center">
                ❌ Personne n&apos;a trouvé !
              </Text>
              <Text className="text-txt-60 text-xs text-center mb-3">
                Bonne réponse : {game.reveal.correctAnswer}
              </Text>
              {isManager ? (
                <TouchableOpacity
                  onPress={handleAdvanceAfterAllWrong}
                  activeOpacity={0.8}
                  className="px-5 py-2.5 rounded-full bg-buzz"
                >
                  <Text className="text-white text-xs font-bold">
                    Question suivante →
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}
