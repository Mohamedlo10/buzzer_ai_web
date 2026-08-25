import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Modal } from 'react-native';
import { palette, font } from '~/lib/theme/tokens';
import { LiveLeaderboard } from '~/components/game/LiveLeaderboard';
import { TeamLeaderboard } from '~/components/game/TeamLeaderboard';
import type { PlayerResponse, TeamResponse } from '~/types/api';

interface GameFooterProps {
  sessionId: string;
  players: PlayerResponse[];
  teams: TeamResponse[];
  isTeamMode: boolean;
  isManager: boolean;
  currentUserId?: string;
}

/**
 * Pied de page de jeu : classement + modale de correction.
 */
export function GameFooter({
  sessionId,
  players,
  teams,
  isTeamMode,
  isManager,
  currentUserId,
}: GameFooterProps) {
  const [showCorrection, setShowCorrection] = useState(false);

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 48 }}>
      {isTeamMode ? (
        <TeamLeaderboard
          teams={teams}
          players={players}
          currentUserId={currentUserId}
          onCorrectClick={isManager ? () => setShowCorrection(true) : undefined}
        />
      ) : (
        <LiveLeaderboard
          players={players}
          currentUserId={currentUserId}
          onCorrectClick={isManager ? () => setShowCorrection(true) : undefined}
        />
      )}

      {/* Correction modal — placeholder */}
      <Modal visible={showCorrection} transparent animationType="slide" onRequestClose={() => setShowCorrection(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
            <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 18, paddingTop: 2 }}>Corriger les scores</Text>
            <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.inkSoft, fontSize: 14 }}>
              Fonctionnalité de correction des scores.
            </Text>
            <TouchableOpacity
              onPress={() => setShowCorrection(false)}
              activeOpacity={0.8}
              style={{ backgroundColor: palette.surface2, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 15, paddingTop: 2 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
