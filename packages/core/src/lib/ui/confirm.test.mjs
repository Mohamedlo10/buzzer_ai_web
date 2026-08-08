/**
 * Tests du store de confirmation.
 *
 * Le risque propre à ce module n'est pas visuel : c'est une PROMESSE QUI NE SE
 * RÉSOUT JAMAIS. `confirmAsync` est attendu au milieu de handlers qui suspendent
 * ensuite leur exécution (`await`) — si la promesse reste en suspens, le
 * handler ne reprend jamais, l'action ne part pas, et aucune erreur n'est levée.
 * Rien dans l'interface ne le signale.
 *
 * `window.confirm` ne pouvait pas avoir ce défaut : il rendait toujours la main.
 * C'est le prix de la promisification, et c'est ce que ces tests couvrent.
 *
 * Lancement : `npm run test:confirm` — aucun navigateur.
 */

import assert from 'node:assert/strict';
import { confirmAsync, useConfirmStore } from './confirm.ts';

let checks = 0;
const ok = (fn) => {
  fn();
  checks++;
};

const reset = () => useConfirmStore.setState({ pending: null, resolve: null });
const options = (title = 'Titre') => ({ title, message: 'Message' });

// ─── 1. Résolution nominale ──────────────────────────────────────────────────
reset();
{
  const p = confirmAsync(options());
  ok(() => assert.ok(useConfirmStore.getState().pending, 'la demande doit être exposée à la vue'));
  ok(() => assert.equal(useConfirmStore.getState().pending.title, 'Titre'));

  useConfirmStore.getState().settle(true);
  assert.equal(await p, true);
  checks++;

  // L'état doit être purgé, sinon la boîte resterait affichée.
  ok(() => assert.equal(useConfirmStore.getState().pending, null));
  ok(() => assert.equal(useConfirmStore.getState().resolve, null));
}

// ─── 2. Annulation ───────────────────────────────────────────────────────────
reset();
{
  const p = confirmAsync(options());
  useConfirmStore.getState().settle(false);
  assert.equal(await p, false);
  checks++;
}

// ─── 3. Une demande qui en remplace une autre ne doit rien laisser pendre ────
// Cas réel : l'utilisateur déclenche deux actions à confirmer coup sur coup.
// Sans traitement explicite, la première promesse serait orpheline et son
// appelant resterait bloqué sur son `await` — définitivement.
reset();
{
  const first = confirmAsync(options('Première'));
  const second = confirmAsync(options('Seconde'));

  assert.equal(await first, false, 'la demande écartée doit se résoudre à false');
  checks++;

  ok(() => assert.equal(useConfirmStore.getState().pending.title, 'Seconde'));

  useConfirmStore.getState().settle(true);
  assert.equal(await second, true);
  checks++;
}

// ─── 4. `settle` sans demande en cours ne doit pas jeter ─────────────────────
// Peut arriver si l'hôte est démonté puis qu'un événement tardif arrive.
reset();
ok(() => useConfirmStore.getState().settle(true));
ok(() => assert.equal(useConfirmStore.getState().pending, null));

// ─── 5. Chaque demande a une identité distincte ──────────────────────────────
// `ConfirmHost` s'en sert comme `key` : sans elle, deux confirmations
// successives se fondraient l'une dans l'autre sans rejouer l'animation ni
// repartir d'un état propre.
reset();
{
  const a = confirmAsync(options('A'));
  const idA = useConfirmStore.getState().pending.id;
  useConfirmStore.getState().settle(false);
  await a;

  const b = confirmAsync(options('B'));
  const idB = useConfirmStore.getState().pending.id;
  useConfirmStore.getState().settle(false);
  await b;

  ok(() => assert.notEqual(idA, idB));
  checks++;
}

// ─── 6. Les options traversent le store intactes ─────────────────────────────
reset();
{
  const p = confirmAsync({
    title: 'Supprimer ?',
    message: 'Irréversible.',
    confirmLabel: 'Supprimer',
    cancelLabel: 'Garder',
    tone: 'danger',
  });
  const s = useConfirmStore.getState().pending;
  ok(() => assert.equal(s.confirmLabel, 'Supprimer'));
  ok(() => assert.equal(s.cancelLabel, 'Garder'));
  ok(() => assert.equal(s.tone, 'danger'));
  useConfirmStore.getState().settle(false);
  await p;
}

console.log(`✓ ${checks} assertions — store de confirmation OK`);
