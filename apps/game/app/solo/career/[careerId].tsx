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
  Check,
  AlertCircle,
  X,
  Trash2,
  Zap,
  Target,
  Sparkles,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import { useSoloStore } from '~/stores/useSoloStore';
import type { SoloCareerProgressResponse, LevelInfo } from '~/types/solo';
import { palette, font } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';
import { QuizAiLoadingScreen } from '~/components/solo/QuizAiLoadingScreen';
import { GamifiedProgressionPath } from '~/components/solo/GamifiedProgressionPath';

interface StageGroup {
  title: string;
  subtitle: string;
  difficulty: string;
  color: string;
  levels: LevelInfo[];
}

export default function CareerDetailScreen() {
  const router = useRouter();
  const { careerId } = useLocalSearchParams<{ careerId: string }>();
  const startNewSession = useSoloStore((s) => s.startNewSession);

  const [career, setCareer] = useState<SoloCareerProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<LevelInfo | null>(null);
  const [isStartingLevel, setIsStartingLevel] = useState(false);
  const [startingLevelInfo, setStartingLevelInfo] = useState<{ levelNumber: number; difficulty: string } | null>(null);

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
      message: `Voulez-vous abandonner votre carrière « ${career?.category} » ? Tous vos progrès seront perdus.`,
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

  const handleStartLevel = async (levelNumber: number, difficulty: string) => {
    setStartingLevelInfo({ levelNumber, difficulty });
    setIsStartingLevel(true);
    try {
      const startData = await soloApi.startLevel(careerId!, levelNumber);
      startNewSession({ ...startData, careerId });
      setSelectedLevel(null);
      // Le voile de préparation est retiré AVANT la navigation : rien ne doit
      // rester superposé pendant que cet écran est démonté par le `replace`.
      setIsStartingLevel(false);
      setStartingLevelInfo(null);
      router.replace(`/solo/game/${startData.sessionId}?careerId=${careerId}` as any);
    } catch (err: any) {
      notifyApiError(err, 'Erreur lors de la génération du quiz IA');
      setIsStartingLevel(false);
      setStartingLevelInfo(null);
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

  const completedCount = career.levels.filter((l) => l.status === 'COMPLETED').length;
  const progressPct = Math.round((completedCount / career.levels.length) * 100);

  // Group levels into 4 stages
  const stages: StageGroup[] = [
    {
      title: 'Étape 1 · Découverte',
      subtitle: 'Niveaux 1 à 3',
      difficulty: 'FACILE',
      color: palette.good,
      levels: career.levels.slice(0, 3),
    },
    {
      title: 'Étape 2 · Ascension',
      subtitle: 'Niveaux 4 à 6',
      difficulty: 'MOYEN',
      color: palette.gold,
      levels: career.levels.slice(3, 6),
    },
    {
      title: 'Étape 3 · Défi Avancé',
      subtitle: 'Niveaux 7 à 9',
      difficulty: 'DIFFICILE',
      color: palette.warn,
      levels: career.levels.slice(6, 9),
    },
    {
      title: 'Étape 4 · Épreuve Ultime',
      subtitle: 'Niveaux 10 à 12',
      difficulty: 'EXTRÊME',
      color: palette.bad,
      levels: career.levels.slice(9, 12),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Top Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/solo/career' as any);
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
            fontSize: 16,
            color: palette.txt,
            paddingTop: 2,
          }}
        >
          Mode Carrière
        </Text>

        <TouchableOpacity
          onPress={handleAbandon}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.bad + '18',
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
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Theme Banner Card ── */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 20,
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color={palette.gold} />
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.gold, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Parcours personnalisé
              </Text>
            </View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 22,
                color: palette.txt,
                lineHeight: 28,
                paddingTop: 4,
              }}
            >
              {career.category}
            </Text>
          </View>

          {/* Stats Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.surface2,
              borderRadius: 18,
              paddingVertical: 12,
              paddingHorizontal: 16,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 11, color: palette.inkSoft, fontWeight: '600', textTransform: 'uppercase' }}>
                Score Cumulé
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Trophy size={16} color={palette.gold} />
                <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 17, color: palette.gold, paddingTop: 2 }}>
                  {career.totalScore} pts
                </Text>
              </View>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: palette.line }} />

            <View style={{ gap: 2, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: palette.inkSoft, fontWeight: '600', textTransform: 'uppercase' }}>
                Progression
              </Text>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt, paddingTop: 2 }}>
                {completedCount} / {career.levels.length} ({progressPct}%)
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{ height: 7, backgroundColor: palette.surface2, borderRadius: 9999, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${progressPct}%`,
                backgroundColor: completedCount === 12 ? palette.good : palette.primary,
                borderRadius: 9999,
              }}
            />
          </View>
        </View>

        {/* ── Duolingo-Style Gamified Progression Path (Gold Theme) ── */}
        <GamifiedProgressionPath
          theme="gold"
          stages={stages.map((stage, idx) => ({
            stageNumber: idx + 1,
            title: stage.title,
            subtitle: stage.subtitle,
            difficulty: stage.difficulty,
            color: palette.gold,
            nodes: stage.levels.map((l) => ({
              id: l.levelNumber,
              number: l.levelNumber,
              title: `Niveau ${l.levelNumber}`,
              status: l.status as any,
              score: l.bestScore,
              difficulty: l.difficulty,
              attempts: l.attempts,
              threshold: l.threshold,
            })),
          }))}
          onNodePress={(node) => {
            const lvl = career.levels.find((l) => l.levelNumber === node.number);
            if (lvl) setSelectedLevel(lvl);
          }}
        />
      </ScrollView>

      {/* ── Level Details Modal ── */}
      <Modal
        visible={!!selectedLevel && !isStartingLevel}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLevel(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            activeOpacity={1}
            onPress={() => setSelectedLevel(null)}
          />

          {selectedLevel && (
            <View
              style={{
                backgroundColor: palette.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                borderWidth: 1,
                borderColor: palette.line,
                paddingHorizontal: 22,
                paddingTop: 14,
                paddingBottom: 36,
                width: '100%',
                maxWidth: 500,
                gap: 18,
              }}
            >
              {/* Modal Handle */}
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: palette.surface2 }} />
              </View>

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 19, color: palette.txt, paddingTop: 2 }}>
                    Niveau {selectedLevel.levelNumber}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: palette.primary, fontWeight: '700', textTransform: 'uppercase' }}>
                    Difficulté : {selectedLevel.difficulty}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSelectedLevel(null)}
                  activeOpacity={0.7}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: palette.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} color={palette.inkSoft} />
                </TouchableOpacity>
              </View>

              {/* Stats Box */}
              <View
                style={{
                  backgroundColor: palette.surface2,
                  borderRadius: 18,
                  padding: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: palette.inkSoft }}>Objectif de réussite</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: palette.good }}>
                    {Math.round(selectedLevel.threshold * 100)}% de bonnes réponses
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: palette.line }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: palette.inkSoft }}>Tentatives précédentes</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
                    {selectedLevel.attempts}
                  </Text>
                </View>

                {selectedLevel.bestScore > 0 && (
                  <>
                    <View style={{ height: 1, backgroundColor: palette.line }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: palette.inkSoft }}>Meilleur score</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: palette.gold }}>
                        {selectedLevel.bestScore} pts
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Start Button */}
              <TouchableOpacity
                onPress={() => handleStartLevel(selectedLevel.levelNumber, selectedLevel.difficulty)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: palette.primary,
                  borderRadius: 18,
                  paddingVertical: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  shadowColor: palette.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                <Zap size={18} color={palette.primaryInk} />
                <Text style={{ color: palette.primaryInk, fontSize: 16, fontWeight: '800' }}>
                  Lancer la partie
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ── AI Brain Loading Screen ── */}
      <QuizAiLoadingScreen
        visible={isStartingLevel}
        theme={career.category}
        levelLabel={`Niveau ${startingLevelInfo?.levelNumber ?? 1} · ${startingLevelInfo?.difficulty ?? 'FACILE'}`}
        title="Préparation de la partie en cours"
      />
    </SafeAreaView>
  );
}
