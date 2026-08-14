import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import type { PlayerResponse } from '~/types/api';

const MEDAL_COLORS = [palette.goldBright, palette.silver, palette.bronze];

interface LiveLeaderboardProps {
  players: PlayerResponse[];
  currentUserId?: string;
  onPlayerTap?: (player: PlayerResponse) => void;
  onCorrectClick?: () => void;
}

export function LiveLeaderboard({ players, currentUserId, onPlayerTap, onCorrectClick }: LiveLeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trophy size={15} color={palette.goldBright} />
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>Classement</Text>
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
          <Text style={{ color: palette.inkSoft, fontSize: 12 }}>{players.length} joueurs</Text>
        )}
      </View>

      {/* Top 3 */}
      {top3.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: rest.length > 0 ? 1 : 0, borderBottomColor: palette.line }}>
          {top3.map((player, index) => {
            const isYou = player.userId === currentUserId;
            const medalColor = MEDAL_COLORS[index];
            const initial = player.name?.charAt(0).toUpperCase() || '?';
            return (
              <TouchableOpacity
                key={player.id}
                onPress={() => onPlayerTap?.(player)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isYou ? palette.primary : palette.line,
                  backgroundColor: isYou ? palette.primary + '1E' : palette.bg,
                }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: medalColor + '33', borderWidth: 2, borderColor: medalColor, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: medalColor, fontWeight: '700', fontSize: 14 }}>{initial}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', textAlign: 'center', color: palette.txt }} numberOfLines={1}>
                  {isYou ? 'Toi' : player.name}
                </Text>
                <Text style={{ fontWeight: '600', fontSize: 14, color: medalColor }}>
                  {player.score}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Rest */}
      {rest.map((player, index) => {
        const isYou = player.userId === currentUserId;
        return (
          <TouchableOpacity
            key={player.id}
            onPress={() => onPlayerTap?.(player)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderBottomWidth: index < rest.length - 1 ? 1 : 0,
              borderBottomColor: palette.line,
              backgroundColor: isYou ? palette.primary + '16' : 'transparent',
            }}
          >
            <Text style={{ width: 18, textAlign: 'center', fontWeight: '600', fontSize: 14, color: palette.inkSoft }}>
              {index + 4}
            </Text>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isYou ? palette.primary : palette.line }}>
              <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 12 }}>{player.name?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: isYou ? palette.primary : palette.txt }} numberOfLines={1}>
              {isYou ? 'Toi (Vous)' : player.name}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: palette.txt }}>
              {player.score}{' '}
              <Text style={{ color: palette.inkSoft, fontSize: 10 }}>pts</Text>
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
