# Analyse du Système de Jeu BuzzMaster AI

## Vue d'ensemble

BuzzMaster AI est un système de quiz multijoueur en temps réel basé sur un mécanisme de buzzer compétitif. Le jeu suit un modèle classique de quiz télévisé où plusieurs joueurs s'affrontent en répondant à des questions générées par IA.

---

## 1. Architecture des Entités du Jeu

### 1.1 Session
**Entité centrale** qui représente une partie de jeu.

**États possibles (SessionStatus):**
- `LOBBY` : Salle d'attente, les joueurs rejoignent et choisissent leurs catégories
- `GENERATING` : Génération des questions par l'IA en cours
- `PLAYING` : Partie en cours
- `PAUSED` : Partie en pause (peut être reprise)
- `RESULTS` : Partie terminée, affichage des résultats
- `CANCELLED` : Partie annulée

**Propriétés clés:**
- `code` : Code à 6 chiffres unique pour rejoindre la session
- `manager` : L'utilisateur qui a créé la session et qui gère la partie
- `currentQuestionIndex` : Index de la question actuelle (0-based)
- `totalQuestions` : Nombre total de questions générées
- `questionsPerCategory` : Nombre de questions par catégorie (default: 5)
- `maxPlayers` : Limite de joueurs (default: 20)
- `debtAmount` : Montant de la dette par catégorie (système de pénalité)
- `isPrivate` : Session publique ou privée
- `isTeamMode` : Mode individuel ou équipe

### 1.2 Player
Représente un participant dans une session spécifique.

**Propriétés clés:**
- `user` : Référence à l'utilisateur authentifié
- `name` : Nom d'affichage dans la partie
- `score` : Score actuel du joueur
- `categoryScores` : Map stockant les bonnes réponses par catégorie `{"Histoire": 3, "Science": 1}`
- `isManager` : Indique si c'est le manager de la session
- `isSpectator` : Mode spectateur (peut voir mais ne peut pas buzzer)
- `team` : Référence à l'équipe (si mode équipe activé)

**Contrainte:** Un utilisateur ne peut être joueur qu'une seule fois par session (UNIQUE session_id + user_id)

### 1.3 Question
Chaque question générée par l'IA.

**Propriétés:**
- `category` : Catégorie de la question (ex: "Histoire", "Science")
- `text` : Le texte de la question
- `answer` : La réponse correcte (visible uniquement par le manager)
- `explanation` : Explication pédagogique de la réponse
- `difficulty` : Niveau de difficulté (FACILE, INTERMEDIAIRE, EXPERT)
- `orderIndex` : Position de la question dans la séquence (0-based)
- `winner` : Le joueur qui a répondu correctement (nullable)
- `isSkipped` : Question passée par le manager

### 1.4 Buzz
Enregistrement d'un buzz par un joueur sur une question.

**Propriétés:**
- `question` : La question buzzée
- `player` : Le joueur qui a buzzé
- `buzzTimestampMs` : Timestamp client du buzz (en millisecondes)
- `serverReceivedAt` : Timestamp serveur de réception

**Contrainte:** Un joueur ne peut buzzer qu'une seule fois par question (UNIQUE question_id + player_id)

**Tri de la file d'attente:** Les buzzes sont triés par `buzzTimestampMs` ASC, puis `serverReceivedAt` ASC pour départager les égalités.

---

## 2. Règles du Jeu

### 2.1 Création et Configuration
1. Un utilisateur authentifié crée une session
2. Il devient automatiquement le **manager** de cette session
3. Il configure les paramètres:
   - Nombre de questions par catégorie (default: 5)
   - Nombre maximum de joueurs (default: 20)
   - Montant des dettes (pénalité par catégorie)
   - Session privée ou publique
   - Mode individuel ou équipe
   - Nombre max de catégories par joueur

