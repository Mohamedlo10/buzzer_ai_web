/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin');
const { cssVars } = require('../../packages/core/src/lib/theme/palette');
const sharedPreset = require('../../packages/config/tailwind-preset');

module.exports = {
  darkMode: 'class',
  presets: [sharedPreset],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/core/src/lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        ui: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': cssVars() });
    }),
  ],
};
