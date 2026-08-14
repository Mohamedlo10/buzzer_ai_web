import { View, Text, TouchableOpacity } from 'react-native';
import { palette } from '~/lib/theme/tokens';
import type { SessionRankingEntry } from '~/types/api';

const MEDALS = [palette.gold, '#C0C0C0', '#CD7F32'];
const PODIUM_HEIGHT: Record<number, number> = { 1: 150, 2: 120, 3: 96 };

interface PodiumProps {
  rankings: SessionRankingEntry[];
  currentUserId?: string;
  onPlayerTap?: (entry: SessionRankingEntry) => void;
}

export function Podium({ rankings, currentUserId, onPlayerTap }: PodiumProps) {
  if (rankings.length < 1) return null;

  const top3 = rankings.slice(0, 3);
  const displayOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
  : [top3[0]];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginTop: 4, marginBottom: 8, paddingHorizontal: 4 }}>
      {displayOrder.map((entry) => {
        const rank = rankings.findIndex((r) => r.player.id === entry.player.id) + 1;
        const medal = MEDALS[rank - 1] ?? palette.primary;
        const height = PODIUM_HEIGHT[rank] ?? 100;
        const isYou = (entry.player.userId ?? entry.player.id) === currentUserId;

        return (
          <TouchableOpacity
            key={entry.player.id}
            onPress={() => onPlayerTap?.(entry)}
            activeOpacity={0.8}
            style={{ flex: 1, minWidth: 0, alignItems: 'center' }}
          >
            {rank === 1 && (
              <Text style={{ fontSize: 22, lineHeight: 28, marginBottom: 2 }}>👑</Text>
            )}
            
            <View style={{ width: rank === 1 ? 54 : 44, height: rank === 1 ? 54 : 44, borderRadius: rank === 1 ? 27 : 22, backgroundColor: palette.surface2, borderWidth: 2, borderColor: medal, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <Text style={{ color: palette.txt, fontWeight: '700', fontSize: rank === 1 ? 20 : 16 }}>{entry.player.name.charAt(0).toUpperCase()}</Text>
            </View>

            <Text style={{ fontSize: 12.5, fontWeight: '700', textAlign: 'center', color: palette.txt, marginBottom: 4 }} numberOfLines={1}>
              {isYou ? 'Toi' : entry.player.name}
            </Text>

            <View
              style={{
                width: '100%',
                height,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                backgroundColor: medal + '33', // Simplified gradient via opacity
                borderTopWidth: 2,
                borderColor: medal,
                alignItems: 'center',
                paddingTop: 8,
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 24, color: medal }}>{rank}</Text>
              <Text style={{ fontWeight: '700', fontSize: 13, color: palette.txt, marginTop: 4 }}>{entry.finalScore}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
