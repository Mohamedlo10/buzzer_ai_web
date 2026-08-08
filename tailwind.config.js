/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin');
const { palette, alpha, radius, withAlpha, cssVars } = require('./lib/theme/palette');

// ─────────────────────────────────────────────────────────────────────────────
// POURQUOI DES HEX ET PLUS `rgb(var(--x-rgb) / <alpha-value>)`
// ─────────────────────────────────────────────────────────────────────────────
// L'ancienne forme demandait au moteur de résoudre une variable CSS À
// L'EXÉCUTION puis d'interpréter son contenu comme des canaux nus à l'intérieur
// d'un `rgb()`. C'est exactement le cas où le parseur de NativeWind v4 décroche :
// les couleurs pleines passent, mais les modificateurs d'opacité (un suffixe
// «⁄40» sur une classe de fond) rendent du transparent ou du noir —
// silencieusement, sur 3 129 `className`.
//
// En donnant des hex à Tailwind, c'est LUI qui calcule l'alpha, à la
// compilation, sur les trois plateformes et sans runtime. Aucun `className` du
// projet ne change d'un caractère — on remplace le mécanisme, pas les sites
// d'appel.
//
// ⚠ Ne pas écrire de nom de classe littéral dans ces commentaires : `content`
// scanne `./lib/**` en texte brut et générerait l'utilitaire correspondant,
// même depuis un commentaire. (C'est arrivé pendant ce refactor.)
//
// Contrepartie : plus de bascule de thème à l'exécution. Le coût est nul ici,
// le mode sombre étant déjà désactivé (bloc commenté dans global.css,
// data-theme="light" en dur dans app/layout.tsx, ThemeProvider inerte).
// Pour le réactiver un jour, NativeWind v4 fournit `vars()` sur une View racine
// — les variables devront alors porter une COULEUR COMPLÈTE (`#B8462A`), jamais
// des canaux nus.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Mode sombre désactivé. En 'class' (au lieu du défaut 'media'), une variante
  // `dark:` oubliée ne peut plus se déclencher toute seule sur la préférence
  // système d'un joueur — elle attendrait une classe .dark que personne ne pose.
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Surfaces & texte ──
        bg: palette.bg,
        'bg-deep': palette.bgDeep,
        surface: palette.surface,
        'surface-2': palette.surface2,
        line: palette.line,
        txt: palette.txt,
        'txt-60': withAlpha(palette.txt, alpha.txt60),
        'txt-40': withAlpha(palette.txt, alpha.txt40),
        'txt-25': withAlpha(palette.txt, alpha.txt25),
        scrim: withAlpha(palette.txt, alpha.scrim),
        'ink-soft': palette.inkSoft,

        // ── Marque Xalaat ──
        // ⚠ `accent` = terracotta EN CLASSE, mais `var(--color-accent)` = or vif
        // EN STYLE INLINE (héritage de theme.css, 19 sites). Deux couleurs
        // différentes sous un même mot. Dans du code neuf : `primary` ou
        // `gold-bright`, jamais « accent ».
        accent: palette.primary,
        'accent-d': palette.primaryD,
        'btn-fg': palette.primaryInk,

        // Alias explicites — à préférer dans le code neuf.
        primary: palette.primary,
        'primary-d': palette.primaryD,
        'primary-ink': palette.primaryInk,
        terracotta: palette.primary,
        indigo: palette.indigo,
        secondary: palette.indigo,

        // Deux ors — voir palette.js. `gold` est l'or encre (lisible sur la
        // crème), `gold-bright` l'or décor (aplats, médailles, marque) qui ne
        // doit jamais porter de texte sombre… ni servir de texte clair.
        gold: palette.gold,
        'gold-bright': palette.goldBright,

        // ── Rôles sémantiques ──
        energy: palette.gold, // points, or, 1re place
        success: palette.good, // bonne réponse
        good: palette.good,
        buzz: palette.bad, // buzz, erreur
        'buzz-h': palette.badH,
        danger: palette.bad,
        bad: palette.bad,
        warn: palette.warn,
        host: palette.violet, // animateur / manager
        team: palette.indigo, // équipes

        silver: palette.silver,
        bronze: palette.bronze,
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-accent)', 'Georgia', 'serif'],
      },
      borderRadius: {
        // Le design Xalaat privilégie des angles nets sur les grandes surfaces
        // et des pilules sur les contrôles.
        casino: radius.casino,
        '3xl': radius.xl3,
        '4xl': radius.xl4,
      },
      boxShadow: {
        // ⚠ Portage RN : `shadow-card` est une double ombre avec spread négatif.
        // iOS n'a pas de spread, Android n'a qu'un scalaire `elevation` — ces
        // cinq ombres devront être normalisées en 3 niveaux en phase 2, pas
        // traduites au pixel près.
        glow: `0 0 20px ${withAlpha(palette.primary, 0.28)}`,
        'glow-success': `0 0 20px ${withAlpha(palette.good, 0.3)}`,
        danger: `0 0 12px ${withAlpha(palette.bad, 0.4)}`,
        soft: `0 4px 20px ${withAlpha(palette.txt, 0.1)}`,
        card: `0 12px 28px -10px ${withAlpha(palette.txt, 0.18)}, 0 2px 6px ${withAlpha(palette.txt, 0.05)}`,
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'buzz-scale': 'buzz-scale 0.15s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'scan-line': 'scan-line 2s ease-in-out infinite',
      },
      keyframes: {
        'scan-line': {
          '0%': { top: '8px' },
          '50%': { top: 'calc(100% - 8px)' },
          '100%': { top: '8px' },
        },
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.15)', opacity: '0.2' },
        },
        'buzz-scale': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Les variables CSS `:root` sont GÉNÉRÉES depuis la même palette que les
    // couleurs ci-dessus. C'est ce qui garantit qu'un `className="bg-surface"`
    // et un `style={{ background: 'var(--color-surface)' }}` ne pourront plus
    // diverger : auparavant, les deux valeurs vivaient dans deux fichiers CSS
    // distincts qu'il fallait penser à modifier ensemble.
    plugin(({ addBase }) => {
      addBase({ ':root': cssVars() });
    }),
  ],
};
