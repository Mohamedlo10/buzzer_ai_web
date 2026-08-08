import { Mic, Eye, EyeOff, Target } from 'lucide-react';
import { ExpandableCard } from './ExpandableCard';
import { ProgressiveQuestionDisplay } from '~/components/game/ProgressiveQuestionDisplay';
import { IdentificationQuestionDisplay } from '~/components/game/IdentificationQuestionDisplay';
import type { QuestionResponse, ManualQuestion } from '~/types/api';

export interface QuestionAndAnswerDisplayProps {
  isManager: boolean;
  currentQuestion: QuestionResponse;
  questionIndex: number;
  manualQuestions: ManualQuestion[];
  showAnswer: boolean;
  setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>;
  displayedWordCount: number;
  phase: string;
  totalWordCount: number;
}

export function QuestionAndAnswerDisplay({
  isManager,
  currentQuestion,
  questionIndex,
  manualQuestions,
  showAnswer,
  setShowAnswer,
  displayedWordCount,
  phase,
  totalWordCount,
}: QuestionAndAnswerDisplayProps) {
  if (isManager) {
    return (
      <div className="px-4 pt-4">
        <div className="flex flex-row gap-3 mb-4">
          <ExpandableCard
            key={`q-${currentQuestion.id}`}
            icon={<Mic size={14} color="var(--primary)" />}
            label="QUESTION"
            content={currentQuestion.text}
            bgColor="bg-surface"
            borderColor="border-line"
          />

          <div className="flex-1 flex flex-col">
            <button
              onClick={() => setShowAnswer((v) => !v)}
              className="flex flex-row items-center gap-1 self-end mb-1 px-2 py-0.5 rounded-full bg-surface-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              {showAnswer ? (
                <EyeOff size={11} color="#FFFFFF80" />
              ) : (
                <Eye size={11} color="#FFFFFF80" />
              )}
              <span className="text-txt-60 text-xs">{showAnswer ? 'Masquer' : 'Afficher'}</span>
            </button>
            {showAnswer ? (
              <ExpandableCard
                key={`a-${currentQuestion.id}`}
                icon={<Target size={14} color="var(--primary)" />}
                label="RÉPONSE"
                content={currentQuestion.answer || manualQuestions[questionIndex]?.answer || '...'}
                subContent={
                  currentQuestion.explanation ||
                  manualQuestions[questionIndex]?.explanation ||
                  undefined
                }
                bgColor="bg-accent/5"
                borderColor="border-accent/25"
                isBold
              />
            ) : (
              <div className="flex-1 bg-surface-2/40 rounded-2xl border border-dashed border-line flex items-center justify-center min-h-[80px]">
                <EyeOff size={20} color="#FFFFFF30" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      {currentQuestion.questionType === 'IDENTIFICATION' && currentQuestion.imageUrl ? (
        <IdentificationQuestionDisplay
          imageUrl={currentQuestion.imageUrl}
          category={currentQuestion.category}
          text={currentQuestion.text}
        />
      ) : (
        <ProgressiveQuestionDisplay
          wordIndex={displayedWordCount - 1}
          text={currentQuestion.text}
          isRunning={phase === 'READING' && displayedWordCount < totalWordCount}
        />
      )}
    </div>
  );
}
