import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Eye, Crown, X, Trash2, Edit3 } from 'lucide-react-native';
import { Avatar } from '~/components/shared/Avatar';
import { teamColor, teamColorTint } from '~/lib/game/teamColors';
import { palette, font } from '~/lib/theme/tokens';
import type { PlayerResponse, TeamResponse, CategorySelectionMode } from '~/types/api';

export interface LobbyPlayerDetailModalProps {
  visible: boolean;
  player: PlayerResponse | null;
  currentUserId?: string;
  isManager: boolean;
  questionMode?: string;
  sessionMode?: string;
  categorySelectionMode?: CategorySelectionMode;
  teams: TeamResponse[];
  avatarMap: Record<string, string | null>;
  onClose: () => void;
  onViewStats: (userId: string) => void;
  onEditCategories: (player: PlayerResponse) => void;
  onKickPlayer: (playerId: string, playerName: string) => void;
  categoryEmojiMap: Record<string, string>;
}

export function LobbyPlayerDetailModal({
  visible,
  player,
  currentUserId,
  isManager,
  questionMode,
  sessionMode,
  categorySelectionMode,
  teams,
  avatarMap,
  onClose,
  onViewStats,
  onEditCategories,
  onKickPlayer,
  categoryEmojiMap,
}: LobbyPlayerDetailModalProps) {
  if (!visible || !player) return null;

  const isMe = player.userId === currentUserId;
  const avatarUrl = player.userId ? (avatarMap[player.userId] ?? player.avatarUrl) : player.avatarUrl;
  const team = player.teamId ? teams.find((t) => t.id === player.teamId) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 36,
            maxHeight: '80%',
          }}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              alignSelf: 'flex-end',
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: palette.bg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <X size={15} color={palette.txt} />
          </TouchableOpacity>

          {/* Hero Avatar & Name */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Avatar name={player.name} avatarUrl={avatarUrl} size={72} />
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 20,
                lineHeight: 26,
                color: palette.txt,
                marginTop: 10,
                paddingTop: 2,
              }}
            >
              {player.name}
            </Text>

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {player.isManager && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, backgroundColor: `${palette.gold}18` }}>
                  <Crown size={11} color={palette.gold} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: palette.gold }}>HÔTE</Text>
                </View>
              )}

              {player.isSpectator ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, backgroundColor: `${palette.indigo}18` }}>
                  <Eye size={11} color={palette.indigo} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: palette.indigo }}>SPECTATEUR</Text>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, backgroundColor: `${palette.primary}18` }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: palette.primary }}>JOUEUR</Text>
                </View>
              )}

              {team && (
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, backgroundColor: `${teamColor(team.color)}18` }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: teamColor(team.color) }}>{team.name}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Categories */}
          {!player.isSpectator && questionMode !== 'MANUAL' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: palette.inkSoft, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
                Thèmes choisis
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {(player.selectedCategories ?? []).map((cat) => (
                  <View
                    key={cat}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 9999,
                      backgroundColor: palette.bg,
                      borderWidth: 1,
                      borderColor: palette.line,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: palette.txt }}>
                      {categoryEmojiMap[cat] ? `${categoryEmojiMap[cat]} ` : ''}{cat}
                    </Text>
                  </View>
                ))}
                {(player.selectedCategories?.length ?? 0) === 0 && (
                  <Text style={{ fontSize: 13, color: palette.inkSoft, fontStyle: 'italic' }}>
                    Aucun thème sélectionné
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={{ gap: 10 }}>
            {isManager && !isMe && questionMode !== 'MANUAL' && sessionMode === 'WITH_MODERATOR' && categorySelectionMode !== 'MANAGER' && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onEditCategories(player);
                }}
                activeOpacity={0.8}
                style={{
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: `${palette.primary}18`,
                  borderWidth: 1,
                  borderColor: `${palette.primary}33`,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Edit3 size={16} color={palette.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: palette.primary }}>
                  Modifier ses thèmes
                </Text>
              </TouchableOpacity>
            )}

            {isManager && !isMe && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onKickPlayer(player.id, player.name);
                }}
                activeOpacity={0.8}
                style={{
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: `${palette.bad}18`,
                  borderWidth: 1,
                  borderColor: `${palette.bad}33`,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Trash2 size={16} color={palette.bad} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: palette.bad }}>
                  Exclure du lobby
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
