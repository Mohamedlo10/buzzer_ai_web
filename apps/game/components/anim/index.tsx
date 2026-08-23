import React, { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

// ── 1. Pop Animation (scale 0.7 -> 1.05 -> 1, opacity 0 -> 1) ────────────────
export function PopView({ children, style, duration = 350, ...props }: ViewProps & { duration?: number }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: duration * 0.4 });
    scale.value = withSequence(
      withTiming(1.05, { duration: duration * 0.6, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 2. Rise Animation (translateY 14 -> 0, opacity 0 -> 1) ───────────────────
export function RiseView({ children, style, duration = 300, delay = 0, ...props }: ViewProps & { duration?: number; delay?: number }) {
  const translateY = useSharedValue(14);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 3. FadeIn Animation (opacity 0 -> 1) ─────────────────────────────────────
export function FadeInView({ children, style, duration = 250, delay = 0, ...props }: ViewProps & { duration?: number; delay?: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.ease) });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 4. Blink Animation (opacity 0.25 <-> 1.0) ────────────────────────────────
export function BlinkView({ children, style, duration = 1400, ...props }: ViewProps & { duration?: number }) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 5. Flash Animation (opacity 0.85 -> 0) ───────────────────────────────────
export function FlashView({ children, style, duration = 850, ...props }: ViewProps & { duration?: number }) {
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withTiming(0, { duration, easing: Easing.out(Easing.ease) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 6. GrowX Animation (scaleX 0 -> 1) ───────────────────────────────────────
export function GrowXView({ children, style, duration = 400, ...props }: ViewProps & { duration?: number }) {
  const scaleX = useSharedValue(0);

  useEffect(() => {
    scaleX.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 7. Shake Animation (horizontal oscillating shake) ────────────────────────
export function ShakeView({ children, style, trigger = 0, ...props }: ViewProps & { trigger?: number }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    translateX.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(-2, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 8. Float Animation (translateY 0 <-> -6) ─────────────────────────────────
export function FloatView({ children, style, duration = 2400, distance = 6, ...props }: ViewProps & { duration?: number; distance?: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-distance, { duration: duration / 2, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 9 & 10. Sheet Up / Down ──────────────────────────────────────────────────
export function SheetUpView({ children, style, duration = 320, ...props }: ViewProps & { duration?: number }) {
  return (
    <Animated.View
      entering={SlideInDown.duration(duration).easing(Easing.bezier(0.2, 0.8, 0.2, 1))}
      exiting={SlideOutDown.duration(240).easing(Easing.bezier(0.4, 0, 1, 1))}
      style={style}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

// ── 11 & 12. Scrim In / Out ──────────────────────────────────────────────────
export function ScrimView({ children, style, duration = 200, ...props }: ViewProps & { duration?: number }) {
  return (
    <Animated.View
      entering={FadeIn.duration(duration).easing(Easing.out(Easing.ease))}
      exiting={FadeOut.duration(duration).easing(Easing.in(Easing.ease))}
      style={style}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

// ── 13. Page Fade In (translateY 6 -> 0, opacity 0 -> 1) ─────────────────────
export function PageFadeInView({ children, style, duration = 220, ...props }: ViewProps & { duration?: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(duration).easing(Easing.bezier(0.16, 1, 0.3, 1))}
      style={style}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

// ── 14. Pulse Ring Animation (scale 1 -> 1.15, opacity 0.6 -> 0.2) ───────────
export function PulseRingView({ children, style, duration = 2000, ...props }: ViewProps & { duration?: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: duration / 2, easing: Easing.bezier(0.455, 0.03, 0.515, 0.955) }),
        withTiming(1, { duration: duration / 2, easing: Easing.bezier(0.455, 0.03, 0.515, 0.955) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: duration / 2, easing: Easing.bezier(0.455, 0.03, 0.515, 0.955) }),
        withTiming(0.6, { duration: duration / 2, easing: Easing.bezier(0.455, 0.03, 0.515, 0.955) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 15. Buzz Scale (press / trigger scale 1 -> 0.92 -> 1) ─────────────────────
export function BuzzScaleView({ children, style, trigger = 0, ...props }: ViewProps & { trigger?: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = withSequence(
      withTiming(0.92, { duration: 75, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// ── 16. Fade In Up (translateY 10 -> 0, opacity 0 -> 1) ──────────────────────
export function FadeInUpView({ children, style, duration = 300, delay = 0, ...props }: ViewProps & { duration?: number; delay?: number }) {
  return (
    <Animated.View
      entering={FadeInUp.duration(duration).delay(delay).easing(Easing.out(Easing.ease))}
      style={style}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

// ── 17. Scan Line (vertical scanning bar top -> bottom -> top) ───────────────
export function ScanLineView({ style, height = 2, duration = 2000 }: { style?: ViewProps['style']; height?: number; duration?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    top: `${progress.value * 90 + 5}%` as any,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          height,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ── Blinking cursor '|' for progressive question reveal ───────────────────────
export function BlinkingCursor({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450 }),
        withTiming(1, { duration: 450 }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{ color, fontSize: size, fontWeight: '300' }, animatedStyle]}>
      |
    </Animated.Text>
  );
}
