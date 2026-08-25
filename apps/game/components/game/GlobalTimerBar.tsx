import { View, Text } from 'react-native';
import { palette, font } from '~/lib/theme/tokens';

interface GlobalTimerBarProps {
  totalSeconds: number;
  remainingSeconds: number;
  paused?: boolean;
}

export function GlobalTimerBar({ totalSeconds, remainingSeconds, paused = false }: GlobalTimerBarProps) {
  const pct = totalSeconds > 0 ? Math.min(100, Math.round((remainingSeconds / totalSeconds) * 100)) : 0;
  const barColor = pct > 60 ? palette.primary : pct > 30 ? palette.warn : palette.bad;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 4 }}>
      <View style={{ flex: 1, height: 6, backgroundColor: palette.surface2, borderRadius: 9999, overflow: 'hidden' }}>
        <View
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: barColor,
            borderRadius: 9999,
            opacity: paused ? 0.5 : 1,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: font.nativeFamily.display,
          fontSize: 13,
          width: 32,
          textAlign: 'right',
          color: barColor,
          opacity: paused ? 0.5 : 1,
          fontVariant: ['tabular-nums'],
          paddingTop: 2,
        }}
      >
        {remainingSeconds}
      </Text>
      {paused && (
        <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>⏸</Text>
      )}
    </View>
  );
}
