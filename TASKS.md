# TASKS — Frontend Xalaat

> **Avant toute chose : lis `GUIDE_TECHNIQUE.md` en entier.** Il contient les règles et les
> pièges déjà rencontrés. Chaque interdiction y correspond à un bug réel.

## Comment utiliser ce fichier

1. Prends **2 à 3 tâches consécutives maximum** par session de travail.
2. Coche `[x]` chaque tâche terminée **et vérifiée**.
3. Lance la batterie de vérification (§6 du guide) avant chaque commit.
4. Une tâche n'est cochée que si **tout est vert** : tests, types, builds, hash CSS.
5. Si tu es bloqué : commite ce qui marche, laisse la case décochée, écris le blocage
   dans la section « Blocages » en bas.

**Ne coche jamais une case dont la vérification n'est pas passée.**

---

## ✅ DÉJÀ FAIT — ne pas refaire

### Phase 0 — Décontamination
- [x] Fossiles Expo morts supprimés, docs utiles archivées dans `docs/`
- [x] 3 dépendances déclarées mais jamais importées retirées
- [x] npm workspaces retenu (un seul lockfile)
- [x] CORS backend : une seule définition au lieu de deux

### Phase 1 — Refactor préparatoire (en Next.js)
- [x] **1a** — `packages/core/src/lib/theme/palette.js` : source unique des couleurs.
      Deux systèmes de nommage concurrents fusionnés. Couleurs Tailwind en hex littéraux
      (indispensable pour NativeWind). **2 bugs corrigés** : les 7 scrims de modale
      n'avaient aucun fond ; `--color-gold` n'était défini nulle part.
- [x] **1b** — Les 54 `alert()`/`window.confirm()` remplacés par `notify` et
      `confirmAsync`. **2 bugs corrigés** : le bouton de confirmation n'avait aucune
      signalétique ; 12 sites affichaient « Request failed with status code 409 » au joueur.
- [x] **1c** — 4 gros fichiers découpés en 35 modules + 4 hooks portables
- [x] **1d** — `routePolicy.ts` : politique d'accès unique et pure. **3 routes n'étaient
      protégées par aucun garde** (`/notifications`, `/solo/game`, `/solo/results`).

### Phase 2 — Monorepo + Expo
- [x] **2A** — Layout monorepo (225 renommages purs, 0 import réécrit)
- [x] **2B** — `apps/game` Expo SDK 57, preset partagé, `storage.native.ts`,
      écran `/dev/tokens`. **Bug corrigé** : les polices seraient tombées sur celle du
      système sur 164 sites.

