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
  Trophy,
  Plus,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import type { SoloCareerProgressResponse } from '~/types/solo';
import { palette, font } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

export default function CareerListScreen() {
  const router = useRouter();
  const [careers, setCareers] = useState<SoloCareerProgressResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCareers = async () => {
    try {
      const data = await soloApi.listCareers();
      setCareers((data || []).filter((c) => c.status !== 'ABANDONED'));
    } catch (error) {
      console.error('Failed to fetch careers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCareers();
    setRefreshing(false);
  };

  const handleAbandon = async (career: SoloCareerProgressResponse) => {
    const ok = await confirmAsync({
      title: 'Abandonner la carrière',
      message: `Voulez-vous abandonner votre carrière « ${career.category} » ? Tous vos progrès seront perdus.`,
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await soloApi.abandonCareer(career.careerId);
      setCareers((prev) => prev.filter((c) => c.careerId !== career.careerId));
      notify.info('Carrière abandonnée');
    } catch (err: any) {
      notifyApiError(err, "Impossible d'abandonner la carrière");
    }
  };

  const activeCareersCount = careers.filter((c) => c.status === 'ACTIVE').length;
  const isMaxCareers = activeCareersCount >= 3;

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
          onPress={() => router.back()}
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
          Mes Carrières
        </Text>

        {!isMaxCareers && (
          <TouchableOpacity
            onPress={() => router.push('/solo/career/new' as any)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: palette.primary,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
            }}
          >
            <Plus size={16} color={palette.primaryInk} />
            <Text style={{ color: palette.primaryInk, fontSize: 12, fontWeight: '700' }}>
              Nouvelle
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {isMaxCareers && (
          <View
            style={{
              backgroundColor: palette.warn + '1A',
              borderColor: palette.warn + '40',
              borderWidth: 1,
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={18} color={palette.warn} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.warn }}>
                Limite de 3 carrières atteintes
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2, lineHeight: 15 }}>
                Terminez ou abandonnez une carrière en cours pour en créer une nouvelle.
              </Text>
            </View>
          </View>
        )}

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement des carrières…</Text>
          </View>
        ) : careers.length === 0 ? (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 32,
              alignItems: 'center',
              gap: 14,
              marginTop: 16,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: palette.gold + '26',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={32} color={palette.gold} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: palette.txt }}>
              Aucune carrière active
            </Text>
            <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
              Le mode carrière vous permet de gravir 12 niveaux sur le thème de votre choix. Lancez-vous !
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/solo/career/new' as any)}
              activeOpacity={0.8}
              style={{
                backgroundColor: palette.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 6,
              }}
            >
              <Plus size={16} color={palette.primaryInk} />
              <Text style={{ color: palette.primaryInk, fontSize: 14, fontWeight: '700' }}>
                Créer une carrière
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          careers.map((career) => {
            const isCompleted = career.status === 'COMPLETED';
            const pct = Math.round((career.currentLevel / 12) * 100);

            return (
              <TouchableOpacity
                key={career.careerId}
                onPress={() => router.push(`/solo/career/${career.careerId}` as any)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 16,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 9999,
                      backgroundColor: isCompleted ? palette.good + '26' : palette.surface2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: isCompleted ? palette.good : palette.inkSoft,
                        textTransform: 'uppercase',
                      }}
                    >
                      {isCompleted ? 'Complétée 🎉' : `Niveau ${career.currentLevel} / 12`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAbandon(career)}
                    activeOpacity={0.7}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: palette.bad + '1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} color={palette.bad} />
                  </TouchableOpacity>
                </View>

                <View>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      fontSize: 17,
                      lineHeight: 22,
                      color: palette.txt,
                      paddingTop: 2,
                    }}
                  >
                    {career.category}
                  </Text>
                  <Text style={{ fontSize: 12, color: palette.gold, fontWeight: '700', marginTop: 2 }}>
                    {career.totalScore} pts accumulés
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={{ gap: 6 }}>
                  <View style={{ height: 6, backgroundColor: palette.surface2, borderRadius: 3, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: isCompleted ? palette.good : palette.primary,
                        borderRadius: 3,
                        width: `${Math.min(100, pct)}%`,
                      }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
