import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Zap, CheckCircle, XCircle } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import { teamColor } from '~/lib/game/teamColors';
import type { PlayerResponse, TeamResponse } from '~/types/api';

export interface BuzzQueueViewProps {
  buzzQueue: any[];
  phase: string;
  countdownSeconds: number | null;
  isManager: boolean;
  isValidating: boolean;
  players: PlayerResponse[];
  myPlayerId?: string;
  isTeamMode: boolean;
  teams: TeamResponse[];
  onValidate: (isCorrect: boolean, applyPenalty?: boolean) => void;
  onSetPendingWrong: (pending: { applyPenalty: boolean } | null) => void;
}

export function BuzzQueueView({
  buzzQueue, phase, countdownSeconds, isManager, isValidating, players, myPlayerId, isTeamMode, teams, onValidate, onSetPendingWrong
}: BuzzQueueViewProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <View style={{ borderRadius: 24, borderWidth: 1, borderColor: buzzQueue.length > 0 ? palette.primary : palette.line, backgroundColor: buzzQueue.length > 0 ? palette.primary + '0D' : palette.surface, overflow: 'hidden' }}>
        
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: buzzQueue.length > 0 ? palette.primary + '40' : palette.line, backgroundColor: buzzQueue.length > 0 ? palette.primary + '1A' : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: buzzQueue.length > 0 ? palette.primary : palette.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Zap size={16} color={buzzQueue.length > 0 ? '#FFFFFF' : palette.inkSoft} />
            </View>
            <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 16 }}>File d'attente</Text>
            <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 9999, marginLeft: 8, backgroundColor: buzzQueue.length > 0 ? palette.primary : palette.surface2 }}>
              <Text style={{ fontWeight: '600', fontSize: 14, color: buzzQueue.length > 0 ? '#FFFFFF' : palette.txt }}>{buzzQueue.length}</Text>
            </View>
          </View>
          {buzzQueue.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.primary + '26', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary, marginRight: 8 }} />
              <Text style={{ color: palette.primary, fontSize: 14, fontWeight: '500' }}>En cours</Text>
            </View>
          )}
        </View>

        {/* List */}
        {buzzQueue.length > 0 ? (
          <View>
            {/* First buzzer */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: palette.primary + '1A', borderBottomWidth: 1, borderBottomColor: palette.primary + '33' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontWeight: '700', color: '#FFFFFF', fontSize: 18 }}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 18 }}>{buzzQueue[0].playerName}</Text>
                    {isTeamMode && buzzQueue[0].teamName && (() => {
                      const tColor = teamColor(teams.find(t => t.id === buzzQueue[0].teamId)?.color);
                      return (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, backgroundColor: tColor + '38' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: tColor }}>{buzzQueue[0].teamName}</Text>
                        </View>
                      );
                    })()}
                  </View>
                  <Text style={{ color: palette.primary, fontSize: 14 }}>En train de répondre</Text>
                </View>
                {buzzQueue[0].deltaMs >= 0 && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 16 }}>
                      {buzzQueue[0].deltaMs < 1000 ? `${buzzQueue[0].deltaMs}ms` : `${(buzzQueue[0].deltaMs / 1000).toFixed(1)}s`}
                    </Text>
                    <Text style={{ color: palette.inkSoft, fontSize: 12 }}>réaction</Text>
                  </View>
                )}
              </View>

              {/* Buzz countdown */}
              {phase === 'AWAITING_VALIDATION' && countdownSeconds !== null && countdownSeconds > 0 && (
                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: palette.surface2, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${(countdownSeconds / 10) * 100}%`, backgroundColor: countdownSeconds <= 3 ? palette.bad : countdownSeconds <= 6 ? palette.warn : palette.primary, borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', width: 24, textAlign: 'right', color: countdownSeconds <= 3 ? palette.bad : countdownSeconds <= 6 ? palette.warn : palette.primary }}>
                    {countdownSeconds}
                  </Text>
                </View>
              )}

              {/* Manager Controls */}
              {isManager && phase === 'AWAITING_VALIDATION' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity onPress={() => onValidate(true)} disabled={isValidating} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.6 : 1, flexDirection: 'row', gap: 6 }}>
                    {isValidating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><CheckCircle size={18} color="#FFFFFF" /><Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Correct</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onSetPendingWrong({ applyPenalty: false })} disabled={isValidating} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: palette.bad, alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.6 : 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Sans pénalité</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onSetPendingWrong({ applyPenalty: true })} disabled={isValidating} style={{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.6 : 1, flexDirection: 'row', gap: 6 }}>
                    <XCircle size={18} color="#FFFFFF" /><Text style={{ color: palette.txt, fontWeight: '700' }}>Faux avec -</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Other buzzers */}
            {buzzQueue.slice(1).map((item, index) => {
              return (
                <View key={item.playerId} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <Text style={{ fontWeight: '700', color: palette.txt, fontSize: 12 }}>{index + 2}</Text>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={{ fontWeight: '500', color: item.playerId === myPlayerId ? palette.primary : palette.inkSoft }}>
                      {item.playerName}{item.playerId === myPlayerId && ' (Vous)'}
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
                  <Text style={{ color: palette.inkSoft, fontSize: 14 }}>
                    {item.deltaMs < 1000 ? `${item.deltaMs}ms` : `${(item.deltaMs / 1000).toFixed(1)}s`}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Zap size={24} color="rgba(255,255,255,0.25)" />
            </View>
            <Text style={{ color: palette.inkSoft, fontSize: 14, fontWeight: '500', textAlign: 'center' }}>La file d'attente est vide</Text>
          </View>
        )}
      </View>
    </View>
  );
}
