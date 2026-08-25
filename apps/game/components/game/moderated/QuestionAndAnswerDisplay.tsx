import { View, Text, TouchableOpacity } from 'react-native';
import { Mic, Eye, EyeOff, Target } from 'lucide-react-native';
import { ExpandableCard } from './ExpandableCard';
import { palette, font } from '~/lib/theme/tokens';
import type { QuestionResponse, ManualQuestion } from '~/types/api';

export interface QuestionAndAnswerDisplayProps {
  isManager: boolean;
  currentQuestion: QuestionResponse;
  questionIndex: number;
  manualQuestions: ManualQuestion[];
  showAnswer: boolean;
  setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>;
  displayedWordCount?: number;
  phase?: string;
  totalWordCount?: number;
}

export function QuestionAndAnswerDisplay({
  isManager,
  currentQuestion,
  questionIndex,
  manualQuestions,
  showAnswer,
  setShowAnswer,
}: QuestionAndAnswerDisplayProps) {
  if (!isManager) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <View style={{ gap: 12, marginBottom: 16 }}>
        <ExpandableCard
          key={`q-${currentQuestion.id}`}
          icon={<Mic size={14} color={palette.primary} />}
          label="QUESTION"
          content={currentQuestion.text}
          bgColor={palette.surface}
          borderColor={palette.line}
        />

        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => setShowAnswer((v) => !v)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-end',
              gap: 4,
              marginBottom: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 9999,
              backgroundColor: palette.surface2,
            }}
          >
            {showAnswer ? (
              <EyeOff size={11} color="rgba(255,255,255,0.5)" />
            ) : (
              <Eye size={11} color="rgba(255,255,255,0.5)" />
            )}
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                color: palette.inkSoft,
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {showAnswer ? 'Masquer' : 'Afficher'}
            </Text>
          </TouchableOpacity>

          {showAnswer ? (
            <ExpandableCard
              key={`a-${currentQuestion.id}`}
              icon={<Target size={14} color={palette.primary} />}
              label="RÉPONSE"
              content={
                currentQuestion.answer ||
                manualQuestions[questionIndex]?.answer ||
                '...'
              }
              subContent={
                currentQuestion.explanation ||
                manualQuestions[questionIndex]?.explanation ||
                undefined
              }
              bgColor={palette.primary + '0D'}
              borderColor={palette.primary + '40'}
              isBold
            />
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: palette.surface2 + '66',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.line,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 80,
              }}
            >
              <EyeOff size={20} color="rgba(255,255,255,0.2)" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
