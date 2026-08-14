import { TouchableOpacity, View, Text } from 'react-native';
import { palette } from '~/lib/theme/tokens';

export function StepperField({
  label,
  value,
  suffix = '',
  min,
  max,
  step = 1,
  onChange,
  accentHex,
}: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
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
        minHeight: 92,
        justifyContent: 'space-between',
      }}
    >
      <Text
        style={{
          color: palette.inkSoft,
          fontSize: 9.5,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: palette.surface2,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: value <= min ? 0.38 : 1,
          }}
        >
          <Text style={{ color: palette.txt, fontSize: 18, fontWeight: '700' }}>−</Text>
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: '700',
            color,
            fontVariant: ['tabular-nums'],
          }}
        >
          {value}{suffix}
        </Text>

        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: palette.surface2,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: value >= max ? 0.38 : 1,
          }}
        >
          <Text style={{ color: palette.txt, fontSize: 18, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
