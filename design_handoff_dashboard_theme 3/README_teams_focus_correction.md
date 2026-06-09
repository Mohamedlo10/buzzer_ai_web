# Handoff — Mode Équipes · Mode Focus · Correction des scores

> **Suite du handoff `design_handoff_dashboard_theme/README.md`.** Mêmes tokens, mêmes conventions (Next.js + Tailwind + TS, repo `buzzer_ai_web`). Ce document couvre les **3 derniers écrans/comportements** à implémenter. Fichiers de design de référence dans ce bundle : `teams.jsx`, `screens2.jsx` (focus + verrou), `moderator.jsx` (correction), `screens3.jsx` (classement équipes en résultats), `app.jsx` (machine d'états).

Rappel tokens marque : `accent #00D397`, `energy #FFD700`, `buzz #D5442F`, `host #8B5CF6`, `team #4A90D9`, `btn-fg #08231B`. Surfaces + thème clair/sombre : voir le handoff principal. `scrim` = overlay modal (`rgba(8,7,16,0.66)` sombre / `rgba(33,28,61,0.34)` clair).

---

## A. Mode Équipes (`isTeamMode` / format `teams`)

### A.0 Modèle de données
Deux équipes (extensible). Couleurs **fixes** (hors swap de thème) :
```ts
const TEAMS = [
  { id:'red',  name:'Les Rouges', color:'#D5442F' },
  { id:'blue', name:'Les Bleus',  color:'#4A90D9' },
];
```
- Chaque joueur (`row`) porte un `teamId`.
- **Répartition** : `you` suit l'équipe choisie ; les autres alternent pour équilibrer. (Dans le repo réel, l'affectation vient du backend / store de session — ne pas la recalculer côté client si le serveur la fournit.)
- **Score d'équipe** = somme des scores des membres. Classement équipes = tri décroissant par cette somme.

```ts
function teamStandings(rows) {
  return TEAMS.map(t => {
    const members = rows.filter(r => r.teamId === t.id).sort((a,b)=>b.score-a.score);
    return { ...t, members, total: members.reduce((s,m)=>s+m.score,0) };
  }).sort((a,b)=>b.total-a.total);
}
```

### A.1 Écran "Choisis ton équipe" (avant le salon)
**Placement flow** : Catégories → **TeamSelect** (si team mode) → Lobby. En solo, on saute cet écran.
**But** : le joueur rejoint une équipe ; le buzz sera partagé entre coéquipiers.
- Header : back + titre « Choisis ton équipe » + sous-titre « Mode équipes · le buzz est partagé entre coéquipiers ».
- 1 carte par équipe (triées par score) :
  - Bord + fond teintés `color-mix(teamColor 12%, surface)` si c'est **mon** équipe (bordure 1.5px couleur d'équipe), sinon `surface`/`line`.
  - Pastille ronde 46px (rayon 14px) `color-mix(color 22%, transparent)` + disque couleur 20px, bord couleur.
  - Nom équipe (700/16px) + « N joueurs ».
  - À droite : chip **« ✓ Mon équipe »** (fond couleur, texte blanc) si sélectionnée, sinon chip neutre **« Rejoindre »**.
  - **Rangée d'avatars** des membres (30px), chevauchés `margin-left:-8px`, ring = couleur d'équipe.
  - Tap sur la carte = rejoindre cette équipe (réassigne immédiatement).
- Footer : bouton plein « Continuer vers le salon → ».

### A.2 Verrou d'équipe en jeu (`teamBuzzed`)
**Règle réelle** : si **un coéquipier** buzze en premier, **tout le reste de l'équipe est verrouillé** pour cette question.
- Le buzzer passe en **état désactivé** (gris, label **🔒**), non cliquable.
- Sous le buzzer, carte d'info bordée couleur d'équipe :
  - Pastille 30px couleur + icône users.
  - **« Votre équipe a déjà buzzé »** (700/13.5px) + « **<coéquipier>** répond pour <nom équipe> » (muted/12px).
- L'adversaire qui buzze (autre équipe) suit la logique normale (file + chrono).
- Dans la **file de buzz**, chaque entrée affiche un petit **badge couleur d'équipe** (`color-mix(color 22%, transparent)` / texte couleur) à côté du nom.
- Header de l'écran de jeu : chip équipe (`{users} <nom>`) alignée à droite des chips catégorie/difficulté.

