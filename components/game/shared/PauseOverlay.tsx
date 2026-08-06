'use client';

interface PauseOverlayProps {
  isPaused: boolean;
  isManager: boolean;
  isPauseToggling: boolean;
  onResume: () => void;
}

export function PauseOverlay({
  isPaused,
  isManager,
  isPauseToggling,
  onResume,
}: PauseOverlayProps) {
  if (!isPaused) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-surface px-10 py-8 rounded-3xl border-2 border-energy flex flex-col items-center animate-in zoom-in-95 duration-200">
        <p className="text-energy font-bold text-3xl text-center">PAUSE</p>
        <p className="text-txt-60 text-center mt-3">
          Le jeu est en pause
        </p>

        {isManager && (
          <button
            onClick={onResume}
            disabled={isPauseToggling}
            className="mt-6 px-8 py-4 bg-accent rounded-2xl hover:bg-accent-d transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isPauseToggling && (
              <div className="w-4 h-4 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
            )}
            <span className="text-btn-fg font-bold text-lg">Reprendre</span>
          </button>
        )}
      </div>
    </div>
  );
}
