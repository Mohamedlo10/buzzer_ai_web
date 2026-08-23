import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trophy, Dumbbell, Sparkles, ArrowRight, Zap, Target } from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import { useDashboardV2 } from '~/lib/query/hooks';
import * as rankingsApi from '~/lib/api/rankings';
import type { GlobalRanking } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { GlobalRankCard } from '~/components/shared/GlobalRankCard';
import { QuizOfTheDayCard } from '~/components/shared/QuizOfTheDayCard';
import { PatternZigzag } from '~/components/shared/PatternZigzag';

const THEME_CHIPS = [
  { label: 'Mbalax', theme: 'Mbalax', active: true },
  { label: 'Carrière 🏆', route: '/solo/career' },
  { label: 'Entraînement 🎯', route: '/solo/training' },
  { label: 'Multijoueur 👥', route: '/(tabs)/rooms' },
  { label: 'Cinéma 🎬', theme: 'Cinema' },
  { label: 'Histoire 🇸🇳', theme: 'Histoire du Senegal' },
  { label: 'Géographie 🌍', theme: 'Geographie' },
  { label: 'Sport ⚽', theme: 'Football et Sport' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useDashboardV2();

  const [aiPrompt, setAiPrompt] = useState('');
  const [topRankings, setTopRankings] = useState<GlobalRanking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        rankingsApi.getGlobalRankings({ page: 0, size: 3 }).then((res) => {
          if (res?.content) setTopRankings(res.content);
        }),
      ]);
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;
    rankingsApi
      .getGlobalRankings({ page: 0, size: 3 })
      .then((res) => {
        if (isMounted && res?.content) {
          setTopRankings(res.content);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const username = user?.username || 'Momo';
  const dayName = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
  const rank = data?.globalStats?.rank || 154;

  const handleAiPromptSubmit = () => {
    if (aiPrompt.trim()) {
      router.push(`/solo/career/new?theme=${encodeURIComponent(aiPrompt.trim())}` as any);
    } else {
      router.push('/solo/career/new' as any);
    }
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14, marginTop: 12, fontWeight: '600' }}>
          Chargement de l&apos;accueil…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 110, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {/* Header Greeting */}
        <View style={{ marginVertical: 6 }}>
          <Text style={{ fontSize: 13, color: palette.inkSoft, marginBottom: 4 }}>
            Salaam, {username}{' '}
            <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic' }}>·</Text>{' '}
            {dayName}
          </Text>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 32,
              lineHeight: 34,
              letterSpacing: -0.5,
              color: palette.txt,
            }}
          >
            Que veux-tu{'\n'}
            <Text style={{ color: palette.primary }}>deviner</Text> aujourd&apos;hui ?
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
            paddingHorizontal: 14,
            paddingVertical: 8,
            gap: 10,
            shadowColor: '#000',
            shadowOpacity: 0.03,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 18 }}>✨</Text>
          <TextInput
            value={aiPrompt}
            onChangeText={setAiPrompt}
            placeholder="Tape un sujet…"
            placeholderTextColor={palette.inkSoft}
            onSubmitEditing={handleAiPromptSubmit}
            returnKeyType="search"
            style={{
              flex: 1,
              fontSize: 14,
              color: palette.txt,
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

        {/* Shortcut Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {THEME_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              onPress={() => {
                if (chip.route) {
                  router.push(chip.route as any);
                } else if (chip.theme) {
                  router.push(`/solo/career/new?theme=${encodeURIComponent(chip.theme)}` as any);
                }
              }}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 9999,
                backgroundColor: chip.active ? palette.primary : palette.surface,
                borderWidth: chip.active ? 0 : 1,
                borderColor: palette.line,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: chip.active ? palette.primaryInk : palette.txt,
                }}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Global Rank Card */}
        <GlobalRankCard rank={rank} />

        {/* Quiz of the Day */}
        <QuizOfTheDayCard />

        {/* Solo Modes Cards (Carrière & Entraînement) */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Mode Carrière */}
          <TouchableOpacity
            onPress={() => router.push('/solo/career' as any)}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 18,
              minHeight: 130,
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(232, 166, 48, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={18} color={palette.gold} />
            </View>
            <View>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt }}>
                Carrière
              </Text>
              <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>
                Progresse niveau par niveau
              </Text>
            </View>
          </TouchableOpacity>

          {/* Entraînement Libre */}
          <TouchableOpacity
            onPress={() => router.push('/solo/training' as any)}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 18,
              minHeight: 130,
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(78, 140, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Target size={18} color={palette.indigo} />
            </View>
            <View>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt }}>
                Entraînement
              </Text>
              <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>
                Thèmes personnalisés
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Top 3 Rankings Preview */}
        {topRankings.length > 0 && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 18,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt }}>
                Top de la semaine
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/rankings')} activeOpacity={0.7}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: palette.primary }}>
                  Classement complet →
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              {topRankings.map((r, i) => (
                <View
                  key={r.userId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderBottomWidth: i < topRankings.length - 1 ? 1 : 0,
                    borderBottomColor: palette.line,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text
                      style={{
                        fontFamily: font.nativeFamily.display,
                        fontSize: 15,
                        color: i === 0 ? palette.gold : palette.inkSoft,
                        width: 24,
                      }}
                    >
                      #{i + 1}
                    </Text>
                    <Avatar name={r.username} size={32} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
                      {r.username}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 14, color: palette.txt }}>
                    {r.totalScore.toLocaleString('fr-FR')} pts
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
