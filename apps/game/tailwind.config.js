/** @type {import('tailwindcss').Config} */
const sharedPreset = require('../../packages/config/tailwind-preset');
const { font } = require('../../packages/core/src/lib/theme/palette');

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
    },
  },
  plugins: [],
};
