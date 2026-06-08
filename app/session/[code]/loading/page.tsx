'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sparkles, Zap, ArrowLeft, RefreshCw } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { useBuzzStore, useIsManager } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { cancelGeneration } from '~/lib/api/sessions';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import { appStorage } from '~/lib/utils/storage';
import type { GenerationProgressEvent } from '~/types/websocket';

export default function LoadingPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  // realProgress = valeur reçue du serveur (0 si rien reçu)
  const [realProgress, setRealProgress] = useState(0);
  // simulatedProgress monte doucement jusqu'à ~88% pour ne jamais rester à 0
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ce que l'UI affiche : le max entre simulation et réel, plafonné à 99 tant que pas complete
  const progress = isComplete ? 100 : Math.min(Math.max(simulatedProgress, realProgress), 99);

  const { session, fetchSession, leaveSession } = useBuzzStore();
  const explicitIsManager = useIsManager();
  const authUser = useAuthStore((s) => s.user);
  const isManager = explicitIsManager || (!!authUser && authUser.id === session?.managerId);
  const [isCancelling, setIsCancelling] = useState(false);

  // Simulation de progression : monte vers 88% avec décélération progressive
  useEffect(() => {
    if (isComplete) return;
    const CEILING = 88;
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= CEILING) return prev;
        // Plus on est proche du plafond, plus on ralentit
        const step = (CEILING - prev) * 0.018;
        return Math.min(prev + Math.max(step, 0.05), CEILING);
      });
    }, 300);
    return () => clearInterval(interval);
  }, [isComplete]);

  // WebSocket for progress updates
  const { isConnected } = useGameSocket(session?.id || null, {
    onEvent: (event) => {
      switch (event.type) {
        case 'generation_progress': {
          const e = event as GenerationProgressEvent;
          setCurrentQuestion(e.current);
          setTotalQuestions(e.total);
          setRealProgress(e.percentage);
          break;
        }
        case 'generation_complete':
          setRealProgress(100);
          setIsComplete(true);
          break;
        case 'generation_failed':
          if (!event.usingFallback) {
            setError('Échec de la génération des questions');
          } else {
            setError('Questions de secours activées');
          }
          break;
      }
    },
  });

  // Load session if not in store
  useEffect(() => {
    if (!code) return;
    if (session && session.code === code) return;

    if (session && session.code !== code) {
      leaveSession();
    }

    const loadSession = async () => {
      try {
        const activeSession = await appStorage.getActiveSession();
        if (activeSession?.sessionId) {
          await fetchSession(activeSession.sessionId);
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/');
      }
    };

    loadSession();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate based on session status
  useEffect(() => {
    if (!session?.status) return;

    if (session.status === 'PLAYING') {
      router.replace(`/session/${code}/game`);
    } else if (session.status === 'LOBBY') {
      router.replace(`/session/${code}/lobby`);
    } else if (session.status === 'RESULTS') {
      router.replace(`/session/${code}/results`);
    }
  }, [session?.status, code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adaptive polling
  useEffect(() => {
    if (!session?.id) return;

    const ms = isConnected ? 5000 : 1500;
    const interval = setInterval(() => {
      fetchSession(session.id);
    }, ms);

    return () => clearInterval(interval);
  }, [session?.id, fetchSession, isConnected]);

  return (
    <SafeScreen>
      <div className="flex flex-col flex-1 min-h-screen items-center justify-center px-7 text-center">
        {/* Large Percentage */}
        <div className="flex flex-col items-center mb-7">
          <p className="text-accent font-display text-7xl font-semibold leading-none">
            {Math.round(progress)}%
          </p>
          <p className="text-txt-60 text-[15px] mt-2">
            {isComplete
              ? 'Questions prêtes !'
              : error
              ? error
              : 'Génération en cours…'}
          </p>
        </div>

        {/* Progress Bar + runner */}
        <div className="w-full max-w-sm">
          <div className="h-11 bg-surface-2 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-400"
              style={{
                width: `${Math.max(progress, 3)}%`,
                background: 'linear-gradient(90deg, #00B383, #00D397)',
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-[15px] transition-all duration-400 shadow-sm"
              style={{ left: `calc(${Math.max(progress, 3)}% - 16px)` }}
            >
              🏃
            </div>
          </div>

          <div className="flex flex-row justify-between mt-2.5 text-xs">
            <span className="text-txt-60">
              {isComplete
                ? 'Terminé'
                : totalQuestions > 0
                ? `${currentQuestion} / ${totalQuestions}`
                : 'Préparation…'}
            </span>
            {isConnected ? (
              <span className="text-accent flex items-center gap-1.5">
                <span className="dotpulse" />
                Connecté
              </span>
            ) : (
              <span className="text-txt-40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-buzz" />
                Connexion…
              </span>
            )}
          </div>
        </div>

        {/* Status hint */}
        <div className="mt-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-accent/13 flex items-center justify-center mb-3">
            {isComplete ? (
              <Sparkles size={26} className="text-accent" />
            ) : (
              <Zap size={26} className="text-accent" />
            )}
          </div>
          <p className="text-txt-60 text-center text-sm max-w-xs leading-relaxed">
            {isComplete
              ? 'Toutes les questions sont générées !'
              : progress < 30
              ? "L'IA prépare vos questions personnalisées…"
              : progress < 60
              ? 'Encore un peu de patience…'
              : progress < 90
              ? 'Presque terminé !'
              : 'Dernières vérifications…'}
          </p>
        </div>

        {/* Rule explainer */}
        <div className="mt-7 w-full max-w-sm text-left">
          <div className="p-3.5 bg-surface rounded-2xl border border-line">
            <p className="text-txt font-bold text-[13.5px] mb-1">Règle du buzz anticipé</p>
            <p className="text-txt-60 text-[12.5px] leading-relaxed">
              Buzzer avant la fin de la lecture <strong className="text-txt font-semibold">et</strong> se tromper
              applique une pénalité de points.
            </p>

            <div className="mt-3 flex flex-col gap-1.5">
              <div className="p-2 rounded-[10px] bg-buzz/10 border border-buzz/25">
                <p className="text-buzz-h text-[11.5px] font-bold">Faux avec pénalité</p>
                <p className="text-txt-60 text-[11.5px]">Buzz trop tôt + mauvaise réponse → retrait de points.</p>
              </div>

              <div className="p-2 rounded-[10px] bg-accent/9 border border-accent/25">
                <p className="text-accent text-[11.5px] font-bold">Faux sans pénalité</p>
                <p className="text-txt-60 text-[11.5px]">
                  Mauvaise réponse après lecture complète → aucun retrait.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && !error.includes('secours') && (
          <div className="mt-8 w-full max-w-sm">
            <div className="p-4 bg-[#D5442F20] rounded-xl border border-[#D5442F40] mb-4">
              <p className="text-[#D5442F] text-center">{error}</p>
            </div>

            <div className="flex flex-row gap-3">
              <button
                onClick={() => router.replace(`/session/${code}/lobby`)}
                className="flex-1 flex flex-row items-center justify-center bg-surface-2 py-3.5 rounded-xl hover:bg-surface-2 transition-colors"
              >
                <ArrowLeft size={18} color="#FFFFFF" />
                <span className="text-txt font-semibold ml-2">Retour au lobby</span>
              </button>

              <button
                onClick={() => {
                  setError(null);
                  setRealProgress(0);
                  setSimulatedProgress(0);
                  setCurrentQuestion(0);
                  setTotalQuestions(0);
                  if (session?.id) fetchSession(session.id);
                }}
                className="flex-1 flex flex-row items-center justify-center bg-[#00D397] py-3.5 rounded-xl hover:bg-[#00B377] transition-colors"
              >
                <RefreshCw size={18} className="text-btn-fg" />
                <span className="text-btn-fg font-semibold ml-2">Réessayer</span>
              </button>
            </div>
          </div>
        )}

        {/* Manager cancel button */}
        {isManager && session?.status === 'GENERATING' && (
          <div className="w-full max-w-sm mt-8">
            <button
              onClick={async () => {
                if (!session?.id || isCancelling) return;
                setIsCancelling(true);
                try {
                  await cancelGeneration(session.id);
                  await fetchSession(session.id);
                } catch {
                  setError("Échec de l'annulation de la génération");
                } finally {
                  setIsCancelling(false);
                }
              }}
              className="w-full flex flex-row items-center justify-center bg-[#D5442F] py-3.5 rounded-xl hover:bg-[#B53320] transition-colors"
            >
              <span className="text-txt font-semibold">
                {isCancelling ? 'Annulation…' : 'Arrêter la génération'}
              </span>
            </button>
          </div>
        )}

        <div className="mt-8">
          <p className="text-txt-25 text-xs">Session {code}</p>
        </div>
      </div>
    </SafeScreen>
  );
}