### 2.2 Phase Lobby (Salle d'Attente)
1. Les joueurs rejoignent la session avec le code à 6 chiffres
2. Chaque joueur choisit ses catégories avec un niveau de difficulté
3. Le manager peut:
   - Voir tous les joueurs connectés
   - Modifier les catégories des joueurs
   - Retirer des joueurs
   - Définir des joueurs comme spectateurs

**Limitation:** Le nombre maximum de catégories par joueur est configurable

### 2.3 Phase de Génération
1. Le manager déclenche le démarrage (`POST /api/sessions/{id}/start`)
2. La session passe en état `GENERATING`
3. Le système:
   - Collecte TOUTES les catégories de TOUS les joueurs
   - Construit un prompt pour OpenAI GPT-4o-mini
   - Génère `questionsPerCategory` questions par catégorie
   - Vérifie l'historique pour éviter les doublons
   - Sauvegarde les questions avec un `orderIndex` séquentiel
4. Progression diffusée via WebSocket (0% → 100%)
5. Compte à rebours: 3, 2, 1, START!
6. La session passe en état `PLAYING`
7. La première question est diffusée

**Important:** Pendant la génération, les joueurs ne peuvent PAS rejoindre la session

### 2.4 Phase de Jeu (Boucle Principale)

#### Affichage d'une Question
1. La question est diffusée à tous les joueurs via WebSocket
2. **Les joueurs voient:** catégorie, texte, difficulté
3. **Le manager voit en plus:** réponse, explication

#### Mécanisme de Buzz
1. Un joueur clique sur son buzzer (`POST /api/games/{id}/buzz`)
2. Le système enregistre:
   - Le timestamp client (envoyé par le joueur)
   - Le timestamp serveur (moment de réception)
3. Le buzz est ajouté à la **file d'attente** (buzzQueue)
4. La file d'attente est diffusée en temps réel à tous les joueurs
5. Affichage: ordre d'arrivée + différence de temps en ms par rapport au premier

**Règles du Buzz:**
- Un joueur ne peut buzzer qu'UNE SEULE FOIS par question
- Les spectateurs ne peuvent PAS buzzer
- Si le joueur a déjà buzzé: exception `AlreadyBuzzedException`
- La file est triée par timestamp client (pour gérer la latence réseau)

#### Validation de la Réponse

**Option 1: Réponse CORRECTE** (`isCorrect: true`)
1. Ajout de points au score du joueur (default: +5, configurable)
2. Incrémentation du compteur de bonnes réponses dans `categoryScores`
3. Le joueur devient le `winner` de cette question
4. **TOUS** les buzzes de cette question sont supprimés
5. Passage à la question suivante (`currentQuestionIndex++`)
6. Si c'était la dernière question → FIN DE PARTIE
7. Sinon → diffusion de la question suivante

**Option 2: Réponse INCORRECTE** (`isCorrect: false`)
1. Soustraction de points (default: -5, configurable, peut être 0)
2. Suppression **UNIQUEMENT** du buzz de ce joueur
3. Les autres joueurs restent dans la file d'attente
4. Le jeu continue avec les joueurs restants

**Diffusion WebSocket:**
- Mise à jour du score du joueur
- Nouvelle file d'attente (vide si correct, mise à jour si incorrect)
- Question suivante (si correct)

#### Actions du Manager

**Skip (Passer la Question):**
- La question est marquée `isSkipped = true`
- Tous les buzzes sont supprimés
- Passage à la question suivante
- Aucun point n'est attribué

**Reset Buzzer:**
- Suppression de tous les buzzes de la question actuelle
- Remet les compteurs à zéro
- Les joueurs peuvent buzzer à nouveau

**Correction de Score:**
- Le manager peut ajuster manuellement le score d'un joueur
- Raison obligatoire (traçabilité)
- Création d'une entrée `ScoreCorrection` en base
- Type automatique: CREDIT (+), DEBT (-), ou CORRECTION (0)

