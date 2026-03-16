'use client';

import { Play, Settings, UserPlus, LogOut, Crown } from 'lucide-react';

import { Card } from '~/components/ui/Card';

interface ManagerPanelProps {
  playerCount: number;
  minPlayers?: number;
  onStartGame: () => void;
  onInviteFriends?: () => void;
  onEditSettings?: () => void;
  onLeaveSession?: () => void;
  isStarting?: boolean;
}

export function ManagerPanel({
  playerCount,
  minPlayers = 2,
  onStartGame,
  onInviteFriends,
  onEditSettings,
  onLeaveSession,
  isStarting = false,
}: ManagerPanelProps) {
  const canStart = playerCount >= minPlayers;

  const handleStart = () => {
    if (!canStart) {
      window.alert(`Minimum ${minPlayers} joueurs requis pour démarrer (${playerCount} présent)`);
      return;
    }

    if (window.confirm('Démarrer la partie ? La génération des questions va commencer. Les joueurs ne pourront plus rejoindre.')) {
      onStartGame();
    }
  };

  const handleLeave = () => {
    if (window.confirm('Quitter la session ? Vous allez quitter cette session.')) {
      onLeaveSession?.();
    }
  };

  return (
    <Card className="mb-4 border border-[#FFD70040]">
      <div className="flex flex-row items-center mb-4">
        <Crown size={18} color="#FFD700" />
        <p className="text-white font-bold ml-2 flex-1">Contrôles Manager</p>
        <span className="text-white/60 text-sm">
          {playerCount} joueur{playerCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={isStarting}
        className={`w-full py-4 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
          isStarting
            ? 'bg-[#3E3666] cursor-not-allowed'
            : canStart
            ? 'bg-[#00D397] hover:bg-[#00B377]'
            : 'bg-[#3E3666] cursor-not-allowed'
        }`}
        style={canStart && !isStarting ? { boxShadow: '0 0 12px rgba(0,211,151,0.4)' } : undefined}
      >
        {isStarting ? (
          <span className="text-white/60 font-bold">Démarrage...</span>
        ) : (
          <div className="flex flex-row items-center gap-2">
            <Play size={20} color={canStart ? '#292349' : '#FFFFFF40'} />
            <span className={`font-bold text-lg ${canStart ? 'text-[#292349]' : 'text-white/40'}`}>
              Démarrer la partie
            </span>
          </div>
        )}
      </button>

      {!canStart && !isStarting && (
        <p className="text-[#D5442F] text-xs text-center mb-3">
          Minimum {minPlayers} joueurs requis
        </p>
      )}

      {/* Secondary Actions */}
      <div className="flex flex-row gap-2">
        {onInviteFriends && (
          <button
            onClick={onInviteFriends}
            className="flex-1 bg-[#3E3666] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4E4676] transition-colors"
          >
            <UserPlus size={16} color="#FFFFFF" />
            <span className="text-white font-medium text-sm">Inviter</span>
          </button>
        )}

        {onEditSettings && (
          <button
            onClick={onEditSettings}
            className="flex-1 bg-[#3E3666] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4E4676] transition-colors"
          >
            <Settings size={16} color="#FFFFFF" />
            <span className="text-white font-medium text-sm">Config</span>
          </button>
        )}

        {onLeaveSession && (
          <button
            onClick={handleLeave}
            className="flex-1 bg-[#D5442F20] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#D5442F40] transition-colors"
          >
            <LogOut size={16} color="#D5442F" />
            <span className="text-[#D5442F] font-medium text-sm">Quitter</span>
          </button>
        )}
      </div>
    </Card>
  );
}
