'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appStorage } from '~/lib/utils/storage';
import {
  Zap,
  Users,
  Trophy,
  Brain,
  Target,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { XalaatMark } from '~/components/ui/XalaatMark';

/**
 * L'onboarding est un écran « splash » volontairement sombre dans les deux
 * thèmes : c'est la première impression de marque. Les couleurs y sont donc
 * fixes (nuances Saaru) plutôt que liées aux tokens de surface, et les
 * accents sont désignés par leur *canal* RGB pour pouvoir en dériver des
 * halos translucides.
 */
type AccentToken = 'primary' | 'gold' | 'bad' | 'indigo' | 'violet';

const NIGHT_INK = '#F1E5C9';
const NIGHT_INK_SOFT = 'rgba(241,229,201,0.68)';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: [AccentToken, AccentToken];
  accent: AccentToken;
}

const col = (t: AccentToken) => `rgb(var(--${t}-rgb))`;
const colA = (t: AccentToken, a: number) => `rgb(var(--${t}-rgb) / ${a})`;

const slides: Slide[] = [
  {
    id: '1',
    title: 'Xalaat',
    subtitle: 'Quiz Multijoueur en Temps Réel',
    description:
      'Affrontez vos amis sur des questions générées par intelligence artificielle. Le plus rapide buzz et gagne !',
    icon: <Zap size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['primary', 'bad'],
    accent: 'primary',
  },
  {
    id: '2',
    title: 'Créez ou Rejoignez',
    subtitle: 'Parties Instantanées',
    description:
      'Créez une session avec un code à 6 chiffres ou rejoignez une partie existante en quelques secondes.',
    icon: <Users size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['bad', 'primary'],
    accent: 'bad',
  },
  {
    id: '3',
    title: 'Buzz !',
    subtitle: 'Soyez le Premier',
    description:
      "Appuyez sur le buzzer pour répondre en premier. Le système de file gère l'ordre des réponses.",
    icon: <Target size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['primary', 'gold'],
    accent: 'primary',
  },
  {
    id: '4',
    title: 'Questions IA',
    subtitle: 'Catégories Illimitées',
    description:
      "Histoire, Science, Sport, Culture Pop... L'IA génère des questions uniques à chaque partie.",
    icon: <Brain size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['gold', 'bad'],
    accent: 'gold',
  },
  {
    id: '5',
    title: 'Système de Dettes',
    subtitle: 'Qui Doit Quoi à Qui ?',
    description:
      'À la fin de chaque partie, découvrez qui vous doit des points et qui vous en doit par catégorie !',
    icon: <Trophy size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['bad', 'gold'],
    accent: 'bad',
  },
];

export default function OnboardingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const goTo = async (path: string) => {
    await appStorage.setOnboardingDone();
    router.push(path);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentSlide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  return (
    // `data-theme="dark"` rebascule les tokens sur leur variante nuit pour ce
    // sous-arbre : les accents y prennent leurs valeurs éclaircies, lisibles
    // sur le fond sombre, même quand l'app est en thème clair.
    <div
      data-theme="dark"
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #241B14, #1A1410)', color: NIGHT_INK }}
    >
      {/* Logo Header — marque + signature MouhaDev */}
      <div className="pt-10 flex flex-col items-center gap-1.5">
        <div className="flex flex-row items-center gap-2">
          <XalaatMark size={24} color="var(--gold-bright)" accent="var(--primary)" />
          <span className="font-display text-2xl font-bold tracking-[-0.02em]">Xalaat</span>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'rgb(var(--gold-bright-rgb) / 0.9)' }}
        >
          Quiz by MouhaDev
        </span>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div
          key={currentIndex}
          className="flex flex-col items-center justify-center w-full max-w-md"
          style={{ animation: 'fadeInUp 0.35s ease both' }}
        >
          {/* Icon */}
          <div
            className="mb-8 overflow-hidden flex items-center justify-center"
            style={{
              width: 180,
              height: 180,
              borderRadius: 40,
              boxShadow: `0 0 30px 0 ${colA(currentSlide.accent, 0.5)}`,
              background: `linear-gradient(135deg, ${col(currentSlide.gradient[0])}, ${col(currentSlide.gradient[1])})`,
              flexShrink: 0,
            }}
          >
            {currentSlide.icon}
          </div>

          <h2 className="font-display text-4xl font-bold text-center mb-2 tracking-[-0.02em]">
            {currentSlide.title}
          </h2>

          <p
            className="text-center mb-6 text-lg font-semibold"
            style={{ color: col(currentSlide.accent) }}
          >
            {currentSlide.subtitle}
          </p>

          <p className="text-center text-lg leading-7 px-4" style={{ color: NIGHT_INK_SOFT }}>
            {currentSlide.description}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="pb-12 px-8">
        {/* Dots + next arrow */}
        <div className="flex flex-row justify-center items-center mb-8 gap-3">
          {slides.map((slide, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              style={{
                width: index === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  index === currentIndex
                    ? col(slide.accent)
                    : 'rgba(241,229,201,0.3)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
          {!isLast && (
            <button
              type="button"
              onClick={handleNext}
              className="ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(241,229,201,0.12)' }}
            >
              <ChevronRight size={16} color={NIGHT_INK_SOFT} />
            </button>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col max-w-md mx-auto gap-3">
          {/* S'inscrire — primary */}
          <button
            type="button"
            onClick={() => goTo('/register')}
            className="w-full flex flex-row items-center justify-center py-4 rounded-2xl transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              backgroundColor: col(currentSlide.accent),
              boxShadow: `0 0 20px ${colA(currentSlide.accent, 0.5)}`,
              color: currentSlide.accent === 'gold' ? '#1A1410' : NIGHT_INK,
            }}
          >
            <span className="font-bold text-lg mr-2">S&apos;inscrire</span>
            <ArrowRight size={20} />
          </button>

          {/* Se connecter — secondary */}
          <button
            type="button"
            onClick={() => goTo('/login')}
            className="w-full flex flex-row items-center justify-center py-4 rounded-2xl transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              backgroundColor: 'rgba(241,229,201,0.08)',
              border: '1px solid rgba(241,229,201,0.18)',
            }}
          >
            <span className="font-semibold text-lg">Se connecter</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
