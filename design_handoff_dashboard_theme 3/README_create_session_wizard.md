# Handoff — Wizard de création de session

> **Suite des handoffs précédents.** Mêmes tokens, mêmes conventions (Next.js + Tailwind + TS, repo `buzzer_ai_web`). Ce document couvre le **redesign du `SessionConfigForm`** en wizard multi-étapes. Fichier de design de référence : `create.jsx`.

Tokens : `accent #00D397`, `energy #FFD700`, `buzz #D5442F`, `host #8B5CF6`, `team #4A90D9`, `btn-fg #08231B`. Surfaces + thème clair/sombre : voir `README.md`.

---

## Vue d'ensemble

Le `SessionConfigForm` existant est un long formulaire scrollable dans un bottom sheet. Le redesign le remplace par un **wizard progressif 3 ou 4 étapes**, présenté en plein écran sur mobile (ou modal large sur desktop). Il conserve **100% des fonctionnalités** de l'original, en les répartissant logiquement pour réduire la charge cognitive (B&S).

```
Étape 1 : Mode          → Modération + Source des questions + Mode équipes
Étape 2 : Réglages      → Timers, questions, joueurs, dettes (conditionnel)
Étape 3 : Équipes       → (uniquement si isTeamMode, sinon sautée)
Étape 4/3 : Récap       → Tableau récapitulatif + bouton Créer
```

**Fichier cible dans le repo** : `components/session/SessionConfigForm.tsx` (refonte) + éventuellement `components/session/CreateSessionWizard.tsx` si tu préfères un nouveau composant.

---

## Layout général

- **Header fixe** (sticky, blur) : bouton Retour/Fermer (←/✕) + titre « Créer une session » + sous-titre « \<Nom étape\> · étape N/Total » + chip « Suivant › » (visible sur étapes non-finales pour accès rapide).
- **Barre de progression** sous le header : N segments égaux, remplis en `accent` pour les étapes complétées + en cours, `surface-2` pour les suivantes. Transition `background .3s`.
- **Corps scrollable** (`flex:1, overflow-y:auto`) avec `padding: 16px 18px`.
- **Footer fixe** : bouton ← (retour, visible dès étape 2) + bouton principal plein-largeur (`btn` vert, libellé contextuel).

## Composants internes

### `ModeCard` — grande carte de sélection visuelle
```tsx
<ModeCard
  icon={<Icon/>}       // lucide, 26px
  label="Avec modérateur"
  sublabel="L'hôte valide les réponses"
  active={sessionMode === 'WITH_MODERATOR'}
  accent="var(--accent)"      // couleur quand actif
  onClick={() => setSessionMode('WITH_MODERATOR')}
/>
```
- `flex:1`, rayon 18px, border 2px (`accent` si actif, `line` sinon).
- Fond : `color-mix(accent 14%, surface)` si actif, `surface` sinon.
- Icône dans un carré 52×52, rayon 15px : `color-mix(accent 22%, transparent)` si actif, `surface-2` sinon.
- Label 14.5px bold, couleur `accent` si actif. Sublabel 11px `txt-40`.
- Transition `all .18s`.

### `StepperField` — stepper − valeur +
```tsx
<StepperField
  label="TEMPS POUR RÉPONDRE"  // eyebrow uppercase
  value={answerTimeSeconds}
  suffix="s"
  min={5} max={60} step={5}
  onChange={setAnswerTimeSeconds}
  accent="var(--accent)"        // couleur de la valeur affichée
/>
```
- Carte (`card` tokens) padding 14px 12px.
- Label = eyebrow 9.5px uppercase `txt-40`.
- Boutons −/+ : cercles 36×36 `surface-2`, bord `line`, désactivés + `opacity .38` aux limites.
- Valeur : `Space Grotesk` 22px 600, couleur `accent` (ou `warn` pour dettes>0).
- Afficher les deux boutons même aux limites (juste désactivés) — ne pas masquer.

### `ToggleRow` — ligne avec switch iOS
```tsx
<ToggleRow
  icon={<Users/>}
  label="Mode équipes"
  sub="Les points sont partagés entre coéquipiers"
  checked={config.isTeamMode}
  onChange={v => setConfig(c => ({...c, isTeamMode: v}))}
  accent="var(--team)"
/>
```
- Carte padding 13px 15px, flex row.
- Icône 36×36 rayon 11px, fond `color-mix(accent 14%, transparent)`.
- Switch custom : 48×28, rayon 14px, fond `accent` si on/`surface-2` si off; pastille blanche 20×20, `translate-x-6` si on / `translate-x-1` si off. Transition `background .2s`, `left .2s`. Utiliser `role="switch" aria-checked`.

