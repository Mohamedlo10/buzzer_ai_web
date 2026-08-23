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
import {
  Trophy,
  Dumbbell,
  Sparkles,
  ArrowRight,
  Zap,
  Users,
  Gamepad2,
  TrendingUp,
  Award,
  Crown,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import { useDashboardV2 } from '~/lib/query/hooks';
import * as rankingsApi from '~/lib/api/rankings';
import type { GlobalRanking } from '~/types/api';
import { palette } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { FadeInUpView } from '~/components/anim';

const THEME_CHIPS = [
  { label: 'Mbalax', theme: 'Mbalax' },
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

  const username = user?.username || 'Joueur';
  const dayName = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  const handleAiPromptSubmit = () => {
    if (aiPrompt.trim()) {
      router.push(`/solo/career/new?theme=${encodeURIComponent(aiPrompt.trim())}` as any);
    } else {
      router.push('/solo/career/new' as any);
    }
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement du dashboard…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 18 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {/* Header Greeting */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, color: palette.inkSoft, fontWeight: '600' }}>
            Salaam, {username} · {capitalizedDay}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: palette.txt, lineHeight: 34 }}>
            Que veux-tu{'\n'}
            <Text style={{ color: palette.primary }}>deviner</Text> aujourd'hui ?
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

        {/* Chips / Shortcut Badges */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {THEME_CHIPS.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
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
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: idx === 0 ? palette.primary : palette.surface,
                borderWidth: 1,
                borderColor: idx === 0 ? palette.primary : palette.line,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: idx === 0 ? palette.primaryInk : palette.txt,
                }}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Access Cards: Mode Carrière & Entraînement */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/solo/career' as any)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
              minHeight: 120,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: palette.gold + '26',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={20} color={palette.gold} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
                Carrière
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                12 niveaux de difficulté
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/solo/training' as any)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 16,
              minHeight: 120,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: palette.primary + '26',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Dumbbell size={20} color={palette.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
                Entraînement
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                Sets IA & thèmes libres
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Global User Stats Summary Card */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 18,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
              Vos statistiques
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: palette.primary + '1A',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 9999,
              }}
            >
              <Award size={12} color={palette.primary} />
              <Text style={{ color: palette.primary, fontSize: 11, fontWeight: '700' }}>
                Rang #{data?.globalStats?.rank || 1}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: palette.gold }}>
                {data?.globalStats?.totalScore || 0}
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                Points totaux
              </Text>
            </View>

            <View style={{ width: 1, height: 32, backgroundColor: palette.line }} />

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: palette.good }}>
                {data?.globalStats?.totalGames || 0}
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                Parties jouées
              </Text>
            </View>

            <View style={{ width: 1, height: 32, backgroundColor: palette.line }} />

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: palette.primary }}>
                {data?.globalStats?.winRate != null ? `${Math.round(data.globalStats.winRate)}%` : '0%'}
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                Victoires
              </Text>
            </View>
          </View>
        </View>

        {/* Top 3 Leaderboard Section */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Crown size={18} color={palette.gold} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
                Top Classement
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/rankings' as any)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, color: palette.primary, fontWeight: '700' }}>
                Voir tout →
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              overflow: 'hidden',
            }}
          >
            {topRankings.length > 0 ? (
              topRankings.map((rankEntry, idx) => (
                <View
                  key={rankEntry.userId || idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: idx < topRankings.length - 1 ? 1 : 0,
                    borderBottomColor: palette.line,
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      width: 24,
                      fontSize: 14,
                      fontWeight: '800',
                      color: idx === 0 ? palette.gold : idx === 1 ? palette.silver : palette.bronze,
                    }}
                  >
                    #{idx + 1}
                  </Text>

                  <Avatar
                    name={rankEntry.username}
                    avatarUrl={rankEntry.avatarUrl}
                    hue={idx === 0 ? 45 : idx === 1 ? 210 : 30}
                    size={36}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }} numberOfLines={1}>
                      {rankEntry.username}
                    </Text>
                    <Text style={{ fontSize: 11, color: palette.inkSoft }}>
                      {rankEntry.totalGames || 0} partie{rankEntry.totalGames > 1 ? 's' : ''}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 14, fontWeight: '700', color: palette.gold, fontVariant: ['tabular-nums'] }}>
                    {rankEntry.totalScore || 0} pts
                  </Text>
                </View>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: palette.inkSoft, fontSize: 13 }}>
                  Classement en cours de synchronisation…
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
