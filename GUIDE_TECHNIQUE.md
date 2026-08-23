# Guide technique — Frontend Xalaat

> **Lis ce fichier EN ENTIER avant d'écrire une ligne.** Il contient les règles qui évitent
> les erreurs déjà commises et corrigées sur ce projet. Chaque interdiction ici correspond à
> un bug réel qui a coûté du temps.

Fichier compagnon : `TASKS.md` (les étapes à cocher).

---

## 1. Ce qu'est ce projet

Jeu de buzzer multijoueur **temps réel** avec questions générées par IA. Monorepo npm
workspaces, en migration de Next.js vers Expo pour livrer iOS + Android + web depuis **un
seul codebase**.

```
buzzer_front/
├── package.json          workspaces + scripts de test + overrides react
├── packages/
│   ├── core/             @xalaat/core — PARTAGÉ, ne dépend d'aucune plateforme
│   │   └── src/
│   │       ├── lib/      api/ auth/ game/ hooks/ query/ theme/ ui/ utils/ websocket/
│   │       ├── stores/   6 stores zustand
│   │       └── types/    api.ts (100 interfaces), websocket.ts, solo.ts
│   └── config/           tailwind-preset.js — couleurs/radius/ombres partagés
└── apps/
    ├── web-legacy/       Next.js 15 — EN PRODUCTION, sera retiré en phase 6
    └── game/             Expo SDK 57 — iOS + Android + web
```

**L'admin ne vit PAS ici.** Il part dans un dépôt séparé, `buzzer_admin` (Vite +
React Router), avec ses propres dépendances — voir la tâche 2bis. Raison : `recharts`,
`sonner` et la pile DOM n'ont rien à faire dans l'arbre mobile, et l'admin n'a pas à subir
la contrainte « une seule version de React » que ce monorepo impose. Si tu croises encore
`apps/web-legacy/app/admin/`, c'est qu'il n'a pas encore été extrait — **ne le porte pas
vers `apps/game`**.

**`apps/web-legacy` est en production. NE LE MODIFIE JAMAIS**, sauf tâche qui le demande
explicitement. C'est la référence de comportement : tu la lis, tu ne la touches pas.

---

## 2. Comment travailler

### 2.1 Ordre imposé

1. Lis `TASKS.md`, prends **2 à 3 tâches consécutives** maximum.
2. `graphify query "<ta question>"` depuis `buzzer-back-front-web/` **avant** tout grep.
3. Lis l'écran web de référence indiqué dans la tâche.
4. Code.
5. Lance la **batterie de vérification** (§6). Tout doit être vert.
6. Commit. Coche la case dans `TASKS.md`.
7. `graphify update .` depuis `buzzer-back-front-web/`.

### 2.2 Ne prends jamais plus de 3 tâches d'un coup

Au-delà, la vérification ne dit plus quelle modification a cassé quoi. Si une tâche te
paraît trop grosse, fais-en la moitié et commite — un commit partiel qui compile vaut mieux
qu'un gros commit cassé.

### 2.3 Si tu es bloqué

Arrête-toi, commite ce qui marche, et **écris le blocage dans ton compte rendu**. Ne
contourne pas en désactivant un test, en ajoutant `: any`, ou en commentant du code.

---

## 3. RÉUTILISER — la règle la plus importante

**Avant d'écrire un composant ou une fonction, cherche s'il existe déjà.**

### 3.1 Ce qui existe déjà dans `packages/core` — À RÉUTILISER, JAMAIS À RÉÉCRIRE

