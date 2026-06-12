'use client';

import { useState, useEffect } from 'react';
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
  User,
  ArrowLeft,
  Sparkles,
  Award,
} from 'lucide-react';
import { useBuzzStore } from '~/stores/useBuzzStore';
import type { CreateSessionRequest, QuestionMode, SessionMode, TeamRequest } from '~/types/api';

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
  onClose?: () => void;
  roomId?: string;
  initialMaxPlayers?: number;
}

// StepBar segmented progress indicator
function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2 w-full">
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < step;
        return (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: isFilled ? '#00D397' : 'var(--surface-2)',
              opacity: isFilled ? 1 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}

// ModeCard visual selector
function ModeCard({
  icon,
  label,
  sublabel,
  active,
  accent = '#00D397',
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  accent?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[18px] border-2 p-4 text-left transition-all duration-180 flex flex-col justify-between h-[125px] shrink-0 ${
        active ? '' : 'border-line bg-surface'
      }`}
      style={{
        borderColor: active ? accent : 'var(--line)',
        backgroundColor: active
          ? `color-mix(in srgb, ${accent} 14%, var(--surface))`
          : 'var(--surface)',
      }}
    >
      <div
        className="w-[52px] h-[52px] rounded-[15px] flex items-center justify-center transition-all shrink-0 mb-2"
        style={{
          backgroundColor: active
            ? `color-mix(in srgb, ${accent} 22%, transparent)`
            : 'var(--surface-2)',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-[14.5px] font-bold transition-colors leading-tight"
          style={{ color: active ? accent : 'var(--txt)' }}
        >
          {label}
        </p>
        <p className="text-[11px] text-txt-40 mt-1 line-clamp-1">{sublabel}</p>
      </div>
    </button>
  );
}

// StepperField number input (- value +)
function StepperField({
  label,
  value,
  suffix = '',
  min,
  max,
  step = 1,
  onChange,
  accent = 'var(--accent, #00D397)',
}: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  accent?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col justify-between min-h-[92px]">
      <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-2 leading-none">{label}</p>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="w-9 h-9 rounded-full bg-surface-2 border border-line flex items-center justify-center text-txt text-lg font-bold hover:bg-surface-3 active:scale-95 transition-all shrink-0 disabled:opacity-[0.38] disabled:cursor-not-allowed"
        >
          −
        </button>
        <span
          className="font-bold text-[22px] flex-1 text-center font-mono leading-none"
          style={{ color: accent }}
        >
          {value}{suffix}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="w-9 h-9 rounded-full bg-surface-2 border border-line flex items-center justify-center text-txt text-lg font-bold hover:bg-surface-3 active:scale-95 transition-all shrink-0 disabled:opacity-[0.38] disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ToggleRow custom iOS switch row
function ToggleRow({
  icon,
  label,
  sub,
  checked,
  onChange,
  accent = 'var(--team, #4A90D9)',
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-[13px] px-[15px] flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-txt font-bold text-[14px] leading-tight">{label}</p>
          <p className="text-[11px] text-txt-40 mt-1 leading-tight">{sub}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-7 w-12 items-center rounded-[14px] transition-colors duration-200 shrink-0"
        style={{
          backgroundColor: checked ? accent : 'var(--surface-2)',
        }}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ChoiceStrip selection strip
function ChoiceStrip({
  label,
  value,
  options,
  onChange,
  accent = '#00D397',
}: {
  label: string;
  value: number | null;
  options: { label: string; value: number | null }[];
  onChange: (val: number | null) => void;
  accent?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col">
      <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-3 leading-none">{label}</p>
      <div className="flex gap-2">
        {options.map((opt, i) => {
          const isActive = value === opt.value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border"
              style={{
                borderColor: isActive ? accent : 'var(--line)',
                color: isActive ? accent : 'var(--txt-60)',
                backgroundColor: isActive
                  ? `color-mix(in srgb, ${accent} 16%, var(--surface))`
                  : 'var(--surface)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// TeamEditor team editor component
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
    <div className="flex flex-col gap-3">
      {teams.map((team, index) => (
        <div
          key={index}
          className="bg-surface rounded-2xl border border-line p-[12px] px-[13px] flex flex-row items-center gap-[11px]"
        >
          {/* Color selector - cycle color */}
          <button
            type="button"
            onClick={() => cycleColor(index)}
            className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0 transition-opacity hover:opacity-85"
            style={{ backgroundColor: team.color ?? 'var(--surface-2)' }}
          >
            <Palette size={17} className="text-white" />
          </button>

          {/* Name input */}
          <input
            type="text"
            value={team.name}
            onChange={e => updateName(index, e.target.value)}
            placeholder={`Équipe ${index + 1}`}
            maxLength={20}
            className="flex-1 bg-bg rounded-xl px-4 py-3 text-txt border border-line focus:outline-none focus:border-[#00D397] placeholder:text-txt-25 text-[15px]"
          />

          {/* Delete team button */}
          <button
            type="button"
            onClick={() => removeTeam(index)}
            disabled={teams.length <= 2}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
            style={{
              backgroundColor: teams.length <= 2
                ? 'var(--surface-2)'
                : 'color-mix(in srgb, var(--buzz, #D5442F) 15%, transparent)',
              color: teams.length <= 2
                ? 'var(--txt-25)'
                : 'var(--buzz, #D5442F)',
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {teams.length < 8 && (
        <button
          type="button"
          onClick={addTeam}
          className="w-full flex flex-row items-center justify-center py-3 rounded-xl border border-dashed border-line hover:bg-surface-2/30 transition-colors gap-2 text-txt-60"
        >
          <Plus size={16} />
          <span className="text-txt-60 text-sm">Ajouter une équipe</span>
        </button>
      )}

      {teams.length < 2 && (
        <div
          className="rounded-xl p-3 border flex flex-row items-center gap-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--buzz, #D5442F) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--buzz, #D5442F) 28%, transparent)',
          }}
        >
          <AlertCircle size={14} style={{ color: 'var(--buzz, #D5442F)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--buzz, #D5442F)' }}>
            Minimum 2 équipes requises
          </span>
        </div>
      )}
    </div>
  );
}

// SummaryTable row definition and component
interface SummaryRow {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  valueColor: string;
}

function SummaryTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden p-0 flex flex-col">
      {rows.map((row, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 ${
            i < rows.length - 1 ? 'border-b border-line' : ''
          }`}
        >
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `color-mix(in srgb, ${row.iconColor} 16%, var(--surface-2))`,
              color: row.iconColor,
            }}
          >
            {row.icon}
          </div>
          <span className="text-[13px] text-txt-60 flex-1">{row.label}</span>
          <span
            className="text-[13.5px] font-bold"
            style={{ color: row.valueColor }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Main SessionConfigForm Component
export function SessionConfigForm({ onSuccess, onClose, roomId, initialMaxPlayers }: SessionConfigFormProps) {
  const router = useRouter();

  // Wizard state variables
  const [currentStep, setCurrentStep] = useState(0);

  const [questionMode, setQuestionMode] = useState<QuestionMode>('AI');
  const [sessionMode, setSessionMode] = useState<SessionMode>('WITH_MODERATOR');
  const [answerTimeSeconds, setAnswerTimeSeconds] = useState(15);
  const [globalQuestionSeconds, setGlobalQuestionSeconds] = useState(30);
  const [answerChoicesCount, setAnswerChoicesCount] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamRequest[]>(DEFAULT_TEAMS);
  const [config, setConfig] = useState<CreateSessionRequest>({
    debtAmount: 0,
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

  const totalSteps = config.isTeamMode ? 4 : 3;

  // Sync back current step index if total steps collapses and user is out of bounds
  useEffect(() => {
    if (currentStep >= totalSteps) {
      setCurrentStep(totalSteps - 1);
    }
  }, [totalSteps, currentStep]);

  const handleModeChange = (mode: QuestionMode) => {
    setQuestionMode(mode);
    setConfig((c) => ({ ...c, questionMode: mode }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const getStepName = () => {
    if (currentStep === 0) return 'Mode de jeu';
    if (currentStep === 1) return 'Réglages';
    if (currentStep === 2) {
      return config.isTeamMode ? 'Équipes' : 'Récapitulatif';
    }
    return 'Récapitulatif';
  };

  const handleCreate = async () => {
    setError(null);

    if (config.isTeamMode && teams.length < 2) {
      setError('Minimum 2 équipes requises en mode équipe.');
      return;
    }

    try {
      const withoutModeratorExtras = sessionMode === 'WITHOUT_MODERATOR'
        ? { answerTimeSeconds, globalQuestionSeconds, answerChoicesCount }
        : {};
      const finalConfig = config.isTeamMode
        ? { ...config, sessionMode, ...withoutModeratorExtras, teams }
        : { ...config, sessionMode, ...withoutModeratorExtras };
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

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Step render functions
  const renderStep1 = () => {
    return (
      <div className="flex flex-col gap-5">
        {/* Modération */}
        <div className="flex flex-col">
          <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-3 leading-none">Modération</p>
          <div className="flex gap-3">
            <ModeCard
              label="Avec modérateur"
              sublabel="L'hôte valide les réponses"
              icon={<User size={26} className={sessionMode === 'WITH_MODERATOR' ? 'text-[#00D397]' : 'text-txt-40'} />}
              active={sessionMode === 'WITH_MODERATOR'}
              accent="#00D397"
              onClick={() => setSessionMode('WITH_MODERATOR')}
            />
            <ModeCard
              label="Sans modérateur"
              sublabel="Réponses automatiques"
              icon={<Bot size={26} className={sessionMode === 'WITHOUT_MODERATOR' ? 'text-[#8B5CF6]' : 'text-txt-40'} />}
              active={sessionMode === 'WITHOUT_MODERATOR'}
              accent="#8B5CF6"
              onClick={() => setSessionMode('WITHOUT_MODERATOR')}
            />
          </div>
        </div>

        {/* Source des questions */}
        <div className="flex flex-col">
          <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-3 leading-none">Source des questions</p>
          <div className="flex gap-3">
            <ModeCard
              label="IA"
              sublabel="Générées par l'IA"
              icon={<Sparkles size={26} className={questionMode === 'AI' ? 'text-[#00D397]' : 'text-txt-40'} />}
              active={questionMode === 'AI'}
              accent="#00D397"
              onClick={() => handleModeChange('AI')}
            />
            <ModeCard
              label="Manuel"
              sublabel="Saisies dans le lobby"
              icon={<PenLine size={26} className={questionMode === 'MANUAL' ? 'text-[#FFD700]' : 'text-txt-40'} />}
              active={questionMode === 'MANUAL'}
              accent="#FFD700"
              onClick={() => handleModeChange('MANUAL')}
            />
          </div>
        </div>

        {/* Encart Manuel */}
        {questionMode === 'MANUAL' && (
          <div
            className="rounded-2xl p-4 border flex items-start gap-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--energy, #FFD700) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--energy, #FFD700) 30%, transparent)',
            }}
          >
            <PenLine size={18} className="text-energy shrink-0 mt-0.5" style={{ color: 'var(--energy, #FFD700)' }} />
            <p className="text-txt text-xs leading-relaxed">
              Vous pourrez saisir vos questions dans le lobby avant de démarrer la session.
            </p>
          </div>
        )}

        {/* Options */}
        <div className="flex flex-col">
          <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-3 leading-none">Format</p>
          <ToggleRow
            label="Mode équipes"
            sub="Les points sont partagés entre coéquipiers"
            icon={<Users size={16} className="text-team" style={{ color: 'var(--team, #4A90D9)' }} />}
            checked={config.isTeamMode}
            onChange={(v) => setConfig((c) => ({ ...c, isTeamMode: v }))}
            accent="var(--team, #4A90D9)"
          />
        </div>

        {/* Encart Sans Modérateur */}
        {sessionMode === 'WITHOUT_MODERATOR' && (
          <div
            className="rounded-2xl p-4 border flex items-start gap-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--host, #8B5CF6) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--host, #8B5CF6) 30%, transparent)',
            }}
          >
            <Bot size={18} className="text-host shrink-0 mt-0.5" style={{ color: 'var(--host, #8B5CF6)' }} />
            <p className="text-txt text-xs leading-relaxed">
              Questions affichées entièrement · réponses automatisées · buzz immédiat.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="flex flex-col gap-5">
        {/* TIMERS SANS MODÉRATEUR */}
        {sessionMode === 'WITHOUT_MODERATOR' && (
          <div className="flex flex-col gap-3">
            <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-1 leading-none">Timers (Sans Modérateur)</p>
            <div className="grid grid-cols-2 gap-3">
              <StepperField
                label="Temps réponse"
                value={answerTimeSeconds}
                suffix="s"
                min={5}
                max={60}
                step={5}
                onChange={setAnswerTimeSeconds}
              />
              <StepperField
                label="Timer global"
                value={globalQuestionSeconds}
                suffix="s"
                min={15}
                max={120}
                step={5}
                onChange={setGlobalQuestionSeconds}
              />
            </div>
            
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
              accent="var(--accent, #00D397)"
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
            <StepperField
              label="Points / rép."
              value={config.pointsPerCorrectAnswer}
              min={1}
              max={50}
              step={5}
              onChange={(v) => setConfig((c) => ({ ...c, pointsPerCorrectAnswer: v }))}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="flex flex-col gap-5">
        <div
          className="rounded-2xl p-4 border flex items-start gap-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--team, #4A90D9) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--team, #4A90D9) 30%, transparent)',
          }}
        >
          <Users size={18} className="text-team shrink-0 mt-0.5" style={{ color: 'var(--team, #4A90D9)' }} />
          <p className="text-txt text-xs leading-relaxed">
            Minimum 2 équipes · maximum 8. Cliquez sur la pastille de couleur pour la changer, ou personnalisez le nom.
          </p>
        </div>

        <div className="flex flex-col">
          <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-3 leading-none">Équipes</p>
          <TeamEditor teams={teams} onChange={setTeams} />
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const recapRows: SummaryRow[] = [
      {
        label: 'Modération',
        value: sessionMode === 'WITH_MODERATOR' ? 'Avec modérateur' : 'Sans modérateur',
        icon: sessionMode === 'WITH_MODERATOR' ? <User size={16} /> : <Bot size={16} />,
        iconColor: sessionMode === 'WITH_MODERATOR' ? '#00D397' : '#8B5CF6',
        valueColor: sessionMode === 'WITH_MODERATOR' ? '#00D397' : '#8B5CF6',
      },
      {
        label: 'Source des questions',
        value: questionMode === 'AI' ? 'Générées par IA' : 'Saisie manuelle',
        icon: questionMode === 'AI' ? <Sparkles size={16} /> : <PenLine size={16} />,
        iconColor: questionMode === 'AI' ? '#00D397' : '#FFD700',
        valueColor: questionMode === 'AI' ? '#00D397' : '#FFD700',
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
        label: 'Timers de réponse',
        value: `Rép: ${answerTimeSeconds}s · Global: ${globalQuestionSeconds}s`,
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

    recapRows.push({
      label: 'Points par bonne réponse',
      value: `+${config.pointsPerCorrectAnswer} pts`,
      icon: <Award size={16} />,
      iconColor: 'var(--txt)',
      valueColor: 'var(--txt)',
    });

    recapRows.push({
      label: 'Format de la session',
      value: config.isTeamMode ? `Équipes (${teams.length})` : 'Solo',
      icon: <Users size={16} />,
      iconColor: config.isTeamMode ? '#4A90D9' : 'var(--txt)',
      valueColor: config.isTeamMode ? '#4A90D9' : 'var(--txt)',
    });

    return (
      <div className="flex flex-col gap-6">
        {/* Hero Banner */}
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-[68px] h-[68px] rounded-[22px] bg-gradient-to-br from-[#00D397] to-[#00B383] flex items-center justify-center shadow-[0_8px_24px_rgba(0,211,151,0.28)] animate-pulse mb-3 shrink-0">
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
              backgroundColor: 'color-mix(in srgb, var(--buzz, #D5442F) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--buzz, #D5442F) 30%, transparent)',
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
              backgroundColor: 'color-mix(in srgb, var(--buzz, #D5442F) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--buzz, #D5442F) 30%, transparent)',
            }}
          >
            <AlertCircle size={18} className="text-buzz shrink-0" style={{ color: 'var(--buzz)' }} />
            <span className="text-txt text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return config.isTeamMode ? renderStep3() : renderStep4();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };

  const getFooterButtonLabel = () => {
    if (isLastStep) {
      return isCreating ? 'Création...' : 'Créer la session';
    }
    if (currentStep === 0) {
      return 'Régler les paramètres';
    }
    if (currentStep === 1) {
      return config.isTeamMode ? 'Configurer les équipes' : 'Voir le récapitulatif';
    }
    if (currentStep === 2) {
      return 'Voir le récapitulatif';
    }
    return 'Suivant';
  };

  return (
    <div className="flex flex-col h-full bg-bg text-txt overflow-hidden relative">
      {/* Sticky Header */}
      <div className="bg-bg/85 backdrop-blur-md pt-5 pb-3 px-4 border-b border-line sticky top-0 z-10 flex flex-col gap-3 shrink-0">
        <div className="flex flex-row items-center justify-between">
          <button
            type="button"
            onClick={isFirstStep ? (onClose || (() => router.back())) : handleBack}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors shrink-0"
          >
            {isFirstStep ? <X size={20} className="text-txt" /> : <ArrowLeft size={20} className="text-txt" />}
          </button>
          
          <div className="flex-1 text-center px-2">
            <h1 className="text-txt font-bold text-base leading-tight">Créer une session</h1>
            <p className="text-txt-40 text-xs mt-0.5 font-medium leading-none">
              {getStepName()} · Étape {currentStep + 1}/{totalSteps}
            </p>
          </div>

          <div className="w-10 flex justify-end">
            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 rounded-full bg-[#00D397] hover:bg-[#00B383] transition-colors flex items-center justify-center shrink-0 shadow-sm"
              >
                <span className="text-btn-fg text-xs font-bold whitespace-nowrap">Suivant</span>
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>
        </div>

        {/* Step progress bar */}
        <StepBar step={currentStep + 1} total={totalSteps} />
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {renderStepContent()}
      </div>

      {/* Fixed Footer */}
      <div className="bg-bg border-t border-line px-4 py-4 sticky bottom-16 z-10 flex gap-3 items-center shrink-0">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="w-12 h-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center hover:bg-surface-3 active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft size={20} className="text-txt" />
          </button>
        )}
        
        <button
          type="button"
          onClick={isLastStep ? handleCreate : handleNext}
          disabled={isLastStep ? (isCreating || (config.isTeamMode && teams.length < 2)) : false}
          className={`flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            isLastStep
              ? isCreating
                ? 'bg-surface-2 cursor-not-allowed'
                : (config.isTeamMode && teams.length < 2)
                ? 'bg-surface-2 opacity-50 cursor-not-allowed text-txt-40'
                : 'bg-gradient-to-br from-[#00D397] to-[#00B383] shadow-[0_4px_20px_rgba(0,211,151,0.25)] hover:opacity-95'
              : 'bg-gradient-to-br from-[#00D397] to-[#00B383] shadow-[0_4px_20px_rgba(0,211,151,0.25)] hover:opacity-95'
          }`}
        >
          {isLastStep ? (
            isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-txt-40 border-t-txt rounded-full animate-spin" />
                <span className="text-txt font-bold text-base">Création...</span>
              </>
            ) : (
              <>
                <Zap size={20} className="text-btn-fg fill-current" />
                <span className="text-btn-fg font-bold text-base">{getFooterButtonLabel()}</span>
              </>
            )
          ) : (
            <>
              <span className="text-btn-fg font-bold text-base">
                {getFooterButtonLabel()}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
