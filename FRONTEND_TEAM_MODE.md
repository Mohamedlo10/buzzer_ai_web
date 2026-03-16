# Mode Équipe — Contrat API Frontend

> Document à destination de l'agent frontend. Décrit tous les changements backend liés au mode équipe (multiplayer avec sélection d'équipe).

---

## 1. Vue d'ensemble du flow

```
Manager crée session (isTeamMode: true, teams: [...])
       ↓
Backend crée les équipes automatiquement
       ↓
Joueur scanne le code → GET /api/sessions/join/{code}
  → reçoit session + players + teams (équipes disponibles)
       ↓
Joueur choisit une équipe dans l'UI (picker d'équipe)
       ↓
POST /api/sessions/{sessionId}/players { teamId: "uuid", ... }
       ↓
Tous les clients reçoivent la mise à jour via WebSocket
  → topic: /topic/session/{sessionId}/teams
  → topic: /topic/session/{sessionId}/players
```

---

## 2. Création de session (Manager)

### `POST /api/sessions`

**Nouveau champ requis si `isTeamMode: true` :** `teams` (min 2 équipes)

```json
{
  "isTeamMode": true,
  "teams": [
    { "name": "Rouge", "color": "#FF5733" },
    { "name": "Bleu",  "color": "#3498DB" }
  ],
  "maxPlayers": 10,
  "debtAmount": 5,
  "questionsPerCategory": 5,
  "questionMode": "AI",
  "maxCategoriesPerPlayer": 3
}
```

> Si `isTeamMode: true` et `teams` absent ou < 2 éléments → erreur `400 TEAMS_REQUIRED`

**Champs équipe :**
| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `name` | string | oui | Nom de l'équipe |
| `color` | string | non | Couleur hex (`#FF5733`) pour l'UI |

---

## 3. Rejoindre une session — vérification préalable

### `GET /api/sessions/join/{code}`

**Réponse mise à jour :** contient maintenant le champ `teams`.

```json
{
  "session": {
    "id": "uuid",
    "code": "ABC123",
    "isTeamMode": true,
    "status": "LOBBY",
    ...
  },
  "players": [ ... ],
  "teams": [
    {
      "id": "uuid-equipe-1",
      "name": "Rouge",
      "color": "#FF5733",
      "score": 0,
      "members": []
    },
    {
      "id": "uuid-equipe-2",
      "name": "Bleu",
      "color": "#3498DB",
      "score": 0,
      "members": []
    }
  ]
}
```

**Logique frontend :**
- Si `session.isTeamMode === true` → afficher un picker d'équipe avant de rejoindre
- Chaque équipe affiche son nombre de membres actuels (`members.length`)
- Le joueur choisit une équipe → stocker le `teamId` choisi → puis faire le POST join

---

## 4. Rejoindre une session (Joueur)

### `POST /api/sessions/{sessionId}/players`

**Nouveau champ requis si `isTeamMode: true` :** `teamId`

```json
{
  "teamId": "uuid-equipe-1",
  "categories": [
    { "name": "Histoire", "difficulty": "INTERMEDIAIRE" }
  ],
  "isSpectator": false
}
```

> Si `isTeamMode: true`, `isSpectator: false` et `teamId` absent → erreur `400 TEAM_REQUIRED`

