/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const sharedPreset = require('../../packages/config/tailwind-preset');
const { font, palette, darkPalette, alpha, toChannels } = require('../../packages/core/src/lib/theme/palette');

// ── Thème clair / sombre ─────────────────────────────────────────────────────
// Le preset partagé fige les couleurs en hex. Ici, côté app uniquement, chaque couleur lit
// une variable `--x-rgb` (canaux nus, pour garder les modificateurs `bg-good/15`). Les valeurs
// sont posées sur `:root` (clair) et `.dark:root` (sombre) ; `colorScheme.set()` de NativeWind
// passe de l'une à l'autre (voir native/theme/useThemeStore.ts).

/** `goldBright` → `gold-bright`, `surface2` → `surface-2`. */
const kebab = (key) => key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();

const channelVars = (p) =>
  Object.fromEntries(Object.entries(p).map(([key, hex]) => [`--${kebab(key)}-rgb`, toChannels(hex)]));

const themed = (key) => `rgb(var(--${kebab(key)}-rgb) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './native/**/*.{js,jsx,ts,tsx}',
    '../../packages/core/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset'), sharedPreset],
  theme: {
    extend: {
      fontFamily: {
        display: [font.nativeFamily.display],
        ui: [font.nativeFamily.ui],
        serif: [font.nativeFamily.serif],
      },
      // Mêmes noms que le preset partagé, reliés aux variables du thème.
      colors: {
        bg: themed('bg'),
        'bg-deep': themed('bgDeep'),
        surface: themed('surface'),
        'surface-2': themed('surface2'),
        line: themed('line'),
        txt: themed('txt'),
        'txt-60': `rgb(var(--txt-rgb) / ${alpha.txt60})`,
        'txt-40': `rgb(var(--txt-rgb) / ${alpha.txt40})`,
        'txt-25': `rgb(var(--txt-rgb) / ${alpha.txt25})`,
        scrim: `rgb(var(--txt-rgb) / ${alpha.scrim})`,
        'ink-soft': themed('inkSoft'),

        accent: themed('primary'),
        'accent-d': themed('primaryD'),
        'btn-fg': themed('primaryInk'),
        primary: themed('primary'),
        'primary-d': themed('primaryD'),
        'primary-ink': themed('primaryInk'),
        terracotta: themed('primary'),
        indigo: themed('indigo'),
        secondary: themed('indigo'),

        gold: themed('gold'),
        'gold-bright': themed('goldBright'),

        energy: themed('gold'),
        success: themed('good'),
        good: themed('good'),
        buzz: themed('bad'),
        'buzz-h': themed('badH'),
        danger: themed('bad'),
        bad: themed('bad'),
        warn: themed('warn'),
        host: themed('violet'),
        team: themed('indigo'),
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': channelVars(palette),
        '.dark:root': channelVars(darkPalette),
      });
    }),
  ],
};
