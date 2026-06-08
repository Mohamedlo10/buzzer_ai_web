# Handoff — Refonte Dashboard & Thème clair/sombre (Quiz By Mouha_Dev)

> **Pour Claude Code / développeur travaillant dans le repo `buzzer_ai_web` (Next.js + Tailwind + TypeScript).**

## Overview
Refonte visuelle de l'app de quiz/buzzer **Quiz By Mouha_Dev** : nouveau **dashboard d'accueil**, **système de thème clair/sombre**, **barre d'onglets**, **modal Rejoindre** avec gestion d'erreurs, **modal profil joueur**, et passe ergonomique selon les **8 critères de Bastien & Scapin**. Le redesign couvre aussi le flow de jeu (catégories → lobby → génération IA → jeu/buzzer → résultats) côté joueur ET modérateur.

L'objectif de ce handoff : **réimplémenter ce design dans le repo réel** (Next.js/Tailwind/TS), en réutilisant les composants et conventions déjà présents (`components/dashboard`, `components/ui`, `components/game`, `global.css`, `tailwind.config.js`).

## About the Design Files
Les fichiers fournis (`Quiz Redesign.html` + `.jsx` + `style.css`) sont des **références de design** : un prototype React/Babel mono-dossier qui montre l'apparence et le comportement voulus. **Ce n'est pas du code à copier tel quel** dans le repo — c'est une maquette haute-fidélité à **recréer** avec ta stack existante (composants Next.js, classes Tailwind, types TS), en suivant les patterns déjà en place.

## Fidelity
**Haute-fidélité (hifi).** Couleurs, typographie, espacements, rayons et interactions sont définitifs. Reproduis au pixel près en utilisant tes composants/utilitaires Tailwind existants.

---

## Design Tokens

### Couleurs de marque (identiques dans les 2 thèmes)
| Token | Hex | Usage |
|---|---|---|
| `accent` (vert signature) | `#00D397` | Action principale, succès, liens |
| `accent-d` | `#00B383` | Dégradé bouton vert |
| `energy` (or) | `#FFD700` | Hôte/modérateur, 1ʳᵉ place, podium, highlights |
| `buzz` (rouge) | `#D5442F` | Buzzer, danger, pénalité, action "Rejoindre" |
| `buzz-h` | `#FF6B4A` | Hover/dégradé buzzer |
| `host` (violet) | `#8B5CF6` | Mode sans modérateur |
| `team` (bleu) | `#4A90D9` | Équipes, précision |
| `warn` (ambre) | `#F59E0B` | Avertissements, stats |
| `silver` | `#C0C0C0` | 2ᵉ place |
| `bronze` | `#CD7F32` | 3ᵉ place |
| `btn-fg` | `#08231B` | Texte foncé sur boutons vert/or (les 2 thèmes) |

### Surfaces — THÈME SOMBRE (défaut)
| Token | Valeur |
|---|---|
| `bg` | `#292349` |
| `bg-deep` | `#211C3D` |
| `surface` | `#342D5B` |
| `surface-2` | `#3E3666` |
| `line` | `#3E3666` |
| `txt` | `#FFFFFF` |
| `txt-60` | `rgba(255,255,255,0.62)` |
| `txt-40` | `rgba(255,255,255,0.40)` |
| `txt-25` | `rgba(255,255,255,0.25)` |
| `scrim` (overlay modal) | `rgba(8,7,16,0.66)` |

### Surfaces — THÈME CLAIR
| Token | Valeur |
|---|---|
| `bg` | `#EFEDF8` |
| `bg-deep` | `#E5E2F2` |
| `surface` | `#FFFFFF` |
| `surface-2` | `#F2F0FA` |
| `line` | `#E3DFF1` |
| `txt` | `#211C3D` |
| `txt-60` | `rgba(33,28,61,0.60)` |
| `txt-40` | `rgba(33,28,61,0.42)` |
| `txt-25` | `rgba(33,28,61,0.28)` |
| `scrim` | `rgba(33,28,61,0.34)` |
| Ombre carte (clair) | `0 1px 3px rgba(33,28,61,0.06), 0 8px 24px -16px rgba(33,28,61,0.18)` |

### Typographie
- **Titres / chiffres** : `Space Grotesk`, weights 500/600, `letter-spacing: -0.01em`
- **UI / texte** : `Hanken Grotesk`, weights 500/600/700
- **Eyebrow** (sur-titre) : 10px, `letter-spacing: 0.18em`, uppercase, weight 700, couleur `accent`
- Échelle utilisée : H1 22–26px, H2 19–21px, titres carte 14–15px, corps 13–14px, légende 11–12px

