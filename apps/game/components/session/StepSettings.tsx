import { View, Text } from 'react-native';
import { palette } from '~/lib/theme/tokens';
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

const LABEL_STYLE = {
  color: palette.inkSoft,
  fontSize: 9.5,
  fontWeight: '700' as const,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
  marginBottom: 12,
};

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
    <View style={{ gap: 20 }}>
      {/* Timers Sprint */}
      {sessionMode === 'WITHOUT_MODERATOR' && (
        <View style={{ gap: 12 }}>
          <Text style={LABEL_STYLE}>Timers Sprint</Text>
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
          />
        </View>
      )}

      {/* Buzz Countdown */}
      {sessionMode === 'WITH_MODERATOR' && (
        <View style={{ gap: 12 }}>
          <Text style={LABEL_STYLE}>Buzz Countdown</Text>
          <StepperField
            label="Temps pour répondre"
            value={config.buzzCountdownSeconds ?? 10}
            suffix="s"
            min={5}
            max={60}
            step={5}
            onChange={(v) => setConfig((c) => ({ ...c, buzzCountdownSeconds: v }))}
          />
        </View>
      )}

      {/* Questions IA */}
      {questionMode === 'AI' && (
        <View style={{ gap: 12 }}>
          <Text style={LABEL_STYLE}>Questions IA</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <StepperField
                label="Questions / cat."
                value={config.questionsPerCategory ?? 5}
                min={2}
                max={15}
                onChange={(v) => setConfig((c) => ({ ...c, questionsPerCategory: v }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StepperField
                label="Catégories max"
                value={config.maxCategoriesPerPlayer ?? 3}
                min={1}
                max={10}
                onChange={(v) => setConfig((c) => ({ ...c, maxCategoriesPerPlayer: v }))}
              />
            </View>
          </View>
        </View>
      )}

      {/* Partie */}
      <View style={{ gap: 12 }}>
        <Text style={LABEL_STYLE}>Partie</Text>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {/* <View style={{ flex: 1, minWidth: '45%' }}>
            <StepperField
              label="Joueurs max"
              // value={config.maxPlayers ?? 20}
              value={30}
              min={2}
              max={50}
              onChange={(v) => setConfig((c) => ({ ...c, maxPlayers: v }))}
            />
          </View> */}
          {sessionMode !== 'WITHOUT_MODERATOR' && (
            <View style={{ flex: 1, minWidth: '45%' }}>
              <StepperField
                label="Points / rép."
                value={config.pointsPerCorrectAnswer ?? 5}
                min={1}
                max={50}
                step={5}
                onChange={(v) => setConfig((c) => ({ ...c, pointsPerCorrectAnswer: v }))}
              />
            </View>
          )}
          {questionMode === 'AI' && (
            <View style={{ flex: 1, minWidth: '45%' }}>
              <StepperField
                label={sessionMode === 'WITHOUT_MODERATOR' ? 'Dette (bonnes rép.)' : 'Dette / rubrique'}
                value={config.debtAmount ?? (sessionMode === 'WITHOUT_MODERATOR' ? 1 : 5)}
                suffix={sessionMode === 'WITHOUT_MODERATOR' ? ' rép.' : ' pts'}
                min={0}
                max={sessionMode === 'WITHOUT_MODERATOR' ? 3 : 50}
                step={sessionMode === 'WITHOUT_MODERATOR' ? 1 : 5}
                onChange={(v) => setConfig((c) => ({ ...c, debtAmount: v }))}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
