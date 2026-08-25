'use client';

interface PauseOverlayProps {
  isPaused: boolean;
  isManager: boolean;
  isPauseToggling: boolean;
  onResume: () => void;
  onSkip?: () => void;
}

export function PauseOverlay({
  isPaused,
  isManager,
  isPauseToggling,
  onResume,
  onSkip,
}: PauseOverlayProps) {
  if (!isPaused) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-surface px-10 py-8 rounded-3xl border-2 border-energy flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200 min-w-[280px]">
        <p className="text-energy font-bold text-3xl text-center">PAUSE</p>
        <p className="text-txt-60 text-center">
          Le jeu est en pause
        </p>

        {isManager && (
          <div className="flex flex-col gap-2 w-full mt-4">
            <button
              onClick={onResume}
              disabled={isPauseToggling}
              className="w-full px-8 py-3 bg-accent rounded-2xl hover:bg-accent-d transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPauseToggling && (
                <div className="w-4 h-4 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
              )}
              <span className="text-btn-fg font-bold text-base">Reprendre</span>
            </button>

            {onSkip && (
              <button
                onClick={onSkip}
                disabled={isPauseToggling}
                className="w-full px-6 py-2.5 bg-surface-2 border border-line rounded-2xl hover:bg-surface-3 transition-colors text-energy text-sm font-semibold"
              >
                Passer la question
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
