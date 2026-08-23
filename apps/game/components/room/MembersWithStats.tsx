import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Crown, Medal, UserPlus } from 'lucide-react-native';
import { Avatar } from '~/components/shared/Avatar';
import { palette, font } from '~/lib/theme/tokens';
import type { RoomDetailResponse } from '~/types/api';

export interface MembersWithStatsProps {
  members: RoomDetailResponse['members'];
  rankings: RoomDetailResponse['rankings'];
  currentUserId: string;
  onAddFriend: (userId: string, username: string) => void;
  onSelectUser?: (member: RoomDetailResponse['members'][number]) => void;
}

export function MembersWithStats({
  members,
  rankings,
  currentUserId,
  onAddFriend,
  onSelectUser,
}: MembersWithStatsProps) {
  const merged = members
    .map((m) => {
      const rank = rankings.find((r) => r.userId === m.userId);
      const ratio = rank && rank.gamesPlayed > 0 ? rank.totalScore / rank.gamesPlayed : 0;
      return { member: m, rank, ratio };
    })
    .sort((a, b) => b.ratio - a.ratio);

  const rankColors = [palette.gold, '#C0C0C0', '#CD7F32'];

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: palette.inkSoft, textTransform: 'uppercase' }}>
          Membres du salon
        </Text>
        <View
          style={{
            backgroundColor: palette.bg,
            borderWidth: 1,
            borderColor: palette.line,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 9999,
          }}
        >
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.txt }}>
            {members.length}
          </Text>
        </View>
      </View>

      {/* Member rows */}
      <View style={{ gap: 8 }}>
        {merged.map(({ member, rank, ratio }, index) => {
          const isCurrentUser = member.userId === currentUserId;
          const hasPlayed = (rank?.gamesPlayed ?? 0) > 0;
          const medalColor = rankColors[index] ?? palette.inkSoft;

          return (
            <TouchableOpacity
              key={member.id}
              onPress={() => onSelectUser?.(member)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: isCurrentUser ? `${palette.primary}0D` : palette.bg,
                borderWidth: 1,
                borderColor: isCurrentUser ? `${palette.primary}33` : palette.line,
              }}
            >
              {/* Left rank + avatar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 22, alignItems: 'center', justifyContent: 'center' }}>
                  {index === 0 && hasPlayed ? (
                    <Crown size={15} color={palette.gold} fill={palette.gold} />
                  ) : index === 1 && hasPlayed ? (
                    <Medal size={15} color="#A0A0A0" />
                  ) : index === 2 && hasPlayed ? (
                    <Medal size={15} color="#CD7F32" />
                  ) : (
                    <Text style={{ fontSize: 12, fontWeight: '700', color: palette.inkSoft }}>
                      {index + 1}
                    </Text>
                  )}
                </View>

                <View style={{ position: 'relative' }}>
                  <Avatar name={member.username} avatarUrl={member.avatarUrl} size={36} />
                  <View
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      borderWidth: 2,
                      borderColor: palette.surface,
                      backgroundColor: member.isOnline ? palette.good : palette.inkSoft,
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: isCurrentUser ? palette.primary : palette.txt,
                      }}
                      numberOfLines={1}
                    >
                      {member.username}
                    </Text>
                    {member.isOwner && (
                      <View style={{ backgroundColor: `${palette.gold}22`, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ color: palette.gold, fontSize: 10, fontWeight: '800' }}>CHEF</Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 1 }}>
                    {member.isOnline ? 'En ligne' : 'Hors ligne'}
                    {hasPlayed ? ` · ${rank!.gamesPlayed} partie${rank!.gamesPlayed > 1 ? 's' : ''}` : ''}
                  </Text>
                </View>
              </View>

              {/* Right stats */}
              {hasPlayed && (
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: medalColor }}>
                    {Math.round(ratio)} <Text style={{ fontSize: 10, color: palette.inkSoft, fontWeight: '400' }}>moy</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: palette.inkSoft }}>
                    {rank!.gamesWon} 🏆
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
