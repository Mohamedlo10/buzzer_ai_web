import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { Zap } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import Svg, { Path } from 'react-native-svg';

interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
  hasBuzzed?: boolean;
  queuePosition?: number | null;
  teamBuzzed?: boolean;
}

export function BuzzerButton({
  onBuzz,
  disabled = false,
  hasBuzzed = false,
  queuePosition = null,
  teamBuzzed = false,
}: BuzzerButtonProps) {
  const isActive = !disabled && !hasBuzzed && queuePosition === null;

  const size = 180;
  const color = palette.primary;
  const ink = palette.primaryInk;

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const haloScale1 = useRef(new Animated.Value(0.85)).current;
  const haloOpacity1 = useRef(new Animated.Value(0.3)).current;
  const haloScale2 = useRef(new Animated.Value(0.85)).current;
  const haloOpacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Pulse bouton
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.04, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // Halo 1
      const animateHalo1 = Animated.loop(
        Animated.parallel([
          Animated.timing(haloScale1, { toValue: 1.35, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(haloOpacity1, { toValue: 0, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      );

      // Halo 2 (décalé)
      const animateHalo2 = Animated.loop(
        Animated.parallel([
          Animated.timing(haloScale2, { toValue: 1.35, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(haloOpacity2, { toValue: 0.3, duration: 0, useNativeDriver: true }),
            Animated.timing(haloOpacity2, { toValue: 0, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ])
        ])
      );

      animateHalo1.start();
      setTimeout(() => animateHalo2.start(), 600);

      return () => {
        scaleAnim.stopAnimation();
        haloScale1.stopAnimation();
        haloOpacity1.stopAnimation();
        haloScale2.stopAnimation();
        haloOpacity2.stopAnimation();
      };
    }
  }, [isActive]); // eslint-disable-line

  // Web keyboard shortcut (SPACE)
  useEffect(() => {
    if (Platform.OS !== 'web' || !isActive) return;
    const handleKeyDown = (e: any) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault?.();
        onBuzz();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, onBuzz]);

  // ── Waiting in queue ──
  if (queuePosition !== null) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 280 }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: palette.line, opacity: 0.6, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={36} color={palette.inkSoft} strokeWidth={2} />
          <Text style={{ fontFamily: font.nativeFamily.display, color: palette.inkSoft, fontSize: 24, marginTop: 4, letterSpacing: 1 }}>#{queuePosition}</Text>
        </View>
        <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.inkSoft, marginTop: 16, fontSize: 14, fontWeight: '500' }}>En file d'attente</Text>
      </View>
    );
  }

  // ── Disabled state ──
  if (disabled) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 280 }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: palette.line, opacity: 0.6, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}>
          {teamBuzzed || hasBuzzed ? (
            <Text style={{ fontSize: 36, marginBottom: 4 }}>🔒</Text>
          ) : (
            <Zap size={44} color={palette.inkSoft} strokeWidth={2} />
          )}
          <Text style={{ fontFamily: font.nativeFamily.display, color: palette.inkSoft, fontSize: 18, marginTop: 8, letterSpacing: 1 }}>
            {teamBuzzed || hasBuzzed ? 'VERROUILLÉ' : 'BUZZ'}
          </Text>
        </View>
        <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.inkSoft, marginTop: 12, fontSize: 12, fontWeight: '600' }}>
          {teamBuzzed ? 'Votre équipe a déjà buzzé' : hasBuzzed ? 'Vous avez déjà buzzé' : 'Buzzer désactivé'}
        </Text>
      </View>
    );
  }

  // ── Active Buzzer ──
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 280 }}>
      <View style={{ width: size + 40, height: size + 40, alignItems: 'center', justifyContent: 'center' }}>
        {/* Halos */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size + 40, height: size + 40, borderRadius: (size + 40) / 2, backgroundColor: color, opacity: haloOpacity1, transform: [{ scale: haloScale1 }] }} />
        <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size + 40, height: size + 40, borderRadius: (size + 40) / 2, backgroundColor: color, opacity: haloOpacity2, transform: [{ scale: haloScale2 }] }} />
        {/* Outer ring fixed */}
        <View pointerEvents="none" style={{ position: 'absolute', width: size + 18, height: size + 18, borderRadius: (size + 18) / 2, backgroundColor: color, opacity: 0.22 }} />

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={onBuzz}
            delayPressIn={0}
            activeOpacity={0.7}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: color,
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.9,
              shadowRadius: 32,
              elevation: 10,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={size * 0.32} height={size * 0.32} viewBox="0 0 80 80" style={{ opacity: 0.85 }}>
                <Path d="M40 6 L74 40 L40 74 L6 40 Z" fill="none" stroke={ink} strokeOpacity="0.45" strokeWidth="2" />
                <Path d="M40 22 L58 40 L40 58 L22 40 Z" fill={ink} fillOpacity="0.95" />
              </Svg>
              <Text style={{ fontFamily: font.nativeFamily.display, color: ink, fontSize: size * 0.12, marginTop: 4, letterSpacing: 1 }}>BUZZER</Text>
              <View style={{ marginTop: 6, backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontFamily: font.nativeFamily.display, color: ink, fontSize: 10, letterSpacing: 1.2 }}>ESPACE</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, marginTop: 8, fontSize: 13 }}>Appuyer sur l'écran</Text>
    </View>
  );
}