| Besoin | Où | Note |
|---|---|---|
| Couleurs, opacités, polices | `~/lib/theme/tokens` | `palette`, `withAlpha`, `font`, `radius` |
| Appels API | `~/lib/api/` | 16 modules + `client.ts` (3 instances axios, refresh 401) |
| État global | `~/stores/` | auth, session, buzz, game, solo, friend |
| Types | `~/types/api` | 100 interfaces — le type que tu cherches y est |
| WebSocket temps réel | `~/lib/websocket/` | `wsManager`, `useGameSocket`, `useRoomSocket`, `usePresence` |
| Horloge serveur | `~/lib/game/clock.ts` | synchro RTT, ne pas réimplémenter |
| État de jeu | `~/lib/game/packet.ts` | `applyPacket()` résout les courses WS/REST |
| Couleurs d'équipe | `~/lib/game/teamColors.ts` | |
| Révélation progressive | `~/lib/game/useWordReveal.ts` | |
| Compte à rebours | `~/lib/game/useDeadline.ts` | |
| Stockage | `~/lib/utils/storage` | API async ; `storage.native.ts` gère SecureStore/AsyncStorage |
| Requêtes serveur | `~/lib/query/hooks.ts` | 24 hooks TanStack Query |
| Notifications | `~/lib/ui/notify` | `notify.error/success/info`, `notifyApiError` |
| Confirmations | `~/lib/ui/confirm` | `confirmAsync()` → `Promise<boolean>` |
| Accès aux routes | `~/lib/auth/routePolicy` | fonction pure |
| Session, tokens, refresh 401 | `~/stores/useAuthStore` + `~/lib/api/auth` | **à réutiliser pour Google, ne pas dupliquer** |
| Format, avatars | `~/lib/utils/format`, `~/lib/utils/avatar` | |

### 3.2 Hooks métier déjà extraits — RÉUTILISE-LES

```
packages/core/src/lib/hooks/
  useLobbySession.ts    useModeratedGame.ts   useRoomDetail.ts
  useRoomsData.ts       useSessionConfig.ts   useLoginForm.ts
  useRegisterForm.ts
```

Ces hooks contiennent **toute la logique métier** de leurs écrans. Ton travail est de
porter la **vue**, pas de réécrire le métier. Si tu te retrouves à réimplémenter un
chargement de données ou une machine à états, **arrête-toi** : il existe déjà.

### 3.3 Composants déjà portés dans `apps/game/components/`

```
layout/          TabBar
game/            BuzzerButton, AnswerRevealOverlay, AnswerChoicesPanel,
                 GlobalTimerBar, LiveLeaderboard, TeamLeaderboard,
                 ProgressiveQuestionDisplay, IdentificationQuestionDisplay,
                 shared/, moderated/, sprint/, results/
session/         SessionConfigForm, StepGameMode, StepSettings, StepTeams,
                 StepSummary, StepperField, ToggleRow, ChoiceStrip,
                 ModeCard, TeamEditor, SummaryTable
```

**Avant de créer un composant, liste ce dossier.** Si un équivalent existe, étends-le par
une prop plutôt que d'en créer un second.

### 3.4 Où mettre du code neuf

| Nature | Emplacement |
|---|---|
| Logique métier réutilisable, sans plateforme | `packages/core/src/lib/hooks/` |
| Composant d'interface mobile/web | `apps/game/components/<domaine>/` |
| Code **exclusivement natif** (AppState, caméra…) | `apps/game/native/` |
| Écran | `apps/game/app/<route>.tsx` |

---

## 4. Règles absolues

### 4.1 `packages/core/src/lib/hooks/` doit rester portable

**Aucun import `next/*`. Aucune API DOM** (`window`, `document`, `navigator`,
`localStorage`). Ces hooks tournent sous Metro.

La navigation est **injectée par la vue** via des callbacks :

```ts
// DANS LE HOOK (core) — correct
export function useMonEcran({ onNavigate }: { onNavigate: (p: string) => void }) { … }

// DANS LA VUE (apps/game) — correct
const router = useRouter();
useMonEcran({ onNavigate: (p) => router.push(p) });
```

Vérification obligatoire avant chaque commit :

```bash
grep -rn "from 'next/\|window\.\|document\.\|navigator\.\|localStorage" packages/core/src/lib/hooks/
# doit ne RIEN renvoyer
```

### 4.2 Les alias d'import

| Alias | Résout vers |
|---|---|
| `~/lib/*` | `packages/core/src/lib/*` |
| `~/stores/*` | `packages/core/src/stores/*` |
| `~/types/*` | `packages/core/src/types/*` |
| `~/*` | le dossier de l'app courante |

**Piège vécu :** un fichier dans `apps/game/lib/` importé via `~/lib/...` résout vers
**core**, pas vers l'app. C'est pour ça que le code natif local est dans
`apps/game/native/` (`~/native/*`) — le nom `lib` est réservé au paquet partagé.

