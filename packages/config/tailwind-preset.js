const { palette, alpha, radius, withAlpha } = require('../core/src/lib/theme/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
        accent: palette.primary,
        'accent-d': palette.primaryD,
        'btn-fg': palette.primaryInk,

        primary: palette.primary,
        'primary-d': palette.primaryD,
        'primary-ink': palette.primaryInk,
        terracotta: palette.primary,
        indigo: palette.indigo,
        secondary: palette.indigo,

        gold: palette.gold,
        'gold-bright': palette.goldBright,

        // ── Rôles sémantiques ──
        energy: palette.gold,
        success: palette.good,
        good: palette.good,
        buzz: palette.bad,
        'buzz-h': palette.badH,
        danger: palette.bad,
        bad: palette.bad,
        warn: palette.warn,
        host: palette.violet,
        team: palette.indigo,

        silver: palette.silver,
        bronze: palette.bronze,
      },
      borderRadius: {
        casino: radius.casino,
        '3xl': radius.xl3,
        '4xl': radius.xl4,
      },
      boxShadow: {
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
};
