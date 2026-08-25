import { View, Text } from 'react-native';
import { Hand } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import { teamColor } from '~/lib/game/teamColors';
import type { PlayerResponse, TeamResponse } from '~/types/api';
import type { QueueEntry } from '~/lib/game/packet';

export interface BuzzAlertOverlayProps {
  isManager: boolean;
  phase: string;
  firstBuzzer?: QueueEntry;
  buzzQueue: QueueEntry[];
  players: PlayerResponse[];
  myPlayerId?: string;
  isTeamMode: boolean;
  teams: TeamResponse[];
}

export function BuzzAlertOverlay({ isManager, phase, firstBuzzer, buzzQueue, players, myPlayerId, isTeamMode, teams }: BuzzAlertOverlayProps) {
  if (!isManager || phase !== 'AWAITING_VALIDATION' || !firstBuzzer) return null;

  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 40, backgroundColor: palette.bad + 'E6', padding: 24 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Hand size={40} color={palette.bad} />
          </View>
          <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 40, paddingTop: 4 }}>BUZZ !</Text>
          <Text style={{ fontFamily: font.nativeFamily.display, color: 'rgba(26,20,16,0.9)', fontSize: 24, marginTop: 12, paddingTop: 2 }}>{firstBuzzer.playerName}</Text>
          <Text style={{ fontFamily: font.nativeFamily.ui, color: 'rgba(26,20,16,0.8)', fontSize: 16, marginTop: 4, fontWeight: '500' }}>
            A buzzé en {firstBuzzer.deltaMs < 1000 ? `${firstBuzzer.deltaMs}ms` : `${(firstBuzzer.deltaMs / 1000).toFixed(1)}s`}
          </Text>
          {buzzQueue.length > 1 && (
            <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: 'rgba(26,20,16,0.8)', fontSize: 14, marginTop: 8 }}>
              +{buzzQueue.length - 1} autre{buzzQueue.length > 2 ? 's' : ''} en attente
            </Text>
          )}
        </View>
      </View>

      <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, overflow: 'hidden' }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <Text style={{ fontFamily: font.nativeFamily.display, color: '#FFFFFF', textAlign: 'center', fontSize: 15, paddingTop: 2 }}>File d'attente</Text>
        </View>
        {buzzQueue.slice(0, 3).map((item, index) => {
          const qPlayer = players.find(p => p.id === item.playerId);
          return (
            <View key={item.playerId} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', backgroundColor: index === 0 ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: index === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: index === 0 ? palette.bad : palette.txt }}>{index + 1}</Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>{item.playerName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontWeight: '500', color: item.playerId === myPlayerId ? palette.warn : '#FFFFFF' }}>
                  {item.playerName}{item.playerId === myPlayerId ? ' (Vous)' : ''}
                </Text>
                {isTeamMode && item.teamName && (() => {
                  const tColor = teamColor(teams.find(t => t.id === item.teamId)?.color);
                  return (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, backgroundColor: tColor + '38' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: tColor }}>{item.teamName}</Text>
                    </View>
                  );
                })()}
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                {item.deltaMs < 1000 ? `${item.deltaMs}ms` : `${(item.deltaMs / 1000).toFixed(1)}s`}
              </Text>
            </View>
          );
        })}
        {buzzQueue.length > 3 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12 }}>+{buzzQueue.length - 3} autres joueurs...</Text>
          </View>
        )}
      </View>
    </View>
  );
}
