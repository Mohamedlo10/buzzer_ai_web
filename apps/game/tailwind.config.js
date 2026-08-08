/** @type {import('tailwindcss').Config} */
const sharedPreset = require('../../packages/config/tailwind-preset');
const { font } = require('../../packages/core/src/lib/theme/palette');

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/core/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset'), sharedPreset],
  theme: {
    extend: {
      // Résolution NATIVE des polices : par nom de famille, tel qu'enregistré
      // dans `useFonts()` (app/_layout.tsx). Les deux lisent le même
      // `palette.font.nativeFamily`, sinon ils divergeraient tôt ou tard et la
      // police tomberait en silence sur celle du système.
      //
      // Le pendant web (`var(--font-display)`) est dans
      // apps/web-legacy/tailwind.config.js — hors du preset partagé à dessein.
      fontFamily: {
        display: [font.nativeFamily.display],
        ui: [font.nativeFamily.ui],
        serif: [font.nativeFamily.serif],
      },
    },
  },
  plugins: [],
};