### `ChoiceStrip` — choix du nombre de réponses
- Carte avec eyebrow + rangée de 6 boutons flex égaux : `Auto | 2 | 3 | 4 | 5 | 6`.
- Actif : fond `color-mix(accent 16%, surface)`, bord `accent`, texte `accent`.
- Inactif : fond `surface`, bord `line`, texte `txt-60`.

### `TeamEditor` — éditeur d'équipes (inchangé fonctionnellement)
- Garde la logique existante (`addTeam`, `removeTeam`, `updateName`, `cycleColor`).
- **Refonte visuelle** : chaque équipe dans une carte (`card` tokens) padding 12px 13px, flex row gap 11px.
  - Pastille couleur : 42×42 rayon 12px, fond = couleur d'équipe, icône `Palette` blanc 17px. Tap = cycle couleur.
  - Input nom : `field` tokens, flex 1, fontSize 15px.
  - Bouton X : `iconbtn` 36×36, fond `color-mix(buzz 15%, transparent)` / couleur `buzz` si supprimable, sinon `surface-2` / `txt-25`. Désactivé si `teams.length <= 2`.
- Bouton « + Ajouter une équipe » : plein-largeur, `border-dashed line`, flex center, icône + texte `txt-60`. Masqué si `teams.length >= 8`.
- Encart d'erreur rouge si `teams.length < 2` : `color-mix(buzz 10%, transparent)`, bord `buzz 28%`.

### `StepBar` — barre de progression
```tsx
<StepBar step={currentStep + 1} total={totalSteps} />
// step = nombre d'étapes remplies (1-indexed, inclut en cours)
```
- `display:flex; gap:8px`. Chaque segment : `flex:1; height:4px; border-radius:99px`.
- Rempli (`i < step`) : `accent`, `opacity:1`.
- En cours (`i === step`) : `accent`, `opacity:1` (ou légèrement plus clair).
- À venir : `surface-2`, `opacity:0.5`.

### `SummaryTable` — récapitulatif
- Carte `overflow:hidden padding:0`. 1 ligne par paramètre :
  - Icône 32×32 rayon 9px, fond `color-mix(couleur 16%, surface-2)`, icône en `couleur`.
  - Label 13px `txt-60` (flex:1).
  - Valeur 13.5px bold, couleur contextuelle (vert = default, or = IA, ambre = dettes>0, bleu = équipes, etc.).
  - Séparateur `border-bottom line` sauf dernière ligne.

---

## Étape par étape

### Étape 1 : Mode (3 groupes)

**Groupe Modération** — label eyebrow « MODÉRATION » + 2 `ModeCard` côte à côte :
| Carte | Icône lucide | Accent | Sublabel |
|---|---|---|---|
| Avec modérateur | `User` | `accent` | « L'hôte valide les réponses » |
| Sans modérateur | `Bot` | `host` | « Réponses automatiques » |

**Groupe Questions** — label eyebrow « SOURCE DES QUESTIONS » + 2 `ModeCard` :
| Carte | Icône | Accent | Sublabel |
|---|---|---|---|
| IA | `Sparkles` | `accent` | « Générées par l'IA » |
| Manuel | `PenLine` | `energy` | « Saisies dans le lobby » |

Si `questionMode === 'MANUAL'` → encart info `energy` (bord + fond teintés) : « Vous pourrez saisir vos questions dans le lobby avant de démarrer. »

**Groupe Options** — `ToggleRow` mode équipes (accent = `team`).

Si `sessionMode === 'WITHOUT_MODERATOR'` → encart info `host` : « Questions affichées progressivement · réponses automatisées · buzz risqué avant lecture complète. »

**Footer** : bouton « Régler les paramètres › » si étape 0, ou libellé contextuel suivant.

---

### Étape 2 : Réglages (conditionnel)

**Si `WITH_MODERATOR`** :
- Section « BUZZ COUNTDOWN » → 1 `StepperField` : Temps pour répondre (5–60s, step 5).

**Si `WITHOUT_MODERATOR`** :
- Section « TIMERS (SANS MODÉRATEUR) » → grille 2 col :
  - Temps pour répondre (5–60s, step 5).
  - Timer global (15–120s, step 5).
- `ChoiceStrip` (Auto/2/3/4/5/6).

**Si `questionMode === 'AI'`** :
- Section « QUESTIONS IA » → grille 2 col :
  - Questions/cat. (2–15).
  - Catégories max (1–10).

**Section « PARTIE »** (toujours) → grille 2 col :
- Joueurs max (2–50).
- Points / réponse (1–50, step 5).
- Dettes (0–50, step 5) — valeur en `warn` si > 0.

**Footer** : ← + bouton « Configurer les équipes › » (si team mode) ou « Voir le récap › ».

---

### Étape 3 : Équipes (seulement si `isTeamMode`)

- Encart info `team` : « Minimum 2 équipes · maximum 8. Clique sur la pastille pour changer la couleur. »
- `TeamEditor` (voir composant ci-dessus).
- **Footer** : ← + « Voir le récap › ».

