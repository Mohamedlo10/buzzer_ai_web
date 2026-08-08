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
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': cssVars() });
    }),
  ],
};
