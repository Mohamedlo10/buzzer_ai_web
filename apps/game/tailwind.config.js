/** @type {import('tailwindcss').Config} */
const sharedPreset = require('../../packages/config/tailwind-preset');

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/core/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset'), sharedPreset],
  plugins: [],
};
