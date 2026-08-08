import {
  Zap, User, Bot, Sparkles, PenLine, Timer, Target, Users, Award, AlertCircle,
} from 'lucide-react';
import type { QuestionMode, SessionMode, CreateSessionRequest, TeamRequest } from '~/types/api';
import { SummaryTable, type SummaryRow } from './SummaryTable';

export interface StepSummaryProps {
  sessionMode: SessionMode;
  questionMode: QuestionMode;
  globalQuestionSeconds: number;
  answerChoicesCount: number | null;
  config: CreateSessionRequest;
  teams: TeamRequest[];
  error: string | null;
}

export function StepSummary({
  sessionMode,
  questionMode,
  globalQuestionSeconds,
  answerChoicesCount,
  config,
  teams,
  error,
}: StepSummaryProps) {
  const recapRows: SummaryRow[] = [
    {
      label: 'Modération',
      value: sessionMode === 'WITH_MODERATOR' ? 'Avec modérateur' : 'Sans modérateur',
      icon: sessionMode === 'WITH_MODERATOR' ? <User size={16} /> : <Bot size={16} />,
      iconColor: sessionMode === 'WITH_MODERATOR' ? 'var(--primary)' : 'var(--violet)',
      valueColor: sessionMode === 'WITH_MODERATOR' ? 'var(--primary)' : 'var(--violet)',
    },
    {
      label: 'Source des questions',
      value: questionMode === 'AI' ? 'Générées par IA' : 'Saisie manuelle',
      icon: questionMode === 'AI' ? <Sparkles size={16} /> : <PenLine size={16} />,
      iconColor: questionMode === 'AI' ? 'var(--primary)' : 'var(--gold)',
      valueColor: questionMode === 'AI' ? 'var(--primary)' : 'var(--gold)',
    },
  ];

  if (questionMode === 'AI') {
    recapRows.push({
      label: 'Questions par catégorie',
      value: config.questionsPerCategory,
      icon: <Target size={16} />,
      iconColor: 'var(--txt)',
      valueColor: 'var(--txt)',
    });
    recapRows.push({
      label: 'Catégories maximum',
      value: config.maxCategoriesPerPlayer,
      icon: <Target size={16} />,
      iconColor: 'var(--txt)',
      valueColor: 'var(--txt)',
    });
  }

  if (sessionMode === 'WITHOUT_MODERATOR') {
    recapRows.push({
      label: 'Temps pour répondre',
      value: `${globalQuestionSeconds}s`,
      icon: <Timer size={16} />,
      iconColor: 'var(--txt)',
      valueColor: 'var(--txt)',
    });
    recapRows.push({
      label: 'Choix de réponse',
      value: answerChoicesCount === null ? 'Auto' : answerChoicesCount,
      icon: <Zap size={16} />,
      iconColor: 'var(--txt)',
      valueColor: 'var(--txt)',
    });
  } else {
    recapRows.push({
      label: 'Délai du buzzer',
      value: `${config.buzzCountdownSeconds ?? 10}s`,
      icon: <Timer size={16} />,
      iconColor: 'var(--txt)',
      valueColor: 'var(--txt)',
    });
  }

  recapRows.push({
    label: 'Joueurs maximum',
    value: config.maxPlayers,
    icon: <Users size={16} />,
    iconColor: 'var(--txt)',
    valueColor: 'var(--txt)',
  });

  if (sessionMode !== 'WITHOUT_MODERATOR') {
    recapRows.push({
      label: 'Points par bonne réponse',
      value: `+${config.pointsPerCorrectAnswer} pts`,
      icon: <Award size={16} />,
      iconColor: 'var(--txt)',
      valueColor: 'var(--txt)',
    });
  }

  recapRows.push({
    label: 'Format de la session',
    value: config.isTeamMode ? `Équipes (${teams.length})` : 'Solo',
    icon: <Users size={16} />,
    iconColor: config.isTeamMode ? 'var(--indigo)' : 'var(--txt)',
    valueColor: config.isTeamMode ? 'var(--indigo)' : 'var(--txt)',
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Banner */}
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-[68px] h-[68px] rounded-[22px] bg-gradient-to-br from-accent to-accent-d flex items-center justify-center shadow-[0_8px_24px_rgb(var(--primary-rgb)_/_0.28)] animate-pulse mb-3 shrink-0">
          <Zap size={32} className="text-btn-fg fill-current" />
        </div>
        <h2 className="text-2xl font-bold text-txt">Tout est prêt !</h2>
        <p className="text-txt-40 text-[13px] mt-1 px-4 leading-normal">
          Vérifiez les paramètres ci-dessous avant de lancer la session.
        </p>
      </div>

      {/* Summary Table */}
      <div className="flex flex-col gap-2">
        <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase px-1 leading-none">Récapitulatif des réglages</p>
        <SummaryTable rows={recapRows} />
      </div>

      {/* Dynamic client error message if teams < 2 */}
      {config.isTeamMode && teams.length < 2 && (
        <div
          className="rounded-2xl p-4 border flex items-center gap-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--buzz, var(--bad)) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--buzz, var(--bad)) 30%, transparent)',
          }}
        >
          <AlertCircle size={18} className="text-buzz shrink-0" style={{ color: 'var(--buzz)' }} />
          <span className="text-txt text-sm font-medium">Minimum 2 équipes requises pour le mode équipes.</span>
        </div>
      )}

      {/* API Error Box */}
      {error && (
        <div
          className="rounded-2xl p-4 border flex items-center gap-3 animate-shake"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--buzz, var(--bad)) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--buzz, var(--bad)) 30%, transparent)',
          }}
        >
          <AlertCircle size={18} className="text-buzz shrink-0" style={{ color: 'var(--buzz)' }} />
          <span className="text-txt text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
