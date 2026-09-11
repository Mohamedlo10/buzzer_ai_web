#!/usr/bin/env node
/**
 * Recopie le catalogue d'avatars du backend dans `packages/avatar`.
 *
 * Le catalogue et les fragments SVG sont canoniques côté backend : c'est lui qui valide ce que
 * les joueurs enregistrent, et il lui faut de toute façon ces fichiers comme ressources de
 * classpath. Ce script en produit la copie que le client embarque, pour qu'il puisse dessiner un
 * avatar sans réseau — l'aperçu du créateur doit répondre au doigt, et une liste de classement ne
 * doit pas déclencher une requête par ligne.
 *
 * Les fragments sont **inlinés dans un module TypeScript** plutôt que copiés en `.svg` : Metro ne
 * sait pas importer de SVG sans `react-native-svg-transformer`, absent du projet, et l'ajouter
 * pour cent fichiers statiques serait payer une dépendance de build pour rien.
 *
 * Usage : node scripts/sync-avatar-assets.mjs [chemin/vers/buzzer_back]
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const frontRoot = resolve(here, '..');

const backRoot = resolve(frontRoot, process.argv[2] ?? '../buzzer_back');
const sourceDir = join(backRoot, 'src/main/resources/avatars/v1');
const outDir = join(frontRoot, 'packages/avatar/src/generated');

const banner = (source) => `/**
 * FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.
 *
 * Produit par \`node scripts/sync-avatar-assets.mjs\` depuis
 * \`buzzer_back/src/main/resources/avatars/v1/${source}\`, qui est la source de vérité.
 * Toute retouche ici serait écrasée à la prochaine synchronisation — et ferait diverger le rendu
 * client du rendu serveur, ce que le test de parité fait échouer.
 */
`;

function main() {
  const catalogRaw = readFileSync(join(sourceDir, 'catalog.json'), 'utf8');
  const catalog = JSON.parse(catalogRaw);

  const partsDir = join(sourceDir, 'parts');
  const files = readdirSync(partsDir).filter((f) => f.endsWith('.svg')).sort();

  // `.trim()` reproduit exactement ce que fait AvatarRenderService à la lecture. Sans cela, un
  // retour à la ligne final suffirait à décaler l'empreinte du rendu et à casser la parité.
  const parts = {};
  for (const file of files) {
    parts[file] = readFileSync(join(partsDir, file), 'utf8').trim();
  }

  const referenced = new Set();
  for (const group of Object.values(catalog.groups)) {
    for (const item of group.items) {
      if (item.none) continue;
      referenced.add(`${group.prefix}-${item.id}.svg`);
    }
  }

  const missing = [...referenced].filter((f) => !(f in parts));
  if (missing.length) {
    console.error(`Fragments référencés par le catalogue mais absents :\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }

  const orphans = files.filter((f) => !referenced.has(f));
  if (orphans.length) {
    console.error(`Fragments présents sur le disque mais non référencés :\n  ${orphans.join('\n  ')}`);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  writeFileSync(
    join(outDir, 'catalog.ts'),
    `${banner('catalog.json')}
import type { AvatarCatalog } from '../types.ts';

export const catalog: AvatarCatalog = ${JSON.stringify(catalog, null, 2)} as const;
`,
  );

  const entries = Object.keys(parts)
    .sort()
    .map((file) => `  ${JSON.stringify(file)}: ${JSON.stringify(parts[file])},`)
    .join('\n');

  writeFileSync(
    join(outDir, 'parts.ts'),
    `${banner('parts/*.svg')}
export const parts: Record<string, string> = {
${entries}
};
`,
  );

  const golden = readFileSync(join(sourceDir, 'golden.json'), 'utf8');
  writeFileSync(join(outDir, 'golden.json'), golden);

  console.log(
    `Catalogue v${catalog.version} synchronisé : ${files.length} fragments, ` +
      `${Object.keys(catalog.kinds).length} catégories.`,
  );
}

main();
