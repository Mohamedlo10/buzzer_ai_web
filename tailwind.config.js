/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#292349',
        'dark-card': '#342D5B',
        'dark-hover': '#3E3666',
        'primary': '#D5442F',
        'primary-dark': '#B5371F',
        'danger': '#D5442F',
        'success': '#00D397',
        'success-dark': '#00B07F',
        'warning': '#F59E0B',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A89CC8',
        'text-muted': '#7B6FA0',
        'border-color': '#3E3666',
      },
      borderRadius: {
        'casino': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(213, 68, 47, 0.3)',
        'glow-success': '0 0 20px rgba(0, 211, 151, 0.3)',
        'danger': '0 0 12px rgba(213, 68, 47, 0.4)',
        'soft': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'buzz-scale': 'buzz-scale 0.15s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
      keyframes: {
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
  plugins: [],
};
