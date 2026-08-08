import { Eye, Crown, Users, Trash2 } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import type { PlayerResponse } from '~/types/api';

export interface PlayerGridProps {
  players: PlayerResponse[];
  currentUserId?: string;
  isManager: boolean;
  questionMode?: string;
  sessionMode?: string;
  avatarMap: Record<string, string | null>;
  kickingPlayerId: string | null;
  onSelectPlayer: (player: PlayerResponse) => void;
  onEditCategories: (player: PlayerResponse) => void;
  onKickPlayer: (playerId: string, playerName: string) => void;
}

export function PlayerGrid({
  players,
  currentUserId,
  isManager,
  questionMode,
  sessionMode,
  avatarMap,
  kickingPlayerId,
  onSelectPlayer,
  onEditCategories,
  onKickPlayer,
}: PlayerGridProps) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-3.5 mb-4 flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-txt-40 text-[10px] font-bold tracking-widest uppercase">Joueurs connectés</span>
        <span className="px-2 py-0.5 rounded-full bg-surface-2 text-txt text-xs font-semibold">{players.length}</span>
      </div>

      {players.length > 0 ? (
        <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[280px]">
          {players.map((player) => {
            const isYou = player.userId === currentUserId;
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onSelectPlayer(player)}
                className="flex flex-col items-center gap-1.5 p-0 bg-transparent border-0 cursor-pointer animate-[pop_0.35s_both]"
              >
                <div className="relative">
                  {player.isSpectator ? (
                    <div className="w-[46px] h-[46px] rounded-full bg-energy/12 border-2 border-energy/40 flex items-center justify-center">
                      <Eye size={16} className="text-energy" />
                    </div>
                  ) : (
                    <Avatar
                      avatarUrl={player.userId ? (avatarMap[player.userId] ?? player.avatarUrl) : player.avatarUrl}
                      username={player.name}
                      size={46}
                      borderColor={player.isManager ? 'var(--gold)' : isYou ? 'var(--primary)' : undefined}
                    />
                  )}
                  {player.isManager && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                      <Crown size={11} fill="var(--gold)" color="var(--gold)" />
                    </div>
                  )}
                </div>
                <span className={`text-[11.5px] font-semibold w-full text-center truncate ${isYou ? 'text-txt' : 'text-txt-60'}`}>
                  {isYou ? 'Toi' : player.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-8 border border-dashed border-line rounded-xl">
          <Users size={28} className="text-txt-25" />
          <p className="text-txt-40 text-xs mt-2 tracking-wider">En attente de joueurs…</p>
        </div>
      )}

      {/* Manager player actions */}
      {isManager && players.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line flex flex-col gap-2">
          {players.filter((p) => p.userId !== currentUserId).map((player) => (
            <div key={`actions-${player.id}`} className="flex items-center gap-2">
              <span className="text-txt text-xs font-medium flex-1 truncate">{player.name}</span>
              {questionMode !== 'MANUAL' && sessionMode === 'WITH_MODERATOR' && !player.isManager && (
                <button type="button" onClick={() => onEditCategories(player)} className="px-2 py-1 rounded-lg bg-host/12 text-host text-[10px] font-semibold">
                  Catégories
                </button>
              )}
              <button
                type="button"
                onClick={() => onKickPlayer(player.id, player.name)}
                disabled={kickingPlayerId === player.id}
                className="w-7 h-7 rounded-lg bg-buzz/10 border border-buzz/25 flex items-center justify-center"
              >
                {kickingPlayerId === player.id ? (
                  <div className="w-3 h-3 border-2 border-buzz border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={12} className="text-buzz" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
