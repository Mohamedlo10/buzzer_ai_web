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
  ChevronRight,
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
    title: 'Quiz By Mouha_Dev',
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
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #292349, #1a1633)' }}
    >
      {/* Logo Header */}
      <div className="pt-10 flex justify-center">
        <div className="flex flex-row items-center">
          <Sparkles size={20} color="#FFD700" />
          <span
            className="text-white text-xl font-bold ml-2"
            style={{ textShadow: '1px 1px 10px rgba(213,68,47,0.5)' }}
          >
            Quiz By Mouha_Dev
          </span>
        </div>
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
              boxShadow: `0 0 30px 0 ${currentSlide.accentColor}80`,
              background: `linear-gradient(135deg, ${currentSlide.gradient[0]}, ${currentSlide.gradient[1]})`,
              flexShrink: 0,
            }}
          >
            {currentSlide.icon}
          </div>

          <h2
            className="text-white text-4xl font-bold text-center mb-2"
            style={{ textShadow: `0 0 20px ${currentSlide.accentColor}` }}
          >
            {currentSlide.title}
          </h2>

          <p
            className="text-center mb-6 text-lg font-semibold"
            style={{ color: currentSlide.accentColor }}
          >
            {currentSlide.subtitle}
          </p>

          <p className="text-white/70 text-center text-lg leading-7 px-4">
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
                    ? slide.accentColor
                    : 'rgba(255,255,255,0.3)',
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
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <ChevronRight size={16} color="#FFFFFF99" />
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
              backgroundColor: currentSlide.accentColor,
              boxShadow: `0 0 20px ${currentSlide.accentColor}80`,
            }}
          >
            <span className="text-white font-bold text-lg mr-2">S&apos;inscrire</span>
            <ArrowRight size={20} color="#FFFFFF" />
          </button>

          {/* Se connecter — secondary */}
          <button
            type="button"
            onClick={() => goTo('/login')}
            className="w-full flex flex-row items-center justify-center py-4 rounded-2xl transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <span className="text-white font-semibold text-lg">Se connecter</span>
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