**Pause/Resume:**
- La partie peut être mise en pause (`PAUSED`)
- En pause: les joueurs ne peuvent pas buzzer
- Reprise: retour à l'état `PLAYING`

### 2.5 Fin de Partie

**Déclenchement:** Quand `currentQuestionIndex >= totalQuestions`

**Actions automatiques:**
1. La session passe en état `RESULTS`
2. Timestamp `endedAt` enregistré
3. Calcul du classement final (avec dettes)
4. Mise à jour des classements globaux
5. Si la partie était dans une salle → mise à jour du classement de la salle
6. Diffusion du classement final via WebSocket

---

## 3. Système de Scoring

### 3.1 Score de Base
- **Bonne réponse:** +5 points (configurable)
- **Mauvaise réponse:** -5 points (configurable, peut être 0)
- Le score peut être négatif

### 3.2 Category Scores
Compteur de bonnes réponses par catégorie:
```json
{
  "categoryScores": {
    "Histoire": 3,
    "Science": 1,
    "Géographie": 2
  }
}
```

**Utilité:**
- Performance par catégorie
- Calcul des dettes
- Statistiques du joueur

### 3.3 Système de Dettes

**Principe:** Un joueur doit une dette s'il a moins bien performé qu'un autre dans SA propre catégorie.

**Algorithme de calcul (à la fin de la partie):**
```
Pour chaque joueur A:
  Pour chaque catégorie C choisie par A:
    bonnesReponsesA = A.categoryScores[C]
    
    Trouver le joueur B avec le maximum de bonnes réponses dans la catégorie C
    bonnesReponsesMax = B.categoryScores[C]
    
    Si bonnesReponsesA < bonnesReponsesMax:
      Dette: A doit `debtAmount` points à B
```

**Exemple:**
- Joueur Alice choisit "Histoire" → 2 bonnes réponses
- Joueur Bob choisit "Histoire" → 4 bonnes réponses
- Montant dette = 5 points
- Résultat: Alice doit 5 points à Bob

**Important:** La dette est **informative** uniquement, elle n'est PAS automatiquement soustraite du score.

### 3.4 Corrections Manuelles
Le manager peut corriger les scores avec:
- `amount` : montant (positif ou négatif)
- `reason` : justification obligatoire
- Enregistrement dans `score_corrections` pour audit

---

## 4. Flow Complet d'une Partie

### Diagramme de Séquence

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Manager  │    │  Joueur  │    │  Backend │    │    IA    │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Créer session              │               │
     ├──────────────────────────────>│               │
     │<─────── Code 482910 ──────────│               │
     │               │               │               │
     │               │ 2. Rejoindre  │               │
     │               ├──────────────>│               │
     │               │               │               │
     │          3. Choisir catégories│               │
     │               ├──────────────>│               │
     │<──── WS: Joueur ajouté ───────┤               │
     │               │               │               │
     │ 4. Démarrer   │               │               │
     ├──────────────────────────────>│               │
     │<──── WS: GENERATING ──────────┤               │
     │               │               │               │
     │               │               │ 5. Générer Q  │
     │               │               ├──────────────>│
     │<──── WS: Progress 30% ────────┤               │
     │<──── WS: Progress 70% ────────┤               │
     │               │               │<── Questions ─┤
     │<──── WS: Progress 100% ───────┤               │
     │<──── WS: Countdown 3,2,1 ─────┤               │
     │<──── WS: PLAYING ─────────────┤               │
     │<──── WS: Question #1 ─────────┤               │
     │               │               │               │
     │               │ 6. BUZZ!      │               │
     │               ├──────────────>│               │
     │<──── WS: BuzzQueue [J1] ──────┤               │
     │               │               │               │
     │ 7. Valider (correct)          │               │
     ├──────────────────────────────>│               │
     │<──── WS: Score update ────────┤               │
     │<──── WS: Question #2 ─────────┤               │
     │               │               │               │
     │              ...             ...              │
     │               │               │               │
     │<──── WS: GAME OVER ───────────┤               │
     │<──── WS: Rankings ────────────┤               │
     └───────────────────────────────┴───────────────┘
