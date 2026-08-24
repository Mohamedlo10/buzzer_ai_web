import { View, Text } from 'react-native';
import { Zap, User, Bot, Sparkles, PenLine, Timer, Target, Users, Award, AlertCircle } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import type {
  QuestionMode,
  SessionMode,
  CreateSessionRequest,
  TeamRequest,
  CategorySelectionMode,
  CategoryRequest,
} from '~/types/api';
import { SummaryTable, type SummaryRow } from './SummaryTable';

export interface StepSummaryProps {
  sessionMode: SessionMode;
  questionMode: QuestionMode;
  categorySelectionMode: CategorySelectionMode;
  targetTotalQuestions: number;
  sessionCategories: CategoryRequest[];
  globalQuestionSeconds: number;
  answerChoicesCount: number | null;
  config: CreateSessionRequest;
  teams: TeamRequest[];
  error: string | null;
}

export function StepSummary({
  sessionMode,
  questionMode,
  categorySelectionMode,
  targetTotalQuestions,
  sessionCategories,
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
      icon: sessionMode === 'WITH_MODERATOR'
        ? <User size={16} color={palette.primary} />
        : <Bot size={16} color={palette.violet} />,
      iconColor: sessionMode === 'WITH_MODERATOR' ? palette.primary : palette.violet,
      valueColor: sessionMode === 'WITH_MODERATOR' ? palette.primary : palette.violet,
    },
    {
      label: 'Source des questions',
      value: questionMode === 'AI' ? 'Générées par IA' : 'Saisie manuelle',
      icon: questionMode === 'AI'
        ? <Sparkles size={16} color={palette.primary} />
        : <PenLine size={16} color={palette.gold} />,
      iconColor: questionMode === 'AI' ? palette.primary : palette.gold,
      valueColor: questionMode === 'AI' ? palette.primary : palette.gold,
    },
  ];

  if (questionMode === 'AI') {
    recapRows.push({
      label: 'Sélection des thèmes',
      value: categorySelectionMode === 'MANAGER' ? `Imposés (${sessionCategories.length} thème${sessionCategories.length !== 1 ? 's' : ''})` : 'Par joueur',
      icon: <Target size={16} color={palette.primary} />,
      iconColor: palette.primary,
      valueColor: palette.primary,
    });

    if (categorySelectionMode === 'MANAGER') {
      recapRows.push({
        label: 'Total de questions',
        value: `${targetTotalQuestions} questions`,
        icon: <Target size={16} color={palette.txt} />,
        iconColor: palette.txt,
        valueColor: palette.txt,
      });
    } else {
      recapRows.push({
        label: 'Questions par catégorie',
        value: config.questionsPerCategory ?? 5,
        icon: <Target size={16} color={palette.txt} />,
        iconColor: palette.txt,
        valueColor: palette.txt,
      });
      recapRows.push({
        label: 'Catégories maximum',
        value: config.maxCategoriesPerPlayer ?? 3,
        icon: <Target size={16} color={palette.txt} />,
        iconColor: palette.txt,
        valueColor: palette.txt,
      });
    }
  }

  if (sessionMode === 'WITHOUT_MODERATOR') {
    recapRows.push({
      label: 'Temps pour répondre',
      value: `${globalQuestionSeconds}s`,
      icon: <Timer size={16} color={palette.txt} />,
      iconColor: palette.txt,
      valueColor: palette.txt,
    });
    recapRows.push({
      label: 'Choix de réponse',
      value: answerChoicesCount === null ? 'Auto' : answerChoicesCount,
      icon: <Zap size={16} color={palette.txt} />,
      iconColor: palette.txt,
      valueColor: palette.txt,
    });
  } else {
    recapRows.push({
      label: 'Délai du buzzer',
      value: `${config.buzzCountdownSeconds ?? 10}s`,
      icon: <Timer size={16} color={palette.txt} />,
      iconColor: palette.txt,
      valueColor: palette.txt,
    });
  }

  recapRows.push({
    label: 'Joueurs maximum',
    value: config.maxPlayers ?? 20,
    icon: <Users size={16} color={palette.txt} />,
    iconColor: palette.txt,
    valueColor: palette.txt,
  });

  if (sessionMode !== 'WITHOUT_MODERATOR') {
    recapRows.push({
      label: 'Points par bonne réponse',
      value: `+${config.pointsPerCorrectAnswer ?? 5} pts`,
      icon: <Award size={16} color={palette.txt} />,
      iconColor: palette.txt,
      valueColor: palette.txt,
    });
  }

  recapRows.push({
    label: 'Format de la session',
    value: config.isTeamMode ? `Équipes (${teams.length})` : 'Solo',
    icon: <Users size={16} color={config.isTeamMode ? palette.indigo : palette.txt} />,
    iconColor: config.isTeamMode ? palette.indigo : palette.txt,
    valueColor: config.isTeamMode ? palette.indigo : palette.txt,
  });

  return (
    <View style={{ gap: 24 }}>
      {/* Hero */}
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 22,
            backgroundColor: palette.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Zap size={32} color="#FFFFFF" />
        </View>
        <Text style={{ color: palette.txt, fontSize: 22, fontWeight: '700' }}>Tout est prêt !</Text>
        <Text style={{ color: palette.inkSoft, fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 }}>
          Vérifiez les paramètres ci-dessous avant de lancer la session.
        </Text>
      </View>

      {/* Summary Table */}
      <View>
        <Text
          style={{
            color: palette.inkSoft,
            fontSize: 9.5,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Récapitulatif des réglages
        </Text>
        <SummaryTable rows={recapRows} />
      </View>

      {/* Team error */}
      {config.isTeamMode && teams.length < 2 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.bad + '50',
            backgroundColor: palette.bad + '1A',
          }}
        >
          <AlertCircle size={18} color={palette.bad} />
          <Text style={{ color: palette.txt, fontSize: 14, flex: 1 }}>
            Minimum 2 équipes requises pour le mode équipes.
          </Text>
        </View>
      )}

      {/* API Error */}
      {error && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.bad + '50',
            backgroundColor: palette.bad + '1A',
          }}
        >
          <AlertCircle size={18} color={palette.bad} />
          <Text style={{ color: palette.txt, fontSize: 14, flex: 1 }}>{error}</Text>
        </View>
      )}
    </View>
  );
}
