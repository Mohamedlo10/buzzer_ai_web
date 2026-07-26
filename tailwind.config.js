/** @type {import('tailwindcss').Config} */

// Toutes les couleurs de thème passent par des canaux RGB déclarés dans
// global.css. La forme `rgb(var(--x-rgb) / <alpha-value>)` est ce qui rend
// les modificateurs d'opacité (`bg-surface/40`, `text-accent/20`…) réellement
// fonctionnels — avec un simple `var(--x)` Tailwind ne peut pas injecter
// l'alpha et le modificateur est silencieusement ignoré.
const token = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Surfaces & texte (bascule clair/sombre) ──
        bg: token('bg'),
        'bg-deep': token('bg-deep'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        line: token('line'),
        txt: token('txt'),
        'txt-60': 'var(--txt-60)',
        'txt-40': 'var(--txt-40)',
        'txt-25': 'var(--txt-25)',
        scrim: 'var(--scrim)',

        // ── Marque Xalaat ──
        // `accent` = terracotta, la couleur d'action de l'app.
        accent: token('primary'),
        'accent-d': token('primary-d'),
        'btn-fg': token('primary-ink'),

        // Alias explicites — à préférer dans le code neuf.
        primary: token('primary'),
        'primary-d': token('primary-d'),
        'primary-ink': token('primary-ink'),
        terracotta: token('primary'),
        indigo: token('indigo'),
        secondary: token('indigo'),

        // Deux ors — voir global.css. `gold` est l'or encre (lisible sur la
        // crème), `gold-bright` l'or décor (aplats, médailles, marque) qui
        // ne doit jamais porter de texte sombre… ni servir de texte clair.
        gold: token('gold'),
        'gold-bright': token('gold-bright'),

        // ── Rôles sémantiques ──
        energy: token('gold'),        // points, or, 1re place
        success: token('good'),       // bonne réponse
        good: token('good'),
        buzz: token('bad'),           // buzz, erreur
        'buzz-h': token('bad-h'),
        danger: token('bad'),
        bad: token('bad'),
        warn: token('warn'),
        host: token('violet'),        // animateur / manager
        team: token('indigo'),        // équipes

        silver: '#C0C0C0',
        bronze: '#CD7F32',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-accent)', 'Georgia', 'serif'],
      },
      borderRadius: {
        // Le design Xalaat privilégie des angles nets sur les grandes
        // surfaces et des pilules sur les contrôles.
        casino: '16px',
        '3xl': '20px',
        '4xl': '26px',
      },
      boxShadow: {
        glow: '0 0 20px rgb(var(--primary-rgb) / 0.28)',
        'glow-success': '0 0 20px rgb(var(--good-rgb) / 0.30)',
        danger: '0 0 12px rgb(var(--bad-rgb) / 0.40)',
        soft: '0 4px 20px rgb(26 20 16 / 0.10)',
        card: '0 12px 28px -10px rgb(26 20 16 / 0.18), 0 2px 6px rgb(26 20 16 / 0.05)',
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
  plugins: [],
};
