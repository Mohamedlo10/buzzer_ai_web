# Guide des nouvelles fonctionnalités Backend — BuzzMaster

> Document destiné au développeur frontend.
> Toutes les requêtes nécessitent le header `Authorization: Bearer <token>`.

---

## 1. Invitations de salle (Room Invitations)

### Envoyer des invitations à des amis

```
POST /api/rooms/{roomId}/invite
```

**Body :**
```json
{
  "receiverIds": ["uuid1", "uuid2"]
}
```

**Règles :**
- L'expéditeur doit être membre de la salle
- Les utilisateurs déjà membres sont ignorés silencieusement
- Les invitations déjà en attente ne sont pas dupliquées

**Réponse :** `201 Created` (pas de body)

---

### Notification WebSocket reçue par les invités

Topic : `/queue/user/{userId}/notifications`

```json
{
  "type": "ROOM_INVITE",
  "invitationId": "uuid",
  "roomId": "uuid",
  "roomName": "Ma Salle",
  "roomCode": "ABC123",
  "from": {
    "id": "uuid",
    "username": "alice",
    "avatarUrl": "https://api.dicebear.com/9.x/adventurer/svg?seed=alice"
  }
}
```

**Action suggérée :** afficher un toast/notification avec un bouton "Rejoindre".
Pour rejoindre la salle : `POST /api/rooms/join` avec `{ "code": "ABC123" }`.

---

## 2. Centre de notifications

### Récupérer toutes les notifications en attente avec cette partie accessible a partir 

```
GET /api/notifications
```

**Réponse :**
```json
{
  "total": 4,
  "friendRequests": [
    {
      "id": "uuid-friendship",
      "requester": {
        "id": "uuid-user",
        "username": "bob",
        "avatarUrl": "...",
        "globalRank": 12
      },
      "createdAt": "2026-03-21T10:00:00Z"
    }
  ],
  "gameInvitations": [
    {
      "id": "uuid-invitation",
      "sessionId": "uuid-session",
      "sessionCode": "XYZ789",
      "senderName": "alice",
      "expiresAt": "2026-03-21T10:05:00Z",
      "createdAt": "2026-03-21T10:00:00Z"
    }
  ],
  "roomInvitations": [
    {
      "id": "uuid-room-invitation",
      "roomId": "uuid-room",
      "roomName": "Ma Salle",
      "roomCode": "ABC123",
      "senderUsername": "alice",
      "senderAvatarUrl": "...",
      "createdAt": "2026-03-21T10:00:00Z"
    }
  ]
}
```

**Actions depuis la page notifications :**

