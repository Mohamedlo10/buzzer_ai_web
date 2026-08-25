import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import { useDeadlineSeconds } from '~/lib/game/useDeadline';
import { serverNow, msUntil } from '~/lib/game/clock';

interface AnswerChoicesPanelProps {
  choices: string[];
  answerTimeSeconds: number;
  deadlineEpochMs?: number | null;
  onSubmit: (chosenAnswer: string) => void;
  isSubmitting?: boolean;
  result?: 'correct' | 'wrong' | null;
  correctAnswer?: string | null;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AnswerChoicesPanel({
  choices,
  answerTimeSeconds,
  deadlineEpochMs,
  onSubmit,
  isSubmitting = false,
  result = null,
  correctAnswer = null,
}: AnswerChoicesPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [frozenRemaining, setFrozenRemaining] = useState<number | null>(null);
  const hasSubmittedRef = useRef(false);
  const serverDriven = deadlineEpochMs != null;

  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  // Mode local (solo) : initialiser immédiatement l'échéance
  const [localDeadline, setLocalDeadline] = useState<number | null>(() =>
    serverDriven ? null : serverNow() + answerTimeSeconds * 1000
  );

  const choicesKey = choices.join('|');
  useEffect(() => {
    if (serverDriven) {
      setLocalDeadline(null);
      return;
    }
    setLocalDeadline(serverNow() + answerTimeSeconds * 1000);
    setSelectedIndex(null);
    setFrozenRemaining(null);
    hasSubmittedRef.current = false;
  }, [serverDriven, answerTimeSeconds, choicesKey]);

  const effectiveDeadline = serverDriven ? deadlineEpochMs : localDeadline;
  const remaining = useDeadlineSeconds(effectiveDeadline);

  useEffect(() => {
    setSelectedIndex(null);
    setFrozenRemaining(null);
    hasSubmittedRef.current = false;
  }, [effectiveDeadline]);

  // Si un résultat arrive sans sélection explicite (ex: timeout), figer le chrono
  useEffect(() => {
    if (result && frozenRemaining === null) {
      setFrozenRemaining(remaining);
    }
  }, [result, remaining, frozenRemaining]);

  // Auto-soumission au temps écoulé uniquement en mode local
  useEffect(() => {
    if (serverDriven || !localDeadline) return;
    if (hasSubmittedRef.current || isSubmitting || result) return;
    if (remaining <= 0 && msUntil(localDeadline) <= 0) {
      hasSubmittedRef.current = true;
      setFrozenRemaining(0);
      onSubmitRef.current('__timeout__');
    }
  }, [serverDriven, localDeadline, remaining, isSubmitting, result]);

  const handleSelect = (index: number, answer: string) => {
    if (hasSubmittedRef.current || isSubmitting || result) return;
    hasSubmittedRef.current = true;
    setFrozenRemaining(remaining);
    setSelectedIndex(index);
    onSubmit(answer);
  };

  const displayRemaining = frozenRemaining !== null ? frozenRemaining : remaining;
  const pct = Math.max(0, Math.min(100, Math.round((displayRemaining / answerTimeSeconds) * 100)));
  const timerColor =
    displayRemaining > answerTimeSeconds * 0.6
      ? palette.good
      : displayRemaining > answerTimeSeconds * 0.3
      ? palette.warn
      : palette.bad;

  return (
    <View style={{ gap: 16 }}>
      {/* Timer bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 8, backgroundColor: palette.surface2, borderRadius: 9999, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: timerColor,
              borderRadius: 9999,
            }}
          />
        </View>
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 15,
            width: 36,
            textAlign: 'right',
            color: timerColor,
            fontVariant: ['tabular-nums'],
            paddingTop: 2,
          }}
        >
          {displayRemaining}s
        </Text>
      </View>

      {/* 2-column grid via flexWrap */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {choices.map((choice, i) => {
          const isSelected = selectedIndex === i;
          const isThisChoiceCorrect = correctAnswer ? choice === correctAnswer : (result === 'correct' && isSelected);
          const showCorrect = (result === 'correct' && isSelected) || (result === 'wrong' && isThisChoiceCorrect);
          const showWrong = result === 'wrong' && isSelected;
          const dimmed = selectedIndex !== null && !isSelected && !showCorrect;

          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleSelect(i, choice)}
              disabled={hasSubmittedRef.current || isSubmitting || !!result}
              activeOpacity={0.8}
              style={{
                width: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderRadius: 16,
                borderWidth: 1.5,
                paddingHorizontal: 12,
                paddingVertical: 12,
                minHeight: 60,
                borderColor: showCorrect
                  ? palette.good
                  : showWrong
                  ? palette.bad
                  : isSelected
                  ? palette.indigo
                  : palette.line,
                backgroundColor: showCorrect
                  ? palette.good + '26'
                  : showWrong
                  ? palette.bad + '26'
                  : isSelected
                  ? palette.indigo + '26'
                  : palette.surface,
                opacity: dimmed ? 0.45 : 1,
              }}
            >
              {/* Badge (Transforme la lettre en Check ou Croix sans modifier l'espace disponible) */}
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: showCorrect
                    ? palette.good
                    : showWrong
                    ? palette.bad
                    : isSelected
                    ? palette.indigo
                    : palette.surface2,
                }}
              >
                {showCorrect ? (
                  <Check size={17} color="#FFFFFF" strokeWidth={2.8} />
                ) : showWrong ? (
                  <X size={17} color="#FFFFFF" strokeWidth={2.8} />
                ) : (
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      color: isSelected ? '#FFFFFF' : palette.txt,
                      fontSize: 14,
                      paddingTop: 2,
                    }}
                  >
                    {CHOICE_LABELS[i]}
                  </Text>
                )}
              </View>

              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  color: palette.txt,
                  fontSize: 13.5,
                  fontWeight: '600',
                  flex: 1,
                  lineHeight: 18,
                }}
                numberOfLines={2}
              >
                {choice}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 13, textAlign: 'center' }}>
        Réponds vite pour maximiser tes points
      </Text>
    </View>
  );
}
