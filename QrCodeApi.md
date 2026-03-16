# BuzzMaster API — QR Code Endpoints

## Fonctionnalité

Permet de générer des QR codes pour rejoindre une session ou une salle (room) via une URL web.  
- **Public** : aucun JWT requis
- **Utilisation** : scan du QR → ouverture de l’URL web (redirigée vers l’app si installée, sinon navigateur)

---

## Endpoints

### 1. GET `/api/qr/session/{sessionId}`

- **Description** : Génère un QR code PNG pour rejoindre une session.
- **Accès** : Public (pas d’authentification)
- **Entrée** :
  - Path param : `sessionId` (UUID)
- **Retour** :
  - Type : `image/png`
  - Cache : 5 minutes
  - Contenu QR :  
    ```
    {APP_BASE_URL}/join/session/{code}
    ```
    Exemple :  
    ```
    https://ton-domaine.com/join/session/123456
    ```
- **Exemple de requête** :
  ```
  GET /api/qr/session/2f4c1e2a-1234-5678-90ab-cdef12345678
  ```
- **Exemple de réponse** :
  - PNG (QR code)

---

### 2. GET `/api/qr/room/{roomId}`

- **Description** : Génère un QR code PNG pour rejoindre une salle (room).
- **Accès** : Public (pas d’authentification)
- **Entrée** :
  - Path param : `roomId` (UUID)
- **Retour** :
  - Type : `image/png`
  - Cache : 60 minutes
  - Contenu QR :  
    ```
    {APP_BASE_URL}/join/room/{code}
    ```
    Exemple :  
    ```
    https://ton-domaine.com/join/room/ABCD2345
    ```
- **Exemple de requête** :
  ```
  GET /api/qr/room/3a2b1c4d-9876-5432-10fe-dcba98765432
  ```
- **Exemple de réponse** :
  - PNG (QR code)

---

## Types d’entrée

- **sessionId** : UUID (ex : `2f4c1e2a-1234-5678-90ab-cdef12345678`)
- **roomId** : UUID (ex : `3a2b1c4d-9876-5432-10fe-dcba98765432`)

## Types de retour

- **image/png** : fichier binaire (QR code)
- **Cache-Control** :  
  - Session QR : 5 min  
  - Room QR : 60 min

---

## Comportement

- Le QR code encode une URL web basée sur la variable d’environnement `APP_BASE_URL` (défaut : `http://localhost:3000`).
- En prod, configure `APP_BASE_URL` pour pointer vers ton domaine.
- Si l’app mobile est installée et configurée avec App Links (Android) ou Universal Links (iOS), le scan du QR ouvre l’app directement. Sinon, la page web s’ouvre dans le navigateur.
- Le backend ne gère que l’encodage de l’URL, pas la redirection vers l’app.

---

## Configuration

- Variable d’environnement :  
  ```
  APP_BASE_URL=https://ton-domaine.com
  ```
- Par défaut :  
  ```
  APP_BASE_URL=http://localhost:3000
  ```

---

## Dépendance

- **ZXing** : bibliothèque utilisée pour générer les QR codes.  
  > ⚠️ Pense à faire un Maven reload dans ton IDE pour télécharger ZXing.

---

## Résumé

- **Endpoints publics**
- **QR code PNG**
- **URL configurable**
- **Comportement mobile/web automatique via App Links/Universal Links**
- **Aucune authentification requise**
