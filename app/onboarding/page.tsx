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
 * Splash d'accueil, en clair Teranga comme le reste de l'app.
 *
 * Les accents sont désignés par leur *canal* RGB (`--x-rgb`) et non par leur
 * valeur finale, ce qui permet d'en dériver des halos translucides sans
 * dupliquer la couleur.
 */
type AccentToken = 'primary' | 'gold' | 'bad' | 'indigo' | 'violet';

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

// L'or « encre » est trop sombre pour un aplat décoratif : sur les pavés et
// dégradés, on lui substitue l'or vif du design.
const fill = (t: AccentToken) => (t === 'gold' ? 'rgb(var(--gold-bright-rgb))' : col(t));
// Encre posée sur cet aplat : sombre sur l'or vif, crème sur le reste.
const onFill = (t: AccentToken) => (t === 'gold' ? '#1A1410' : 'var(--primary-ink)');

const slides: Slide[] = [
  {
    id: '1',
    title: 'Xalaat',
    subtitle: 'Quiz Multijoueur en Temps Réel',
    description:
      'Affrontez vos amis sur des questions générées par intelligence artificielle. Le plus rapide buzz et gagne !',
    icon: <Zap size={80} strokeWidth={1.5} />,
    gradient: ['primary', 'bad'],
    accent: 'primary',
  },
  {
    id: '2',
    title: 'Créez ou Rejoignez',
    subtitle: 'Parties Instantanées',
    description:
      'Créez une session avec un code à 6 chiffres ou rejoignez une partie existante en quelques secondes.',
    icon: <Users size={80} strokeWidth={1.5} />,
    gradient: ['bad', 'primary'],
    accent: 'bad',
  },
  {
    id: '3',
    title: 'Buzz !',
    subtitle: 'Soyez le Premier',
    description:
      "Appuyez sur le buzzer pour répondre en premier. Le système de file gère l'ordre des réponses.",
    icon: <Target size={80} strokeWidth={1.5} />,
    gradient: ['primary', 'gold'],
    accent: 'primary',
  },
  {
    id: '4',
    title: 'Questions IA',
    subtitle: 'Catégories Illimitées',
    description:
      "Histoire, Science, Sport, Culture Pop... L'IA génère des questions uniques à chaque partie.",
    icon: <Brain size={80} strokeWidth={1.5} />,
    gradient: ['gold', 'bad'],
    accent: 'gold',
  },
  {
    id: '5',
    title: 'Système de Dettes',
    subtitle: 'Qui Doit Quoi à Qui ?',
    description:
      'À la fin de chaque partie, découvrez qui vous doit des points et qui vous en doit par catégorie !',
    icon: <Trophy size={80} strokeWidth={1.5} />,
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
    <div
      className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden relative text-txt"
      style={{ background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)' }}
    >
      {/* Logo Header — marque + signature MouhaDev */}
      <div className="shrink-0 pt-6 pb-2 flex flex-col items-center gap-1">
        <div className="flex flex-row items-center gap-2">
          <XalaatMark size={22} />
          <span className="font-display text-xl font-bold tracking-[-0.02em]">Xalaat</span>
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--primary)' }}
        >
          Quiz by MouhaDev
        </span>
      </div>

      {/* Slide content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-6 py-2 flex flex-col items-center justify-center">
        <div
          key={currentIndex}
          className="flex flex-col items-center justify-center w-full max-w-md py-4"
          style={{ animation: 'fadeInUp 0.35s ease both' }}
        >
          {/* Icon */}
          <div
            className="mb-4 sm:mb-6 overflow-hidden flex items-center justify-center transition-all shrink-0"
            style={{
              width: 'min(150px, 20vh)',
              height: 'min(150px, 20vh)',
              borderRadius: 32,
              boxShadow: `0 14px 28px -10px ${colA(currentSlide.accent, 0.45)}`,
              background: `linear-gradient(135deg, ${fill(currentSlide.gradient[0])}, ${fill(currentSlide.gradient[1])})`,
              color: onFill(currentSlide.gradient[0]),
            }}
          >
            {currentSlide.icon}
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-1 tracking-[-0.02em]">
            {currentSlide.title}
          </h2>

          <p
            className="text-center mb-3 text-sm sm:text-base font-semibold"
            style={{ color: col(currentSlide.accent) }}
          >
            {currentSlide.subtitle}
          </p>

          <p className="text-txt-60 text-center text-sm sm:text-base leading-relaxed px-2">
            {currentSlide.description}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="shrink-0 px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-line/30 bg-bg/90 backdrop-blur-sm z-20">
        {/* Dots + next arrow */}
        <div className="flex flex-row justify-center items-center mb-3 gap-3">
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
                    : 'var(--txt-25)',
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
              className="ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)' }}
            >
              <ChevronRight size={16} color="var(--txt-60)" />
            </button>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col max-w-md mx-auto gap-2.5">
          {/* S'inscrire — primary */}
          <button
            type="button"
            onClick={() => goTo('/register')}
            className="w-full flex flex-row items-center justify-center py-3.5 rounded-2xl transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer"
            style={{
              backgroundColor: fill(currentSlide.accent),
              boxShadow: `0 10px 24px -8px ${colA(currentSlide.accent, 0.5)}`,
              color: onFill(currentSlide.accent),
            }}
          >
            <span className="font-bold text-base mr-2">S&apos;inscrire</span>
            <ArrowRight size={18} />
          </button>

          {/* Se connecter — secondary */}
          <button
            type="button"
            onClick={() => goTo('/login')}
            className="w-full flex flex-row items-center justify-center py-3.5 rounded-2xl transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
            }}
          >
            <span className="font-semibold text-base">Se connecter</span>
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