### Rayons & espacements
- Rayons : boutons `16px`, cartes `20px`, chips `99px` (pill), petits badges `8–12px`, avatars `50%`
- Padding écran : header `60px 18px 14px`, corps `16px 18px 22px`, footer `12px 18px (+safe-area)`
- Gaps de section : `18–20px` ; gaps de liste : `9–11px`

### Halo (glow)
Dégradés radiaux d'ambiance dans le fond : intensité pilotée par `--glow` (défaut 0.32). En thème clair, réduire fortement (≈ 0.26×26% / 0.16×16%) pour rester doux.

---

## Implémentation du thème clair/sombre (priorité)

**Approche recommandée pour le repo :** thème par attribut `data-theme="light|dark"` sur un wrapper racine + variables CSS, exposées à Tailwind.

1. **`global.css`** — définir les tokens en `:root` (sombre par défaut) et les surcharger sous `[data-theme="light"]`. Garder les couleurs de marque hors du swap (constantes).
2. **`tailwind.config.js`** — mapper les couleurs sur les variables CSS, ex. :
   ```js
   colors: {
     bg: 'var(--bg)', surface: 'var(--surface)', 'surface-2': 'var(--surface-2)',
     line: 'var(--line)', txt: 'var(--txt)',
     accent: '#00D397', energy: '#FFD700', buzz: '#D5442F', host: '#8B5CF6', team: '#4A90D9',
   }
   ```
   → les classes existantes `bg-[#342D5B]` deviennent `bg-surface`, `text-white` → `text-txt`, etc. (Migration progressive possible.)
