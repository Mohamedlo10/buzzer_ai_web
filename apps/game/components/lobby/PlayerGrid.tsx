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
        borderRadius: 22,
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
          Joueurs connectés
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
            {players.length}
          </Text>
        </View>
      </View>

      {/* Players List / Grid */}
      {players.length > 0 ? (
        <View style={{ gap: 8 }}>
          {players.map((player) => {
            const isYou = player.userId === currentUserId;
            const isKicking = kickingPlayerId === player.id;
            const avatarUrl = player.userId
              ? (avatarMap[player.userId] ?? player.avatarUrl)
              : player.avatarUrl;

            return (
              <View
                key={player.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isYou ? `${palette.primary}0D` : palette.bg,
                  borderWidth: 1,
                  borderColor: isYou ? `${palette.primary}33` : palette.line,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => onSelectPlayer(player)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                >
                  <View style={{ position: 'relative' }}>
                    {player.isSpectator ? (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: `${palette.indigo}18`,
                          borderWidth: 1,
                          borderColor: palette.indigo,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Eye size={18} color={palette.indigo} />
                      </View>
                    ) : (
                      <Avatar name={player.name} avatarUrl={avatarUrl} size={40} />
                    )}

                    {player.isManager && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -4,
                          backgroundColor: palette.gold,
                          borderRadius: 10,
                          padding: 2,
                        }}
                      >
                        <Crown size={10} color="#FFFFFF" fill="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: palette.txt,
                        }}
                        numberOfLines={1}
                      >
                        {player.name}
                      </Text>
                      {isYou && (
                        <View
                          style={{
                            backgroundColor: palette.primary,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: palette.primaryInk, fontSize: 10, fontWeight: '700' }}>
                            Toi
                          </Text>
                        </View>
                      )}
                    </View>

                    {player.selectedCategories && player.selectedCategories.length > 0 && (
                      <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 1 }}>
                        {player.selectedCategories.length} catégorie{player.selectedCategories.length > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Manager Actions */}
                {isManager && !isYou && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {questionMode !== 'MANUAL' && sessionMode === 'WITH_MODERATOR' && (
                      <TouchableOpacity
                        onPress={() => onEditCategories(player)}
                        activeOpacity={0.7}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: `${palette.primary}18`,
                          borderWidth: 1,
                          borderColor: `${palette.primary}33`,
                        }}
                      >
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: palette.primary }}>
                          Thèmes
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => onKickPlayer(player.id, player.name)}
                      disabled={isKicking}
                      activeOpacity={0.7}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: `${palette.bad}18`,
                        borderWidth: 1,
                        borderColor: `${palette.bad}33`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isKicking ? (
                        <ActivityIndicator size="small" color={palette.bad} />
                      ) : (
                        <Trash2 size={13} color={palette.bad} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
    </View>
  );
}
