import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Trophy,
  ArrowLeft,
  Lock,
  Play,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Zap,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import { useSoloStore } from '~/stores/useSoloStore';
import type { SoloCareerProgressResponse, LevelInfo } from '~/types/solo';
import { palette, font } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

export default function CareerDetailScreen() {
  const router = useRouter();
  const { careerId } = useLocalSearchParams<{ careerId: string }>();
  const startNewSession = useSoloStore((s) => s.startNewSession);

  const [career, setCareer] = useState<SoloCareerProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<LevelInfo | null>(null);
  const [isStartingLevel, setIsStartingLevel] = useState(false);

  useEffect(() => {
    const fetchCareerDetail = async () => {
      try {
        const data = await soloApi.getCareer(careerId!);
        setCareer(data);
      } catch (error) {
        console.error('Failed to fetch career details', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (careerId) fetchCareerDetail();
  }, [careerId]);

  const handleAbandon = async () => {
    const ok = await confirmAsync({
      title: 'Abandonner la carrière',
      message: 'Voulez-vous abandonner cette carrière ? Tous vos progrès seront perdus.',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await soloApi.abandonCareer(careerId!);
      notify.info('Carrière abandonnée');
      router.replace('/solo/career' as any);
    } catch (err: any) {
      notifyApiError(err, "Impossible d'abandonner la carrière");
    }
  };

  const handleStartLevel = async (levelNumber: number) => {
    setIsStartingLevel(true);
    try {
      const startData = await soloApi.startLevel(careerId!, levelNumber);
      startNewSession(startData);
      setSelectedLevel(null);
      router.push(`/solo/game/${startData.sessionId}` as any);
    } catch (err: any) {
      notifyApiError(err, 'Erreur lors du lancement du niveau');
    } finally {
      setIsStartingLevel(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement de votre carrière…</Text>
      </SafeAreaView>
    );
  }

  if (!career) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <AlertCircle size={40} color={palette.bad} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.txt }}>
          Carrière introuvable
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text style={{ color: palette.txt, fontWeight: '700' }}>Retour aux carrières</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 18,
              lineHeight: 24,
              color: palette.txt,
              paddingTop: 2,
            }}
            numberOfLines={1}
          >
            {career.category}
          </Text>
          <Text style={{ fontSize: 12, color: palette.gold, fontWeight: '700' }}>
            Score total : {career.totalScore} pts
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleAbandon}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.bad + '1A',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.bad + '33',
          }}
        >
          <Trash2 size={16} color={palette.bad} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 12 Levels Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          {career.levels.map((level) => {
            const isLocked = level.status === 'LOCKED';
            const isCompleted = level.status === 'COMPLETED';
            const isCurrent = level.status === 'UNLOCKED' || level.status === 'IN_PROGRESS';

            return (
              <TouchableOpacity
                key={level.levelNumber}
                disabled={isLocked}
                onPress={() => setSelectedLevel(level)}
                activeOpacity={0.8}
                style={{
                  width: '30%',
                  aspectRatio: 1,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: isCompleted
                    ? palette.good
                    : isCurrent
                    ? palette.gold
                    : palette.line,
                  backgroundColor: isCompleted
                    ? palette.good + '1A'
                    : isCurrent
                    ? palette.surface
                    : palette.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  opacity: isLocked ? 0.45 : 1,
                }}
              >
                {isCompleted ? (
                  <CheckCircle size={22} color={palette.good} />
                ) : isLocked ? (
                  <Lock size={20} color={palette.inkSoft} />
                ) : (
                  <Play size={20} color={palette.gold} />
                )}

                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '800',
                    color: isCompleted
                      ? palette.good
                      : isCurrent
                      ? palette.txt
                      : palette.inkSoft,
                  }}
                >
                  Niv. {level.levelNumber}
                </Text>

                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '700',
                    color: palette.inkSoft,
                    textTransform: 'uppercase',
                  }}
                >
                  {level.difficulty}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Level Details Modal */}
      <Modal
        visible={!!selectedLevel}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLevel(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          {selectedLevel && (
            <View
              style={{
                backgroundColor: palette.surface,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: palette.line,
                padding: 24,
                width: '100%',
                maxWidth: 380,
                gap: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: palette.txt }}>
                  Niveau {selectedLevel.levelNumber} · {selectedLevel.difficulty}
                </Text>
                <TouchableOpacity onPress={() => setSelectedLevel(null)} activeOpacity={0.7}>
                  <X size={20} color={palette.inkSoft} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, color: palette.inkSoft }}>
                  • Seuil de réussite : <Text style={{ color: palette.txt, fontWeight: '700' }}>{Math.round(selectedLevel.threshold * 100)}%</Text>
                </Text>
                <Text style={{ fontSize: 13, color: palette.inkSoft }}>
                  • Tentatives précédentes : <Text style={{ color: palette.txt, fontWeight: '700' }}>{selectedLevel.attempts}</Text>
                </Text>
                {selectedLevel.bestScore > 0 && (
                  <Text style={{ fontSize: 13, color: palette.inkSoft }}>
                    • Meilleur score : <Text style={{ color: palette.gold, fontWeight: '700' }}>{selectedLevel.bestScore} pts</Text>
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleStartLevel(selectedLevel.levelNumber)}
                disabled={isStartingLevel}
                activeOpacity={0.8}
                style={{
                  backgroundColor: palette.primary,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {isStartingLevel ? (
                  <ActivityIndicator size="small" color={palette.primaryInk} />
                ) : (
                  <>
                    <Play size={16} color={palette.primaryInk} />
                    <Text style={{ color: palette.primaryInk, fontSize: 15, fontWeight: '700' }}>
                      Jouer ce niveau
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