3. **Provider de thème** — un `ThemeProvider` (React context + `localStorage` + applique `data-theme` sur `<html>` ou le conteneur d'app). Respecter `prefers-color-scheme` au 1ᵉʳ chargement.
4. **Toggle** — bouton soleil/lune dans le `DashboardHeader` (icônes lucide `Sun`/`Moon`). Transition `background .35s, color .35s`.

⚠️ **Points d'attention contraste** : le texte sur boutons vert/or doit rester **foncé** (`btn-fg #08231B`) dans les 2 thèmes — ne pas le lier à `bg`. Le texte sur le buzzer rouge reste blanc. Les overlays translucides `color-mix(... X% , transparent)` s'adaptent automatiquement.

---

## Screens / Views

### 1. Dashboard (Accueil) — `app/(tabs)/dashboard/page.tsx`
**But** : point d'entrée. Accès rapide créer/rejoindre, reprise de session, stats.
**Layout** : header sticky (blur) + corps scrollable + barre d'onglets fixe en bas.
- **Header** : logo (mark rouge dégradé `135deg #D5442F→#FF6B4A`, rayon 12px + éclair blanc) + wordmark « Quiz / BY MOUHA_DEV ». À droite, 3 boutons ronds 40px (`surface`) : **toggle thème** (soleil en sombre / lune en clair), **cloche** (badge rouge `buzz` si notifs), **avatar profil** 40px.
- **Welcome** : `greeting()` selon l'heure (Bonjour <12h / Bon après-midi <18h / Bonsoir) en `txt-60` 13px + « <pseudo> 👋 » en H1 26px.
- **Quick actions** : 3 boutons flex égaux, rayon 16px, padding `12px`. Icône 38px (rond `rgba(255,255,255,0.2)`), label 14px bold, sous-label 11px opacity .72.
  - **Créer** — fond `linear-gradient(140deg,#00D397,#00B383)`, texte blanc, → `room/create` (ici : écran Catégories).
  - **Rejoindre** — fond `linear-gradient(140deg,#FF5C44,#D5442F)`, texte blanc, → ouvre **Join modal**.
  - **Salles** — fond `surface`, texte `txt`, → onglet Salles.
- **Bannière notifications** (si total>0) : carte bordée `energy` 30%, icône cloche or, « X invitation · Y demandes », badge rouge total, chevron. → `/notifications`.
- **Dernière session** (`LastSessionCard`) : carte avec liseré gauche 4px, icône trophée or, badge statut (`🏁 Terminée`), Code en `Space Grotesk` (⚠️ `white-space:nowrap`), ligne stats `#rang/total · ⚡score pts · date`, bouton « Voir » (ou « Rejoindre » vert si active).
- **Podium catégories** (`CategoryPodiumCard`) : 3 colonnes médailles 🥇🥈🥉, fond `color-mix(medaille 12% , surface)`, bordure médaille 28%, nom, score `Space Grotesk` couleur médaille, chip win-rate `🎯 X%`, « N parties ».
- **Stats globales** (`GlobalStatsCard`) : carte, titre « Classement global » + badge rang `#N` (or). 2 rangées de 3 `StatItem` (icône 40px rond `surface-2`, valeur 17px, label 11px) : Score total (or), Parties (rouge), Victoires (vert) / Meilleur (vert), Win rate % (vert), Moy. score (txt).

### 2. Barre d'onglets — nouveau `components/layout/TabBar.tsx`
4 onglets égaux, libellé 10.5px + icône 22px lucide. Actif = `accent`, inactif = `txt-40`. Fond `color-mix(bg 90%, transparent)` + blur, bord haut `line`, padding bas `+ env(safe-area-inset-bottom)`.
- **Accueil** (Home), **Salles** (Grid), **Amis** (Users), **Profil** (User).

### 3. Modal Rejoindre — `JoinModal` (déjà dans `dashboard/page.tsx`)
Centré, scrim + blur, carte max 340px. Titre « Rejoindre » + X. Encart info (guidage). Champ code centré `Space Grotesk` 22px, uppercase, `[A-Z0-9-]`. **Gestion d'erreurs (B&S)** : à la soumission, valider (non vide, ≥4 alphanum) → sinon message rouge précis avec piste de correction + **bordure champ rouge `buzz`**. Loading = spinner « Connexion… ». Bouton principal rouge dégradé. Bouton secondaire « Scanner un QR code » (texte vert).
> Comportement réel (cf. `sessionsApi.joinCheck` / `roomsApi.joinRoom`) : router selon le statut (LOBBY→categories, GENERATING→loading, PLAYING/PAUSED→game, RESULTS→results), sinon fallback salle, sinon erreurs 404/409/400 explicites.

### 4. Onglet Amis — `app/(tabs)/friends/page.tsx`
Section « Demandes reçues » (avatar + « souhaite t'ajouter » + boutons ✓ accepter / ✕ refuser) ; section « Mes amis » (avatar avec **pastille de présence** 11px vert `accent`/gris `txt-40` bordée `surface`, statut En ligne/Hors ligne, chevron, tap → **profil**).

### 5. Onglet Salles — `app/(tabs)/rooms/page.tsx`
Header « Mes salles » + bouton rond « + » (vert). Cartes salle : icône dossier (violet `host`), nom, badge `👑 Hôte` si propriétaire, code `Space Grotesk` vert (`nowrap`), « N membres », chevron. Tap → rejoindre (ouvre Join modal pré-rempli).

### 6. Modal profil joueur — nouveau `components/ui/PlayerProfileModal.tsx`
**Bottom sheet** (slide-up depuis le bas, rayon haut 24px, poignée + X), scrim. Contenu : avatar 84px + pseudo + chip « 🏆 Rang #N » + **bouton amitié** (états : `Ajouter` vert / `⏳ En attente` ambre / `✓ Ami` → « Retirer des amis »). Grille de stats (Indice de perf. avec barre, Parties, Victoires + win-rate, Meilleur score). Bloc **Précision de buzz** (% + barre `team` + « correct/total »). **Catégories favorites** (top 3 : rang, nom, parties + win%, score). **Parties récentes** (session #code, salon, « il y a Nj », score + #rang/total). **Stats salons**.
> Source de vérité : `app/profile/[userId]/page.tsx` + `components/ui/FriendshipButton.tsx` (états `NONE/PENDING/ACCEPTED`).

### 7. Flow de jeu (déjà existant, restylé) — `app/session/[code]/...`
- **Catégories** (`categories`) : 3 max, prédéfinies (grille 2 col) + sur-mesure (suggestions), 3 niveaux par catégorie (Facile vert / Intermédiaire or / Expert rouge), barre de progression.
- **Lobby** : avatars joueurs (tap → profil), badges mode (avec/sans modérateur), **carte « Mes catégories »** (Modifier → re-ouvre Catégories ; « + Demander » → champ de suggestion à l'hôte).
- **Génération IA** (`loading`) : % animé + coureur, encart « Règle du buzz anticipé » (faux avec/sans pénalité).
- **Jeu** (`game`) — **mode-dépendant** :
  - *Sans modérateur* : **révélation progressive mot par mot** (cadence ~230ms, curseur clignotant, chip « buzz risqué » tant que non révélé), buzzer rouge, puis écran de **choix A/B/C/D**.
  - *Avec modérateur* : **pas de texte ni de choix** côté joueur → carte « Écoute la question » (le modérateur lit à voix haute), buzzer. Après buzz → « En attente de validation du modérateur » ; si **faux → buzzer désactivé** (« les autres peuvent répondre »), le joueur **ne contrôle pas** le passage à la question suivante.
  - **File d'attente** : 1ᵉʳ buzzeur + temps de réaction en **ms**.
  - **Classement live** : panneau permanent en bas de l'écran de jeu (top 3 + reste), **PAS** d'écran de classement plein écran entre les questions.
- **Vue modérateur** (`game`, rôle manager — non accessible côté joueur) : question + **réponse révélée** (toggle masquer), **file de buzz** avec ms + compte à rebours, boutons **Juste / Faux** (Faux → avec/sans pénalité), contrôles **Reset buzzer / Pause / Passer**, **correction de score** (±) sur le classement.
- **Résultats** (`results`) : podium 1/2/3, ligne de stats perso (Base/Corr/Dettes/Final), classement individuel, et **« Dettes »** (« X doit à Y », par catégorie).

---

## Interactions & Behavior
- **Toggle thème** : bascule `data-theme`, persiste en `localStorage`, transition 0.35s. Met aussi à jour la barre de statut du device (clair/sombre).
- **Navigation onglets** : change la vue, conserve l'état ; barre d'onglets visible uniquement sur les écrans « home ».
- **Join modal** : Enter = soumettre ; validation → erreur inline ; clic sur le scrim ou X = fermer (animations `fadein`/`pop`).
- **Bottom sheet profil** : slide-up `sheetup .32s cubic-bezier(.2,.8,.2,1)`, fermeture animée (slide-down + fade), clic scrim ferme.
- **Révélation progressive** : timer mot par mot, stoppé au buzz.
- **Buzz** : flash overlay court ; en mode modérateur, machine d'états idle→answering→correct/wrong/rival.
- **Animations** : `pop`, `rise`, `ping` (buzzer), `float`, `growx` (barres), `blink` (curseur/pastilles). Toutes désactivables (classe `anim-off`) → respecter `prefers-reduced-motion`.

## State Management
- `theme: 'dark'|'light'` (provider + localStorage).
- `tab: 'home'|'rooms'|'friends'|'profile'`.
- `showJoin` + `joinSeed` (code pré-rempli).
- Profil ouvert : `{ name, status }` ; statut amitié local `NONE|PENDING|ACCEPTED`.
- Jeu : `phase`, `questionIndex`, `rows` (scores), `result`, `stats`, `role` (player/mod), `mode` (mod/host). Dans le repo réel, ces états viennent du store buzz (`useBuzzStore`) + websockets ; ici simulés.

## Mapping repo (où intégrer)
| Élément design | Fichier cible dans le repo |
|---|---|
| Tokens + thème | `global.css`, `tailwind.config.js`, nouveau `ThemeProvider` |
| Dashboard | `app/(tabs)/dashboard/page.tsx` + `components/dashboard/*` |
| Header + toggle thème | `components/layout/DashboardHeader.tsx` |
| Cartes stats/podium/session/notifs | `components/dashboard/GlobalStatsCard.tsx`, `CategoryPodiumCard.tsx`, `LastSessionCard.tsx`, `NotificationsBanner.tsx` |
| Barre d'onglets | nouveau `components/layout/TabBar.tsx` |
| Modal Rejoindre | `JoinModal` dans `dashboard/page.tsx` |
| Modal profil | nouveau `components/ui/PlayerProfileModal.tsx` (← `app/profile/[userId]`) |
| Amis / Salles | `app/(tabs)/friends/page.tsx`, `app/(tabs)/rooms/page.tsx` |
| Flow jeu | `app/session/[code]/{categories,lobby,loading,game,results}/page.tsx`, `components/game/*` |

## 8 critères de Bastien & Scapin (à préserver)
1. **Guidage** — labels + sous-labels, en-têtes de section, feedback immédiat (toasts, états).
2. **Charge de travail** — écrans aérés, infos essentielles.
3. **Contrôle explicite** — boutons clairs, annulation sur chaque modal, l'hôte garde la main.
4. **Adaptabilité** — thème clair/sombre, options (rôle, mode).
5. **Gestion des erreurs** — validation + messages précis + correction (Join modal).
6. **Homogénéité** — composants réutilisés (cards/chips/boutons).
7. **Signifiance** — icônes + libellés FR explicites.
8. **Compatibilité** — patterns mobiles familiers (tab bar, bottom sheets).

## Files (références de design dans ce bundle)
- `Quiz Redesign.html` — point d'entrée (charge les scripts ci-dessous)
- `style.css` — **tous les tokens + thème clair/sombre** (référence principale)
- `dashboard.jsx` — dashboard, barre d'onglets, modal Rejoindre, onglets Amis/Salles
- `profile.jsx` — modal profil joueur + amitié
- `screens.jsx` — Join, Catégories, Lobby
- `screens2.jsx` — Génération, Jeu (joueur, mode-dépendant), C'est ton tour, Révélation
- `screens3.jsx` — Classement, Résultats (+ dettes)
- `moderator.jsx` — vue modérateur
- `shared.jsx` — Avatar, Ring, TimerBar, icônes, helpers
- `app.jsx` — machine d'états, thème, montage
