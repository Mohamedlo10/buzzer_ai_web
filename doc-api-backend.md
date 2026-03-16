{
  "openapi": "3.1.0",
  "info": {
    "title": "BuzzMaster AI API",
    "description": "Backend API pour BuzzMaster AI - Jeu de quiz multijoueur en temps réel",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "http://localhost:8080",
      "description": "Generated server url"
    }
  ],
  "security": [
    {
      "Bearer Authentication": []
    }
  ],
  "tags": [
    {
      "name": "Authentication",
      "description": "Inscription, connexion, refresh et logout"
    },
    {
      "name": "Rooms",
      "description": "Gestion des salles persistantes"
    },
    {
      "name": "Dashboard",
      "description": "Vue d'ensemble utilisateur"
    },
    {
      "name": "Users",
      "description": "Gestion du profil utilisateur"
    },
    {
      "name": "Friends",
      "description": "Gestion des amis"
    },
    {
      "name": "Invitations",
      "description": "Invitations de jeu"
    },
    {
      "name": "Admin",
      "description": "Administration (SUPER_ADMIN uniquement)"
    },
    {
      "name": "Game",
      "description": "Logique de jeu: buzz, validation, scores"
    },
    {
      "name": "Sessions",
      "description": "Gestion des sessions de jeu"
    },
    {
      "name": "Rankings",
      "description": "Classements globaux et par session"
    }
  ],
  "paths": {
    "/api/users/me": {
      "get": {
        "tags": [
          "Users"
        ],
        "summary": "Profil de l'utilisateur connecté",
        "operationId": "getMe",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/UserResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Users"
        ],
        "summary": "Mettre à jour le profil",
        "operationId": "updateProfile",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateProfileRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/UserResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/users/me/password": {
      "put": {
        "tags": [
          "Users"
        ],
        "summary": "Changer le mot de passe",
        "operationId": "changePassword",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ChangePasswordRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/sessions/{sessionId}/players/{playerId}/categories": {
      "put": {
        "tags": [
          "Sessions"
        ],
        "summary": "Modifier les catégories d'un joueur (manager, en LOBBY)",
        "operationId": "updateCategories",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "playerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/CategoryRequest"
                }
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/invitations/{id}/decline": {
      "put": {
        "tags": [
          "Invitations"
        ],
        "summary": "Refuser une invitation",
        "operationId": "declineInvitation",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/invitations/{id}/accept": {
      "put": {
        "tags": [
          "Invitations"
        ],
        "summary": "Accepter une invitation",
        "operationId": "acceptInvitation",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/friends/requests/{id}/decline": {
      "put": {
        "tags": [
          "Friends"
        ],
        "summary": "Refuser une demande",
        "operationId": "declineRequest",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/friends/requests/{id}/accept": {
      "put": {
        "tags": [
          "Friends"
        ],
        "summary": "Accepter une demande",
        "operationId": "acceptRequest",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/admin/users/{userId}/role": {
      "put": {
        "tags": [
          "Admin"
        ],
        "summary": "Changer le rôle d'un utilisateur",
        "operationId": "updateUserRole",
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "additionalProperties": {
                  "type": "string"
                }
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/sessions": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Créer une nouvelle session",
        "operationId": "createSession",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateSessionRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/SessionCreateResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/sessions/{sessionId}/start": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Démarrer la session (génération des questions)",
        "operationId": "startSession",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MessageResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/sessions/{sessionId}/resume": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Reprendre la session",
        "operationId": "resumeSession",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/sessions/{sessionId}/players": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Rejoindre une session",
        "operationId": "addPlayer",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/JoinSessionRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/SessionAddPlayerResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/sessions/{sessionId}/pause": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Mettre la session en pause",
        "operationId": "pauseSession",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/rooms": {
      "get": {
        "tags": [
          "Rooms"
        ],
        "summary": "Mes salles",
        "operationId": "getUserRooms",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/RoomSummaryResponse"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Rooms"
        ],
        "summary": "Créer une salle",
        "operationId": "createRoom",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "additionalProperties": {
                  "type": "object"
                }
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/RoomCreateResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/rooms/{code}/leave": {
      "post": {
        "tags": [
          "Rooms"
        ],
        "summary": "Quitter une salle",
        "operationId": "leaveRoom",
        "parameters": [
          {
            "name": "code",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/rooms/{code}/join": {
      "post": {
        "tags": [
          "Rooms"
        ],
        "summary": "Rejoindre une salle par code",
        "operationId": "joinRoom",
        "parameters": [
          {
            "name": "code",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/RoomDetailResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/invitations": {
      "post": {
        "tags": [
          "Invitations"
        ],
        "summary": "Envoyer des invitations",
        "operationId": "sendInvitations",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "additionalProperties": {
                  "type": "object"
                }
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/games/{sessionId}/validate": {
      "post": {
        "tags": [
          "Game"
        ],
        "summary": "Valider une réponse (manager uniquement)",
        "operationId": "validateAnswer",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ValidateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/GameValidateResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/games/{sessionId}/skip": {
      "post": {
        "tags": [
          "Game"
        ],
        "summary": "Passer la question (manager uniquement)",
        "operationId": "skipQuestion",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/games/{sessionId}/score-correction": {
      "post": {
        "tags": [
          "Game"
        ],
        "summary": "Correction de score (manager uniquement)",
        "operationId": "scoreCorrection",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ScoreCorrectionRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/games/{sessionId}/reset-buzzer": {
      "post": {
        "tags": [
          "Game"
        ],
        "summary": "Réinitialiser le buzzer (manager uniquement)",
        "operationId": "resetBuzzer",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/games/{sessionId}/buzz": {
      "post": {
        "tags": [
          "Game"
        ],
        "summary": "Buzzer sur la question actuelle",
        "operationId": "buzz",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "additionalProperties": {
                  "type": "integer",
                  "format": "int64"
                }
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/GameBuzzResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/friends/{id}/block": {
      "post": {
        "tags": [
          "Friends"
        ],
        "summary": "Bloquer un utilisateur",
        "operationId": "blockUser",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/friends/request": {
      "post": {
        "tags": [
          "Friends"
        ],
        "summary": "Envoyer une demande d'amitié",
        "operationId": "sendRequest",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "additionalProperties": {
                  "type": "string",
                  "format": "uuid"
                }
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/FriendRequestResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/register": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Inscription d'un nouvel utilisateur",
        "operationId": "register",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RegisterRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AuthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/refresh": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Rafraîchir le token d'accès",
        "operationId": "refresh",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RefreshTokenRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/TokenResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/logout": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Déconnexion (blacklist le refresh token)",
        "operationId": "logout",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RefreshTokenRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/auth/login": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Connexion d'un utilisateur",
        "operationId": "login",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AuthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/sessions/{sessionId}/force-stop": {
      "post": {
        "tags": [
          "Admin"
        ],
        "summary": "Arrêter une session de force",
        "operationId": "forceStopSession",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/users/{userId}/profile": {
      "get": {
        "tags": [
          "Users"
        ],
        "summary": "Profil public d'un utilisateur",
        "operationId": "getUserProfile",
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/UserResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/users/search": {
      "get": {
        "tags": [
          "Users"
        ],
        "summary": "Rechercher des utilisateurs",
        "operationId": "searchUsers",
        "parameters": [
          {
            "name": "q",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 0
            }
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 20
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PageUserResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/sessions/{sessionId}": {
      "get": {
        "tags": [
          "Sessions"
        ],
        "summary": "Détails d'une session",
        "operationId": "getSession",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/SessionDetailResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/sessions/join/{code}": {
      "get": {
        "tags": [
          "Sessions"
        ],
        "summary": "Vérifier une session par code avant de rejoindre",
        "operationId": "joinCheck",
        "parameters": [
          {
            "name": "code",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/SessionJoinCheckResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/rooms/{roomId}": {
      "get": {
        "tags": [
          "Rooms"
        ],
        "summary": "Détails d'une salle",
        "operationId": "getRoomDetail",
        "parameters": [
          {
            "name": "roomId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/RoomDetailResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Rooms"
        ],
        "summary": "Supprimer une salle (soft delete)",
        "operationId": "deleteRoom",
        "parameters": [
          {
            "name": "roomId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/rankings/sessions/{sessionId}": {
      "get": {
        "tags": [
          "Rankings"
        ],
        "summary": "Classement d'une session avec dettes",
        "operationId": "getSessionRankings",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/SessionRankingEntryResponse"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/rankings/global": {
      "get": {
        "tags": [
          "Rankings"
        ],
        "summary": "Classement global paginé",
        "operationId": "getGlobalRankings",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 0
            }
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 20
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PageGlobalRanking"
                }
              }
            }
          }
        }
      }
    },
    "/api/rankings/global/me": {
      "get": {
        "tags": [
          "Rankings"
        ],
        "summary": "Mon rang global",
        "operationId": "getMyGlobalRank",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MyGlobalRankResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/invitations/pending": {
      "get": {
        "tags": [
          "Invitations"
        ],
        "summary": "Mes invitations en attente",
        "operationId": "getPendingInvitations",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/InvitationPendingResponse"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/games/{sessionId}/state": {
      "get": {
        "tags": [
          "Game"
        ],
        "summary": "État complet du jeu (reconnexion)",
        "operationId": "getGameState",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/GameStateResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/friends": {
      "get": {
        "tags": [
          "Friends"
        ],
        "summary": "Liste des amis acceptés",
        "operationId": "getFriends",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/UserResponse"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/friends/requests": {
      "get": {
        "tags": [
          "Friends"
        ],
        "summary": "Demandes d'amitié en attente",
        "operationId": "getPendingRequests",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/FriendPendingRequestResponse"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/dashboard": {
      "get": {
        "tags": [
          "Dashboard"
        ],
        "summary": "Tableau de bord utilisateur",
        "operationId": "getDashboard",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/DashboardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/users": {
      "get": {
        "tags": [
          "Admin"
        ],
        "summary": "Tous les utilisateurs",
        "operationId": "getAllUsers",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 0
            }
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 20
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PageUser"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/stats": {
      "get": {
        "tags": [
          "Admin"
        ],
        "summary": "Statistiques globales",
        "operationId": "getStats",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminStatsResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/sessions": {
      "get": {
        "tags": [
          "Admin"
        ],
        "summary": "Toutes les sessions (avec filtres)",
        "operationId": "getAllSessions",
        "parameters": [
          {
            "name": "status",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "LOBBY",
                "GENERATING",
                "PLAYING",
                "PAUSED",
                "RESULTS",
                "CANCELLED"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 0
            }
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 20
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PageSession"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/sessions/{sessionId}": {
      "get": {
        "tags": [
          "Admin"
        ],
        "summary": "Détail complet d'une session",
        "operationId": "getSessionDetail",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminSessionDetailResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/sessions/{sessionId}/players/{playerId}": {
      "delete": {
        "tags": [
          "Sessions"
        ],
        "summary": "Retirer un joueur (manager uniquement)",
        "operationId": "removePlayer",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "playerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/friends/{id}": {
      "delete": {
        "tags": [
          "Friends"
        ],
        "summary": "Supprimer un ami",
        "operationId": "removeFriend",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/admin/users/{userId}": {
      "delete": {
        "tags": [
          "Admin"
        ],
        "summary": "Supprimer un utilisateur",
        "operationId": "deleteUser",
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "UpdateProfileRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "maxLength": 50,
            "minLength": 3
          },
          "email": {
            "type": "string"
          },
          "avatarUrl": {
            "type": "string",
            "maxLength": 500,
            "minLength": 0
          }
        }
      },
      "UserResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "username": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "avatarUrl": {
            "type": "string"
          },
          "role": {
            "type": "string",
            "enum": [
              "USER",
              "ADMIN",
              "SUPER_ADMIN"
            ]
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ChangePasswordRequest": {
        "type": "object",
        "properties": {
          "currentPassword": {
            "type": "string",
            "minLength": 1
          },
          "newPassword": {
            "type": "string",
            "maxLength": 100,
            "minLength": 8
          }
        }
      },
      "CategoryRequest": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "difficulty": {
            "type": "string"
          }
        },
        "required": [
          "difficulty"
        ]
      },
      "CreateSessionRequest": {
        "type": "object",
        "properties": {
          "debtAmount": {
            "type": "integer",
            "format": "int32"
          },
          "questionsPerCategory": {
            "type": "integer",
            "format": "int32"
          },
          "maxPlayers": {
            "type": "integer",
            "format": "int32"
          },
          "isPrivate": {
            "type": "boolean"
          },
          "isTeamMode": {
            "type": "boolean"
          },
          "maxCategoriesPerPlayer": {
            "type": "integer",
            "format": "int32"
          },
          "roomId": {
            "type": "string",
            "format": "uuid"
          }
        }
      },
      "PlayerResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "userId": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "score": {
            "type": "integer",
            "format": "int32"
          },
          "isManager": {
            "type": "boolean"
          },
          "isSpectator": {
            "type": "boolean"
          },
          "teamId": {
            "type": "string",
            "format": "uuid"
          },
          "categoryScores": {
            "type": "object",
            "additionalProperties": {
              "type": "integer",
              "format": "int32"
            }
          }
        }
      },
      "SessionCreateResponse": {
        "type": "object",
        "properties": {
          "session": {
            "$ref": "#/components/schemas/SessionResponse"
          },
          "player": {
            "$ref": "#/components/schemas/PlayerResponse"
          }
        }
      },
      "SessionResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "code": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "LOBBY",
              "GENERATING",
              "PLAYING",
              "PAUSED",
              "RESULTS",
              "CANCELLED"
            ]
          },
          "managerId": {
            "type": "string",
            "format": "uuid"
          },
          "managerName": {
            "type": "string"
          },
          "roomId": {
            "type": "string",
            "format": "uuid"
          },
          "debtAmount": {
            "type": "integer",
            "format": "int32"
          },
          "questionsPerCategory": {
            "type": "integer",
            "format": "int32"
          },
          "currentQuestionIndex": {
            "type": "integer",
            "format": "int32"
          },
          "totalQuestions": {
            "type": "integer",
            "format": "int32"
          },
          "maxPlayers": {
            "type": "integer",
            "format": "int32"
          },
          "isPrivate": {
            "type": "boolean"
          },
          "isTeamMode": {
            "type": "boolean"
          },
          "maxCategoriesPerPlayer": {
            "type": "integer",
            "format": "int32"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "startedAt": {
            "type": "string",
            "format": "date-time"
          },
          "endedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "MessageResponse": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          }
        }
      },
      "JoinSessionRequest": {
        "type": "object",
        "properties": {
          "categories": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CategoryRequest"
            },
            "minItems": 1
          },
          "isSpectator": {
            "type": "boolean"
          }
        }
      },
      "SessionAddPlayerResponse": {
        "type": "object",
        "properties": {
          "player": {
            "$ref": "#/components/schemas/PlayerResponse"
          }
        }
      },
      "RoomCreateResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "maxPlayers": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "MemberResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "userId": {
            "type": "string",
            "format": "uuid"
          },
          "username": {
            "type": "string"
          },
          "avatarUrl": {
            "type": "string"
          },
          "isOwner": {
            "type": "boolean"
          },
          "isOnline": {
            "type": "boolean"
          },
          "joinedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RoomDetailResponse": {
        "type": "object",
        "properties": {
          "room": {
            "$ref": "#/components/schemas/RoomInfo"
          },
          "members": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MemberResponse"
            }
          },
          "sessions": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RoomSessionResponse"
            }
          },
          "rankings": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RoomRankingResponse"
            }
          }
        }
      },
      "RoomInfo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "ownerId": {
            "type": "string",
            "format": "uuid"
          },
          "ownerName": {
            "type": "string"
          }
        }
      },
      "RoomRankingResponse": {
        "type": "object",
        "properties": {
          "userId": {
            "type": "string",
            "format": "uuid"
          },
          "username": {
            "type": "string"
          },
          "avatarUrl": {
            "type": "string"
          },
          "totalScore": {
            "type": "integer",
            "format": "int32"
          },
          "gamesPlayed": {
            "type": "integer",
            "format": "int32"
          },
          "gamesWon": {
            "type": "integer",
            "format": "int32"
          },
          "bestScore": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "RoomSessionResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "code": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "LOBBY",
              "GENERATING",
              "PLAYING",
              "PAUSED",
              "RESULTS",
              "CANCELLED"
            ]
          },
          "managerId": {
            "type": "string",
            "format": "uuid"
          },
          "managerName": {
            "type": "string"
          },
          "playerCount": {
            "type": "integer",
            "format": "int64"
          },
          "maxPlayers": {
            "type": "integer",
            "format": "int32"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ValidateRequest": {
        "type": "object",
        "properties": {
          "playerId": {
            "type": "string",
            "format": "uuid"
          },
          "isCorrect": {
            "type": "boolean"
          },
          "points": {
            "type": "integer",
            "format": "int32"
          },
          "category": {
            "type": "string"
          }
        },
        "required": [
          "isCorrect",
          "playerId"
        ]
      },
      "BuzzQueueItem": {
        "type": "object",
        "properties": {
          "playerId": {
            "type": "string",
            "format": "uuid"
          },
          "playerName": {
            "type": "string"
          },
          "timeDiffMs": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "GameValidateResponse": {
        "type": "object",
        "properties": {
          "newScore": {
            "type": "integer",
            "format": "int32"
          },
          "newQuestionIndex": {
            "type": "integer",
            "format": "int32"
          },
          "buzzQueue": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/BuzzQueueItem"
            }
          },
          "gameOver": {
            "type": "boolean"
          }
        }
      },
      "ScoreCorrectionRequest": {
        "type": "object",
        "properties": {
          "playerId": {
            "type": "string",
            "format": "uuid"
          },
          "amount": {
            "type": "integer",
            "format": "int32"
          },
          "reason": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "amount",
          "playerId"
        ]
      },
      "BuzzInfo": {
        "type": "object",
        "properties": {
          "playerId": {
            "type": "string",
            "format": "uuid"
          },
          "playerName": {
            "type": "string"
          },
          "timestampMs": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "GameBuzzResponse": {
        "type": "object",
        "properties": {
          "buzz": {
            "$ref": "#/components/schemas/BuzzInfo"
          }
        }
      },
      "FriendRequestResponse": {
        "type": "object",
        "properties": {
          "friendship": {
            "$ref": "#/components/schemas/FriendshipInfo"
          }
        }
      },
      "FriendshipInfo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "status": {
            "type": "string",
            "enum": [
              "PENDING",
              "ACCEPTED",
              "DECLINED",
              "BLOCKED"
            ]
          }
        }
      },
      "RegisterRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "maxLength": 50,
            "minLength": 3
          },
          "password": {
            "type": "string",
            "maxLength": 100,
            "minLength": 8
          },
          "email": {
            "type": "string"
          }
        }
      },
      "AuthResponse": {
        "type": "object",
        "properties": {
          "accessToken": {
            "type": "string"
          },
          "refreshToken": {
            "type": "string"
          },
          "user": {
            "$ref": "#/components/schemas/UserResponse"
          }
        }
      },
      "RefreshTokenRequest": {
        "type": "object",
        "properties": {
          "refreshToken": {
            "type": "string",
            "minLength": 1
          }
        }
      },
      "TokenResponse": {
        "type": "object",
        "properties": {
          "accessToken": {
            "type": "string"
          }
        }
      },
      "LoginRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "minLength": 1
          },
          "password": {
            "type": "string",
            "minLength": 1
          }
        }
      },
      "PageUserResponse": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/UserResponse"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "first": {
            "type": "boolean"
          },
          "last": {
            "type": "boolean"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "PageableObject": {
        "type": "object",
        "properties": {
          "offset": {
            "type": "integer",
            "format": "int64"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "paged": {
            "type": "boolean"
          },
          "pageNumber": {
            "type": "integer",
            "format": "int32"
          },
          "pageSize": {
            "type": "integer",
            "format": "int32"
          },
          "unpaged": {
            "type": "boolean"
          }
        }
      },
      "SortObject": {
        "type": "object",
        "properties": {
          "empty": {
            "type": "boolean"
          },
          "sorted": {
            "type": "boolean"
          },
          "unsorted": {
            "type": "boolean"
          }
        }
      },
      "QuestionResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "category": {
            "type": "string"
          },
          "text": {
            "type": "string"
          },
          "answer": {
            "type": "string"
          },
          "explanation": {
            "type": "string"
          },
          "difficulty": {
            "type": "string",
            "enum": [
              "FACILE",
              "INTERMEDIAIRE",
              "EXPERT"
            ]
          },
          "orderIndex": {
            "type": "integer",
            "format": "int32"
          },
          "winnerId": {
            "type": "string",
            "format": "uuid"
          },
          "isSkipped": {
            "type": "boolean"
          }
        }
      },
      "SessionDetailResponse": {
        "type": "object",
        "properties": {
          "session": {
            "$ref": "#/components/schemas/SessionResponse"
          },
          "players": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PlayerResponse"
            }
          },
          "questions": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/QuestionResponse"
            }
          }
        }
      },
      "SessionJoinCheckResponse": {
        "type": "object",
        "properties": {
          "session": {
            "$ref": "#/components/schemas/SessionResponse"
          },
          "players": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PlayerResponse"
            }
          }
        }
      },
      "RoomSummaryResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "ownerId": {
            "type": "string",
            "format": "uuid"
          },
          "ownerName": {
            "type": "string"
          },
          "maxPlayers": {
            "type": "integer",
            "format": "int32"
          },
          "memberCount": {
            "type": "integer",
            "format": "int32"
          },
          "hasActiveSession": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "CorrectionInfo": {
        "type": "object",
        "properties": {
          "amount": {
            "type": "integer",
            "format": "int32"
          },
          "reason": {
            "type": "string"
          }
        }
      },
      "DebtInfo": {
        "type": "object",
        "properties": {
          "category": {
            "type": "string"
          },
          "owedTo": {
            "type": "string"
          },
          "amount": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "PlayerInfo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "avatarUrl": {
            "type": "string"
          }
        }
      },
      "SessionRankingEntryResponse": {
        "type": "object",
        "properties": {
          "player": {
            "$ref": "#/components/schemas/PlayerInfo"
          },
          "score": {
            "type": "integer",
            "format": "int32"
          },
          "corrections": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CorrectionInfo"
            }
          },
          "finalScore": {
            "type": "integer",
            "format": "int32"
          },
          "rank": {
            "type": "integer",
            "format": "int32"
          },
          "categoryPerformance": {
            "type": "object",
            "additionalProperties": {
              "type": "integer",
              "format": "int32"
            }
          },
          "debts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/DebtInfo"
            }
          }
        }
      },
      "GlobalRanking": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "user": {
            "$ref": "#/components/schemas/User"
          },
          "totalScore": {
            "type": "integer",
            "format": "int32"
          },
          "totalGames": {
            "type": "integer",
            "format": "int32"
          },
          "totalWins": {
            "type": "integer",
            "format": "int32"
          },
          "bestScore": {
            "type": "integer",
            "format": "int32"
          },
          "avgScore": {
            "type": "number"
          },
          "winRate": {
            "type": "number"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageGlobalRanking": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/GlobalRanking"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "first": {
            "type": "boolean"
          },
          "last": {
            "type": "boolean"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "username": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "passwordHash": {
            "type": "string"
          },
          "avatarUrl": {
            "type": "string"
          },
          "role": {
            "type": "string",
            "enum": [
              "USER",
              "ADMIN",
              "SUPER_ADMIN"
            ]
          },
          "isOnline": {
            "type": "boolean"
          },
          "lastSeenAt": {
            "type": "string",
            "format": "date-time"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "MyGlobalRankResponse": {
        "type": "object",
        "properties": {
          "rank": {
            "type": "integer",
            "format": "int64"
          },
          "totalScore": {
            "type": "integer",
            "format": "int32"
          },
          "totalGames": {
            "type": "integer",
            "format": "int32"
          },
          "winRate": {
            "type": "number"
          }
        }
      },
      "InvitationPendingResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "sessionId": {
            "type": "string",
            "format": "uuid"
          },
          "sessionCode": {
            "type": "string"
          },
          "senderName": {
            "type": "string"
          },
          "expiresAt": {
            "type": "string",
            "format": "date-time"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "GameStateResponse": {
        "type": "object",
        "properties": {
          "session": {
            "type": "object",
            "additionalProperties": {
              "type": "object"
            }
          },
          "currentQuestion": {
            "$ref": "#/components/schemas/QuestionResponse"
          },
          "players": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PlayerResponse"
            }
          },
          "buzzQueue": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/BuzzQueueItem"
            }
          },
          "myPlayer": {
            "$ref": "#/components/schemas/PlayerResponse"
          }
        }
      },
      "FriendPendingRequestResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "requester": {
            "$ref": "#/components/schemas/UserResponse"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ActiveSession": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "code": {
            "type": "string"
          },
          "status": {
            "type": "string"
          },
          "managerName": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "DashboardResponse": {
        "type": "object",
        "properties": {
          "activeSessions": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ActiveSession"
            }
          },
          "recentGames": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RecentGame"
            }
          },
          "pendingInvitations": {
            "type": "integer",
            "format": "int64"
          },
          "pendingFriendRequests": {
            "type": "integer",
            "format": "int64"
          },
          "globalRank": {
            "$ref": "#/components/schemas/GlobalRank"
          },
          "rooms": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RoomSummary"
            }
          }
        }
      },
      "GlobalRank": {
        "type": "object",
        "properties": {
          "rank": {
            "type": "integer",
            "format": "int64"
          },
          "totalScore": {
            "type": "integer",
            "format": "int32"
          },
          "totalGames": {
            "type": "integer",
            "format": "int32"
          },
          "winRate": {
            "type": "number"
          }
        }
      },
      "RecentGame": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "code": {
            "type": "string"
          },
          "endedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RoomSummary": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "code": {
            "type": "string"
          }
        }
      },
      "PageUser": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/User"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "first": {
            "type": "boolean"
          },
          "last": {
            "type": "boolean"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "AdminStatsResponse": {
        "type": "object",
        "properties": {
          "totalUsers": {
            "type": "integer",
            "format": "int64"
          },
          "totalSessions": {
            "type": "integer",
            "format": "int64"
          },
          "activeSessions": {
            "type": "integer",
            "format": "int64"
          },
          "totalQuestions": {
            "type": "integer",
            "format": "int64"
          },
          "aiCostThisMonth": {
            "type": "number",
            "format": "double"
          },
          "aiInputTokensThisMonth": {
            "type": "integer",
            "format": "int64"
          },
          "aiOutputTokensThisMonth": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "PageSession": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Session"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "first": {
            "type": "boolean"
          },
          "last": {
            "type": "boolean"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "Room": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "owner": {
            "$ref": "#/components/schemas/User"
          },
          "description": {
            "type": "string"
          },
          "isActive": {
            "type": "boolean"
          },
          "maxPlayers": {
            "type": "integer",
            "format": "int32"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Session": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "code": {
            "type": "string"
          },
          "room": {
            "$ref": "#/components/schemas/Room"
          },
          "status": {
            "type": "string",
            "enum": [
              "LOBBY",
              "GENERATING",
              "PLAYING",
              "PAUSED",
              "RESULTS",
              "CANCELLED"
            ]
          },
          "manager": {
            "$ref": "#/components/schemas/User"
          },
          "debtAmount": {
            "type": "integer",
            "format": "int32"
          },
          "questionsPerCategory": {
            "type": "integer",
            "format": "int32"
          },
          "currentQuestionIndex": {
            "type": "integer",
            "format": "int32"
          },
          "totalQuestions": {
            "type": "integer",
            "format": "int32"
          },
          "maxPlayers": {
            "type": "integer",
            "format": "int32"
          },
          "isPrivate": {
            "type": "boolean"
          },
          "isTeamMode": {
            "type": "boolean"
          },
          "maxCategoriesPerPlayer": {
            "type": "integer",
            "format": "int32"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "startedAt": {
            "type": "string",
            "format": "date-time"
          },
          "endedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "AdminSessionDetailResponse": {
        "type": "object",
        "properties": {
          "session": {
            "$ref": "#/components/schemas/Session"
          }
        }
      }
    },
    "securitySchemes": {
      "Bearer Authentication": {
        "type": "http",
        "description": "JWT token obtenu via /api/auth/login ou /api/auth/register",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}