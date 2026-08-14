import { TouchableOpacity, View, Text } from 'react-native';
import { palette } from '~/lib/theme/tokens';
import type { ReactNode } from 'react';

export function ToggleRow({
  icon,
  label,
  sub,
  checked,
  onChange,
  accentHex,
}: {
  icon: ReactNode;
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accentHex?: string;
}) {
  const color = accentHex ?? palette.primary;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 13,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color + '24',
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>{label}</Text>
          <Text style={{ color: palette.inkSoft, fontSize: 11, marginTop: 2 }}>{sub}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => onChange(!checked)}
        activeOpacity={0.8}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          backgroundColor: checked ? color : palette.surface2,
          justifyContent: 'center',
          padding: 4,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            alignSelf: checked ? 'flex-end' : 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </TouchableOpacity>
    </View>
  );
}
