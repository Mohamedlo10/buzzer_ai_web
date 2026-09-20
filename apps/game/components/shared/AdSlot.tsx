import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { PartnerCard } from '~/components/partner/PartnerCard';
import { PartnerProfileModal } from '~/components/partner/PartnerProfileModal';
import { palette, font } from '~/lib/theme/tokens';
import { adsApi, partnersApi } from '~/lib/api';
import { queryKeys } from '~/lib/query/keys';
import { notifyApiError } from '~/lib/ui/notify';
import type { AdPlacement } from '~/lib/api/ads';

interface AdSlotProps {
  placement: AdPlacement;
  /**
   * Délai avant affichage, en millisecondes.
   *
   * Utilisé sur l'écran d'attente de génération : si celle-ci ne dure que deux secondes, une
   * bannière qui apparaît et disparaît aussitôt est pire que pas de bannière du tout.
   */
  delayMs?: number;
}

/**
 * Emplacement d'une carte partenaire.
 *
 * <b>Règles absolues.</b>
 * - Retourne `null` quand il n'y a rien à montrer, jamais une `<View>` vide : sinon la
 *   disposition de l'écran se décale selon qu'une campagne est active ou non.
 * - **Ne doit jamais apparaître pendant une question, un décompte, un buzz ou une sélection
 *   engagée.** Les six écrans concernés : `session/[code]/game.tsx`,
 *   `session/[code]/questions.tsx`, `session/[code]/categories.tsx`, `daily/play.tsx`,
 *   `solo/game/[sessionId].tsx` et `solo/training/session/[sessionId].tsx`.
 * - Un seul emplacement visible par écran : `AdVisibilityProvider` avertit en développement
 *   si un second s'enregistre.
 * - Aucune redirection automatique : le site du partenaire ne s'ouvre que sur appui explicite.
 * - Tant que `ads.enabled=false` côté serveur, ce composant est toujours `null`.
 *
 * Passé de `useState`/`useEffect` à react-query : la publicité est mise en cache cinq minutes
 * et partagée entre les écrans, au lieu d'être redemandée à chaque montage.
 */
export function AdSlot({ placement, delayMs = 0 }: AdSlotProps) {
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [elapsed, setElapsed] = useState(delayMs === 0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (delayMs === 0) return;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  const { data } = useQuery({
    queryKey: queryKeys.ad(placement),
    queryFn: () => adsApi.fetchAd(placement),
    // Une campagne ne change pas d'une minute à l'autre : cinq minutes évitent une requête
    // à chaque changement d'onglet.
    staleTime: 5 * 60 * 1000,
    enabled: elapsed,
  });

  const ad = data?.enabled ? data.ad : null;
  const partner = ad?.partner ?? null;

  async function toggleFavorite() {
    if (!partner) return;
    try {
      if (partner.favorite) {
        await partnersApi.removePartnerFavorite(partner.id);
      } else {
        await partnersApi.addPartnerFavorite(partner.id);
      }
      // Le serveur reste l'autorité : on réinterroge plutôt que de deviner le nouvel état.
      queryClient.invalidateQueries({ queryKey: queryKeys.ad(placement) });
      queryClient.invalidateQueries({ queryKey: queryKeys.partnerFavorites });
      queryClient.invalidateQueries({ queryKey: queryKeys.partnerDetail(partner.id) });
    } catch (e) {
      notifyApiError(e, 'Impossible de modifier ce favori');
    }
  }

  // Règle absolue : null, jamais <View />.
  if (!ad || !elapsed) return null;

  // Carte complète dès que le partenaire est présent — le cas normal depuis V39.
  if (partner) {
    return (
      <>
        <PartnerCard
          partner={partner}
          targetUrl={ad.targetUrl}
          onOpenProfile={() => setProfileOpen(true)}
          onToggleFavorite={toggleFavorite}
        />
        <PartnerProfileModal
          partnerId={partner.id}
          visible={profileOpen}
          onClose={() => setProfileOpen(false)}
          onToggleFavorite={toggleFavorite}
        />
      </>
    );
  }

  // Repli : réponse mise en cache par une version antérieure du client, sans partenaire.
  // On rend l'ancienne bannière plutôt que rien, pour ne pas perdre une campagne payée.
  return (
    <TouchableOpacity
      onPress={() => {
        if (ad.targetUrl) {
          void WebBrowser.openBrowserAsync(ad.targetUrl);
        }
      }}
      activeOpacity={0.85}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.line,
      }}
    >
      {ad.imageUrl && !imageFailed ? (
        <Image
          source={{ uri: ad.imageUrl }}
          style={{ width: '100%', height: 80 }}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontSize: 10,
            color: palette.inkSoft,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 2,
          }}
        >
          Partenaire Xalaat
        </Text>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontSize: 13,
            color: palette.txt,
            fontWeight: '500',
          }}
          numberOfLines={2}
        >
          {ad.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
