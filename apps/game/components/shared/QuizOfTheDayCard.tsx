import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Trophy } from 'lucide-react-native';
import { useDailyToday } from '~/lib/query/hooks';
import { palette, font } from '~/lib/theme/tokens';
import { PatternZigzag } from './PatternZigzag';

export interface ActiveRoomSummary {
  id: string | number;
  name: string;
  ownerName: string;
  memberCount: number;
}

interface QuizOfTheDayCardProps {
  activeRoom?: ActiveRoomSummary | null;
}

/**
 * Carte du Défi du Jour — action principale de l'accueil (§16).
 *
 * Trois états, tous pilotés par le serveur :
 *   • partie active dans un salon → raccourci vers cette partie
 *   • défi disponible             → « JOUER »
 *   • défi déjà terminé           → score, rang, et accès au classement
 *
 * Plus aucune valeur en dur. Le titre, le nombre de questions et le total de points
 * viennent de GET /api/daily/today : la carte affichait auparavant « Lutte sénégalaise »
 * et « +1 200 pts » codés en dur, et menait vers la Carrière — un module reporté.
 */
export function QuizOfTheDayCard({ activeRoom = null }: QuizOfTheDayCardProps) {
  const router = useRouter();
  const { data: daily } = useDailyToday();

  const isLive = !!activeRoom;
  const challenge = daily?.challenge ?? null;
  const attempt = daily?.myAttempt ?? null;
  const isCompleted = attempt?.status === 'COMPLETED';

  // Sans édition du jour, la carte n'a rien à proposer : la section disparaît plutôt
  // que d'afficher un bouton qui ne mène nulle part.
  if (!isLive && !challenge) return null;

  const estimated = challenge
    ? `${challenge.questionCount} questions · ${challenge.estimatedMinutes} min · +${challenge.maxPoints} pts`
    : '';

  return (
    <TouchableOpacity
      onPress={() => {
        if (isLive) {
          router.push(`/room/${activeRoom!.id}` as any);
        } else {
          router.push('/daily' as any);
        }
      }}
      activeOpacity={0.9}
      style={{
        backgroundColor: isLive ? palette.primary : (isCompleted ? palette.good : palette.indigo),
        borderRadius: 24,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <PatternZigzag color="#FFFFFF" opacity={0.18} size={20} />

      <View style={{ position: 'relative', zIndex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#FFFFFF',
            opacity: 0.8,
            fontWeight: '700',
            marginBottom: 6,
          }}
        >
          {isLive ? 'Partie active' : (isCompleted ? '✓ Défi terminé' : '🔥 Défi du jour')}
        </Text>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 22,
            lineHeight: 30,
            color: '#FFFFFF',
            paddingTop: 4,
            marginBottom: 2,
          }}
        >
          {isLive
            ? activeRoom!.name
            : isCompleted
              ? `${attempt!.score} / ${challenge!.maxPoints} pts`
              : (challenge!.theme ?? 'Défi du jour')}
        </Text>

        <Text
          style={{
            fontFamily: font.nativeFamily.serif,
            fontStyle: 'italic',
            fontSize: 16,
            color: '#FFFFFF',
            opacity: 0.9,
            marginBottom: 14,
          }}
        >
          {isLive
            ? `Hôte: ${activeRoom!.ownerName}`
            : isCompleted
              ? (attempt!.rank != null
                  // §14 : ne jamais inventer un rang. Tant que l'édition n'est pas close,
                  // le serveur n'en renvoie pas et on n'en affiche pas.
                  ? `🏆 #${attempt!.rank} aujourd'hui`
                  : `${attempt!.correctCount} bonnes réponses`)
              : (challenge!.difficulty ?? '')}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11.5, color: '#FFFFFF', opacity: 0.85, fontWeight: '500' }}>
            {isLive ? `${activeRoom!.memberCount} membres · En direct` : estimated}
          </Text>

          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 9999,
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>
              {isLive ? 'Rejoindre' : (isCompleted ? 'Classement' : 'Jouer')}
            </Text>
            {isCompleted && !isLive
              ? <Trophy size={14} color={palette.txt} />
              : <ArrowRight size={14} color={palette.txt} />}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
