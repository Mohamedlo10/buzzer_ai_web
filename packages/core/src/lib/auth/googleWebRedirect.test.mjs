/**
 * Tests du retour de Google sur le web.
 *
 * Ils figent la régression qui a motivé ce fichier : le token revenait bien de Google, mais
 * personne ne le consommait et l'utilisateur atterrissait sur l'onboarding au lieu d'être
 * connecté. Trois pièges sont gardés ici :
 *   1. la fenêtre fille doit rendre la main, pas démarrer l'application ;
 *   2. une redirection de l'onglet principal doit être rattrapée sur place ;
 *   3. un `state` qui ne correspond pas ne doit jamais ouvrir de session.
 *
 * Lancement : `node --experimental-strip-types lib/auth/googleWebRedirect.test.mjs` — aucun
 * navigateur, comme routePolicy.test.mjs.
 */

import assert from 'node:assert/strict';
import { decideGoogleRedirect } from './googleWebRedirect.ts';

let checks = 0;
const ok = (fn) => {
  fn();
  checks++;
};

const STATE = 'NhiI0D4Fht';
const TOKEN = 'eyJhbGciOiJSUzI1NiJ9.payload.signature';
const hashFor = (state = STATE, token = TOKEN) =>
  `#state=${state}&iss=https://accounts.google.com&id_token=${token}&authuser=0&prompt=none`;

// ─── 1. Arrivée ordinaire ────────────────────────────────────────────────────
// Le module est évalué à CHAQUE chargement de l'application : il doit rester muet partout
// ailleurs que sur le retour de Google.
for (const hash of ['', '#', '#access_token=abc', '#/some/route']) {
  ok(() => {
    const d = decideGoogleRedirect({ hash, hasOpener: false, expectedState: STATE });
    assert.equal(d.mode, 'none');
    assert.equal(d.idToken, null);
    assert.equal(d.shouldStripHash, false, 'une URL sans token n’a pas à être réécrite');
  });
}

// ─── 2. Cas nominal : fenêtre fille ouverte par promptAsync() ────────────────
// C'est le cas qui était cassé. Sans `handoff`, la fenêtre démarrait l'application et l'onglet
// d'origine attendait un message qui ne partait jamais.
ok(() => {
  const d = decideGoogleRedirect({ hash: hashFor(), hasOpener: true, expectedState: STATE });
  assert.equal(d.mode, 'handoff');
  assert.equal(d.idToken, TOKEN, 'token gardé en secours si l’onglet d’origine ne répond pas');
  assert.equal(d.shouldStripHash, true);
});

// La fenêtre fille rend la main même si le dépôt local a été perdu (navigation privée) :
// l'onglet d'origine, lui, a toujours son `state` en mémoire et vérifiera pour nous.
ok(() => {
  const d = decideGoogleRedirect({ hash: hashFor(), hasOpener: true, expectedState: null });
  assert.equal(d.mode, 'handoff');
  assert.equal(d.idToken, null, 'sans preuve, pas de repli possible — mais le handshake a lieu');
});

// ─── 3. Navigateur in-app : redirection de l'onglet principal ────────────────
// Instagram, Facebook et TikTok redirigent la page courante. Plus personne n'attend le token :
// il faut le consommer ici, sinon ces utilisateurs ne peuvent pas se connecter du tout.
ok(() => {
  const d = decideGoogleRedirect({ hash: hashFor(), hasOpener: false, expectedState: STATE });
  assert.equal(d.mode, 'token');
  assert.equal(d.idToken, TOKEN);
  assert.equal(d.shouldStripHash, true);
});

// ─── 4. Le `state` fait foi ──────────────────────────────────────────────────
// Un `id_token` reçu sans demande correspondante ouvrirait la session d'un autre compte sur
// simple visite d'un lien. Il est refusé — mais retiré de l'URL quand même.
for (const [libelle, entree] of [
  ['state différent', { hash: hashFor('autre'), expectedState: STATE }],
  ['aucune demande en cours', { hash: hashFor(), expectedState: null }],
  ['state absent de la réponse', { hash: `#id_token=${TOKEN}`, expectedState: STATE }],
]) {
  ok(() => {
    const d = decideGoogleRedirect({ ...entree, hasOpener: false });
    assert.equal(d.mode, 'none', `${libelle} : aucune session ne doit s’ouvrir`);
    assert.equal(d.idToken, null, libelle);
    assert.equal(d.shouldStripHash, true, `${libelle} : le token ne reste pas dans l’URL`);
  });
}

// ─── 5. Fragment sans `#` initial ────────────────────────────────────────────
// `window.location.hash` le porte, mais l'appelant pourrait passer le fragment nu.
ok(() => {
  const d = decideGoogleRedirect({
    hash: hashFor().slice(1),
    hasOpener: false,
    expectedState: STATE,
  });
  assert.equal(d.mode, 'token');
  assert.equal(d.idToken, TOKEN);
});

console.log(`✅ googleWebRedirect : ${checks} vérifications passées`);
