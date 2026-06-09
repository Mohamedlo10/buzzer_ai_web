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

// Mascot Runner component with custom run cycle animations and states (running, celebrating, sad)
function MascotRunner({
  progress,
  state,
  speed = 0.4,
}: {
  progress: number;
  state: 'running' | 'celebrating' | 'sad';
  speed?: number;
}) {
  const runStyle =
    state === 'running'
      ? {
          leftLeg: { animation: `run-left-leg ${speed}s infinite ease-in-out` },
          rightLeg: { animation: `run-right-leg ${speed}s infinite ease-in-out` },
          leftArm: { animation: `run-left-arm ${speed}s infinite ease-in-out` },
          rightArm: { animation: `run-right-arm ${speed}s infinite ease-in-out` },
          body: { animation: `run-body ${speed}s infinite ease-in-out` },
        }
      : state === 'celebrating'
      ? {
          leftLeg: { transform: 'rotate(-10deg)', transformOrigin: '12px 14px' },
          rightLeg: { transform: 'rotate(10deg)', transformOrigin: '12px 14px' },
          leftArm: { animation: 'celebrate-left-arm 0.3s infinite alternate ease-in-out' },
          rightArm: { animation: 'celebrate-right-arm 0.3s infinite alternate ease-in-out' },
          body: { animation: 'celebrate-body 0.6s infinite ease-in-out' },
        }
      : {
          leftLeg: { transform: 'rotate(5deg)', transformOrigin: '12px 14px' },
          rightLeg: { transform: 'rotate(-5deg)', transformOrigin: '12px 14px' },
          leftArm: { transform: 'rotate(-10deg)', transformOrigin: '12px 9.5px' },
          rightArm: { transform: 'rotate(10deg)', transformOrigin: '12px 9.5px' },
          body: { transform: 'rotate(10deg)', transformOrigin: '12px 14px' },
        };

  return (
    <div
      className="absolute bottom-1 transition-all duration-500 ease-out flex items-center justify-center"
      style={{
        left: `calc(${Math.max(progress, 0)}% - 24px)`,
        width: '48px',
        height: '48px',
      }}
    >
      <style>{`
        @keyframes run-left-leg {
          0%, 100% { transform: rotate(-35deg); }
          50% { transform: rotate(35deg); }
        }
        @keyframes run-right-leg {
          0%, 100% { transform: rotate(35deg); }
          50% { transform: rotate(-35deg); }
        }
        @keyframes run-left-arm {
          0%, 100% { transform: rotate(45deg); }
          50% { transform: rotate(-35deg); }
        }
        @keyframes run-right-arm {
          0%, 100% { transform: rotate(-35deg); }
          50% { transform: rotate(45deg); }
        }
        @keyframes run-body {
          0%, 100% { transform: translateY(0px) rotate(5deg); }
          50% { transform: translateY(-2px) rotate(10deg); }
        }
        @keyframes celebrate-left-arm {
          0% { transform: rotate(-130deg); }
          100% { transform: rotate(-95deg); }
        }
        @keyframes celebrate-right-arm {
          0% { transform: rotate(130deg); }
          100% { transform: rotate(95deg); }
        }
        @keyframes celebrate-body {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {state === 'celebrating' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute -top-3 -left-3 animate-bounce text-sm">🎉</div>
          <div className="absolute -top-6 left-4 animate-ping text-xs">✨</div>
          <div className="absolute -top-3 -right-3 animate-bounce delay-75 text-sm">🥳</div>
          <div className="absolute top-1 -left-4 animate-ping delay-100 text-[10px]">✨</div>
          <div className="absolute top-1 -right-4 animate-bounce delay-150 text-[10px]">🎉</div>
        </div>
      )}

      <svg
        viewBox="0 0 24 24"
        className={`w-10 h-10 transition-colors ${state === 'sad' ? 'text-buzz' : 'text-accent'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g style={runStyle.body}>
          <rect x="9" y="2" width="6" height="5" rx="1.5" className="fill-surface stroke-current" strokeWidth="2" />
          <line x1="11" y1="4.5" x2="13" y2="4.5" stroke={state === 'sad' ? '#D5442F' : '#00D397'} strokeWidth="1.5" />
          <rect x="8" y="7" width="8" height="6" rx="2" className="fill-surface stroke-current" strokeWidth="2" />
          <line x1="12" y1="7" x2="12" y2="7.5" strokeWidth="1.5" />
          <line
            x1="8"
            y1="9.5"
            x2="5"
            y2="12"
            style={{ ...runStyle.leftArm, transformOrigin: '8px 9.5px' }}
          />
          <line
            x1="16"
            y1="9.5"
            x2="19"
            y2="12"
            style={{ ...runStyle.rightArm, transformOrigin: '16px 9.5px' }}
          />
          <line
            x1="10"
            y1="13"
            x2="8"
            y2="19.5"
            style={{ ...runStyle.leftLeg, transformOrigin: '10px 13px' }}
          />
          <line
            x1="14"
            y1="13"
            x2="16"
            y2="19.5"
            style={{ ...runStyle.rightLeg, transformOrigin: '14px 13px' }}
          />
        </g>
      </svg>
    </div>
  );
}

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

  const [prevProgress, setPrevProgress] = useState(0);
  const [runSpeed, setRunSpeed] = useState(0.4);

  useEffect(() => {
    const diff = progress - prevProgress;
    if (diff > 0) {
      const newSpeed = Math.max(0.2, Math.min(0.6, 0.4 - (diff - 1) * 0.05));
      setRunSpeed(newSpeed);
      setPrevProgress(progress);
    }
  }, [progress, prevProgress]);

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
        <div className="w-full max-w-sm flex flex-col mt-4">
          {/* Mascot runner riding on top of the progress bar */}
          <div className="w-full relative h-[48px] mb-1">
            <MascotRunner
              progress={progress}
              state={error ? 'sad' : isComplete ? 'celebrating' : 'running'}
              speed={runSpeed}
            />
          </div>

          {/* Clean progress bar */}
          <div className="h-4 bg-surface-2 rounded-full overflow-hidden relative border border-line">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.max(progress, 3)}%`,
                background: 'linear-gradient(90deg, #00B383, #00D397)',
              }}
            />
          </div>

          <div className="flex flex-row justify-between mt-3 text-xs font-semibold">
            <span className="text-txt-60">
              {isComplete
                ? 'Génération terminée !'
                : totalQuestions > 0
                ? `Génération... ${currentQuestion} / ${totalQuestions}`
                : 'Préparation…'}
            </span>
            {totalQuestions > 0 && currentQuestion < totalQuestions && !isComplete && !error && (
              <span className="text-txt-40">
                ~{Math.round((totalQuestions - currentQuestion) * 1.5)}s restantes
              </span>
            )}
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
