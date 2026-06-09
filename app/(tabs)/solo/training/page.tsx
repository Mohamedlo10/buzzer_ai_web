'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, ArrowLeft, Brain, Users, ChevronRight } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import * as soloApi from '~/lib/api/solo';
import type { SoloTrainingPlanResponse } from '~/types/solo';

export default function TrainingHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'custom' | 'predefined'>('custom');
  const [customPlans, setCustomPlans] = useState<SoloTrainingPlanResponse[]>([]);
  const [predefinedPlans, setPredefinedPlans] = useState<SoloTrainingPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customData, predefinedData] = await Promise.all([
          soloApi.listCustomTrainings(),
          soloApi.listPredefinedTrainings(),
        ]);
        setCustomPlans(customData);
        setPredefinedPlans(predefinedData);
      } catch (error) {
        console.error('Failed to fetch training plans', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center">
        <Spinner size="large" text="Chargement des plans..." />
      </SafeScreen>
    );
  }

  const currentPlans = activeTab === 'custom' ? customPlans : predefinedPlans;

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
          <h1 className="text-txt font-display font-bold text-2xl tracking-tight">Entraînement</h1>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-surface-2/40 border border-line rounded-[18px] p-1 mb-5">
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-surface text-txt shadow-soft'
                : 'text-txt-40 hover:text-txt-60'
            }`}
          >
            <Brain size={16} />
            Mes plans (IA)
          </button>
          <button
            onClick={() => setActiveTab('predefined')}
            className={`flex-1 py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'predefined'
                ? 'bg-surface text-txt shadow-soft'
                : 'text-txt-40 hover:text-txt-60'
            }`}
          >
            <Users size={16} />
            Communauté
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'custom' && (
          <button
            onClick={() => router.push('/solo/training/custom/new')}
            className="w-full relative overflow-hidden bg-surface border border-line rounded-2xl p-4 flex flex-row items-center justify-between hover:border-accent/40 active:scale-[0.99] transition-all duration-150 cursor-pointer text-left mb-4 shadow-soft"
          >
            <div className="flex flex-row items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-txt font-bold text-[15px] tracking-tight">Générer un entraînement IA</h3>
                <p className="text-txt-60 text-xs mt-0.5">Choisissez n'importe quel thème et laissez l'IA créer vos questions.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-txt-40 shrink-0 ml-2" />
          </button>
        )}

        {currentPlans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto py-10 animate-[pop_0.4s_both]">
            <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-3 text-2xl">
              🏋️
            </div>
            <h2 className="text-txt font-bold text-base">Aucun plan disponible</h2>
            <p className="text-txt-60 text-xs mt-1.5 leading-relaxed">
              {activeTab === 'custom'
                ? 'Générez votre premier plan personnalisé pour commencer à vous entraîner.'
                : 'Aucun entraînement prédéfini n\'est disponible pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentPlans.map((plan) => (
              <button
                key={plan.planId}
                onClick={() => router.push(`/solo/training/${plan.planId}`)}
                className="w-full relative overflow-hidden bg-surface border border-line rounded-2xl p-4 hover:border-accent/40 transition-all duration-150 text-left shadow-soft cursor-pointer active:scale-[0.99] animate-[rise_0.4s_both]"
              >
                <div className="flex flex-row items-center justify-between">
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-surface-2 text-txt-60 mb-2 border border-line">
                      {plan.parentDifficulty}
                    </span>
                    <h3 className="text-txt font-bold text-base tracking-tight truncate">
                      {plan.theme}
                    </h3>
                    <p className="text-txt-40 text-xs mt-1 leading-normal">
                      {plan.planType === 'CUSTOM' ? 'Entraînement IA personnalisé' : 'Entraînement communautaire prédéfini'}
                    </p>
                    {plan.planType === 'PREDEFINED' && (
                      <div className="mt-2 text-[11px] text-accent font-semibold flex items-center gap-1.5">
                        <span>👍 {plan.voteCount} votes</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-txt-40 shrink-0 ml-2" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Bottom spacing for TabBar */}
        <div className="h-12" />
      </div>
    </SafeScreen>
  );
}
