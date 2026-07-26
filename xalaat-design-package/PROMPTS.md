# Prompts à donner à ton agent — intégration du nouveau design Xalaat

Donne-les un par un, dans l'ordre. Ne passe à l'étape suivante que si l'agent
a terminé et que tu as vérifié visuellement le résultat. Chaque prompt
référence les fichiers du dossier `reference/` (à joindre/uploader avec le
prompt correspondant).

---

## Étape 0 — Design tokens

```
Ajoute le fichier theme.css (ci-joint) à la racine des styles globaux du
projet et importe-le une seule fois au niveau racine de l'app.
Ne modifie aucun composant pour l'instant.
Polices à charger : Boldonse (400), Bricolage Grotesque (400/500/600/700/800),
Manrope (400/500/600/700), Instrument Serif (400 + 400 italic).
Utilise Google Fonts (@import ou <link>) avec font-display: swap.
```
Joindre : `theme.css`

---

## Étape 1 — Composants partagés

```
Crée ces composants réutilisables dans src/components/shared/, en te basant
sur le fichier de référence ci-joint (00-shared-tokens-components.jsx).
Traduis le style inline en CSS utilisant les variables de theme.css
(var(--color-primary) etc.) au lieu de valeurs codées en dur.

Composants à créer : AppTopBar, BottomTabBar, Avatar, XalaatMark,
PatternLozenge, PatternZigzag, PatternDots, AnimatedCounter.

Respecte exactement les valeurs de padding/gap/font-size du fichier de
référence, ne les arrondis pas.
Ne connecte rien à des données réelles pour l'instant, garde les props
telles quelles.
```
Joindre : `reference/00-shared-tokens-components.jsx`

---

## Étape 2 — Écran Accueil

```
Remplace le composant de la page d'accueil actuelle par une nouvelle version
suivant le fichier de référence ci-joint (01-accueil.jsx).
Réutilise les composants créés à l'étape 1 (AppTopBar, BottomTabBar, etc.)
au lieu de dupliquer leur code.
Garde la structure de routing et les données réelles de l'appli actuelle,
seul le rendu visuel change.
Respecte exactement les espacements du fichier de référence.
```
Joindre : `reference/01-accueil.jsx`

---

## Étape 3 — Écrans Quiz (jeu / feedback / résultats)

```
Même principe qu'à l'étape 2 : remplace les 3 écrans de quiz (question en
cours, feedback après réponse, résultats finaux) en suivant le fichier de
référence ci-joint. Réutilise les composants partagés. Garde la logique
métier (état du quiz, timer, score) existante, ne change que le rendu.
```
Joindre : `reference/02-quiz-play-feedback-results.jsx`

---

## Étape 4 — Hub + modale "Rejoindre"

```
Remplace l'écran Hub et la modale de rejoindre un salon en suivant le
fichier de référence ci-joint. Réutilise les composants partagés.
```
Joindre : `reference/03-hub-join-modal.jsx`

---

## Étape 5 — Salons (créer / liste / détail / génération IA)

```
Remplace les écrans Salons (nouveau salon, liste des salons, détail d'un
salon, écran de génération IA) en suivant le fichier de référence ci-joint.
Réutilise les composants partagés.
```
Joindre : `reference/04-salons-newroom-list-detail-generating.jsx`

---

## Étape 6 — Social (classement / amis / profil)

```
Remplace les écrans Classement, Amis et Profil en suivant le fichier de
référence ci-joint. Réutilise les composants partagés.
```
Joindre : `reference/05-social-leaderboard-friends-profile.jsx`

---

## Étape 7 — Partie en direct (admin / joueur buzzer / écran projeté)

```
Remplace les écrans de partie en direct (régie admin, vue joueur avec
buzzer, écran projeté) en suivant le fichier de référence ci-joint.
Réutilise les composants partagés.
```
Joindre : `reference/06-buzzer-admin-player-projection.jsx`
(le fichier `reference/07-alt-quiz-admin-desktop.jsx` contient des variantes
desktop des mêmes écrans si ton appli a une vue web séparée du mobile —
sinon ignore-le)

---

## Étape 8 — Nettoyage final

```
Cherche dans tout le projet les couleurs, font-family ou border-radius
codés en dur qui correspondent à des valeurs de theme.css, et remplace-les
par les variables CSS correspondantes. Liste les fichiers modifiés.
```

---

### Notes générales à rappeler à l'agent si besoin
- Les cartes utilisent la variante "sharp" par défaut : `border-radius: 8px`,
  pas d'ombre. Ne pas utiliser la variante "elevated" (ombre) sauf mention
  contraire dans le fichier de référence.
- Les espacements ne suivent pas une grille 4/8px stricte : coller aux
  valeurs exactes du fichier de référence plutôt que de les arrondir.
- Le bouton/pilule utilise systématiquement `border-radius: 999px`.
