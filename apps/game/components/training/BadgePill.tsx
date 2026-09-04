import React from 'react';
import { View, Text } from 'react-native';
import type { TrainingBadge } from '~/types/training';
import { palette } from '~/lib/theme/tokens';

interface BadgePillProps {
  badge: TrainingBadge;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

interface BadgeConfig {
  label: string;
  color: string;
  bg: string;
  borderColor: string;
  icon: string;
}

const BADGE_CONFIGS: Record<TrainingBadge, BadgeConfig> = {
  DIAMOND: {
    label: 'Diamant',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    icon: '💎',
  },
  GOLD: {
    label: 'Or',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: '🥇',
  },
  SILVER: {
    label: 'Argent',
    color: '#CBD5E1',
    bg: 'rgba(203, 213, 225, 0.15)',
    borderColor: 'rgba(203, 213, 225, 0.3)',
    icon: '🥈',
  },
  BRONZE: {
    label: 'Bronze',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.15)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    icon: '🥉',
  },
  NONE: {
    label: 'Apprenti',
    color: palette.inkSoft,
    bg: palette.surface2,
    borderColor: palette.line,
    icon: '🌱',
  },
};

export function BadgePill({ badge, size = 'md', showLabel = true }: BadgePillProps) {
  const config = BADGE_CONFIGS[badge] || BADGE_CONFIGS.NONE;

  const padH = size === 'sm' ? 8 : size === 'lg' ? 14 : 10;
  const padV = size === 'sm' ? 3 : size === 'lg' ? 6 : 4;
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 14 : 12;
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: config.bg,
        borderWidth: 1,
        borderColor: config.borderColor,
        paddingHorizontal: padH,
        paddingVertical: padV,
        borderRadius: 9999,
      }}
    >
      <Text style={{ fontSize: iconSize }}>{config.icon}</Text>
      {showLabel && (
        <Text
          style={{
            fontSize,
            fontWeight: '800',
            color: config.color,
            letterSpacing: 0.3,
          }}
        >
          {config.label}
        </Text>
      )}
    </View>
  );
}
