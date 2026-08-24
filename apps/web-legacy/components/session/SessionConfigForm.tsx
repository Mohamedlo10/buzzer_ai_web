'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft, X } from 'lucide-react';
import type { SessionResponse } from '~/types/api';
import { StepBar } from './StepBar';
import { StepGameMode } from './StepGameMode';
import { StepSettings } from './StepSettings';
import { StepTeams } from './StepTeams';
import { StepSummary } from './StepSummary';
import { useSessionConfig } from '~/lib/hooks/useSessionConfig';

interface SessionConfigFormProps {
  onSuccess?: (sessionId: string, code: string, session?: SessionResponse) => void;
  onClose?: () => void;
  roomId?: string;
  initialMaxPlayers?: number;
}

export function SessionConfigForm({ onSuccess, onClose, roomId, initialMaxPlayers }: SessionConfigFormProps) {
  const router = useRouter();

  // Body scroll lock effect on mobile
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const {
    currentStep,
    totalSteps,
    getStepName,
    questionMode,
    sessionMode,
    setSessionMode,
    globalQuestionSeconds,
    setGlobalQuestionSeconds,
    setAnswerTimeSeconds,
    answerChoicesCount,
    setAnswerChoicesCount,
    teams,
    setTeams,
    config,
    setConfig,
    error,
    isCreating,
    handleModeChange,
    handleNext,
    handleBack,
    handleQuickStart,
    handleCreate,
  } = useSessionConfig({
    onSuccess,
    onNavigate: (route) => router.push(route),
    roomId,
    initialMaxPlayers,
  });

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepGameMode
            handleQuickStart={handleQuickStart}
            isCreating={isCreating}
            sessionMode={sessionMode}
            setSessionMode={setSessionMode}
            questionMode={questionMode}
            handleModeChange={handleModeChange}
            config={config}
            setConfig={setConfig}
          />
        );
      case 1:
        return (
          <StepSettings
            sessionMode={sessionMode}
            questionMode={questionMode}
            globalQuestionSeconds={globalQuestionSeconds}
            setGlobalQuestionSeconds={setGlobalQuestionSeconds}
            setAnswerTimeSeconds={setAnswerTimeSeconds}
            answerChoicesCount={answerChoicesCount}
            setAnswerChoicesCount={setAnswerChoicesCount}
            config={config}
            setConfig={setConfig}
          />
        );
      case 2:
        return config.isTeamMode ? (
          <StepTeams teams={teams} setTeams={setTeams} />
        ) : (
          <StepSummary
            sessionMode={sessionMode}
            questionMode={questionMode}
            globalQuestionSeconds={globalQuestionSeconds}
            answerChoicesCount={answerChoicesCount}
            config={config}
            teams={teams}
            error={error}
          />
        );
      case 3:
        return (
          <StepSummary
            sessionMode={sessionMode}
            questionMode={questionMode}
            globalQuestionSeconds={globalQuestionSeconds}
            answerChoicesCount={answerChoicesCount}
            config={config}
            teams={teams}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  const getFooterButtonLabel = () => {
    if (isLastStep) {
      return isCreating ? 'Création...' : 'Créer la session';
    }
    if (currentStep === 0) {
      return 'Régler les paramètres';
    }
    if (currentStep === 1) {
      return config.isTeamMode ? 'Configurer les équipes' : 'Voir le récapitulatif';
    }
    if (currentStep === 2) {
      return 'Voir le récapitulatif';
    }
    return 'Suivant';
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-bg text-txt overflow-hidden relative">
      {/* Sticky Header */}
      <div className="bg-bg/85 backdrop-blur-md pt-5 pb-3 px-4 border-b border-line sticky top-0 z-10 flex flex-col gap-3 shrink-0">
        <div className="flex flex-row items-center justify-between">
          <button
            type="button"
            onClick={isFirstStep ? (onClose || (() => router.back())) : handleBack}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors shrink-0"
          >
            {isFirstStep ? <X size={20} className="text-txt" /> : <ArrowLeft size={20} className="text-txt" />}
          </button>

          <div className="flex-1 text-center px-2">
            <h1 className="text-txt font-bold text-base leading-tight">Créer une session</h1>
            <p className="text-txt-40 text-xs mt-0.5 font-medium leading-none">
              {getStepName()} · Étape {currentStep + 1}/{totalSteps}
            </p>
          </div>

          <div className="w-10 flex justify-end">
            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 rounded-full bg-accent hover:bg-accent-d transition-colors flex items-center justify-center shrink-0 shadow-sm"
              >
                <span className="text-btn-fg text-xs font-bold whitespace-nowrap">Suivant</span>
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>
        </div>

        {/* Step progress bar */}
        <StepBar step={currentStep + 1} total={totalSteps} />
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-12 overscroll-contain touch-pan-y flex flex-col gap-6">
        {renderStepContent()}
      </div>

      {/* Fixed Footer */}
      <div className="bg-bg border-t border-line px-4 py-4 shrink-0 flex gap-3 items-center z-20">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="w-12 h-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center hover:bg-surface-3 active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft size={20} className="text-txt" />
          </button>
        )}

        <button
          type="button"
          onClick={isLastStep ? handleCreate : handleNext}
          disabled={isLastStep ? (isCreating || (config.isTeamMode && teams.length < 2)) : false}
          className={`flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isLastStep
            ? isCreating
              ? 'bg-surface-2 cursor-not-allowed'
              : (config.isTeamMode && teams.length < 2)
                ? 'bg-surface-2 opacity-50 cursor-not-allowed text-txt-40'
                : 'bg-gradient-to-br from-accent to-accent-d shadow-[0_4px_20px_rgb(var(--primary-rgb)_/_0.25)] hover:opacity-95'
            : 'bg-gradient-to-br from-accent to-accent-d shadow-[0_4px_20px_rgb(var(--primary-rgb)_/_0.25)] hover:opacity-95'
            }`}
        >
          {isLastStep ? (
            isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-txt-40 border-t-txt rounded-full animate-spin" />
                <span className="text-txt font-bold text-base">Création...</span>
              </>
            ) : (
              <>
                <Zap size={20} className="text-btn-fg fill-current" />
                <span className="text-btn-fg font-bold text-base">{getFooterButtonLabel()}</span>
              </>
            )
          ) : (
            <>
              <span className="text-btn-fg font-bold text-base">
                {getFooterButtonLabel()}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
