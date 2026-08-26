import { View, Text } from 'react-native';
import { palette, font } from '~/lib/theme/tokens';

interface SoloGreetingProps {
  username: string;
}

export function SoloGreeting({ username }: SoloGreetingProps) {
  const dayName = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });

  return (
    <View style={{ gap: 6, marginVertical: 2 }}>
      {/* Date & Username */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 13, color: palette.inkSoft, fontWeight: '600' }}>
          Salaam, {username}
        </Text>
        <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft }}>
          ·
        </Text>
        <Text style={{ fontSize: 13, color: palette.inkSoft, textTransform: 'capitalize' }}>
          {dayName}
        </Text>
      </View>

      {/* Main Punchy Question */}
      <Text
        style={{
          fontFamily: font.nativeFamily.display,
          fontSize: 34,
          lineHeight: 48,
          letterSpacing: -0.5,
          color: palette.txt,
          paddingTop: 6,
        }}
      >
        Que veux-tu{'\n'}
        <Text style={{ color: palette.primary }}>deviner</Text> aujourd&apos;hui ?
      </Text>
    </View>
  );
}
