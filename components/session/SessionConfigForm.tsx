'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Zap,
  Target,
  AlertCircle,
  PenLine,
  Bot,
  Plus,
  X,
  Palette,
  Timer,
} from 'lucide-react';
import { useBuzzStore } from '~/stores/useBuzzStore';
import type { CreateSessionRequest, QuestionMode, TeamRequest } from '~/types/api';

const TEAM_PRESET_COLORS = [
  '#FF5733', '#3498DB', '#2ECC71', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E74C3C', '#E91E63',
];

const DEFAULT_TEAMS: TeamRequest[] = [
  { name: 'Rouge', color: '#FF5733' },
  { name: 'Bleu', color: '#3498DB' },
];

interface SessionConfigFormProps {
  onSuccess?: (sessionId: string, code: string) => void;
  roomId?: string;
}

// Stepper Field (- value +)
function StepperField({
  label,
  value,
  suffix = '',
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-4 flex flex-col">
      <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-3">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 h-9 rounded-full bg-[#3E3666] flex items-center justify-center text-white text-lg font-bold hover:bg-[#4E4676] active:scale-95 transition-all shrink-0"
        >
          −
        </button>
        <span className="text-[#00D397] font-bold text-2xl flex-1 text-center">
          {value}{suffix}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-9 h-9 rounded-full bg-[#3E3666] flex items-center justify-center text-white text-lg font-bold hover:bg-[#4E4676] active:scale-95 transition-all shrink-0"
        >
          +
        </button>
      </div>
    </div>
  );
}

// Team Editor Component
function TeamEditor({
  teams,
  onChange,
}: {
  teams: TeamRequest[];
  onChange: (teams: TeamRequest[]) => void;
}) {
  const addTeam = () => {
    if (teams.length >= 8) return;
    const nextColor = TEAM_PRESET_COLORS[teams.length % TEAM_PRESET_COLORS.length];
    onChange([...teams, { name: `Équipe ${teams.length + 1}`, color: nextColor }]);
  };

  const removeTeam = (index: number) => {
    if (teams.length <= 2) return;
    onChange(teams.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    onChange(teams.map((t, i) => (i === index ? { ...t, name } : t)));
  };

  const cycleColor = (index: number) => {
    const current = teams[index].color ?? TEAM_PRESET_COLORS[0];
    const colorIndex = TEAM_PRESET_COLORS.indexOf(current);
    const nextColor = TEAM_PRESET_COLORS[(colorIndex + 1) % TEAM_PRESET_COLORS.length];
    onChange(teams.map((t, i) => (i === index ? { ...t, color: nextColor } : t)));
  };

  return (
    <div>
      {teams.map((team, index) => (
        <div key={index} className="flex flex-row items-center mb-3">
          {/* Color dot — click to cycle */}
          <button
            onClick={() => cycleColor(index)}
            className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ backgroundColor: team.color ?? '#3E3666' }}
          >
            <Palette size={16} color="#FFFFFF" />
          </button>

          {/* Name input */}
          <input
            type="text"
            value={team.name}
            onChange={e => updateName(index, e.target.value)}
            placeholder={`Équipe ${index + 1}`}
            maxLength={20}
            className="flex-1 bg-[#292349] rounded-xl px-4 py-3 text-white border border-[#3E3666] focus:outline-none focus:border-[#00D397] placeholder:text-white/25"
          />

          {/* Remove button */}
          <button
            onClick={() => removeTeam(index)}
            disabled={teams.length <= 2}
            className="w-10 h-10 rounded-xl flex items-center justify-center ml-3 flex-shrink-0 transition-colors"
            style={{ backgroundColor: teams.length <= 2 ? '#3E366640' : '#D5442F20' }}
          >
            <X size={16} color={teams.length <= 2 ? '#FFFFFF20' : '#D5442F'} />
          </button>
        </div>
      ))}

      {teams.length < 8 && (
        <button
          onClick={addTeam}
          className="w-full flex flex-row items-center justify-center py-3 rounded-xl border border-dashed border-[#3E3666] hover:bg-[#3E366620] transition-colors gap-2"
        >
          <Plus size={16} color="#FFFFFF60" />
          <span className="text-white/60 text-sm">Ajouter une équipe</span>
        </button>
      )}

      {teams.length < 2 && (
        <div className="mt-2 bg-[#D5442F10] rounded-xl p-3 border border-[#D5442F30] flex flex-row items-center gap-2">
          <AlertCircle size={14} color="#D5442F" />
          <span className="text-[#D5442F] text-xs">Minimum 2 équipes requises</span>
        </div>
      )}
    </div>
  );
}