**Règles :**
| Condition | Comportement |
|-----------|-------------|
| `isTeamMode: true` + `isSpectator: false` | `teamId` obligatoire |
| `isTeamMode: true` + `isSpectator: true` | `teamId` ignoré (spectateur, pas d'équipe) |
| `isTeamMode: false` | `teamId` ignoré |

---

## 5. Changer d'équipe dans le lobby

### `PUT /api/sessions/{sessionId}/players/{playerId}/team`

Permet à un joueur de changer d'équipe (ou au manager de réassigner un joueur).

**Body :**
```json
{ "teamId": "uuid-autre-equipe" }
```

Pour quitter une équipe sans en rejoindre une autre (rare) :
```json
{ "teamId": null }
```

**Autorisations :**
- Le joueur lui-même (`isSelf`) peut changer sa propre équipe
- Le manager peut changer l'équipe de n'importe quel joueur
- Uniquement en statut `LOBBY`

**Effet WebSocket :** Après changement, le backend broadcast automatiquement sur `/topic/session/{sessionId}/teams` avec l'event `TEAM_UPDATED`.

---

## 6. Lister les équipes

### `GET /api/sessions/{sessionId}/teams`

Accessible sans authentification (endpoint public).

**Réponse :**
```json
[
  {
    "id": "uuid-equipe-1",
    "name": "Rouge",
    "color": "#FF5733",
    "score": 0,
    "members": [
      {
        "id": "uuid-player",
        "userId": "uuid-user",
        "name": "Alice",
        "score": 0,
        "isManager": false,
        "isSpectator": false,
        "teamId": "uuid-equipe-1",
        "categoryScores": {},
        "selectedCategories": ["Histoire"]
      }
    ]
  },
  {
    "id": "uuid-equipe-2",
    "name": "Bleu",
    "color": "#3498DB",
    "score": 0,
    "members": []
  }
]
```

---

## 7. Détails de session

### `GET /api/sessions/{sessionId}`

**Réponse mise à jour :** contient maintenant `teams` en plus de `players` et `questions`.

```json
{
  "session": { ... },
  "players": [ ... ],
  "questions": [ ... ],
  "teams": [
    {
      "id": "uuid",
      "name": "Rouge",
      "color": "#FF5733",
      "score": 0,
      "members": [ ... ]
    }
  ]
}
```

---

## 8. PlayerResponse — champ teamId

Chaque objet `PlayerResponse` (dans `players` et dans `teams[n].members`) contient `teamId` :

```json
{
  "id": "uuid-player",
  "userId": "uuid-user",
  "name": "Alice",
  "score": 0,
  "isManager": false,
  "isSpectator": false,
  "teamId": "uuid-equipe-1",   // null si pas d'équipe
  "categoryScores": {},
  "selectedCategories": ["Histoire"]
}
```

---

## 9. WebSocket — nouveaux events

### Abonnement : `/topic/session/{sessionId}/teams`

Reçu lorsqu'un joueur change d'équipe (via `PUT /players/{id}/team`).

```json
{
  "event": "TEAM_UPDATED",
  "teams": [
    {
      "id": "uuid-equipe-1",
      "name": "Rouge",
      "color": "#FF5733",
      "score": 0,
      "members": [ { ... } ]
    },
    {
      "id": "uuid-equipe-2",
      "name": "Bleu",
      "color": "#3498DB",
      "score": 0,
      "members": []
    }
  ]
}
```

**Action recommandée :** remplacer l'état local `teams` avec la nouvelle liste reçue.

### Abonnement existant : `/topic/session/{sessionId}/players`

Toujours déclenché quand un joueur rejoint (`JOINED`). Le `player` contient désormais `teamId` renseigné.

```json
{
  "event": "JOINED",
  "player": {
    "id": "uuid",
    "name": "Bob",
    "teamId": "uuid-equipe-2",
    ...
  }
}
```

---

## 10. Codes d'erreur spécifiques au mode équipe

| Code | HTTP | Message | Déclencheur |
|------|------|---------|-------------|
| `TEAMS_REQUIRED` | 400 | "Au moins 2 équipes sont requises en mode équipe" | Création session sans équipes |
| `TEAM_REQUIRED` | 400 | "Vous devez sélectionner une équipe" | Join sans `teamId` en mode équipe |
| `TEAM_NOT_IN_SESSION` | 400 | "Cette équipe n'appartient pas à cette session" | `teamId` invalide |
| `NOT_TEAM_MODE` | 400 | "Cette session n'est pas en mode équipe" | Appel `assignPlayerTeam` hors mode équipe |

---

## 11. Résumé des nouveaux endpoints

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `GET` | `/api/sessions/join/{code}` | Non | **(modifié)** Inclut maintenant `teams` |
| `GET` | `/api/sessions/{id}` | Oui | **(modifié)** Inclut maintenant `teams` |
| `POST` | `/api/sessions` | Oui | **(modifié)** Accepte `teams[]` si `isTeamMode: true` |
| `POST` | `/api/sessions/{id}/players` | Oui | **(modifié)** Accepte `teamId` si mode équipe |
| `GET` | `/api/sessions/{id}/teams` | Non | **NOUVEAU** Liste les équipes avec membres |
| `PUT` | `/api/sessions/{id}/players/{pid}/team` | Oui | **NOUVEAU** Change l'équipe d'un joueur |

---

## 12. Checklist UI à implémenter côté frontend

- [ ] **Création de session** : afficher un formulaire d'ajout d'équipes si `isTeamMode: true` (nom + couleur, min 2)
- [ ] **Page de join (scan code)** : si `isTeamMode: true`, afficher un picker d'équipe avec le nombre de membres par équipe avant de valider le join
- [ ] **Lobby** : afficher les équipes avec leurs membres en temps réel (s'abonner à `/teams` WS)
- [ ] **Changement d'équipe** : bouton "Changer d'équipe" dans le lobby, appel `PUT /players/{id}/team`
- [ ] **Affichage manager** : possibilité de déplacer un joueur d'une équipe à l'autre
- [ ] **Scores** : pendant et après le jeu, afficher les scores par équipe (`team.score`)
