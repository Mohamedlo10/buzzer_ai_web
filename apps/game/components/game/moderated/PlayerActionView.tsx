import { View, Text } from 'react-native';
import { XCircle, Mic } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
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
    <View style={{ paddingHorizontal: 16, paddingTop: 16, minHeight: 140, justifyContent: 'center' }}>
      <View style={{ gap: 12 }}>
        {amIAnswering ? (
          <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.primary, padding: 16, minHeight: 110, justifyContent: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 32, height: 32, borderWidth: 2, borderColor: palette.primary, borderTopColor: 'transparent', borderRadius: 16, transform: [{ rotate: '45deg' }] }} />
              <View>
                <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 15, paddingTop: 2 }}>Tu as buzzé ! Réponds à voix haute</Text>
                <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.inkSoft, fontSize: 12 }}>En attente de la validation du modérateur…</Text>
              </View>
            </View>
            {countdownSeconds !== null && countdownSeconds > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: palette.surface2, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${(countdownSeconds / 10) * 100}%`, backgroundColor: countdownSeconds <= 3 ? palette.bad : countdownSeconds <= 6 ? palette.warn : palette.primary, borderRadius: 3 }} />
                </View>
                <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 15, width: 26, textAlign: 'right', color: countdownSeconds <= 3 ? palette.bad : countdownSeconds <= 6 ? palette.warn : palette.primary, paddingTop: 2 }}>
                  {countdownSeconds}
                </Text>
              </View>
            )}
          </View>
        ) : phase === 'AWAITING_VALIDATION' && answeringPlayer ? (
          <View style={{ backgroundColor: palette.surface, borderRadius: 16, padding: 16, minHeight: 110, borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 12 }}>En train de répondre</Text>
              <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 16, paddingTop: 2 }}>{answeringPlayer.name}</Text>
            </View>
            {countdownSeconds !== null && countdownSeconds > 0 && (
              <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: font.nativeFamily.display, color: palette.primary, fontSize: 17, paddingTop: 2 }}>{countdownSeconds}</Text>
              </View>
            )}
          </View>
        ) : answeredWrongThisQuestion ? (
          <View style={{ backgroundColor: palette.bad + '1F', borderWidth: 1, borderColor: palette.bad + '4D', borderRadius: 16, padding: 16, minHeight: 110, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <XCircle size={22} color={palette.bad} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.nativeFamily.display, color: palette.bad, fontSize: 15, paddingTop: 2 }}>Réponse incorrecte</Text>
              <Text style={{ fontFamily: font.nativeFamily.ui, color: palette.inkSoft, fontSize: 12, marginTop: 2 }}>Buzzer désactivé — les autres peuvent répondre</Text>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: palette.surface, borderRadius: 16, padding: 16, minHeight: 110, justifyContent: 'center', borderWidth: 1, borderColor: palette.line, alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.primary + '21', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <Mic size={22} color={palette.primary} />
            </View>
            <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 16, paddingTop: 2 }}>Écoute la question…</Text>
            <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 12, marginTop: 2 }}>Le modérateur lit la question à voix haute</Text>
          </View>
        )}
      </View>
    </View>
  );
}
