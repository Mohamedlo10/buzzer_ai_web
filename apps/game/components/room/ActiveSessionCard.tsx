import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trash2, Clock, Sparkles, Crown, ArrowRight, Play } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { RoomSessionResponse } from '~/types/api';

export interface ActiveSessionCardProps {
  session: RoomSessionResponse;
  members?: Array<{ userId: string; username: string; avatarUrl?: string | null }>;
  onPress: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  isOwner?: boolean;
}

export function ActiveSessionCard({
  session,
  members = [],
  onPress,
  onDelete,
  canDelete,
  isOwner,
}: ActiveSessionCardProps) {
  const isLobby = session.status === 'LOBBY';
  const isReady = isLobby && session.playerCount >= 2;

  const statusColor = isReady ? palette.good : isLobby ? palette.primary : palette.gold;
  const statusLabel = isReady
    ? '⚡ Prêt à démarrer'
    : isLobby
      ? '🟢 Salon ouvert'
      : `En cours (${session.status})`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.line,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Top Banner */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: `${statusColor}12`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
          <Text style={{ fontSize: 11.5, fontWeight: '800', color: statusColor, textTransform: 'uppercase' }}>
            {statusLabel}
          </Text>
        </View>

        {canDelete && onDelete && (
          <TouchableOpacity
            onPress={(e) => {
              onDelete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: `${palette.bad}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={13} color={palette.bad} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <View style={{ padding: 16 }}>
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 17,
              lineHeight: 24,
              color: palette.txt,
              paddingTop: 2,
            }}
          >
            Session #{session.code}
          </Text>
          <Text
            style={{
              fontFamily: font.nativeFamily.serif,
              fontStyle: 'italic',
              fontSize: 13,
              color: palette.inkSoft,
              marginTop: 2,
            }}
          >
            Créé par <Text style={{ fontWeight: '700', color: palette.txt }}>{session.managerName}</Text> · {session.playerCount}/{session.maxPlayers} joueurs
          </Text>
        </View>

        {/* Join CTA */}
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          style={{
            height: 44,
            borderRadius: 14,
            backgroundColor: palette.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Text style={{ color: palette.primaryInk, fontSize: 13.5, fontWeight: '700' }}>
            Rejoindre la partie
          </Text>
          <ArrowRight size={16} color={palette.primaryInk} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
