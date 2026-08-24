import { useState, useEffect, useCallback } from 'react';
import { useBuzzStore } from '~/stores/useBuzzStore';
import type { CreateSessionRequest, QuestionMode, SessionMode, TeamRequest } from '~/types/api';

const DEFAULT_TEAMS: TeamRequest[] = [
  { name: 'Rouge', color: 'red' },
  { name: 'Bleu', color: 'blue' },
];

export interface UseSessionConfigOptions {
  onSuccess?: (sessionId: string, code: string) => void;
  onNavigateToLobby?: (code: string) => void;
  roomId?: string;
  initialMaxPlayers?: number;
}

export function useSessionConfig(options: UseSessionConfigOptions = {}) {
  const { onSuccess, onNavigateToLobby, roomId } = options;

  const [currentStep, setCurrentStep] = useState(0);
  const [questionMode, setQuestionMode] = useState<QuestionMode>('AI');
  const [sessionMode, setSessionMode] = useState<SessionMode>('WITHOUT_MODERATOR');
  const [answerTimeSeconds, setAnswerTimeSeconds] = useState(15);
  const [globalQuestionSeconds, setGlobalQuestionSeconds] = useState(15);
  const [answerChoicesCount, setAnswerChoicesCount] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamRequest[]>(DEFAULT_TEAMS);
  const [config, setConfig] = useState<CreateSessionRequest>({
    debtAmount: 1,
    pointsPerCorrectAnswer: 5,
    questionsPerCategory: 5,
    maxPlayers: 20,
    isPrivate: false,
    isTeamMode: false,
    maxCategoriesPerPlayer: 3,
    buzzCountdownSeconds: 15,
    roomId,
    questionMode: 'AI',
  });

  const [error, setError] = useState<string | null>(null);
  const createSession = useBuzzStore((state) => state.createSession);
  const isCreating = useBuzzStore((state) => state.isCreating);

  const totalSteps = config.isTeamMode ? 4 : 3;

  // Sync back current step index if total steps collapses and user is out of bounds
  useEffect(() => {
    if (currentStep >= totalSteps) {
      setCurrentStep(totalSteps - 1);
    }
  }, [totalSteps, currentStep]);

  const handleModeChange = useCallback((mode: QuestionMode) => {
    setQuestionMode(mode);
    setConfig((c) => ({ ...c, questionMode: mode }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const getStepName = useCallback(() => {
    if (currentStep === 0) return 'Mode de jeu';
    if (currentStep === 1) return 'Réglages';
    if (currentStep === 2) {
      return config.isTeamMode ? 'Équipes' : 'Récapitulatif';
    }
    return 'Récapitulatif';
  }, [currentStep, config.isTeamMode]);

  const handleQuickStart = useCallback(async () => {
    setError(null);
    try {
      const withoutModeratorExtras = sessionMode === 'WITHOUT_MODERATOR'
        ? { answerTimeSeconds, globalQuestionSeconds, answerChoicesCount }
        : {};
      const quickConfig: CreateSessionRequest = {
        ...config,
        sessionMode,
        questionMode: 'AI',
        buzzCountdownSeconds: 10,
        questionsPerCategory: 5,
        pointsPerCorrectAnswer: 5,
        ...withoutModeratorExtras,
      };
      const result = await createSession(quickConfig);

      if (onSuccess) {
        onSuccess(result.sessionId, result.code);
      } else if (onNavigateToLobby) {
        onNavigateToLobby(result.code);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création rapide.');
    }
  }, [sessionMode, answerTimeSeconds, globalQuestionSeconds, answerChoicesCount, config, createSession, onSuccess, onNavigateToLobby]);

  const handleCreate = useCallback(async () => {
    setError(null);

    if (config.isTeamMode && teams.length < 2) {
      setError('Minimum 2 équipes requises en mode équipe.');
      return;
    }

    try {
      const withoutModeratorExtras = sessionMode === 'WITHOUT_MODERATOR'
        ? { answerTimeSeconds, globalQuestionSeconds, answerChoicesCount }
        : {};
      const finalConfig = config.isTeamMode
        ? { ...config, sessionMode, ...withoutModeratorExtras, teams }
        : { ...config, sessionMode, ...withoutModeratorExtras };
      const result = await createSession(finalConfig);

      if (onSuccess) {
        onSuccess(result.sessionId, result.code);
      } else if (onNavigateToLobby) {
        onNavigateToLobby(result.code);
      }
    } catch (err: any) {
      let errorMessage = 'Erreur lors de la création';

      if (err?.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (err?.response?.status === 403) {
        errorMessage = 'Accès refusé. Vérifiez votre authentification.';
      } else if (err?.response?.status >= 500) {
        errorMessage = 'Erreur serveur. Réessayez plus tard.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (!err?.response) {
        errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
      }

      setError(errorMessage);
    }
  }, [config, teams, sessionMode, answerTimeSeconds, globalQuestionSeconds, answerChoicesCount, createSession, onSuccess, onNavigateToLobby]);

  return {
    currentStep,
    setCurrentStep,
    totalSteps,
    getStepName,
    questionMode,
    setQuestionMode,
    sessionMode,
    setSessionMode,
    answerTimeSeconds,
    setAnswerTimeSeconds,
    globalQuestionSeconds,
    setGlobalQuestionSeconds,
    answerChoicesCount,
    setAnswerChoicesCount,
    teams,
    setTeams,
    config,
    setConfig,
    error,
    setError,
    isCreating,
    handleModeChange,
    handleNext,
    handleBack,
    handleQuickStart,
    handleCreate,
  };
}
