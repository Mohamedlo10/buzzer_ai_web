/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin');
const { cssVars } = require('../../packages/core/src/lib/theme/palette');
const sharedPreset = require('../../packages/config/tailwind-preset');

module.exports = {
  darkMode: 'class',
  presets: [sharedPreset],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    '../../packages/core/src/lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // Résolution WEB des polices : par variables CSS, posées sur <html> par
      // next/font (app/layout.tsx). Volontairement hors du preset partagé —
      // `var()` n'existe pas en React Native et y serait ignoré en silence.
      // Le pendant natif est dans apps/game/tailwind.config.js.
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-accent)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': cssVars() });
    }),
  ],
};
