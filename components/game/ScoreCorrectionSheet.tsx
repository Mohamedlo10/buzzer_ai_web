'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from '~/components/ui/Avatar';
import { useBuzzStore } from '~/stores/useBuzzStore';
import * as gameApi from '~/lib/api/game';
import type { PlayerResponse } from '~/types/api';

interface ScoreCorrectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerResponse[];
  sessionId: string;
  currentUserId?: string;
}

export function ScoreCorrectionSheet({
  isOpen,
  onClose,
  players,
  sessionId,
  currentUserId,
}: ScoreCorrectionSheetProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) setIsClosing(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
  };

  const handleAdjust = async (player: PlayerResponse, amount: number) => {
    const previousScore = player.score;
    const newScore = Math.max(0, player.score + amount);
    
    // 1. Optimistic Update of local Zustand store
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return { ...p, score: newScore };
      }
      return p;
    });
    useBuzzStore.setState({ players: updatedPlayers });

    // 2. Immediate feedback Toast
    const label = amount > 0 ? `+${amount}` : `${amount}`;
    if (amount > 0) {
      toast.success(`${player.name} ${label}`, {
        description: `Score mis à jour : ${newScore} pts`,
      });
    } else {
      toast.error(`${player.name} ${label}`, {
        description: `Score mis à jour : ${newScore} pts`,
      });
    }

    // 3. API Call to update database & broadcast to others
    try {
      await gameApi.scoreCorrection(sessionId, {
        playerId: player.id,
        amount: amount,
        reason: 'Correction manuelle du modérateur',
      });
    } catch (err) {
      // Rollback if failed
      const rolledBackPlayers = players.map((p) => {
        if (p.id === player.id) {
          return { ...p, score: previousScore };
        }
        return p;
      });
      useBuzzStore.setState({ players: rolledBackPlayers });
      toast.error(`Échec de la correction pour ${player.name}`, {
        description: 'Le score a été restauré.',
      });
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Scrim overlay */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-scrim backdrop-blur-sm ${
          isClosing ? 'animate-scrimout' : 'animate-scrimin'
        }`}
      />

      {/* Slide up sheet */}
      <div
        className={`relative w-full max-w-lg max-h-[85vh] bg-surface rounded-t-3xl border-t border-line overflow-hidden flex flex-col ${
          isClosing ? 'animate-sheetdown' : 'animate-sheetup'
        }`}
      >
        {/* Header drag-handle + close */}
        <div className="relative flex items-center justify-center pt-3.5 pb-2 shrink-0 border-b border-line">
          <div className="w-10 h-1.5 rounded-full bg-surface-2 mb-1" />
          <button
            onClick={handleClose}
            className="absolute right-4 top-3.5 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <X size={16} className="text-txt-60" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 pt-4 pb-8 flex-1">
          <h2 className="text-txt font-display font-semibold text-lg tracking-[-0.01em] mb-1">
            Corriger les scores
          </h2>
          <p className="text-txt-60 text-xs leading-relaxed mb-5">
            Ajuste manuellement les points d'un joueur (erreur d'arbitrage, bonus…).
          </p>

          <div className="flex flex-col gap-2.5">
            {sortedPlayers.map((player, index) => {
              const isYou = player.userId === currentUserId;
              const medalColor = index < 3 ? medalColors[index] : undefined;
              const isLeader = index === 0;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    isYou ? 'bg-accent/5 border-accent/20' : 'bg-surface-2/20 border-line'
                  }`}
                >
                  {/* Rank Badge */}
                  <span className="w-5 text-center font-display font-bold text-xs text-txt-40">
                    {index + 1}
                  </span>

                  {/* Avatar with leader indicator */}
                  <div className="relative">
                    <Avatar
                      avatarUrl={player.avatarUrl}
                      username={player.name}
                      size={44}
                      borderColor={medalColor || (isYou ? '#00D397' : undefined)}
                    />
                    {isLeader && (
                      <span className="absolute -top-1.5 -right-1.5 bg-energy text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                        👑
                      </span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isYou ? 'text-accent' : 'text-txt'}`}>
                      {player.name} {isYou && '(Vous)'}
                    </p>
                    <p className="font-display font-semibold text-xs text-txt-60 mt-0.5">
                      {player.score} <span className="text-txt-40 text-[10px]">pts</span>
                    </p>
                  </div>

                  {/* Adjustment Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* -100 */}
                    <button
                      onClick={() => handleAdjust(player, -100)}
                      className="min-w-[38px] px-1.5 py-1.5 rounded-lg border border-buzz/35 bg-buzz/14 hover:bg-buzz/25 transition-colors cursor-pointer text-center text-buzz font-display font-semibold text-[11px]"
                    >
                      -100
                    </button>
                    {/* -50 */}
                    <button
                      onClick={() => handleAdjust(player, -50)}
                      className="min-w-[38px] px-1.5 py-1.5 rounded-lg border border-buzz/30 bg-buzz/10 hover:bg-buzz/20 transition-colors cursor-pointer text-center text-buzz font-display font-semibold text-[11px]"
                    >
                      -50
                    </button>
                    {/* +50 */}
                    <button
                      onClick={() => handleAdjust(player, 50)}
                      className="min-w-[38px] px-1.5 py-1.5 rounded-lg border border-accent/30 bg-accent/10 hover:bg-accent/20 transition-colors cursor-pointer text-center text-accent font-display font-semibold text-[11px]"
                    >
                      +50
                    </button>
                    {/* +100 */}
                    <button
                      onClick={() => handleAdjust(player, 100)}
                      className="min-w-[38px] px-1.5 py-1.5 rounded-lg border border-accent/35 bg-accent/14 hover:bg-accent/25 transition-colors cursor-pointer text-center text-accent font-display font-semibold text-[11px]"
                    >
                      +100
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-xl bg-accent text-btn-fg font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Terminer la correction
          </button>
        </div>
      </div>
    </div>
  );
}
