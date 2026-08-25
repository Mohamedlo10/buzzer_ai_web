import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import type { SessionRankingEntry } from '~/types/api';

const MEDALS = [palette.gold, '#C0C0C0', '#CD7F32'];
const PODIUM_HEIGHT: Record<number, number> = { 1: 155, 2: 125, 3: 100 };

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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10,
        marginBottom: 8,
        paddingHorizontal: 8,
      }}
    >
      {displayOrder.map((entry) => {
        const rank = rankings.findIndex((r) => r.player.id === entry.player.id) + 1;
        const medal = MEDALS[rank - 1] ?? palette.primary;
        const height = PODIUM_HEIGHT[rank] ?? 100;
        const isYou = (entry.player.userId ?? entry.player.id) === currentUserId;
        const isFirst = rank === 1;

        return (
          <TouchableOpacity
            key={entry.player.id}
            onPress={() => onPlayerTap?.(entry)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              maxWidth: 140,
              minWidth: 0,
              alignItems: 'center',
            }}
          >
            {/* Crown for 1st place */}
            <View style={{ height: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
              {isFirst ? (
                <Text style={{ fontSize: 22, lineHeight: 26 }}>👑</Text>
              ) : null}
            </View>

            {/* Avatar with medal ring */}
            <View style={{ marginBottom: 6 }}>
              <Avatar
                name={entry.player.name}
                avatarUrl={entry.player.avatarUrl}
                size={isFirst ? 56 : 46}
                ring={medal}
              />
            </View>

            {/* Name */}
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontSize: 13,
                fontWeight: '700',
                textAlign: 'center',
                color: isYou ? palette.primary : palette.txt,
                marginBottom: 6,
                paddingHorizontal: 4,
              }}
              numberOfLines={1}
            >
              {isYou ? 'Toi' : entry.player.name}
            </Text>

            {/* Pillar */}
            <View
              style={{
                width: '100%',
                height,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                backgroundColor: isFirst
                  ? palette.gold + '2E'
                  : rank === 2
                  ? '#C0C0C024'
                  : '#CD7F3224',
                borderWidth: 1.5,
                borderBottomWidth: 0,
                borderColor: medal,
                alignItems: 'center',
                paddingTop: 10,
                gap: 4,
                shadowColor: medal,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: isFirst ? 0.2 : 0.1,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: isFirst ? 30 : 24,
                  color: medal,
                  lineHeight: isFirst ? 36 : 30,
                  paddingTop: 4,
                  paddingBottom: 2,
                }}
              >
                {rank}
              </Text>
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 13,
                  color: palette.txt,
                  paddingTop: 2,
                }}
              >
                {entry.correctAnswers != null && entry.rawCorrectAnswers != null
                  ? `${entry.correctAnswers} rép.`
                  : `${entry.finalScore} pts`}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
