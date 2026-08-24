import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Eye, Crown, Users, Trash2 } from 'lucide-react-native';
import { Avatar } from '~/components/shared/Avatar';
import { palette, font } from '~/lib/theme/tokens';
import type { PlayerResponse } from '~/types/api';

export interface PlayerGridProps {
  players: PlayerResponse[];
  currentUserId?: string;
  isManager: boolean;
  questionMode?: string;
  sessionMode?: string;
  avatarMap: Record<string, string | null>;
  kickingPlayerId: string | null;
  onSelectPlayer: (player: PlayerResponse) => void;
  onEditCategories: (player: PlayerResponse) => void;
  onKickPlayer: (playerId: string, playerName: string) => void;
}

export function PlayerGrid({
  players,
  currentUserId,
  isManager,
  questionMode,
  sessionMode,
  avatarMap,
  kickingPlayerId,
  onSelectPlayer,
  onEditCategories,
  onKickPlayer,
}: PlayerGridProps) {
  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 18,
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
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            color: palette.inkSoft,
            textTransform: 'uppercase',
          }}
        >
          Joueurs connectés
        </Text>
        <View
          style={{
            backgroundColor: `${palette.inkSoft}15`,
            paddingHorizontal: 9,
            paddingVertical: 2,
            borderRadius: 9999,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: palette.txt }}>
            {players.length}
          </Text>
        </View>
      </View>

      {/* Grid of Players (Matching user reference) */}
      {players.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-start',
            paddingVertical: 4,
          }}
        >
          {players.map((player) => {
            const isYou = player.userId === currentUserId;
            const avatarUrl = player.userId
              ? (avatarMap[player.userId] ?? player.avatarUrl)
              : player.avatarUrl;

            return (
              <TouchableOpacity
                key={player.id}
                onPress={() => onSelectPlayer(player)}
                activeOpacity={0.7}
                style={{
                  alignItems: 'center',
                  width: 72,
                  gap: 6,
                }}
              >
                {/* Avatar with status rings */}
                <View style={{ position: 'relative' }}>
                  {player.isSpectator ? (
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: `${palette.indigo}18`,
                        borderWidth: 2,
                        borderColor: palette.indigo,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Eye size={22} color={palette.indigo} />
                    </View>
                  ) : (
                    <View
                      style={{
                        borderRadius: 30,
                        borderWidth: 2.5,
                        borderColor: isYou
                          ? palette.primary
                          : player.isManager
                            ? palette.gold
                            : 'transparent',
                        padding: 1.5,
                      }}
                    >
                      <Avatar name={player.name} avatarUrl={avatarUrl} size={54} />
                    </View>
                  )}

                  {/* Host Crown Badge */}
                  {player.isManager && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -2,
                        backgroundColor: palette.gold,
                        borderRadius: 10,
                        padding: 3,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                      <Crown size={10} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  )}
                </View>

                {/* Name underneath */}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isYou ? '800' : '700',
                    color: isYou ? palette.primary : palette.txt,
                    textAlign: 'center',
                    maxWidth: 72,
                  }}
                  numberOfLines={1}
                >
                  {isYou ? 'Toi' : player.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
          <Users size={28} color={palette.inkSoft} />
          <Text style={{ fontSize: 13, color: palette.inkSoft, marginTop: 8 }}>
            En attente de joueurs…
          </Text>
        </View>
      )}

      {/* Manager Actions Bar if multiple players */}
      {isManager && players.length > 1 && (
        <View
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: palette.line,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 11.5, color: palette.inkSoft, fontStyle: 'italic' }}>
            Appuie sur un joueur pour le gérer ou l&apos;exclure
          </Text>
        </View>
      )}
    </View>
  );
}
