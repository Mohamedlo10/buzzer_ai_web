import { catalog } from './generated/catalog.ts';
import type { AvatarCatalog, AvatarSpec, CatalogKind } from './types.ts';

/**
 * Analyse, validation et forme canonique d'une spec d'avatar — jumeau de `AvatarSpec.java`.
 *
 * Le serveur reste l'autorité : c'est lui qui refuse une spec invalide au moment de
 * l'enregistrer. Ce qui est ici sert à l'écran de création, qui doit savoir composer et relire
 * une spec sans faire d'aller-retour réseau à chaque tap.
 */

/** Longueur de la colonne `users.avatar_spec`. */
export const MAX_SPEC_LENGTH = 255;

const GRAMMAR = /^xa1:([a-z]):([a-z]{2}=[a-z0-9-]{1,24}(?:,[a-z]{2}=[a-z0-9-]{1,24})*)$/;

export class AvatarSpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarSpecError';
  }
}

export function getCatalog(): AvatarCatalog {
  return catalog;
}

export function getKind(kind: string): CatalogKind {
  const def = catalog.kinds[kind];
  if (!def) throw new AvatarSpecError(`Catégorie d'avatar inconnue : ${kind}`);
  return def;
}

/** Analyse une chaîne, ou lève. Purement syntaxique — voir `validate` pour le catalogue. */
export function parseSpec(raw: string | null | undefined): AvatarSpec {
  if (!raw || raw.trim() === '' || raw.length > MAX_SPEC_LENGTH) {
    throw new AvatarSpecError("Spécification d'avatar illisible.");
  }

  const match = GRAMMAR.exec(raw);
  if (!match) throw new AvatarSpecError("Spécification d'avatar illisible.");

  const values: Record<string, string> = {};
  for (const pair of match[2].split(',')) {
    const eq = pair.indexOf('=');
    const key = pair.slice(0, eq);
    // Une clé répétée est une spec ambiguë : deux avatars différents s'écriraient pareil.
    if (key in values) throw new AvatarSpecError("Spécification d'avatar illisible.");
    values[key] = pair.slice(eq + 1);
  }
  return { kind: match[1], values };
}

/** Vrai si la chaîne est analysable ET conforme au catalogue. */
export function isValidSpec(raw: string | null | undefined): boolean {
  try {
    normalizeSpec(raw);
    return true;
  } catch {
    return false;
  }
}

/**
 * Réécrit la spec avec les emplacements dans l'ordre du catalogue.
 *
 * C'est ce qui garantit que deux joueurs ayant composé le même avatar produisent la même chaîne,
 * donc la même URL, donc la même entrée de cache.
 */
export function formatSpec(spec: AvatarSpec): string {
  const kindDef = getKind(spec.kind);
  const pairs: string[] = [];
  for (const slot of Object.keys(kindDef.slots)) {
    const value = spec.values[slot];
    if (value !== undefined) pairs.push(`${slot}=${value}`);
  }
  return `xa1:${spec.kind}:${pairs.join(',')}`;
}

/**
 * Confronte chaque emplacement au catalogue.
 *
 * Tous les emplacements déclarés sont obligatoires, y compris ceux qu'une exclusion rend
 * invisibles — la coiffure sous un voile. Une spec est ainsi toujours complète et se rend
 * intégralement, quel que soit le moment où on la relit.
 */
export function validateSpec(spec: AvatarSpec): void {
  const kindDef = getKind(spec.kind);

  for (const slot of Object.keys(spec.values)) {
    if (!(slot in kindDef.slots)) {
      throw new AvatarSpecError(
        `L'emplacement « ${slot} » n'existe pas pour la catégorie « ${spec.kind} ».`,
      );
    }
  }

  for (const [slotKey, slot] of Object.entries(kindDef.slots)) {
    const value = spec.values[slotKey];
    if (value === undefined) {
      throw new AvatarSpecError(
        `L'emplacement « ${slotKey} » est obligatoire pour la catégorie « ${spec.kind} ».`,
      );
    }
    if (slot.group) {
      const group = catalog.groups[slot.group];
      if (!group?.items.some((item) => item.id === value)) {
        throw new AvatarSpecError(
          `La valeur « ${value} » n'existe pas pour l'emplacement « ${slotKey} ».`,
        );
      }
    } else if (slot.palette) {
      if (!findColor(slot.palette, value)) {
        throw new AvatarSpecError(
          `La valeur « ${value} » n'existe pas pour l'emplacement « ${slotKey} ».`,
        );
      }
    }
  }
}

/** Analyse + valide + réécrit sous forme canonique. Point d'entrée unique. */
export function normalizeSpec(raw: string | null | undefined): string {
  const spec = parseSpec(raw);
  validateSpec(spec);
  return formatSpec(spec);
}

export function findColor(palette: string, id: string) {
  return catalog.palettes[palette]?.find((color) => color.id === id);
}

/**
 * Les emplacements qu'une exclusion rend caducs pour cette spec.
 *
 * Une valeur marquée `none` — « Sans voile » — n'exclut rien : c'est précisément l'absence de
 * voile qui laisse voir la chevelure. L'écran de création s'en sert aussi pour masquer les
 * rangées devenues sans effet.
 */
export function suppressedSlots(spec: AvatarSpec, kindDef: CatalogKind): Set<string> {
  const suppressed = new Set<string>();
  if (!kindDef.exclusive) return suppressed;

  for (const [trigger, targets] of Object.entries(kindDef.exclusive)) {
    const value = spec.values[trigger];
    if (value === undefined) continue;

    const slot = kindDef.slots[trigger];
    const group = slot?.group ? catalog.groups[slot.group] : undefined;
    const item = group?.items.find((candidate) => candidate.id === value);
    if (item && !item.none) targets.forEach((target) => suppressed.add(target));
  }
  return suppressed;
}

/** Remplace la valeur d'un emplacement, en renvoyant une nouvelle spec. */
export function withSlot(spec: AvatarSpec, slot: string, value: string): AvatarSpec {
  return { kind: spec.kind, values: { ...spec.values, [slot]: value } };
}

/** La spec par défaut d'une catégorie, telle que déclarée par le catalogue. */
export function defaultSpecFor(kind: string): string {
  const spec = catalog.defaults[kind];
  if (!spec) throw new AvatarSpecError(`Catégorie d'avatar inconnue : ${kind}`);
  return spec;
}