---

### Étape finale : Récapitulatif

**Hero** : icône ⚡ 68×68 rayon 22px, fond dégradé vert (`linear-gradient(135deg, accent, accent-d)`), glow. Animation `pop .5s`. Titre « Tout est prêt ! » H2 22px. Sous-titre muted 13px.

**`SummaryTable`** — lignes :
| Paramètre | Icône | Couleur valeur |
|---|---|---|
| Modération | `User` / `Bot` | `accent` / `host` |
| Questions | `Sparkles` / `PenLine` | `accent` / `energy` |
| Questions/cat. (si IA) | `Target` | `txt` |
| Timers (si sans mod.) | `Timer` | `txt` |
| Choix de réponse (si sans mod.) | `Zap` | `txt` |
| Buzz countdown (si avec mod.) | `Timer` | `txt` |
| Joueurs max | `Users` | `txt` |
| Points / réponse | `Award` | `txt` |
| Dettes | `Zap` | `warn` si > 0 |
| Format | `Users` | `team` si équipes |

**Footer** : ← + bouton « ⚡ Créer la session » (`btn` vert). Désactivé si `isTeamMode && teams.length < 2`. En loading : spinner + « Création… ». Appel API : `createSession(finalConfig)` puis `router.push(/session/${code}/lobby)`.

---

## Gestion des erreurs (B&S)

- **Validation** avant soumission : `teams.length >= 2` si team mode, nom non vide (salle).
- **Erreur API** : affichée dans une carte rouge `buzz` avec icône `AlertCircle` et message précis :
  - 401 → « Session expirée. Veuillez vous reconnecter. »
  - 403 → « Accès refusé. »
  - 5xx → « Erreur serveur. Réessayez plus tard. »
  - Réseau → « Impossible de joindre le serveur. Vérifiez votre connexion. »
  - Sinon → `err.response.data.message` ou message générique.
- Erreur affichée **sur la dernière étape** (juste au-dessus du footer), pas sur une page séparée.

---

## Intégration dans le repo

### Option A — Refonte inline de `SessionConfigForm`
Remplacer le corps de `SessionConfigForm.tsx` par le wizard. L'interface `SessionConfigFormProps` reste identique (`onSuccess`, `roomId`, `initialMaxPlayers`). La logique de `handleCreate` et les appels API sont inchangés.

### Option B — Nouveau composant (recommandé)
Créer `components/session/CreateSessionWizard.tsx`, importer et utiliser à la place de `SessionConfigForm` dans `app/(tabs)/room/[roomId]/page.tsx` et partout où le formulaire est invoqué.

### Props à garder
```ts
interface CreateSessionWizardProps {
  onSuccess?: (sessionId: string, code: string) => void;
  onClose?: () => void;        // nouveau — ferme le wizard (X / retour étape 1)
  roomId?: string;
  initialMaxPlayers?: number;
}
```

### State (inchangé)
Tous les champs de `CreateSessionRequest` + `sessionMode`, `questionMode`, `teams` restent. Les répartir dans les étapes ne change pas la structure de données envoyée à l'API.

### `createSession` call (inchangé)
```ts
const withoutModExtras = sessionMode === 'WITHOUT_MODERATOR'
  ? { answerTimeSeconds, globalQuestionSeconds, answerChoicesCount }
  : {};
const finalConfig = config.isTeamMode
  ? { ...config, sessionMode, ...withoutModExtras, teams }
  : { ...config, sessionMode, ...withoutModExtras };
const result = await createSession(finalConfig);
```

---

## Points B&S préservés
1. **Guidage** — chaque étape a un titre + sous-titre + labels eyebrow + sublabels explicatifs sur chaque carte.
2. **Charge de travail** — les paramètres conditionnels (timers sans modérateur, éditeur équipes) n'apparaissent qu'à l'étape concernée.
3. **Contrôle explicite** — retour à l'étape précédente à tout moment ; fermeture (✕) depuis l'étape 1 ; récap avant de créer.
4. **Homogénéité** — `ModeCard`, `StepperField`, `ToggleRow`, `card` tokens — composants partagés avec le reste de l'app.
5. **Gestion des erreurs** — messages précis par code HTTP, affichés sur la dernière étape avec piste de correction.
6. **Adaptabilité** — thème clair/sombre via tokens CSS (aucune couleur hardcodée hors marque).
7. **Signifiance** — icônes lucide + libellés français explicites, sous-titres sur chaque choix.
8. **Compatibilité** — steppers tactiles (cibles 36px min), toggle style iOS, navigation étape par étape familiar.

---

## Fichiers de référence
- `create.jsx` — implémentation complète du wizard (React/JSX, proto)
- `components/session/SessionConfigForm.tsx` — fichier cible dans le repo
- `app/(tabs)/room/[roomId]/page.tsx` — point d'intégration principal
