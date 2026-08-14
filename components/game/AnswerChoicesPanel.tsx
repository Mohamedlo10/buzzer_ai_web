'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useDeadlineSeconds } from '~/lib/game/useDeadline';
import { serverNow } from '~/lib/game/clock';

interface AnswerChoicesPanelProps {
  choices: string[];
  /** Durée nominale du tour, pour les seuils de couleur du chrono. */
  answerTimeSeconds: number;
  /**
   * Échéance absolue en temps serveur.
   *
   * Quand elle est fournie (multijoueur sans modérateur), c'est le serveur qui
   * tranche l'expiration : le panneau se contente d'afficher le décompte et
   * n'auto-soumet jamais. Une auto-soumission côté client entrait autrement en
   * course avec le clic du joueur, l'une marquant faux pendant que l'autre
   * marquait juste.
   *
   * Absente (mode solo, sans moteur serveur), le panneau retombe sur un
   * décompte local et auto-soumet `__timeout__` à zéro.
   */
  deadlineEpochMs?: number | null;
  onSubmit: (chosenAnswer: string) => void;
  isSubmitting?: boolean;
  result?: 'correct' | 'wrong' | null;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AnswerChoicesPanel({
  choices,
  answerTimeSeconds,
  deadlineEpochMs,
  onSubmit,
  isSubmitting = false,
  result = null,
}: AnswerChoicesPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const hasSubmittedRef = useRef(false);
  const serverDriven = deadlineEpochMs != null;

  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  // Mode local (solo) : une échéance est fabriquée une fois par tour.
  const choicesKey = (choices ?? []).join('|');
  const [prevChoicesKey, setPrevChoicesKey] = useState(choicesKey);
  const [localDeadline, setLocalDeadline] = useState<number | null>(() =>
    serverDriven ? null : serverNow() + answerTimeSeconds * 1000
  );

  // Quand les propositions changent (nouvelle question), on réinitialise immédiatement
  if (choicesKey !== prevChoicesKey) {
    setPrevChoicesKey(choicesKey);
    setLocalDeadline(serverDriven ? null : serverNow() + answerTimeSeconds * 1000);
    setSelectedIndex(null);
    hasSubmittedRef.current = false;
  }

  const effectiveDeadline = serverDriven ? deadlineEpochMs : localDeadline;
  const remaining = useDeadlineSeconds(effectiveDeadline);

  // Auto-soumission au temps écoulé : uniquement en mode local. En multijoueur
  // c'est le serveur qui décide de l'expiration.
  useEffect(() => {
    if (serverDriven || !localDeadline) return;
    if (remaining > 0 || hasSubmittedRef.current || isSubmitting || result) return;
    hasSubmittedRef.current = true;
    onSubmitRef.current('__timeout__');
  }, [serverDriven, localDeadline, remaining, isSubmitting, result]);

  // Reset state if submission fails (isSubmitting goes false but we have no result)
  const prevIsSubmitting = useRef(isSubmitting);
  useEffect(() => {
    if (prevIsSubmitting.current && !isSubmitting && !result && selectedIndex !== null) {
      // Submission finished without a result (error case)
      hasSubmittedRef.current = false;
      setSelectedIndex(null);
    }
    prevIsSubmitting.current = isSubmitting;
  }, [isSubmitting, result, selectedIndex]);

  const handleSelect = (index: number, answer: string) => {
    if (hasSubmittedRef.current || isSubmitting || result) return;
    hasSubmittedRef.current = true;
    setSelectedIndex(index);
    onSubmit(answer);
  };

  const pct = Math.round((remaining / answerTimeSeconds) * 100);
  // Vert -> ambre -> rouge : la terracotta de marque ne convient pas ici,
  // elle se lirait comme une alerte dès le début du chrono.
  const timerColor = remaining > answerTimeSeconds * 0.6
    ? 'var(--good)'
    : remaining > answerTimeSeconds * 0.3
    ? 'var(--warn)'
    : 'var(--bad)';

  return (
    <div className="flex flex-col gap-4 animate-[rise_0.4s_both]">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, backgroundColor: timerColor }}
          />
        </div>
        <span className="font-bold text-sm w-8 text-right tabular-nums" style={{ color: timerColor }}>
          {remaining}s
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {choices.map((choice, i) => {
          const isSelected = selectedIndex === i;
          const showCorrect = result === 'correct' && isSelected;
          const showWrong = result === 'wrong' && isSelected;
          const dimmed = selectedIndex !== null && !isSelected;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i, choice)}
              disabled={hasSubmittedRef.current || isSubmitting || !!result}
              className={`relative flex items-center gap-3 w-full rounded-2xl border-2 p-3.5 min-h-[60px] text-left transition-all duration-200 active:scale-[0.98] disabled:cursor-default overflow-hidden ${
                showCorrect ? 'bg-good/10 border-good' :
                showWrong ? 'bg-buzz/10 border-buzz animate-[shake_0.4s_ease]' :
                isSelected ? 'bg-indigo/10 border-indigo shadow-md scale-[1.01]' :
                'bg-surface border-line hover:border-txt-20 hover:bg-surface-2'
              } ${dimmed ? 'opacity-50 scale-[0.99]' : ''}`}
            >
              {isSelected && isSubmitting && (
                <div className="absolute inset-0 bg-surface/40 flex items-center justify-center backdrop-blur-[1px] z-10">
                  <span className="w-5 h-5 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                showCorrect ? 'bg-good text-white' :
                showWrong ? 'bg-buzz text-white' :
                isSelected ? 'bg-indigo text-white shadow-sm' :
                'bg-surface-2 text-txt-60'
              }`}>
                {CHOICE_LABELS[i]}
              </span>
              <span className={`text-[15px] leading-snug flex-1 transition-colors ${
                isSelected ? 'text-indigo font-bold' : 'text-txt font-semibold'
              }`}>{choice}</span>
              {showCorrect && <CheckCircle size={20} className="text-good shrink-0" />}
              {showWrong && <XCircle size={20} className="text-buzz shrink-0" />}
            </button>
          );
        })}
      </div>

      <p className="text-txt-60 text-xs text-center">Réponds vite pour maximiser tes points</p>
    </div>
  );
}