export function SessionConfigForm({ onSuccess, roomId }: SessionConfigFormProps) {
  const router = useRouter();
  const [questionMode, setQuestionMode] = useState<QuestionMode>('AI');
  const [teams, setTeams] = useState<TeamRequest[]>(DEFAULT_TEAMS);
  const [config, setConfig] = useState<CreateSessionRequest>({
    debtAmount: 5,
    pointsPerCorrectAnswer: 5,
    questionsPerCategory: 5,
    maxPlayers: 20,
    isPrivate: false,
    isTeamMode: false,
    maxCategoriesPerPlayer: 3,
    buzzCountdownSeconds: 10,
    roomId,
    questionMode: 'AI',
  });

  const [error, setError] = useState<string | null>(null);
  const createSession = useBuzzStore((state) => state.createSession);
  const isCreating = useBuzzStore((state) => state.isCreating);

  const handleModeChange = (mode: QuestionMode) => {
    setQuestionMode(mode);
    setConfig((c) => ({ ...c, questionMode: mode }));
  };

  const handleCreate = async () => {
    setError(null);

    if (config.isTeamMode && teams.length < 2) {
      setError('Minimum 2 équipes requises en mode équipe.');
      return;
    }

    try {
      const finalConfig = config.isTeamMode ? { ...config, teams } : config;
      const result = await createSession(finalConfig);

      if (onSuccess) {
        onSuccess(result.sessionId, result.code);
      } else {
        router.push(`/session/${result.code}/lobby`);
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
  };

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4 flex flex-col gap-4">

        {/* Mode selector */}
        <div className="flex gap-3">
          <button
            onClick={() => handleModeChange('AI')}
            className={`flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${
              questionMode === 'AI'
                ? 'border-[#00D397] bg-[#00D39715]'
                : 'border-[#3E3666] bg-[#342D5B]'
            }`}
          >
            <Bot size={28} color={questionMode === 'AI' ? '#00D397' : '#FFFFFF40'} />
            <span className={`font-bold text-sm ${questionMode === 'AI' ? 'text-[#00D397]' : 'text-white/40'}`}>IA</span>
          </button>
          <button
            onClick={() => handleModeChange('MANUAL')}
            className={`flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${
              questionMode === 'MANUAL'
                ? 'border-[#FFD700] bg-[#FFD70015]'
                : 'border-[#3E3666] bg-[#342D5B]'
            }`}
          >
            <PenLine size={28} color={questionMode === 'MANUAL' ? '#FFD700' : '#FFFFFF40'} />
            <span className={`font-bold text-sm ${questionMode === 'MANUAL' ? 'text-[#FFD700]' : 'text-white/40'}`}>Manuel</span>
          </button>
        </div>

        {/* Params grid */}
        <div>
          <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-3">Paramètres du jeu</p>
          <div className="grid grid-cols-2 gap-3">
            {questionMode === 'AI' && (
              <StepperField
                label="Questions/cat."
                value={config.questionsPerCategory}
                min={2} max={15}
                onChange={(v) => setConfig((c) => ({ ...c, questionsPerCategory: v }))}
              />
            )}
            {questionMode === 'AI' && (
              <StepperField
                label="Catégories max"
                value={config.maxCategoriesPerPlayer}
                min={1} max={10}
                onChange={(v) => setConfig((c) => ({ ...c, maxCategoriesPerPlayer: v }))}
              />
            )}
            <StepperField
              label="Temps réponse"
              value={config.buzzCountdownSeconds ?? 10}
              suffix="s"
              min={5} max={60} step={5}
              onChange={(v) => setConfig((c) => ({ ...c, buzzCountdownSeconds: v }))}
            />
            <StepperField
              label="Dettes (pts)"
              value={config.debtAmount}
              min={0} max={50} step={5}
              onChange={(v) => setConfig((c) => ({ ...c, debtAmount: v }))}
            />
            <StepperField
              label="Points / réponse"
              value={config.pointsPerCorrectAnswer}
              min={1} max={50} step={5}
              onChange={(v) => setConfig((c) => ({ ...c, pointsPerCorrectAnswer: v }))}
            />
            <StepperField
              label="Nombre joueurs"
              value={config.maxPlayers}
              min={2} max={50}
              onChange={(v) => setConfig((c) => ({ ...c, maxPlayers: v }))}
            />
          </div>
        </div>

        {/* Mode équipe */}
        <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} color="#4A90D9" />
            <span className="text-white font-medium text-sm">Mode équipe</span>
          </div>
          <button
            role="switch"
            aria-checked={config.isTeamMode}
            onClick={() => setConfig((c) => ({ ...c, isTeamMode: !c.isTeamMode }))}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              config.isTeamMode ? 'bg-[#00D397]' : 'bg-[#3E3666]'
            }`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${config.isTeamMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Team Editor */}
        {config.isTeamMode && (
          <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-4">
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-3">Équipes</p>
            <TeamEditor teams={teams} onChange={setTeams} />
          </div>
        )}

        {/* Summary pill */}
        <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#00D39730] flex items-center justify-center">
                <Bot size={10} color="#00D397" />
              </div>
              <div className="w-5 h-5 rounded-full bg-[#4A90D930] flex items-center justify-center">
                <Users size={10} color="#4A90D9" />
              </div>
              <div className="w-5 h-5 rounded-full bg-[#FFD70030] flex items-center justify-center">
                <Target size={10} color="#FFD700" />
              </div>
            </div>
            <p className="text-white/60 text-xs flex-1">
              Quiz {questionMode === 'AI' ? 'IA' : 'Manuel'} • {config.maxPlayers} Joueurs
              {questionMode === 'AI' ? ` • ${config.questionsPerCategory} questions/cat` : ''}
            </p>
            <p className="text-[#00D397] text-xs font-bold">Session prête à démarrer</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30 flex items-center gap-3">
            <AlertCircle size={18} color="#EF4444" />
            <span className="text-red-400 text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex gap-3 px-4 py-4 border-t border-[#3E3666] bg-[#292349] shrink-0">
        <button
          onClick={() => {/* handled by parent modal close */}}
          className="flex flex-col items-center gap-1 px-5"
        >
          <div className="w-10 h-10 rounded-full bg-[#3E3666] flex items-center justify-center">
            <X size={20} color="#FFFFFF80" />
          </div>
          <span className="text-white/40 text-[10px] font-bold tracking-wider uppercase">Annuler</span>
        </button>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="flex-1 rounded-full py-4 flex items-center justify-center gap-2 transition-all active:scale-95"
          style={isCreating
            ? { background: '#3E3666' }
            : { background: 'linear-gradient(135deg, #00D397, #00B383)', boxShadow: '0 4px 20px rgba(0,211,151,0.35)' }
          }
        >
          {isCreating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span className="text-white font-bold text-base">Création...</span>
            </>
          ) : (
            <>
              <Plus size={20} color="#292349" strokeWidth={3} />
              <span className="text-[#292349] font-bold text-base tracking-wider uppercase">Créer la session</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
