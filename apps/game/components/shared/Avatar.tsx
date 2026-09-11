import React, { useMemo, useState } from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { SvgUri, SvgXml } from 'react-native-svg';
import { isValidSpec, renderAvatarSvg } from '@xalaat/avatar';
import { palette } from '~/lib/theme/tokens';

/**
 * L'avatar d'un joueur, partout dans l'application.
 *
 * <h2>Trois rendus, dans cet ordre</h2>
 * 1. `avatarSpec` — l'avatar est **dessiné localement**. Aucune requête réseau, donc aucun temps
 *    de chargement : un classement de cent lignes ne coûte plus cent appels HTTP à un service
 *    tiers, et l'aperçu du créateur répond au doigt.
 * 2. `avatarUrl` — repli pour tout ce qui n'a pas encore de spec.
 * 3. Les initiales — dernier recours, quand il n'y a rien ou que le chargement a échoué.
 *
 * Le composant est le point de passage unique des vingt-trois endroits qui affichent un avatar :
 * profil, lobby, classements, parties, résultats, notifications. C'est ce qui permet à la bascule
 * de se faire ici et nulle part ailleurs.
 */

/**
 * Mémoire des SVG déjà composés, partagée par toutes les instances.
 *
 * Un même joueur apparaît souvent plusieurs fois à l'écran — la liste, le podium, la modale de
 * détail — et chaque re-rendu de liste relancerait sinon la composition. Le plafond évite qu'une
 * session longue accumule indéfiniment des avatars croisés une seule fois.
 */
const RENDER_CACHE = new Map<string, string | null>();
const RENDER_CACHE_MAX = 256;

function renderCached(spec: string): string | null {
  const hit = RENDER_CACHE.get(spec);
  if (hit !== undefined) return hit;

  let svg: string | null = null;
  try {
    if (isValidSpec(spec)) svg = renderAvatarSvg(spec);
  } catch {
    // Spec produite par un catalogue plus récent que celui embarqué : on retombe sur l'URL
    // servie par le backend, qui fait toujours autorité.
    svg = null;
  }

  if (RENDER_CACHE.size >= RENDER_CACHE_MAX) {
    const oldest = RENDER_CACHE.keys().next().value;
    if (oldest !== undefined) RENDER_CACHE.delete(oldest);
  }
  RENDER_CACHE.set(spec, svg);
  return svg;
}

interface AvatarProps {
  name: string;
  avatarSpec?: string | null;
  avatarUrl?: string | null;
  hue?: number;
  size?: number;
  ring?: string;
}

export function Avatar({
  name,
  avatarSpec,
  avatarUrl,
  hue,
  size = 36,
  ring,
}: AvatarProps) {
  const [loadError, setLoadError] = useState(false);

  const initials = name
    ? name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const svg = useMemo(() => (avatarSpec ? renderCached(avatarSpec) : null), [avatarSpec]);

  const isSvgUrl = avatarUrl && (avatarUrl.includes('.svg') || avatarUrl.includes('/api/avatars/'));

  const bg = hue !== undefined ? `hsl(${hue}, 50%, 75%)` : palette.surface2;
  const ink = hue !== undefined ? `hsl(${hue}, 60%, 25%)` : palette.txt;

  const frame = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: palette.surface2,
    borderWidth: ring ? 2 : 0,
    borderColor: ring || 'transparent',
  };

  if (svg) {
    return (
      <View style={frame}>
        {Platform.OS === 'web' ? (
          // react-native-svg sait rendre sur le web, mais une data-URI passe par le pipeline
          // d'images du navigateur : mise en cache et décodage hors du fil principal.
          <Image
            source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        ) : (
          <SvgXml xml={svg} width={size} height={size} />
        )}
      </View>
    );
  }

  if (avatarUrl && !loadError) {
    return (
      <View style={frame}>
        {Platform.OS === 'web' ? (
          <Image
            source={{ uri: avatarUrl }}
            onError={() => setLoadError(true)}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : isSvgUrl ? (
          <SvgUri
            uri={avatarUrl}
            width={size}
            height={size}
            onError={() => setLoadError(true)}
          />
        ) : (
          <Image
            source={{ uri: avatarUrl }}
            onError={() => setLoadError(true)}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderWidth: ring ? 2 : 0,
        borderColor: ring || 'transparent',
      }}
    >
      <Text
        style={{
          color: ink,
          fontWeight: '700',
          fontSize: size * 0.38,
          letterSpacing: 0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
