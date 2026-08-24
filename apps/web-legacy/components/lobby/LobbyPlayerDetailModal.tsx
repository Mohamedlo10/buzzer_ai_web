import { Eye, Crown, X } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import type { PlayerResponse, TeamResponse, CategorySelectionMode } from '~/types/api';
import { teamColor, teamColorTint } from '~/lib/game/teamColors';

export interface LobbyPlayerDetailModalProps {
  player: PlayerResponse;
  currentUserId?: string;
  isManager: boolean;
  questionMode?: string;
  sessionMode?: string;
  categorySelectionMode?: CategorySelectionMode;
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
  categorySelectionMode,
  teams,
  avatarMap,
  onClose,
  onViewStats,
  onEditCategories,
  onKickPlayer,
  categoryEmojiMap,
}: LobbyPlayerDetailModalProps) {
  const isMe = player.userId === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-sm bg-surface border border-line rounded-3xl p-6 shadow-2xl animate-[scaleUp_0.2s_ease-out]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-txt-40 hover:text-txt transition-colors rounded-full bg-surface-2"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            {player.isSpectator ? (
              <div className="w-16 h-16 rounded-full bg-energy/12 border-2 border-energy/40 flex items-center justify-center">
                <Eye size={24} className="text-energy" />
              </div>
            ) : (
              <Avatar
                avatarUrl={player.userId ? (avatarMap[player.userId] ?? player.avatarUrl) : player.avatarUrl}
                username={player.name}
                size={64}
                borderColor={player.isManager ? 'var(--gold)' : isMe ? 'var(--primary)' : undefined}
              />
            )}
            {player.isManager && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                <Crown size={16} fill="var(--gold)" color="var(--gold)" />
              </div>
            )}
          </div>

          <h3 className="text-lg font-bold text-txt">{player.name}</h3>

          <div className="flex items-center gap-1.5 mt-1.5">
            {player.isManager && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-host/15 text-host border border-host/30">
                Hôte
              </span>
            )}
            {player.isSpectator ? (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-energy/15 text-energy border border-energy/30">
                Spectateur
              </span>
            ) : (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                Joueur
              </span>
            )}
            {(() => {
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
              {questionMode !== 'MANUAL' && sessionMode === 'WITH_MODERATOR' && categorySelectionMode !== 'MANAGER' && !player.isManager && (
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
