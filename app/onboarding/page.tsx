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
  Sparkles,
} from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: [string, string];
  accentColor: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'BuzzMaster AI',
    subtitle: 'Quiz Multijoueur en Temps Réel',
    description:
      'Affrontez vos amis sur des questions générées par intelligence artificielle. Le plus rapide buzz et gagne !',
    icon: <Zap size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['#00D397', '#D5442F'],
    accentColor: '#00D397',
  },
  {
    id: '2',
    title: 'Créez ou Rejoignez',
    subtitle: 'Parties Instantanées',
    description:
      'Créez une session avec un code à 6 chiffres ou rejoignez une partie existante en quelques secondes.',
    icon: <Users size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['#D5442F', '#00D397'],
    accentColor: '#D5442F',
  },
  {
    id: '3',
    title: 'Buzz !',
    subtitle: 'Soyez le Premier',
    description:
      "Appuyez sur le buzzer pour répondre en premier. Le système de file gère l'ordre des réponses.",
    icon: <Target size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['#00D397', '#FFD700'],
    accentColor: '#00D397',
  },
  {
    id: '4',
    title: 'Questions IA',
    subtitle: 'Catégories Illimitées',
    description:
      "Histoire, Science, Sport, Culture Pop... L'IA génère des questions uniques à chaque partie.",
    icon: <Brain size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['#FFD700', '#D5442F'],
    accentColor: '#FFD700',
  },
  {
    id: '5',
    title: 'Système de Dettes',
    subtitle: 'Qui Doit Quoi à Qui ?',
    description:
      'À la fin de chaque partie, découvrez qui vous doit des points et qui vous en doit par catégorie !',
    icon: <Trophy size={80} color="#FFFFFF" strokeWidth={1.5} />,
    gradient: ['#D5442F', '#FFD700'],
    accentColor: '#D5442F',
  },
];

export default function OnboardingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const goToLogin = async () => {
    await appStorage.setOnboardingDone();
    router.push('/login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      goToLogin();
    }
  };

  const handleSkip = () => {
    goToLogin();
  };

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #292349, #1a1633)' }}
    >
      {/* Skip Button */}
      <div className="absolute top-8 right-6 z-10">
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-2 rounded-full backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span className="text-white/80 font-medium text-sm">Passer</span>
        </button>
      </div>

      {/* Logo Header */}
      <div className="absolute top-8 left-0 right-0 flex justify-center z-0">
        <div className="flex flex-row items-center">
          <Sparkles size={20} color="#FFD700" />
          <span
            className="text-white text-xl font-bold ml-2"
            style={{ textShadow: '1px 1px 10px rgba(213,68,47,0.5)' }}
          >
            BuzzMaster
          </span>
        </div>
      </div>

      {/* Slides Carousel — CSS-based, no scroll */}
      <div className="flex-1 flex flex-col items-center justify-center mt-20 mb-4 px-8">
        {/* Slide content with smooth transition */}
        <div
          key={currentIndex}
          className="flex flex-col items-center justify-center w-full max-w-md"
          style={{
            animation: 'fadeInUp 0.35s ease both',
          }}
        >
          {/* Icon Container with Gradient */}
          <div
            className="mb-8 overflow-hidden flex items-center justify-center"
            style={{
              width: 180,
              height: 180,
              borderRadius: 40,
              boxShadow: `0 0 30px 0 ${currentSlide.accentColor}80`,
              background: `linear-gradient(135deg, ${currentSlide.gradient[0]}, ${currentSlide.gradient[1]})`,
              flexShrink: 0,
            }}
          >
            {currentSlide.icon}
          </div>

          {/* Title */}
          <h2
            className="text-white text-4xl font-bold text-center mb-2"
            style={{
              textShadow: `0 0 20px ${currentSlide.accentColor}`,
            }}
          >
            {currentSlide.title}
          </h2>

          {/* Subtitle */}
          <p
            className="text-center mb-6 text-lg font-semibold"
            style={{ color: currentSlide.accentColor }}
          >
            {currentSlide.subtitle}
          </p>

          {/* Description */}
          <p className="text-white/70 text-center text-lg leading-7 px-4">
            {currentSlide.description}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pb-12 px-8">
        {/* Pagination Dots */}
        <div className="flex flex-row justify-center items-center mb-8 gap-2">
          {slides.map((slide, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              style={{
                width: index === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentIndex ? slide.accentColor : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Next / Get Started Button */}
        <div className="flex flex-col max-w-md mx-auto">
          <button
            type="button"
            onClick={handleNext}
            className="w-full flex flex-row items-center justify-center py-4 rounded-2xl"
            style={{
              backgroundColor: currentSlide.accentColor,
              boxShadow: `0 0 20px ${currentSlide.accentColor}80`,
            }}
          >
            <span className="text-white font-bold text-lg mr-2">
              {currentIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
            </span>
            <ArrowRight size={20} color="#FFFFFF" />
          </button>

          {/* Login Link — shown on last slide */}
          {currentIndex === slides.length - 1 && (
            <button
              type="button"
              onClick={goToLogin}
              className="mt-6 flex justify-center"
            >
              <span className="text-white/60 text-base">
                Déjà un compte ?{' '}
                <span className="text-[#00D397] font-semibold">Se connecter</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Keyframe animation injected via style tag */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
