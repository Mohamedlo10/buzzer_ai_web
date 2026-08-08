import type { QuestionMode, SessionMode, CreateSessionRequest } from '~/types/api';
import { StepperField } from './StepperField';
import { ChoiceStrip } from './ChoiceStrip';

export interface StepSettingsProps {
  sessionMode: SessionMode;
  questionMode: QuestionMode;
  globalQuestionSeconds: number;
  setGlobalQuestionSeconds: (v: number) => void;
  setAnswerTimeSeconds: (v: number) => void;
  answerChoicesCount: number | null;
  setAnswerChoicesCount: (v: number | null) => void;
  config: CreateSessionRequest;
  setConfig: React.Dispatch<React.SetStateAction<CreateSessionRequest>>;
}

export function StepSettings({
  sessionMode,
  questionMode,
  globalQuestionSeconds,
  setGlobalQuestionSeconds,
  setAnswerTimeSeconds,
  answerChoicesCount,
  setAnswerChoicesCount,
  config,
  setConfig,
}: StepSettingsProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* TIMERS SANS MODÉRATEUR */}
      {sessionMode === 'WITHOUT_MODERATOR' && (
        <div className="flex flex-col gap-3">
          <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-1 leading-none">Timers Sprint</p>
          <StepperField
            label="Temps pour répondre"
            value={globalQuestionSeconds}
            suffix="s"
            min={5}
            max={60}
            step={5}
            onChange={(v) => {
              setGlobalQuestionSeconds(v);
              setAnswerTimeSeconds(v);
            }}
          />

          <ChoiceStrip
            label="Nombre de choix de réponse"
            value={answerChoicesCount}
            onChange={setAnswerChoicesCount}
            options={[
              { label: 'Auto', value: null },
              { label: '2', value: 2 },
              { label: '3', value: 3 },
              { label: '4', value: 4 },
              { label: '5', value: 5 },
              { label: '6', value: 6 },
            ]}
            accent="var(--accent, var(--primary))"
          />
        </div>
      )}

      {/* BUZZ COUNTDOWN AVEC MODÉRATEUR */}
      {sessionMode === 'WITH_MODERATOR' && (
        <div className="flex flex-col gap-3">
          <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-1 leading-none">Buzz Countdown</p>
          <StepperField
            label="Temps pour répondre"
            value={config.buzzCountdownSeconds ?? 10}
            suffix="s"
            min={5}
            max={60}
            step={5}
            onChange={(v) => setConfig((c) => ({ ...c, buzzCountdownSeconds: v }))}
          />
        </div>
      )}

      {/* QUESTIONS IA */}
      {questionMode === 'AI' && (
        <div className="flex flex-col gap-3">
          <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-1 leading-none">Questions IA</p>
          <div className="grid grid-cols-2 gap-3">
            <StepperField
              label="Questions / cat."
              value={config.questionsPerCategory}
              min={2}
              max={15}
              onChange={(v) => setConfig((c) => ({ ...c, questionsPerCategory: v }))}
            />
            <StepperField
              label="Catégories max"
              value={config.maxCategoriesPerPlayer}
              min={1}
              max={10}
              onChange={(v) => setConfig((c) => ({ ...c, maxCategoriesPerPlayer: v }))}
            />
          </div>
        </div>
      )}

      {/* PARTIE */}
      <div className="flex flex-col gap-3">
        <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-1 leading-none">Partie</p>
        <div className="grid grid-cols-2 gap-3">
          <StepperField
            label="Joueurs max"
            value={config.maxPlayers}
            min={2}
            max={50}
            onChange={(v) => setConfig((c) => ({ ...c, maxPlayers: v }))}
          />
          {sessionMode !== 'WITHOUT_MODERATOR' && (
            <StepperField
              label="Points / rép."
              value={config.pointsPerCorrectAnswer}
              min={1}
              max={50}
              step={5}
              onChange={(v) => setConfig((c) => ({ ...c, pointsPerCorrectAnswer: v }))}
            />
          )}
          {questionMode === 'AI' && (
            <StepperField
              label={sessionMode === 'WITHOUT_MODERATOR' ? "Dette (bonnes rép.)" : "Dette / rubrique"}
              value={config.debtAmount ?? (sessionMode === 'WITHOUT_MODERATOR' ? 1 : 5)}
              suffix={sessionMode === 'WITHOUT_MODERATOR' ? " rép." : " pts"}
              min={0}
              max={sessionMode === 'WITHOUT_MODERATOR' ? 3 : 50}
              step={sessionMode === 'WITHOUT_MODERATOR' ? 1 : 5}
              onChange={(v) => setConfig((c) => ({ ...c, debtAmount: v }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