### Phase 3 — Slice vertical
- [x] **3A** — login, register, shell d'onglets + TabBar, rooms
- [x] **3B** — room/[roomId], lobby, game, ModeratedGame, BuzzerButton,
      `useAppStateReconnect` (reconnexion WebSocket au retour d'arrière-plan)

### Phase 4 — Boucle de jeu (partiellement fait)
- [x] `session/create`, `session/join`, `SessionConfigForm` + 10 sous-composants
- [x] `session/[code]/categories`, `loading`, `results`
- [x] Composants `components/game/` portés

---

## 🔲 À FAIRE

### Phase 4 (fin) — compléter la boucle de jeu

- [ ] **4.1** — Écran `session/[code]/questions`
  - Réf. : `apps/web-legacy/app/session/[code]/questions/page.tsx` (653 l.)
  - Contient **deux APIs sans équivalent RN** :
    - `<input type="file">` (import XLSX) → `expo-document-picker`
    - téléchargement Blob via `<a download>` → `expo-file-system` + `expo-sharing`
      (« télécharger » n'existe pas sur mobile : c'est « partager »)
  - ⚠️ **Dépendances natives → rebuild du dev client.** Groupe-les avec la tâche 5.4.
  - Fini quand : import d'un fichier XLSX fonctionne sur iPhone, export partage un fichier

- [ ] **4.2** — Mode Sprint (`SprintGame`)
  - Réf. : `apps/web-legacy/components/game/sprint/SprintGame.tsx` (293 l.)
  - Le dossier `apps/game/components/game/sprint/` existe déjà — vérifie ce qu'il contient
  - Fini quand : une partie sprint se joue de bout en bout sur iPhone

- [ ] **4.3** — Les 17 animations en Reanimated
  - `AnswerRevealOverlay` et `ProgressiveQuestionDisplay` en dépendent
  - Keyframes source : `apps/web-legacy/global.css`
  - Crée une bibliothèque réutilisable dans `apps/game/components/anim/`
  - Fini quand : aucune saccade sur un appareil d'entrée de gamme

- [ ] **4.4** — Recette complète de la boucle de jeu
  - Une partie **modérée** ET une partie **sprint**, de la création aux résultats
  - Sur **iPhone** et sur **web**
  - Fini quand : les deux parcours passent sans retour au web

---

### Phase 2bis — Extraire l'admin vers Vite *(parallélisable, indépendant)*

L'admin reste **web-only** : personne n'administre depuis un téléphone, et c'est là que se
concentre presque tout le code incompatible RN (tables, recharts).

- [ ] **2bis.1** — Créer `apps/admin/` (Vite + React Router)
  - Déplacer `apps/web-legacy/app/admin/` (11 pages) et `components/admin/` (5 fichiers)
  - `next/navigation` → `react-router-dom`, `app/admin/layout.tsx` → layout avec `<Outlet/>`
  - Garder `recharts` et `sonner` : ils restent du DOM
  - Fini quand : `vite build` sert les 11 pages, auth et mutations fonctionnelles

- [ ] **2bis.2** — Retirer `recharts` et `sonner` des dépendances de `apps/game`
  - `recharts` n'est utilisé que par `app/admin/page.tsx`
  - 9 des 11 fichiers utilisant `sonner` sont dans `admin/`
  - Fini quand : ni l'un ni l'autre n'apparaît dans le bundle de `apps/game`

---

### Phase 5 — Social, solo, capacités natives

- [ ] **5.1** — Onglets sociaux : `dashboard`, `profile`, `friends`, `rankings`
  - Les écrans existent en coquille dans `apps/game/app/(tabs)/` — à compléter
  - Réf. : les pages équivalentes de `apps/web-legacy/app/(tabs)/`
  - `rankings` : listes longues → utilise `FlashList`, pas `ScrollView`
  - Fini quand : les 4 onglets affichent des données réelles sur iPhone

- [ ] **5.2** — `notifications`, `profile/[userId]`, `profile/edit`
  - `profile/edit` contient un upload d'avatar
  - Fini quand : modifier son profil et son avatar fonctionne

- [ ] **5.3** — Mode solo : hub, career, training, `solo/game`, `solo/results`
  - 8 pages sous `(tabs)/solo/` + 2 hors onglets
  - Réf. : `SOLO_MODE_FRONTEND_GUIDE.md` à la racine du projet
  - Fini quand : une partie solo se joue de bout en bout

- [ ] **5.4** — Capacités natives *(groupe TOUTES les dépendances natives ici)*
  - `QRScannerModal` : `getUserMedia` + `<canvas>` + `jsqr` → `expo-camera` `CameraView`
    avec `onBarcodeScanned`. Le résultat sera **plus court** (~40 l. contre 196).
  - `QRCodeModal` : `navigator.share` / `clipboard` → `expo-sharing` / `expo-clipboard`
  - Deep links `join/room/[code]` et `join/session/[code]` sur le scheme `buzzmaster`
    (déjà déclaré dans `app.json`)
  - Android : trafic en clair bloqué depuis Android 9 → `expo-build-properties` avec
    `usesCleartextTraffic: true`, **profil de développement uniquement**
  - ⚠️ **Un seul rebuild du dev client pour tout le groupe**
  - Fini quand : un scan QR ouvre le bon salon ; `buzzmaster://join/room/ABC` ouvre l'app
    sur le bon écran **depuis un état tué**

- [ ] **5.5** — Client push notifications
  - **Dépend de la tâche backend 5.1** (endpoint `POST /api/devices`)
  - `expo-notifications` : demander la permission, récupérer le token Expo,
    l'envoyer au backend après login, **le révoquer au logout**
  - Fini quand : une invitation d'ami déclenche une notification reçue sur iOS et Android

---

### Phase 6 — Écrans de bord et parité web

- [ ] **6.1** — `onboarding`, `confirm-email`, `forgot-password`, `reset-password`
  - `onboarding` contient un `<style>` brut à convertir
  - Les liens e-mail doivent fonctionner comme deep links
  - Fini quand : le parcours d'inscription complet passe depuis un e-mail réel

- [ ] **6.2** — Écran de maintenance sur flag serveur
  - **Dépend de la tâche backend 6.1** (`GET /api/health` avec un booléen `maintenance`)
  - Remplace `MAINTENANCE_MODE` codé en dur dans `middleware.ts`
  - ⚠️ **À terminer AVANT la tâche 6.4**, sinon le mécanisme disparaît sans remplaçant
  - Fini quand : basculer le flag côté admin coupe l'accès sans redéploiement

- [ ] **6.3** — Parité web de `apps/game`
  - Shell desktop centré (`apps/web-legacy/app/layout.tsx` applique
    `md:py-2 md:px-12 md:min-w-2xl` sur `<body>`)
  - 46 classes responsive, 280 `hover:` (ignorés en natif, actifs sur RNW)
  - Raccourci clavier ESPACE du buzzer : garde-le côté web via
    `if (Platform.OS !== 'web') return;` dans le `useEffect`
  - Fini quand : `apps/game` en web couvre 100 % des routes de `web-legacy` hors `/admin`

- [ ] **6.4** — Page d'atterrissage publique *(exigée par les stores)*
  - **Bloquant pour la phase 7** : l'App Store et le Play Store exigent tous deux une
    **URL de politique de confidentialité et une URL de support publiquement accessibles**
  - Marque, badges stores, confidentialité, support
  - Remplace `robots.ts` / `sitemap.ts` qui disparaissent avec Next
  - Fini quand : les deux URLs sont en ligne et accessibles sans authentification

- [ ] **6.5** — Retirer `apps/web-legacy`
  - Bascule DNS, puis suppression en un commit
  - ⚠️ Ne fais ça que si 6.2 et 6.3 sont cochées
  - Fini quand : `apps/web-legacy/` n'existe plus et la production tourne sur `apps/game`

---

### Phase 7 — Durcissement et publication

- [ ] **7.1** — Performance sur Android d'entrée de gamme (4 Go — le marché cible)
  - Les 22 `backdrop-blur` coûtent cher : envisage un fond semi-opaque sur Android
  - Fini quand : le jeu reste fluide sur un appareil 4 Go

- [ ] **7.2** — Clavier et accessibilité
  - 57 `<TextInput>` sur ~10 écrans de formulaire
  - Fini quand : aucun champ n'est masqué par le clavier sur iOS

- [ ] **7.3** — Mesures de latence de buzz *(le KPI produit)*
  - `test-buzzer-latency.sh` existe à la racine — **réutilise-le**
  - **Sur téléphone physique en WiFi, JAMAIS sur simulateur** : le simulateur utilise la
    pile réseau du Mac et donne des chiffres irréalistes
  - Cible : **p95 ≤ latence du web actuel + 30 ms**
  - Fini quand : les chiffres web / iOS / Android sont mesurés et consignés ici

- [ ] **7.4** — `eas.json` et builds de production
  - Aucun `eas.json` n'existe aujourd'hui
  - Fini quand : `eas build --profile production` produit un binaire iOS et un Android

- [ ] **7.5** — Démarches de distribution *(2 à 3 semaines de latence — À LANCER TÔT)*
  - Compte Apple Developer (99 $/an, validation 1–3 jours), compte Google Play (25 $)
  - Certificats et provisioning via EAS, privacy manifest iOS
  - Compte de test à fournir au reviewer Apple
  - Fini quand : les deux comptes sont actifs et les certificats générés

- [ ] **7.6** — Conformité contenu généré par IA
  - ⚠️ `QuestionGenerationService` génère des questions par IA via OpenRouter.
    Les guidelines Apple 1.2 et 4.7 exigent un **mécanisme de signalement**, un CLUF et
    souvent une modération. **Le premier dépôt est rejeté dans une majorité de cas.**
  - À préparer **dès la phase 6**, pas au moment du dépôt
  - Fini quand : signalement de contenu et CLUF sont en place dans l'app

- [ ] **7.7** — TestFlight et piste interne Play
  - Réf. : `docs/testflight-checklist.md`
  - Fini quand : l'app est installable depuis TestFlight

---

## Dettes techniques connues

- [ ] **D1** — `apps/game/types/nativewind-extra.d.ts` déclare à la main `className` sur
      7 interfaces. C'est un contournement : la chaîne
      `/// <reference types="nativewind/types" />` → `react-native-css-interop/types` ne se
      propage pas dans ce monorepo, alors que le paquet est installé et déclare bien
      `ViewProps.className`. **Le runtime est correct, seul le typage ment.** Si tu trouves
      la vraie cause (probablement `typeRoots` ou l'ordre de résolution), supprime le
      contournement.

- [ ] **D2** — `packages/core/src/lib/ui/notify.ts` importe `sonner`, une librairie **web
      uniquement**. À séparer en `.web.ts` / `.native.ts`
      (`react-native-toast-message` côté natif) pour sortir `sonner` des dépendances de core.

- [ ] **D3** — Les ~1093 `var(--x)` restants dans les `style={{}}` de `web-legacy`.
      Réécrits **écran par écran pendant le portage**, jamais d'un coup : un codemod sur du
      JSX est plus risqué que le problème qu'il résout.

---

## Blocages

_À remplir par l'agent. Format : tâche, ce qui bloque, ce qui a été tenté._

