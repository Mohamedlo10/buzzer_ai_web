/**
 * XALAAT — source de vérité unique des design tokens.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ────────────────────────────────────────────────────────────────────────────
 * Le projet portait deux systèmes de nommage concurrents pour les mêmes
 * couleurs : `theme.css` (`--color-bg`, `--color-primary`…) et `global.css`
 * (`--bg-rgb`, `--primary-rgb`…). `tailwind.config.js` ne lisait que le second,
 * pendant que ~365 styles inline lisaient le premier. Les deux fichiers
 * redéfinissaient aussi `html, body`. Ce fichier les remplace tous les deux :
 * les variables CSS `:root` sont désormais GÉNÉRÉES à partir d'ici (voir
 * `cssVars()` et le plugin en bas de `tailwind.config.js`).
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI DU .js ET PAS DU .ts
 * ────────────────────────────────────────────────────────────────────────────
 * `tailwind.config.js` est du CommonJS et doit pouvoir `require()` ces valeurs
 * sans chaîne de compilation. Le code applicatif les consomme typées via
 * `lib/theme/tokens.ts`, qui ne fait que réexporter ce module (`allowJs: true`).
 * En phase 2, ce fichier devient `packages/core/src/theme/palette.js` et sert
 * à la fois le preset NativeWind et le preset Tailwind web.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * RÈGLE
 * ────────────────────────────────────────────────────────────────────────────
 * Ne JAMAIS écrire une couleur en dur ailleurs. Un `#B8462A` trouvé dans un
 * composant est un bug : il ne suivra pas le thème et ne survivra pas au
 * portage React Native.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Palette « Teranga » — terracotta / or / crème, d'après les textiles sénégalais
// ─────────────────────────────────────────────────────────────────────────────
const palette = {
  // Surfaces & texte
  bg: '#F1E5C9',
  bgDeep: '#EADCB8',
  surface: '#FBF4DF',
  surface2: '#F6EBC9',
  line: '#DACFB7',
  txt: '#1A1410',

  /**
   * Encre adoucie — texte secondaire, légendes, libellés.
   * N'existait que dans `theme.css` sous `--color-ink-soft`, alors qu'elle est
   * la 2e couleur la plus utilisée du projet (70 sites). Elle avait été oubliée
   * du système `--*-rgb`, ce qui rendait la suppression de `theme.css`
   * impossible sans casser l'affichage.
   */
  inkSoft: '#5B4E3D',

  // Marque
  primary: '#B8462A', // terracotta — CTA, identité
  primaryD: '#9C3A22', // terracotta pressé
  primaryInk: '#FBF4DF', // crème — texte posé sur terracotta

  /**
   * Deux ors, et ce n'est pas un doublon.
   * `goldBright` (#E8A630) est l'or du design : 1,9:1 sur la crème — superbe en
   * aplat, illisible en texte. `gold` (#8F6414) est l'or *encre* : 4,8:1, c'est
   * lui qu'il faut pour du texte, des icônes ou des chiffres.
   */
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

/**
 * Variante nuit — CALIBRÉE MAIS NON BRANCHÉE.
 *
 * Le mode sombre est désactivé partout (data-theme="light" en dur dans
 * app/layout.tsx, ThemeProvider inerte). Ces valeurs vivaient dans un gros bloc
 * CSS commenté au milieu de `global.css` ; elles sont conservées ici pour que la
 * voie de retour reste réelle et versionnée plutôt que sous forme de commentaire
 * que personne ne relit.
 *
 * Contraintes déjà satisfaites : tous les contrastes sont ≥ 4:1 sur la nuit, et
 * les accents ont été éclaircis exprès (le terracotta #B8462A devient illisible
 * sur fond sombre).
 *
 * Pour réactiver : émettre ces valeurs sous `[data-theme='dark']` via un second
 * `addBase` dans tailwind.config.js, rétablir la bascule dans ThemeProvider et
 * le bouton soleil/lune de DashboardHeader. En NativeWind v4, passer par `vars()`
 * sur une View racine — avec des COULEURS COMPLÈTES, jamais des canaux nus.
 */
