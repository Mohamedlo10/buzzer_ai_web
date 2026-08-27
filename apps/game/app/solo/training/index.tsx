import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  Brain,
  Sparkles,
  BookOpen,
  ChevronRight,
  Landmark,
  Globe,
  Atom,
  Music,
  Palette as PaletteIcon,
  Film,
  Calculator,
  Dna,
  Monitor,
  Zap,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import type { SoloTrainingPlanResponse } from '~/types/solo';
import { palette, font } from '~/lib/theme/tokens';

const POPULAR_THEMES = [
  { label: 'Histoire du Sénégal', icon: Landmark, color: '#F59E0B' },
  { label: 'Géographie Mondiale', icon: Globe, color: '#3B82F6' },
  { label: 'Sciences & Univers', icon: Atom, color: '#10B981' },
  { label: 'Cinéma & Séries', icon: Film, color: '#8B5CF6' },
  { label: 'Musique & Rythmes', icon: Music, color: '#EC4899' },
  { label: 'Arts & Culture', icon: PaletteIcon, color: '#F97316' },
  { label: 'Mathématiques', icon: Calculator, color: '#6366F1' },
  { label: 'Biologie & Nature', icon: Dna, color: '#14B8A6' },
  { label: 'Informatique & IA', icon: Monitor, color: '#64748B' },
  { label: 'Littérature & Poésie', icon: BookOpen, color: '#A855F7' },
];

export default function TrainingHubScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [trainingPlans, setTrainingPlans] = useState<SoloTrainingPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await soloApi.listCustomTrainings();
      setTrainingPlans(data || []);
    } catch (error) {
      console.error('Failed to fetch training plans', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  };

  const navigateToConfig = (subject?: string) => {
    const trimmed = (subject || searchQuery).trim();
    if (trimmed.length > 0) {
      router.push(`/solo/training/config?subject=${encodeURIComponent(trimmed)}` as any);
    } else {
      router.push('/solo/training/config' as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* ── Top Bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
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
            else router.replace('/(tabs)/solo');
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
            fontSize: 20,
            lineHeight: 28,
            color: palette.txt,
            paddingTop: 4,
            flex: 1,
          }}
        >
          Entraînement
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {/* ── Barre de recherche + Bouton flèche pour ajouter ── */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: palette.primary + '50',
            padding: 6,
            paddingLeft: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Brain size={20} color={palette.primary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => navigateToConfig()}
            placeholder="Tape un sujet à apprendre..."
            placeholderTextColor={palette.inkSoft}
            returnKeyType="go"
            style={{
              flex: 1,
              color: palette.txt,
              fontSize: 15,
              fontWeight: '600',
              paddingVertical: 10,
            }}
          />

          <TouchableOpacity
            onPress={() => navigateToConfig()}
            activeOpacity={0.85}
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: palette.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: palette.primary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <ArrowRight size={20} color={palette.primaryInk} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Mes Entraînements ── */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Mes entraînements ({trainingPlans.length})
            </Text>
          </View>

          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 30, gap: 8 }}>
              <ActivityIndicator size="small" color={palette.primary} />
              <Text style={{ color: palette.inkSoft, fontSize: 13 }}>Chargement des entraînements…</Text>
            </View>
          ) : trainingPlans.length > 0 ? (
            trainingPlans.map((plan) => (
              <TouchableOpacity
                key={plan.planId}
                onPress={() => router.push(`/solo/training/${plan.planId}` as any)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  shadowColor: '#000',
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: palette.primary + '18',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen size={20} color={palette.primary} />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontFamily: font.nativeFamily.display,
                        fontSize: 16,
                        lineHeight: 24,
                        color: palette.txt,
                        paddingTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {plan.theme}
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                      {plan.parentDifficulty} · {plan.levels.length} séries
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: palette.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChevronRight size={16} color={palette.primary} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View
              style={{
                backgroundColor: palette.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: palette.line,
                padding: 20,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Brain size={28} color={palette.inkSoft} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
                Aucun entraînement créé pour le moment
              </Text>
              <Text style={{ fontSize: 12.5, color: palette.inkSoft, textAlign: 'center', lineHeight: 17 }}>
                Tapez un sujet dans la barre ci-dessus ou choisissez un thème populaire pour démarrer !
              </Text>
            </View>
          )}
        </View>

        {/* ── Thèmes populaires ── */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
            <Sparkles size={14} color={palette.primary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: palette.inkSoft,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Suggestions & Thèmes populaires
            </Text>
          </View>

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
                    gap: 8,
                  }}
                >
                  <Icon size={15} color={theme.color} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
                    {theme.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
