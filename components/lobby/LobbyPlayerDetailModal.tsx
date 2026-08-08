import { Eye, Crown, X } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import type { PlayerResponse, TeamResponse } from '~/types/api';
import { teamColor, teamColorTint } from '~/lib/game/teamColors';

export interface LobbyPlayerDetailModalProps {
  player: PlayerResponse;
  currentUserId?: string;
  isManager: boolean;
  questionMode?: string;
  sessionMode?: string;
  teams: TeamResponse[];
  avatarMap: Record<string, string | null>;
  onClose: () => void;
  onViewStats: (userId: string) => void;
  onEditCategories: (player: PlayerResponse) => void;
  onKickPlayer: (playerId: string, playerName: string) => void;
  categoryEmojiMap: Record<string, string>;
}

export function LobbyPlayerDetailModal({
  player,
  currentUserId,
  isManager,
  questionMode,
  sessionMode,
  teams,
  avatarMap,
  onClose,
  onViewStats,
  onEditCategories,
  onKickPlayer,
  categoryEmojiMap,
}: LobbyPlayerDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-scrim flex items-end justify-center z-50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative rounded-t-3xl w-full max-w-[480px] bg-surface border-t border-line animate-[sheetup_.3s_ease-out_both] p-5 pb-8 z-10">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1.5 rounded-full bg-surface-2" />
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer text-txt-60"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <Avatar
            avatarUrl={player.userId ? (avatarMap[player.userId] ?? player.avatarUrl) : player.avatarUrl}
            username={player.name}
            size={72}
            borderColor={player.isManager ? 'var(--gold)' : player.userId === currentUserId ? 'var(--primary)' : undefined}
          />
          <h3 className="text-txt text-lg font-bold mt-3">{player.name}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            {player.isSpectator ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-energy/12 text-energy text-[10px] font-bold">
                <Eye size={10} />
                SPECTATEUR
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/12 text-accent text-[10px] font-bold">
                JOUEUR
              </span>
            )}
            {player.isManager && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-energy/12 text-energy text-[10px] font-bold">
                <Crown size={10} fill="var(--gold)" color="var(--gold)" />
                HOST
              </span>
            )}
            {player.teamId && (() => {
              const team = teams.find((t) => t.id === player.teamId);
              if (!team) return null;
              return (
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: teamColorTint(team.color, 20), color: teamColor(team.color) }}
                >
                  {team.name}
                </span>
              );
            })()}
          </div>
        </div>

        {!player.isSpectator && questionMode !== 'MANUAL' && (
          <div className="mb-6">
            <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-3 text-center">
              Catégories choisies pour cette partie
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {(player.selectedCategories ?? []).map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1.5 rounded-full bg-surface-2 border border-line text-txt text-sm font-medium flex items-center gap-1.5"
                >
                  <span>{categoryEmojiMap[cat] ?? '💡'}</span>
                  <span>{cat}</span>
                </span>
              ))}
              {(player.selectedCategories ?? []).length === 0 && (
                <p className="text-txt-40 text-sm italic py-2">Aucune catégorie sélectionnée</p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {player.userId && (
            <button
              type="button"
              onClick={() => {
                onViewStats(player.userId!);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-surface-2 border border-line text-txt font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Voir les statistiques globales
            </button>
          )}
          
          {isManager && player.userId !== currentUserId && (
            <div className="flex gap-2 mt-2 pt-2 border-t border-line">
              {questionMode !== 'MANUAL' && sessionMode === 'WITH_MODERATOR' && !player.isManager && (
                <button
                  type="button"
                  onClick={() => {
                    onEditCategories(player);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-host/12 text-host font-semibold text-sm border border-host/20"
                >
                  Modifier catégories
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onKickPlayer(player.id, player.name);
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-buzz/10 border border-buzz/30 text-buzz font-semibold text-sm"
              >
                Exclure du salon
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
