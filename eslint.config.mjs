// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * Configuration volontairement minimale.
 *
 * On ne retient que les règles qui attrapent des bugs réels — au premier rang celles de
 * react-hooks, qui couvrent précisément la classe de défauts listée au §27 du cahier des
 * charges V1 : dépendances manquantes, listeners jamais nettoyés, hooks appelés
 * conditionnellement.
 *
 * Aucune règle stylistique : le bruit qu'elles produisent ferait abandonner le lint,
 * et le linter ne sert que s'il est vert en permanence.
 */
export default tseslint.config(
  {
    // apps/web-legacy n'est plus maintenue (aucun commit récent) et conserve son propre
    // `next lint` via `npm run lint:legacy`. Le reste est du build ou du natif généré.
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/.next/**',
      '**/android/**',
      '**/ios/**',
      '**/patches/**',
      'apps/web-legacy/**',
      'xalaat-design-package/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // Les deux règles qui justifient à elles seules cette configuration.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Bruit inévitable sur une base existante : signalé, non bloquant.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },

  {
    // Fichiers CommonJS assumés : configs Tailwind/PostCSS, et la palette de tokens qui
    // est volontairement en CommonJS pour être `require()`-able depuis tailwind.config.js
    // (contrainte documentée en tête de packages/core/src/lib/theme/tokens.ts).
    files: [
      '**/*.cjs',
      '**/*.config.js',
      'packages/config/tailwind-preset.js',
      'packages/core/src/lib/theme/palette.js',
      'packages/core/src/lib/theme/palette.test.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.commonjs },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  {
    // Le protocole STOMP délimite ses frames par un NULL littéral : le \x00 de cette
    // expression régulière est le protocole, pas une coquille.
    files: ['stress-test-live.mjs'],
    rules: { 'no-control-regex': 'off' },
  },

  {
    // Composants d'animation Reanimated : les dépendances que la règle réclame sont des
    // SharedValue (identité stable par construction) et des props de durée constantes sur
    // la vie du composant. Les déclarer relancerait l'animation à chaque rendu — soit
    // exactement le défaut que la règle cherche à prévenir ailleurs.
    //
    // Désactivé au niveau du fichier plutôt qu'en douze commentaires inline : l'exception
    // est structurelle, elle mérite une raison écrite une fois. Toute AUTRE occurrence de
    // exhaustive-deps dans la base reste signalée, et c'est ce signal qu'on protège ici.
    files: ['apps/game/components/anim/index.tsx'],
    rules: { 'react-hooks/exhaustive-deps': 'off' },
  },
);
