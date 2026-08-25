import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, Crown, Eye, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, font } from '~/lib/theme/tokens';
import { teamColor } from '~/lib/game/teamColors';
import type { PlayerResponse, QuestionResponse, SessionResponse, TeamResponse } from '~/types/api';

interface GameHeaderProps {
  session: SessionResponse;
  currentQuestion: QuestionResponse;
  questionIndex: number;
  isConnected: boolean;
  isManager: boolean;
  isSpectator: boolean;
  currentPlayer: PlayerResponse | undefined;
  teams: TeamResponse[];
}

export function GameHeader({
  session,
  currentQuestion,
  questionIndex,
  isConnected,
  isManager,
  isSpectator,
  currentPlayer,
  teams,
}: GameHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sessionMode = session.sessionMode ?? 'WITH_MODERATOR';
  const isWithoutModerator = sessionMode === 'WITHOUT_MODERATOR';
  const isTeamMode = session.isTeamMode ?? false;

  return (
    <View style={{ backgroundColor: palette.bg, paddingTop: insets.top + 8, paddingBottom: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: palette.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity
          onPress={() => {
            if (session.roomId) router.replace(`/room/${session.roomId}` as any);
            else router.replace('/(tabs)/rooms' as any);
          }}
          activeOpacity={0.7}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 17, lineHeight: 26, paddingTop: 3 }}>
            Question {questionIndex + 1}
            {session.totalQuestions > 0 && (
              <Text style={{ color: palette.inkSoft, fontSize: 14 }}> / {session.totalQuestions}</Text>
            )}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isConnected ? palette.primary : palette.bad }} />
            <Text style={{ color: palette.inkSoft, fontSize: 11, fontWeight: '500' }}>{isConnected ? 'Connecté' : 'Déconnecté'}</Text>
          </View>
        </View>

        {isManager && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: palette.gold + '20', borderWidth: 1, borderColor: palette.gold + '50', flexShrink: 0 }}>
            <Crown size={10} color={palette.goldBright} fill={palette.goldBright} />
            <Text style={{ fontFamily: font.nativeFamily.display, color: palette.gold, fontSize: 11, paddingTop: 2 }}>
              {isWithoutModerator ? 'Host' : 'Manager'}
            </Text>
          </View>
        )}
        {isSpectator && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: palette.gold + '20', flexShrink: 0 }}>
            <Eye size={10} color={palette.gold} />
            <Text style={{ fontFamily: font.nativeFamily.display, color: palette.gold, fontSize: 11, paddingTop: 2 }}>Spectateur</Text>
          </View>
        )}
      </View>

      {/* Tags */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: palette.primary + '20', borderWidth: 1, borderColor: palette.primary + '50' }}>
          <Text style={{ color: palette.primary, fontSize: 11, fontWeight: '600' }}>{currentQuestion?.category}</Text>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.line }}>
          <Text style={{ color: palette.inkSoft, fontSize: 11, fontWeight: '600' }}>{currentQuestion?.difficulty}</Text>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: isWithoutModerator ? palette.violet + '20' : palette.warn + '20', borderWidth: 1, borderColor: isWithoutModerator ? palette.violet + '50' : palette.warn + '50' }}>
          <Text style={{ color: isWithoutModerator ? palette.violet : palette.warn, fontSize: 11, fontWeight: '600' }}>
            {isWithoutModerator ? 'Sans modérateur' : 'Avec modérateur'}
          </Text>
        </View>
        {isTeamMode && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: palette.indigo + '20', borderWidth: 1, borderColor: palette.indigo + '50' }}>
            <Text style={{ color: palette.indigo, fontSize: 11, fontWeight: '600' }}>Équipes</Text>
          </View>
        )}
        {isTeamMode && currentPlayer?.teamId && (() => {
          const myTeam = teams.find((t) => t.id === currentPlayer.teamId);
          if (!myTeam) return null;
          const tColor = teamColor(myTeam.color);
          return (
            <View key="team-tag" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: tColor + '20', borderWidth: 1, borderColor: tColor + '50' }}>
              <Users size={11} color={tColor} />
              <Text style={{ color: tColor, fontSize: 11, fontWeight: '700' }}>{myTeam.name}</Text>
            </View>
          );
        })()}
      </View>
    </View>
  );
}

