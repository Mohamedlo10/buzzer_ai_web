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

  // Mode local (solo) : une échéance est fabriquée une fois par tour. Elle est
  // recalculée uniquement quand les propositions changent, jamais sur un simple
  // re-render — c'était la cause du réarmement du garde en pleine soumission.
  const [localDeadline, setLocalDeadline] = useState<number | null>(null);
  const choicesKey = choices.join('|');
  useEffect(() => {
    if (serverDriven) {
      setLocalDeadline(null);
      return;
    }
    setLocalDeadline(serverNow() + answerTimeSeconds * 1000);
  }, [serverDriven, answerTimeSeconds, choicesKey]);

  const effectiveDeadline = serverDriven ? deadlineEpochMs : localDeadline;
  const remaining = useDeadlineSeconds(effectiveDeadline);

  // Le garde ne se réarme qu'au changement de tour, jamais sur un re-render.
  useEffect(() => {
    setSelectedIndex(null);
    hasSubmittedRef.current = false;
  }, [effectiveDeadline]);

  // Auto-soumission au temps écoulé : uniquement en mode local. En multijoueur
  // c'est le serveur qui décide de l'expiration.
  useEffect(() => {
    if (serverDriven || !localDeadline) return;
    if (remaining > 0 || hasSubmittedRef.current || isSubmitting || result) return;
    hasSubmittedRef.current = true;
    onSubmitRef.current('__timeout__');
  }, [serverDriven, localDeadline, remaining, isSubmitting, result]);

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
              className={`flex items-center gap-2.5 w-full rounded-[14px] border-[1.5px] p-3.5 min-h-[58px] text-left transition-all duration-150 active:scale-[0.98] disabled:cursor-default ${
                showCorrect ? 'bg-success/20 border-success' :
                showWrong ? 'bg-buzz/18 border-buzz animate-[shake_0.4s_ease]' :
                isSelected ? 'bg-accent/18 border-accent' :
                'bg-surface border-line'
              } ${dimmed ? 'opacity-45' : ''}`}
            >
              <span className="w-[30px] h-[30px] rounded-[9px] bg-surface-2 flex items-center justify-center text-txt font-bold text-[13px] shrink-0">
                {CHOICE_LABELS[i]}
              </span>
              <span className="text-txt text-[14.5px] font-semibold leading-snug flex-1">{choice}</span>
              {showCorrect && <CheckCircle size={18} className="text-success shrink-0" />}
              {showWrong && <XCircle size={18} className="text-buzz shrink-0" />}
            </button>
          );
        })}
      </div>

      <p className="text-txt-60 text-xs text-center">Réponds vite pour maximiser tes points</p>
    </div>
  );
}
