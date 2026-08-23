import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Trophy,
  Dumbbell,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Flame,
  Zap,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import { useDashboardV2 } from '~/lib/query/hooks';
import { palette } from '~/lib/theme/tokens';

const POPULAR_THEMES = [
  { label: 'Mbalax 🎵', theme: 'Mbalax et Musique Sénégalaise' },
  { label: 'Histoire 🇸🇳', theme: 'Histoire du Sénégal' },
  { label: 'Football ⚽', theme: 'Football Africain et Mondial' },
  { label: 'Cinéma 🎬', theme: 'Cinéma et Séries' },
  { label: 'Géographie 🌍', theme: 'Géographie du Monde' },
  { label: 'Science 🧪', theme: 'Sciences et Découvertes' },
];

export default function SoloHubScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data } = useDashboardV2();
  const [aiPrompt, setAiPrompt] = useState('');

  const username = user?.username || 'Joueur';

  const handleAiPromptSubmit = () => {
    if (aiPrompt.trim()) {
      router.push(`/solo/career/new?theme=${encodeURIComponent(aiPrompt.trim())}` as any);
    } else {
      router.push('/solo/career/new' as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting & Header */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, color: palette.inkSoft, fontWeight: '600' }}>
            Mode Solo · Entraînement individuel
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: palette.txt, lineHeight: 34 }}>
            Prêt à relever{'\n'}le <Text style={{ color: palette.primary }}>défi</Text>, {username} ?
          </Text>
        </View>

        {/* AI Prompt Input Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            paddingHorizontal: 16,
            paddingVertical: 8,
            gap: 10,
          }}
        >
          <Sparkles size={18} color={palette.primary} />
          <TextInput
            value={aiPrompt}
            onChangeText={setAiPrompt}
            placeholder="Tape un sujet généré par IA…"
            placeholderTextColor={palette.inkSoft}
            onSubmitEditing={handleAiPromptSubmit}
            returnKeyType="go"
            style={{
              flex: 1,
              color: palette.txt,
              fontSize: 14,
              paddingVertical: 6,
            }}
          />
          <TouchableOpacity
            onPress={handleAiPromptSubmit}
            activeOpacity={0.8}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: palette.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowRight size={16} color={palette.primaryInk} />
          </TouchableOpacity>
        </View>

        {/* Main Game Modes */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
            Modes de jeu
          </Text>

          {/* Mode Carrière Card */}
          <TouchableOpacity
            onPress={() => router.push('/solo/career' as any)}
            activeOpacity={0.8}
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.gold + '40',
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: palette.gold + '26',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={26} color={palette.gold} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: palette.txt }}>
                  Mode Carrière
                </Text>
                <View
                  style={{
                    backgroundColor: palette.gold + '26',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ color: palette.gold, fontSize: 10, fontWeight: '800' }}>
                    12 NIVEAUX
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: palette.inkSoft, marginTop: 4, lineHeight: 16 }}>
                Progressez de Facile à Extrême avec bonus de réussite et déblocage de paliers.
              </Text>
            </View>

            <ChevronRight size={20} color={palette.inkSoft} />
          </TouchableOpacity>

          {/* Mode Entraînement Card */}
          <TouchableOpacity
            onPress={() => router.push('/solo/training' as any)}
            activeOpacity={0.8}
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.primary + '40',
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: palette.primary + '26',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Dumbbell size={26} color={palette.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: palette.txt }}>
                  Entraînement
                </Text>
                <View
                  style={{
                    backgroundColor: palette.primary + '26',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ color: palette.primary, fontSize: 10, fontWeight: '800' }}>
                    SETS LIBRES
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: palette.inkSoft, marginTop: 4, lineHeight: 16 }}>
                Plans d'entraînement générés sur mesure ou créés par la communauté.
              </Text>
            </View>

            <ChevronRight size={20} color={palette.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* Popular Themes Grid */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
            Thèmes recommandés
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {POPULAR_THEMES.map((themeItem, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() =>
                  router.push(`/solo/career/new?theme=${encodeURIComponent(themeItem.theme)}` as any)
                }
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor: palette.line,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
                  {themeItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
