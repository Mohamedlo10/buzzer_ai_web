import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { UserPlus, X, Check } from 'lucide-react-native';
import { Avatar } from '~/components/shared/Avatar';
import * as friendsApi from '~/lib/api/friends';
import * as roomsApi from '~/lib/api/rooms';
import { palette, font } from '~/lib/theme/tokens';
import { notify } from '~/lib/ui/notify';
import type { FriendResponse } from '~/types/api';

export interface InviteFriendsModalProps {
  visible: boolean;
  roomId: string;
  memberUserIds: string[];
  pendingInvitationUserIds: string[];
  onClose: () => void;
}

export function InviteFriendsModal({
  visible,
  roomId,
  memberUserIds,
  pendingInvitationUserIds,
  onClose,
}: InviteFriendsModalProps) {
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      friendsApi
        .getFriends()
        .then((list) => {
          setFriends(list.filter((f) => !memberUserIds.includes(f.id)));
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [visible, memberUserIds]);

  if (!visible) return null;

  const isAlreadyInvited = (id: string) => pendingInvitationUserIds.includes(id);

  const toggle = (id: string) => {
    if (isAlreadyInvited(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setIsSending(true);
    try {
      await roomsApi.inviteToRoom(roomId, Array.from(selected));
      setSent(true);
      notify.success('Invitations envoyées !');
      setTimeout(onClose, 1000);
    } catch {
      notify.error("Impossible d'envoyer les invitations");
    } finally {
      setIsSending(false);
    }
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
                Inviter des amis
              </Text>
              <Text style={{ fontSize: 12, color: palette.inkSoft, marginTop: 2 }}>
                {selected.size > 0
                  ? `${selected.size} ami${selected.size > 1 ? 's' : ''} sélectionné${selected.size > 1 ? 's' : ''}`
                  : 'Sélectionne des amis pour rejoindre le salon'}
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

          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="small" color={palette.primary} />
              </View>
            ) : friends.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <UserPlus size={36} color={palette.inkSoft} />
                <Text style={{ fontSize: 13, color: palette.inkSoft, marginTop: 10, textAlign: 'center' }}>
                  Aucun ami disponible à inviter
                </Text>
              </View>
            ) : (
              friends.map((friend) => {
                const isSelected = selected.has(friend.id);
                const alreadyInvited = isAlreadyInvited(friend.id);

                return (
                  <TouchableOpacity
                    key={friend.id}
                    onPress={() => toggle(friend.id)}
                    disabled={alreadyInvited}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 16,
                      backgroundColor: isSelected ? `${palette.primary}12` : palette.bg,
                      borderWidth: 1.5,
                      borderColor: isSelected ? palette.primary : palette.line,
                      opacity: alreadyInvited ? 0.5 : 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Avatar name={friend.username} avatarUrl={friend.avatarUrl} size={36} />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
                        {friend.username}
                      </Text>
                    </View>

                    {alreadyInvited ? (
                      <Text style={{ fontSize: 12, color: palette.inkSoft, fontWeight: '600' }}>
                        Déjà invité
                      </Text>
                    ) : (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          borderColor: isSelected ? palette.primary : palette.line,
                          backgroundColor: isSelected ? palette.primary : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && <Check size={13} color={palette.primaryInk} strokeWidth={3} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Send Action */}
          {friends.length > 0 && (
            <TouchableOpacity
              onPress={handleSend}
              disabled={selected.size === 0 || isSending || sent}
              activeOpacity={0.85}
              style={{
                height: 48,
                borderRadius: 14,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
                opacity: selected.size === 0 || isSending ? 0.6 : 1,
              }}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={palette.primaryInk} />
              ) : sent ? (
                <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 14 }}>
                  Invitations envoyées !
                </Text>
              ) : (
                <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 14 }}>
                  Envoyer {selected.size > 0 ? `(${selected.size})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
