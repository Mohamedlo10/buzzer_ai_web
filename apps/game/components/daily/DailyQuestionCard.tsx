/**
 * DailyQuestionCard
 *
 * Affiche la question en cours avec :
 * - Progress (Q N / total)
 * - Score courant
 * - Texte de la question
 * - DailyTimerBar
 * - 4 DailyChoiceButton
 *
 * La logique de sélection et de verdict est entièrement dans play.tsx.
 * Ce composant ne fait que rendre.
 */
import { View, Text, ScrollView } from 'react-native';
import { palette, font } from '~/lib/theme/tokens';
import { DailyTimerBar } from './DailyTimerBar';
import { DailyChoiceButton, type ChoiceState } from './DailyChoiceButton';
import type { DailyQuestionView } from '~/types/daily';

interface DailyQuestionCardProps {
  question: DailyQuestionView;
  currentIndex: number;   // 0-based
  totalQuestions: number;
  runningScore: number;
  maxPoints: number;
  choiceStates: ChoiceState[];
  onChoicePress: (index: number) => void;
  onTimerExpire: () => void;
}

export function DailyQuestionCard({
  question,
  currentIndex,
  totalQuestions,
  runningScore,
  maxPoints,
  choiceStates,
  onChoicePress,
  onTimerExpire,
}: DailyQuestionCardProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '800',
              fontSize: 13,
              color: palette.inkSoft,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Q {currentIndex + 1} / {totalQuestions}
          </Text>
          {question.category ? (
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontSize: 11,
                color: palette.inkSoft,
                marginTop: 2,
              }}
            >
              {question.category}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: palette.indigo,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '800',
              fontSize: 13,
              color: '#FFFFFF',
            }}
          >
            {runningScore} / {maxPoints} pts
          </Text>
        </View>
      </View>

      {/* ── Timer ── */}
      <DailyTimerBar
        key={question.id}
        remainingMs={question.remainingMs}
        totalMs={question.timeLimitSec * 1000}
        onExpire={onTimerExpire}
      />

      {/* ── Question ── */}
      <Text
        style={{
          fontFamily: font.nativeFamily.display,
          fontSize: 20,
          lineHeight: 28,
          color: palette.txt,
          paddingTop: 4,
          marginTop: 20,
          marginBottom: 24,
        }}
      >
        {question.text}
      </Text>

      {/* ── Choices ── */}
      <View style={{ gap: 10 }}>
        {question.choices.map((choice, idx) => (
          <DailyChoiceButton
            key={idx}
            index={idx}
            label={choice}
            state={choiceStates[idx] ?? 'idle'}
            onPress={onChoicePress}
          />
        ))}
      </View>
    </ScrollView>
  );
}
