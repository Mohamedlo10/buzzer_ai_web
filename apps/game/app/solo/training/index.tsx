import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Dumbbell,
  Plus,
  ArrowLeft,
  Brain,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import type { SoloTrainingPlanResponse } from '~/types/solo';
import { palette, font } from '~/lib/theme/tokens';

export default function TrainingHubScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'custom' | 'predefined'>('custom');
  const [customPlans, setCustomPlans] = useState<SoloTrainingPlanResponse[]>([]);
  const [predefinedPlans, setPredefinedPlans] = useState<SoloTrainingPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [customData, predefinedData] = await Promise.all([
        soloApi.listCustomTrainings(),
        soloApi.listPredefinedTrainings(),
      ]);
      setCustomPlans(customData || []);
      setPredefinedPlans(predefinedData || []);
    } catch (error) {
      console.error('Failed to fetch training plans', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const currentPlans = activeTab === 'custom' ? customPlans : predefinedPlans;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
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
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/dashboard');
            }
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
          Entraînement
        </Text>
      </View>

      {/* Tabs Switcher */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 8,
          gap: 8,
          backgroundColor: palette.bg,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('custom')}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: activeTab === 'custom' ? palette.primary : palette.surface,
            borderWidth: 1,
            borderColor: activeTab === 'custom' ? palette.primary : palette.line,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Brain size={16} color={activeTab === 'custom' ? palette.primaryInk : palette.txt} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: activeTab === 'custom' ? palette.primaryInk : palette.txt,
            }}
          >
            Mes plans (IA)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('predefined')}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: activeTab === 'predefined' ? palette.primary : palette.surface,
            borderWidth: 1,
            borderColor: activeTab === 'predefined' ? palette.primary : palette.line,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Users size={16} color={activeTab === 'predefined' ? palette.primaryInk : palette.txt} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: activeTab === 'predefined' ? palette.primaryInk : palette.txt,
            }}
          >
            Communauté
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {activeTab === 'custom' && (
          <TouchableOpacity
            onPress={() => router.push('/solo/training/custom/new' as any)}
            activeOpacity={0.8}
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.primary + '40',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: palette.primary + '26',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={20} color={palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: palette.txt }}>
                  Générer un entraînement IA
                </Text>
                <Text style={{ fontSize: 12, color: palette.inkSoft, marginTop: 2 }}>
                  Choisissez un thème et laissez l'IA créer 3 séries de questions.
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={palette.inkSoft} />
          </TouchableOpacity>
        )}

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement des plans…</Text>
          </View>
        ) : currentPlans.length === 0 ? (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 32,
              alignItems: 'center',
              gap: 12,
              marginTop: 16,
            }}
          >
            <Dumbbell size={36} color={palette.inkSoft} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
              Aucun plan disponible
            </Text>
            <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center' }}>
              {activeTab === 'custom'
                ? 'Générez votre premier plan personnalisé pour commencer.'
                : 'Aucun entraînement communautaire disponible.'}
            </Text>
          </View>
        ) : (
          currentPlans.map((plan) => (
            <TouchableOpacity
              key={plan.planId}
              onPress={() => router.push(`/solo/training/${plan.planId}` as any)}
              activeOpacity={0.8}
              style={{
                backgroundColor: palette.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: palette.line,
                padding: 16,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View
                  style={{
                    backgroundColor: palette.surface2,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '800' }}>
                    {plan.parentDifficulty}
                  </Text>
                </View>

                {plan.planType === 'PREDEFINED' && (
                  <Text style={{ fontSize: 12, color: palette.primary, fontWeight: '700' }}>
                    👍 {plan.voteCount} votes
                  </Text>
                )}
              </View>

              <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
                {plan.theme}
              </Text>

              <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                {plan.planType === 'CUSTOM' ? 'Entraînement IA personnalisé' : 'Entraînement communautaire'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
