# BuzzMaster AI - Game API Reference

## Table des matieres

- [Session (Lobby & Lifecycle)](#session-lobby--lifecycle)
- [Game (Jeu en cours)](#game-jeu-en-cours)
- [Rankings (Classements)](#rankings-classements)
- [Rooms (Salles)](#rooms-salles)
- [WebSocket Topics](#websocket-topics)
- [Enums](#enums)
- [DTOs de reference](#dtos-de-reference)

---

## Session (Lobby & Lifecycle)

### POST /api/sessions — Creer une session

| | |
|---|---|
| **Acces** | Utilisateur authentifie (devient manager) |
| **Status requis** | N/A (cree en LOBBY) |
| **Code retour** | 201 Created |

**Request** `CreateSessionRequest`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| debtAmount | Integer | 5 | Montant des gages |
| questionsPerCategory | Integer | 5 | Questions par categorie |
| maxPlayers | Integer | 10 | Nombre max de joueurs |
| isPrivate | Boolean | false | Session privee |
| isTeamMode | Boolean | false | Mode equipe |
| maxCategoriesPerPlayer | Integer | 3 | Categories max par joueur |
| roomId | UUID | null | Room associee (optionnel) |

**Response** `SessionCreateResponse`

| Champ | Type |
|-------|------|
| session | SessionResponse |
| player | PlayerResponse |

---

### GET /api/sessions/{sessionId} — Details d'une session

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Status requis** | Tous |
| **Code retour** | 200 OK |

**Response** `SessionDetailResponse`

| Champ | Type | Note |
|-------|------|------|
| session | SessionResponse | |
| players | List\<PlayerResponse\> | |
| questions | List\<QuestionResponse\> | Vide si LOBBY/GENERATING |

---

### GET /api/sessions/join/{code} — Verifier une session par code

| | |
|---|---|
| **Acces** | Public (pas d'auth) |
| **Status requis** | LOBBY |
| **Code retour** | 200 OK |

**Response** `SessionJoinCheckResponse`

| Champ | Type |
|-------|------|
| session | SessionResponse |
| players | List\<PlayerResponse\> |

---

### POST /api/sessions/{sessionId}/players — Rejoindre une session

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Status requis** | LOBBY |
| **Code retour** | 201 Created |
| **WebSocket** | `/topic/session/{sessionId}/players` → `{event: "JOINED", player: PlayerResponse}` |

**Request** `JoinSessionRequest`

| Champ | Type | Description |
|-------|------|-------------|
| categories | List\<CategoryRequest\> | Min 1 categorie |
| isSpectator | Boolean | false = joueur, true = spectateur |

Ou `CategoryRequest` :

| Champ | Type |
|-------|------|
| name | String |
| difficulty | String (FACILE, INTERMEDIAIRE, EXPERT) |

**Response** `SessionAddPlayerResponse`

| Champ | Type |
|-------|------|
| player | PlayerResponse |

---

### DELETE /api/sessions/{sessionId}/players/{playerId} — Retirer un joueur

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | LOBBY |
| **Code retour** | 204 No Content |
| **WebSocket** | `/topic/session/{sessionId}/players` → `{event: "LEFT", player: PlayerResponse}` |

---

### PUT /api/sessions/{sessionId}/players/{playerId}/categories — Modifier les categories

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | LOBBY |
| **Code retour** | 200 OK |

**Request** `List<CategoryRequest>`

---

### POST /api/sessions/{sessionId}/start — Demarrer la generation

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | LOBBY |
| **Prerequis** | Minimum 2 joueurs non-spectateurs |
| **Code retour** | 202 Accepted |
| **Timeout** | 2 minutes max (annulation automatique) |

**Response** `MessageResponse`

| Champ | Type |
|-------|------|
| message | String ("Generation en cours...") |

**WebSocket declenches (dans l'ordre) :**

1. `/topic/session/{id}/status` → `{status: "GENERATING"}`
2. `/topic/session/{id}/generating` → `{progress: 0.1, message: "Preparation des categories..."}`
3. `/topic/session/{id}/generating` → `{progress: 0.2, message: "Appel a l'IA..."}`
4. `/topic/session/{id}/generating` → `{progress: 0.7, message: "Traitement des questions..."}`
5. `/topic/session/{id}/generating` → `{progress: 1.0, message: "Pret !"}`
6. `/topic/session/{id}/countdown` → `{count: 3}` puis `{count: 2}` puis `{count: 1}` puis `{count: 0, event: "START"}`
7. `/topic/session/{id}/status` → `{status: "PLAYING", currentQuestionIndex: 0, totalQuestions: N}`
8. `/topic/session/{id}/question` → `{question: {id, category, text, difficulty}}`

**En cas d'erreur :**

- `/topic/session/{id}/status` → `{status: "LOBBY", error: "message d'erreur"}`

---

### POST /api/sessions/{sessionId}/cancel-generation — Annuler la generation

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | GENERATING |
| **Code retour** | 200 OK |
| **WebSocket** | `/topic/session/{id}/status` → `{status: "LOBBY", error: "Generation annulee par le manager"}` |

**Response** `MessageResponse`

| Champ | Type |
|-------|------|
| message | String ("Generation annulee") |

---

### POST /api/sessions/{sessionId}/pause — Mettre en pause

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | PLAYING |
| **Code retour** | 200 OK |
| **WebSocket** | `/topic/session/{id}/status` → `{status: "PAUSED"}` |

---

### POST /api/sessions/{sessionId}/resume — Reprendre la partie

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | PAUSED |
| **Code retour** | 200 OK |
| **WebSocket** | `/topic/session/{id}/status` → `{status: "PLAYING"}` |

---

## Game (Jeu en cours)

### POST /api/games/{sessionId}/buzz — Buzzer

| | |
|---|---|
| **Acces** | Joueur non-spectateur |
| **Status requis** | PLAYING |
| **Code retour** | 200 OK |
| **WebSocket** | `/topic/session/{id}/buzz` → `{buzzQueue: [{playerId, playerName, timeDiffMs}]}` |

**Request**

| Champ | Type | Description |
|-------|------|-------------|
| timestampMs | Long | Timestamp client du buzz |

**Response** `GameBuzzResponse`

| Champ | Type |
|-------|------|
| buzz.playerId | UUID |
| buzz.playerName | String |
| buzz.timestampMs | Long |

**Regles :**
- Un joueur ne peut pas buzzer 2 fois sur la meme question
- Les spectateurs ne peuvent pas buzzer

---

### POST /api/games/{sessionId}/validate — Valider une reponse

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | PLAYING |
| **Code retour** | 200 OK |

**Request** `ValidateRequest`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| playerId | UUID | requis | Joueur qui a repondu |
| isCorrect | Boolean | requis | Reponse correcte ? |
| points | Integer | 5 | Points attribues/retires |
| category | String | null | Categorie (pour scoring par categorie) |

**Response** `GameValidateResponse`

| Champ | Type |
|-------|------|
| newScore | int |
| newQuestionIndex | int |
| isGameOver | boolean |
| buzzQueue | List\<BuzzQueueItem\> |

**WebSocket declenches :**

Si **reponse correcte** :
1. `/topic/session/{id}/score` → `{playerId, newScore, event: "CORRECT"}`
2. `/topic/session/{id}/question` → prochaine question
3. `/topic/session/{id}/buzz` → `{buzzQueue: []}` (reset)

Si **reponse incorrecte** :
1. `/topic/session/{id}/score` → `{playerId, newScore, event: "WRONG"}`
2. `/topic/session/{id}/buzz` → buzz queue mise a jour (joueur retire)

Si **game over** :
1. `/topic/session/{id}/status` → `{status: "RESULTS"}`
2. `/topic/session/{id}/game-over` → `{rankings: List<SessionRankingEntryResponse>}`

---

### POST /api/games/{sessionId}/skip — Passer une question

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | PLAYING |
| **Code retour** | 200 OK |
| **WebSocket** | `/topic/session/{id}/question` → prochaine question |

**Logique :**
- Marque la question comme "skipped"
- Vide tous les buzzes pour cette question
- Passe a la question suivante ou termine la partie

---

### POST /api/games/{sessionId}/reset-buzzer — Reset le buzzer

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | PLAYING |
| **Code retour** | 200 OK |
| **WebSocket** | `/topic/session/{id}/buzzer-reset` → `{}` |

**Logique :** Supprime tous les buzzes de la question en cours, permet aux joueurs de re-buzzer.

---

### GET /api/games/{sessionId}/state — Etat complet (reconnexion)

| | |
|---|---|
| **Acces** | Joueur de la session |
| **Status requis** | PLAYING ou PAUSED |
| **Code retour** | 200 OK |

**Response** `GameStateResponse`

| Champ | Type | Note |
|-------|------|------|
| session | Map | {status, currentQuestionIndex, totalQuestions} |
| currentQuestion | QuestionResponse | answer/explanation visibles uniquement pour le manager |
| players | List\<PlayerResponse\> | |
| buzzQueue | List\<BuzzQueueItem\> | |
| myPlayer | PlayerResponse | Joueur appelant |

---

### POST /api/games/{sessionId}/score-correction — Correction de score

| | |
|---|---|
| **Acces** | Manager uniquement |
| **Status requis** | PLAYING, PAUSED, ou RESULTS |
| **Code retour** | 200 OK |
| **WebSocket** | `/topic/session/{id}/score` → `{playerId, newScore, event: "CORRECTION"}` |

**Request** `ScoreCorrectionRequest`

| Champ | Type | Description |
|-------|------|-------------|
| playerId | UUID | Joueur concerne |
| amount | Integer | Positif = credit, negatif = dette |
| reason | String | Raison de la correction |

---

## Rankings (Classements)

### GET /api/rankings/sessions/{sessionId} — Classement d'une session

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Code retour** | 200 OK |

**Response** `List<SessionRankingEntryResponse>`

| Champ | Type |
|-------|------|
| player | PlayerInfo (id, name, avatarUrl) |
| score | int |
| corrections | List\<CorrectionInfo\> (amount, reason) |
| finalScore | int |
| rank | int |
| categoryPerformance | Map\<String, Integer\> |
| debts | List\<DebtInfo\> (category, owedTo, amount) |

---

### GET /api/rankings/global?page=0&size=20 — Classement global

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Code retour** | 200 OK |

**Response** `Page<GlobalRanking>`

---

### GET /api/rankings/global/me — Mon rang global

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Code retour** | 200 OK |

**Response** `MyGlobalRankResponse`

| Champ | Type |
|-------|------|
| rank | long |
| totalScore | int |
| totalGames | int |
| winRate | BigDecimal |

---

### GET /api/rankings/categories?sessionId={sessionId} — Classement par categorie

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Code retour** | 200 OK |

**Response** `CategoryRankingResponse`

| Champ | Type |
|-------|------|
| categories | List\<CategoryRanking\> |

Ou `CategoryRanking` :

| Champ | Type |
|-------|------|
| name | String |
| rankings | List\<CategoryPlayerRank\> (rank, userId, username, score) |

---

## Rooms (Salles)

### POST /api/rooms — Creer une room

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Code retour** | 201 Created |

**Request**

| Champ | Type |
|-------|------|
| name | String |
| description | String |
| maxPlayers | Integer |

**Response** `RoomCreateResponse`

| Champ | Type |
|-------|------|
| id | UUID |
| name | String |
| code | String |
| maxPlayers | Integer |

---

### GET /api/rooms — Mes rooms

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Code retour** | 200 OK |

**Response** `List<RoomSummaryResponse>`

| Champ | Type |
|-------|------|
| id | UUID |
| name | String |
| code | String |
| ownerId | UUID |
| ownerName | String |
| maxPlayers | Integer |
| memberCount | Integer |
| hasActiveSession | Boolean |
| createdAt | Instant |

---

### GET /api/rooms/{roomId} — Details d'une room

| | |
|---|---|
| **Acces** | Public |
| **Code retour** | 200 OK |

**Response** `RoomDetailResponse`

| Champ | Type |
|-------|------|
| room | RoomInfo (id, name, code, description, ownerId, ownerName) |
| members | List\<MemberResponse\> (id, userId, username, avatarUrl, isOwner, isOnline, joinedAt) |
| sessions | List\<RoomSessionResponse\> (id, code, status, managerId, managerName, playerCount, maxPlayers, createdAt) |
| rankings | List\<RoomRankingResponse\> (userId, username, avatarUrl, totalScore, gamesPlayed, gamesWon, bestScore) |

---

### POST /api/rooms/{code}/join — Rejoindre une room

| | |
|---|---|
| **Acces** | Utilisateur authentifie |
| **Code retour** | 200 OK |

**Response** `RoomDetailResponse`

---

### POST /api/rooms/{code}/leave — Quitter une room

| | |
|---|---|
| **Acces** | Membre de la room |
| **Code retour** | 204 No Content |

---

### DELETE /api/rooms/{roomId} — Supprimer une room

| | |
|---|---|
| **Acces** | Owner uniquement |
| **Code retour** | 204 No Content |

---

## WebSocket Topics

**Endpoint WebSocket :** `ws://HOST/ws` (avec fallback SockJS)
**Authentification :** JWT Bearer token dans le header Authorization au STOMP CONNECT

### Topics de session (broadcast)

| Topic | Payload | Declencheur |
|-------|---------|-------------|
| `/topic/session/{id}/status` | `{status}` ou `{status, currentQuestionIndex, totalQuestions}` ou `{status, error}` | Changement d'etat de la session |
| `/topic/session/{id}/players` | `{event: "JOINED"\|"LEFT", player}` | Joueur rejoint/quitte |
| `/topic/session/{id}/generating` | `{progress: 0.0-1.0, message}` | Progression de la generation |
| `/topic/session/{id}/countdown` | `{count: 3\|2\|1}` ou `{count: 0, event: "START"}` | Compte a rebours avant le jeu |
| `/topic/session/{id}/question` | `{question: {id, category, text, difficulty}}` | Nouvelle question affichee |
| `/topic/session/{id}/buzz` | `{buzzQueue: [{playerId, playerName, timeDiffMs}]}` | Joueur buzze ou reset |
| `/topic/session/{id}/score` | `{playerId, newScore, event: "CORRECT"\|"WRONG"\|"CORRECTION"}` | Score mis a jour |
| `/topic/session/{id}/buzzer-reset` | `{}` | Manager reset le buzzer |
| `/topic/session/{id}/game-over` | `{rankings: List<SessionRankingEntryResponse>}` | Partie terminee |

### Queues personnelles (par utilisateur)

| Queue | Payload | Declencheur |
|-------|---------|-------------|
| `/queue/user/{userId}/notifications` | Notification payload | Demande d'ami, etc. |
| `/queue/user/{userId}/invitations` | `{id, sessionId, sessionCode, senderName, expiresAt, createdAt}` | Invitation envoyee |

---

## Enums

### SessionStatus
| Valeur | Description |
|--------|-------------|
| LOBBY | Attente des joueurs et categories |
| GENERATING | Generation des questions par l'IA |
| PLAYING | Partie en cours |
| PAUSED | Partie en pause |
| RESULTS | Partie terminee, affichage des resultats |
| CANCELLED | Partie annulee |

### DifficultyLevel
| Valeur | Description |
|--------|-------------|
| FACILE | Facile |
| INTERMEDIAIRE | Intermediaire |
| EXPERT | Expert |

### UserRole
| Valeur |
|--------|
| USER |
| ADMIN |
| SUPER_ADMIN |

### FriendshipStatus
| Valeur |
|--------|
| PENDING |
| ACCEPTED |
| DECLINED |
| BLOCKED |

### CorrectionType
| Valeur | Description |
|--------|-------------|
| CREDIT | Ajout de points (amount > 0) |
| DEBT | Retrait de points (amount < 0) |
| CORRECTION | Correction generique (amount = 0) |

---

## DTOs de reference

### SessionResponse

| Champ | Type |
|-------|------|
| id | UUID |
| code | String (6 caracteres) |
| status | SessionStatus |
| managerId | UUID |
| managerName | String |
| roomId | UUID |
| debtAmount | Integer |
| questionsPerCategory | Integer |
| currentQuestionIndex | Integer |
| totalQuestions | Integer |
| maxPlayers | Integer |
| isPrivate | Boolean |
| isTeamMode | Boolean |
| maxCategoriesPerPlayer | Integer |
| createdAt | Instant |
| startedAt | Instant |
| endedAt | Instant |

### PlayerResponse

| Champ | Type |
|-------|------|
| id | UUID |
| userId | UUID |
| name | String |
| score | int |
| isManager | boolean |
| isSpectator | boolean |
| teamId | UUID |
| categoryScores | Map\<String, Integer\> |

### QuestionResponse

| Champ | Type | Note |
|-------|------|------|
| id | UUID | |
| category | String | |
| text | String | |
| answer | String | Manager uniquement |
| explanation | String | Manager uniquement |
| difficulty | DifficultyLevel | |
| orderIndex | int | |
| winnerId | UUID | Joueur qui a repondu correctement |
| isSkipped | boolean | |

### UserResponse

| Champ | Type |
|-------|------|
| id | UUID |
| username | String |
| email | String |
| avatarUrl | String |
| role | UserRole |
| createdAt | Instant |
