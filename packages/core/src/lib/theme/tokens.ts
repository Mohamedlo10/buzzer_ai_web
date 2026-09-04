/**
 * Accès typé aux design tokens.
 *
 * Source de vérité unique TypeScript/ESM des tokens pour le web et React Native.
 * `palette.js` fournit les mêmes valeurs pour Tailwind (CommonJS `require()`).
 */

export const palette = {
  // Surfaces & texte
  bg: '#F1E5C9',
  bgDeep: '#EADCB8',
  surface: '#FBF4DF',
  surface2: '#F6EBC9',
  line: '#DACFB7',
  txt: '#1A1410',

  /** Encre adoucie — texte secondaire, légendes, libellés. */
  inkSoft: '#5B4E3D',

  // Marque
  primary: '#B8462A', // terracotta — CTA, identité
  primaryD: '#9C3A22', // terracotta pressé
  primaryInk: '#FBF4DF', // crème — texte posé sur terracotta

  gold: '#8F6414',
  goldBright: '#E8A630',

  indigo: '#2A3656', // équipes, cartes vedette
  good: '#2D8559', // bonne réponse
  bad: '#D14A2E', // buzz, erreur
  badH: '#E8663F', // buzz survolé
  violet: '#7A4FB8', // animateur / manager
  warn: '#C9871F', // avertissement

  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

export const darkPalette = {
  bg: '#1A1410',
  bgDeep: '#120E0A',
  surface: '#241B14',
  surface2: '#2E2218',
  line: '#3B3128',
  txt: '#F1E5C9',
  inkSoft: '#B9AC94',
  primary: '#D1573A',
  primaryD: '#B8462A',
  primaryInk: '#1A1410',
  gold: '#E8A630',
  goldBright: '#F0BA50',
  indigo: '#6B7BA8',
  good: '#3FA372',
  bad: '#E05A3A',
  badH: '#F07A55',
  violet: '#9B72D4',
  warn: '#E8A630',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

export const alpha = {
  txt60: 0.66,
  txt40: 0.45,
  txt25: 0.28,
  scrim: 0.42,
  lineSoft: 0.1,
};

export const radius = {
  pill: '999px',
  card: '8px',
  casino: '16px',
  xl3: '20px',
  xl4: '26px',
};

export const font = {
  displayWeight: '400',
  nativeFamily: {
    display: 'Boldonse',
    ui: 'Manrope',
    serif: 'InstrumentSerifItalic',
  },
};

export function toChannels(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function withAlpha(hex: string, a: number): string {
  return `rgb(${toChannels(hex)} / ${a})`;
}

function kebab(key: string): string {
  return key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
}

export function cssVars(): Record<string, string> {
  const p = palette;
  const vars: Record<string, string> = {};

  // 1. Canaux nus
  for (const [key, hex] of Object.entries(p)) {
    vars[`--${kebab(key)}-rgb`] = toChannels(hex);
  }

  // 2. Valeurs prêtes à l'emploi
  for (const [key, hex] of Object.entries(p)) {
    vars[`--${kebab(key)}`] = hex;
  }

  // Dérivées de l'encre
  vars['--txt-60'] = withAlpha(p.txt, alpha.txt60);
  vars['--txt-40'] = withAlpha(p.txt, alpha.txt40);
  vars['--txt-25'] = withAlpha(p.txt, alpha.txt25);
  vars['--scrim'] = withAlpha(p.txt, alpha.scrim);

  // Alias sémantiques (nommage historique de global.css)
  vars['--accent'] = p.primary;
  vars['--accent-d'] = p.primaryD;
  vars['--btn-fg'] = p.primaryInk;
  vars['--energy'] = p.gold;
  vars['--buzz'] = p.bad;
  vars['--buzz-h'] = p.badH;
  vars['--danger'] = p.bad;
  vars['--success'] = p.good;
  vars['--host'] = p.violet;
  vars['--team'] = p.indigo;

  // 3. Alias de compatibilité — ancien nommage theme.css
  vars['--color-bg'] = p.bg;
  vars['--color-surface'] = p.surface;
  vars['--color-surface-2'] = p.surface2;
  vars['--color-ink'] = p.txt;
  vars['--color-ink-soft'] = p.inkSoft;
  vars['--color-primary'] = p.primary;
  vars['--color-primary-ink'] = p.primaryInk;
  vars['--color-secondary'] = p.indigo;
  vars['--color-line'] = withAlpha(p.txt, alpha.lineSoft);
  vars['--color-accent'] = p.goldBright;

  // Formes
  vars['--radius-pill'] = radius.pill;
  vars['--card-radius'] = radius.card;

  // Typo
  vars['--font-display-weight'] = font.displayWeight;
  vars['--font-body'] = 'var(--font-ui)';

  return vars;
}

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
