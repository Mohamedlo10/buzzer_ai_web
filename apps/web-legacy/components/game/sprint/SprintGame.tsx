'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Eye, Loader2 } from 'lucide-react';

import { useBuzzStore } from '~/stores/useBuzzStore';
import { AnswerChoicesPanel } from '~/components/game/AnswerChoicesPanel';
import { GlobalTimerBar } from '~/components/game/GlobalTimerBar';
import { GameHeader } from '~/components/game/shared/GameHeader';
import { GameFooter } from '~/components/game/shared/GameFooter';
import { SafeScreen } from '~/components/layout/SafeScreen';
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
 * Tout ce qui est affiché vient du dernier `GameStatePacket` appliqué — la
 * phase, les propositions, l'échéance, le décompte des réponses. Ce composant ne
 * décide de rien : il n'auto-soumet pas à l'expiration (le serveur clôture
 * lui-même) et ne fait pas avancer la partie.
 *
 * Chaque phase a son écran. Auparavant seul `COUNTDOWN` était traité et tout le
 * reste retombait sur une mise en page unique : quand aucun paquet n'était
 * encore arrivé, la page affichait une barre de chrono à zéro et aucune
 * proposition, sans rien indiquer — impossible de distinguer « ça charge » de
 * « c'est cassé ».
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

  // Aucun paquet appliqué : le serveur n'a pas encore parlé. `stateVersion`
  // reste à 0 tant que c'est le cas — les versions serveur commencent à 1.
  const awaitingServer = game.stateVersion === 0;

  useEffect(() => {
    if (phase === 'FINISHED') {
      router.replace(`/session/${sessionCode}/results`);
    }
  }, [phase, router, sessionCode]);

  const handleSubmit = async (chosenAnswer: string) => {
    // Le panneau n'auto-soumet qu'en mode solo, où aucune échéance serveur ne
    // lui est fournie. En Sprint ce jeton ne doit jamais partir au serveur :
    // une absence de réponse est un NO_ANSWER que le serveur pose lui-même à la
    // clôture, et l'envoyer comme réponse vide la ferait compter dans la
    // précision affichée aux résultats.
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
      // 409 : la phase a changé sous nos pieds. On se recale sur le serveur
      // plutôt que de vider l'écran sur une erreur silencieuse.
      if (err?.response?.status === 409) {
        try {
          const state = await gameApi.getGameState(sessionId);
          useBuzzStore.getState().applyStatePacket(state.statePacket);
        } catch {
          /* le prochain paquet recalera de toute façon */
        }
      }
    } finally {
      useBuzzStore.getState().setIsSubmittingAnswer(false);
    }
  };

  // ── Écrans plein cadre ───────────────────────────────────────────────────

  if (awaitingServer) {
    return (
      <SafeScreen className="h-[100dvh] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="text-accent animate-spin" />
        <p className="text-txt-60 text-sm">Synchronisation avec la partie…</p>
      </SafeScreen>
    );
  }

  if (phase === 'COUNTDOWN') {
    return (
      <SafeScreen className="h-[100dvh] w-full flex flex-col items-center justify-center gap-4 bg-primary">
        <span className="text-9xl font-bold text-white animate-pulse tabular-nums">
          {remainingSeconds > 0 ? remainingSeconds : 'GO'}
        </span>
        <p className="text-white/70 text-sm font-semibold tracking-widest uppercase">
          Préparez-vous
        </p>
      </SafeScreen>
    );
  }

  if (!session) return null;

  const isRevealing = phase === 'REVEAL' || phase === 'ADVANCING';
  const choices = game.choices ?? [];
  const correctAnswer = game.reveal?.correctAnswer ?? null;
  const canAnswer = phase === 'QUESTION' && myChoice === null && !isSpectator;

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      <GameHeader
        session={session}
        currentQuestion={currentQuestion!}
        questionIndex={questionIndex}
        isConnected={true}
        isManager={isManager ?? false}
        isSpectator={isSpectator ?? false}
        currentPlayer={myPlayer ?? undefined}
        teams={teams ?? []}
      />

      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        {/* Le chrono n'existe que si le serveur a donné une échéance. Une barre
            figée à 0 laissait croire à un temps écoulé alors que rien n'avait
            encore commencé. */}
        {phase === 'QUESTION' && game.phaseEndsAtEpochMs != null && (
          <div className="mb-3">
            <GlobalTimerBar
              totalSeconds={questionSeconds}
              remainingSeconds={Math.max(0, remainingSeconds)}
            />
          </div>
        )}

        {/* Confidentialité (spec §9) : uniquement le décompte agrégé, jamais qui
            a répondu ni ce qu'il a répondu. */}
        {phase === 'QUESTION' && game.answeredCount != null && game.expectedAnswerCount != null && (
          <p className="text-center text-xs font-semibold text-txt-60 mb-3 tabular-nums">
            {game.answeredCount} / {game.expectedAnswerCount} joueurs ont répondu
          </p>
        )}

        {isSpectator && (
          <div className="bg-energy/10 border border-energy/30 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 mb-3">
            <Eye size={16} className="text-energy shrink-0" />
            <p className="text-energy text-xs font-semibold">
              Mode spectateur — vous observez la partie
            </p>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center mb-6">
          <h2 className="text-2xl font-bold text-center text-txt">
            {currentQuestion?.text}
          </h2>
        </div>

        {/* Grille interactive : uniquement tant que ce joueur peut encore jouer. */}
        {canAnswer && choices.length > 0 && (
          <AnswerChoicesPanel
            choices={choices}
            answerTimeSeconds={questionSeconds}
            deadlineEpochMs={game.phaseEndsAtEpochMs}
            onSubmit={handleSubmit}
            isSubmitting={isSubmittingAnswer}
          />
        )}

        {/* Grille verrouillée : ce joueur a déjà répondu, ou observe, ou la
            réponse est révélée. Rendue à part plutôt que via le panneau
            interactif, pour qu'un joueur qui se reconnecte retrouve son choix
            mis en évidence — le panneau, lui, ne connaît que les clics reçus. */}
        {!canAnswer && choices.length > 0 && (
          <div className="flex flex-col gap-2">
            {choices.map((choice, index) => {
              const isMine = myChoice === choice;
              const isCorrect = isRevealing && correctAnswer === choice;
              const isMineAndWrong = isRevealing && isMine && !isCorrect;

              return (
                <div
                  key={choice}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                    isCorrect
                      ? 'border-good bg-good/10'
                      : isMineAndWrong
                        ? 'border-buzz bg-buzz/10'
                        : isMine
                          ? 'border-indigo bg-indigo/15 shadow-sm'
                          : 'border-line bg-surface opacity-60'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCorrect
                        ? 'bg-good text-white'
                        : isMineAndWrong
                          ? 'bg-buzz text-white'
                          : isMine
                            ? 'bg-indigo text-white'
                            : 'bg-surface-2 text-txt'
                    }`}
                  >
                    {CHOICE_LABELS[index] ?? index + 1}
                  </span>
                  <span className="text-txt text-sm flex-1 font-medium">{choice}</span>
                  {isCorrect && <CheckCircle2 size={18} className="text-good shrink-0" />}
                  {isMineAndWrong && <XCircle size={18} className="text-buzz shrink-0" />}
                  {isMine && !isRevealing && (
                    <span className="px-2.5 py-1 rounded-full bg-indigo/20 text-indigo text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo animate-pulse" />
                      Choix enregistré
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Verdict personnel (spec §15) : chacun voit son propre résultat, jamais
            celui des autres, et aucun classement à ce stade. Il n'y a pas de
            vainqueur en Sprint — plusieurs joueurs peuvent avoir juste. */}
        {isRevealing && (
          <div className="mt-4 flex flex-col items-center gap-1">
            {myChoice === null ? (
              <p className="text-txt-60 text-sm font-semibold">Aucune réponse donnée</p>
            ) : myAnswerCorrect ? (
              <p className="text-good text-lg font-bold flex items-center gap-2">
                <CheckCircle2 size={20} /> Bonne réponse
              </p>
            ) : (
              <p className="text-buzz text-lg font-bold flex items-center gap-2">
                <XCircle size={20} /> Mauvaise réponse
              </p>
            )}
            {correctAnswer && (
              <p className="text-txt-60 text-xs">
                Réponse attendue : <span className="text-txt font-semibold">{correctAnswer}</span>
              </p>
            )}
          </div>
        )}

        {/* Ce joueur a répondu et le chrono court encore. */}
        {phase === 'QUESTION' && myChoice !== null && (
          <p className="mt-4 text-center text-txt-60 text-xs">
            Réponse enregistrée — en attente des autres joueurs…
          </p>
        )}
      </div>

      <GameFooter
        sessionId={sessionId}
        players={players}
        teams={teams ?? []}
        isTeamMode={session?.isTeamMode ?? false}
        isManager={isManager ?? false}
        currentUserId={myPlayer?.id}
      />
    </div>
  );
}
