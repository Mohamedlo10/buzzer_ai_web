/**
 * daily/index.tsx — Point d'entrée du Défi du Jour
 *
 * Quatre états (règle §6) :
 *  1. Chargement    → <LoadingState fullScreen>
 *  2. Erreur        → <ErrorState onRetry>
 *  3. available === false → EmptyState « Pas de défi aujourd'hui »
 *  4. myAttempt.status === 'COMPLETED' → carte score + bouton classement
 *  5. Sinon → intro avec bouton Jouer → router.push('/daily/play')
 *
 * Aucune logique de jeu ici. Aucun calcul de score.
 */
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy, Calendar, Clock, Zap } from 'lucide-react-native';

import { useDailyToday } from '~/lib/query/hooks';
import { LoadingState, EmptyState, ErrorState } from '~/components/ui/StateViews';
import { palette, font } from '~/lib/theme/tokens';
import { PatternZigzag } from '~/components/shared/PatternZigzag';
import type { DailyTodayResponse } from '~/types/daily';

export default function DailyIndexScreen() {
  const { data, isLoading, isError, refetch } = useDailyToday();

  // ── 1. Chargement ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <LoadingState label="Chargement du défi…" fullScreen />
      </SafeAreaView>
    );
  }

  // ── 2. Erreur ──────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <BackButton />
        <ErrorState
          fallbackMessage="Impossible de charger le défi du jour."
          onRetry={refetch}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  // ── 3. Aucun défi aujourd'hui ──────────────────────────────────────────────
  if (!data.available || !data.challenge) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <BackButton />
        <EmptyState
          icon={<Calendar size={32} color={palette.inkSoft} />}
          title="Pas de défi aujourd'hui"
          description="Reviens demain — un nouveau défi t'attend chaque matin."
        />
      </SafeAreaView>
    );
  }

  // ── 4. Déjà joué ──────────────────────────────────────────────────────────
  if (data.myAttempt?.status === 'COMPLETED') {
    return <AlreadyPlayedView data={data} />;
  }

  // ── 5. Intro / Jouer ──────────────────────────────────────────────────────
  return <IntroView data={data} />;
}

// ─── Vue Intro ───────────────────────────────────────────────────────────────

function IntroView({ data }: { data: DailyTodayResponse }) {
  const router = useRouter();
  const challenge = data.challenge!;

  function handlePlay() {
    router.push('/daily/play' as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <BackButton />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte hero */}
        <View
          style={{
            backgroundColor: palette.indigo,
            borderRadius: 24,
            padding: 24,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <PatternZigzag color="#FFFFFF" opacity={0.12} size={20} />
          <View style={{ position: 'relative', zIndex: 1, gap: 6 }}>
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontWeight: '700',
                fontSize: 11,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.65)',
              }}
            >
              Défi du jour · {challenge.date}
            </Text>

            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 26,
                lineHeight: 34,
                color: '#FFFFFF',
                paddingTop: 4,
              }}
            >
              {challenge.theme ?? 'Défi du jour'}
            </Text>

            {challenge.difficulty ? (
              <Text
                style={{
                  fontFamily: font.nativeFamily.serif,
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                Niveau {challenge.difficulty}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <StatCard
            icon={<Zap size={18} color={palette.gold} />}
            value={`${challenge.questionCount} questions`}
          />
          <StatCard
            icon={<Clock size={18} color={palette.gold} />}
            value={`~${challenge.estimatedMinutes} min`}
          />
          <StatCard
            icon={<Trophy size={18} color={palette.gold} />}
            value={`${challenge.maxPoints} pts max`}
          />
        </View>

        {/* Règles rapides */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 18,
            gap: 10,
          }}
        >
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '700',
              fontSize: 12,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: palette.inkSoft,
              marginBottom: 4,
            }}
          >
            Règles
          </Text>
          {[
            'Une seule tentative par jour.',
            'Réponds avant la fin du temps imparti.',
            'Plus tu réponds vite, plus tu scores.',
          ].map((rule) => (
            <Text
              key={rule}
              style={{
                fontFamily: font.nativeFamily.ui,
                fontSize: 14,
                color: palette.txt,
                lineHeight: 20,
              }}
            >
              • {rule}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        style={{
          padding: 20,
          paddingBottom: 32,
          borderTopWidth: 1,
          borderTopColor: palette.line,
          backgroundColor: palette.bg,
        }}
      >
        <TouchableOpacity
          onPress={handlePlay}
          activeOpacity={0.85}
          style={{
            backgroundColor: palette.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '800',
              fontSize: 16,
              color: palette.primaryInk,
            }}
          >
            Commencer le défi
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Vue Déjà joué ───────────────────────────────────────────────────────────

function AlreadyPlayedView({ data }: { data: DailyTodayResponse }) {
  const router = useRouter();
  const attempt = data.myAttempt!;
  const challenge = data.challenge;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <BackButton />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte score */}
        <View
          style={{
            backgroundColor: palette.indigo,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '700',
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Défi du jour · {challenge?.date ?? ''}
          </Text>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 56,
              lineHeight: 64,
              color: '#FFFFFF',
              paddingTop: 4,
            }}
          >
            {attempt.score}
          </Text>

          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontSize: 14,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {attempt.correctCount} / {attempt.answeredCount} bonnes réponses
            {challenge ? ` sur ${challenge.maxPoints} pts max` : ''}
          </Text>

          {attempt.rank !== null && attempt.totalPlayers !== null && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.15)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Trophy size={16} color="rgba(255,255,255,0.85)" />
              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  fontWeight: '700',
                  fontSize: 14,
                  color: '#FFFFFF',
                }}
              >
                #{attempt.rank} sur {attempt.totalPlayers} joueurs
              </Text>
            </View>
          )}
        </View>

        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontSize: 13,
            color: palette.inkSoft,
            textAlign: 'center',
            lineHeight: 18,
          }}
        >
          Tu as déjà relevé le défi d'aujourd'hui. Reviens demain !
        </Text>

        {/* Bouton classement */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/rankings' as any)}
          activeOpacity={0.85}
          style={{
            backgroundColor: palette.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.line,
            paddingVertical: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Trophy size={18} color={palette.gold} />
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '700',
              fontSize: 15,
              color: palette.txt,
            }}
          >
            Voir le classement
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Micro-composants partagés ───────────────────────────────────────────────

function BackButton() {
  const router = useRouter();
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
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
          borderWidth: 1,
          borderColor: palette.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronLeft size={20} color={palette.txt} />
      </TouchableOpacity>
    </View>
  );
}

function StatCard({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 12,
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      <Text
        style={{
          fontFamily: font.nativeFamily.ui,
          fontWeight: '700',
          fontSize: 12,
          color: palette.txt,
          textAlign: 'center',
        }}
      >
        {value}
      </Text>
    </View>
  );
}
