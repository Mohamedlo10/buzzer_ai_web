import { Crown, Zap, Users, Bot, Copy, Check, Share2, QrCode } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import type { PlayerResponse, UserResponse } from '~/types/api';

export interface LobbyHeroProps {
  currentPlayer?: PlayerResponse;
  user: UserResponse | null;
  avatarMap: Record<string, string | null>;
  isWithoutModerator: boolean;
  questionMode?: string;
  totalQuestions?: number;
  totalQuestionsEstimate: number;
  playersCount: number;
  maxPlayers: number;
  code: string;
  isCopied: boolean;
  onCopyCode: () => void;
  onShare: () => void;
  onShowQR: () => void;
  orbitronClass: string;
}

export function LobbyHero({
  currentPlayer,
  user,
  avatarMap,
  isWithoutModerator,
  questionMode,
  totalQuestions = 0,
  totalQuestionsEstimate,
  playersCount,
  maxPlayers,
  code,
  isCopied,
  onCopyCode,
  onShare,
  onShowQR,
  orbitronClass,
}: LobbyHeroProps) {
  return (
    <>
      {/* Hero */}
      <div className="text-center mt-4 mb-4 animate-[pop_0.5s_both]">
        <div className="inline-flex justify-center">
          <Avatar
            avatarUrl={currentPlayer?.userId ? (avatarMap[currentPlayer.userId] ?? currentPlayer.avatarUrl) : user?.avatarUrl}
            username={currentPlayer?.name ?? user?.username ?? 'Joueur'}
            size={74}
            borderColor="var(--primary)"
          />
        </div>
        <h2 className="text-txt text-[23px] font-bold mt-3">Tu es dans la partie !</h2>
        <p className="text-txt-60 text-sm mt-1">
          Salut <strong className="text-txt">{currentPlayer?.name ?? user?.username}</strong> — garde ton pouce prêt
        </p>
      </div>

      {/* Mode badges */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          isWithoutModerator ? 'bg-host/12 border-host/30 text-host' : 'bg-energy/12 border-energy/30 text-energy'
        }`}>
          <Crown size={12} />
          {isWithoutModerator ? 'Sans modérateur' : 'Avec modérateur'}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/12 border border-accent/30 text-accent">
          <Zap size={12} />
          {questionMode === 'MANUAL' ? `${totalQuestions} questions` : `~${totalQuestionsEstimate} questions`}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface border border-line text-txt-60">
          <Users size={12} />
          {playersCount}/{maxPlayers}
        </span>
      </div>

      {/* Règles mode Sprint */}
      {isWithoutModerator && (
        <div className="bg-host/10 border border-host/30 rounded-2xl p-3.5 mb-4 flex items-start gap-3">
          <Bot size={18} className="text-host shrink-0 mt-0.5" />
          <p className="text-txt text-xs leading-relaxed">
            <strong className="text-host">Mode Sprint :</strong> 1 seule phase pour lire l'énoncé et y répondre. Tous les joueurs répondent simultanément.
          </p>
        </div>
      )}

      {/* Share code */}
      <div className="bg-surface rounded-2xl border border-line p-3.5 mb-4">
        <p className={`${orbitronClass} text-accent text-3xl font-black tracking-[0.2em] text-center mb-3`}>{code}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCopyCode} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-2 border border-line text-txt text-sm font-semibold">
            {isCopied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
            {isCopied ? 'Copié' : 'Copier'}
          </button>
          <button type="button" onClick={onShare} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold">
            <Share2 size={14} />
            Partager
          </button>
          <button type="button" onClick={onShowQR} className="px-3 py-2.5 rounded-xl bg-energy/10 border border-energy/30">
            <QrCode size={16} className="text-energy" />
          </button>
        </div>
      </div>
    </>
  );
}
