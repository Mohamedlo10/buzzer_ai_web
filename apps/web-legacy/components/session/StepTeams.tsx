import { Users } from 'lucide-react';
import type { TeamRequest } from '~/types/api';
import { TeamEditor } from './TeamEditor';

export interface StepTeamsProps {
  teams: TeamRequest[];
  setTeams: (teams: TeamRequest[]) => void;
}

export function StepTeams({ teams, setTeams }: StepTeamsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-2xl p-4 border flex items-start gap-3"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--team, var(--indigo)) 10%, transparent)',
          borderColor: 'color-mix(in srgb, var(--team, var(--indigo)) 30%, transparent)',
        }}
      >
        <Users size={18} className="text-team shrink-0 mt-0.5" style={{ color: 'var(--team, var(--indigo))' }} />
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
}
