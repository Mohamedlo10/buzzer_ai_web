# @xalaat/core

Code partagé entre les applications : types, stores Zustand, client API, moteur de jeu,
WebSocket, hooks métier et design tokens.

## Comment on l'importe

Il n'a **pas de point d'entrée** (`main`) et ne doit pas en avoir pour l'instant.
`apps/web-legacy` le consomme par alias de chemin, via `tsconfig.json` et
`next.config.ts` :

```
~/lib/*    → packages/core/src/lib/*
~/stores/* → packages/core/src/stores/*
~/types/*  → packages/core/src/types/*
```

C'est ce qui a permis de restructurer le dépôt sans réécrire un seul des imports des
156 fichiers de `app/` et `components/`. Un barrel `src/index.ts` serait à créer le jour
où une application l'importera par son nom (`@xalaat/core`) — pas avant : un point
d'entrée déclaré mais absent est un mensonge que rien ne signale.

## React est une peerDependency, et ce n'est pas un détail

Neuf fichiers de `src/lib/` importent React (`lib/hooks/`, `lib/query/hooks.ts`,
`lib/websocket/use*.ts`, `lib/game/useDeadline.ts`, `lib/game/useWordReveal.ts`).

React est déclaré en `peerDependencies`, **pas** en `dependencies`. La raison est le
piège classique du monorepo : si `packages/core` installait sa propre copie de React,
`apps/game` (Expo, qui épingle sa version) et `apps/web-legacy` se retrouveraient avec
deux instances de React dans le même arbre. Le symptôme est un `Invalid hook call` à
l'exécution, sans la moindre erreur de compilation — l'un des diagnostics les plus
coûteux qui soient.

En `peerDependencies`, c'est l'application hôte qui fournit React, et il n'y en a qu'une.

## Ce qui n'est pas encore portable

`src/lib/ui/notify.ts` importe `sonner`, une librairie **web uniquement**. Elle est ici
parce que la phase 2A a déplacé `lib/` en bloc, sans rien modifier. En phase 3 ce module
devient une paire `.web.ts` / `.native.ts` (`react-native-toast-message` côté natif) ;
`sonner` sortira alors des dépendances de ce paquet.

`src/lib/utils/storage.ts` est encore `localStorage`. Son API est **déjà entièrement
asynchrone** — vestige de l'ancienne version Expo — donc la bascule vers
`expo-secure-store` + `AsyncStorage` en phase 2B ne changera aucune signature ni aucun
site d'appel.

## Contrainte sur `src/lib/hooks/`

Aucun fichier n'y importe `next/*` ni n'utilise d'API DOM (`window`, `document`,
`navigator`, `localStorage`). C'est ce qui rend ces hooks portables sous Metro. La
navigation est injectée par l'appelant via des callbacks. Vérification :

```bash
grep -rn "from 'next/\|window\.\|document\.\|navigator\.\|localStorage" src/lib/hooks/
# doit ne rien renvoyer
```
