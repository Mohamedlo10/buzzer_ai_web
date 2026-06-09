'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trophy, ArrowLeft, Lock, Play, CheckCircle, AlertCircle, X } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import * as soloApi from '~/lib/api/solo';
import { useSoloStore } from '~/stores/useSoloStore';
import type { SoloCareerProgressResponse, LevelInfo } from '~/types/solo';

export default function CareerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const careerId = params.careerId as string;
  const startNewSession = useSoloStore((s) => s.startNewSession);

  const [career, setCareer] = useState<SoloCareerProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<LevelInfo | null>(null);
  const [isStartingLevel, setIsStartingLevel] = useState(false);

  useEffect(() => {
    const fetchCareerDetail = async () => {
      try {
        const data = await soloApi.getCareer(careerId);
        setCareer(data);
      } catch (error) {
        console.error('Failed to fetch career details', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCareerDetail();
  }, [careerId]);

  const handleStartLevel = async (levelNumber: number) => {
    setIsStartingLevel(true);
    try {
      const startData = await soloApi.startLevel(careerId, levelNumber);
      startNewSession(startData);
      setSelectedLevel(null);
      router.push(`/solo/game/${startData.sessionId}`);
    } catch (error) {
      console.error('Failed to start level', error);
      alert('Erreur lors du lancement du niveau. Veuillez réessayer.');
    } finally {
      setIsStartingLevel(false);
    }
  };

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center">
        <Spinner size="large" text="Chargement de votre carrière..." />
      </SafeScreen>
    );
  }

  if (!career) {
    return (
      <SafeScreen className="bg-bg">
        <div className="flex flex-col flex-1 items-center justify-center text-center px-4">
          <AlertCircle size={40} className="text-buzz mb-4" />
          <h2 className="text-txt font-bold text-lg">Carrière introuvable</h2>
          <button
            onClick={() => router.push('/solo/career')}
            className="mt-4 px-6 py-2.5 bg-surface border border-line text-txt rounded-xl font-bold text-sm cursor-pointer"
          >
            Retour aux carrières
          </button>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-bg">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-8 overflow-y-auto relative">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-3.5 mb-6">
          <button
            onClick={() => router.push('/solo/career')}
            className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center text-txt transition-colors border border-line cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-txt font-display font-bold text-xl tracking-tight truncate">
              {career.category}
            </h1>
            <p className="text-txt-60 text-xs mt-0.5">Score total : <strong className="text-accent">{career.totalScore} pts</strong></p>
          </div>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-3 gap-3.5 max-w-md mx-auto w-full mb-8 animate-[rise_0.4s_both]">
          {career.levels.map((level) => {
            const isLocked = level.status === 'LOCKED';
            const isCompleted = level.status === 'COMPLETED';
            const isCurrent = level.status === 'UNLOCKED' || level.status === 'IN_PROGRESS';

            return (
              <button
                key={level.levelNumber}
                disabled={isLocked}
                onClick={() => setSelectedLevel(level)}
                className={`aspect-square rounded-[22px] border flex flex-col items-center justify-center relative p-3 transition-all duration-150 active:scale-[0.96] ${
                  isCompleted
                    ? 'bg-accent/10 border-accent text-accent shadow-glow-success hover:bg-accent/18'
                    : isCurrent
                    ? 'bg-surface border-warn text-warn shadow-soft hover:bg-surface-2'
                    : 'bg-surface-2/40 border-line text-txt-25 cursor-not-allowed opacity-50'
                }`}
              >
                {/* Level number */}
                <span className="font-display font-bold text-2xl">{level.levelNumber}</span>
                
                {/* Status indicator */}
                <div className="mt-1">
                  {isLocked && <Lock size={12} />}
                  {isCurrent && <Play size={12} className="fill-current" />}
                  {isCompleted && <CheckCircle size={12} />}
                </div>

                {/* Score or Difficulty micro text */}
                <span className="text-[9px] font-semibold tracking-wider uppercase mt-1.5 opacity-80">
                  {isCompleted ? `${level.bestScore} pts` : level.difficulty}
                </span>
              </button>
            );
          })}
        </div>

        {/* Info card on current state */}
        <div className="bg-surface/60 border border-line rounded-3xl p-4 max-w-md mx-auto w-full animate-[rise_0.5s_both]">
          <p className="text-txt-60 text-xs text-center leading-relaxed">
            Cliquez sur un niveau débloqué pour en voir les détails et le lancer.
            <br />
            Complétez les niveaux dans l'ordre pour déverrouiller la suite.
          </p>
        </div>

        {/* Level Action Bottom Sheet Modal */}
        {selectedLevel && (
          <div
            className="fixed inset-0 z-50 bg-scrim/80 flex items-end justify-center animate-scrimin"
            onClick={() => setSelectedLevel(null)}
          >
            <div
              className="w-full max-w-[360px] bg-surface border-t border-line rounded-t-3xl overflow-hidden animate-sheetup px-[18px] pt-[18px] pb-[calc(18px+env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex flex-row items-center justify-between pb-3.5 border-b border-line mb-4">
                <div>
                  <h3 className="text-txt font-display font-bold text-lg">
                    Niveau {selectedLevel.levelNumber}
                  </h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                    selectedLevel.status === 'COMPLETED' ? 'bg-accent/15 text-accent' : 'bg-warn/15 text-warn'
                  }`}>
                    {selectedLevel.status === 'COMPLETED' ? 'Complété' : 'Disponible'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLevel(null)}
                  className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-txt-60 hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Level Details */}
              <div className="space-y-3.5 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-txt-60">Difficulté</span>
                  <span className="text-txt font-semibold">{selectedLevel.difficulty}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-txt-60">Seuil de validation</span>
                  <span className="text-accent font-semibold">{selectedLevel.threshold}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-txt-60">Tentatives effectuées</span>
                  <span className="text-txt font-semibold">{selectedLevel.attempts}</span>
                </div>
                {selectedLevel.status === 'COMPLETED' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-txt-60">Meilleur score</span>
                    <span className="text-energy font-bold">⚡ {selectedLevel.bestScore} pts</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {selectedLevel.status === 'COMPLETED' ? (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-3.5 text-center text-accent font-semibold text-xs leading-relaxed">
                  Ce niveau est déjà validé. Progressez vers les niveaux suivants pour continuer la carrière !
                </div>
              ) : (
                <button
                  onClick={() => handleStartLevel(selectedLevel.levelNumber)}
                  disabled={isStartingLevel}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-d text-btn-fg font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isStartingLevel ? (
                    <Spinner text="Lancement..." />
                  ) : (
                    <>
                      <Play size={16} className="fill-current" />
                      Commencer le niveau
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom spacing for TabBar */}
        <div className="h-12" />
      </div>
    </SafeScreen>
  );
}
