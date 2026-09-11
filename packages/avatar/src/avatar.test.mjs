/**
 * Tests du moteur d'avatars côté client.
 *
 * Le test central est celui de **parité** : il relit `golden.json`, produit par le backend, et
 * vérifie que le rendu TypeScript a exactement la même empreinte que le rendu Java. Sans lui, les
 * deux implémentations dériveraient en silence — chacune correcte de son côté — jusqu'à ce qu'un
 * joueur constate que son avatar n'est pas le même dans le jeu et sur le web.
 *
 * Lancé par `npm run test:avatar` depuis la racine du front (convention maison : des scripts node
 * autonomes, sans harnais de test).
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { catalog } from './generated/catalog.ts';
import { renderAvatarSvg, renderSpec } from './render.ts';
import {
  MAX_SPEC_LENGTH,
  defaultSpecFor,
  formatSpec,
  isValidSpec,
  normalizeSpec,
  parseSpec,
  suppressedSlots,
} from './spec.ts';
import { randomSpec, startingSpec } from './random.ts';

const here = dirname(fileURLToPath(import.meta.url));

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push({ name, error });
  }
}

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');

// ── Parité avec le moteur Java ───────────────────────────────────────────────

test('chaque spec témoin rend exactement l’empreinte figée par le backend', () => {
  const golden = JSON.parse(readFileSync(join(here, 'generated/golden.json'), 'utf8'));

  assert.equal(golden.catalogVersion, catalog.version, 'version de catalogue désalignée');
  assert.ok(Object.keys(golden.renders).length >= 10);

  for (const [spec, expected] of Object.entries(golden.renders)) {
    assert.equal(
      sha256(renderAvatarSvg(spec)),
      expected,
      `le rendu de ${spec} diffère de celui du serveur`,
    );
  }
});

test('les specs témoins sont déjà sous forme canonique', () => {
  const golden = JSON.parse(readFileSync(join(here, 'generated/golden.json'), 'utf8'));
  for (const spec of Object.keys(golden.renders)) {
    assert.equal(normalizeSpec(spec), spec);
  }
});

// ── Grammaire ────────────────────────────────────────────────────────────────

test('analyse une spec valide', () => {
  const spec = parseSpec('xa1:a:bg=uni-or,id=lion');
  assert.equal(spec.kind, 'a');
  assert.equal(spec.values.id, 'lion');
});

test('refuse toute chaîne hors grammaire', () => {
  for (const raw of [
    '',
    '   ',
    'lion',
    'xa2:a:bg=uni-or,id=lion',
    'xa1::bg=uni-or',
    'xa1:a:',
    'xa1:a:bg',
    'xa1:a:bgg=uni-or',
    'xa1:a:bg=UNI-OR',
    'xa1:a:bg=uni or',
    'xa1:a:bg=<script>',
    'xa1:a:bg=uni-or,bg=uni-vert',
    null,
    undefined,
  ]) {
    assert.throws(() => parseSpec(raw), `aurait dû refuser ${JSON.stringify(raw)}`);
  }
});

test('refuse une chaîne plus longue que la colonne qui doit l’accueillir', () => {
  assert.throws(() => parseSpec(`xa1:a:bg=${'a'.repeat(MAX_SPEC_LENGTH)}`));
});

test('réordonne les emplacements selon le catalogue', () => {
  assert.equal(normalizeSpec('xa1:a:bg=uni-or,id=lion'), 'xa1:a:id=lion,bg=uni-or');
});

test('la forme canonique est stable par ré-analyse', () => {
  const once = normalizeSpec(defaultSpecFor('f'));
  assert.equal(normalizeSpec(once), once);
});

// ── Validation contre le catalogue ───────────────────────────────────────────

test('refuse une pièce absente du catalogue', () => {
  assert.equal(isValidSpec('xa1:a:bg=uni-or,id=licorne'), false);
});

test('refuse une spec incomplète', () => {
  assert.equal(isValidSpec('xa1:a:id=lion'), false);
});

test('refuse un emplacement étranger à la catégorie', () => {
  assert.equal(isValidSpec(defaultSpecFor('m').replace('bd=aucune', 'hj=drape')), false);
});

test('toutes les specs par défaut sont valides, canoniques et tiennent en base', () => {
  for (const kind of Object.keys(catalog.kinds)) {
    const value = defaultSpecFor(kind);
    assert.equal(normalizeSpec(value), value, `défaut non canonique pour ${kind}`);
    assert.ok(value.length <= MAX_SPEC_LENGTH, `défaut trop long pour ${kind}`);
  }
});

// ── Voile et exclusions ──────────────────────────────────────────────────────

test('un voile est une coiffure parmi les autres, pas un emplacement à part', () => {
  const ids = catalog.groups.hairF.items.map((item) => item.id);
  assert.ok(ids.includes('voile-khimar') && ids.includes('afro'));
  assert.ok(!('hj' in catalog.kinds.f.slots), 'l’emplacement hj devrait avoir disparu');
  assert.ok(!('vc' in catalog.kinds.f.slots), 'l’emplacement vc devrait avoir disparu');
  assert.equal(catalog.kinds.f.slots.hr.group, 'hairF');
  assert.equal(catalog.kinds.f.slots.hc.palette, 'hair');
});

test('plus aucune catégorie ne masque d’emplacement', () => {
  for (const kind of Object.keys(catalog.kinds)) {
    const spec = parseSpec(defaultSpecFor(kind));
    assert.equal(
      suppressedSlots(spec, catalog.kinds[kind]).size,
      0,
      `exclusions restantes pour ${kind}`,
    );
  }
});

test('la même couleur teinte le voile comme la chevelure', () => {
  const voile = normalizeSpec(defaultSpecFor('f'));
  const afro = normalizeSpec(voile.replace('hr=voile-bandeau', 'hr=afro'));

  assert.notEqual(renderAvatarSvg(voile), renderAvatarSvg(afro));

  const teinte = catalog.palettes.hair.find((c) => c.id === 'emeraude').hex;
  assert.ok(renderAvatarSvg(voile).includes(teinte));
  assert.ok(renderAvatarSvg(afro).includes(teinte));
});

test('le visage se règle en premier, le fond après les cheveux', () => {
  assert.deepEqual(Object.keys(catalog.kinds.m.slots), [
    'fa', 'sk', 'ex', 'hr', 'hc', 'bd', 'bg', 'cl', 'cc', 'ac',
  ]);
  assert.deepEqual(Object.keys(catalog.kinds.f.slots), [
    'fa', 'sk', 'ex', 'hr', 'hc', 'bg', 'cl', 'cc', 'ac',
  ]);
});

// ── Rendu ────────────────────────────────────────────────────────────────────

/** Toutes les specs qui, ensemble, font intervenir chaque pièce du catalogue au moins une fois. */
function toutesLesPieces() {
  const specs = [];
  for (const [kind, kindDef] of Object.entries(catalog.kinds)) {
    const base = parseSpec(defaultSpecFor(kind));
    specs.push(formatSpec(base));

    for (const [slotKey, slot] of Object.entries(kindDef.slots)) {
      const valeurs = slot.group
        ? catalog.groups[slot.group].items.map((item) => item.id)
        : catalog.palettes[slot.palette].map((color) => color.id);

      for (const valeur of valeurs) {
        specs.push(formatSpec({ kind, values: { ...base.values, [slotKey]: valeur } }));
      }
    }
  }
  return specs;
}

