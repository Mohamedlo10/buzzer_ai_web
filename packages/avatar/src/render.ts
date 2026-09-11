import { catalog } from './generated/catalog.ts';
import { parts } from './generated/parts.ts';
import { findColor, getKind, parseSpec, suppressedSlots, validateSpec } from './spec.ts';
import type { AvatarSpec, CatalogKind } from './types.ts';

/**
 * Compose le SVG d'un avatar — jumeau de `AvatarRenderService.java`.
 *
 * <h2>La sortie doit être identique à l'octet près</h2>
 * Le même avatar est dessiné deux fois : ici pour l'aperçu instantané du créateur et les listes
 * du jeu, et en Java pour l'URL d'image servie à l'application web gelée, à l'administration et
 * aux e-mails. Toute divergence est invisible — chaque côté a l'air correct isolément — jusqu'à
 * ce qu'un joueur voie deux avatars différents de lui-même. C'est ce que verrouille
 * `avatar.test.mjs`, qui compare les empreintes de rendu au fichier témoin partagé avec le
 * backend.
 *
 * Toute modification ici doit donc être reportée dans `AvatarRenderService.render`, et
 * inversement.
 */

/** Repli d'un jeton qu'aucune couleur ne renseigne. Aligné sur `MISSING_COLOR` côté Java. */
const MISSING_COLOR = '#CCCCCC';

/** Rend une chaîne de spec. Lève si elle est illisible ou étrangère au catalogue. */
export function renderAvatarSvg(rawSpec: string): string {
  const spec = parseSpec(rawSpec);
  validateSpec(spec);
  return renderSpec(spec);
}

/** Rend une spec déjà analysée — le chemin qu'emprunte le créateur à chaque tap. */
export function renderSpec(spec: AvatarSpec): string {
  const kindDef = getKind(spec.kind);
  const tokens = collectTokens(spec, kindDef);
  const suppressed = suppressedSlots(spec, kindDef);

  let svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${catalog.viewBox}"` +
    ` width="512" height="512" role="img">`;

  for (const slotKey of kindDef.layers) {
    if (suppressed.has(slotKey)) continue;

    const slot = kindDef.slots[slotKey];
    if (!slot?.group) continue;

    const group = catalog.groups[slot.group];
    const item = group.items.find((candidate) => candidate.id === spec.values[slotKey]);
    if (!item || item.none) continue;

    const fragment = parts[`${group.prefix}-${item.id}.svg`];
    if (fragment === undefined) continue;

    svg += substitute(fragment, tokens);
  }

  return `${svg}</svg>`;
}

/**
 * Rassemble les couleurs choisies sous la forme attendue par les fragments.
 *
 * Chaque emplacement de couleur déclare quels jetons il alimente et avec quel champ — c'est ce
 * qui permet à une même palette de servir plusieurs emplacements.
 */
function collectTokens(spec: AvatarSpec, kindDef: CatalogKind): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const [slotKey, slot] of Object.entries(kindDef.slots)) {
    if (!slot.palette || !slot.tokens) continue;

    const color = findColor(slot.palette, spec.values[slotKey]);
    if (!color) continue;

    for (const [token, field] of Object.entries(slot.tokens)) {
      tokens[token] = field === 'shade' ? color.shade : color.hex;
    }
  }
  return tokens;
}

/** Remplace les `{{jeton}}` d'un fragment. Toutes les valeurs injectées viennent du catalogue. */
function substitute(fragment: string, tokens: Record<string, string>): string {
  if (!fragment.includes('{')) return fragment;

  let out = '';
  let i = 0;
  while (i < fragment.length) {
    const open = fragment.indexOf('{{', i);
    if (open < 0) {
      out += fragment.slice(i);
      break;
    }
    const close = fragment.indexOf('}}', open);
    if (close < 0) {
      out += fragment.slice(i);
      break;
    }
    out += fragment.slice(i, open);
    const token = fragment.slice(open + 2, close);
    out += tokens[token] ?? MISSING_COLOR;
    i = close + 2;
  }
  return out;
}

/**
 * Rend la vignette d'une valeur pour l'écran de création.
 *
 * Une pastille de choix doit montrer l'effet de *cette* pièce sur l'avatar en cours, pas une
 * pièce isolée sur fond vide : c'est ce qui permet de comparer huit drapés de voile d'un coup
 * d'œil.
 */
export function renderPreview(spec: AvatarSpec, slot: string, value: string): string {
  return renderSpec({ kind: spec.kind, values: { ...spec.values, [slot]: value } });
}
