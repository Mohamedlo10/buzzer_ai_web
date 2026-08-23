/**
 * Accès typé aux design tokens.
 *
 * Les valeurs vivent dans `./palette.js` (CommonJS) parce que
 * `tailwind.config.js` doit pouvoir les `require()` sans chaîne de compilation.
 * `allowJs` étant activé, TypeScript infère les types directement depuis ce
 * fichier : rien n'est redéclaré ici, donc rien ne peut diverger.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * À UTILISER DANS LE CODE NEUF
 * ────────────────────────────────────────────────────────────────────────────
 *   import { palette } from '~/lib/theme/tokens';
 *   <div style={{ backgroundColor: palette.surface }} />
 *
 * PAS ça :
 *   <div style={{ backgroundColor: 'var(--color-surface)' }} />
 *
 * `var()` dans un objet de style ne fonctionne ni en React Native ni en
 * NativeWind : le moteur reçoit la chaîne littérale `"var(--color-surface)"` et
 * la rejette silencieusement. C'est précisément pour ça que les ~1 093 `var()`
 * encore présents dans le JSX doivent disparaître au fil du portage, écran par
 * écran — un codemod global sur du JSX serait plus risqué que le problème.
 *
 * Pour du web pur, `className="bg-surface"` reste préférable au style inline.
 */

import * as paletteModule from './palette';

const pMod: any = (paletteModule as any).default ?? paletteModule;

export const palette = pMod.palette;
export const darkPalette = pMod.darkPalette;
export const alpha = pMod.alpha;
export const radius = pMod.radius;
export const font = pMod.font;
export const toChannels = pMod.toChannels;
export const withAlpha = pMod.withAlpha;
export const cssVars = pMod.cssVars;

/** Nom canonique d'une couleur de la palette Teranga. */
export type ColorName = keyof typeof palette;

/**
 * Encre adoucie aux trois opacités standard du design.
 * Équivalents inline de `text-txt-60` / `text-txt-40` / `text-txt-25`.
 */
export const inkAlpha = {
  soft: withAlpha(palette.txt, alpha.txt60),
  muted: withAlpha(palette.txt, alpha.txt40),
  faint: withAlpha(palette.txt, alpha.txt25),
} as const;
