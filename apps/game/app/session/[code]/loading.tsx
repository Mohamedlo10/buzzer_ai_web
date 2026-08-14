import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Zap, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useBuzzStore, useIsManager } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { cancelGeneration } from '~/lib/api/sessions';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import { appStorage } from '~/lib/utils/storage';
import type { GenerationProgressEvent } from '~/types/websocket';
import { palette } from '~/lib/theme/tokens';

/**
 * Écran de chargement pendant la génération IA des questions.
 *
 * Port de web-legacy/app/session/[code]/loading/page.tsx.
 * MascotRunner CSS → Animated (RN) — même logique de simulation.
 * La mascotte SVG n'étant pas supportée nativement, on la remplace par
 * une icône animée qui court sur la barre de progression.
 */
export default function LoadingScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  const [realProgress, setRealProgress] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = isComplete ? 100 : Math.min(Math.max(simulatedProgress, realProgress), 99);

  // Mascot bounce animation (remplace les keyframes CSS run-body)
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isComplete || error) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -4, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.sin) }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 220, useNativeDriver: true, easing: Easing.in(Easing.sin) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isComplete, error]); // eslint-disable-line react-hooks/exhaustive-deps

  const { session, fetchSession, leaveSession } = useBuzzStore();
  const explicitIsManager = useIsManager();
  const authUser = useAuthStore((s) => s.user);
  const isManager = explicitIsManager || (!!authUser && authUser.id === session?.managerId);
  const [isCancelling, setIsCancelling] = useState(false);

  // Simulation : monte vers 88% avec décélération (identique au web)
  useEffect(() => {
    if (isComplete) return;
    const CEILING = 88;
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= CEILING) return prev;
        const step = (CEILING - prev) * 0.018;
        return Math.min(prev + Math.max(step, 0.05), CEILING);
      });
    }, 300);
    return () => clearInterval(interval);
  }, [isComplete]);

  // WebSocket pour les mises à jour de génération
  const { isConnected } = useGameSocket(session?.id || null, {
    onEvent: (event) => {
      switch (event.type) {
        case 'generation_progress': {
          const e = event as GenerationProgressEvent;
          setCurrentQuestion(e.current);
          setTotalQuestions(e.total);
          setRealProgress(e.percentage);
          break;
        }
        case 'generation_complete':
          setRealProgress(100);
          setIsComplete(true);
          break;
        case 'generation_failed':
          if (!event.usingFallback) {
            setError('Échec de la génération des questions');
          } else {
            setError('Questions de secours activées');
          }
          break;
      }
    },
  });

  // Charge la session si elle n'est pas en store
  useEffect(() => {
    if (!code) return;
    if (session && session.code === code) return;

    if (session && session.code !== code) {
      leaveSession();
    }

    const loadSession = async () => {
      try {
        const activeSession = await appStorage.getActiveSession();
        if (activeSession?.sessionId && activeSession?.code === code) {
          await fetchSession(activeSession.sessionId);
          return;
        }
        const checkResult = await useBuzzStore.getState().joinCheck(code);
        if (checkResult?.sessionId) {
          await fetchSession(checkResult.sessionId);
          await appStorage.setActiveSession({ sessionId: checkResult.sessionId, code: checkResult.code });
          return;
        }
        router.replace('/(tabs)/rooms' as any);
      } catch {
        router.replace('/(tabs)/rooms' as any);
      }
    };

    loadSession();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation en fonction du statut de la session
  useEffect(() => {
    if (!session?.status) return;
    if (session.status === 'PLAYING') {
      router.replace(`/session/${code}/game` as any);
    } else if (session.status === 'LOBBY') {
      router.replace(`/session/${code}/lobby` as any);
    } else if (session.status === 'RESULTS') {
      router.replace(`/session/${code}/results` as any);
    } else if (session.status === 'CANCELLED') {
      if (session?.roomId) router.replace(`/room/${session.roomId}` as any);
      else router.replace('/(tabs)/rooms' as any);
    }
  }, [session?.status, session?.roomId, code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling adaptatif
  useEffect(() => {
    if (!session?.id) return;
    const ms = isConnected ? 5000 : 1500;
    const interval = setInterval(() => fetchSession(session.id), ms);
    return () => clearInterval(interval);
  }, [session?.id, fetchSession, isConnected]);

  const mascotLeft = `${Math.max(progress, 0)}%`;
  const statusHint = isComplete
    ? 'Toutes les questions sont générées !'
    : progress < 30
      ? "L'IA prépare vos questions personnalisées…"
      : progress < 60
        ? 'Encore un peu de patience…'
        : progress < 90
          ? 'Presque terminé !'
          : 'Dernières vérifications…';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32, paddingBottom: 80 }}>

        {/* Large percentage */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Text style={{ color: palette.primary, fontSize: 72, fontWeight: '600', lineHeight: 80 }}>
            {Math.round(progress)}%
          </Text>
          <Text style={{ color: palette.inkSoft, fontSize: 15, marginTop: 8 }}>
            {isComplete ? 'Questions prêtes !' : error ? error : 'Génération en cours…'}
          </Text>
        </View>

        {/* Progress bar + mascot (Animated.View comme curseur) */}
        <View style={{ width: '100%', maxWidth: 360, marginTop: 16 }}>
          {/* Mascot row */}
          <View style={{ height: 48, marginBottom: 4, position: 'relative' }}>
            {/* Mascot emoji cursor glissant sur la barre */}
            <Animated.View
              style={{
                position: 'absolute',
                bottom: 0,
                left: mascotLeft as any,
                transform: [{ translateX: -20 }, { translateY: bounceAnim }],
              }}
            >
              <Text style={{ fontSize: 32 }}>
                {error ? '😔' : isComplete ? '🎉' : '🏃'}
              </Text>
            </Animated.View>
          </View>

          {/* Clean progress bar */}
          <View style={{ height: 16, backgroundColor: palette.surface2, borderRadius: 9999, overflow: 'hidden', borderWidth: 1, borderColor: palette.line }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: `${Math.max(progress, 3)}%`,
                backgroundColor: palette.primary,
                borderRadius: 9999,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '600' }}>
              {isComplete
                ? 'Génération terminée !'
                : totalQuestions > 0
                  ? `Génération... ${currentQuestion} / ${totalQuestions}`
                  : 'Préparation…'}
            </Text>
            <Text style={{ color: isConnected ? palette.primary : palette.inkSoft, fontSize: 12, fontWeight: '600' }}>
              {isConnected ? '● Connecté' : '○ Connexion…'}
            </Text>
          </View>
        </View>

        {/* Status icon + hint */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: palette.primary + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            {isComplete
              ? <Sparkles size={26} color={palette.primary} />
              : <Zap size={26} color={palette.primary} />
            }
          </View>
          <Text style={{ color: palette.inkSoft, textAlign: 'center', fontSize: 14, maxWidth: 280, lineHeight: 22 }}>
            {statusHint}
          </Text>
        </View>

        {/* Règle du buzz anticipé */}
        <View style={{ marginTop: 28, width: '100%', maxWidth: 360 }}>
          <View style={{ padding: 14, backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line }}>
            <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 13.5, marginBottom: 4 }}>Règle du buzz anticipé</Text>
            <Text style={{ color: palette.inkSoft, fontSize: 12.5, lineHeight: 20 }}>
              Buzzer avant la fin de la lecture{' '}
              <Text style={{ color: palette.txt, fontWeight: '600' }}>et</Text>{' '}
              se tromper applique une pénalité de points.
            </Text>
            <View style={{ marginTop: 12, gap: 6 }}>
              <View style={{ padding: 8, borderRadius: 10, backgroundColor: palette.bad + '1A', borderWidth: 1, borderColor: palette.bad + '40' }}>
                <Text style={{ color: palette.bad, fontSize: 11.5, fontWeight: '700', marginBottom: 2 }}>Faux avec pénalité</Text>
                <Text style={{ color: palette.inkSoft, fontSize: 11.5 }}>Buzz trop tôt + mauvaise réponse → retrait de points.</Text>
              </View>
              <View style={{ padding: 8, borderRadius: 10, backgroundColor: palette.primary + '18', borderWidth: 1, borderColor: palette.primary + '40' }}>
                <Text style={{ color: palette.primary, fontSize: 11.5, fontWeight: '700', marginBottom: 2 }}>Faux sans pénalité</Text>
                <Text style={{ color: palette.inkSoft, fontSize: 11.5 }}>Mauvaise réponse après lecture complète → aucun retrait.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Error recovery */}
        {error && !error.includes('secours') && (
          <View style={{ marginTop: 32, width: '100%', maxWidth: 360 }}>
            <View style={{ padding: 16, backgroundColor: palette.bad + '26', borderRadius: 12, borderWidth: 1, borderColor: palette.bad + '40', marginBottom: 16 }}>
              <Text style={{ color: palette.bad, textAlign: 'center' }}>{error}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.replace(`/session/${code}/lobby` as any)}
                activeOpacity={0.7}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface2, paddingVertical: 14, borderRadius: 12, gap: 8 }}
              >
                <ArrowLeft size={18} color={palette.txt} />
                <Text style={{ color: palette.txt, fontWeight: '600' }}>Retour au lobby</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  setRealProgress(0);
                  setSimulatedProgress(0);
                  setCurrentQuestion(0);
                  setTotalQuestions(0);
                  if (session?.id) fetchSession(session.id);
                }}
                activeOpacity={0.8}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, paddingVertical: 14, borderRadius: 12, gap: 8 }}
              >
                <RefreshCw size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Manager cancel */}
        {isManager && session?.status === 'GENERATING' && (
          <View style={{ width: '100%', maxWidth: 360, marginTop: 32 }}>
            <TouchableOpacity
              onPress={async () => {
                if (!session?.id || isCancelling) return;
                setIsCancelling(true);
                try {
                  await cancelGeneration(session.id);
                  await fetchSession(session.id);
                } catch {
                  setError("Échec de l'annulation de la génération");
                } finally {
                  setIsCancelling(false);
                }
              }}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bad, paddingVertical: 14, borderRadius: 12 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {isCancelling ? 'Annulation…' : 'Arrêter la génération'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ marginTop: 32 }}>
          <Text style={{ color: palette.inkSoft, fontSize: 12, opacity: 0.4 }}>Session {code}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
