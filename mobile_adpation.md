Le problème potentiel :

Quand un joueur répond faux, le backend retire ce joueur de la buzzQueue (elle ne montre que les PENDING). Si le frontend utilise "est-ce que mon ID est dans la buzzQueue" pour savoir si le bouton buzz est actif, le joueur verrait le bouton se ré-activer après une mauvaise réponse — et en cliquant, il recevrait une AlreadyBuzzedException du serveur.

Ce que le front doit faire :

Gérer hasBuzzed comme un état séparé de la buzzQueue :


hasBuzzed = false   →  on peut buzzer
hasBuzzed = true    →  bouton désactivé, même si l'ID n'est plus dans la queue

Quand mettre hasBuzzed = true  :  réponse 200 à POST /buzz
Quand remettre hasBuzzed = false :
  ✅ event WebSocket "buzzer-reset"       → le manager a reset
  ✅ event WebSocket "question" (next)    → nouvelle question
  ✅ event WebSocket "game-over"          → fin de partie
  ❌ event WebSocket "score" avec WRONG   → NE PAS reset ici
Le flux WebSocket côté front :

Event reçu	Action sur hasBuzzed
score → event: "WRONG"	rien (joueur toujours bloqué)
score → event: "CORRECT"	reset à false (nouvelle question arrive)
buzzer-reset	reset à false
question (next question)	reset à false
À la reconnexion (GET /games/{id}/state), le champ hasBuzzed dans la réponse reflète déjà la bonne valeur (il check existsByQuestionIdAndPlayerId qui inclut les buzz WRONG) — aucun changement nécessaire côté back.

Si ton front utilise déjà hasBuzzed indépendamment de la queue, il n'y a rien à changer. Si il re-active le bouton sur event WRONG, c'est le seul endroit à corriger.