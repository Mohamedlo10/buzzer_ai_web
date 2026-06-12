'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, XCircle, ChevronRight, HelpCircle, ArrowLeft, Gamepad2 } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { AnswerChoicesPanel } from '~/components/game/AnswerChoicesPanel';
import { useSoloStore } from '~/stores/useSoloStore';

export default function SoloGamePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const {
    currentQuestion,
    reveal,
    phase,
    totalQuestions,
    isSubmitting,
    isLoading,
    error,
    loadSession,
    answerQuestion,
    advanceQuestion,
    resetStore,
  } = useSoloStore();

  const [startTime, setStartTime] = useState<number>(Date.now());
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    resetStore();
    loadSession(sessionId)
      .then(() => {
        setStartTime(Date.now());
        hasLoadedRef.current = true;
      })
      .catch((err) => {
        console.error('Failed to load solo session', err);
      });

    return () => {
      resetStore();
    };
  }, [sessionId, loadSession, resetStore]);

  // When phase changes back to QUESTION, reset start time for the new question
  useEffect(() => {
    if (phase === 'QUESTION' && hasLoadedRef.current) {
      setStartTime(Date.now());
    }
  }, [phase]);

  const handleSubmitAnswer = async (chosenAnswer: string) => {
    const timeSpentMs = Date.now() - startTime;
    // Special timeout value handled by choices panel
    const finalAnswer = chosenAnswer === '__timeout__' ? '' : chosenAnswer;
    try {
      await answerQuestion(finalAnswer, timeSpentMs);
    } catch (err) {
      console.error('Failed to submit answer', err);
    }
  };

  const handleNext = async () => {
    try {
      const { completed } = await advanceQuestion();
      if (completed) {
        router.push(`/solo/results/${sessionId}`);
      }
    } catch (err) {
      console.error('Failed to advance question', err);
    }
  };

  if (isLoading && !currentQuestion) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center">
        <Spinner size="large" text="Préparation des questions..." />
      </SafeScreen>
    );
  }

  if (error && !currentQuestion) {
    return (
      <SafeScreen className="bg-bg">
        <div className="flex flex-col flex-1 items-center justify-center text-center px-4 min-h-screen">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-buzz text-lg font-semibold mb-2">Erreur de chargement</p>
          <p className="text-txt-60 text-center mb-6 max-w-xs">{error}</p>
          <button
            onClick={() => router.push('/solo')}
            className="px-6 py-3 rounded-xl bg-surface border border-line text-txt font-bold transition-opacity hover:opacity-90 cursor-pointer"
          >
            Quitter la session
          </button>
        </div>
      </SafeScreen>
    );
  }

  if (!currentQuestion) return null;

  const showCorrect = reveal?.correct === true;
  const showWrong = reveal?.correct === false;
  const isLast = reveal?.isLastQuestion || currentQuestion.questionNumber === totalQuestions;

  return (
    <SafeScreen className="bg-bg">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-8 overflow-y-auto relative min-h-screen">
        
        {/* Top Header */}
        <div className="flex flex-row items-center justify-between mb-4">
          <button
            onClick={() => {
              if (confirm('Quitter la partie ? Votre progression actuelle est sauvegardée.')) {
                router.push('/solo');
              }
            }}
            className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center text-txt transition-colors border border-line cursor-pointer"
            title="Quitter la partie"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="px-3 py-1.5 rounded-full bg-surface border border-line text-txt-60 text-xs font-semibold">
            Question {currentQuestion.questionNumber} / {totalQuestions}
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full mb-6">
          {/* Identification image if present */}
          {currentQuestion.questionType === 'IDENTIFICATION' && currentQuestion.imageUrl && (
            <div className="w-full aspect-[16/10] bg-surface-2 rounded-2xl overflow-hidden mb-4 border border-line shadow-soft relative animate-[pop_0.4s_both]">
              <img
                src={currentQuestion.imageUrl}
                alt="Question visual"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Question Text */}
          <h2 className="text-txt font-display font-bold text-xl leading-snug text-center mb-6 animate-[rise_0.3s_both]">
            {currentQuestion.text}
          </h2>

          {/* Choices panel */}
          <div className="w-full">
            <AnswerChoicesPanel
              choices={currentQuestion.answerChoices}
              answerTimeSeconds={30}
              onSubmit={handleSubmitAnswer}
              isSubmitting={isSubmitting}
              result={phase === 'REVEAL' ? (showCorrect ? 'correct' : 'wrong') : null}
            />
          </div>
        </div>

        {/* Custom Reveal Bottom Sheet/Card */}
        {phase === 'REVEAL' && reveal && (
          <div className="fixed inset-0 z-50 bg-scrim/80 backdrop-blur-sm flex items-end justify-center animate-scrimin">
            <div className="w-full max-w-md bg-surface border-t border-line rounded-t-3xl overflow-hidden animate-sheetup p-5 pb-[calc(20px+env(safe-area-inset-bottom))] flex flex-col gap-4">
              
              {/* Status Header */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  showCorrect ? 'bg-accent/15 text-accent' : 'bg-buzz/15 text-buzz'
                }`}>
                  {showCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <h3 className={`font-display font-bold text-lg leading-tight ${showCorrect ? 'text-accent' : 'text-buzz-h'}`}>
                    {showCorrect ? 'Bonne réponse !' : 'Oups, raté...'}
                  </h3>
                  <p className="text-txt-60 text-xs mt-0.5">
                    {showCorrect ? '+100 points' : 'La bonne réponse était ci-dessous'}
                  </p>
                </div>
              </div>

              {/* Question Text Display */}
              <div className="bg-bg/40 border border-line/60 rounded-xl px-4 py-3">
                <span className="text-[10px] font-bold text-txt-40 uppercase tracking-wider block mb-1">
                  Question posée
                </span>
                <span className="text-txt font-medium text-sm leading-snug block">
                  {currentQuestion.text}
                </span>
              </div>

              {/* Correct Answer Display */}
              <div className="bg-bg/60 border border-line rounded-xl px-4 py-3">
                <span className="text-[10px] font-bold text-txt-40 uppercase tracking-wider block mb-1">
                  Réponse correcte
                </span>
                <span className="text-txt font-bold text-base">
                  {reveal.correctAnswer}
                </span>
              </div>

              {/* Explanation Text */}
              {reveal.explanation && (
                <div className="bg-surface-2/40 border border-line/60 rounded-xl p-4 text-xs leading-relaxed text-txt-60 max-h-[140px] overflow-y-auto">
                  <strong className="text-txt font-semibold block mb-1">Explication :</strong>
                  {reveal.explanation}
                </div>
              )}

              {/* CTA Next Question */}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-d text-btn-fg font-bold text-base flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer mt-1"
              >
                {isLoading ? (
                  <Spinner size="small" />
                ) : (
                  <>
                    <span>{isLast ? 'Voir les résultats' : 'Question suivante'}</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </SafeScreen>
  );
}
