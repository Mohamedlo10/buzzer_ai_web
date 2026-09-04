import React, { useEffect, useState } from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { palette, font } from '~/lib/theme/tokens';
import { fetchAd } from '~/lib/api/ads';
import type { AdData, AdPlacement } from '~/lib/api/ads';

interface AdSlotProps {
  placement: AdPlacement;
}

/**
 * Emplacement publicitaire.
 *
 * Règles absolues :
 * - Retourne **null** si aucune pub disponible. Jamais une <View> vide.
 * - Ne doit JAMAIS apparaître dans :
 *   - solo/game/[sessionId].tsx
 *   - session/[code]/game.tsx
 * - L'utilisateur doit effectuer une action explicite pour ouvrir targetUrl.
 *   Aucune redirection automatique.
 * - Tant que ads.enabled=false côté backend, ce composant sera toujours null.
 */
export function AdSlot({ placement }: AdSlotProps) {
  const [ad, setAd] = useState<AdData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAd(placement).then(response => {
      if (!cancelled && response.enabled && response.ad) {
        setAd(response.ad);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  // Règle absolue : null, jamais <View />.
  if (!ad) return null;

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(ad.targetUrl)}
      activeOpacity={0.85}
      style={{
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 10,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.line,
        overflow: 'hidden',
      }}
      accessibilityRole="link"
      accessibilityLabel={`Partenaire Xalaat — ${ad.title}`}
    >
      {ad.imageUrl ? (
        <Image
          source={{ uri: ad.imageUrl }}
          style={{ width: '100%', height: 80, resizeMode: 'cover' }}
          accessibilityElementsHidden
        />
      ) : null}
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text
          style={{
            fontFamily: font.nativeFamily,
            fontSize: 10,
            color: palette.inkSoft,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 2,
          }}
        >
          PARTENAIRE XALAAT
        </Text>
        <Text
          style={{
            fontFamily: font.nativeFamily,
            fontSize: 13,
            color: palette.txt,
            fontWeight: '500',
          }}
          numberOfLines={2}
        >
          {ad.title}
        </Text>
        <Text
          style={{
            fontFamily: font.nativeFamily,
            fontSize: 11,
            color: palette.goldBright,
            marginTop: 4,
          }}
        >
          Découvrir →
        </Text>
      </View>
    </TouchableOpacity>
  );
}
