# Fonctionnalité — Thèmes imposés par l'hôte (FRONTEND) + correction du bug sprint

> Lis `../GUIDE_TECHNIQUE.md` avant de commencer.
> ⚠️ **La partie B dépend du backend** (`buzzer_back/docs/FEATURE_THEMES_IMPOSES.md`,
> tâche T6). La **partie A est indépendante : commence par elle.**

---

# PARTIE A — Bug : en sprint, l'hôte ne choisit jamais ses thèmes

## Le diagnostic, déjà fait

`SessionService.createSession` crée le manager avec `isSpectator = false` : **le créateur
est un joueur**. Mais côté serveur, `includeAnswer = isManager && sessionMode !=
WITHOUT_MODERATOR` — autrement dit :

| Mode | Le manager… | Doit choisir des thèmes ? |
|---|---|---|
| `WITH_MODERATOR` | voit les réponses, **arbitre** | **non** |
| `WITHOUT_MODERATOR` (sprint) | ne voit pas les réponses, **joue** | **OUI** |

Or le frontend envoie le créateur **directement au lobby dans les deux cas** :

```
apps/game/app/session/create.tsx:25   router.replace(`/session/${code}/lobby`)
apps/game/app/session/create.tsx:35   onNavigateToLobby={(code) => router.replace(...)}
```

Résultat : en sprint, l'hôte entre en partie **sans aucun thème**, donc aucune question ne
sera générée pour lui, alors qu'il joue.

## Ce qu'il faut faire

- [ ] **A1 — Router selon le mode après création**
  - Si `sessionMode === 'WITHOUT_MODERATOR'` → `/session/{code}/categories`
  - Sinon → `/session/{code}/lobby` (comportement actuel, à préserver)
  - ⚠️ **Anticipe la partie B** : quand `categorySelectionMode === 'MANAGER'`, l'hôte a déjà
    choisi les thèmes au formulaire de création → il va au **lobby**, même en sprint.
    Écris la condition pour que les deux règles cohabitent :
    ```
    va aux categories  SI  sessionMode === 'WITHOUT_MODERATOR'
                       ET  categorySelectionMode !== 'MANAGER'
    ```
  - Vérifie aussi `apps/web-legacy` : le même bug y est probablement présent. **Corrige-le
    aussi** — c'est l'application en production.
  - **Fini quand** : créer une session sprint mène à l'écran de thèmes ; créer une session
    modérée mène au lobby, comme avant

- [ ] **A2 — Recette**
  - Créer une partie **sprint** → écran de thèmes → lobby → démarrer → l'hôte reçoit bien
    des questions de ses thèmes
  - Créer une partie **modérée** → lobby directement (inchangé)
  - **Fini quand** : les deux parcours se comportent comme décrit sur iPhone

---

# PARTIE B — Thèmes imposés par l'hôte

## Le besoin

À la création, l'hôte peut choisir : **« chacun choisit ses thèmes »** (comportement actuel)
ou **« je choisis les thèmes pour tout le monde »**. Dans le second cas il sélectionne les
thèmes une fois et fixe un **nombre total de questions, prérempli à 25**. Les autres joueurs
ne choisissent rien : **l'étape de sélection disparaît de leur parcours**.

## Ce que le backend fournit (tâche T6)

`SessionResponse` porte désormais :
```ts
categorySelectionMode: 'PER_PLAYER' | 'MANAGER'
targetTotalQuestions?: number
sessionCategories?: { name: string; difficulty: DifficultyLevel }[]
```
Et `GET /api/sessions/join/{code}` renvoie un `SessionResponse` — c'est **là** que tu lis le
mode avant de rejoindre, pour décider si tu sautes l'écran de thèmes.

## Ce qu'il faut faire

- [ ] **B1 — Types partagés**
  - Ajouter les 3 champs à `SessionResponse` dans
    `packages/core/src/types/api.ts`, plus `categorySelectionMode` et
    `targetTotalQuestions` à la requête de création
  - **Fini quand** : `tsc --noEmit` vert sur les 3 paquets

