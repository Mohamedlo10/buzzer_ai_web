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
import {
  Zap,
  Sparkles,
  Trophy,
  Target,
  ArrowRight,
  Timer,
  Mic,
  Flame,
  Award,
  Clock,
  Users,
  Radio,
  Crown,
  Smartphone,
  TrendingUp,
  Gem,
  BookmarkCheck,
  Brain,
  Palette as PaletteIcon,
  Lightbulb,
} from 'lucide-react-native';
import { appStorage } from '~/lib/utils/storage';
import { palette, font } from '~/lib/theme/tokens';
import { XalaatMark } from '~/components/shared/XalaatMark';

interface FeatureItem {
  text: string;
  icon: React.ReactNode;
}

interface Slide {
  id: string;
  badge: string;
  badgeIcon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  features: FeatureItem[];
}

const slides: Slide[] = [
  {
    id: '1',
    badge: 'MODE MULTIJOUEUR',
    badgeIcon: <Flame size={13} color={palette.bad} />,
    title: 'Mode Sprint',
    subtitle: 'Sans Modérateur · 100% Autonome',
    description:
      'Chacun pour soi ! Tous les joueurs répondent en direct et en simultané à chaque question avant la fin du compte à rebours.',
    icon: <Timer size={54} color={palette.bad} strokeWidth={2.2} />,
    accentColor: palette.bad,
    accentBg: 'rgba(231, 76, 60, 0.12)',
    features: [
      { text: 'Timer 10 secondes', icon: <Clock size={14} color={palette.gold} strokeWidth={2.5} /> },
      { text: 'Réponses simultanées', icon: <Users size={14} color={palette.violet} strokeWidth={2.5} /> },
      { text: 'Révélation instantanée', icon: <Sparkles size={14} color={palette.gold} strokeWidth={2.5} /> },
    ],
  },
  {
    id: '2',
    badge: 'MODE ANIMÉ',
    badgeIcon: <Mic size={13} color={palette.primary} />,
    title: 'Mode Modérateur',
    subtitle: 'Buzzer en Direct & Maître du Jeu',
    description:
      'Un animateur pilote la partie et arbitre. Soyez le plus rapide à buzzer pour prendre la main et valider vos points.',
    icon: <Zap size={54} color={palette.primary} strokeWidth={2.2} />,
    accentColor: palette.primary,
    accentBg: 'rgba(224, 86, 36, 0.12)',
    features: [
      { text: 'File de buzz en temps réel', icon: <Radio size={14} color={palette.gold} strokeWidth={2.5} /> },
      { text: 'Contrôle de l’animateur', icon: <Crown size={14} color={palette.violet} strokeWidth={2.5} /> },
      { text: 'Sans aucun boîtier physique', icon: <Smartphone size={14} color={palette.gold} strokeWidth={2.5} /> },
    ],
  },
  {
    id: '3',
    badge: 'MODE SOLO',
    badgeIcon: <Target size={13} color={palette.indigo} />,
    title: 'Mode Carrière',
    subtitle: '12 Niveaux Évolutifs',
    description:
      'Progressez en solitaire de Facile à Extrême. Relevez les défis, accumulez les bonus et évitez les pièges pour débloquer les paliers.',
    icon: <Target size={54} color={palette.indigo} strokeWidth={2.2} />,
    accentColor: palette.indigo,
    accentBg: 'rgba(78, 140, 255, 0.12)',
    features: [
      { text: '12 paliers de difficulté', icon: <TrendingUp size={14} color={palette.violet} strokeWidth={2.5} /> },
      { text: 'Système de bonus/malus', icon: <Gem size={14} color={palette.gold} strokeWidth={2.5} /> },
      { text: 'Progression sauvegardée', icon: <BookmarkCheck size={14} color={palette.violet} strokeWidth={2.5} /> },
    ],
  },
  {
    id: '4',
    badge: 'MODE LIBRE',
    badgeIcon: <Sparkles size={13} color={palette.gold} />,
    title: 'Entraînement IA',
    subtitle: 'Thèmes & Difficultés Sur-Mesure',
    description:
      'Créez une session sur n’importe quel sujet personnalisé : histoire, cinéma, tech, science. L’IA génère des questions à l’infini.',
    icon: <Sparkles size={54} color={palette.gold} strokeWidth={2.2} />,
    accentColor: palette.gold,
    accentBg: 'rgba(217, 119, 6, 0.12)',
    features: [
      { text: 'IA générative infinie', icon: <Brain size={14} color={palette.gold} strokeWidth={2.5} /> },
      { text: 'Thème 100% personnalisé', icon: <PaletteIcon size={14} color={palette.violet} strokeWidth={2.5} /> },
      { text: 'Feedback & explications', icon: <Lightbulb size={14} color={palette.gold} strokeWidth={2.5} /> },
    ],
  },
  {
    id: '5',
    badge: 'COMPÉTITION GLOBALE',
    badgeIcon: <Award size={13} color={palette.violet} />,
    title: 'Classement Glicko-2',
    subtitle: 'Rang Mondial & Statistiques',
    description:
      'Chaque victoire dans les modes officiels influe sur votre niveau mondial, calculé selon le système officiel des échecs.',
    icon: <Trophy size={54} color={palette.violet} strokeWidth={2.2} />,
    accentColor: palette.violet,
    accentBg: 'rgba(155, 89, 182, 0.12)',
    features: [
      { text: 'Algorithme Glicko-2', icon: <Award size={14} color={palette.violet} strokeWidth={2.5} /> },
      { text: 'Profils, avatars & amis', icon: <Users size={14} color={palette.gold} strokeWidth={2.5} /> },
      { text: 'Podium & historique', icon: <Trophy size={14} color={palette.violet} strokeWidth={2.5} /> },
    ],
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
      // Onboarding complete → send to login, not rooms (user is not yet authenticated)
      goTo('/(auth)/login');
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
      {/* Mode Badge Tag */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 9999,
          backgroundColor: item.accentBg,
          borderWidth: 1,
          borderColor: item.accentColor + '30',
          marginBottom: 16,
        }}
      >
        {item.badgeIcon}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.8,
            color: item.accentColor,
            textTransform: 'uppercase',
          }}
        >
          {item.badge}
        </Text>
      </View>

      {/* Main Mode Icon Hero */}
      <View
        style={{
          width: 110,
          height: 110,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
          backgroundColor: item.accentBg,
          borderWidth: 1,
          borderColor: palette.line,
          shadowColor: item.accentColor,
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        {item.icon}
      </View>

      {/* Subtitle / Mode type */}
      <Text
        style={{
          fontFamily: font.nativeFamily.serif,
          fontStyle: 'italic',
          fontSize: 15,
          color: item.accentColor,
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        {item.subtitle}
      </Text>

      {/* Mode Title */}
      <Text
        style={{
          fontFamily: font.nativeFamily.display,
          fontSize: 28,
          lineHeight: 45,
          color: palette.txt,
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        {item.title}
      </Text>

      {/* Description */}
      <Text
        style={{
          fontSize: 14,
          color: palette.inkSoft,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 320,
          marginBottom: 16,
        }}
      >
        {item.description}
      </Text>

      {/* Feature key points without background, styled with display font & colored icons */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          maxWidth: 340,
        }}
      >
        {item.features.map((feat, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {feat.icon}
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 11,
                lineHeight: 18,
                color: palette.txt,
                textAlign: 'center',
              }}
            >
              {feat.text}
            </Text>
          </View>
        ))}
      </View>
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
            onPress={() => goTo('/(auth)/login')}
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
