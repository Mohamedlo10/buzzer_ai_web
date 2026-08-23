import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy, ChevronRight } from 'lucide-react-native';
import { Avatar } from '~/components/shared/Avatar';
import { teamColor } from '~/lib/game/teamColors';
import { palette, font } from '~/lib/theme/tokens';
import type { TeamResponse } from '~/types/api';

export interface ArcadeTeamsSectionProps {
  teams: TeamResponse[];
  currentPlayerId: string | null;
  isManager: boolean;
  userId?: string;
  avatarMap: Record<string, string | null>;
  onChangeTeam: () => void;
  onManagerReassign: (id: string, name: string) => void;
}

export function ArcadeTeamsSection({
  teams,
  currentPlayerId,
  isManager,
  userId,
  avatarMap,
  onChangeTeam,
  onManagerReassign,
}: ArcadeTeamsSectionProps) {
  if (!teams || teams.length === 0) return null;

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Trophy size={14} color={palette.gold} />
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: palette.gold, textTransform: 'uppercase' }}>
            Équipes
          </Text>
        </View>

        {!isManager && (
          <TouchableOpacity
            onPress={onChangeTeam}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: `${palette.primary}18`,
              borderWidth: 1,
              borderColor: `${palette.primary}33`,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: palette.primary }}>
              Changer
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Teams List */}
      <View style={{ gap: 12 }}>
        {teams.map((team) => {
          const tColor = teamColor(team.color);

          return (
            <View
              key={team.id}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.line,
                overflow: 'hidden',
              }}
            >
              {/* Team Title Banner */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.line,
                  backgroundColor: `${tColor}12`,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tColor }} />
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.txt }}>
                    {team.name}
                  </Text>
                </View>

                <Text style={{ fontSize: 11.5, fontWeight: '600', color: palette.inkSoft }}>
                  {team.members.length} joueur{team.members.length > 1 ? 's' : ''}
                </Text>
              </View>

              {/* Members */}
              <View style={{ padding: 8, gap: 4 }}>
                {team.members.map((member) => {
                  const isMe = member.id === currentPlayerId;
                  const avatarUrl = member.userId
                    ? (avatarMap[member.userId] ?? member.avatarUrl)
                    : member.avatarUrl;

                  return (
                    <View
                      key={member.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: isMe ? `${palette.primary}10` : 'transparent',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Avatar name={member.name} avatarUrl={avatarUrl} size={28} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isMe ? '700' : '600',
                            color: isMe ? palette.primary : palette.txt,
                          }}
                          numberOfLines={1}
                        >
                          {member.name}{isMe ? ' (Toi)' : ''}
                        </Text>
                      </View>

                      {isManager && (
                        <TouchableOpacity
                          onPress={() => onManagerReassign(member.id, member.name)}
                          activeOpacity={0.7}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            backgroundColor: palette.surface,
                            borderWidth: 1,
                            borderColor: palette.line,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ChevronRight size={13} color={palette.inkSoft} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {team.members.length === 0 && (
                  <Text style={{ fontSize: 11.5, color: palette.inkSoft, fontStyle: 'italic', padding: 4 }}>
                    Aucun joueur dans cette équipe
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