- [ ] **B2 — Étape « thèmes » dans le formulaire de création**
  - `apps/game/components/session/SessionConfigForm.tsx` et ses `Step*`
  - ⚠️ **RÉUTILISE l'existant** : il y a déjà `ChoiceStrip`, `ToggleRow`, `StepperField`,
    `ModeCard`, et un sélecteur de thèmes complet dans l'écran
    `apps/game/app/session/[code]/categories.tsx`. **N'écris pas un troisième sélecteur** —
    extrais celui de `categories.tsx` en composant réutilisable si nécessaire.
  - Un `ToggleRow` ou deux `ModeCard` pour le choix du mode
  - Si `MANAGER` : afficher le sélecteur de thèmes + un `StepperField` pour le nombre total,
    **prérempli à 25**
  - Si `PER_PLAYER` : formulaire inchangé
  - ⚠️ La logique va dans `packages/core/src/lib/hooks/useSessionConfig.ts`, la vue dans le
    composant. Le hook ne doit importer ni `next/*` ni d'API DOM.
  - **Fini quand** : les deux modes se configurent et la session est créée correctement

- [ ] **B3 — Sauter l'écran de thèmes quand on rejoint**
  - Quatre points d'entrée envoient aujourd'hui vers `/session/{code}/categories` :
    ```
    apps/game/app/join/session/[code].tsx:15
    packages/core/src/lib/hooks/useRoomDetail.ts:88
    (web-legacy) app/(tabs)/rooms/page.tsx:109 et :189
    (web-legacy) app/(tabs)/room/join/page.tsx:58
    ```
  - Chacun doit d'abord lire le mode via `GET /api/sessions/join/{code}` :
    - `MANAGER` → aller **directement au lobby**
    - `PER_PLAYER` → comportement actuel
  - ⚠️ **Centralise cette décision dans une seule fonction** de `packages/core` (par ex.
    `resolveJoinRoute(session)`), appelée par les quatre points. Dupliquer la condition
    quatre fois garantit qu'un des quatre sera oublié à la prochaine évolution.
  - **Fini quand** : rejoindre une session `MANAGER` mène au lobby sans passer par les thèmes

- [ ] **B4 — Lobby et écran de thèmes**
  - Lobby : masquer « Modifier mes catégories » quand le mode est `MANAGER`, et afficher à
    la place les thèmes imposés (lecture seule)
  - `categories.tsx` : si un joueur y arrive quand même (lien direct, historique de
    navigation), rediriger vers le lobby plutôt qu'afficher un écran inutilisable
  - `totalQuestionsEstimate` dans `useLobbySession.ts:224` vaut aujourd'hui
    `maxCategoriesPerPlayer × questionsPerCategory × nbJoueurs`. En mode `MANAGER`, c'est
    simplement `targetTotalQuestions` — **la multiplication par le nombre de joueurs
    disparaît**, les thèmes étant communs.
  - **Fini quand** : le lobby affiche le bon nombre de questions dans les deux modes

- [ ] **B5 — Recette complète**
  - Partie `MANAGER` : création avec 3 thèmes / 25 questions → 2e joueur rejoint **sans
    passer par les thèmes** → démarrage → 25 questions réparties sur les 3 thèmes
  - Partie `PER_PLAYER` : **comportement strictement inchangé**
  - Les deux sur iPhone et sur web
  - **Fini quand** : les deux parcours passent de bout en bout

---

## Vérification

```bash
npm test                                    # 248 assertions
cd apps/web-legacy && npx tsc --noEmit      # 0
cd ../game && npx tsc --noEmit              # 0
npm --workspace apps/web-legacy run build
cd apps/game && npx expo export --platform web
```

⚠️ Le hash md5 du CSS de `web-legacy` **va changer** si tu corriges le bug A1 côté web —
c'est attendu. Vérifie que les seules classes qui bougent sont celles que tu as touchées.

## Ce qu'il ne faut PAS faire

| Interdit | Pourquoi |
|---|---|
| Écrire un troisième sélecteur de thèmes | Il en existe déjà un dans `categories.tsx` |
| Dupliquer la condition de saut sur 4 fichiers | Un des quatre sera oublié |
| Se fier au frontend seul pour bloquer la sélection | Le serveur doit refuser (tâche backend T4) |
| Changer le comportement du mode `PER_PLAYER` | C'est le mode utilisé en production |
| Mettre la logique de `useSessionConfig` dans la vue | Elle doit rester portable |
