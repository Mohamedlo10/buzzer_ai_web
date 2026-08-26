import { useState, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  BookOpen,
  Search,
  Sparkles,
  ChevronRight,
  Clock,
  Trophy,
  TrendingUp,
  Brain,
  Compass,
  Atom,
  Globe,
  Music,
  Palette,
  Film,
  Calculator,
  Dna,
  Monitor,
  Landmark,
  Play,
  RotateCcw,
  Layers,
} from 'lucide-react-native';

import * as trainingApi from '~/lib/api/training';
import * as soloApi from '~/lib/api/solo';
import type { TrainingSubjectMastery, TrainingSessionSummary } from '~/types/training';
import type { SoloTrainingPlanResponse } from '~/types/solo';
import { palette, font } from '~/lib/theme/tokens';
import { MasteryBar } from '~/components/training/MasteryBar';
import { BadgePill } from '~/components/training/BadgePill';
import { Flame } from 'lucide-react-native';

const POPULAR_THEMES = [
  { label: 'Histoire', icon: Landmark, color: '#F59E0B' },
  { label: 'Géographie', icon: Globe, color: '#3B82F6' },
  { label: 'Sciences', icon: Atom, color: '#10B981' },
  { label: 'Musique', icon: Music, color: '#EC4899' },
  { label: 'Cinéma', icon: Film, color: '#8B5CF6' },
  { label: 'Art', icon: Palette, color: '#F97316' },
  { label: 'Mathématiques', icon: Calculator, color: '#6366F1' },
  { label: 'Biologie', icon: Dna, color: '#14B8A6' },
  { label: 'Informatique', icon: Monitor, color: '#64748B' },
  { label: 'Littérature', icon: BookOpen, color: '#A855F7' },
];

