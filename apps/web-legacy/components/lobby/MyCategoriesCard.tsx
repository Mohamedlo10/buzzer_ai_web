import { Check } from 'lucide-react';
import type { PlayerResponse, SessionResponse } from '~/types/api';

export interface MyCategoriesCardProps {
  currentPlayer?: PlayerResponse;
  session?: SessionResponse | null;
  questionMode?: string;
  onEditCategories: () => void;
  reqOpen: boolean;
  setReqOpen: React.Dispatch<React.SetStateAction<boolean>>;
  reqSent: boolean;
  reqText: string;
  setReqText: (text: string) => void;
  onSendCategoryRequest: () => void;
  categoryEmojiMap: Record<string, string>;
}

export function MyCategoriesCard({
  currentPlayer,
  session,
  questionMode,
  onEditCategories,
  reqOpen,
  setReqOpen,
  reqSent,
  reqText,
  setReqText,
  onSendCategoryRequest,
  categoryEmojiMap,
}: MyCategoriesCardProps) {
  if (currentPlayer?.isSpectator || questionMode === 'MANUAL') {
    return null;
  }

  const isManagerMode = session?.categorySelectionMode === 'MANAGER';
  const sessionThemes = session?.sessionCategories?.map((c) => c.name) ?? [];
  const selectedCategories = isManagerMode
    ? (sessionThemes.length > 0 ? sessionThemes : (currentPlayer?.selectedCategories ?? []))
    : (currentPlayer?.selectedCategories ?? []);

  return (
    <div className="bg-surface rounded-2xl border border-line p-3.5 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-host text-[10px] font-bold tracking-widest uppercase">
          {isManagerMode ? 'Thèmes imposés (par l’hôte)' : 'Mes catégories'}
        </span>
        {!isManagerMode && (
          <button
            type="button"
            onClick={onEditCategories}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-host/16 border border-host/30 text-host cursor-pointer"
          >
            ✎ Modifier
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {selectedCategories.map((cat) => (
          <span key={cat} className="px-2 py-1 rounded-full bg-bg border border-line text-txt text-xs">
            {categoryEmojiMap[cat] ? `${categoryEmojiMap[cat]} ` : ''}{cat}
          </span>
        ))}
        {selectedCategories.length === 0 && (
          <span className="text-txt-40 text-xs">
            {isManagerMode ? 'Aucun thème imposé configuré' : 'Aucune catégorie sélectionnée'}
          </span>
        )}
        {!isManagerMode && (
          <button
            type="button"
            onClick={() => setReqOpen((v) => !v)}
            className="px-2 py-1 rounded-full border border-dashed border-line text-txt-60 text-xs hover:bg-surface-2 transition-colors cursor-pointer"
          >
            + Demander
          </button>
        )}
      </div>
      {!isManagerMode && reqOpen && (
        <div className="mt-3 flex flex-col gap-2 animate-[rise_0.25s_both]">
          {reqSent ? (
            <div className="flex items-center gap-2 text-accent text-sm">
              <Check size={14} />
              Demande envoyée à l&apos;hôte
            </div>
          ) : (
            <>
              <input
                value={reqText}
                onChange={(e) => setReqText(e.target.value)}
                placeholder="Suggère une catégorie à l'hôte…"
                className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-txt text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                disabled={reqText.trim().length < 3}
                onClick={onSendCategoryRequest}
                className="w-full py-2.5 rounded-xl bg-accent text-btn-fg font-bold text-sm disabled:opacity-40 cursor-pointer"
              >
                Envoyer la demande
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
