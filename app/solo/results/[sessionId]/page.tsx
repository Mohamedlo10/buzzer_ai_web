'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trophy, CheckCircle, XCircle, ArrowLeft, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import * as soloApi from '~/lib/api/solo';
import type { SoloSessionResultResponse, AnswerSummary } from '~/types/solo';

function CollapsibleAnswerRow({ answer }: { answer: AnswerSummary }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-soft">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex flex-row items-center justify-between text-left hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-txt font-semibold text-sm leading-snug line-clamp-1">{answer.questionText}</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className={answer.correct ? 'text-accent font-medium' : 'text-buzz font-medium'}>
              {answer.correct ? 'Correct' : 'Incorrect'}
            </span>
            <span className="text-txt-40">•</span>
            <span className="text-txt-60 truncate">Votre réponse : {answer.userAnswer || '(temps écoulé)'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {answer.correct ? (
            <CheckCircle size={16} className="text-accent" />
          ) : (
            <XCircle size={16} className="text-buzz" />
          )}
          {isOpen ? <ChevronUp size={16} className="text-txt-40" /> : <ChevronDown size={16} className="text-txt-40" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 bg-surface border-t border-line/50 text-xs space-y-3 animate-[rise_0.2s_both]">
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-bg/40 p-2.5 rounded-lg border border-line/60">
              <span className="text-[10px] font-bold text-txt-40 uppercase tracking-wider block mb-0.5">Votre réponse</span>
              <span className={`font-semibold ${answer.correct ? 'text-accent' : 'text-buzz-h'}`}>
                {answer.userAnswer || '(temps écoulé)'}
              </span>
            </div>
            <div className="bg-bg/40 p-2.5 rounded-lg border border-line/60">
              <span className="text-[10px] font-bold text-txt-40 uppercase tracking-wider block mb-0.5">Bonne réponse</span>
              <span className="text-txt font-semibold">{answer.correctAnswer}</span>
            </div>
          </div>
          {answer.explanation && (
            <div className="bg-surface-2/40 border border-line/40 rounded-lg p-3 text-txt-60 leading-relaxed">
              <strong className="text-txt font-semibold block mb-1 text-[11px]">Explication :</strong>
              {answer.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SoloResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<SoloSessionResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await soloApi.getResults(sessionId);
        setResults(data);
      } catch (error) {
        console.error('Failed to fetch results', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [sessionId]);

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center">
        <Spinner size="large" text="Calcul de vos scores..." />
      </SafeScreen>
    );
  }

  if (!results) {
    return (
      <SafeScreen className="bg-bg">
        <div className="flex flex-col flex-1 items-center justify-center text-center px-4">
          <AlertCircle size={40} className="text-buzz mb-4" />
          <h2 className="text-txt font-bold text-lg">Résultats introuvables</h2>
          <button
            onClick={() => router.push('/solo')}
            className="mt-4 px-6 py-2.5 bg-surface border border-line text-txt rounded-xl font-bold text-sm cursor-pointer"
          >
            Retour au Hub Solo
          </button>
        </div>
      </SafeScreen>
    );
  }

  const isCareer = !!results.careerLevelResult;
  const isPassed = results.passed;

  return (
    <SafeScreen className="bg-bg">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-8 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-3.5 mb-6">
          <button
            onClick={() => {
              if (isCareer) {
                router.push(`/solo/career/${results.careerLevelResult?.careerId}`);
              } else {
                router.push('/solo/training');
              }
            }}
            className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center text-txt transition-colors border border-line cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-txt font-display font-bold text-2xl tracking-tight">Résultats</h1>
        </div>

        {/* Hero Card Status */}
        <div className="bg-surface border border-line rounded-3xl p-6 text-center mb-6 shadow-soft animate-[pop_0.4s_both] relative overflow-hidden">
          {isPassed ? (
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-accent/8 to-transparent pointer-events-none" />
          ) : (
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-buzz/5 to-transparent pointer-events-none" />
          )}

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isPassed ? 'bg-accent/15 text-accent shadow-glow-success' : 'bg-buzz/15 text-buzz shadow-glow'
          }`}>
            <Trophy size={32} />
          </div>
          
          <h2 className={`text-2xl font-display font-bold tracking-tight ${isPassed ? 'text-accent' : 'text-buzz-h'}`}>
            {isPassed ? 'Session Validée ! 🎉' : 'Session Échouée 😬'}
          </h2>
          
          <p className="text-txt-60 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            {isCareer
              ? `Niveau ${results.careerLevelResult?.levelNumber} - Seuil requis : ${results.threshold}%`
              : 'Mode Entraînement'}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3.5 mt-6 border-t border-line/60 pt-5">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-txt-40 uppercase tracking-wider">Précision</span>
              <span className="text-txt font-bold text-lg mt-0.5">{Math.round(results.accuracy * 100)}%</span>
              <span className="text-txt-60 text-[10px] mt-0.5">{results.correctAnswers}/{results.totalQuestions} ok</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-txt-40 uppercase tracking-wider">Score</span>
              <span className="text-accent font-bold text-lg mt-0.5">⚡ {results.score}</span>
              <span className="text-txt-60 text-[10px] mt-0.5">points</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-txt-40 uppercase tracking-wider">Série Max</span>
              <span className="text-energy font-bold text-lg mt-0.5">🔥 {results.streak}</span>
              <span className="text-txt-60 text-[10px] mt-0.5">affilées</span>
            </div>
          </div>
        </div>

        {/* Career Level Progression details */}
        {isCareer && results.careerLevelResult && (
          <div className="bg-surface/50 border border-line rounded-3xl p-5 mb-6 animate-[rise_0.4s_both]">
            <h3 className="text-txt font-bold text-[15px] tracking-tight">Mise à jour Carrière</h3>
            <div className="mt-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-txt-60">Status Niveau</span>
                <span className={`font-semibold ${results.careerLevelResult.levelCompleted ? 'text-accent' : 'text-buzz-h'}`}>
                  {results.careerLevelResult.levelCompleted ? 'Validé' : 'Échoué'}
                </span>
              </div>
              
              {results.careerLevelResult.levelCompleted ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-txt-60">Points de réussite</span>
                    <span className="text-txt font-semibold">+{results.careerLevelResult.scoreEarned} pts</span>
                  </div>
                  {results.careerLevelResult.attempts === 1 && (
                    <div className="flex justify-between items-center text-xs bg-energy/10 text-energy px-2.5 py-1.5 rounded-lg font-bold border border-energy/20">
                      <span>🎁 Bonus 1er Essai</span>
                      <span>+500 pts</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between items-center text-xs bg-buzz/10 text-buzz px-2.5 py-1.5 rounded-lg font-semibold border border-buzz/20 leading-relaxed">
                  <span>Tentative infructueuse. Malus appliqué sur le prochain essai.</span>
                  <span>-100 pts</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-txt-60">Prochain niveau</span>
                <span className={`font-semibold ${results.careerLevelResult.nextLevelUnlocked ? 'text-accent' : 'text-txt-40'}`}>
                  {results.careerLevelResult.nextLevelUnlocked ? 'Débloqué 🔓' : 'Verrouillé 🔒'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapse accordion of answers */}
        <div className="mb-6 animate-[rise_0.5s_both]">
          <h3 className="text-txt font-display font-bold text-[17px] mb-3">Détail des réponses</h3>
          <div className="flex flex-col gap-2.5">
            {results.answers.map((ans) => (
              <CollapsibleAnswerRow key={ans.questionNumber} answer={ans} />
            ))}
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => {
            if (isCareer) {
              router.push(`/solo/career/${results.careerLevelResult?.careerId}`);
            } else {
              router.push('/solo/training');
            }
          }}
          className="w-full py-4 rounded-2xl bg-surface border border-line text-txt font-bold text-base hover:bg-surface-2 transition-colors cursor-pointer"
        >
          Retour aux niveaux
        </button>

      </div>
    </SafeScreen>
  );
}
