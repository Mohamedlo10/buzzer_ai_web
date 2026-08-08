'use client';

import { AlertTriangle } from 'lucide-react';

import { ConfirmModal } from '~/components/ui/ConfirmModal';
import { useConfirmStore } from '~/lib/ui/confirm';

/**
 * Rend la confirmation demandée par `confirmAsync()`.
 *
 * Monté une seule fois dans `AppProviders`, il est le pendant visuel du store
 * impératif : c'est ce qui permet d'appeler `confirmAsync()` depuis n'importe
 * où — y compris hors composant — sans faire redescendre un contexte.
 *
 * En phase 3, seul CE fichier change : `ConfirmModal` devient un `<Modal>` React
 * Native, et `lib/ui/confirm.ts` ainsi que les 17 sites d'appel restent
 * identiques.
 */
export function ConfirmHost() {
  const pending = useConfirmStore((s) => s.pending);
  const settle = useConfirmStore((s) => s.settle);

  if (!pending) return null;

  return (
    <ConfirmModal
      // Remonter la boîte à chaque demande relance l'animation d'entrée et
      // repart d'un état propre — sans ça, deux confirmations successives se
      // fondraient l'une dans l'autre.
      key={pending.id}
      open
      title={pending.title}
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
      tone={pending.tone}
      icon={<AlertTriangle size={26} className={pending.tone === 'danger' ? 'text-bad' : 'text-primary'} />}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
}
