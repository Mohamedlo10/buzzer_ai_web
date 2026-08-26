import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Sparkles, Trophy, Target, Swords, ArrowRight } from 'lucide-react-native';
import { appStorage } from '~/lib/utils/storage';
import { palette, font } from '~/lib/theme/tokens';
import { XalaatMark } from '~/components/shared/XalaatMark';

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
    title: 'Questions IA Infinies',
    subtitle: 'Génération à la Volée',
    description:
      "Le quiz qui ne s'épuise jamais ! L'intelligence artificielle crée des questions uniques sur n'importe quel thème et niveau de difficulté.",
    icon: <Sparkles size={56} color={palette.primary} strokeWidth={2} />,
    accentColor: palette.primary,
    accentBg: 'rgba(224, 86, 36, 0.125)',
  },
  {
    id: '2',
    title: 'Buzzer Multijoueur',
    subtitle: 'En Direct & Sans Matériel',
    description:
      'Rejoignez en un éclair avec un code ou QR code. Buzzez en temps réel depuis votre téléphone avec un système de file ultrarapide.',
    icon: <Zap size={56} color={palette.gold} strokeWidth={2} />,
    accentColor: palette.gold,
    accentBg: 'rgba(217, 119, 6, 0.125)',
  },
  {
    id: '3',
    title: 'Sprint ou Modéré',
    subtitle: 'Deux Expériences de Jeu',
    description:
      'Sprint à 10s où tout le monde répond en simultané, ou partie animée avec modérateur pour rythmer et valider les réponses.',
    icon: <Swords size={56} color={palette.bad} strokeWidth={2} />,
    accentColor: palette.bad,
    accentBg: 'rgba(231, 76, 60, 0.125)',
  },
  {
    id: '4',
    title: 'Mode Solo & Carrière',
    subtitle: '12 Niveaux & Entraînement',
    description:
      'Progressez de Facile à Extrême dans le mode Carrière avec bonus et pénalités, ou entraînez-vous librement sur vos thèmes favoris.',
    icon: <Target size={56} color={palette.indigo} strokeWidth={2} />,
    accentColor: palette.indigo,
    accentBg: 'rgba(78, 140, 255, 0.125)',
  },
  {
    id: '5',
    title: 'Classement Glicko-2',
    subtitle: 'Compétition & Progression',
    description:
      'Grimpez dans le classement mondial inspiré du système des échecs, défiez vos amis et suivez vos statistiques détaillées.',
    icon: <Trophy size={56} color={palette.violet} strokeWidth={2} />,
    accentColor: palette.violet,
    accentBg: 'rgba(155, 89, 182, 0.125)',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<Slide>>(null);

  const goTo = async (path: string) => {
    await appStorage.setOnboardingDone();
    router.replace(path as any);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index >= 0 && index < slides.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const scrollToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollToSlide(currentIndex + 1);
    } else {
      goTo('/(tabs)/rooms');
    }
  };

  const isLast = currentIndex === slides.length - 1;

  const renderSlideItem = ({ item }: { item: Slide }) => (
    <View
      style={{
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          backgroundColor: item.accentBg,
          borderWidth: 1,
          borderColor: palette.line,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {item.icon}
      </View>

      <Text
        style={{
          fontFamily: font.nativeFamily.serif,
          fontStyle: 'italic',
          fontSize: 16,
          color: palette.primary,
          marginBottom: 6,
        }}
      >
        {item.subtitle}
      </Text>

      <Text
        style={{
          fontFamily: font.nativeFamily.display,
          fontSize: 28,
          lineHeight: 40,
          color: palette.txt,
          textAlign: 'center',
          paddingTop: 4,
          marginBottom: 12,
        }}
      >
        {item.title}
      </Text>

      <Text
        style={{
          fontSize: 14.5,
          color: palette.inkSoft,
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 300,
        }}
      >
        {item.description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XalaatMark size={18} color={palette.primaryInk} accent={palette.gold} />
            </View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 18,
                lineHeight: 24,
                color: palette.txt,
                paddingTop: 2,
              }}
            >
              Xalaat
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => goTo('/(tabs)/rooms')}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '600' }}>Passer</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Swipeable Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlideItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleScroll}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          contentContainerStyle={{ alignItems: 'center' }}
          style={{ flexGrow: 1 }}
        />

        {/* Bottom Pagination & CTAs */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }} className="flex-col gap-6">
          {/* Dots Indicator */}
          <View className="flex-row items-center justify-center gap-2">
            {slides.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => scrollToSlide(i)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
              >
                <View
                  className={`h-2 rounded-full transition-all ${i === currentIndex ? 'w-8 bg-host' : 'w-2 bg-line'
                    }`}
                />
              </TouchableOpacity>
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
