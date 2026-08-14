import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { palette } from '~/lib/theme/tokens';

interface AnswerRevealOverlayProps {
  visible: boolean;
  correctAnswer: string;
  winnerId: string | null;
  winnerName: string | null;
  allAnswersWrong?: boolean;
  isManager?: boolean;
  onDismiss?: () => void;
  onAdvance?: () => void;
  autoDismissMs?: number;
}

/**
 * Overlay de révélation de la bonne réponse.
 *
 * Implémenté via Modal RN (pas de zIndex inter-parents) pour garantir
 * la stabilité Android. Port de web-legacy AnswerRevealOverlay.tsx.
 * Keyframes CSS fadein/pop → transitions RN (opacity, scale).
 */
export function AnswerRevealOverlay({
  visible,
  correctAnswer,
  winnerId,
  winnerName,
  allAnswersWrong = false,
  isManager = false,
  onDismiss,
  onAdvance,
  autoDismissMs = 3000,
}: AnswerRevealOverlayProps) {
  const isWinner = !!winnerId;
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleAdvance = () => {
    if (isAdvancing || !onAdvance) return;
    setIsAdvancing(true);
    onAdvance();
  };

  useEffect(() => {
    if (!visible) return;
    setIsAdvancing(false);
    if (allAnswersWrong) return;
    if (!autoDismissMs) return;
    const t = setTimeout(() => onDismiss?.(), autoDismissMs);
    return () => clearTimeout(t);
  }, [visible, allAnswersWrong, autoDismissMs]); // eslint-disable-line

  const headerBg = isWinner ? palette.good : palette.primary;
  const statusLabel = isWinner
    ? 'BONNE RÉPONSE !'
    : allAnswersWrong
      ? 'AUCUNE BONNE RÉPONSE'
      : 'MAUVAISE RÉPONSE';
  const heroText = isWinner
    ? `${winnerName ?? 'Un joueur'}\nremporte la manche !`
    : `Oups !\n${allAnswersWrong ? "Personne n'a trouvé la bonne réponse" : 'La réponse était incorrecte'}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.75)" barStyle="light-content" />
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 20, 16, 0.88)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        {/* Diamond pattern (simplified — 2 concentric lozenges) */}
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', opacity: 0.12 }}>
          {[240, 160].map((size, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderWidth: 1.5,
                borderColor: isWinner ? palette.good : palette.primary,
                transform: [{ rotate: '45deg' }],
              }}
            />
          ))}
        </View>

        {/* Card */}
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 32,
            alignItems: 'center',
          }}
        >
          {/* Status badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: headerBg,
              marginBottom: 20,
            }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>{isWinner ? '✓' : '✕'}</Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.6 }}>{statusLabel}</Text>
          </View>

          {/* Hero text */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: '700',
              color: isWinner ? palette.good : palette.txt,
              textAlign: 'center',
              lineHeight: 38,
              marginBottom: 16,
            }}
          >
            {heroText}
          </Text>

          {/* Correct answer card */}
          <View
            style={{
              backgroundColor: palette.bg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 18,
              width: '100%',
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: palette.inkSoft, fontWeight: '700', marginBottom: 6 }}>
              {isWinner ? 'Réponse validée' : 'La bonne réponse était'}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: palette.txt }}>
              {correctAnswer}
            </Text>
          </View>

          {/* Action */}
          {allAnswersWrong && onAdvance && isManager ? (
            <TouchableOpacity
              onPress={handleAdvance}
              disabled={isAdvancing}
              activeOpacity={0.8}
              style={{
                width: '100%',
                backgroundColor: isAdvancing ? palette.line : palette.primary,
                borderRadius: 9999,
                paddingVertical: 14,
                paddingHorizontal: 20,
                alignItems: 'center',
                opacity: isAdvancing ? 0.7 : 1,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                {isAdvancing ? 'Passage en cours…' : 'Question suivante →'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.primary }} />
              <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '600' }}>
                {isWinner ? 'Passage à la suite…' : 'En attente des autres joueurs…'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
