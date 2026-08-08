'use client';

import type { ReactNode } from 'react';

import { palette } from '~/lib/theme/tokens';
import type { ConfirmTone } from '~/lib/ui/confirm';

/**
 * Boîte de confirmation — présentation seule, pilotée par `ConfirmHost`.
 *
 * ── Bug corrigé ──
 * Ce composant recevait une prop `confirmColor` et composait ses couleurs par
 * concaténation : `` `${confirmColor}18` `` pour obtenir une version à 9 %
 * d'opacité. Le procédé n'est valide que sur une couleur HEXADÉCIMALE — or les
 * trois sites d'appel passaient `var(--primary)`, `var(--bad)` et `var(--gold)`.
 * Le résultat, `var(--bad)18`, est du CSS invalide : le fond de l'icône, sa
 * bordure, et le fond, la bordure et la couleur du bouton de confirmation
 * n'étaient PAS rendus. Le bouton principal s'affichait donc sans aucune
 * signalétique, y compris sur les actions destructrices.
 *
 * `tone` remplace `confirmColor` : une intention, pas une chaîne CSS. Les
 * couleurs viennent de la palette sous forme hexadécimale, ce qui rend la
 * concaténation alpha valide — et le tout portable en React Native, où
 * `var(--x)` n'existe pas.
 */

const TONE: Record<ConfirmTone, string> = {
  default: palette.primary,
  danger: palette.bad,
  warning: palette.gold,
};

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'default',
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  // Suffixes alpha en hexadécimal : 18 ≈ 9 %, 30 ≈ 19 %, 60 ≈ 38 %.
  const color = TONE[tone];

  return (
    <div
      className="fixed inset-0 bg-scrim flex items-center justify-center z-[100] p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[340px] rounded-3xl bg-surface border border-line overflow-hidden shadow-2xl animate-[pop_.3s_ease-out_both]"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="px-[22px] pt-[22px] pb-4 flex flex-col items-center text-center border-b border-line">
          {icon && (
            <div
              className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center mb-3.5"
              style={{
                background: `${color}18`,
                border: `1px solid ${color}30`,
              }}
            >
              {icon}
            </div>
          )}
          <p className="text-txt font-bold text-[17px] tracking-wide">{title}</p>
        </div>

        <div className="px-[22px] py-4 pb-5">
          <p className="text-txt-60 text-sm leading-relaxed text-center">{message}</p>
        </div>

        <div className="flex gap-2.5 px-[18px] pb-[18px]">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-[14px] bg-surface-2 border border-line text-txt-60 font-semibold text-sm hover:bg-surface-2/80 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className="flex-1 py-3 rounded-[14px] font-bold text-sm transition-colors cursor-pointer"
            style={{
              background: `${color}18`,
              border: `1px solid ${color}60`,
              color,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
