import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { teamColor } from '~/lib/game/teamColors';
import { palette, font } from '~/lib/theme/tokens';
import type { TeamResponse } from '~/types/api';

export interface TeamPickerModalProps {
  visible: boolean;
  teams: TeamResponse[];
  targetPlayer: { id: string; name: string } | null;
  isChangingTeam: boolean;
  onAssignTeam: (playerId: string, teamId: string) => void;
  onClose: () => void;
}

export function TeamPickerModal({
  visible,
  teams,
  targetPlayer,
  isChangingTeam,
  onAssignTeam,
  onClose,
}: TeamPickerModalProps) {
  if (!visible) return null;

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
            paddingTop: 20,
            paddingBottom: 36,
            maxHeight: '70%',
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
            <View>
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 18,
                  lineHeight: 24,
                  color: palette.txt,
                  paddingTop: 2,
                }}
              >
                Changer d&apos;équipe
              </Text>
              {targetPlayer && (
                <Text style={{ fontSize: 12, color: palette.inkSoft, marginTop: 2 }}>
                  Pour {targetPlayer.name}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: palette.bg,
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color={palette.txt} />
            </TouchableOpacity>
          </View>

          {/* Teams list */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {teams.map((team) => {
              const isCurrent = team.members.some((m) => m.id === targetPlayer?.id);
              const tColor = teamColor(team.color);

              return (
                <TouchableOpacity
                  key={team.id}
                  onPress={() => targetPlayer && onAssignTeam(targetPlayer.id, team.id)}
                  disabled={isChangingTeam || isCurrent}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: isCurrent ? `${tColor}18` : palette.bg,
                    borderWidth: 1.5,
                    borderColor: isCurrent ? tColor : palette.line,
                    opacity: isChangingTeam ? 0.6 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: tColor }} />
                    <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.txt }}>
                      {team.name}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                      {team.members.length} joueur{team.members.length > 1 ? 's' : ''}
                    </Text>
                    {isCurrent && (
                      <View
                        style={{
                          backgroundColor: tColor,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                          Actuel
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isChangingTeam && (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <ActivityIndicator size="small" color={palette.primary} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