| Type | Action accepter | Action refuser |
|---|---|---|
| `friendRequests` | `PUT /api/friends/requests/{id}/accept` | `PUT /api/friends/requests/{id}/decline` |
| `gameInvitations` | `PUT /api/invitations/{id}/accept` + rejoindre la session | `PUT /api/invitations/{id}/decline` |
| `roomInvitations` | `POST /api/rooms/join` avec le `roomCode` | *(pas d'endpoint decline room invite, ignorer suffit)* |

---

## 3. Dashboard — 3 dernières sessions et salles via u carrouseel horizontale

**Changement breaking** : les champs `lastSession` et `lastRoom` ont été remplacés par des listes.

```
GET /api/dashboard/v2
```

**Avant :**
```json
{
  "lastSession": { ... },
  "lastRoom": { ... }
}
```

**Après :**
```json
{
  "recentSessions": [ { ... }, { ... }, { ... } ],
  "recentRooms":    [ { ... }, { ... }, { ... } ]
}
```

- `recentSessions` : jusqu'à 3 entrées. Les sessions actives (LOBBY, PLAYING) apparaissent en premier, puis les terminées (RESULTS).
- `recentRooms` : jusqu'à 3 salles, triées par date d'adhésion décroissante.
- Les deux listes peuvent être vides `[]` si aucun historique.

**Structure d'une session** (inchangée) :
```json
{
  "id": "uuid",
  "code": "ABC123",
  "status": "RESULTS",
  "managerName": "alice",
  "roomId": "uuid",
  "roomName": "Ma Salle",
  "currentQuestionIndex": 10,
  "totalQuestions": 10,
  "playerCount": 5,
  "createdAt": "...",
  "endedAt": "...",
  "isManager": false,
  "myScore": 35,
  "myRank": 2,
  "totalPlayers": 5
}
```
> `myScore`, `myRank`, `totalPlayers` sont `null` si la session est encore active.

**Structure d'une room** (inchangée) :
```json
{
  "id": "uuid",
  "name": "Ma Salle",
  "code": "ABC123",
  "ownerName": "alice",
  "memberCount": 8,
  "hasActiveSession": true,
  "joinedAt": "..."
}
```

---

## 4. Amis — nouvelles routes

### Récupérer les demandes envoyées (en attente)

```
GET /api/friends/requests/sent
```

**Réponse :**
```json
[
  {
    "id": "uuid-friendship",
    "receiver": {
      "id": "uuid-user",
      "username": "charlie",
      "avatarUrl": "..."
    },
    "createdAt": "2026-03-21T10:00:00Z"
  }
]
```

---

### Annuler une demande envoyée

```
DELETE /api/friends/requests/{friendshipId}
```

**Règles :**
- Seul l'expéditeur peut annuler
- La demande doit être encore en statut `PENDING` → 409 sinon

**Réponse :** `204 No Content`

---

### Rang global dans la liste d'amis

```
GET /api/friends
```

Le champ `globalRank` est maintenant inclus dans chaque ami :

```json
[
  {
    "id": "uuid",
    "username": "alice",
    "avatarUrl": "...",
    "friendshipStatus": "ACCEPTED",
    "globalRank": 42,
    "createdAt": "..."
  }
]
```

> `globalRank` est `null` si l'ami n'a encore joué aucune partie.

---

## 5. État de jeu — hasBuzzed et answer_validated

### GET /api/games/{sessionId}/state

Nouveau champ `hasBuzzed` :

```json
{
  "hasBuzzed": true,
  ...
}
```

- `true` si le joueur authentifié a buzzé sur la question courante (qu'il ait répondu juste ou faux)
- Utiliser ce champ pour bloquer/activer visuellement le bouton buzz
- Ne **pas** réactiver le bouton sur un event WRONG — seulement sur `buzzer-reset` ou changement de question

---

### WebSocket — answer_validated

Topic : `/topic/session/{sessionId}/answer-validated`

```json
{
  "type": "answer_validated",
  "playerId": "<userId du JWT>",
  "isCorrect": false
}
```

> ⚠️ `playerId` ici est le `user.id` (JWT), **pas** l'ID interne du joueur en base.

**Logique frontend :**
```
if (event.playerId === currentUser.id && !event.isCorrect) {
  setHasBuzzed(true)  // bloquer le bouton pour cette question
}
```

---

## 6. Équipes dans l'état de jeu

### GET /api/games/{sessionId}/state

Nouveau champ `teams[]` :

```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "Team A",
      "color": "#FF5733",
      "score": 120,
      "memberIds": ["uuid-player1", "uuid-player2"]
    }
  ]
}
```

- `memberIds` sont les IDs internes des joueurs (cross-reference avec `players[]`)
- `score` = somme des scores individuels des membres
- `[]` si pas de mode équipe

### WebSocket — team-scores

Topic : `/topic/session/{sessionId}/team-scores`

Broadcast après chaque validation de réponse quand des équipes existent :

```json
{
  "teams": [
    { "id": "uuid", "name": "Team A", "color": "#FF5733", "score": 120, "memberIds": [...] }
  ]
}
```

---

## 7. Classements session — info équipe

```
GET /api/rankings/sessions/{sessionId}
```

Champs ajoutés dans chaque entrée :

```json
{
  "rank": 1,
  "player": { ... },
  "score": 35,
  "finalScore": 35,
  "teamId": "uuid",
  "teamName": "Team A",
  "teamScore": 120,
  ...
}
```

> `teamId`, `teamName` sont `null` et `teamScore` est `0` si le joueur n'appartient à aucune équipe.

---

## Récapitulatif des nouveaux endpoints

| Méthode | URL | Description |
|---|---|---|
| `POST` | `/api/rooms/{roomId}/invite` | Inviter des amis dans une salle |
| `GET` | `/api/notifications` | Toutes les notifications agrégées |
| `GET` | `/api/friends/requests/sent` | Demandes d'amitié envoyées en attente |
| `DELETE` | `/api/friends/requests/{id}` | Annuler une demande envoyée |

## Récapitulatif des changements breaking

| Endpoint | Avant | Après |
|---|---|---|
| `GET /api/dashboard/v2` | `lastSession`, `lastRoom` | `recentSessions[]`, `recentRooms[]` |

