import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { palette, alpha, withAlpha, font } from '~/lib/theme/palette';

// Table matching Tailwind class name -> palette property
const COLOR_PAIRS: Array<{ name: string; twClass: string; hex: string }> = [
  { name: 'bg', twClass: 'bg-bg', hex: palette.bg },
  { name: 'bg-deep', twClass: 'bg-bg-deep', hex: palette.bgDeep },
  { name: 'surface', twClass: 'bg-surface', hex: palette.surface },
  { name: 'surface-2', twClass: 'bg-surface-2', hex: palette.surface2 },
  { name: 'line', twClass: 'bg-line', hex: palette.line },
  { name: 'txt', twClass: 'bg-txt', hex: palette.txt },
  { name: 'ink-soft', twClass: 'bg-ink-soft', hex: palette.inkSoft },
  { name: 'primary', twClass: 'bg-primary', hex: palette.primary },
  { name: 'primary-d', twClass: 'bg-primary-d', hex: palette.primaryD },
  { name: 'primary-ink', twClass: 'bg-primary-ink', hex: palette.primaryInk },
  { name: 'gold', twClass: 'bg-gold', hex: palette.gold },
  { name: 'gold-bright', twClass: 'bg-gold-bright', hex: palette.goldBright },
  { name: 'indigo', twClass: 'bg-indigo', hex: palette.indigo },
  { name: 'good', twClass: 'bg-good', hex: palette.good },
  { name: 'bad', twClass: 'bg-bad', hex: palette.bad },
  { name: 'bad-h', twClass: 'bg-buzz-h', hex: palette.badH },
  { name: 'violet', twClass: 'bg-host', hex: palette.violet },
  { name: 'warn', twClass: 'bg-warn', hex: palette.warn },
  { name: 'silver', twClass: 'bg-silver', hex: palette.silver },
  { name: 'bronze', twClass: 'bg-bronze', hex: palette.bronze },
];

const OPACITY_PAIRS: Array<{ name: string; twClass: string; value: string }> = [
  { name: 'txt-60', twClass: 'bg-txt-60', value: withAlpha(palette.txt, alpha.txt60) },
  { name: 'txt-40', twClass: 'bg-txt-40', value: withAlpha(palette.txt, alpha.txt40) },
  { name: 'txt-25', twClass: 'bg-txt-25', value: withAlpha(palette.txt, alpha.txt25) },
  { name: 'scrim', twClass: 'bg-scrim', value: withAlpha(palette.txt, alpha.scrim) },
];

