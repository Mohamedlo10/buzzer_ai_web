import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { alpha, palette, radius, withAlpha } from '~/lib/theme/tokens';

interface ComingSoonCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Fonctionnalité annoncée mais pas encore disponible (§18).
 *
 * <p>Délibérément **inerte** : ni `TouchableOpacity`, ni modale. Le §18 demande d'éviter les
 * grosses cartes qui consomment de l'espace pour une fonctionnalité indisponible, et une
 * carte cliquable qui ouvre une boîte « bientôt » est pire qu'une carte muette — elle promet
 * une action puis la refuse.
 *
 * <p>Compacte et discrète, à sa place en bas de l'accueil : le §34 veut que la Home mette en
 * avant le Défi du Jour, pas une liste de menus.
 */
export function ComingSoonCard({ icon: Icon, title, description }: ComingSoonCardProps) {
  const muted = withAlpha(palette.txt, alpha.txt40);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: radius.casino,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.line,
        // Atténuée : présente, mais visiblement au second plan.
        opacity: 0.72,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.card,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: withAlpha(palette.txt, alpha.lineSoft),
        }}
      >
        <Icon size={18} color={muted} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: palette.txt, fontSize: 14.5, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: muted, fontSize: 12.5, marginTop: 1 }} numberOfLines={1}>
          {description}
        </Text>
      </View>

      <Text
        style={{
          color: muted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: withAlpha(palette.txt, alpha.lineSoft),
        }}
      >
        Bientôt
      </Text>
    </View>
  );
}
