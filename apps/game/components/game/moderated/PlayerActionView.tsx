import { View, Text } from 'react-native';
import { XCircle, Mic } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import type { PlayerResponse } from '~/types/api';

export interface PlayerActionViewProps {
  isManager: boolean;
  isSpectator: boolean;
  amIAnswering: boolean;
  phase: string;
  answeringPlayer?: PlayerResponse;
  countdownSeconds: number | null;
  answeredWrongThisQuestion: boolean;
}

export function PlayerActionView({ isManager, isSpectator, amIAnswering, phase, answeringPlayer, countdownSeconds, answeredWrongThisQuestion }: PlayerActionViewProps) {
  if (isManager || isSpectator) return null;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <View style={{ gap: 12 }}>
        {amIAnswering ? (
          <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.primary, padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 32, height: 32, borderWidth: 2, borderColor: palette.primary, borderTopColor: 'transparent', borderRadius: 16, transform: [{ rotate: '45deg' }] }} />
              <View>
                <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>Tu as buzzé ! Réponds à voix haute</Text>
                <Text style={{ color: palette.inkSoft, fontSize: 12 }}>En attente de la validation du modérateur…</Text>
              </View>
            </View>
            {countdownSeconds !== null && countdownSeconds > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: palette.surface2, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${(countdownSeconds / 10) * 100}%`, backgroundColor: countdownSeconds <= 3 ? palette.bad : countdownSeconds <= 6 ? palette.warn : palette.primary, borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', width: 24, textAlign: 'right', color: countdownSeconds <= 3 ? palette.bad : countdownSeconds <= 6 ? palette.warn : palette.primary }}>
                  {countdownSeconds}
                </Text>
              </View>
            )}
          </View>
        ) : phase === 'AWAITING_VALIDATION' && answeringPlayer ? (
          <View style={{ backgroundColor: palette.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: palette.inkSoft, fontSize: 12 }}>En train de répondre</Text>
              <Text style={{ color: palette.txt, fontWeight: '700' }}>{answeringPlayer.name}</Text>
            </View>
            {countdownSeconds !== null && countdownSeconds > 0 && (
              <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: palette.primary, fontWeight: '700' }}>{countdownSeconds}</Text>
              </View>
            )}
          </View>
        ) : answeredWrongThisQuestion ? (
          <View style={{ backgroundColor: palette.bad + '1F', borderWidth: 1, borderColor: palette.bad + '4D', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <XCircle size={18} color={palette.bad} />
            <View>
              <Text style={{ color: palette.bad, fontWeight: '700', fontSize: 14 }}>Réponse incorrecte</Text>
              <Text style={{ color: palette.inkSoft, fontSize: 12 }}>Buzzer désactivé — les autres peuvent répondre</Text>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: palette.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: palette.line, alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: palette.primary + '21', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Mic size={26} color={palette.primary} />
            </View>
            <Text style={{ color: palette.txt, fontWeight: '600', fontSize: 16 }}>Écoute la question…</Text>
            <Text style={{ color: palette.inkSoft, fontSize: 13, marginTop: 4 }}>Le modérateur lit la question à voix haute</Text>
          </View>
        )}
      </View>
    </View>
  );
}