### 4.3 Jamais de couleur en dur

```tsx
// INTERDIT
<View style={{ backgroundColor: '#B8462A' }} />
<View style={{ backgroundColor: 'var(--color-primary)' }} />   // var() est ignoré en RN

// CORRECT
import { palette } from '~/lib/theme/tokens';
<View style={{ backgroundColor: palette.primary }} />
<View className="bg-primary" />                                 // préférable
```

`var()` dans un objet de style **ne fonctionne ni en React Native ni en NativeWind** : la
chaîne est reçue telle quelle et ignorée **sans erreur**. Le style manque, rien ne signale.

### 4.4 Jamais de dialogue bloquant

`alert()` et `window.confirm()` n'existent pas en RN, et ils **gèlent le thread** sur web —
dans un jeu de buzzer, les trames WebSocket ne sont plus traitées pendant l'attente.

```tsx
notify.error('Impossible de rejoindre');            // au lieu de alert()
notifyApiError(err, 'Impossible de rejoindre');     // préfère le message du backend
const ok = await confirmAsync({ title: '…', message: '…', tone: 'danger' });
if (!ok) return;
```

### 4.5 Jamais de `: any`

Les types sont dans `packages/core/src/types/api.ts` (100 interfaces). Si tu ne trouves
pas le bon type, cherche-le — il existe presque toujours.

**Piège vécu :** la file de buzz n'est **pas** `BuzzQueueItem` (type du store et de l'API)
mais `QueueEntry` de `lib/game/packet.ts`, qui porte en plus `deltaMs`. Les deux coexistent
légitimement.

### 4.6 Authentification tierce — ce qui doit rester partagé

Le bouton « Continuer avec Google » ne remplace rien : il s'ajoute au parcours
username/mot de passe existant.

**Le serveur rend le même DTO.** `POST /api/auth/google` répond exactement comme
`POST /api/auth/login`. Donc `useAuthStore.login()`, le stockage des tokens, le refresh
401 et la restauration de session **se réutilisent tels quels**. Si tu écris une seconde
gestion de session pour Google, tu t'es trompé.

**Découpe portable / plateforme.** `expo-auth-session` est une dépendance native : elle ne
peut pas entrer dans `packages/core/src/lib/hooks/`, qui doit rester utilisable partout.

```
apps/game/native/auth/      obtenir l'ID token auprès de Google  (plateforme)
packages/core/.../hooks/    échanger l'ID token contre les JWT   (partagé)
```

La partie plateforme est **injectée au hook comme callback**, exactement comme la
navigation l'est déjà dans `useLobbySession`.

**Choix imposé : `expo-auth-session`, pas `@react-native-google-signin`.** Le second est
natif uniquement et obligerait à maintenir un second chemin pour le web — contraire au
principe « un seul codebase ». `expo-auth-session/providers/google` couvre iOS, Android et
web avec une seule API.

⚠️ **Guideline Apple 4.8** : proposer Google impose de proposer **aussi** Sign in with
Apple (ou une option équivalente limitant la collecte). **Sans ça, le dépôt est refusé.**
Ce n'est pas optionnel, et ça se découvre au pire moment si on ne le prévoit pas.

⚠️ Les 3 client IDs (Web / iOS / Android) viennent du `.env`, **jamais en dur**. Le
reversed client ID iOS doit être déclaré comme URL scheme dans `app.json`, à côté de
`buzzmaster`.

### 4.7 L'admin est hors périmètre

L'application d'administration part dans un dépôt séparé (`buzzer_admin`). Elle reste du
DOM, sur Vite, avec ses propres dépendances.

**Ne porte jamais un écran d'admin vers `apps/game`.** Personne n'administre depuis un
téléphone, et c'est là que se concentre presque tout le code incompatible React Native :
tables, `recharts`, exports de fichiers.

Son contrat d'API est **généré depuis le backend** (`GET /v3/api-docs`, SpringDoc), pas
recopié depuis `packages/core`. Conséquence pour toi : **si tu modifies un DTO côté
backend, le dépôt admin doit régénérer ses types.** Signale-le dans ton compte rendu.

---

