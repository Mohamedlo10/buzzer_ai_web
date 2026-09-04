import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Sparkles,
  Zap,
  GraduationCap,
  Brain,
  Trophy,
  Target,
} from 'lucide-react-native';

import { useTrainingStore } from '~/stores/useTrainingStore';
import { palette, font } from '~/lib/theme/tokens';
import { notify } from '~/lib/ui/notify';
import { QuizAiLoadingScreen } from '~/components/solo/QuizAiLoadingScreen';
import type { TrainingDifficulty } from '~/types/training';

const LEVELS: { id: TrainingDifficulty; label: string; desc: string; icon: typeof GraduationCap; color: string }[] = [
  { id: 'FACILE', label: 'Débutant', desc: 'Notions de base, accessibles à tous', icon: BookOpen, color: palette.good },
  { id: 'MOYEN', label: 'Intermédiaire', desc: 'Connaissances spécifiques requises', icon: GraduationCap, color: palette.gold },
  { id: 'DIFFICILE', label: 'Avancé', desc: 'Détails précis, connaissances expertes', icon: Brain, color: '#F97316' },
  { id: 'EXTREME', label: 'Expert', desc: 'Ultra-pointu, niveau spécialiste', icon: Trophy, color: palette.bad },
];

const DURATIONS: { minutes: number; label: string; desc: string }[] = [
  { minutes: 5, label: '5 min', desc: '3 notions essentielles' },
  { minutes: 10, label: '10 min', desc: '5 notions, exploration complète' },
  { minutes: 15, label: '15 min', desc: '7 notions, approfondissement' },
  { minutes: 20, label: '20 min', desc: '10 notions, maîtrise complète' },
];

export default function TrainingConfigScreen() {
  const router = useRouter();
  const { subject: paramSubject } = useLocalSearchParams<{ subject?: string }>();

  const [subject, setSubject] = useState(paramSubject || '');
  const [difficulty, setDifficulty] = useState<TrainingDifficulty>('MOYEN');
  const [duration, setDuration] = useState(10);

  const { createSession, session: _session, isCreating } = useTrainingStore();

  const handleStart = async () => {
    const trimmed = subject.trim();
    if (!trimmed) {
      notify.error('Veuillez entrer un sujet');
      return;
    }
    if (trimmed.length < 3) {
      notify.error('Le sujet doit faire au moins 3 caractères');
      return;
    }

    try {
      await createSession(trimmed, difficulty, duration);
      // Navigate to session screen — the store now has the session
      const state = useTrainingStore.getState();
      if (state.session) {
        router.replace(`/solo/training/session/${state.session.sessionId}` as any);
      }
    } catch (err: any) {
      console.error('Failed to create training session', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
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
            else router.replace('/solo/training' as any);
          }}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 20,
            color: palette.txt,
            paddingTop: 3,
            flex: 1,
          }}
        >
          Configurer
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Subject Input ── */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 18,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Target size={16} color={palette.primary} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: palette.txt }}>
              Sujet d'apprentissage
            </Text>
          </View>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Ex: Révolution française, Photosynthèse, TCP/IP..."
            placeholderTextColor={palette.inkSoft}
            style={{
              backgroundColor: palette.bg,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: palette.line,
              paddingHorizontal: 16,
              paddingVertical: 13,
              color: palette.txt,
              fontSize: 15,
              fontWeight: '600',
            }}
          />
        </View>

        {/* ── Level Selection ── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4 }}>
            Niveau
          </Text>
          {LEVELS.map((level) => {
            const isSelected = difficulty === level.id;
            const Icon = level.icon;
            return (
              <TouchableOpacity
                key={level.id}
                onPress={() => setDifficulty(level.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isSelected ? level.color + '15' : palette.surface,
                  borderRadius: 18,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? level.color + '60' : palette.line,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 13,
                    backgroundColor: isSelected ? level.color + '22' : palette.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={isSelected ? level.color : palette.inkSoft} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: isSelected ? level.color : palette.txt }}>
                    {level.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: palette.inkSoft, marginTop: 1 }}>
                    {level.desc}
                  </Text>
                </View>
                {isSelected && (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: level.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Duration Selection ── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4 }}>
            Durée
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {DURATIONS.map((d) => {
              const isSelected = duration === d.minutes;
              return (
                <TouchableOpacity
                  key={d.minutes}
                  onPress={() => setDuration(d.minutes)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: isSelected ? palette.primary : palette.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isSelected ? palette.primary : palette.line,
                    paddingVertical: 14,
                    paddingHorizontal: 6,
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Clock size={14} color={isSelected ? palette.primaryInk : palette.inkSoft} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '800',
                      color: isSelected ? palette.primaryInk : palette.txt,
                    }}
                  >
                    {d.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: isSelected ? palette.primaryInk + 'CC' : palette.inkSoft,
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    {d.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Start Button ── */}
        <TouchableOpacity
          onPress={handleStart}
          disabled={isCreating || !subject.trim()}
          activeOpacity={0.85}
          style={{
            backgroundColor: isCreating || !subject.trim() ? palette.surface2 : palette.primary,
            borderRadius: 20,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            marginTop: 8,
            shadowColor: isCreating || !subject.trim() ? 'transparent' : palette.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={palette.primaryInk} />
          ) : (
            <Sparkles size={18} color={isCreating || !subject.trim() ? palette.inkSoft : palette.primaryInk} />
          )}
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: isCreating || !subject.trim() ? palette.inkSoft : palette.primaryInk,
            }}
          >
            {isCreating ? 'Génération en cours…' : "Commencer l'apprentissage"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* AI Loading Screen */}
      <QuizAiLoadingScreen
        visible={isCreating}
        theme={subject}
        levelLabel={`${LEVELS.find(l => l.id === difficulty)?.label || ''} · ${duration} min`}
        title="Création de votre session d'apprentissage"
      />
    </SafeAreaView>
  );
}
