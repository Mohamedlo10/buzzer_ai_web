import { View, Text } from 'react-native';
import { palette } from '~/lib/theme/tokens';
import type { ReactNode } from 'react';

export interface SummaryRow {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconColor: string;
  valueColor: string;
}

export function SummaryTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.line,
        overflow: 'hidden',
      }}
    >
      {rows.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: i < rows.length - 1 ? 1 : 0,
            borderBottomColor: palette.line,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.surface2,
            }}
          >
            {row.icon}
          </View>
          <Text style={{ fontSize: 13, color: palette.inkSoft, flex: 1 }}>{row.label}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: row.valueColor }}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
