/**
 * Garde de contrat WebSocket.
 *
 * Compare SESSION_TOPICS dans WebSocketManager.ts (frontend)
 * avec le Set<String> SESSION_TOPICS dans StompDestinationAuthorizer.java (backend).
 *
 * Principes (StompDestinationAuthorizer.java) :
 *   « Doit rester aligné avec WebSocketManager.SESSION_TOPICS côté client et avec
 *    les destinations réellement publiées par WebSocketNotificationService. »
 *
 * Usage : node packages/core/src/lib/websocket/ws-contract.test.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Chemin absolu vers la racine du dépôt, calculé à partir du script lui-même.
// Structure : buzzer-back-front-web/buzzer_front/packages/core/src/lib/websocket/
//             ←── 7 niveaux ──────────────────────────────────────────────────→
// Puis on descend dans buzzer_back/.
const REPO_ROOT = resolve(__dirname, '../../../../../..');

// ─── Lecture du frontend ──────────────────────────────────────────────────────

const wsManagerPath = resolve(
  __dirname,
  'WebSocketManager.ts',
);
const wsManagerSrc = readFileSync(wsManagerPath, 'utf8');

// Extrait le tableau SESSION_TOPICS = [ 'a', 'b', ... ] as const;
const frontMatch = wsManagerSrc.match(
  /private\s+static\s+readonly\s+SESSION_TOPICS\s*=\s*\[([\s\S]*?)\]\s*as\s+const/,
);
if (!frontMatch) {
  console.error('❌ SESSION_TOPICS introuvable dans WebSocketManager.ts');
  process.exit(1);
}
const frontTopics = new Set(
  // Retirer les lignes de commentaire avant d'extraire les chaînes :
  // les commentaires en français contiennent des apostrophes (d'état, etc.)
  // qui faussaient le comptage.
  frontMatch[1]
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n')
    .match(/'([^']+)'/g)
    ?.map((s) => s.slice(1, -1)) ?? [],
);

// ─── Lecture du backend ───────────────────────────────────────────────────────

const authorizerPath = resolve(
  REPO_ROOT,
  'buzzer_back/src/main/java/com/buzzmaster/api/security/StompDestinationAuthorizer.java',
);
const authorizerSrc = readFileSync(authorizerPath, 'utf8');

// Extrait le Set.of("a", "b", ...) de SESSION_TOPICS
const backMatch = authorizerSrc.match(
  /SESSION_TOPICS\s*=\s*Set\.of\s*\(([\s\S]*?)\)/,
);
if (!backMatch) {
  console.error('❌ SESSION_TOPICS introuvable dans StompDestinationAuthorizer.java');
  process.exit(1);
}
const backTopics = new Set(
  [...backMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]),
);

// ─── Comparaison ──────────────────────────────────────────────────────────────

const onlyInFront = [...frontTopics].filter((t) => !backTopics.has(t));
const onlyInBack = [...backTopics].filter((t) => !frontTopics.has(t));

if (onlyInFront.length === 0 && onlyInBack.length === 0) {
  console.log(`✅ WS contract OK — ${frontTopics.size} topics en phase : [${[...frontTopics].sort().join(', ')}]`);
  process.exit(0);
}

console.error('❌ WS contract DIVERGENCE :');
if (onlyInFront.length) {
  console.error(`   Frontend only  : ${onlyInFront.join(', ')}`);
}
if (onlyInBack.length) {
  console.error(`   Backend only   : ${onlyInBack.join(', ')}`);
}
console.error('');
console.error('Action requise :');
console.error('  • Ajouter le topic manquant dans l\'un des deux fichiers, OU');
console.error('  • S\'il est mort, le retirer de la liste source.');
process.exit(1);
