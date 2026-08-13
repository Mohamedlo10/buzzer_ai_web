import 'react-native';
import 'react-native-safe-area-context';

/**
 * Ajoute `className` aux composants que NativeWind stylise à l'exécution mais
 * qu'il n'augmente pas côté types.
 *
 * `nativewind/types` ne couvre que les composants de `react-native` qu'il
 * enveloppe lui-même. Deux de ceux qu'on utilise n'en font pas partie :
 * `KeyboardAvoidingView` (core, mais hors de sa liste) et le `SafeAreaView` de
 * `react-native-safe-area-context` (paquet tiers). Sans ces déclarations, `tsc`
 * refuse `className` alors que le style s'applique correctement à l'écran :
 * seul le contrat de types manquait.
 *
 * ── Pourquoi un fichier séparé ──
 * Les deux `import` en tête sont ce qui fait de ce fichier un MODULE. Dans un
 * `.d.ts` sans import (un script), `declare module 'react-native'` n'augmente
 * pas le module : il le REMPLACE. Placées dans `nativewind-env.d.ts`, ces mêmes
 * lignes faisaient disparaître `View`, `Text`, `ScrollView` et tout le reste.
 */
declare module 'react-native' {
  interface TouchableOpacityProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ViewProps {
    className?: string;
  }
  interface KeyboardAvoidingViewProps {
    className?: string;
  }
}

declare module 'react-native-safe-area-context' {
  interface NativeSafeAreaViewProps {
    className?: string;
  }
}