## 5. Les pièges React Native, mesurés sur ce projet

### 5.1 `flex` sans direction — 773 occurrences dans web-legacy

**React Native est `column` par défaut. Le web est `row`.** Recopier `className="flex"`
sans direction produit un layout **silencieusement faux**. Écris toujours `flex-row` ou
`flex-col` explicitement.

### 5.2 Tout texte doit être dans un `<Text>`

```tsx
<View>{nomDuJoueur}</View>              // PLANTE à l'exécution
<View><Text>{nomDuJoueur}</Text></View> // correct
```

### 5.3 Ce qui n'existe pas en React Native

| Web | Remplacement |
|---|---|
| `<div>` | `<View>` |
| `<span>`, `<p>`, `<h1..h6>` | `<Text>` |
| `<button>` | `<Pressable>` ou `<TouchableOpacity>` |
| `<input>` | `<TextInput>` |
| `<img>` | `<Image>` |
| `<table>` | `<FlatList>` |
| `<form>` | rien — gère la soumission à la main |
| `grid-cols-*` | `flexWrap` + largeurs en % |
| `position: fixed`, `sticky` | rien — repense le layout |
| `onClick` | `onPress` |
| `hover:` | ignoré en natif (sans effet, pas d'erreur) |
| `createPortal` | `<Modal>` |
| `truncate`, `line-clamp` | `numberOfLines={n}` |
| `overflow-y-auto` | `<ScrollView>` |

### 5.4 `zIndex` inter-parents n'est pas fiable sur Android

Les overlays (révélation de réponse, pause, changement de catégorie) doivent remonter dans
**un conteneur racine unique**, pas compter sur `zIndex` depuis un parent profond.

### 5.5 Animations

NativeWind ne fournit que `spin` / `pulse` / `bounce`. Les 17 keyframes CSS du projet
doivent passer par **Reanimated 4.5** (installé). N'utilise pas l'`Animated` legacy.

### 5.6 Le clavier iOS masque les champs sans rien signaler

Tout écran avec un `<TextInput>` a besoin de `KeyboardAvoidingView`.

### 5.7 Les icônes

`lucide-react-native` : les icônes prennent **`size` et `color`**, pas `className`.

```tsx
import { Zap } from 'lucide-react-native';
<Zap size={24} color={palette.primary} />
```

### 5.8 Tailwind scanne `content` en TEXTE BRUT, commentaires compris

**N'écris jamais un nom de classe Tailwind littéral dans un commentaire** : l'utilitaire CSS
correspondant sera généré. C'est arrivé sur ce projet.

Corollaire : les noms de classes doivent être **littéraux** dans le code. Le scanner ne
résout pas les gabarits.

```tsx
const cls = `bg-${couleur}`;      // NE SERA PAS GÉNÉRÉ
const cls = actif ? 'bg-primary' : 'bg-surface';   // correct
```

---

## 6. Batterie de vérification — À LANCER AVANT CHAQUE COMMIT

```bash
cd "/Users/macbookair/Desktop/Projects/buzzer ai/buzzer-back-front-web/buzzer_front"

# 1. Les 3 suites de tests (248 assertions)
npm test

# 2. Types — les 3 paquets
cd apps/web-legacy && npx tsc --noEmit && cd ../..    # doit sortir 0
cd apps/game && npx tsc --noEmit && cd ../..          # doit sortir 0

# 3. Builds
npm --workspace apps/web-legacy run build             # vert
cd apps/game && npx expo export --platform web        # vert

# 4. Pureté des hooks partagés
grep -rn "from 'next/\|window\.\|document\.\|navigator\.\|localStorage" packages/core/src/lib/hooks/
# doit ne RIEN renvoyer

# 5. UNE SEULE copie de React — ce contrôle a déjà rattrapé un crash au démarrage
find . -path "*/node_modules/react/package.json" | wc -l          # doit valoir 1
node -p "require('./node_modules/react-native/package.json').peerDependencies.react"
node -p "require('./node_modules/react/package.json').version"
# la 2e doit satisfaire la 1re
```

### 6.1 La preuve de non-régression du web

Le CSS compilé de `web-legacy` doit rester **byte-identique**. C'est ce qui prouve que tu
n'as pas cassé la production. Il attrape ce qu'aucun compilateur ne voit : du JSX perdu,
un glob mal recâblé, un commentaire pollué.

```bash
cat apps/web-legacy/.next/static/css/*.css | md5
# Référence actuelle : 39f27fbb53fc1aeb49fbf35d38edda32
```

Si le hash change **et que tu n'as pas touché à web-legacy**, tu as cassé quelque chose de
partagé. Trouve quoi avant de commiter.

⚠️ **Une seule exception légitime :** la tâche 2bis.5 (retrait de l'admin du dépôt) fait
disparaître les classes de l'admin, donc le hash **va** changer. C'est le seul cas. Quand
il arrive, note le nouveau hash de référence ici même.

### 6.2 L'écran de vérification visuelle

`apps/game/app/dev/tokens.tsx` — chaque couleur est rendue **deux fois côte à côte** :
classe Tailwind à gauche, valeur JS à droite. **Une couture verticale = les deux mécanismes
ont divergé.** Le même principe s'applique aux polices et aux opacités.

Ouvre-le après toute modification touchant au thème.

---

## 7. Environnement de développement

### 7.1 Backend local

```bash
cd buzzer_back && docker compose up -d
# app 8090 → 8080 | postgres 55432 | redis 6380
curl http://localhost:8090/actuator/health
```

### 7.2 L'IP LAN change (DHCP)

Le téléphone joint le Mac par son **IP LAN**, pas `localhost`. Quand ça ne répond plus :

```bash
ipconfig getifaddr en0
```

Puis mets à jour **les deux** :
- `buzzer_front/apps/game/.env` → `EXPO_PUBLIC_API_URL=http://<IP>:8090`
- `buzzer_back/.env` → `CORS_ORIGINS` (ajoute `http://<IP>:8081`)

**Redémarre Expo** après : `EXPO_PUBLIC_*` est substitué à la compilation, un serveur déjà
lancé garde l'ancienne valeur.

### 7.3 Lancer l'app

```bash
cd apps/game
npx expo start --dev-client      # dev client déjà installé
npx expo run:ios --device        # rebuild du dev client (après ajout d'une dép NATIVE)
npx expo start --web             # navigateur
```

**Toujours depuis `apps/game`, jamais depuis `buzzer_front/`.** Lancer `expo run:ios` à la
racine y scaffolde un projet Expo fantôme (`app.json`, `tsconfig.json`, `ios/` de 1,2 Go).

### 7.4 Ajouter une dépendance native = rebuild du dev client

`expo-camera`, `expo-notifications`, `expo-document-picker`, `expo-file-system`,
`expo-sharing`, `expo-build-properties`… **Groupe-les** : chaque rebuild coûte 5–15 min.

Utilise `npx expo install <paquet>` (pas `npm install`) pour obtenir la version compatible
avec le SDK.

---

## 8. Pièges d'infrastructure déjà rencontrés

| Symptôme | Cause | Correctif |
|---|---|---|
| `Cannot read property 'ReactCurrentOwner' of undefined` | React 19 avec un react-native qui attend React 18 | vérifier `peerDependencies.react` de react-native |
| `Invalid hook call` | deux copies de React | `overrides` racine, une seule copie |
| Police système au lieu de Boldonse | `var(--font-*)` dans le preset partagé | polices déclarées par app, pas dans le preset |
| Classe Tailwind absente du CSS | couleur déclarée en `var()` | hex littéraux uniquement |
| `expo start` ouvre Expo Go | dev client pas installé | `npx expo run:ios --device` depuis `apps/game` |
| Projet Expo fantôme à la racine | `expo` dans les deps racine | ne jamais l'y remettre |
| Connexion Google OK en dev, KO en prod | une seule empreinte SHA-1 enregistrée | enregistrer celle de dev **et** celle de prod |
| Dépôt App Store refusé | Google proposé sans Sign in with Apple | guideline 4.8 — les deux ou aucun |

---

## 9. Commits

Un commit par unité cohérente. Message **en français**, factuel, expliquant **pourquoi**
autant que quoi. Termine par :

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

**Ne pousse jamais.** Reste sur la branche `migration/monorepo-layout`.
