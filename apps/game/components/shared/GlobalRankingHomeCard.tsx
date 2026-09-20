import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, ChevronRight, Crown, Award } from 'lucide-react-native';
import { useGlobalRankings, useMyGlobalRank } from '~/lib/query/hooks';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from './Avatar';

export function GlobalRankingHomeCard() {
  const router = useRouter();
  const { data: globalData, isLoading: isGlobalLoading } = useGlobalRankings(0);
  const { data: myRank, isLoading: isMyRankLoading } = useMyGlobalRank();

  const top3 = (globalData?.content ?? []).slice(0, 3);
  const userRank = myRank?.rank;
  const userElo = myRank?.glickoRating !== undefined ? Math.round(Number(myRank.glickoRating)) : 1500;
  const userWins = myRank?.totalWins ?? 0;
  const userGames = myRank?.totalGames ?? 0;
  const userWinRate = myRank?.winRate !== undefined ? Math.round(Number(myRank.winRate)) : (userGames > 0 ? Math.round((userWins / userGames) * 100) : 0);

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/rankings' as any)}
      activeOpacity={0.88}
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        gap: 14,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(232, 166, 48, 0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={16} color={palette.gold} />
          </View>
          <View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 16,
                letterSpacing: -0.2,
                color: palette.txt,
              }}
            >
              Classement Mondial
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft }}>
              Performances multijoueurs globales
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9999,
            backgroundColor: palette.surface2,
          }}
        >
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.primary }}>
            Voir tout
          </Text>
          <ChevronRight size={13} color={palette.primary} />
        </View>
      </View>

      {/* Ton Rang Highlight */}
      <View
        style={{
          backgroundColor: `${palette.primary}0D`,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: `${palette.primary}2E`,
          paddingVertical: 10,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: palette.primary, textTransform: 'uppercase' }}>
            Ta position mondiale
          </Text>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 17,
              lineHeight: 23,
              color: palette.txt,
              paddingTop: 1,
            }}
          >
            {userRank ? `Rang #${userRank}` : 'Non classé'}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: palette.txt }}>
            {userElo} ELO
          </Text>
          <Text style={{ fontSize: 11, color: palette.inkSoft }}>
            {userWins} victoires ({userWinRate}%)
          </Text>
        </View>
      </View>

      {/* Top 3 Preview Row */}
      {top3.length > 0 && (
        <View style={{ paddingTop: 2 }}>
          <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, color: palette.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>
            Podium mondial actuel
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {top3.map((player, idx) => {
              const medals = ['🥇', '🥈', '🥉'];
              const isGold = idx === 0;
              const playerElo = player.glickoRating !== undefined ? Math.round(Number(player.glickoRating)) : 1500;

              return (
                <View
                  key={player.userId || idx}
                  style={{
                    flex: 1,
                    backgroundColor: palette.bg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isGold ? palette.gold : palette.line,
                    paddingVertical: 8,
                    paddingHorizontal: 6,
                    alignItems: 'center',
                  }}
                >
                  <View style={{ position: 'relative', marginBottom: 4 }}>
                    <Avatar
                      name={player.username}
                      avatarSpec={player.avatarSpec}
                      avatarUrl={player.avatarUrl}
                      size={32}
                    />
                    <Text style={{ position: 'absolute', bottom: -6, right: -6, fontSize: 12 }}>
                      {medals[idx]}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '700',
                      color: palette.txt,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {player.username}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: palette.primary, marginTop: 1 }}>
                    {playerElo} ELO
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
