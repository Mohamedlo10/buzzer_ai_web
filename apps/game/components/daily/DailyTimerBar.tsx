/**
 * DailyTimerBar
 *
 * Règle absolue : la barre est PUREMENT VISUELLE.
 * - Elle anime depuis `remainingMs` fourni par le serveur.
 * - À l'expiration, elle appelle `onExpire()` pour que l'écran envoie
 *   selectedIndex: null — le serveur tranche.
 * - Le temps restant est recalculé depuis un horodatage absolu (deadlineRef)
 *   et non par décrémentation, parce que setInterval s'arrête en arrière-plan
 *   sur iOS. À chaque retour en active, on lit Date.now() et on recompute.
 */
import { useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated } from 'react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { palette, font } from '~/lib/theme/tokens';

interface DailyTimerBarProps {
  /** Temps restant initial fourni par le serveur (ms). */
  remainingMs: number;
  /** Durée totale de la question (ms), pour calculer le ratio initial. */
  totalMs: number;
  /** Appelé quand la barre atteint zéro. */
  onExpire: () => void;
}

export function DailyTimerBar({ remainingMs, totalMs, onExpire }: DailyTimerBarProps) {
  const progressAnim = useRef(new Animated.Value(remainingMs / totalMs)).current;
  const deadlineRef = useRef<number>(Date.now() + remainingMs);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const startAnimation = useCallback((currentRemaining: number) => {
    animRef.current?.stop();
    animRef.current = Animated.timing(progressAnim, {
      toValue: 0,
      duration: currentRemaining,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    });
  }, [progressAnim]);

  useEffect(() => {
    deadlineRef.current = Date.now() + remainingMs;
    expiredRef.current = false;
    progressAnim.setValue(remainingMs / totalMs);
    startAnimation(remainingMs);

    // Règle §3 : recalcule depuis horodatage absolu au retour de l'arrière-plan.
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        const left = Math.max(0, deadlineRef.current - Date.now());
        progressAnim.setValue(left / totalMs);
        if (left <= 0) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current();
          }
        } else {
          startAnimation(left);
        }
      } else {
        animRef.current?.stop();
      }
    });

    return () => {
      animRef.current?.stop();
      sub.remove();
    };
  }, [remainingMs, totalMs, startAnimation, progressAnim]);

  // Couleur de la barre : verte → orange → rouge selon le temps restant.
  const barColor = progressAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 1],
    outputRange: [palette.bad, palette.warn, palette.warn, palette.good],
    extrapolate: 'clamp',
  });

  const secondsLeft = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));

  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: palette.bgDeep,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 3,
            backgroundColor: barColor,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: font.nativeFamily.ui,
          fontSize: 11,
          color: palette.inkSoft,
          textAlign: 'right',
        }}
      >
        {secondsLeft}s
      </Text>
    </View>
  );
}
