import { View, Text } from 'react-native';
import { Calendar, BookOpen, GitBranch, Columns, List, Lightbulb } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import type { EssentialPointDTO } from '~/types/training';

const FORMAT_ICONS: Record<string, typeof Calendar> = {
  DATE: Calendar,
  DEFINITION: BookOpen,
  RELATION: GitBranch,
  COMPARISON: Columns,
  LIST: List,
  FACT: Lightbulb,
};

const FORMAT_COLORS: Record<string, string> = {
  DATE: '#F59E0B',
  DEFINITION: '#8B5CF6',
  RELATION: '#3B82F6',
  COMPARISON: '#10B981',
  LIST: '#EC4899',
  FACT: '#F97316',
};

interface NotionCardProps {
  point: EssentialPointDTO;
  index: number;
}

/**
 * Affichage condensé d'un point essentiel.
 * Format visuel adapté au type (date, définition, relation, etc.)
 * Principe : « Moins de texte. Plus de valeur. »
 */
export function NotionCard({ point, index }: NotionCardProps) {
  const format = point.format || 'FACT';
  const color = FORMAT_COLORS[format] || palette.primary;
  const IconComponent = FORMAT_ICONS[format] || Lightbulb;

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
        gap: 8,
        borderLeftWidth: 3,
        borderLeftColor: color,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            backgroundColor: color + '1A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={14} color={color} />
        </View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: color,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {format}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: palette.txt,
          lineHeight: 21,
        }}
      >
        {point.content}
      </Text>

      {point.detail ? (
        <Text
          style={{
            fontSize: 13,
            color: palette.inkSoft,
            lineHeight: 18,
          }}
        >
          {point.detail}
        </Text>
      ) : null}
    </View>
  );
}
