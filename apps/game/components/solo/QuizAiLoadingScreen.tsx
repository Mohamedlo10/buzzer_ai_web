import React, { useState, useEffect } from 'react';
import { View, Text, Modal } from 'react-native';
import { Brain, Sparkles, Zap } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import { PulseView, FloatView, FadeInUpView } from '~/components/anim';

interface QuizAiLoadingScreenProps {
  visible: boolean;
  theme: string;
  levelLabel?: string;
  title?: string;
  mode?: 'career' | 'training' | 'generation';
}

const GENERATION_STEPS = [
  'Initialisation du modèle d’intelligence artificielle…',
  'Analyse du thème et calibrage des questions…',
  'Génération de questions inédites et vérification…',
  'Préparation des explications et des pièges…',
  'Finalisation de la partie… Préparez-vous !',
];

export function QuizAiLoadingScreen({
  visible,
  theme,
  levelLabel,
  title = 'Préparation de la partie en cours',
  mode = 'career',
}: QuizAiLoadingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
          gap: 24,
        }}
      >
        {/* Animated Brain in Glowing Pulse Container */}
        <PulseView duration={2000}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: palette.primary + '20',
              borderWidth: 2,
              borderColor: palette.primary + '50',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: palette.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
              position: 'relative',
            }}
          >
            <FloatView duration={2200}>
              <Brain size={58} color={palette.primary} strokeWidth={2.2} />
            </FloatView>

            {/* Sparkle badge */}
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: palette.gold,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: palette.bg,
              }}
            >
              <Sparkles size={16} color="#FFFFFF" />
            </View>
          </View>
        </PulseView>

        {/* Text Details */}
        <View style={{ alignItems: 'center', gap: 8, width: '100%' }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 22,
              color: palette.txt,
              textAlign: 'center',
              lineHeight: 28,
              paddingTop: 4,
            }}
          >
            {title}
          </Text>

          {levelLabel ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: palette.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <Zap size={14} color={palette.primary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
                {levelLabel}
              </Text>
            </View>
          ) : null}

          <Text
            style={{
              fontSize: 14,
              color: palette.inkSoft,
              textAlign: 'center',
              marginTop: 4,
              paddingHorizontal: 16,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            Thème : <Text style={{ color: palette.txt, fontWeight: '700' }}>{theme}</Text>
          </Text>
        </View>

        {/* Dynamic step ticker */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: palette.line,
            paddingVertical: 14,
            paddingHorizontal: 20,
            width: '100%',
            alignItems: 'center',
            minHeight: 52,
            justifyContent: 'center',
          }}
        >
          <FadeInUpView key={stepIndex} duration={250}>
            <Text
              style={{
                fontSize: 13,
                color: palette.primary,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              {GENERATION_STEPS[stepIndex]}
            </Text>
          </FadeInUpView>
        </View>

        <Text style={{ fontSize: 11.5, color: palette.inkSoft, textAlign: 'center' }}>
          L'intelligence artificielle compose vos questions sur mesure…
        </Text>
      </View>
    </Modal>
  );
}

export default QuizAiLoadingScreen;