État local de référence (proto) : `teamLock: boolean`. Conditions de désactivation du buzzer : `buzzed || mState==='wrong' || mState==='rival' || teamLock`.

### A.3 Classement Équipes (live + résultats)
Panneau `TeamLeaderboard` (réutilisé dans l'écran de jeu **et** les résultats) :
- En-tête : icône users `team` + « Classement équipes » + « N équipes ».
- 1 ligne par équipe (triée) :
  - **Barre de progression** en bas de ligne (largeur = total/maxTotal), couleur d'équipe, opacity .85.
  - Carré rang 26px couleur d'équipe (texte blanc).
  - Pastille couleur 9px + nom équipe (700/14.5px) + chip « Mon équipe » si applicable.
  - **Rangée d'avatars** des membres (24px, chevauchés -7px) — *masquée en variante `compact`*.
  - À droite : total en `Space Grotesk` 19px couleur d'équipe + « pts ».
- **Résultats (team mode)** : afficher ce panneau **au-dessus** du classement individuel (le classement individuel + dettes restent inchangés).

> ⚠️ **Bug flexbox à éviter** : dans un conteneur scrollable `flex-column`, les `.card` doivent avoir `flex-shrink: 0`, sinon l'ajout du panneau équipes (contenu plus haut que le viewport) **écrase/aplatit** toutes les cartes. Exception : les cartes « remplissantes » qui doivent prendre la hauteur restante (ex. liste joueurs du lobby) gardent `flex:1; min-height:0` en style inline.

---

## B. Mode Focus — choix de réponse (sans modérateur, 1er en file)
**Déclencheur** : `answerPanelVisible = isWithoutModerator && amIFirstInQueue && !!myAnswerChoices`. Quand **tu gagnes le buzz** en mode sans modérateur, l'écran bascule en **prise de contrôle "focus"** dédiée au choix de réponse.

**Intention (B&S — guidage + charge de travail)** : isoler la tâche « répondre » en supprimant tout bruit visuel, sous contrainte de temps.

- **Fond focus** : halo radial d'accent en haut (`radial-gradient(120% 70% at 50% 0%, color-mix(accent 22%, transparent), transparent 55%)`) + **vignette** intérieure (`box-shadow: inset 0 0 120px 30px rgba(0,0,0,0.35)`) qui assombrit les bords. (En thème clair, garder la vignette douce.)
- **Header focus** : chip pleine accent **« 🎯 Mode focus · à toi ! »** (texte `btn-fg`) + anneau chrono 52px.
- **Question** centrée, grande (H2 24px, `text-wrap:pretty`), eyebrow catégorie au-dessus.
- **Barre de temps** horizontale (`TimerBar`) : passe ambre puis rouge `buzz` aux paliers 60%/30%.
- **4 choix A/B/C/D** verticaux, **grands** (min-height 62px, rayon 16px, padding 16px) :
  - Pastille lettre 36px (rayon 11px) : `surface-2` au repos, **`accent` + texte `btn-fg`** si sélectionné.
  - Sélection : fond `color-mix(accent 22%, surface)`, bordure accent, **anneau** `box-shadow: 0 0 0 3px color-mix(accent 30%, transparent)`.
  - Les autres choix passent à `opacity .4` une fois un choix fait (verrouillage).
  - Entrée animée en cascade (`stagger`, ~60ms/élément).
- **Hint bas** : « Plus tu réponds vite, plus tu marques de points » → bascule en **rouge gras « ⏱ Vite, le temps file ! »** quand `sec ≤ 3`.
- **Timeout** : si aucun choix avant 0 → réponse nulle (`onAnswer(-1, 0)`).

> ⚠️ **Ne pas gater le rendu sur `requestAnimationFrame`/flag JS** pour l'apparition : utiliser des animations CSS (`rise`/`pop`/`stagger`) gatées par `prefers-reduced-motion`. Un flag JS d'entrée peut laisser l'écran vide si le rAF est gelé (onglet en arrière-plan, capture, etc.).

Barème (proto) : `gain = 600 + round((timeLeft/10)*400)` si correct ; voir règle du buzz anticipé (pénalité) du handoff principal.

---

## C. Correction des scores (modérateur)
**Intention (B&S — contrôle explicite + gestion des erreurs)** : permettre à l'arbitre de rectifier un score (erreur d'arbitrage, bonus manuel) **avec les joueurs clairement identifiables**.

