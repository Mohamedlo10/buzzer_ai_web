'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Dumbbell, ArrowLeft, Play, CheckCircle, HelpCircle, ThumbsUp } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import * as soloApi from '~/lib/api/solo';
import { useSoloStore } from '~/stores/useSoloStore';
import type { SoloTrainingPlanResponse } from '~/types/solo';

export default function TrainingPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;
  const startNewSession = useSoloStore((s) => s.startNewSession);

  const [plan, setPlan] = useState<SoloTrainingPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingLevel, setIsStartingLevel] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const fetchPlanDetail = async () => {
    try {
      const data = await soloApi.getTrainingPlan(planId);
      setPlan(data);
    } catch (error) {
      console.error('Failed to fetch training plan details', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanDetail();
  }, [planId]);

  const handleStartLevel = async (subLevel: number) => {
    setIsStartingLevel(subLevel);
    try {
      const startData = await soloApi.startTrainingLevel(planId, subLevel);
      startNewSession(startData);
      router.push(`/solo/game/${startData.sessionId}`);
    } catch (error) {
      console.error('Failed to start training level', error);
      alert('Une erreur est survenue lors du lancement du niveau d\'entraînement.');
    } finally {
      setIsStartingLevel(null);
    }
  };

  const handleVote = async () => {
    if (!plan || plan.hasVoted) return;

    setIsVoting(true);
    try {
      const voteData = await soloApi.voteRegeneration(planId);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              voteCount: voteData.voteCount,
              votesNeeded: voteData.votesNeeded,
              hasVoted: true,
            }
          : null
      );
      if (voteData.regenerationTriggered) {
        alert('Régénération déclenchée ! Le plan d\'entraînement a été mis à jour avec de nouvelles questions.');
        setIsLoading(true);
        await fetchPlanDetail();
      } else {
        alert('Votre vote a été pris en compte !');
      }
    } catch (error: any) {
      console.error('Failed to vote', error);
      alert(error?.response?.data?.message || 'Vous avez déjà voté pour la régénération de ce plan.');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center">
        <Spinner size="large" text="Chargement de l'entraînement..." />
      </SafeScreen>
    );
  }

  if (!plan) {
    return (
      <SafeScreen className="bg-bg">
        <div className="flex flex-col flex-1 items-center justify-center text-center px-4">
          <HelpCircle size={40} className="text-buzz mb-4" />
          <h2 className="text-txt font-bold text-lg">Entraînement introuvable</h2>
          <button
            onClick={() => router.push('/solo/training')}
            className="mt-4 px-6 py-2.5 bg-surface border border-line text-txt rounded-xl font-bold text-sm cursor-pointer"
          >
            Retour aux entraînements
          </button>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-bg">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-8 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-3.5 mb-6">
          <button
            onClick={() => router.push('/solo/training')}
            className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center text-txt transition-colors border border-line cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-txt font-display font-bold text-xl tracking-tight truncate">
              {plan.theme}
            </h1>
            <p className="text-txt-60 text-xs mt-0.5">Difficulté globale : <strong className="text-accent">{plan.parentDifficulty}</strong></p>
          </div>
        </div>

        {/* Levels List */}
        <div className="flex flex-col gap-4 mb-6 animate-[rise_0.4s_both]">
          {plan.levels.map((level) => {
            const isCompleted = level.userStatus === 'COMPLETED';
            const isInProgress = level.userStatus === 'IN_PROGRESS';
            
            return (
              <div
                key={level.subLevel}
                className="bg-surface border border-line rounded-2xl p-4 flex flex-row items-center justify-between shadow-soft"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[15px] text-txt">Sous-niveau {level.subLevel}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                      isCompleted ? 'bg-accent/15 text-accent border border-accent/10' :
                      isInProgress ? 'bg-warn/15 text-warn border border-warn/10' :
                      'bg-surface-2 text-txt-40 border border-line'
                    }`}>
                      {isCompleted ? 'Complété' : isInProgress ? 'En cours' : 'Non commencé'}
                    </span>
                  </div>
                  <p className="text-txt-60 text-xs font-semibold capitalize">{level.subDifficulty.replace('_', ' ').toLowerCase()}</p>
                  <p className="text-txt-40 text-xs mt-2">{level.questionCount} questions</p>
                </div>

                <button
                  onClick={() => handleStartLevel(level.subLevel)}
                  disabled={isStartingLevel !== null}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-d text-btn-fg font-bold text-sm flex items-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isStartingLevel === level.subLevel ? (
                    <Spinner size="small" />
                  ) : (
                    <>
                      {isCompleted ? <CheckCircle size={15} /> : <Play size={15} className="fill-current" />}
                      {isCompleted ? 'Rejouer' : 'Démarrer'}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Regeneration Vote (Only for PREDEFINED plans) */}
        {plan.planType === 'PREDEFINED' && (
          <div className="bg-surface-2/30 border border-line rounded-3xl p-5 animate-[rise_0.5s_both]">
            <h3 className="text-txt font-bold text-sm flex items-center gap-2">
              <ThumbsUp size={16} className="text-accent" />
              Régénération communautaire
            </h3>
            <p className="text-txt-60 text-xs mt-2 leading-relaxed">
              Toutes les sessions de cet entraînement sont terminées ? Vous pouvez voter pour régénérer le set de questions. Dès que le seuil de votes est atteint, l'IA génère de toutes nouvelles questions !
            </p>
            
            <div className="mt-4 flex flex-row items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-txt-40 text-[10px] uppercase font-bold tracking-wider">Votes actuels</span>
                <span className="text-txt font-semibold text-sm mt-0.5">{plan.voteCount} / {plan.votesNeeded}</span>
              </div>
              
              <button
                onClick={handleVote}
                disabled={isVoting || plan.hasVoted}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  plan.hasVoted
                    ? 'bg-surface border border-line text-txt-40 cursor-default'
                    : 'bg-accent/15 border border-accent/20 text-accent hover:bg-accent/25 active:scale-[0.98]'
                }`}
              >
                {isVoting ? (
                  <Spinner size="small" />
                ) : plan.hasVoted ? (
                  'Déjà voté'
                ) : (
                  <>
                    <ThumbsUp size={12} className="fill-current" />
                    Voter
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Bottom spacing for TabBar */}
        <div className="h-12" />
      </div>
    </SafeScreen>
  );
}
