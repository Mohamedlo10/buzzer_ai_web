import { TouchableOpacity, View, Text } from 'react-native';
import { palette } from '~/lib/theme/tokens';
import type { ReactNode } from 'react';

export function ModeCard({
  icon,
  label,
  sublabel,
  active,
  accentHex,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  accentHex: string;
  onClick: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.75}
      style={{
        flex: 1,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: active ? accentHex : palette.line,
        backgroundColor: palette.surface,
        padding: 16,
        height: 130,
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? accentHex + '38' : palette.surface2,
        }}
      >
        {icon}
      </View>
      <View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: active ? accentHex : palette.txt }}>
          {label}
        </Text>
        <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }} numberOfLines={1}>
          {sublabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