### C.1 Déclencheur
Dans le panneau « Classement » de la vue modérateur, chip **« ✎ Corriger »** (en haut à droite du panneau) → ouvre une **feuille (bottom sheet)** plein largeur.

### C.2 Feuille « Corriger les scores »
- Overlay `scrim` + blur ; carte ancrée en bas, rayon haut 24px, animation `sheetup .3s cubic-bezier(.2,.8,.2,1)`.
- Poignée + bouton X (ferme aussi au clic sur le scrim).
- Titre « Corriger les scores » + sous-titre « Ajuste manuellement les points d'un joueur (erreur d'arbitrage, bonus…). »
- **1 ligne carte par joueur** (triés par score) — **AVATAR VISIBLE obligatoire** :
  - **Avatar 44px** (couronne si leader, ring médaille pour 2e/3e, contour accent si "toi").
  - Nom (700/14px) + score live en `Space Grotesk` 16px (couleur médaille pour le top 3).
  - **4 boutons** d'ajustement : **−100 / −50 / +50 / +100**.
    - Style : bord + fond teintés (`buzz` pour les négatifs, `accent` pour les positifs), `color-mix(c 14%, transparent)` fond / `color-mix(c 35%, transparent)` bord, texte couleur, `Space Grotesk` 600/12px, rayon 9px, min-width 38px.
  - Au clic : applique le delta **immédiatement** (`award(name, delta)` → `score = max(0, score+delta)`) + **toast** de confirmation (`<nom> +100` vert / `<nom> −50` rouge).
- Footer : bouton plein « Terminer la correction » (ferme la feuille).

### C.3 Affichage des joueurs sur la page modérateur (hors feuille)
Le panneau « Classement » permanent de la vue modérateur doit lui aussi montrer **l'avatar (30px)** de chaque joueur + rang coloré (médaille top 3) + nom + score. (Avant : certaines lignes n'affichaient pas l'avatar — désormais systématique.)

### C.4 `award` — logique de référence
```ts
const award = (name, pts) =>
  setRows(rs => rs.map(r => r.name === name
    ? { ...r, score: Math.max(0, r.score + pts), lastGain: pts }
    : r));
```
> Dans le repo réel, brancher `award` sur l'action de correction du store/API modérateur (websocket → broadcast du nouveau score à tous les clients), pas sur un état local.

---

## D. Machine d'états (rappel des branches ajoutées)
- **Tweaks/flags pilotes** : `role` (`player|mod`), `mode` (`mod|host` = avec/sans modérateur), `format` (`solo|teams`).
- **Phases** : `dashboard → categories → [teams] → lobby → generating → game → (yourturn=focus | reveal) → results`.
  - `teams` n'apparaît que si `format==='teams'`.
  - En `game`, `role==='mod'` rend la **vue modérateur** (avec correction) ; sinon la **vue joueur** mode-dépendante (`mode`), avec verrou d'équipe si `format==='teams'`.
  - `yourturn` = **mode focus** (atteint seulement en `mode==='host'` après un buzz gagnant).
- **Résultats** : `format==='teams'` → ajoute le panneau Classement équipes au-dessus de l'individuel.

## E. Mapping repo
| Élément | Fichier cible |
|---|---|
| Sélection d'équipe | nouveau `app/session/[code]/teams/page.tsx` (ou intégré au lobby) |
| Verrou d'équipe + file colorée | `app/session/[code]/game/page.tsx`, `components/game/*` (BuzzQueue) |
| Classement équipes | nouveau `components/game/TeamLeaderboard.tsx` (live + results) |
| Mode focus réponse | `components/game/AnswerChoicesPanel.tsx` (variante focus) + page game |
| Correction scores | vue modérateur de `game/page.tsx` + nouveau `components/game/ScoreCorrectionSheet.tsx` |
| Avatars classement modérateur | composant classement de la vue modérateur |

## F. Critères B&S préservés (spécifiques à ces écrans)
- **Guidage** : libellés explicites (verrou d'équipe, « Mode focus · à toi ! »), toasts de correction.
- **Contrôle explicite** : correction = action manuelle réversible (±), annulable, fermeture claire.
- **Gestion des erreurs** : score borné à ≥ 0 ; correction pensée pour rattraper une erreur d'arbitrage.
- **Charge de travail** : mode focus supprime tout le superflu pour la tâche « répondre ».
- **Signifiance** : couleurs d'équipe constantes, avatars partout pour identifier les joueurs.
- **Compatibilité** : bottom sheet + feedback tactile, patterns mobiles.
