'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Dumbbell, ChevronRight, Gamepad2 } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';

export default function SoloHubPage() {
  const router = useRouter();

  return (
    <SafeScreen className="bg-bg">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-8 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 animate-[pop_0.4s_both]">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center text-accent mb-4 shadow-glow-success">
            <Gamepad2 size={36} />
          </div>
          <h1 className="text-txt font-display font-bold text-3xl tracking-tight">Mode Solo</h1>
          <p className="text-txt-60 text-sm mt-2 max-w-xs leading-relaxed">
            Défiez l'IA, progressez à votre rythme et testez vos connaissances sans stress.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="flex flex-col gap-4 flex-1 justify-center max-w-sm mx-auto w-full">
          
          {/* Card: Career Mode */}
          <button
            onClick={() => router.push('/solo/career')}
            className="group relative overflow-hidden bg-surface border border-line rounded-3xl p-5 flex flex-row items-center justify-between hover:border-accent/40 active:scale-[0.99] transition-all duration-150 text-left shadow-soft cursor-pointer animate-[rise_0.4s_both]"
          >
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-energy/10 to-transparent pointer-events-none" />
            <div className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-energy/15 flex items-center justify-center text-energy shrink-0">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-txt font-bold text-[17px] tracking-tight">Mode Carrière</h2>
                <p className="text-txt-60 text-xs mt-1 max-w-[200px] leading-normal">
                  Progressez à travers 12 niveaux de difficulté croissante par thème.
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-txt-40 group-hover:text-txt transition-colors shrink-0 ml-2" />
          </button>

          {/* Card: Training Mode */}
          <button
            onClick={() => router.push('/solo/training')}
            className="group relative overflow-hidden bg-surface border border-line rounded-3xl p-5 flex flex-row items-center justify-between hover:border-accent/40 active:scale-[0.99] transition-all duration-150 text-left shadow-soft cursor-pointer animate-[rise_0.5s_both]"
          >
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
            <div className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <Dumbbell size={24} />
              </div>
              <div>
                <h2 className="text-txt font-bold text-[17px] tracking-tight">Entraînement</h2>
                <p className="text-txt-60 text-xs mt-1 max-w-[200px] leading-normal">
                  Générez un thème sur-mesure grâce à l'IA ou jouez aux sets prédéfinis.
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-txt-40 group-hover:text-txt transition-colors shrink-0 ml-2" />
          </button>

        </div>

        {/* Bottom spacing for TabBar */}
        <div className="h-12" />
      </div>
    </SafeScreen>
  );
}