const darkPalette = {
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

// ─────────────────────────────────────────────────────────────────────────────
// Opacités dérivées de l'encre
// ─────────────────────────────────────────────────────────────────────────────
const alpha = {
  txt60: 0.66,
  txt40: 0.45,
  txt25: 0.28,
  scrim: 0.42,
  /** Filet translucide — voir la note sur `--color-line` dans `cssVars()`. */
  lineSoft: 0.1,
};

// ─────────────────────────────────────────────────────────────────────────────
// Formes
// ─────────────────────────────────────────────────────────────────────────────
const radius = {
  /** Pilule : boutons ronds, avatars, onglets. */
  pill: '999px',
  /** Cartes — variante « sharp » retenue par le design. */
  card: '8px',
  casino: '16px',
  xl3: '20px',
  xl4: '26px',
};

// ─────────────────────────────────────────────────────────────────────────────
// Typographie
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Les FAMILLES de polices ne sont plus déclarées ici : `next/font` en est le
 * propriétaire unique (app/layout.tsx pose `--font-display`, `--font-ui` et
 * `--font-accent` via une classe sur `<html>`).
 *
 * ── Le piège qui a été retiré, pour mémoire ──
 * `theme.css` déclarait les mêmes noms sur `:root`. Les deux sélecteurs ont la
 * spécificité (0,1,0) : c'est donc l'ORDRE SOURCE qui tranchait, et dans le
 * bundle compilé `:root` sortait après (octet 13683 contre 4524). Résultat,
 * **Boldonse gagnait** — et Bricolage Grotesque, pourtant téléchargée par
 * `next/font`, ne servait que de fallback. Trois familles (Bricolage, Instrument
 * Serif, Manrope) étaient ainsi téléchargées deux fois : une fois par
 * `next/font`, une fois par l'`@import` Google de `theme.css`.
 *
 * Boldonse étant disponible dans `next/font/google`, elle y a été basculée.
 * L'`@import` externe a disparu, le doublon aussi, et la police d'affichage
 * reste exactement la même à l'écran.
 *
 * Pour le portage Expo : Boldonse devra être embarquée via `expo-font`.
 */
const font = {
  /** Graisse d'affichage — `next/font` ne fournit pas cette information. */
  displayWeight: '400',

  /**
   * Noms des familles telles qu'elles sont ENREGISTRÉES en React Native.
   *
   * Le web résout ses polices par variables CSS (`var(--font-display)`, posées
   * par next/font). React Native n'a pas de variables CSS : il lui faut le nom
   * littéral de la famille, celui passé à `useFonts()`. Une valeur `var(...)`
   * y est reçue comme une chaîne quelconque et ignorée sans erreur — la classe
   * `font-display` retomberait en silence sur la police système.
   *
   * Ces clés sont donc consommées aux DEUX endroits qui doivent s'accorder :
   * `apps/game/app/_layout.tsx` (chargement) et `apps/game/tailwind.config.js`
   * (résolution des classes). Écrites à la main de part et d'autre, elles
   * finiraient par diverger, et le symptôme serait une police silencieusement
   * fausse.
   */
  nativeFamily: {
    display: 'Boldonse',
    ui: 'Manrope',
    serif: 'InstrumentSerifItalic',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** `#B8462A` → `184 70 42` (canaux nus, format attendu par `rgb()`). */
function toChannels(hex) {
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

/** `withAlpha('#1A1410', 0.66)` → `rgb(26 20 16 / 0.66)`. */
function withAlpha(hex, a) {
  return `rgb(${toChannels(hex)} / ${a})`;
}

/**
 * Construit le bloc `:root` complet.
 *
 * Émet trois familles de variables :
 *
 *  1. `--x-rgb` — canaux nus. Conservés parce que ~50 styles inline lisent
 *     encore `rgb(var(--primary-rgb) / 0.3)` pour composer leurs propres
 *     opacités. Ils disparaîtront écran par écran pendant le portage RN.
 *  2. `--x` — valeur prête à l'emploi, pour le CSS brut et les styles inline.
 *  3. `--color-x` — ALIAS de compatibilité vers l'ancien nommage de
 *     `theme.css`. ~365 styles inline en dépendent ; ils sont réécrits au fil
 *     du portage, pas d'un coup (un codemod naïf sur du JSX est plus risqué
 *     que le problème qu'il résout).
 */
function cssVars() {
  const p = palette;
  const vars = {};

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

  // 3. Alias de compatibilité — ancien nommage `theme.css`
  vars['--color-bg'] = p.bg;
  vars['--color-surface'] = p.surface;
  vars['--color-surface-2'] = p.surface2;
  vars['--color-ink'] = p.txt;
  vars['--color-ink-soft'] = p.inkSoft;
  vars['--color-primary'] = p.primary;
  vars['--color-primary-ink'] = p.primaryInk;
  vars['--color-secondary'] = p.indigo;

  /**
   * `--color-line` n'est PAS `--line`, et c'est volontaire.
   * L'ancien token était translucide — `rgba(26,20,16,0.10)` — là où `--line`
   * est opaque (#DACFB7). Sur le fond crème par défaut les deux se composent au
   * même pixel (218,207,183 contre ~220,208,183), mais posés sur une surface
   * plus claire ils divergent. Les 65 sites qui lisent `--color-line`
   * s'attendent au translucide : on le préserve à l'identique.
   */
  vars['--color-line'] = withAlpha(p.txt, alpha.lineSoft);

  /**
   * PIÈGE DE NOMMAGE — `accent` désigne deux couleurs différentes.
   * En classe Tailwind, `accent` = terracotta (`text-accent`, `bg-accent`).
   * En style inline, `var(--color-accent)` = or vif — c'était la valeur de
   * `theme.css`, et 19 sites en dépendent. On conserve les deux sens pour ne
   * changer aucun pixel, mais c'est un piège actif : dans du code neuf, écrire
   * `palette.primary` ou `palette.goldBright`, jamais « accent ».
   */
  vars['--color-accent'] = p.goldBright;

  // NB : pas de `--color-gold`. Ce nom n'a jamais été défini nulle part alors
  // qu'un site le lisait (`app/(tabs)/rooms/page.tsx`), qui retombait donc sur
  // la couleur héritée. Corrigé à l'appel vers `--gold` plutôt qu'en ajoutant un
  // alias legacy de plus à maintenir.

  // Formes
  vars['--radius-pill'] = radius.pill;
  vars['--card-radius'] = radius.card;

  // Typo — les FAMILLES appartiennent à `next/font` (cf. la note sur `font`).
  // On ne redéclare que ce que `next/font` ne fournit pas.
  vars['--font-display-weight'] = font.displayWeight;
  /** `--font-body` est l'ancien nom de `--font-ui` ; il reste un site d'appel. */
  vars['--font-body'] = 'var(--font-ui)';

  return vars;
}

/** `goldBright` → `gold-bright`, `surface2` → `surface-2`. */
function kebab(key) {
  return key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
}

module.exports = {
  palette,
  darkPalette,
  alpha,
  radius,
  font,
  toChannels,
  withAlpha,
  cssVars,
};
