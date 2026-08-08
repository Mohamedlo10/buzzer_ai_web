import { Trash2, Clock, Sparkles, Crown, Play } from 'lucide-react';
import { useAuthStore } from '~/stores/useAuthStore';
import { Avatar } from '~/components/shared/Avatar';
import type { RoomSessionResponse } from '~/types/api';
import { STATUS_CONFIG } from './STATUS_CONFIG';

export function ActiveSessionCard({
  session,
  members = [],
  onPress,
  onDelete,
  canDelete,
  isOwner,
}: {
  session: RoomSessionResponse;
  members?: Array<{ userId: string; username: string; avatarUrl?: string | null }>;
  onPress: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  isOwner?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.LOBBY;
  const isLobby = session.status === 'LOBBY';
  const isReady = isLobby && session.playerCount >= 2;

  // Human readable title
  const sessionTitle = `Quiz Général — Session #${session.code}`;

  // Avatars overlay of members
  const memberAvatars = members.slice(0, 4);
  const extraCount = Math.max(0, session.playerCount - memberAvatars.length);
  const fillPct = Math.min(100, Math.round((session.playerCount / Math.max(1, session.maxPlayers)) * 100));

  return (
    <div className="mb-4">
      <div
        className="bg-surface rounded-3xl border border-line overflow-hidden cursor-pointer shadow-lg hover:border-accent/40 transition-all group"
        onClick={onPress}
      >
        {/* Top Ticket Header Bar */}
        <div
          className="px-5 py-3.5 flex items-center justify-between border-b border-line/60"
          style={{ background: `linear-gradient(135deg, ${config.bg}, transparent)` }}
        >
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isReady ? 'bg-accent animate-ping' : isLobby ? 'bg-accent' : 'bg-gold animate-pulse'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.color }}>
              {isReady ? '⚡ PRÊT À DÉMARRER' : isLobby ? '🟢 SALON OUVERT' : config.label}
            </span>
          </div>

          {/* Discrete Trash Button */}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-8 h-8 rounded-full bg-buzz/10 hover:bg-buzz/25 text-buzz flex items-center justify-center transition-colors cursor-pointer"
              title="Supprimer la session"
            >
              <Trash2 size={15} color="var(--bad)" />
            </button>
          )}
        </div>

        {/* Main Ticket Content */}
        <div className="p-5">
          {/* Title & Host */}
          <div className="mb-3">
            <h3 className="text-txt font-display font-bold text-lg leading-tight group-hover:text-accent transition-colors">
              {sessionTitle}
            </h3>
            <p className="text-txt-60 text-xs mt-1">
              Créé par <strong className="text-txt font-semibold">{session.managerName}</strong>
            </p>
          </div>

          {/* Rule Summary Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-2 border border-line text-txt-60 text-xs font-semibold">
              <Clock size={12} className="text-accent" />
              10s / quest.
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-2 border border-line text-txt-60 text-xs font-semibold">
              <Sparkles size={12} className="text-gold" />
              IA Sur mesure
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-2 border border-line text-txt-60 text-xs font-semibold">
              <Crown size={12} className="text-energy" />
              Avec modérateur
            </span>
          </div>

          {/* Connected Players Stack & Progress Bar */}
          <div className="bg-bg/60 rounded-2xl p-3 border border-line/60 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-txt-40 text-[11px] font-bold uppercase tracking-wider">
                Joueurs connectés ({session.playerCount}/{session.maxPlayers})
              </span>
              <span className="text-txt-60 text-xs font-bold">{fillPct}%</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* Avatars Stack */}
              <div className="flex items-center -space-x-2 shrink-0">
                {memberAvatars.length > 0 ? (
                  memberAvatars.map((m, idx) => (
                    <div key={m.userId || idx} className="relative rounded-full border-2 border-surface bg-surface">
                      <Avatar avatarUrl={m.avatarUrl} name={m.username} size={28} />
                    </div>
                  ))
                ) : (
                  <div className="w-7 h-7 rounded-full bg-surface-2 border border-line flex items-center justify-center text-xs">
                    👤
                  </div>
                )}
                {extraCount > 0 && (
                  <div className="w-7 h-7 rounded-full bg-surface-2 border border-line text-txt text-[10px] font-bold flex items-center justify-center shrink-0">
                    +{extraCount}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-gold rounded-full transition-all duration-300"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPress();
            }}
            className="w-full py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 bg-accent hover:bg-accent-d text-btn-fg font-bold text-base shadow-glow-success transition-all cursor-pointer"
          >
            <Play size={18} className="fill-current text-btn-fg" />
            <span>
              {isOwner || session.managerId === user?.id
                ? (isLobby ? `🚀 LANCER LA PARTIE (${session.playerCount}/${session.maxPlayers})` : '⚡ REPRENDRE LA SESSION')
                : (isLobby ? '✅ REJOINDRE LE SALON' : 'Voir la partie')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
