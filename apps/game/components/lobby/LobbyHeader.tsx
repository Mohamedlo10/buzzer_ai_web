import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { SessionResponse, RoomInfo } from '~/types/api';

export interface LobbyHeaderProps {
  session: SessionResponse;
  roomInfo: RoomInfo | null;
  isConnected: boolean;
  isManager: boolean;
  code: string;
  isRefreshing: boolean;
  onBack: () => void;
  onRefresh: () => void;
}

export function LobbyHeader({
  session,
  roomInfo,
  isConnected,
  isManager,
  code,
  isRefreshing,
  onBack,
  onRefresh,
}: LobbyHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
        backgroundColor: palette.bg,
        gap: 10,
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: palette.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <ArrowLeft size={18} color={palette.txt} />
      </TouchableOpacity>

      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 16,
            lineHeight: 22,
            color: palette.txt,
            paddingTop: 2,
          }}
          numberOfLines={1}
        >
          {roomInfo?.name ? roomInfo.name : `Lobby #${code}`}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 5 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: isConnected ? palette.good : palette.bad,
            }}
          />
          <Text style={{ fontSize: 11.5, fontWeight: '600', color: palette.inkSoft }}>
            {isConnected ? 'Connecté' : 'Connexion...'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onRefresh}
        disabled={isRefreshing}
        activeOpacity={0.7}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: palette.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={palette.primary} />
        ) : (
          <RefreshCw size={17} color={palette.txt} />
        )}
      </TouchableOpacity>
    </View>
  );
}
