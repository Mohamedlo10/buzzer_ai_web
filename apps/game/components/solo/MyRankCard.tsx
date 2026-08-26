import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, ChevronRight, TrendingUp } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import type { GlobalRanking } from '~/types/api';

interface MyRankCardProps {
  myRank?: number;
  myScore?: number;
  myUsername?: string;
  topRankings?: GlobalRanking[];
}

export function MyRankCard({
  myRank = 1,
  myScore = 0,
  myUsername = 'Moi',
  topRankings = [],
}: MyRankCardProps) {
  const router = useRouter();

  const rankDisplay = myRank && myRank > 0 ? `#${myRank}` : '#—';

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 18,
        gap: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trophy size={16} color={palette.gold} />
          <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt }}>
            Mon Classement
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/(tabs)/rankings')} activeOpacity={0.7}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: palette.primary }}>
            complet →
          </Text>
        </TouchableOpacity>
      </View>

      {/* User's Own Highlight Banner */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: palette.bg,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
          <View
            style={{
              backgroundColor: palette.gold + '22',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              minWidth: 42,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: palette.gold }}>
              {rankDisplay}
            </Text>
          </View>
          <Avatar name={myUsername} size={32} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }} numberOfLines={1}>
              {myUsername}
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft }}>
              Ta position globale
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 12,
            lineHeight: 20,
            color: palette.txt,
            paddingTop: 2,
          }}
        >
          {myScore.toLocaleString('fr-FR')} pts
        </Text>
      </View>

      {/* Top 3 Competitors Preview */}
      {topRankings.length > 0 && (
        <View style={{ gap: 2, paddingTop: 4 }}>
          {topRankings.map((r, i) => {
            const isMe = r.username.toLowerCase() === myUsername.toLowerCase();
            return (
              <View
                key={r.userId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderBottomWidth: i < topRankings.length - 1 ? 1 : 0,
                  borderBottomColor: palette.line,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 }}>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      fontSize: 10,
                      lineHeight: 18,
                      color: i === 0 ? palette.gold : palette.inkSoft,
                      minWidth: 28,
                      paddingTop: 2,
                    }}
                  >
                    #{i + 1}
                  </Text>
                  <Avatar name={r.username} size={32} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isMe ? '800' : '600',
                      color: isMe ? palette.primary : palette.txt,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {r.username} {isMe ? '(Moi)' : ''}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 10,
                    lineHeight: 16,
                    color: palette.txt,
                    paddingTop: 2,
                  }}
                >
                  {r.totalScore.toLocaleString('fr-FR')} pts
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
