/**
 * Tests de la politique d'accès aux routes.
 *
 * Ils existent parce que cette logique protège TOUTES les routes de
 * l'application et qu'une erreur y est doublement invisible : soit on affiche un
 * écran privé à un visiteur (personne ne le signale), soit on boucle en
 * redirection (et là c'est le support qui l'apprend).
 *
 * Trois régressions sont figées ici en particulier :
 *   1. les routes que l'ancien `middleware.ts` laissait passer par oubli ;
 *   2. l'absence de boucle de redirection sur les écrans d'entrée ;
 *   3. le refus des redirections ouvertes via `returnTo`.
 *
 * Lancement : `node lib/auth/routePolicy.test.mjs` — aucun navigateur.
 * (Extension `.mjs` pour que Node charge le module ES compilé à la volée par
 * `--experimental-strip-types`, sans ajouter de runner au projet.)
 */

import assert from 'node:assert/strict';
import { decideAccess, sanitizeReturnTo, buildLoginRedirect, HOME_ROUTE, LOGIN_ROUTE } from './routePolicy.ts';

let checks = 0;
const ok = (fn) => {
  fn();
  checks++;
};

const asVisitor = (pathname) => decideAccess({ pathname, isAuthenticated: false });
const asUser = (pathname) => decideAccess({ pathname, isAuthenticated: true });

// ─── 1. Le défaut est « interdit » ───────────────────────────────────────────
// C'est l'inversion par rapport à middleware.ts, qui était « autorisé sauf
// liste ». Une route inventée doit être refusée à un visiteur.
ok(() => assert.equal(asVisitor('/une/route/qui/nexiste/pas').action, 'redirect'));
ok(() => assert.equal(asVisitor('/futur-ecran').action, 'redirect'));

// ─── 2. Les trois trous de l'ancien middleware ───────────────────────────────
// PROTECTED_PREFIXES ne contenait ni `/notifications` ni `/solo` : ces écrans
// s'affichaient à un visiteur (l'API refusait les données, mais après le rendu).
for (const trou of ['/notifications', '/solo/game/42', '/solo/results/42']) {
  ok(() => assert.equal(asVisitor(trou).action, 'redirect', `${trou} doit être protégé`));
  ok(() => assert.equal(asUser(trou).action, 'allow'));
}

// ─── 3. Routes protégées déjà couvertes, qui doivent le rester ───────────────
for (const p of [
  '/dashboard',
  '/friends',
  '/rankings',
  '/rooms',
  '/rooms/all',
  '/room/12',
  '/session/ABC/lobby',
  '/session/ABC/game',
  '/profile',
  '/profile/7',
  '/profile/edit',
  '/admin',
  '/admin/users',
  '/join/room/ABC',
  '/join/session/ABC',
]) {
  ok(() => assert.equal(asVisitor(p).action, 'redirect', `${p} protégé`));
  ok(() => assert.equal(asUser(p).action, 'allow', `${p} ouvert une fois connecté`));
}

// ─── 4. Routes publiques ─────────────────────────────────────────────────────
// Elles doivent passer DANS LES DEUX ÉTATS, sinon on casse les parcours e-mail.
for (const p of ['/', '/onboarding', '/confirm-email', '/forgot-password', '/reset-password']) {
  ok(() => assert.equal(asVisitor(p).action, 'allow', `${p} public (visiteur)`));
  ok(() => assert.equal(asUser(p).action, 'allow', `${p} public (connecté)`));
}
// L'écran de vérification des tokens et ses sous-chemins.
ok(() => assert.equal(asVisitor('/dev/tokens').action, 'allow'));

// La correspondance publique est EXACTE : un sous-chemin d'une route publique
// ne devient pas public par héritage.
ok(() => assert.equal(asVisitor('/onboarding/etape-2').action, 'redirect'));
ok(() => assert.equal(asVisitor('/confirm-email/xyz').action, 'redirect'));

// ─── 5. Écrans réservés aux visiteurs ────────────────────────────────────────
ok(() => assert.equal(asVisitor('/login').action, 'allow'));
ok(() => assert.equal(asVisitor('/register').action, 'allow'));
ok(() => assert.deepEqual(asUser('/login'), { action: 'redirect', to: HOME_ROUTE, reason: 'already-authenticated' }));
ok(() => assert.deepEqual(asUser('/register'), { action: 'redirect', to: HOME_ROUTE, reason: 'already-authenticated' }));

