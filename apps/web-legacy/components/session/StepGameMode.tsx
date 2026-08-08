import { Zap, User, Bot, Sparkles, PenLine, Users } from 'lucide-react';
import type { QuestionMode, SessionMode, CreateSessionRequest } from '~/types/api';
import { ModeCard } from './ModeCard';
import { ToggleRow } from './ToggleRow';

export interface StepGameModeProps {
  handleQuickStart: () => void;
  isCreating: boolean;
  sessionMode: SessionMode;
  setSessionMode: (mode: SessionMode) => void;
  questionMode: QuestionMode;
  handleModeChange: (mode: QuestionMode) => void;
  config: CreateSessionRequest;
  setConfig: React.Dispatch<React.SetStateAction<CreateSessionRequest>>;
}

export function StepGameMode({
  handleQuickStart,
  isCreating,
  sessionMode,
  setSessionMode,
  questionMode,
  handleModeChange,
  config,
  setConfig,
}: StepGameModeProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Quick Launch Banner */}
      <div className="bg-gradient-to-br from-accent/15 via-surface to-surface border border-accent/30 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Zap size={20} className="text-accent fill-current" />
          </div>
          <div>
            <p className="text-txt font-bold text-sm">Lancement Rapide</p>
            <p className="text-txt-60 text-xs">Paramètres recommandés (IA, 10s buzz, 5 questions)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleQuickStart}
          disabled={isCreating}
          className="w-full py-3 rounded-xl bg-accent hover:bg-accent-d text-btn-fg font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <Zap size={16} className="fill-current" />
              <span>Lancer directement ⚡</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-line" />
        <span className="text-txt-40 text-[10px] font-bold uppercase tracking-widest">Ou sur-mesure</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      {/* Modération */}
      <div className="flex flex-col">
        <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-3 leading-none">Modération</p>
        <div className="flex gap-3">
          <ModeCard
            label="Avec modérateur"
            sublabel="L'hôte valide les réponses"
            icon={<User size={26} className={sessionMode === 'WITH_MODERATOR' ? 'text-accent' : 'text-txt-40'} />}
            active={sessionMode === 'WITH_MODERATOR'}
            accent="var(--primary)"
            onClick={() => {
              setSessionMode('WITH_MODERATOR');
              setConfig(c => ({ ...c, debtAmount: 5 }));
            }}
          />
          <ModeCard
            label="Sprint ⚡"
            sublabel="Tous répondent en même temps"
            icon={<Bot size={26} className={sessionMode === 'WITHOUT_MODERATOR' ? 'text-host' : 'text-txt-40'} />}
            active={sessionMode === 'WITHOUT_MODERATOR'}
            accent="var(--violet)"
            onClick={() => {
              setSessionMode('WITHOUT_MODERATOR');
              setConfig(c => ({ ...c, isTeamMode: false, debtAmount: 1 }));
            }}
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
            icon={<Sparkles size={26} className={questionMode === 'AI' ? 'text-accent' : 'text-txt-40'} />}
            active={questionMode === 'AI'}
            accent="var(--primary)"
            onClick={() => handleModeChange('AI')}
          />
          <ModeCard
            label="Manuel"
            sublabel="Saisies dans le lobby"
            icon={<PenLine size={26} className={questionMode === 'MANUAL' ? 'text-energy' : 'text-txt-40'} />}
            active={questionMode === 'MANUAL'}
            accent="var(--gold)"
            onClick={() => handleModeChange('MANUAL')}
          />
        </div>
      </div>

      {/* Encart Manuel */}
      {questionMode === 'MANUAL' && (
        <div
          className="rounded-2xl p-4 border flex items-start gap-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--energy, var(--gold)) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--energy, var(--gold)) 30%, transparent)',
          }}
        >
          <PenLine size={18} className="text-energy shrink-0 mt-0.5" style={{ color: 'var(--energy, var(--gold))' }} />
          <p className="text-txt text-xs leading-relaxed">
            Vous pourrez saisir vos questions dans le lobby avant de démarrer la session.
          </p>
        </div>
      )}

      {/* Options */}
      {sessionMode !== 'WITHOUT_MODERATOR' && (
        <div className="flex flex-col">
          <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-3 leading-none">Format</p>
          <ToggleRow
            label="Mode équipes"
            sub="Les points sont partagés entre coéquipiers"
            icon={<Users size={16} className="text-team" style={{ color: 'var(--team, var(--indigo))' }} />}
            checked={config.isTeamMode}
            onChange={(v) => setConfig((c) => ({ ...c, isTeamMode: v }))}
            accent="var(--team, var(--indigo))"
          />
        </div>
      )}

      {/* Encart Sans Modérateur */}
      {sessionMode === 'WITHOUT_MODERATOR' && (
        <div
          className="rounded-2xl p-4 border flex items-start gap-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--host, var(--violet)) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--host, var(--violet)) 30%, transparent)',
          }}
        >
          <Bot size={18} className="text-host shrink-0 mt-0.5" style={{ color: 'var(--host, var(--violet))' }} />
          <p className="text-txt text-xs leading-relaxed">
            Questions affichées entièrement · réponses automatisées · buzz immédiat.
          </p>
        </div>
      )}
    </div>
  );
}
