import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Boldonse_400Regular } from '@expo-google-fonts/boldonse';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';

import { font, palette } from '~/lib/theme/tokens';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Les clés viennent de `palette.font.nativeFamily`, que lit aussi
  // `tailwind.config.js` pour résoudre `font-display` / `font-ui` / `font-serif`.
  // Écrites en dur des deux côtés, elles finiraient par diverger — et le
  // symptôme serait une police silencieusement remplacée par celle du système,
  // sans la moindre erreur.
  const [loaded, error] = useFonts({
    [font.nativeFamily.display]: Boldonse_400Regular,
    [font.nativeFamily.ui]: Manrope_400Regular,
    [font.nativeFamily.serif]: InstrumentSerif_400Regular_Italic,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
    ManropeBold: Manrope_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  );
}
