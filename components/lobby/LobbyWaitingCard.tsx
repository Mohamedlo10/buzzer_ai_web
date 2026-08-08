import { Crown } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import type { PlayerResponse } from '~/types/api';

export interface LobbyWaitingCardProps {
  isManager: boolean;
  managerPlayer?: PlayerResponse;
  currentPlayer?: PlayerResponse;
  questionMode?: string;
  onEditCategories: () => void;
  orbitronClass: string;
}

export function LobbyWaitingCard({
  isManager,
  managerPlayer,
  currentPlayer,
  questionMode,
  onEditCategories,
  orbitronClass,
}: LobbyWaitingCardProps) {
  if (isManager) return null;

  return (
    <div className="bg-surface rounded-2xl border border-buzz/25 p-4 mb-4 text-center relative overflow-hidden">
      <div className="flex justify-center gap-2 mb-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-buzz animate-pulse"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <p className={`${orbitronClass} text-txt text-lg font-bold tracking-wide`}>
        En attente <span className="text-buzz">du host</span>
      </p>
      {managerPlayer && (
        <div className="flex items-center justify-center gap-2.5 mt-3 p-2.5 rounded-xl bg-energy/10 border border-energy/25">
          <Crown size={16} className="text-energy" fill="var(--gold)" />
          <Avatar avatarUrl={managerPlayer.avatarUrl} username={managerPlayer.name} size={36} borderColor="var(--gold)" />
          <div className="text-left">
            <p className="text-energy font-bold text-sm">{managerPlayer.name}</p>
            <p className="text-txt-40 text-[10px] tracking-wider">HOST DE LA PARTIE</p>
          </div>
        </div>
      )}
      <p className="text-txt-60 text-xs mt-3">La partie démarre dès que le manager lance</p>
      {(currentPlayer?.selectedCategories?.length ?? 0) === 0 && !currentPlayer?.isSpectator && questionMode !== 'MANUAL' && (
        <button
          type="button"
          onClick={onEditCategories}
          className="w-full mt-3 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent font-bold text-sm cursor-pointer"
        >
          Choisir vos catégories
        </button>
      )}
    </div>
  );
}
