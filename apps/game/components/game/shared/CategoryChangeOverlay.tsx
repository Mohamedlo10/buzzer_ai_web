import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { Layers } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { QuestionResponse } from '~/types/api';

interface CategoryChangeOverlayProps {
  currentQuestion: QuestionResponse | null;
}

export function CategoryChangeOverlay({ currentQuestion }: CategoryChangeOverlayProps) {
  const [show, setShow] = useState(false);
  const prevCategoryRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentQuestion?.category) return;
    const prev = prevCategoryRef.current;
    prevCategoryRef.current = currentQuestion.category;
    if (prev === null || prev === currentQuestion.category) return;

    setShow(true);
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShow(false));
    }, 2500);
  }, [currentQuestion?.category]); // eslint-disable-line

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!show || !currentQuestion) return null;

  return (
    <Animated.View style={{ position: 'absolute', inset: 0, zIndex: 40, backgroundColor: 'rgba(26,20,16,0.92)', alignItems: 'center', justifyContent: 'center', opacity: opacityAnim }}>
      <Animated.View style={{ alignItems: 'center', paddingHorizontal: 24, transform: [{ scale: scaleAnim }] }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Layers size={40} color={palette.indigo} />
        </View>
        <Text style={{ fontFamily: font.nativeFamily.display, color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, paddingTop: 2 }}>
          Nouvelle catégorie
        </Text>
        <Text style={{ fontFamily: font.nativeFamily.display, color: '#FFFFFF', fontSize: 32, textAlign: 'center', paddingTop: 4 }}>
          {currentQuestion.category}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
