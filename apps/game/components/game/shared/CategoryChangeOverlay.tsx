import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { Layers } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
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
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          Nouvelle catégorie
        </Text>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 32, textAlign: 'center' }}>
          {currentQuestion.category}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
