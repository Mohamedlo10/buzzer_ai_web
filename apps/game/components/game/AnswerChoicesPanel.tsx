import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import { useDeadlineSeconds } from '~/lib/game/useDeadline';
import { serverNow } from '~/lib/game/clock';

interface AnswerChoicesPanelProps {
  choices: string[];
  answerTimeSeconds: number;
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

  const [localDeadline, setLocalDeadline] = useState<number | null>(null);
  const choicesKey = choices.join('|');
  useEffect(() => {
    if (serverDriven) {
      setLocalDeadline(null);
      return;
    }
    setLocalDeadline(serverNow() + answerTimeSeconds * 1000);
  }, [serverDriven, answerTimeSeconds, choicesKey]); // eslint-disable-line

  const effectiveDeadline = serverDriven ? deadlineEpochMs : localDeadline;
  const remaining = useDeadlineSeconds(effectiveDeadline);

  useEffect(() => {
    setSelectedIndex(null);
    hasSubmittedRef.current = false;
  }, [effectiveDeadline]);

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
  const timerColor = remaining > answerTimeSeconds * 0.6
    ? palette.good
    : remaining > answerTimeSeconds * 0.3
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
            fontWeight: '700',
            fontSize: 14,
            width: 32,
            textAlign: 'right',
            color: timerColor,
            fontVariant: ['tabular-nums'],
          }}
        >
          {remaining}s
        </Text>
      </View>

      {/* 2-column grid via flexWrap */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {choices.map((choice, i) => {
          const isSelected = selectedIndex === i;
          const showCorrect = result === 'correct' && isSelected;
          const showWrong = result === 'wrong' && isSelected;
          const dimmed = selectedIndex !== null && !isSelected;

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
                borderRadius: 14,
                borderWidth: 1.5,
                padding: 14,
                minHeight: 58,
                borderColor: showCorrect ? palette.good : showWrong ? palette.bad : isSelected ? palette.indigo : palette.line,
                backgroundColor: showCorrect ? palette.good + '33' : showWrong ? palette.bad + '2E' : isSelected ? palette.indigo + '26' : palette.surface,
                opacity: dimmed ? 0.45 : 1,
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: showCorrect ? palette.good : showWrong ? palette.bad : isSelected ? palette.indigo : palette.surface2,
                }}
              >
                <Text style={{ color: isSelected || showCorrect || showWrong ? '#FFFFFF' : palette.txt, fontWeight: '700', fontSize: 13 }}>
                  {CHOICE_LABELS[i]}
                </Text>
              </View>
              <Text style={{ color: palette.txt, fontSize: 14, fontWeight: '600', flex: 1 }}>{choice}</Text>
              {showCorrect && <CheckCircle size={18} color={palette.good} style={{ flexShrink: 0 }} />}
              {showWrong && <XCircle size={18} color={palette.bad} style={{ flexShrink: 0 }} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ color: palette.inkSoft, fontSize: 12, textAlign: 'center' }}>
        Réponds vite pour maximiser tes points
      </Text>
    </View>
  );
}
