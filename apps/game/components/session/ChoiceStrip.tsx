import { TouchableOpacity, View, Text, ScrollView } from 'react-native';
import { palette } from '~/lib/theme/tokens';

export function ChoiceStrip({
  label,
  value,
  options,
  onChange,
  accentHex,
}: {
  label: string;
  value: number | null;
  options: { label: string; value: number | null }[];
  onChange: (val: number | null) => void;
  accentHex?: string;
}) {
  const color = accentHex ?? palette.primary;
  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
      }}
    >
      <Text
        style={{
          color: palette.inkSoft,
          fontSize: 9.5,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map((opt, i) => {
          const isActive = value === opt.value;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isActive ? color : palette.line,
                backgroundColor: isActive ? color + '28' : palette.surface,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isActive ? color : palette.inkSoft,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
