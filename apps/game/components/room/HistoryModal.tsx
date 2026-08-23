import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, History, Trophy, ChevronRight } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { RoomSessionResponse } from '~/types/api';

export interface HistoryModalProps {
  visible: boolean;
  sessions: RoomSessionResponse[];
  onNavigate: (session: RoomSessionResponse) => void;
  onClose: () => void;
}

export function HistoryModal({
  visible,
  sessions,
  onNavigate,
  onClose,
}: HistoryModalProps) {
  if (!visible) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return `Aujourd'hui · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (diff === 1) return `Hier · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

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
            maxHeight: '75%',
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
                Historique des parties
              </Text>
              <Text style={{ fontSize: 12, color: palette.inkSoft, marginTop: 2 }}>
                {sessions.length} partie{sessions.length > 1 ? 's' : ''} jouée{sessions.length > 1 ? 's' : ''}
              </Text>
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

          {/* Sessions List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {sessions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <History size={36} color={palette.inkSoft} />
                <Text style={{ fontSize: 13, color: palette.inkSoft, marginTop: 10 }}>
                  Aucune partie terminée pour le moment
                </Text>
              </View>
            ) : (
              sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  onPress={() => {
                    onNavigate(session);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: palette.bg,
                    borderWidth: 1,
                    borderColor: palette.line,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: `${palette.gold}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trophy size={18} color={palette.gold} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.txt }}>
                        Partie #{session.code}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 1 }}>
                        {formatDate(session.createdAt)} · {session.playerCount} joueurs
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={16} color={palette.inkSoft} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