export default function TokensDevScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-line bg-bg">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface items-center justify-center mr-3"
        >
          <ArrowLeft size={20} color="#B8462A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-txt font-bold text-lg">Banc d&apos;essai des tokens</Text>
          <Text className="text-txt-60 text-xs font-medium">
            Non-régression visuelle (Tailwind vs Palette hex)
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Banner */}
        <View className="bg-surface rounded-2xl p-4 mb-6 border border-line flex-row items-start">
          <CheckCircle2 size={24} color="#2D8559" style={{ marginRight: 12, marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-txt font-bold text-sm mb-1">
              Validation des pastilles sans couture
            </Text>
            <Text className="text-txt-60 text-xs leading-5">
              Chaque pastille est coupée en deux : classe Tailwind à gauche, couleur inline de la palette à droite. Une couture verticale signale une divergence entre le preset et palette.js.
            </Text>
          </View>
        </View>

        {/* Section 1: Palette Colors */}
        <Text className="text-txt font-bold text-base mb-3 uppercase tracking-wider">
          1. Palette de 20 couleurs (sans couture)
        </Text>
        <View className="flex-row flex-wrap justify-between mb-6">
          {COLOR_PAIRS.map((pair) => (
            <View key={pair.name} className="w-[48%] mb-3 bg-surface rounded-xl p-2.5 border border-line">
              <View className="h-10 rounded-lg flex-row overflow-hidden mb-2 border border-black/10">
                {/* Left half: Tailwind class */}
                <View className={`flex-1 h-full ${pair.twClass}`} />
                {/* Right half: Inline palette hex */}
                <View className="flex-1 h-full" style={{ backgroundColor: pair.hex }} />
              </View>
              <Text className="text-txt font-bold text-xs">{pair.name}</Text>
              <Text className="text-txt-40 text-[10px] font-mono">{pair.hex}</Text>
            </View>
          ))}
        </View>

        {/* Section 2: Opacity & Ink Derivatives */}
        <Text className="text-txt font-bold text-base mb-3 uppercase tracking-wider">
          2. Encres &amp; Opacités dérivées
        </Text>
        <View className="flex-row flex-wrap justify-between mb-6">
          {OPACITY_PAIRS.map((pair) => (
            <View key={pair.name} className="w-[48%] mb-3 bg-surface rounded-xl p-2.5 border border-line">
              <View className="h-10 rounded-lg flex-row overflow-hidden mb-2 border border-black/10">
                <View className={`flex-1 h-full ${pair.twClass}`} />
                <View className="flex-1 h-full" style={{ backgroundColor: pair.value }} />
              </View>
              <Text className="text-txt font-bold text-xs">{pair.name}</Text>
              <Text className="text-txt-40 text-[10px] font-mono">{pair.value}</Text>
            </View>
          ))}
        </View>

        {/*
          Le point de rupture NativeWind, exercé explicitement.

          Les modificateurs d'opacité (`bg-primary/60`) sont ce que l'ancien
          mécanisme de tokens cassait EN SILENCE : quand une couleur Tailwind
          valait `rgb(var(--x-rgb) / <alpha-value>)`, le moteur ne pouvait pas y
          injecter l'alpha et n'émettait tout simplement pas l'utilitaire. Sur le
          web, cela avait déjà supprimé le fond des 7 scrims de modale sans que
          personne ne le remarque.

          Les classes sont écrites EN LITTÉRAL — le scanner ne résout pas les
          gabarits. Chaque bloc superpose la classe (gauche) et la valeur
          calculée en JS (droite) : une couture verticale signale une divergence.
        */}
        <Text className="text-txt font-bold text-base mb-3 uppercase tracking-wider">
          2b. Modificateurs d&apos;opacité
        </Text>
        <View className="bg-surface rounded-2xl p-3 border border-line mb-6">
          {[
            { label: '100 %', a: 1, cls: 'bg-primary' },
            { label: '60 %', a: 0.6, cls: 'bg-primary/60' },
            { label: '40 %', a: 0.4, cls: 'bg-primary/40' },
            { label: '25 %', a: 0.25, cls: 'bg-primary/25' },
            { label: '10 %', a: 0.1, cls: 'bg-primary/10' },
          ].map((step) => (
            <View key={step.label} className="mb-2">
              <View className="h-8 rounded-lg flex-row overflow-hidden border border-black/10">
                <View className={`flex-1 h-full ${step.cls}`} />
                <View
                  className="flex-1 h-full"
                  style={{ backgroundColor: withAlpha(palette.primary, step.a) }}
                />
              </View>
              <Text className="text-txt-40 text-[10px] font-mono mt-0.5">
                {step.cls} · {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Section 3: Typography Specimens */}
        <Text className="text-txt font-bold text-base mb-3 uppercase tracking-wider">
          3. Typographie (3 familles)
        </Text>
        {/*
          Chaque famille est rendue DEUX FOIS : par la classe Tailwind
          (`font-display`…), puis par `fontFamily` inline. Les deux doivent
          donner exactement le même dessin de lettre.

          C'est le pendant typographique de la couture verticale des couleurs, et
          il couvre un défaut réel : le preset partagé portait
          `fontFamily: var(--font-display)`, hérité du web. Les variables CSS
          n'existent pas en React Native — la valeur y est ignorée SANS ERREUR et
          la classe retombe sur la police système. Si les deux lignes d'un même
          bloc n'ont pas la même allure, la résolution par classe est cassée.
        */}
        <View className="bg-surface rounded-2xl p-4 border border-line">
          <View className="mb-4">
            <Text className="text-txt-40 text-[10px] font-bold uppercase mb-1">
              Display — {font.nativeFamily.display} · classe puis inline
            </Text>
            <Text className="text-txt text-2xl font-display">Xalaat Quiz 123</Text>
            <Text className="text-txt text-2xl" style={{ fontFamily: font.nativeFamily.display }}>
              Xalaat Quiz 123
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-txt-40 text-[10px] font-bold uppercase mb-1">
              UI — {font.nativeFamily.ui} · classe puis inline
            </Text>
            <Text className="text-txt text-base font-ui">
              Question 1/10 — Quel est le plus grand océan ?
            </Text>
            <Text className="text-txt text-base" style={{ fontFamily: font.nativeFamily.ui }}>
              Question 1/10 — Quel est le plus grand océan ?
            </Text>
          </View>

          <View>
            <Text className="text-txt-40 text-[10px] font-bold uppercase mb-1">
              Accent — {font.nativeFamily.serif} · classe puis inline
            </Text>
            <Text className="text-primary text-xl font-serif">Quiz by MouhaDev</Text>
            <Text className="text-primary text-xl" style={{ fontFamily: font.nativeFamily.serif }}>
              Quiz by MouhaDev
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
