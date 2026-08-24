import assert from 'node:assert/strict';
import { resolvePostCreationRoute, resolveJoinRoute } from './sessionRouting.ts';

let checks = 0;
const ok = (fn) => {
  fn();
  checks++;
};

// ─── 1. Post-creation routing (Bug Sprint A1) ─────────────────────────────────

// Sprint (WITHOUT_MODERATOR) -> doit aller aux categories
ok(() =>
  assert.equal(
    resolvePostCreationRoute({ code: 'ABCD', sessionMode: 'WITHOUT_MODERATOR' }),
    '/session/ABCD/categories',
  ),
);

// Sprint avec PER_PLAYER explicite -> doit aller aux categories
ok(() =>
  assert.equal(
    resolvePostCreationRoute({
      code: 'ABCD',
      sessionMode: 'WITHOUT_MODERATOR',
      categorySelectionMode: 'PER_PLAYER',
    }),
    '/session/ABCD/categories',
  ),
);

// Sprint avec MANAGER (thèmes imposés par l'hôte) -> doit aller au lobby
ok(() =>
  assert.equal(
    resolvePostCreationRoute({
      code: 'ABCD',
      sessionMode: 'WITHOUT_MODERATOR',
      categorySelectionMode: 'MANAGER',
    }),
    '/session/ABCD/lobby',
  ),
);

// Modéré (WITH_MODERATOR) -> doit aller au lobby directement
ok(() =>
  assert.equal(
    resolvePostCreationRoute({ code: 'ABCD', sessionMode: 'WITH_MODERATOR' }),
    '/session/ABCD/lobby',
  ),
);

// Modéré avec MANAGER -> doit aller au lobby
ok(() =>
  assert.equal(
    resolvePostCreationRoute({
      code: 'ABCD',
      sessionMode: 'WITH_MODERATOR',
      categorySelectionMode: 'MANAGER',
    }),
    '/session/ABCD/lobby',
  ),
);

// ─── 2. Join routing ─────────────────────────────────────────────────────────

// PER_PLAYER (par défaut) -> va aux categories
ok(() =>
  assert.equal(
    resolveJoinRoute({ code: 'WXYZ' }),
    '/session/WXYZ/categories',
  ),
);

// PER_PLAYER avec sessionId -> va aux categories avec paramètre
ok(() =>
  assert.equal(
    resolveJoinRoute({ code: 'WXYZ', sessionId: 'sess-123', categorySelectionMode: 'PER_PLAYER' }),
    '/session/WXYZ/categories?sessionId=sess-123',
  ),
);

// MANAGER -> saute les categories et va directement au lobby
ok(() =>
  assert.equal(
    resolveJoinRoute({ code: 'WXYZ', sessionId: 'sess-123', categorySelectionMode: 'MANAGER' }),
    '/session/WXYZ/lobby',
  ),
);

console.log(`✓ ${checks} assertions — routage de session post-création et join OK`);