test('chaque pièce du catalogue produit un SVG non vide, clos et sans jeton résiduel', () => {
  const specs = toutesLesPieces();
  assert.ok(specs.length > 150, `seulement ${specs.length} specs couvertes`);

  for (const spec of specs) {
    const svg = renderAvatarSvg(spec);
    assert.ok(svg.startsWith('<svg '), `enveloppe absente pour ${spec}`);
    assert.ok(svg.endsWith('</svg>'), `enveloppe non close pour ${spec}`);
    assert.ok(!svg.includes('{{'), `jeton résiduel dans ${spec}`);
    assert.ok(!/<script|javascript:|onload=|<foreignobject/i.test(svg), `script dans ${spec}`);
  }
});

test('chaque fragment livré est référencé par le catalogue et réciproquement', async () => {
  const { parts } = await import('./generated/parts.ts');
  const referencees = new Set();
  for (const group of Object.values(catalog.groups)) {
    for (const item of group.items) {
      if (!item.none) referencees.add(`${group.prefix}-${item.id}.svg`);
    }
  }
  assert.deepEqual(Object.keys(parts).sort(), [...referencees].sort());
});

test('un rendu est déterministe', () => {
  const spec = normalizeSpec(defaultSpecFor('f'));
  assert.equal(renderAvatarSvg(spec), renderAvatarSvg(spec));
});

// ── Tirage aléatoire ─────────────────────────────────────────────────────────

test('« Surprends-moi » produit toujours une spec que le serveur accepterait', () => {
  for (const kind of Object.keys(catalog.kinds)) {
    for (let i = 0; i < 60; i += 1) {
      const spec = formatSpec(randomSpec(kind));
      assert.ok(isValidSpec(spec), `spec aléatoire invalide : ${spec}`);
      assert.ok(spec.length <= MAX_SPEC_LENGTH, `spec aléatoire trop longue : ${spec}`);
      assert.ok(renderSpec(parseSpec(spec)).startsWith('<svg '));
    }
  }
});

test('le créateur rouvre sur l’avatar existant du joueur', () => {
  const sien = normalizeSpec(defaultSpecFor('f').replace('hr=voile-bandeau', 'hr=voile-khimar'));
  assert.equal(formatSpec(startingSpec(sien, 'f')), sien);
});

test('changer de catégorie repart du défaut sans planter', () => {
  const sien = normalizeSpec(defaultSpecFor('f'));
  assert.equal(formatSpec(startingSpec(sien, 'a')), defaultSpecFor('a'));
});

test('une spec illisible ne laisse pas l’écran vide', () => {
  assert.equal(formatSpec(startingSpec('n’importe quoi', 'm')), defaultSpecFor('m'));
  assert.equal(formatSpec(startingSpec(null, 'm')), defaultSpecFor('m'));
});

// ── Bilan ────────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} test(s) en échec sur ${passed + failures.length} :\n`);
  for (const { name, error } of failures) {
    console.error(`  • ${name}\n    ${error.message}\n`);
  }
  process.exit(1);
}

console.log(`✓ moteur d'avatars : ${passed} tests, dont la parité avec le rendu serveur`);
