'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Plus, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import * as soloApi from '~/lib/api/solo';
import type { SoloCareerProgressResponse } from '~/types/solo';

export default function SoloCareersPage() {
  const router = useRouter();
  const [careers, setCareers] = useState<SoloCareerProgressResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAbandoning, setIsAbandoning] = useState<string | null>(null);

  const fetchCareers = async () => {
    try {
      const data = await soloApi.listCareers();
      setCareers(data);
    } catch (error) {
      console.error('Failed to fetch careers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const handleAbandon = async (careerId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Avoid navigating to career details
    if (!confirm('Êtes-vous sûr de vouloir abandonner cette carrière ? Tous vos progrès sur cette catégorie seront définitivement perdus.')) {
      return;
    }

    setIsAbandoning(careerId);
    try {
      await soloApi.abandonCareer(careerId);
      await fetchCareers();
    } catch (error) {
      console.error('Failed to abandon career', error);
      alert('Une erreur est survenue lors de l\'abandon de la carrière.');
    } finally {
      setIsAbandoning(null);
    }
  };

  const activeCareersCount = careers.filter(c => c.status === 'ACTIVE').length;
  const isMaxCareers = activeCareersCount >= 3;

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center">
        <Spinner size="large" text="Chargement des carrières..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-bg">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-8 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-3.5 mb-6">
          <button
            onClick={() => router.push('/solo')}
            className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center text-txt transition-colors border border-line cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-txt font-display font-bold text-2xl tracking-tight">Mes Carrières</h1>
        </div>

        {/* Info Banner on max careers */}
        {isMaxCareers && (
          <div className="mb-5 bg-warn/10 border border-warn/25 rounded-2xl p-4 flex flex-row gap-3 items-start animate-[rise_0.3s_both]">
            <AlertTriangle className="text-warn shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-warn font-semibold text-[13.5px]">Limite de carrières atteinte</p>
              <p className="text-txt-60 text-xs mt-0.5 leading-relaxed">
                Vous avez atteint la limite de 3 carrières actives simultanément. Abandonnez une carrière existante pour pouvoir en démarrer une nouvelle.
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {careers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto animate-[pop_0.4s_both]">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4 text-3xl">
              🏆
            </div>
            <h2 className="text-txt font-bold text-lg">Aucune carrière active</h2>
            <p className="text-txt-60 text-sm mt-1.5 leading-relaxed">
              Le mode carrière vous permet de gravir 12 niveaux de difficulté sur le thème de votre choix. Lancez-vous !
            </p>
            <button
              onClick={() => router.push('/solo/career/new')}
              className="mt-6 px-6 py-3.5 rounded-xl font-bold text-sm text-btn-fg flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #00D397, #00B383)' }}
            >
              <Plus size={16} />
              Créer une carrière
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {careers.map((career) => {
              const isCompleted = career.status === 'COMPLETED';
              
              return (
                <button
                  key={career.careerId}
                  onClick={() => router.push(`/solo/career/${career.careerId}`)}
                  className="w-full relative overflow-hidden bg-surface border border-line rounded-2xl p-4 hover:border-accent/40 transition-all duration-150 text-left shadow-soft cursor-pointer active:scale-[0.99] animate-[rise_0.4s_both]"
                >
                  <div className="flex flex-row items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      {/* Status badge */}
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase mb-2 ${
                        isCompleted ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-surface-2 text-txt-60'
                      }`}>
                        {isCompleted ? 'Complétée 🎉' : `Niveau ${career.currentLevel}/12`}
                      </span>
                      
                      <h3 className="text-txt font-bold text-lg tracking-tight truncate">
                        {career.category}
                      </h3>
                      
                      {/* Progress bar */}
                      <div className="mt-3.5 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${career.completionPercentage}%`,
                              background: isCompleted
                                ? 'linear-gradient(90deg, #00D397, #00B383)'
                                : 'linear-gradient(90deg, #FFD700, #F59E0B)'
                            }}
                          />
                        </div>
                        <span className="text-txt-60 font-semibold text-xs min-w-[32px] text-right">
                          {Math.round(career.completionPercentage)}%
                        </span>
                      </div>
                      
                      {/* Stats */}
                      <div className="mt-3 flex flex-row items-center gap-4 text-xs text-txt-40">
                        <span>Score total : <strong className="text-txt font-semibold">{career.totalScore} pts</strong></span>
                        {career.failureCount > 0 && (
                          <span>Échecs : <strong className="text-txt font-semibold">{career.failureCount}</strong></span>
                        )}
                      </div>
                    </div>

                    {/* Actions / Buttons */}
                    <div className="flex flex-col items-end gap-2 self-stretch justify-between shrink-0">
                      <button
                        onClick={(e) => handleAbandon(career.careerId, e)}
                        disabled={isAbandoning === career.careerId}
                        className="p-2.5 rounded-xl bg-buzz/10 text-buzz hover:bg-buzz/20 active:scale-[0.95] transition-all border border-buzz/10 cursor-pointer disabled:opacity-50"
                        title="Abandonner cette carrière"
                      >
                        {isAbandoning === career.careerId ? (
                          <span className="dotpulse !bg-buzz" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                      
                      <div className="px-3.5 py-1.5 rounded-lg bg-surface-2 text-txt font-semibold text-xs border border-line">
                        Voir
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Create Career Floating/Bottom Button if not max */}
            {!isMaxCareers && (
              <button
                onClick={() => router.push('/solo/career/new')}
                className="w-full border-2 border-dashed border-line rounded-2xl py-4 flex items-center justify-center gap-2 hover:border-accent/40 text-txt-60 hover:text-txt transition-colors cursor-pointer mt-2"
              >
                <Plus size={16} />
                <span className="font-semibold text-sm">Démarrer une autre carrière</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom spacing for TabBar */}
        <div className="h-12" />
      </div>
    </SafeScreen>
  );
}
