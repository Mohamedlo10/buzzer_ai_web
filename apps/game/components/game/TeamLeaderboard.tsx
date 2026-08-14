import { View, Text, TouchableOpacity } from 'react-native';
import { Users } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
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
  const teamStandings = teams
    .map((t) => {
      const members = players.filter((p) => p.teamId === t.id).sort((a, b) => b.score - a.score);
      const totalScore = members.reduce((sum, m) => sum + m.score, 0);
      return { ...t, members, totalScore };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const maxTotal = teamStandings.length > 0 ? Math.max(1, teamStandings[0].totalScore) : 1;

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Users size={16} color={palette.indigo} />
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>Classement équipes</Text>
        </View>
        {onCorrectClick ? (
          <TouchableOpacity
            onPress={onCorrectClick}
            activeOpacity={0.7}
            style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: palette.warn + '1A', borderWidth: 1, borderColor: palette.warn + '50' }}
          >
            <Text style={{ color: palette.warn, fontSize: 12, fontWeight: '600' }}>✎ Corriger</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '600' }}>{teamStandings.length} équipes</Text>
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
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{index + 1}</Text>
                </View>
                {/* Dot */}
                <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: tColor, marginRight: 8, flexShrink: 0 }} />
                {/* Name */}
                <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14.5, flex: 1 }} numberOfLines={1}>{team.name}</Text>
              </View>
              {/* Score */}
              <Text style={{ color: tColor, fontWeight: '700', fontSize: 16, fontVariant: ['tabular-nums'], marginLeft: 8 }}>
                {team.totalScore}
                <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '400' }}> pts</Text>
              </Text>
            </View>

            {/* Members (condensé) */}
            {!compact && team.members.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {team.members.slice(0, 5).map((m) => (
                  <Text key={m.id} style={{ fontSize: 11, color: palette.inkSoft, backgroundColor: palette.surface2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 }}>
                    {m.name}
                  </Text>
                ))}
                {team.members.length > 5 && (
                  <Text style={{ fontSize: 11, color: palette.inkSoft }}>+{team.members.length - 5}</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
