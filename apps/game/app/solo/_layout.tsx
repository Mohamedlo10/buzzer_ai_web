import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';

import { palette } from '~/lib/theme/tokens';

/**
 * Modules Carrière et Entraînement, reportés après la V1 (§2.2).
 *
 * <p>Retirer les boutons de l'accueil ne suffit pas. <b>expo-router est file-based</b> :
 * tout fichier sous {@code app/solo/} reste une route atteignable, donc
 * {@code xalaat://solo/training} ou un lien profond conservé dans l'historique du navigateur
 * mène encore à ces écrans — non maintenus, et adossés à 24 endpoints qui déclenchent des
 * générations IA payantes.
 *
 * <p>Ce garde-fou est donc la seule barrière réelle. Les écrans eux-mêmes restent sur disque
 * (~3 300 lignes) : c'est une porte fermée, pas une démolition, et les rouvrir en V1.1 ne
 * demandera que de retirer cette liste.
 */
const BLOCKED_SEGMENTS = ['career', 'training'];

export default function SoloLayout() {
  const router = useRouter();
  // expo-router type le retour comme un tuple étroit, dérivé des routes connues à la
  // compilation. On le lit comme un simple tableau : ce garde-fou doit fonctionner pour
  // toute profondeur de chemin, y compris celles qu'expo-router n'a pas typées.
  const segments = useSegments() as string[];

  useEffect(() => {
    // segments vaut par exemple ['solo', 'training', 'session', '[sessionId]'].
    // On teste le second, qui porte le module.
    const moduleSegment = segments[1];

    if (moduleSegment && BLOCKED_SEGMENTS.includes(moduleSegment)) {
      router.replace('/(tabs)/solo');
    }
  }, [segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  );
}
