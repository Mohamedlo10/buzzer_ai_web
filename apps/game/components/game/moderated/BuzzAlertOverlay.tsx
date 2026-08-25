import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Hand } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { QueueEntry } from '~/lib/game/packet';

export interface BuzzAlertOverlayProps {
  isManager: boolean;
  phase: string;
  firstBuzzer?: QueueEntry;
}

export function BuzzAlertOverlay({ isManager, phase, firstBuzzer }: BuzzAlertOverlayProps) {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastBuzzerKey = useRef<string | null>(null);

  useEffect(() => {
    // Détecter un nouveau premier buzzer
    if (isManager && phase === 'AWAITING_VALIDATION' && firstBuzzer) {
      const currentKey = `${firstBuzzer.playerId}-${firstBuzzer.deltaMs}`;
      if (currentKey !== lastBuzzerKey.current) {
        lastBuzzerKey.current = currentKey;
        setVisible(true);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();

        // Disparaît automatiquement après 1.5 seconde
        const timer = setTimeout(() => {
          dismiss();
        }, 1500);

        return () => clearTimeout(timer);
      }
    } else if (phase !== 'AWAITING_VALIDATION') {
      lastBuzzerKey.current = null;
      setVisible(false);
    }
  }, [isManager, phase, firstBuzzer]);

  const dismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  if (!visible || !firstBuzzer || !isManager) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        opacity: fadeAnim,
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={dismiss}
        style={{
          flex: 1,
          backgroundColor: 'rgba(209, 74, 46, 0.94)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Hand size={46} color={palette.bad} />
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              color: '#FFFFFF',
              fontSize: 42,
              letterSpacing: 1,
            }}
          >
            BUZZ !
          </Text>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: 26,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            {firstBuzzer.playerName}
          </Text>

          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: 16,
              marginTop: 6,
              fontWeight: '600',
            }}
          >
            A buzzé en{' '}
            {firstBuzzer.deltaMs < 1000
              ? `${firstBuzzer.deltaMs}ms`
              : `${(firstBuzzer.deltaMs / 1000).toFixed(1)}s`}
          </Text>

          <View
            style={{
              marginTop: 28,
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: 12,
              }}
            >
              Touchez pour fermer ou patientez 1,5s
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
