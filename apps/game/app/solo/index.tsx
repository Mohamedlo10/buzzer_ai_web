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
  ArrowLeft,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Zap,
  BookOpen,
  Brain,
  Flame,
  Globe,
  Film,
  Atom,
  Landmark,
  Music,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import { palette, font } from '~/lib/theme/tokens';

const POPULAR_THEMES = [
  { label: 'Histoire du Sénégal 🇸🇳', theme: 'Histoire du Sénégal', icon: Landmark },
  { label: 'Cinéma & Séries 🎬', theme: 'Cinéma et Séries', icon: Film },
  { label: 'Géographie 🌍', theme: 'Géographie du Monde', icon: Globe },
  { label: 'Sciences & Nature 🧪', theme: 'Sciences et Découvertes', icon: Atom },
  { label: 'Musique & Culture 🎵', theme: 'Musique et Culture', icon: Music },
];

export default function SoloHubScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [aiPrompt, setAiPrompt] = useState('');

  const username = user?.username || 'Joueur';

  const handleAiPromptSubmit = () => {
    const trimmed = aiPrompt.trim();
    if (trimmed) {
      router.push(`/solo/career/new?theme=${encodeURIComponent(trimmed)}` as any);
    } else {
      router.push('/solo/career/new' as any);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* ── Top Bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 18,
              color: palette.txt,
            }}
          >
            Mode Solo
          </Text>
          <Text style={{ fontSize: 11, color: palette.inkSoft }}>
            Progression & Entraînement individuel
          </Text>
        </View>

        <View
          style={{
            backgroundColor: palette.primary + '18',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 9999,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: palette.primary }}>
            1 JOUEUR
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Greeting ── */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, color: palette.inkSoft, fontWeight: '600' }}>
            Bienvenue dans l'arène solo
          </Text>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 26,
              color: palette.txt,
              lineHeight: 32,
            }}
          >
            Prêt à défier l'IA,{'\n'}
            <Text style={{ color: palette.primary }}>{username}</Text> ?
          </Text>
        </View>

        {/* ── AI Prompt Bar ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            paddingHorizontal: 14,
            paddingVertical: 8,
            gap: 10,
            shadowColor: '#000',
            shadowOpacity: 0.03,
            shadowRadius: 6,
            elevation: 1,
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

        {/* ── Game Modes Section ── */}
        <View style={{ gap: 14 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: palette.inkSoft,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              paddingHorizontal: 4,
            }}
          >
            Modes de jeu
          </Text>

          {/* 1. Mode Carrière Card */}
          <TouchableOpacity
            onPress={() => router.push('/solo/career' as any)}
            activeOpacity={0.88}
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: palette.gold + '40',
              padding: 20,
              gap: 14,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 18,
                  backgroundColor: palette.gold + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trophy size={26} color={palette.gold} />
              </View>

              <View
                style={{
                  backgroundColor: palette.gold + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ color: palette.gold, fontSize: 11, fontWeight: '800' }}>
                  12 NIVEAUX · PROGRESSION
                </Text>
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 20, color: palette.txt }}>
                Mode Carrière
              </Text>
              <Text style={{ fontSize: 13, color: palette.inkSoft, lineHeight: 18 }}>
                Progressez du niveau 1 (Facile) au niveau 12 (Extrême) avec bonus de réussite, seuils de qualification et trophées.
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: palette.line,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color={palette.gold} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: palette.inkSoft }}>
                  Déblocage palier par palier
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: palette.gold }}>
                  Mes Carrières
                </Text>
                <ChevronRight size={16} color={palette.gold} />
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. Mode Entraînement Card */}
          <TouchableOpacity
            onPress={() => router.push('/solo/training' as any)}
            activeOpacity={0.88}
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: palette.primary + '40',
              padding: 20,
              gap: 14,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 18,
                  backgroundColor: palette.primary + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Brain size={26} color={palette.primary} />
              </View>

              <View
                style={{
                  backgroundColor: palette.primary + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ color: palette.primary, fontSize: 11, fontWeight: '800' }}>
                  APPRENDRE · TESTER · REMÉDIER
                </Text>
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 20, color: palette.txt }}>
                Entraînement Interactif
              </Text>
              <Text style={{ fontSize: 13, color: palette.inkSoft, lineHeight: 18 }}>
                Fiches de notions synthétiques, micro-défis immédiats (QCM, Vrai/Faux, Associations), détection de faiblesses et Boss final.
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: palette.line,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Target size={14} color={palette.primary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: palette.inkSoft }}>
                  Hub d'apprentissage & Sujets
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: palette.primary }}>
                  S'entraîner
                </Text>
                <ChevronRight size={16} color={palette.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Popular Themes ── */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: palette.inkSoft,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              paddingHorizontal: 4,
            }}
          >
            Thèmes populaires
          </Text>

          <View style={{ gap: 8 }}>
            {POPULAR_THEMES.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() =>
                    router.push(`/solo/career/new?theme=${encodeURIComponent(item.theme)}` as any)
                  }
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: palette.line,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <IconComp size={16} color={palette.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
                      {item.label}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={palette.inkSoft} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
