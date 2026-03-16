# SessionController — Détail des Endpoints

## POST /api/sessions
- **Description** : Créer une nouvelle session
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Body : `CreateSessionRequest`
    ```json
    {
      "debtAmount": 5,
      "questionsPerCategory": 5,
      "maxPlayers": 10,
      "isPrivate": false,
      "isTeamMode": false,
      "maxCategoriesPerPlayer": 3,
      "roomId": "uuid" // optionnel
    }
    ```
- **Retour** : `SessionCreateResponse`
    ```json
    {
      "session": { /* SessionResponse */ },
      "player": { /* PlayerResponse */ }
    }
    ```
- **Status** : 201 Created

---

## GET /api/sessions
- **Description** : Rechercher des sessions avec pagination
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Query params : `code` (optionnel), `page` (int), `size` (int)
- **Retour** : `PaginatedResponse<SessionResponse>`
    ```json
    {
      "items": [ { /* SessionResponse */ } ],
      "page": 0,
      "size": 10,
      "total": 42
    }
    ```
- **Status** : 200 OK

---

## GET /api/sessions/{sessionId}
- **Description** : Détails d'une session
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path param : `sessionId` (UUID)
- **Retour** : `SessionDetailResponse`
    ```json
    {
      "session": { /* SessionResponse */ },
      "players": [ { /* PlayerResponse */ } ],
      "questions": [ { /* QuestionResponse */ } ]
    }
    ```
- **Status** : 200 OK

---

## GET /api/sessions/join/{code}
- **Description** : Vérifier une session par code avant de rejoindre
- **Entrée** :
  - Path param : `code` (String)
- **Retour** : `SessionJoinCheckResponse`
    ```json
    {
      "session": { /* SessionResponse */ },
      "players": [ { /* PlayerResponse */ } ]
    }
    ```
- **Status** : 200 OK

---

## POST /api/sessions/{sessionId}/players
- **Description** : Rejoindre une session
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path param : `sessionId` (UUID)
  - Body : `JoinSessionRequest`
    ```json
    {
      "categories": [
        { "name": "string", "difficulty": "FACILE" }
      ],
      "isSpectator": false
    }
    ```
- **Retour** : `SessionAddPlayerResponse`
    ```json
    {
      "player": { /* PlayerResponse */ }
    }
    ```
- **Status** : 201 Created

---

## DELETE /api/sessions/{sessionId}
- **Description** : Supprimer une session (manager uniquement)
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path param : `sessionId` (UUID)
- **Retour** : Aucun contenu
- **Status** : 204 No Content

---

## DELETE /api/sessions/{sessionId}/players/{playerId}
- **Description** : Retirer un joueur (manager uniquement)
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path params : `sessionId` (UUID), `playerId` (UUID)
- **Retour** : Aucun contenu
- **Status** : 204 No Content

---

## PUT /api/sessions/{sessionId}/players/{playerId}/categories
- **Description** : Modifier les catégories d'un joueur (manager, en LOBBY)
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path params : `sessionId` (UUID), `playerId` (UUID)
  - Body : `List<CategoryRequest>`
    ```json
    [
      { "name": "string", "difficulty": "FACILE" }
    ]
    ```
- **Retour** : Aucun contenu
- **Status** : 200 OK

---

## POST /api/sessions/{sessionId}/start
- **Description** : Démarrer la session (génération des questions)
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path param : `sessionId` (UUID)
- **Retour** : `MessageResponse`
    ```json
    {
      "message": "Génération en cours..."
    }
    ```
- **Status** : 202 Accepted

---

## POST /api/sessions/{sessionId}/cancel-generation
- **Description** : Annuler la génération en cours
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path param : `sessionId` (UUID)
- **Retour** : `MessageResponse`
    ```json
    {
      "message": "Génération annulée"
    }
    ```
- **Status** : 200 OK

---

## POST /api/sessions/{sessionId}/pause
- **Description** : Mettre la session en pause
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path param : `sessionId` (UUID)
- **Retour** : Aucun contenu
- **Status** : 200 OK

---

## POST /api/sessions/{sessionId}/resume
- **Description** : Reprendre la session
- **Entrée** :
  - Authentification : JWT (UserPrincipal)
  - Path param : `sessionId` (UUID)
- **Retour** : Aucun contenu
- **Status** : 200 OK

---

## Types de valeurs utilisées

- **UUID** : identifiant unique de session ou joueur
- **String** : code de session, nom de catégorie, difficulté
- **Boolean** : isPrivate, isTeamMode, isSpectator
- **Integer** : debtAmount, questionsPerCategory, maxPlayers, maxCategoriesPerPlayer
- **List** : catégories (array d’objets)
- **Object** : objets de réponse (SessionResponse, PlayerResponse, etc.)

---

**Pour chaque endpoint, tu retrouves :**
- Méthode HTTP
- Paramètres d’entrée (path, query, body)
- Type de retour (objet JSON ou aucun contenu)
- Exemple de payload
