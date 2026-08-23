import { View, Text } from 'react-native';
import { palette } from '~/lib/theme/tokens';
import { BlinkingCursor, FadeInUpView } from '~/components/anim';

interface ProgressiveQuestionDisplayProps {
  text: string;
  wordIndex: number;
  isRunning: boolean;
  showRiskBadge?: boolean;
}

/**
 * Affiche la question mot par mot (portage de l'original web).
 * Curseur clignotant animé en Reanimated UI thread.
 */
export function ProgressiveQuestionDisplay({
  text,
  wordIndex,
  isRunning,
  showRiskBadge = true,
}: ProgressiveQuestionDisplayProps) {
  const words = text.split(' ');
  const isFullyRevealed = wordIndex >= words.length - 1;
  const revealedText = words.slice(0, wordIndex + 1).join(' ');

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 18,
      }}
    >
      <Text
        style={{
          color: palette.inkSoft,
          fontSize: 9.5,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Question
      </Text>
      <Text
        style={{
          color: palette.txt,
          fontSize: 19,
          lineHeight: 28,
          fontWeight: '500',
          minHeight: 84,
        }}
      >
        {revealedText}
        {!isFullyRevealed && isRunning ? (
          <BlinkingCursor color={palette.txt} size={19} />
        ) : null}
      </Text>
      {showRiskBadge && !isFullyRevealed && isRunning && (
        <FadeInUpView
          style={{
            flexDirection: 'row',
            alignSelf: 'flex-start',
            marginTop: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 9999,
            backgroundColor: palette.warn + '26',
            borderWidth: 1,
            borderColor: palette.warn + '50',
          }}
          duration={250}
        >
          <Text style={{ color: palette.warn, fontSize: 11, fontWeight: '600' }}>
            ⚡ Lecture en cours — buzz risqué
          </Text>
        </FadeInUpView>
      )}
    </View>
  );
}

