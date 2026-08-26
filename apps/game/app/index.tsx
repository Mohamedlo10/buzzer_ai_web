import { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '~/stores/useAuthStore';
import { appStorage } from '~/lib/utils/storage';
import { palette, font } from '~/lib/theme/tokens';
import { XalaatMark } from '~/components/shared/XalaatMark';

const FADE_IN_DURATION = 600;
const FADE_OUT_DURATION = 350;

export default function SplashScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const dotScale1 = useRef(new Animated.Value(0.6)).current;
  const dotScale2 = useRef(new Animated.Value(0.6)).current;
  const dotScale3 = useRef(new Animated.Value(0.6)).current;

  // Read onboarding flag once on mount
  useEffect(() => {
    appStorage.isOnboardingDone().then(setOnboardingDone);
  }, []);

  // Entrance animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: FADE_IN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered dot pulse animation
    const pulseAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.spring(dot, { toValue: 1, tension: 120, friction: 5, useNativeDriver: true }),
          Animated.spring(dot, { toValue: 0.6, tension: 80, friction: 8, useNativeDriver: true }),
        ]),
      );

    pulseAnim(dotScale1, 0).start();
    pulseAnim(dotScale2, 150).start();
    pulseAnim(dotScale3, 300).start();
  }, []);

  // Trigger redirect when both session and onboarding are resolved
  useEffect(() => {
    if (isLoading || onboardingDone === null) return;

    const destination = !onboardingDone
      ? '/onboarding'
      : isAuthenticated
        ? '/(tabs)/rooms'
        : '/(auth)/login';

    // Fade out screen, then navigate
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: FADE_OUT_DURATION,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      router.replace(destination as any);
    });
  }, [isAuthenticated, isLoading, onboardingDone]);

  return (
    <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          {/* Logo block */}
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                shadowColor: palette.primary,
                shadowOpacity: 0.35,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <XalaatMark size={42} color={palette.primaryInk} accent={palette.gold} />
            </View>

            {/* Brand name */}
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 36,
                lineHeight: 44,
                color: palette.txt,
                letterSpacing: -0.5,
                marginBottom: 6,
              }}
            >
              Xalaat
            </Text>

            {/* Tagline */}
            <Text
              style={{
                fontFamily: font.nativeFamily.serif,
                fontStyle: 'italic',
                fontSize: 15,
                color: palette.inkSoft,
                textAlign: 'center',
                marginBottom: 48,
              }}
            >
              Le quiz qui ne s'épuise jamais.
            </Text>

            {/* Dot loading indicator */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {[dotScale1, dotScale2, dotScale3].map((dot, i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: palette.primary,
                    transform: [{ scale: dot }],
                    opacity: dot,
                  }}
                />
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Bottom version label */}
        <Animated.View
          style={{
            paddingBottom: 24,
            alignItems: 'center',
            opacity: logoOpacity,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: palette.inkSoft,
              fontWeight: '500',
              letterSpacing: 0.5,
              opacity: 0.5,
            }}
          >
            XALAAT · BETA
          </Text>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}
