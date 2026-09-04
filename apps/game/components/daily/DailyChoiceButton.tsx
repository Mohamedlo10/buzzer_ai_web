/**
 * DailyChoiceButton
 *
 * États possibles :
 *  - 'idle'    : cliquable, pas encore sélectionné
 *  - 'pending' : le joueur a cliqué, attend la réponse du serveur (grisé, non re-cliquable)
 *  - 'correct' : la bonne réponse révélée par le serveur
 *  - 'wrong'   : une mauvaise réponse — affichée uniquement si c'est celle choisie par le joueur
 *  - 'missed'  : la bonne réponse (aucun choix fait, temps écoulé)
 *
 * RÈGLE ABSOLUE : aucun verdict local avant la réponse du serveur.
 * L'état 'pending' est affiché dès le tap ; 'correct' / 'wrong' viennent de
 * DailyAnswerResultResponse.correct + correctIndex.
 */
import { TouchableOpacity, Text, View } from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

export type ChoiceState = 'idle' | 'pending' | 'correct' | 'wrong' | 'missed';

interface DailyChoiceButtonProps {
  index: number;
  label: string;
  state: ChoiceState;
  onPress: (index: number) => void;
}

const LABELS = ['A', 'B', 'C', 'D'];

export function DailyChoiceButton({ index, label, state, onPress }: DailyChoiceButtonProps) {
  const isDisabled = state !== 'idle';

  const bg = (() => {
    switch (state) {
      case 'correct': return palette.good;
      case 'wrong':   return palette.bad;
      case 'missed':  return palette.warn;
      case 'pending': return palette.bgDeep;
      default:        return palette.surface;
    }
  })();

  const textColor = (state === 'correct' || state === 'wrong' || state === 'missed')
    ? '#FFFFFF'
    : palette.txt;

  const borderColor = (() => {
    switch (state) {
      case 'correct': return palette.good;
      case 'wrong':   return palette.bad;
      case 'missed':  return palette.warn;
      case 'pending': return palette.line;
      default:        return palette.line;
    }
  })();

  return (
    <TouchableOpacity
      onPress={() => onPress(index)}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: bg,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor,
        paddingHorizontal: 14,
        paddingVertical: 14,
        opacity: state === 'pending' ? 0.6 : 1,
      }}
    >
      {/* Lettre du choix */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: state === 'idle' ? palette.bgDeep : 'rgba(255,255,255,0.25)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '700',
            fontSize: 13,
            color: state === 'idle' ? palette.inkSoft : '#FFFFFF',
          }}
        >
          {LABELS[index] ?? String(index + 1)}
        </Text>
      </View>

      {/* Texte du choix */}
      <Text
        style={{
          flex: 1,
          fontFamily: font.nativeFamily.ui,
          fontSize: 15,
          lineHeight: 21,
          fontWeight: '500',
          color: textColor,
        }}
        numberOfLines={3}
      >
        {label}
      </Text>

      {/* Icône résultat */}
      {state === 'correct' && <CheckCircle size={20} color="#FFFFFF" />}
      {state === 'wrong'   && <XCircle    size={20} color="#FFFFFF" />}
    </TouchableOpacity>
  );
}