```

### Étapes Détaillées

#### ÉTAPE 1: CRÉATION (Manager)
```http
POST /api/sessions
{
  "questionsPerCategory": 5,
  "maxPlayers": 20,
  "debtAmount": 5,
  "isPrivate": false,
  "maxCategoriesPerPlayer": 5
}
→ Response: { sessionId, code: "482910", status: "LOBBY" }
→ WebSocket: Connect + Subscribe /topic/session/{id}/*
```

#### ÉTAPE 2: LOBBY (Joueurs)
```http
GET /api/sessions/join/482910
→ { session, players[] }

POST /api/sessions/{id}/players
{
  "name": "Alice",
  "isSpectator": false,
  "categories": [
    { "name": "Histoire", "difficulty": "INTERMEDIAIRE" },
    { "name": "Science", "difficulty": "EXPERT" }
  ]
}
→ { player, categories[] }
→ WebSocket Broadcast: /topic/.../players { event: "JOINED", player }
```

#### ÉTAPE 3: GÉNÉRATION
```http
POST /api/sessions/{id}/start
→ 202 Accepted
→ WS: /topic/.../status { status: "GENERATING" }
→ WS: /topic/.../generating { progress: 0.3, message: "Génération..." }
→ WS: /topic/.../generating { progress: 0.7, message: "Presque prêt..." }
→ WS: /topic/.../generating { progress: 1.0, message: "Terminé!" }
→ WS: /topic/.../countdown { count: 3 }
→ WS: /topic/.../countdown { count: 2 }
→ WS: /topic/.../countdown { count: 1 }
→ WS: /topic/.../countdown { count: 0, event: "START" }
→ WS: /topic/.../status { status: "PLAYING" }
→ WS: /topic/.../question { id, category, text, difficulty }
```

#### ÉTAPE 4: BOUCLE DE JEU

**Buzz:**
```http
POST /api/games/{id}/buzz
{ "timestampMs": 1234567890123 }
→ WS: /topic/.../buzz { 
    buzzQueue: [
      { playerId, playerName, timeDiffMs: 0 },
      { playerId, playerName, timeDiffMs: 234 }
    ]
  }
```

**Validation Correcte:**
```http
POST /api/games/{id}/validate
{ 
  "playerId": "uuid",
  "isCorrect": true,
  "points": 5,
  "category": "Histoire"
}
→ WS: /topic/.../score { playerId, newScore: 5, event: "CORRECT" }
→ WS: /topic/.../buzz { buzzQueue: [] }
→ WS: /topic/.../question { next question }
```

**Validation Incorrecte:**
```http
POST /api/games/{id}/validate
{ 
  "playerId": "uuid",
  "isCorrect": false,
  "points": -5
}
→ WS: /topic/.../score { playerId, newScore: -5, event: "WRONG" }
→ WS: /topic/.../buzz { buzzQueue: [autres joueurs] }
```

**Skip:**
```http
POST /api/games/{id}/skip
→ WS: /topic/.../question { next question }
```

**Reset Buzzer:**
```http
POST /api/games/{id}/reset-buzzer
→ WS: /topic/.../buzzer-reset {}
```

#### ÉTAPE 5: FIN DE PARTIE (Automatique)
```
Dernière question validée
→ currentQuestionIndex = totalQuestions
→ Session.status = RESULTS
→ Calcul rankings + dettes
→ WS: /topic/.../game-over { 
    rankings: [
      {
        rank: 1,
        player: { id, name, avatarUrl },
        score: 25,
        corrections: [{ amount: -3, reason: "Erreur" }],
        finalScore: 22,
        categoryPerformance: { "Histoire": 3, "Science": 1 },
        debts: [
          { category: "Science", owedTo: "Bob", amount: 5 }
        ]
      }
    ]
  }
→ WS: /topic/.../status { status: "RESULTS" }
```

---

## 5. Communication Temps Réel (WebSocket)

### Topics de Subscription

**Par Session:**
```
/topic/session/{sessionId}/status      → Changements d'état
/topic/session/{sessionId}/players     → Joueurs rejoints/quittés
/topic/session/{sessionId}/question    → Nouvelle question
/topic/session/{sessionId}/buzz        → File d'attente des buzzes
/topic/session/{sessionId}/score       → Mises à jour de score
/topic/session/{sessionId}/buzzer-reset → Réinitialisation buzzer
/topic/session/{sessionId}/game-over   → Fin de partie + résultats
/topic/session/{sessionId}/generating  → Progression génération
/topic/session/{sessionId}/countdown   → Compte à rebours
```

**Par Utilisateur (notifications personnelles):**
```
/queue/user/{userId}/notifications → Notifications générales
/queue/user/{userId}/invitations   → Invitations à des sessions
```

### Événements Diffusés

| Événement | Topic | Payload | Déclencheur |
|-----------|-------|---------|-------------|
| Session créée | status | `{ status: "LOBBY" }` | POST /sessions |
| Joueur rejoint | players | `{ event: "JOINED", player }` | POST /sessions/{id}/players |
| Joueur quitté | players | `{ event: "LEFT", playerId }` | DELETE /sessions/{id}/players/{id} |
| Génération démarre | status | `{ status: "GENERATING" }` | POST /sessions/{id}/start |
| Progression | generating | `{ progress, message }` | AI generation |
| Compte à rebours | countdown | `{ count }` | Après génération |
| Jeu démarre | status | `{ status: "PLAYING" }` | Fin countdown |
| Question affichée | question | `{ id, category, text, difficulty }` | Nouvelle question |
| Buzz enregistré | buzz | `{ buzzQueue: [...] }` | POST /games/{id}/buzz |
| Score mis à jour | score | `{ playerId, newScore, event }` | POST /games/{id}/validate |
| Buzzer réinitialisé | buzzer-reset | `{}` | POST /games/{id}/reset-buzzer |
| Partie terminée | game-over | `{ rankings: [...] }` | Dernière question |
| Résultats | status | `{ status: "RESULTS" }` | Fin de partie |

---

## 6. Gestion des Erreurs et Cas Limites

### Erreurs de Jeu

| Erreur | Code HTTP | Cas |
|--------|-----------|-----|
| `GameNotPlayingException` | 400 | Buzz alors que status ≠ PLAYING |
| `AlreadyBuzzedException` | 409 | Joueur a déjà buzzé sur cette question |
| `InsufficientPlayersException` | 400 | Démarrage avec < 2 joueurs |
| `ResourceNotFoundException` | 404 | Session/Joueur/Question inexistant |
| `UnauthorizedException` | 403 | Action manager par non-manager |

### Cas Limites

**Reconnexion:**
```http
GET /api/games/{sessionId}/state
→ État complet: session, question actuelle, buzzQueue, scores, myPlayer
```

**Latence Réseau:**
- Le buzz utilise le timestamp CLIENT pour compenser la latence
- Le serveur enregistre aussi `serverReceivedAt` pour audit
- Tri: buzzTimestampMs ASC, puis serverReceivedAt ASC

**Joueur Déconnecté:**
- Le joueur reste dans la session
- Il peut reconnecter et récupérer l'état via `/state`
- Le manager peut le retirer manuellement

**Génération IA Échouée:**
- Retry automatique (3 tentatives avec backoff: 2s, 4s, 8s)
- Si échec total: session repassée en LOBBY
- Message d'erreur diffusé via WebSocket

**Timeout Génération:**
- Timeout configuré à 30 secondes par appel
- Retry une fois en cas de timeout
- Si échec: retour LOBBY avec message

---

## 7. Intégration IA (OpenAI GPT-4o-mini)

### Configuration
- **Modèle:** gpt-4o-mini
- **Temperature:** 0.8 (pour variété)
- **Max tokens:** 4096
- **Format:** JSON structuré
- **Timeout:** 30s
- **Retry:** 3 tentatives

### Prompt Template
```
Génère exactement {questionsPerCategory} questions pour chacune des catégories :
- Catégorie: "Histoire" | Niveau: INTERMEDIAIRE
- Catégorie: "Science" | Niveau: EXPERT

IMPORTANT:
- Questions en FRANÇAIS
- Réponses courtes (1-5 mots max)
- Explication détaillée (2-3 phrases)
- Éviter doublons: [liste des questions récentes]

Format JSON:
[
  {
    "category": "string",
    "difficulty": "Facile|Intermédiaire|Expert",
    "text": "question",
    "answer": "réponse courte",
    "explanation": "explication détaillée"
  }
]
```

### Anti-Doublons
- Table `question_history` stocke les hash des questions récentes
- Lors de la génération: exclusion des questions déjà posées
- Fenêtre temporelle configurable (ex: derniers 30 jours)

---

## 8. Sécurité et Autorisations

### Niveaux d'Accès

**Joueur Standard:**
- Rejoindre une session publique
- Buzzer et participer
- Voir son score et le classement

**Manager (créateur de session):**
- Toutes les actions joueur
- Démarrer/Pause/Resume la session
- Valider les réponses
- Skip des questions
- Reset buzzer
- Corrections de score
- Voir réponses et explications
- Retirer des joueurs
- Modifier les catégories

**Spectateur:**
- Voir la partie en temps réel
- Voir le chat (si implémenté)
- NE PEUT PAS buzzer
- NE modifie PAS les scores

**Super Admin:**
- Toutes les actions
- Voir toutes les sessions
- Statistiques globales
- Suivi des crédits IA
- Gérer les utilisateurs

### Vérifications
```java
// GameService.validateAnswer()
sessionService.verifyManager(sessionId, userId);
// → Vérifie que userId est bien le manager de cette session
```

---

## 9. Métriques et Optimisations

### Performance
- **Transactions atomiques** pour validate_answer (éviter race conditions)
- **WebSocket broadcast** asynchrone après commit
- **Index DB** sur session.code, question.session_id + order_index
- **Pagination** des classements globaux

### Monitoring
- Logging des appels IA (tokens, coût, durée)
- Table `ai_usage_logs` pour audit
- Tracking des erreurs de génération
- Statistiques de sessions (durée moyenne, nb joueurs)

---

## 10. Fonctionnalités Avancées (Phases 2-3)

### Mode Équipe
- Table `teams` avec score cumulé
- Score équipe = somme des scores des joueurs
- Classement par équipe

### Salles Persistantes
- Une salle peut héberger plusieurs sessions successives
- Classement cumulatif de la salle
- Invitations automatiques pour nouvelle partie

### Système d'Amis
- Table `friendships`
- Invitations en temps réel via WebSocket
- Notification quand un ami lance une partie

### Dashboard Utilisateur
- Historique des parties
- Statistiques personnelles
- Performance par catégorie
- Progression temporelle

---

## Conclusion

BuzzMaster AI implémente un système de quiz compétitif robuste avec:

✅ **Gestion d'état stricte** (LOBBY → GENERATING → PLAYING → RESULTS)  
✅ **Buzzer temps réel** avec compensation de latence  
✅ **Validation transactionnelle** atomique  
✅ **Génération IA intelligente** avec anti-doublons  
✅ **Communication WebSocket** pour fluidité temps réel  
✅ **Système de dettes** pour gamification  
✅ **Permissions granulaires** (joueur/manager/spectateur/admin)  
✅ **Reconnexion transparente** via endpoint /state  
✅ **Scalabilité** via architecture en couches Spring Boot

Le système est conçu pour être extensible (mode équipe, salles, amis) tout en restant simple à utiliser pour une partie basique.
