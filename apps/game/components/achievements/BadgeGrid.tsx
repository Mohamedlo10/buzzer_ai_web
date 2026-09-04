/**
 * BadgeGrid
 *
 * Affiche le catalogue complet de badges (§20) :
 * - Débloqués : couleur pleine, date, nom.
 * - Verrouillés : grisés, description visible — ce qui donne envie de revenir.
 *
 * Le total achievementsTotal vient du serveur via le catalogue — jamais 8 en dur.
 */
import { View, Text } from 'react-native';
import type { AchievementResponse } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';
import { BadgeIcon } from './BadgeIcon';

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#cd7f32',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
  PLATINUM: '#00d4ff',
};

interface BadgeGridProps {
  badges: AchievementResponse[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  if (badges.length === 0) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {badges.map((badge) => (
        <BadgeCell key={badge.id} badge={badge} />
      ))}
    </View>
  );
}

function BadgeCell({ badge }: { badge: AchievementResponse }) {
  const tierColor = TIER_COLORS[badge.tier] ?? palette.inkSoft;
  const isLocked = !badge.unlocked;

  return (
    <View
      style={{
        width: '47%',
        backgroundColor: isLocked ? palette.bgDeep : palette.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isLocked ? palette.line : tierColor + '44',
        padding: 14,
        gap: 8,
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      {/* Icône */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: isLocked ? palette.surface : tierColor + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BadgeIcon
          icon={badge.icon}
          size={22}
          color={isLocked ? palette.inkSoft : tierColor}
        />
      </View>

      {/* Nom */}
      <Text
        style={{
          fontFamily: font.nativeFamily.ui,
          fontWeight: '700',
          fontSize: 13,
          color: isLocked ? palette.inkSoft : palette.txt,
          lineHeight: 18,
        }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>

      {/* Description */}
      <Text
        style={{
          fontFamily: font.nativeFamily.ui,
          fontSize: 11,
          color: palette.inkSoft,
          lineHeight: 15,
        }}
        numberOfLines={3}
      >
        {badge.description}
      </Text>

      {/* Date de déblocage ou état verrouillé */}
      {badge.unlocked && badge.unlockedAt ? (
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '600',
            fontSize: 10,
            color: tierColor,
            letterSpacing: 0.5,
          }}
        >
          {new Date(badge.unlockedAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
          })}
        </Text>
      ) : (
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '600',
            fontSize: 10,
            color: palette.inkSoft,
            letterSpacing: 0.3,
          }}
        >
          🔒 Non débloqué
        </Text>
      )}
    </View>
  );
}
