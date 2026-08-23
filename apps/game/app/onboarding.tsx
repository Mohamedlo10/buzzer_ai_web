import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Users, Trophy, Brain, Target, ArrowRight, ChevronRight, Crown, Sparkles } from 'lucide-react-native';
import { appStorage } from '~/lib/utils/storage';
import { palette } from '~/lib/theme/tokens';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Xalaat',
    subtitle: 'Quiz Multijoueur en Temps Réel',
    description:
      'Affrontez vos amis sur des questions générées par intelligence artificielle. Le plus rapide buzz et gagne !',
    icon: <Zap size={56} color={palette.primary} strokeWidth={2} />,
    accentColor: palette.primary,
    accentBg: 'rgba(224, 86, 36, 0.125)',
  },
  {
    id: '2',
    title: 'Créez ou Rejoignez',
    subtitle: 'Parties Instantanées',
    description:
      'Créez une session avec un code à 6 chiffres ou rejoignez une partie existante en quelques secondes.',
    icon: <Users size={56} color={palette.bad} strokeWidth={2} />,
    accentColor: palette.bad,
    accentBg: 'rgba(231, 76, 60, 0.125)',
  },
  {
    id: '3',
    title: 'Buzz !',
    subtitle: 'Soyez le Premier',
    description:
      "Appuyez sur le buzzer pour répondre en premier. Le système de file gère l'ordre des réponses.",
    icon: <Target size={56} color={palette.gold} strokeWidth={2} />,
    accentColor: palette.gold,
    accentBg: 'rgba(217, 119, 6, 0.125)',
  },
  {
    id: '4',
    title: 'Questions IA',
    subtitle: 'Catégories Illimitées',
    description:
      "Histoire, Science, Sport, Culture Pop... L'IA génère des questions uniques à chaque partie.",
    icon: <Brain size={56} color={palette.indigo} strokeWidth={2} />,
    accentColor: palette.indigo,
    accentBg: 'rgba(78, 140, 255, 0.125)',
  },
  {
    id: '5',
    title: 'Système de Dettes',
    subtitle: 'Qui Doit Quoi à Qui ?',
    description:
      'À la fin de chaque partie, découvrez qui vous doit des points et qui vous en doit par catégorie !',
    icon: <Trophy size={56} color={palette.violet} strokeWidth={2} />,
    accentColor: palette.violet,
    accentBg: 'rgba(155, 89, 182, 0.125)',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const goTo = async (path: string) => {
    await appStorage.setOnboardingDone();
    router.replace(path as any);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      goTo('/(tabs)/rooms');
    }
  };

  const currentSlide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 flex-col justify-between p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-accent/15 flex-row items-center justify-center border border-line">
              <Sparkles size={16} color={palette.primary} />
            </View>
            <Text className="text-txt font-bold text-lg font-display">Xalaat</Text>
          </View>

          <TouchableOpacity
            onPress={() => goTo('/(tabs)/rooms')}
            activeOpacity={0.7}
            className="px-3 py-1.5 rounded-full bg-surface border border-line"
          >
            <Text className="text-txt-60 text-xs font-semibold">Passer</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Card Hero */}
        <View className="flex-col items-center my-auto py-6">
          <View
            className="w-32 h-32 rounded-3xl flex-col items-center justify-center mb-8 border border-line shadow-sm"
            style={{ backgroundColor: currentSlide.accentBg }}
          >
            {currentSlide.icon}
          </View>

          <Text className="text-txt-40 text-xs font-bold uppercase tracking-widest mb-2">
            {currentSlide.subtitle}
          </Text>

          <Text className="text-txt font-bold text-3xl text-center mb-4 font-display">
            {currentSlide.title}
          </Text>

          <Text className="text-txt-60 text-base text-center leading-relaxed max-w-xs">
            {currentSlide.description}
          </Text>
        </View>

        {/* Bottom Pagination & CTAs */}
        <View className="flex-col gap-6">
          {/* Dots Indicator */}
          <View className="flex-row items-center justify-center gap-2">
            {slides.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex ? 'w-8 bg-host' : 'w-2 bg-line'
                }`}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View className="flex-col gap-3">
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              className="w-full py-4 rounded-2xl bg-host flex-row items-center justify-center shadow-md"
            >
              <Text className="text-primary-ink font-bold text-lg mr-2">
                {isLast ? 'Commencer' : 'Continuer'}
              </Text>
              <ArrowRight size={20} color={palette.primaryInk} />
            </TouchableOpacity>

            {isLast && (
              <TouchableOpacity
                onPress={() => goTo('/(auth)/login')}
                activeOpacity={0.7}
                className="w-full py-3.5 rounded-2xl bg-surface border border-line flex-row items-center justify-center"
              >
                <Text className="text-txt font-bold text-base">
                  Déjà un compte ? Se connecter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
