import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import { useAuthStore, usersApi } from '@xalaat/core';
import { wsManager } from '~/lib/websocket';

/**
 * Rattrape un refus d'authentification du WebSocket.
 *
 * Le serveur rejette désormais toute frame STOMP CONNECT sans jeton valide, et tout
 * abonnement à une destination qui ne concerne pas l'utilisateur. Le manager coupe alors
 * ses reconnexions — sans quoi il bouclerait indéfiniment sur un jeton périmé — et émet
 * `_auth_error`. Sans ce crochet, l'écran resterait figé sans la moindre explication :
 * c'est exactement le symptôme que le durcissement serveur aurait produit chez les clients
 * déjà installés, et la raison pour laquelle ce correctif doit être déployé AVANT lui.
 *
 * Stratégie délibérément minimale : **une** tentative de reprise, puis la connexion.
 * Un jeton d'accès simplement expiré est le cas courant et se règle tout seul ; un refus
 * qui persiste signifie que la session n'est plus valide, et insister ne ferait que
 * masquer le problème.
 */
export function useWebSocketAuthRecovery() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  // Empêche plusieurs reprises concurrentes : le manager peut émettre `_auth_error`
  // pour chaque abonnement refusé d'une même connexion.
  const recoveringRef = useRef(false);

  useEffect(() => {
    const unsubscribe = wsManager.subscribe((event) => {
      if (event.type !== '_auth_error' || recoveringRef.current) return;
      recoveringRef.current = true;

      void (async () => {
        try {
          // Un appel authentifié quelconque suffit : l'intercepteur d'apiClient rafraîchit
          // le jeton de façon transparente en cas de 401. On réutilise cette mécanique
          // plutôt que d'en écrire une seconde, qui pourrait diverger.
          await usersApi.getMe();
          wsManager.retryAfterAuthRecovery();
        } catch {
          await logout();
          router.replace('/(auth)/login');
        } finally {
          recoveringRef.current = false;
        }
      })();
    });

    return unsubscribe;
  }, [router, logout]);
}
