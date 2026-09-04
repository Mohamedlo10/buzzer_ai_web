import React from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { PlayerResponse } from '~/types/api';

export interface LobbyWaitingCardProps {
  isManager: boolean;
  managerPlayer?: PlayerResponse;
  currentPlayer?: PlayerResponse;
  questionMode?: string;
  onEditCategories: () => void;
}

export function LobbyWaitingCard({
  isManager,
  managerPlayer,
  currentPlayer: _currentPlayer,
  questionMode: _questionMode,
  onEditCategories: _onEditCategories,
}: LobbyWaitingCardProps) {
  if (isManager) {
    return null;
  }

  const managerName = managerPlayer?.name || "l'organisateur";

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${palette.gold}18`,
          borderWidth: 1,
          borderColor: `${palette.gold}33`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Clock size={20} color={palette.gold} />
      </View>

      <Text
        style={{
          fontFamily: font.nativeFamily.display,
          fontSize: 16,
          lineHeight: 22,
          color: palette.txt,
          textAlign: 'center',
          paddingTop: 2,
        }}
      >
        En attente du lancement
      </Text>

      <Text
        style={{
          fontFamily: font.nativeFamily.serif,
          fontStyle: 'italic',
          fontSize: 13.5,
          color: palette.inkSoft,
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        <Text style={{ fontWeight: '700', color: palette.txt }}>{managerName}</Text> configurera et lancera la partie dès que tous les joueurs seront prêts.
      </Text>
    </View>
  );
}
