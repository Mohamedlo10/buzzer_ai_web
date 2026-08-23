import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Flag } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import { BlinkingCursor, FadeInUpView } from '~/components/anim';
import { QuestionReportModal } from './shared/QuestionReportModal';

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
  const [showReport, setShowReport] = useState(false);
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
      <QuestionReportModal
        visible={showReport}
        questionText={text}
        onClose={() => setShowReport(false)}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text
          style={{
            color: palette.inkSoft,
            fontSize: 9.5,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          Question
        </Text>
        <TouchableOpacity
          onPress={() => setShowReport(true)}
          activeOpacity={0.7}
          style={{ padding: 4 }}
        >
          <Flag size={14} color={palette.inkSoft} />
        </TouchableOpacity>
      </View>
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

