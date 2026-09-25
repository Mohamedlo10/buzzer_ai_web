import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useConfirmStore, type ConfirmTone } from '@xalaat/core';

/**
 * Rend la confirmation demandée par `confirmAsync()`.
 *
 * Sans cet hôte, `confirmAsync()` ouvre une demande que personne n'affiche : la promesse ne se
 * résout jamais et le bouton qui l'a appelée semble mort — ni requête, ni toast. C'est ce qui
 * rendait muets Supprimer, Annuler et « Arrêter la génération » sur tout le back-office.
 *
 * Monté une seule fois dans `App`, hors du routeur : toutes les pages en profitent.
 */

// Variables CSS plutôt que la palette hexadécimale : la teinte passe par color-mix, qui
// accepte une var(), là où la concaténation d'un suffixe alpha produirait du CSS invalide.
const TONE: Record<ConfirmTone, string> = {
  default: 'var(--primary)',
  danger: 'var(--bad)',
  warning: 'var(--gold)',
};

const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export function ConfirmHost() {
  const pending = useConfirmStore((s) => s.pending);
  const settle = useConfirmStore((s) => s.settle);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, settle]);

  if (!pending) return null;

  const color = TONE[pending.tone ?? 'default'];

  return (
    <div
      // Remonter la boîte à chaque demande repart d'un état propre : deux confirmations
      // successives ne se fondent pas l'une dans l'autre.
      key={pending.id}
      className="fixed inset-0 bg-scrim flex items-center justify-center z-[100] p-6 backdrop-blur-sm"
      onClick={() => settle(false)}
    >
      <div
        className="w-full max-w-[360px] rounded-3xl bg-surface border border-line overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={pending.title}
      >
        <div className="px-[22px] pt-[22px] pb-4 flex flex-col items-center text-center border-b border-line">
          <div
            className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center mb-3.5"
            style={{ background: tint(color, 10), border: `1px solid ${tint(color, 20)}`, color }}
          >
            <AlertTriangle size={26} />
          </div>
          <p className="text-txt font-bold text-[17px]">{pending.title}</p>
        </div>

        <div className="px-[22px] py-4 pb-5">
          <p className="text-txt-60 text-sm leading-relaxed text-center">{pending.message}</p>
        </div>

        <div className="flex gap-2.5 px-[18px] pb-[18px]">
          <button
            type="button"
            onClick={() => settle(false)}
            className="flex-1 py-3 rounded-[14px] bg-surface-2 border border-line text-txt-60 font-semibold text-sm cursor-pointer"
          >
            {pending.cancelLabel ?? 'Annuler'}
          </button>
          <button
            type="button"
            onClick={() => settle(true)}
            autoFocus
            className="flex-1 py-3 rounded-[14px] font-bold text-sm cursor-pointer"
            style={{ background: tint(color, 10), border: `1px solid ${tint(color, 40)}`, color }}
          >
            {pending.confirmLabel ?? 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}
