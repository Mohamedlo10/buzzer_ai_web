import { View, Text, TouchableOpacity } from 'react-native';
import { Users } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import { teamColor as resolveTeamColor } from '~/lib/game/teamColors';
import type { PlayerResponse, TeamResponse } from '~/types/api';

interface TeamLeaderboardProps {
  teams: TeamResponse[];
  players: PlayerResponse[];
  currentUserId?: string;
  compact?: boolean;
  onCorrectClick?: () => void;
}

export function TeamLeaderboard({ teams, players, currentUserId, compact = false, onCorrectClick }: TeamLeaderboardProps) {
  // Le score d'équipe vient du serveur (`GameService.buildTeamInfos`), il n'est pas
  // recalculé ici.
  //
  // La version client qui existait auparavant additionnait tous les membres, alors que le
  // serveur **exclut les spectateurs** : un spectateur rattaché à une équipe gonflait donc
  // le score affiché par rapport au score officiel du classement. C'est exactement le
  // genre de seconde vérité que le §28 interdit — deux implémentations d'une même règle,
  // dont une seule fait autorité.
  //
  // Le regroupement des membres reste local : c'est de la mise en forme, pas une règle
  // métier, et le serveur ne renvoie pas d'ordre d'affichage.
  const teamStandings = teams
    .map((t) => ({
      ...t,
      members: players.filter((p) => p.teamId === t.id).sort((a, b) => b.score - a.score),
      totalScore: t.score ?? 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const maxTotal = teamStandings.length > 0 ? Math.max(1, teamStandings[0].totalScore) : 1;

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Users size={16} color={palette.indigo} />
          <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 15, paddingTop: 2 }}>Classement équipes</Text>
        </View>
        {onCorrectClick ? (
          <TouchableOpacity
            onPress={onCorrectClick}
            activeOpacity={0.7}
            style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: palette.warn + '1A', borderWidth: 1, borderColor: palette.warn + '50' }}
          >
            <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.warn, fontSize: 12, fontWeight: '600' }}>✎ Corriger</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 13 }}>{teamStandings.length} équipes</Text>
        )}
      </View>

      {/* Rows */}
      {teamStandings.map((team, index) => {
        const isMyTeam = team.members.some((m) => m.userId === currentUserId);
        const tColor = resolveTeamColor(team.color);
        const widthPercent = Math.min(100, Math.round((team.totalScore / maxTotal) * 100));

        return (
          <View
            key={team.id}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: index < teamStandings.length - 1 ? 1 : 0,
              borderBottomColor: palette.line,
              backgroundColor: isMyTeam ? tColor + '0D' : 'transparent',
            }}
          >
            {/* Progress bar background */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: `${widthPercent}%`,
                backgroundColor: tColor,
                opacity: 0.12,
              }}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                {/* Rank badge */}
                <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: tColor, alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                  <Text style={{ fontFamily: font.nativeFamily.display, color: '#FFFFFF', fontSize: 13, paddingTop: 2 }}>{index + 1}</Text>
                </View>
                {/* Dot */}
                <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: tColor, marginRight: 8, flexShrink: 0 }} />
                {/* Name */}
                <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.txt, fontWeight: '700', fontSize: 14.5, flex: 1 }} numberOfLines={1}>{team.name}</Text>
              </View>
              {/* Score */}
              <Text style={{ fontFamily: font.nativeFamily.display, color: tColor, fontSize: 16, fontVariant: ['tabular-nums'], marginLeft: 8, paddingTop: 2 }}>
                {team.totalScore}
                <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 11 }}> pts</Text>
              </Text>
            </View>

            {/* Members (condensé) */}
            {!compact && team.members.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {team.members.slice(0, 5).map((m) => (
                  <Text key={m.id} style={{ fontFamily: font.nativeFamily.ui, fontSize: 11, color: palette.inkSoft, backgroundColor: palette.surface2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 }}>
                    {m.name}
                  </Text>
                ))}
                {team.members.length > 5 && (
                  <Text style={{ fontFamily: font.nativeFamily.ui, fontSize: 11, color: palette.inkSoft }}>+{team.members.length - 5}</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