export default function TrainingHubScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<TrainingSessionSummary[]>([]);
  const [history, setHistory] = useState<TrainingSubjectMastery[]>([]);
  const [legacyPlans, setLegacyPlans] = useState<SoloTrainingPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, historyRes, legacyRes] = await Promise.allSettled([
        trainingApi.listSessions(),
        trainingApi.getHistory(),
        soloApi.listCustomTrainings(),
      ]);

      if (sessionsRes.status === 'fulfilled') {
        setSessions(sessionsRes.value || []);
      }
      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value || []);
      }
      if (legacyRes.status === 'fulfilled') {
        setLegacyPlans(legacyRes.value || []);
      }
    } catch (error) {
      console.error('Failed to fetch training hub data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const navigateToConfig = (subject?: string) => {
    const params = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    router.push(`/solo/training/config${params}` as any);
  };

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length >= 3) {
      navigateToConfig(trimmed);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* ── Header ── */}
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
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/dashboard');
          }}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 22,
            lineHeight: 28,
            color: palette.txt,
            paddingTop: 4,
            flex: 1,
          }}
        >
          Apprendre
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {/* ── Search / Quick Start ── */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 18,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={palette.primary} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: palette.txt }}>
              Que voulez-vous apprendre ?
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Ex: Révolution française, ADN, Jazz..."
              placeholderTextColor={palette.inkSoft}
              returnKeyType="go"
              style={{
                flex: 1,
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: palette.txt,
                fontSize: 14,
                fontWeight: '600',
              }}
            />
            <TouchableOpacity
              onPress={handleSearch}
              disabled={searchQuery.trim().length < 3}
              activeOpacity={0.8}
              style={{
                backgroundColor: searchQuery.trim().length >= 3 ? palette.primary : palette.surface2,
                borderRadius: 14,
                width: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search
                size={18}
                color={searchQuery.trim().length >= 3 ? palette.primaryInk : palette.inkSoft}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Popular Themes Grid ── */}
        <View style={{ gap: 10 }}>
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {POPULAR_THEMES.map((theme) => {
              const Icon = theme.icon;
              return (
                <TouchableOpacity
                  key={theme.label}
                  onPress={() => navigateToConfig(theme.label)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: palette.line,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <Icon size={14} color={theme.color} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: palette.txt }}>
                    {theme.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Active Sessions in Progress ── */}
        {sessions.filter((s) => s.status === 'IN_PROGRESS').length > 0 && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
              <Play size={14} color={palette.primary} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '800',
                  color: palette.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                En cours · Reprendre
              </Text>
            </View>

            {sessions
              .filter((s) => s.status === 'IN_PROGRESS')
              .map((s) => (
                <TouchableOpacity
                  key={s.sessionId}
                  onPress={() => router.push(`/solo/training/session/${s.sessionId}` as any)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 18,
                    borderWidth: 1.5,
                    borderColor: palette.primary + '50',
                    padding: 16,
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
                        {s.subject}
                      </Text>
                      <Text style={{ fontSize: 11, color: palette.inkSoft }}>
                        {s.difficulty} · {s.durationMinutes} min · {formatDate(s.startedAt)}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: palette.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 9999,
                      }}
                    >
                      <Play size={12} color={palette.primaryInk} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: palette.primaryInk }}>
                        Reprendre
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: palette.inkSoft }}>
                        Notion {s.currentUnit} sur {s.totalUnits}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: palette.primary }}>
                        {s.percentComplete}%
                      </Text>
                    </View>
                    <MasteryBar score={s.percentComplete} size="sm" />
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* ── History / Past Sessions ── */}
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 10 }}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={{ color: palette.inkSoft, fontSize: 13 }}>Chargement…</Text>
          </View>
        ) : history.length > 0 ? (
          <View style={{ gap: 10 }}>
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
              Mes sujets & Maîtrise
            </Text>
            {history.map((mastery) => (
              <TouchableOpacity
                key={mastery.id}
                onPress={() => navigateToConfig(mastery.subject)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
                        {mastery.subject}
                      </Text>
                      {mastery.badge && mastery.badge !== 'NONE' && (
                        <BadgePill badge={mastery.badge} size="sm" />
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 11, color: palette.inkSoft }}>
                        {mastery.sessionsCount} session{mastery.sessionsCount > 1 ? 's' : ''}
                        {mastery.lastSessionAt ? ` · ${formatDate(mastery.lastSessionAt)}` : ''}
                      </Text>
                      {mastery.currentStreak > 1 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Flame size={12} color="#F97316" />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F97316' }}>
                            {mastery.currentStreak}j
                          </Text>
                        </View>
                      )}
                      {mastery.totalXp > 0 && (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: palette.primary }}>
                          {mastery.totalXp} XP
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        backgroundColor: mastery.masteryScore >= 70 ? palette.good + '1A' : palette.warn + '1A',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 9999,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '800',
                          color: mastery.masteryScore >= 70 ? palette.good : palette.warn,
                        }}
                      >
                        {Math.round(mastery.masteryScore)}%
                      </Text>
                    </View>
                    <ChevronRight size={16} color={palette.inkSoft} />
                  </View>
                </View>

                <MasteryBar score={mastery.masteryScore} size="sm" />
              </TouchableOpacity>
            ))}
          </View>
        ) : sessions.length === 0 ? (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 32,
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: palette.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Compass size={28} color={palette.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
              Prêt à apprendre ?
            </Text>
            <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center', lineHeight: 18 }}>
              Choisissez un thème ci-dessus ou entrez votre propre sujet pour démarrer une session d'apprentissage interactif.
            </Text>
          </View>
        ) : null}

        {/* ── Legacy Custom Plans (v1 Mode Quiz) ── */}
        {legacyPlans.length > 0 && (
          <View style={{ gap: 10, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
              <Layers size={14} color={palette.inkSoft} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '800',
                  color: palette.inkSoft,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Anciens plans de quiz
              </Text>
            </View>
            {legacyPlans.map((plan) => (
              <TouchableOpacity
                key={plan.planId}
                onPress={() => router.push(`/solo/training/${plan.planId}` as any)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
                    {plan.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>
                    {plan.theme} · {plan.parentDifficulty}
                  </Text>
                </View>
                <ChevronRight size={16} color={palette.inkSoft} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "à l'instant";
    if (diffH < 24) return `il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `il y a ${diffD}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}
