import { catalog } from './generated/catalog.ts';
import { formatSpec, getKind, parseSpec, defaultSpecFor } from './spec.ts';
import type { AvatarSpec } from './types.ts';

/**
 * Tirages aléatoires — la mécanique derrière le bouton « Surprends-moi ».
 *
 * C'est le geste qui fait basculer l'écran du formulaire de configuration vers le jeu : un tap,
 * un avatar complet et cohérent. Il faut donc qu'il produise un résultat toujours valide, jamais
 * une combinaison que le serveur refuserait.
 */

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Une valeur au hasard pour un emplacement donné. */
export function randomSlotValue(kind: string, slotKey: string): string {
  const slot = getKind(kind).slots[slotKey];
  if (slot.group) return pick(catalog.groups[slot.group].items).id;
  if (slot.palette) return pick(catalog.palettes[slot.palette]).id;
  throw new Error(`L'emplacement « ${slotKey} » n'est ni un calque ni une couleur.`);
}

/**
 * Un avatar complet au hasard dans une catégorie.
 *
 * Tous les emplacements sont tirés, y compris ceux qu'un voile masque : la spec reste complète,
 * si bien que retirer le voile révèle une coiffure déjà choisie plutôt qu'un défaut.
 */
export function randomSpec(kind: string): AvatarSpec {
  const kindDef = getKind(kind);
  const values: Record<string, string> = {};
  for (const slotKey of Object.keys(kindDef.slots)) {
    values[slotKey] = randomSlotValue(kind, slotKey);
  }
  return { kind, values };
}

export function randomSpecString(kind: string): string {
  return formatSpec(randomSpec(kind));
}

/**
 * La spec sur laquelle ouvrir le créateur.
 *
 * Si le joueur a déjà un avatar, on repart du sien — changer de catégorie ne doit pas effacer ce
 * qu'il avait composé ailleurs. Sinon, le défaut du catalogue.
 */
export function startingSpec(existing: string | null | undefined, kind: string): AvatarSpec {
  if (existing) {
    try {
      const spec = parseSpec(existing);
      if (spec.kind === kind) return spec;
    } catch {
      // Spec illisible (catalogue plus récent côté serveur, donnée corrompue) : on repart du
      // défaut plutôt que de laisser l'écran vide.
    }
  }
  return parseSpec(defaultSpecFor(kind));
}
