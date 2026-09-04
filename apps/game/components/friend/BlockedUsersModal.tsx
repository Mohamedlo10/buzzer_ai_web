import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { ShieldAlert, X, UserX } from 'lucide-react-native';
import { Avatar } from '~/components/shared/Avatar';
import { palette, font } from '~/lib/theme/tokens';
import { useFriendStore } from '~/stores/useFriendStore';
import { notify, notifyApiError } from '~/lib/ui/notify';

export interface BlockedUsersModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BlockedUsersModal({ visible, onClose }: BlockedUsersModalProps) {
  const { blockedUsers, unblockUser } = useFriendStore();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  if (!visible) return null;

  const handleUnblock = async (userId: string, username: string) => {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      notify.success(`${username} a été débloqué`);
    } catch (err: any) {
      notifyApiError(err, 'Impossible de débloquer cet utilisateur');
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: palette.line,
            paddingTop: 12,
            paddingBottom: 36,
            paddingHorizontal: 20,
            maxHeight: '80%',
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: palette.surface2 }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: palette.bad + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldAlert size={20} color={palette.bad} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 18,
                    color: palette.txt,
                    lineHeight: 22,
                    paddingTop: 2,
                  }}
                >
                  Utilisateurs bloqués
                </Text>
                <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                  {blockedUsers.length} personne{blockedUsers.length > 1 ? 's' : ''} bloquée{blockedUsers.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: palette.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color={palette.inkSoft} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
          >
            {blockedUsers.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: palette.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserX size={28} color={palette.inkSoft} />
                </View>
                <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt, paddingTop: 4 }}>
                  Aucun utilisateur bloqué
                </Text>
                <Text style={{ fontSize: 13, color: palette.inkSoft, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 }}>
                  Les personnes que vous bloquez apparaîtront ici et ne pourront plus vous inviter.
                </Text>
              </View>
            ) : (
              blockedUsers.map((user) => (
                <View
                  key={user.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: palette.surface2,
                    borderRadius: 18,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: palette.line,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
                    <Avatar name={user.username} avatarUrl={user.avatarUrl} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.display,
                          fontSize: 15,
                          color: palette.txt,
                          paddingTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {user.username}
                      </Text>
                      <Text style={{ fontSize: 11, color: palette.bad, fontWeight: '600', marginTop: 1 }}>
                        Bloqué
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleUnblock(user.id, user.username)}
                    disabled={unblockingId === user.id}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: palette.surface,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 9999,
                      borderWidth: 1,
                      borderColor: palette.line,
                      minWidth: 84,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unblockingId === user.id ? (
                      <ActivityIndicator size="small" color={palette.txt} />
                    ) : (
                      <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>
                        Débloquer
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
