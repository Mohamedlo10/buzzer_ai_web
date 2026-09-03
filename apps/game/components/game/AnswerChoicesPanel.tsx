import { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

interface AnswerChoicesPanelProps {
  choices: string[];
  myChoice: string | null;
  correctAnswer?: string | null;
  isRevealing?: boolean;
  canAnswer: boolean;
  onSubmit: (chosenAnswer: string) => void;
  isSubmitting?: boolean;
  /** Texte affiché une fois le choix fait, avant la révélation. */
  pendingLabel?: string;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const AnswerChoicesPanel = memo(function AnswerChoicesPanel({
  choices,
  myChoice,
  correctAnswer,
  isRevealing = false,
  canAnswer,
  onSubmit,
  isSubmitting = false,
  pendingLabel = '✓ Choix enregistré — en attente des autres joueurs',
}: AnswerChoicesPanelProps) {
  return (
    <View style={{ gap: 12, minHeight: 150 }}>
      {/* 2-column grid via flexWrap with stable positioning */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        {choices.map((choice, i) => {
          const isSelected = myChoice === choice;
          const isCorrect = isRevealing && correctAnswer === choice;
          const isMineAndWrong = isRevealing && isSelected && !isCorrect;
          const dimmed = myChoice !== null && !isSelected && !isCorrect;

          const borderColor = isCorrect
            ? palette.good
            : isMineAndWrong
            ? palette.bad
            : isSelected
            ? palette.indigo
            : palette.line;

          const bgColor = isCorrect
            ? palette.good + '26'
            : isMineAndWrong
            ? palette.bad + '26'
            : isSelected
            ? palette.indigo + '26'
            : palette.surface;

          const badgeBg = isCorrect
            ? palette.good
            : isMineAndWrong
            ? palette.bad
            : isSelected
            ? palette.indigo
            : palette.surface2;

          return (
            <TouchableOpacity
              key={choice}
              onPress={() => {
                if (canAnswer && !isSubmitting) {
                  onSubmit(choice);
                }
              }}
              disabled={!canAnswer || isSubmitting}
              delayPressIn={0}
              activeOpacity={0.7}
              style={{
                width: '48%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderRadius: 16,
                borderWidth: isSelected || isCorrect || isMineAndWrong ? 2 : 1.5,
                paddingHorizontal: 12,
                paddingVertical: 14,
                minHeight: 64,
                borderColor,
                backgroundColor: bgColor,
                opacity: dimmed ? 0.45 : 1,
              }}
            >
              {/* Badge Lettre / Check / Croix */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: badgeBg,
                }}
              >
                {isCorrect ? (
                  <Check size={18} color="#FFFFFF" strokeWidth={3} />
                ) : isMineAndWrong ? (
                  <X size={18} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      color: isSelected ? '#FFFFFF' : palette.txt,
                      fontSize: 14,
                      paddingTop: 2,
                    }}
                  >
                    {CHOICE_LABELS[i] ?? i + 1}
                  </Text>
                )}
              </View>

              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  color: palette.txt,
                  fontSize: 14,
                  fontWeight: isSelected ? '700' : '600',
                  flex: 1,
                  lineHeight: 19,
                }}
                numberOfLines={2}
              >
                {choice}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text
        style={{
          fontFamily: font.nativeFamily.serif,
          fontStyle: 'italic',
          color: palette.inkSoft,
          fontSize: 13,
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        {myChoice !== null
          ? isRevealing
            ? 'Résultats de la question'
            : pendingLabel
          : 'Réponds vite pour maximiser tes points'}
      </Text>
    </View>
  );
});
