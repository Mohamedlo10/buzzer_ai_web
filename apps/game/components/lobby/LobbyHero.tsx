import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Crown, Zap, Users, Bot, Copy, Check, Share2, QrCode } from 'lucide-react-native';
import { Avatar } from '~/components/shared/Avatar';
import { palette, font } from '~/lib/theme/tokens';
import type { PlayerResponse, UserResponse } from '~/types/api';

export interface LobbyHeroProps {
  currentPlayer?: PlayerResponse;
  user: UserResponse | null;
  avatarMap: Record<string, string | null>;
  isWithoutModerator: boolean;
  questionMode?: string;
  totalQuestions?: number;
  totalQuestionsEstimate: number;
  playersCount: number;
  maxPlayers: number;
  code: string;
  isCopied: boolean;
  onCopyCode: () => void;
  onShare: () => void;
  onShowQR: () => void;
}

export function LobbyHero({
  currentPlayer,
  user,
  avatarMap,
  isWithoutModerator,
  questionMode,
  totalQuestions = 0,
  totalQuestionsEstimate,
  playersCount,
  maxPlayers,
  code,
  isCopied,
  onCopyCode,
  onShare,
  onShowQR,
}: LobbyHeroProps) {
  const username = currentPlayer?.name ?? user?.username ?? 'Joueur';
  const avatarUrl = currentPlayer?.userId
    ? (avatarMap[currentPlayer.userId] ?? currentPlayer.avatarUrl)
    : user?.avatarUrl;

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Hero Header */}
      <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
        <Avatar name={username} avatarUrl={avatarUrl} size={76} />
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 22,
            lineHeight: 28,
            color: palette.txt,
            marginTop: 12,
            paddingTop: 2,
            textAlign: 'center',
          }}
        >
          Tu es dans la partie !
        </Text>
        <Text
          style={{
            fontFamily: font.nativeFamily.serif,
            fontStyle: 'italic',
            fontSize: 14.5,
            color: palette.inkSoft,
            marginTop: 2,
            textAlign: 'center',
          }}
        >
          Salut <Text style={{ fontWeight: '700', color: palette.txt }}>{username}</Text> — garde ton pouce prêt
        </Text>
      </View>

      {/* Mode Badges */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 9999,
            backgroundColor: isWithoutModerator ? `${palette.primary}18` : `${palette.gold}18`,
            borderWidth: 1,
            borderColor: isWithoutModerator ? `${palette.primary}33` : `${palette.gold}33`,
          }}
        >
          <Crown size={12} color={isWithoutModerator ? palette.primary : palette.gold} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: isWithoutModerator ? palette.primary : palette.gold,
            }}
          >
            {isWithoutModerator ? 'Sans modérateur' : 'Avec modérateur'}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 9999,
            backgroundColor: `${palette.indigo}18`,
            borderWidth: 1,
            borderColor: `${palette.indigo}33`,
          }}
        >
          <Zap size={12} color={palette.indigo} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: palette.indigo }}>
            {questionMode === 'MANUAL' ? `${totalQuestions} questions` : `~${totalQuestionsEstimate} questions`}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 9999,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Users size={12} color={palette.inkSoft} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: palette.txt }}>
            {playersCount}/{maxPlayers}
          </Text>
        </View>
      </View>

      {/* Mode Sprint Notice */}
      {isWithoutModerator && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: `${palette.primary}12`,
            borderWidth: 1,
            borderColor: `${palette.primary}25`,
            borderRadius: 16,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Bot size={18} color={palette.primary} />
          <Text style={{ flex: 1, fontSize: 12, color: palette.txt, lineHeight: 16 }}>
            <Text style={{ fontWeight: '700', color: palette.primary }}>Mode Sprint : </Text>
            1 seule phase pour lire l&apos;énoncé et y répondre. Tous les joueurs répondent simultanément.
          </Text>
        </View>
      )}

      {/* Session Code Card */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: palette.line,
          padding: 16,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: palette.inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>
          Code de la partie
        </Text>
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 32,
            lineHeight: 40,
            letterSpacing: 3,
            color: palette.primary,
            marginBottom: 14,
            paddingTop: 2,
          }}
        >
          {code}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
          <TouchableOpacity
            onPress={onCopyCode}
            activeOpacity={0.7}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: isCopied ? `${palette.good}18` : palette.bg,
              borderWidth: 1,
              borderColor: isCopied ? palette.good : palette.line,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {isCopied ? <Check size={16} color={palette.good} /> : <Copy size={16} color={palette.txt} />}
            <Text style={{ fontSize: 13, fontWeight: '700', color: isCopied ? palette.good : palette.txt }}>
              {isCopied ? 'Copié !' : 'Copier'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onShare}
            activeOpacity={0.7}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: `${palette.primary}14`,
              borderWidth: 1,
              borderColor: `${palette.primary}33`,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Share2 size={16} color={palette.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.primary }}>
              Partager
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onShowQR}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: `${palette.gold}14`,
              borderWidth: 1,
              borderColor: `${palette.gold}33`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QrCode size={18} color={palette.gold} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
