import { Palette, X, Plus, AlertCircle } from 'lucide-react';
import type { TeamRequest } from '~/types/api';
import {
  TEAM_COLOR_TOKENS,
  teamColor,
  teamColorByIndex,
  toTeamColorToken,
} from '~/lib/game/teamColors';

export function TeamEditor({
  teams,
  onChange,
}: {
  teams: TeamRequest[];
  onChange: (teams: TeamRequest[]) => void;
}) {
  const addTeam = () => {
    if (teams.length >= TEAM_COLOR_TOKENS.length) return;
    onChange([
      ...teams,
      { name: `Équipe ${teams.length + 1}`, color: teamColorByIndex(teams.length) },
    ]);
  };

  const removeTeam = (index: number) => {
    if (teams.length <= 2) return;
    onChange(teams.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    onChange(teams.map((t, i) => (i === index ? { ...t, name } : t)));
  };

  const cycleColor = (index: number) => {
    const current = toTeamColorToken(teams[index].color);
    const nextColor = teamColorByIndex(TEAM_COLOR_TOKENS.indexOf(current) + 1);
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
            style={{ backgroundColor: teamColor(team.color) }}
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
            className="flex-1 bg-bg rounded-xl px-4 py-3 text-txt border border-line focus:outline-none focus:border-accent placeholder:text-txt-25 text-[15px]"
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
                : 'color-mix(in srgb, var(--buzz, var(--bad)) 15%, transparent)',
              color: teams.length <= 2
                ? 'var(--txt-25)'
                : 'var(--buzz, var(--bad))',
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
            backgroundColor: 'color-mix(in srgb, var(--buzz, var(--bad)) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--buzz, var(--bad)) 28%, transparent)',
          }}
        >
          <AlertCircle size={14} style={{ color: 'var(--buzz, var(--bad))' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--buzz, var(--bad))' }}>
            Minimum 2 équipes requises
          </span>
        </div>
      )}
    </div>
  );
}
