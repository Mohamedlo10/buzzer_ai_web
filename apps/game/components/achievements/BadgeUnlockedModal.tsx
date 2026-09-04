/**
 * BadgeUnlockedModal (§23)
 *
 * Affiche les badges débloqués en file FIFO — un à la fois.
 * Si le joueur débloque 3 badges en un défi, ils s'affichent l'un après l'autre.
 *
 * Sources d'alimentation :
 * 1. result.tsx : result.unlockedAchievements (réponse immédiate du serveur).
 * 2. profile.tsx : getUnseen() au montage (rattrapage si appli fermée entre les deux).
 *
 * À la fermeture du dernier badge, onClose(ids) est appelé avec tous les
 * userAchievementId vus, pour que le composant parent appelle markSeen.
 *
 * Animation : fade simple — courte et utile, pas d'effets excessifs (§23).
 */
import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import type { AchievementResponse } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';
import { BadgeIcon } from './BadgeIcon';

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#cd7f32',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
  PLATINUM: '#00d4ff',
};

interface Props {
  badges: AchievementResponse[];
  /** Appelé quand tous les badges ont été vus. ids = userAchievementId[]. */
  onClose: (ids: string[]) => void;
}

export function BadgeUnlockedModal({ badges, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  if (badges.length === 0) return null;

  const current = badges[index];
  if (!current) return null;

  const tierColor = TIER_COLORS[current.tier] ?? palette.primary;
  // Les identifiants sont collectés à la fermeture du dernier badge, pas au fil de la
  // file : si l'application est fermée en cours de route, getUnseen() rattrape le reste.

  function handleNext() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      if (index + 1 >= badges.length) {
        // Tous vus
        onClose(
          badges.map((b) => b.userAchievementId).filter((id): id is string => !!id),
        );
      } else {
        setIndex((i) => i + 1);
        fadeAnim.setValue(1);
      }
    });
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleNext}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
        }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            backgroundColor: palette.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: tierColor + '55',
            padding: 28,
            alignItems: 'center',
            gap: 12,
            maxWidth: 340,
            width: '100%',
          }}
        >
          {/* Pastille badge */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: tierColor + '22',
              borderWidth: 2,
              borderColor: tierColor + '66',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BadgeIcon icon={current.icon} size={34} color={tierColor} />
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '700',
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: tierColor,
              marginTop: 4,
            }}
          >
            Badge débloqué !
          </Text>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 22,
              color: palette.txt,
              textAlign: 'center',
              lineHeight: 28,
              paddingTop: 2,
            }}
          >
            {current.name}
          </Text>

          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontSize: 14,
              color: palette.inkSoft,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            {current.description}
          </Text>

          {/* Indicateur de file si plusieurs badges */}
          {badges.length > 1 && (
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontSize: 11,
                color: palette.inkSoft,
              }}
            >
              {index + 1} / {badges.length}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{
              backgroundColor: tierColor,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 32,
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontWeight: '800',
                fontSize: 14,
                color: '#FFFFFF',
              }}
            >
              {index + 1 < badges.length ? 'Suivant' : 'Super !'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Re-export type for consumers
export type { Props as BadgeUnlockedModalProps };
