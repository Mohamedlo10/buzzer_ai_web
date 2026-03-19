'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Gamepad2,
  Lock,
  Users,
  Zap,
  Target,
  Crown,
  AlertCircle,
  Sparkles,
  PenLine,
  Bot,
  Plus,
  X,
  Palette,
  Info,
  TrendingUp,
} from 'lucide-react';

import { Slider } from '~/components/ui/Slider';
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

// Config Section Component
function ConfigSection({
  icon: Icon,
  iconColor,
  title,
  children,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-4 mb-4">
      <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3E3666]">
          <div className="flex flex-row items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
              style={{ backgroundColor: iconColor + '20' }}
            >
              <Icon size={20} color={iconColor} />
            </div>
            <p className="text-white font-bold text-lg">{title}</p>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Option Toggle Component
function OptionToggle({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-row items-center justify-between py-3 border-b border-[#3E3666] last:border-b-0">
      <div className="flex flex-row items-center flex-1 mr-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={18} color="#FFFFFF" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-base">{title}</p>
          <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onValueChange(!value)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
          value ? 'bg-[#00D397]' : 'bg-[#3E3666]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Quick Select Button
function QuickSelect({
  options,
  value,
  onSelect,
}: {
  options: number[];
  value: number;
  onSelect: (val: number) => void;
}) {
  return (
    <div className="flex flex-row gap-2 mt-3 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`px-4 py-2 rounded-xl transition-colors ${
            value === opt
              ? 'bg-[#00D397]'
              : 'bg-[#3E3666] hover:bg-[#4E4676]'
          }`}
        >
          <span
            className={`font-semibold text-sm ${
              value === opt ? 'text-[#292349]' : 'text-white/70'
            }`}
          >
            {opt}
          </span>
        </button>
      ))}
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

const Q_LIMIT = 60;

function QuestionLimitIndicator({
  categories,
  questionsPerCat,
  maxPlayers,
}: {
  categories: number;
  questionsPerCat: number;
  maxPlayers: number;
}) {
  const total = categories * questionsPerCat * maxPlayers;
  const pct = Math.min((total / Q_LIMIT) * 100, 100);
  const isOver = total > Q_LIMIT;
  const isClose = total > Q_LIMIT * 0.7 && !isOver;

  const color = isOver ? '#D5442F' : isClose ? '#F39C12' : '#00D397';
  const bgColor = isOver ? '#D5442F15' : isClose ? '#F39C1215' : '#00D39715';
  const borderColor = isOver ? '#D5442F40' : isClose ? '#F39C1240' : '#3E3666';

  return (
    <div className="mx-4 mb-4">
      <div
        className="rounded-3xl border overflow-hidden transition-colors"
        style={{ backgroundColor: '#342D5B', borderColor }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#3E3666] flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: bgColor }}
          >
            <TrendingUp size={20} color={color} />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-base">Limite de questions</p>
            <p className="text-white/50 text-xs">Maximum 60 questions générées</p>
          </div>
          {/* Badge total */}
          <div
            className="px-3 py-1.5 rounded-xl flex-shrink-0"
            style={{ backgroundColor: bgColor }}
          >
            <span className="font-bold text-lg" style={{ color }}>
              <span className="text-sm font-normal text-white/40"> {Q_LIMIT}</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

export function SessionConfigForm({ onSuccess, roomId }: SessionConfigFormProps) {
  const router = useRouter();
  const [questionMode, setQuestionMode] = useState<QuestionMode>('AI');
  const [teams, setTeams] = useState<TeamRequest[]>(DEFAULT_TEAMS);
  const [config, setConfig] = useState<CreateSessionRequest>({
    debtAmount: 5,
    questionsPerCategory: 5,
    maxPlayers: 20,
    isPrivate: false,
    isTeamMode: false,
    maxCategoriesPerPlayer: 3,
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
    <div className="flex-1 overflow-y-auto">
      {/* Header Info */}
      <div className="mx-4 mt-5 mb-5">
        <div className="bg-[#342D5B] rounded-3xl p-6 border border-[#3E3666]">
          <div className="flex flex-row items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#00D39720] flex items-center justify-center mr-4 flex-shrink-0">
              <Sparkles size={24} color="#00D397" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-xl">Nouvelle Session</p>
              <p className="text-white/50 text-sm">Configurez les règles de votre partie</p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Mode Toggle */}
      <div className="mx-4 mb-4">
        <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#3E3666]">
            <div className="flex flex-row items-center">
              <div className="w-10 h-10 rounded-xl bg-[#9B59B620] flex items-center justify-center mr-3">
                <Sparkles size={20} color="#9B59B6" />
              </div>
              <p className="text-white font-bold text-lg">Mode de questions</p>
            </div>
          </div>
          <div className="p-4 flex flex-row gap-3">
            <button
              onClick={() => handleModeChange('AI')}
              className={`flex-1 p-4 flex flex-col items-center rounded-2xl border transition-colors ${
                questionMode === 'AI'
                  ? 'bg-[#00D39720] border-[#00D397]'
                  : 'bg-[#3E3666] border-transparent hover:bg-[#4E4676]'
              }`}
            >
              <Bot size={24} color={questionMode === 'AI' ? '#00D397' : '#FFFFFF60'} />
              <span className={`font-bold text-sm mt-2 ${questionMode === 'AI' ? 'text-[#00D397]' : 'text-white/60'}`}>
                IA
              </span>
              <span className="text-white/40 text-xs text-center mt-1">Générées automatiquement</span>
            </button>
            <button
              onClick={() => handleModeChange('MANUAL')}
              className={`flex-1 p-4 flex flex-col items-center rounded-2xl border transition-colors ${
                questionMode === 'MANUAL'
                  ? 'bg-[#FFD70020] border-[#FFD700]'
                  : 'bg-[#3E3666] border-transparent hover:bg-[#4E4676]'
              }`}
            >
              <PenLine size={24} color={questionMode === 'MANUAL' ? '#FFD700' : '#FFFFFF60'} />
              <span className={`font-bold text-sm mt-2 ${questionMode === 'MANUAL' ? 'text-[#FFD700]' : 'text-white/60'}`}>
                Manuel
              </span>
              <span className="text-white/40 text-xs text-center mt-1">Vous saisissez les questions</span>
            </button>
          </div>
          {questionMode === 'MANUAL' && (
            <div className="px-5 pb-4">
              <div className="bg-[#FFD70010] rounded-xl p-3 border border-[#FFD70030] flex flex-row items-center gap-2">
                <PenLine size={14} color="#FFD700" />
                <span className="text-[#FFD700] text-xs flex-1">
                  Vous pourrez saisir vos questions dans le lobby avant de démarrer.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <ConfigSection icon={Trophy} iconColor="#FFD700" title="Configuration">
        {/* Debt Amount */}
        <div className="mb-3">
          <div className="flex flex-row items-center justify-between mb-3">
            <div className="flex flex-row items-center gap-2">
              <Target size={16} color="#FFFFFF80" />
              <span className="text-white/80 text-sm font-medium">Montant des dettes</span>
            </div>
            <div className="bg-[#00D39720] px-3 py-1.5 rounded-xl">
              <span className="text-[#00D397] font-bold text-lg">{config.debtAmount} pts</span>
            </div>
          </div>
          <Slider
            label=""
            value={config.debtAmount}
            onValueChange={(value) => setConfig((c) => ({ ...c, debtAmount: value }))}
            min={1}
            max={20}
            suffix=""
          />
          <QuickSelect
            options={[5, 10, 15, 20]}
            value={config.debtAmount}
            onSelect={(val) => setConfig((c) => ({ ...c, debtAmount: val }))}
          />
        </div>

        {/* Questions per category — AI mode only */}
        {questionMode === 'AI' && (
          <div className="mb-3">
            <div className="flex flex-row items-center justify-between mb-3">
              <div className="flex flex-row items-center gap-2">
                <Zap size={16} color="#FFFFFF80" />
                <span className="text-white/80 text-sm font-medium">Questions par catégorie</span>
              </div>
              <div className="bg-[#4A90D920] px-3 py-1.5 rounded-xl">
                <span className="text-[#4A90D9] font-bold text-lg">{config.questionsPerCategory}</span>
              </div>
            </div>
            <Slider
              label=""
              value={config.questionsPerCategory}
              onValueChange={(value) => setConfig((c) => ({ ...c, questionsPerCategory: value }))}
              min={3}
              max={15}
              suffix=""
            />
            <QuickSelect
              options={[5, 10, 15]}
              value={config.questionsPerCategory}
              onSelect={(val) => setConfig((c) => ({ ...c, questionsPerCategory: val }))}
            />
          </div>
        )}

        {/* Max Players */}
        <div className="mb-3">
          <div className="flex flex-row items-center justify-between mb-3">
            <div className="flex flex-row items-center gap-2">
              <Users size={16} color="#FFFFFF80" />
              <span className="text-white/80 text-sm font-medium">Joueurs maximum</span>
            </div>
            <div className="bg-[#FFD70020] px-3 py-1.5 rounded-xl">
              <span className="text-[#FFD700] font-bold text-lg">{config.maxPlayers}</span>
            </div>
          </div>
          <Slider
            label=""
            value={config.maxPlayers}
            onValueChange={(value) => setConfig((c) => ({ ...c, maxPlayers: value }))}
            min={2}
            max={50}
            suffix=""
          />
        </div>

        {/* Max Categories — AI mode only */}
        {questionMode === 'AI' && (
          <div>
            <div className="flex flex-row items-center justify-between mb-3">
              <div className="flex flex-row items-center gap-2">
                <Gamepad2 size={16} color="#FFFFFF80" />
                <span className="text-white/80 text-sm font-medium">Catégories max/joueur</span>
              </div>
              <div className="bg-[#C084FC20] px-3 py-1.5 rounded-xl">
                <span className="text-[#C084FC] font-bold text-lg">{config.maxCategoriesPerPlayer}</span>
              </div>
            </div>
            <Slider
              label=""
              value={config.maxCategoriesPerPlayer}
              onValueChange={(value) => setConfig((c) => ({ ...c, maxCategoriesPerPlayer: value }))}
              min={1}
              max={10}
              suffix=""
            />
            <QuickSelect
              options={[1, 2, 3, 5]}
              value={config.maxCategoriesPerPlayer}
              onSelect={(val) => setConfig((c) => ({ ...c, maxCategoriesPerPlayer: val }))}
            />
          </div>
        )}
      </ConfigSection>

      {/* Question Limit Indicator — AI mode only */}
      {questionMode === 'AI' && (
        <QuestionLimitIndicator
          categories={config.maxCategoriesPerPlayer}
          questionsPerCat={config.questionsPerCategory}
          maxPlayers={config.maxPlayers}
        />
      )}

      {/* Options Section */}
      <ConfigSection icon={Crown} iconColor="#00D397" title="Options de jeu">
        <OptionToggle
          icon={Lock}
          iconBg="#3E3666"
          title="Session privée"
          subtitle="Requiert le code pour rejoindre"
          value={config.isPrivate}
          onValueChange={(value) => setConfig((c) => ({ ...c, isPrivate: value }))}
        />
        <OptionToggle
          icon={Users}
          iconBg="#4A90D920"
          title="Mode équipe"
          subtitle="Scores cumulés par équipe"
          value={config.isTeamMode}
          onValueChange={(value) => setConfig((c) => ({ ...c, isTeamMode: value }))}
        />
      </ConfigSection>

      {/* Team Editor — visible when isTeamMode is on */}
      {config.isTeamMode && (
        <ConfigSection icon={Users} iconColor="#4A90D9" title="Équipes">
          <TeamEditor teams={teams} onChange={setTeams} />
        </ConfigSection>
      )}

      {/* Summary Card */}
      <div className="mx-4 mb-4">
        <div className="bg-[#292349] rounded-2xl border border-[#3E3666] p-4">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Résumé</p>
          <div className="flex flex-row flex-wrap gap-2">
            <div className="bg-[#342D5B] px-3 py-2 rounded-xl flex flex-row items-center gap-2">
              <Target size={14} color="#00D397" />
              <span className="text-white text-sm">{config.debtAmount} pts dette</span>
            </div>
            {questionMode === 'AI' && (
              <div className="bg-[#342D5B] px-3 py-2 rounded-xl flex flex-row items-center gap-2">
                <Zap size={14} color="#4A90D9" />
                <span className="text-white text-sm">{config.questionsPerCategory} Q/cat</span>
              </div>
            )}
            <div className="bg-[#342D5B] px-3 py-2 rounded-xl flex flex-row items-center gap-2">
              <Users size={14} color="#FFD700" />
              <span className="text-white text-sm">Max {config.maxPlayers}</span>
            </div>
            <div
              className={`px-3 py-2 rounded-xl flex flex-row items-center gap-2 ${
                questionMode === 'MANUAL' ? 'bg-[#FFD70020]' : 'bg-[#00D39720]'
              }`}
            >
              {questionMode === 'MANUAL' ? (
                <PenLine size={14} color="#FFD700" />
              ) : (
                <Bot size={14} color="#00D397" />
              )}
              <span
                className={`text-sm ${
                  questionMode === 'MANUAL' ? 'text-[#FFD700]' : 'text-[#00D397]'
                }`}
              >
                {questionMode === 'MANUAL' ? 'Manuel' : 'IA'}
              </span>
            </div>
            {config.isPrivate && (
              <div className="bg-[#00D39720] px-3 py-2 rounded-xl flex flex-row items-center gap-2">
                <Lock size={14} color="#00D397" />
                <span className="text-[#00D397] text-sm">Privée</span>
              </div>
            )}
            {config.isTeamMode && (
              <div className="bg-[#4A90D920] px-3 py-2 rounded-xl flex flex-row items-center gap-2">
                <Users size={14} color="#4A90D9" />
                <span className="text-[#4A90D9] text-sm">Équipe</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4">
          <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30 flex flex-row items-center gap-3">
            <AlertCircle size={20} color="#EF4444" />
            <span className="text-red-400 flex-1 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Create Button */}
      <div className="mx-4 mb-10">
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className={`w-full rounded-2xl py-4 px-6 flex flex-row items-center justify-center gap-2 transition-all ${
            isCreating
              ? 'bg-[#3E3666] cursor-not-allowed'
              : 'hover:opacity-90 active:opacity-80'
          }`}
          style={
            isCreating
              ? undefined
              : {
                  background: 'linear-gradient(to bottom, #00D397, #00B383)',
                  boxShadow: '0 4px 12px rgba(0,211,151,0.3)',
                }
          }
        >
          {isCreating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span className="text-white font-bold text-lg">Création...</span>
            </>
          ) : (
            <>
              <Sparkles size={22} color="#292349" />
              <span className="text-[#292349] font-bold text-lg">Créer la session</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
