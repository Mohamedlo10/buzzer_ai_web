'use client';

import { useState } from 'react';
import { Check, X, SkipForward, RotateCcw, AlertCircle } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import type { PlayerResponse } from '~/types/api';

interface ManagerControlsProps {
  onValidate: (isCorrect: boolean) => void;
  onSkip: () => void;
  onResetBuzzer: () => void;
  onScoreCorrection?: (playerId: string, points: number, reason: string) => void;
  currentPlayerId?: string | null;
  players: PlayerResponse[];
  canResetBuzzer: boolean;
}

export function ManagerControls({
  onValidate,
  onSkip,
  onResetBuzzer,
  onScoreCorrection,
  currentPlayerId,
  players,
  canResetBuzzer,
}: ManagerControlsProps) {
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionPlayerId, setCorrectionPlayerId] = useState('');
  const [correctionPoints, setCorrectionPoints] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  const hasCurrentPlayer = !!currentPlayerId;

  const handleValidate = (isCorrect: boolean) => {
    const playerName = players.find(p => p.id === currentPlayerId)?.name;
    const message = isCorrect
      ? `Attribuer les points à ${playerName} ?`
      : 'Passer au joueur suivant dans la file ?';

    if (window.confirm(message)) {
      onValidate(isCorrect);
    }
  };

  const handleSkip = () => {
    if (window.confirm('Passer la question ? Aucun point ne sera attribué.')) {
      onSkip();
    }
  };

  const handleReset = () => {
    if (window.confirm('Réinitialiser le buzzer ? Tous les buzzes seront effacés. Les joueurs pourront re-buzzer.')) {
      onResetBuzzer();
    }
  };

  const handleCorrectionSubmit = () => {
    const points = parseInt(correctionPoints, 10);
    if (isNaN(points) || !correctionPlayerId) return;

    onScoreCorrection?.(correctionPlayerId, points, correctionReason);
    setShowCorrectionModal(false);
    setCorrectionPlayerId('');
    setCorrectionPoints('');
    setCorrectionReason('');
  };

  return (
    <>
      <Card className="mb-4 border border-[#FFD70040]">
        <div className="flex flex-row items-center mb-4">
          <AlertCircle size={18} color="#FFD700" className="mr-2" />
          <p className="text-white font-bold ml-2">Contrôles Manager</p>
        </div>

        {/* Main Actions */}
        <div className="flex flex-row gap-3 mb-4">
          {/* Validate - Green */}
          <button
            onClick={() => handleValidate(true)}
            disabled={!hasCurrentPlayer}
            className={`flex-1 py-4 rounded-xl flex flex-col items-center justify-center transition-colors ${
              hasCurrentPlayer
                ? 'bg-[#00D397] hover:bg-[#00B377] active:bg-[#00B377]'
                : 'bg-[#3E3666] opacity-50 cursor-not-allowed'
            }`}
          >
            <Check size={28} color={hasCurrentPlayer ? '#292349' : '#FFFFFF40'} />
            <span className={`font-bold mt-1 text-sm ${hasCurrentPlayer ? 'text-[#292349]' : 'text-white/40'}`}>
              Valider
            </span>
          </button>

          {/* Refuse - Red */}
          <button
            onClick={() => handleValidate(false)}
            disabled={!hasCurrentPlayer}
            className={`flex-1 py-4 rounded-xl flex flex-col items-center justify-center transition-colors ${
              hasCurrentPlayer
                ? 'bg-[#D5442F] hover:bg-[#B53320] active:bg-[#B53320]'
                : 'bg-[#3E3666] opacity-50 cursor-not-allowed'
            }`}
          >
            <X size={28} color={hasCurrentPlayer ? '#FFFFFF' : '#FFFFFF40'} />
            <span className={`font-bold mt-1 text-sm ${hasCurrentPlayer ? 'text-white' : 'text-white/40'}`}>
              Refuser
            </span>
          </button>

          {/* Skip - Amber */}
          <button
            onClick={handleSkip}
            className="flex-1 py-4 rounded-xl flex flex-col items-center justify-center bg-[#FFD700] hover:bg-[#E5C100] active:bg-[#E5C100] transition-colors"
          >
            <SkipForward size={28} color="#292349" />
            <span className="font-bold mt-1 text-sm text-[#292349]">Passer</span>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-row gap-2">
          <button
            onClick={handleReset}
            disabled={!canResetBuzzer}
            className={`flex-1 flex flex-row items-center justify-center py-3 rounded-xl gap-2 transition-colors ${
              canResetBuzzer
                ? 'bg-[#3E3666] hover:bg-[#4E4676]'
                : 'bg-[#3E3666]/50 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={16} color={canResetBuzzer ? '#FFFFFF' : '#FFFFFF40'} />
            <span className={canResetBuzzer ? 'text-white text-sm' : 'text-white/40 text-sm'}>
              Reset Buzzer
            </span>
          </button>

          {onScoreCorrection && (
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="flex-1 flex flex-row items-center justify-center py-3 rounded-xl gap-2 bg-[#3E3666] hover:bg-[#4E4676] transition-colors"
            >
              <AlertCircle size={16} color="#FFFFFF" />
              <span className="text-white text-sm">Correction</span>
            </button>
          )}
        </div>

        {!hasCurrentPlayer && (
          <p className="text-white/40 text-xs text-center mt-3">
            En attente d'un buzz...
          </p>
        )}
      </Card>

      {/* Score Correction Modal */}
      {showCorrectionModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          onClick={() => setShowCorrectionModal(false)}
        >
          <div
            className="bg-[#292349] rounded-t-3xl p-6 w-full max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white font-bold text-xl mb-4">Correction de score</p>

            {/* Player Selection */}
            <p className="text-white/60 text-sm mb-2">Joueur</p>
            <div className="bg-[#342D5B] rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setCorrectionPlayerId(player.id)}
                  className={`w-full text-left py-2 px-3 rounded-lg mb-1 transition-colors ${
                    correctionPlayerId === player.id ? 'bg-[#00D397]' : 'hover:bg-[#3E3666]'
                  }`}
                >
                  <span className={correctionPlayerId === player.id ? 'text-[#292349]' : 'text-white'}>
                    {player.name} ({player.score} pts)
                  </span>
                </button>
              ))}
            </div>

            {/* Points Input */}
            <p className="text-white/60 text-sm mb-2">Points (+ ou -)</p>
            <input
              type="number"
              value={correctionPoints}
              onChange={e => setCorrectionPoints(e.target.value)}
              placeholder="Ex: 5 ou -3"
              className="w-full bg-[#342D5B] rounded-xl px-4 py-3 text-white mb-4 border border-[#3E3666] focus:outline-none focus:border-[#00D397] placeholder:text-white/25"
            />

            {/* Reason Input */}
            <p className="text-white/60 text-sm mb-2">Raison (optionnel)</p>
            <input
              type="text"
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              placeholder="Pourquoi cette correction ?"
              className="w-full bg-[#342D5B] rounded-xl px-4 py-3 text-white mb-6 border border-[#3E3666] focus:outline-none focus:border-[#00D397] placeholder:text-white/25"
            />

            {/* Actions */}
            <div className="flex flex-row gap-3">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="flex-1 py-4 rounded-xl bg-[#3E3666] hover:bg-[#4E4676] text-white font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCorrectionSubmit}
                disabled={!correctionPlayerId || !correctionPoints}
                className={`flex-1 py-4 rounded-xl font-medium transition-colors ${
                  correctionPlayerId && correctionPoints
                    ? 'bg-[#00D397] hover:bg-[#00B377] text-[#292349]'
                    : 'bg-[#3E3666] text-white/40 cursor-not-allowed'
                }`}
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