// `/onboarding` reste accessible même connecté — l'ancien middleware l'excluait
// déjà explicitement de sa redirection, on conserve ce comportement.
ok(() => assert.equal(asUser('/onboarding').action, 'allow'));

// ─── 6. Aucune boucle de redirection ─────────────────────────────────────────
// La cible d'une redirection doit toujours être atteignable dans l'état qui l'a
// déclenchée. Sinon : boucle infinie, écran blanc.
const routes = [
  '/', '/login', '/register', '/onboarding', '/maintenance', '/dashboard', '/rooms',
  '/room/1', '/session/A/lobby', '/profile', '/profile/9', '/notifications',
  '/solo', '/solo/game/1', '/admin', '/join/room/A', '/dev/tokens', '/inconnu',
];
for (const authed of [true, false]) {
  for (const p of routes) {
    const d = decideAccess({ pathname: p, isAuthenticated: authed });
    if (d.action !== 'redirect') continue;
    const target = d.to.split('?')[0];
    const next = decideAccess({ pathname: target, isAuthenticated: authed });
    ok(() =>
      assert.equal(
        next.action,
        'allow',
        `boucle : ${p} (authed=${authed}) -> ${target} qui redirige encore`,
      ),
    );
  }
}

// ─── 7. Maintenance ──────────────────────────────────────────────────────────
ok(() => assert.equal(decideAccess({ pathname: '/rooms', isAuthenticated: true, maintenance: true }).to, '/maintenance'));
ok(() => assert.equal(decideAccess({ pathname: '/login', isAuthenticated: false, maintenance: true }).to, '/maintenance'));
// La maintenance prime même sur les écrans publics — sinon on annonce la
// coupure sur une page qu'on vient soi-même de rendre inaccessible.
ok(() => assert.equal(decideAccess({ pathname: '/', isAuthenticated: false, maintenance: true }).to, '/maintenance'));
ok(() => assert.equal(decideAccess({ pathname: '/maintenance', isAuthenticated: false, maintenance: true }).action, 'allow'));
// Hors maintenance, l'écran de maintenance ne doit pas rester atteignable — et
// la destination dépend de l'état. `middleware.ts` renvoyait toujours vers
// `/login`, ce qui faisait rebondir un utilisateur connecté vers `/rooms` : deux
// redirections, avec un passage visible par l'écran de connexion.
ok(() => assert.equal(decideAccess({ pathname: '/maintenance', isAuthenticated: true }).to, HOME_ROUTE));
ok(() => assert.equal(decideAccess({ pathname: '/maintenance', isAuthenticated: false }).to, LOGIN_ROUTE));

// ─── 8. returnTo — le deep link doit survivre à la connexion ─────────────────
const d = asVisitor('/join/room/ABC');
ok(() => assert.equal(d.action, 'redirect'));
ok(() => assert.ok(d.to.startsWith('/login?returnTo=')));
ok(() => assert.equal(decodeURIComponent(d.to.split('returnTo=')[1]), '/join/room/ABC'));

ok(() => assert.equal(sanitizeReturnTo('/session/ABC/lobby'), '/session/ABC/lobby'));
ok(() => assert.equal(sanitizeReturnTo('/rooms?tab=all'), '/rooms?tab=all'));

// Redirections ouvertes : toutes refusées.
for (const mauvais of [
  'https://evil.com',
  '//evil.com',
  '//evil.com/path',
  'http://evil.com',
  'javascript:alert(1)',
  'evil.com',
  '',
  null,
  undefined,
]) {
  ok(() => assert.equal(sanitizeReturnTo(mauvais), null, `returnTo refusé : ${mauvais}`));
}

// Revenir sur /login ou une page publique après connexion n'a aucun sens.
ok(() => assert.equal(sanitizeReturnTo('/login'), null));
ok(() => assert.equal(sanitizeReturnTo('/register'), null));
ok(() => assert.equal(sanitizeReturnTo('/'), null));
ok(() => assert.equal(sanitizeReturnTo('/onboarding'), null));

// Une cible non mémorisable ne doit pas produire de `?returnTo=` vide.
ok(() => assert.equal(buildLoginRedirect('/login'), LOGIN_ROUTE));
ok(() => assert.equal(buildLoginRedirect('/'), LOGIN_ROUTE));

console.log(`✓ ${checks} assertions — politique de routes OK`);
