import { Stack } from 'expo-router';
import { palette } from '~/lib/theme/tokens';

export default function SoloLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  );
}
