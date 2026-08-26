import { View, Text } from 'react-native';
import { palette } from '~/lib/theme/tokens';

interface MasteryBarProps {
  score: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getColor(score: number): string {
  if (score >= 80) return palette.good;
  if (score >= 60) return palette.gold;
  if (score >= 40) return '#F97316';
  return palette.bad;
}

/**
 * Barre de maîtrise visuelle (0-100%) avec couleur progressive.
 */
export function MasteryBar({ score, label, size = 'md' }: MasteryBarProps) {
  const color = getColor(score);
  const height = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;

  return (
    <View style={{ gap: 4 }}>
      {label && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: palette.inkSoft }}>
            {label}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '800', color }}>
            {Math.round(score)}%
          </Text>
        </View>
      )}
      <View
        style={{
          height,
          backgroundColor: palette.surface2,
          borderRadius: 9999,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, score))}%`,
            backgroundColor: color,
            borderRadius: 9999,
          }}
        />
      </View>
    </View>
  );
}
