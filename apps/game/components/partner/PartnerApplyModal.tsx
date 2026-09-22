import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';

import { PartnerApplyForm } from './PartnerApplyForm';
import { palette, font } from '~/lib/theme/tokens';

interface PartnerApplyModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * « Devenir partenaire », ouvert depuis la barre supérieure de l'annuaire.
 *
 * Même enveloppe que `PartnerProfileModal` : feuille remontante, fond `rgba(0,0,0,0.65)`,
 * rayons hauts de 28, hauteur plafonnée. C'est un `Modal` frère de la fiche partenaire au
 * niveau de l'écran, jamais imbriqué dedans.
 *
 * La saisie est protégée : tant que le formulaire est entamé et non envoyé, un tap sur le fond
 * ne ferme pas la feuille — huit champs perdus sur un tap à côté, c'est une candidature perdue.
 * La croix ferme toujours.
 */
export function PartnerApplyModal({ visible, onClose }: PartnerApplyModalProps) {
  const [dirty, setDirty] = useState(false);

  function close() {
    setDirty(false);
    onClose();
  }

  /** Fermeture « douce » : ignorée si la saisie est entamée. */
  function requestClose() {
    if (dirty) return;
    close();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={requestClose}>
      {/* Racine `KeyboardAvoidingView` : `maxHeight: '85%'` ne se résout que contre un parent de
          hauteur définie. Même construction que dans `PartnerProfileModal`. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={requestClose} />

        <View
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: palette.line,
            paddingTop: 12,
            paddingBottom: 36,
            paddingHorizontal: 20,
            maxHeight: '85%',
          }}
        >
          {/* Poignée */}
          <View
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              backgroundColor: palette.line,
              alignSelf: 'center',
              marginBottom: 14,
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Text
              style={{
                flex: 1,
                fontFamily: font.nativeFamily.display,
                fontSize: 20,
                color: palette.txt,
                paddingTop: 3,
              }}
            >
              Devenir partenaire
            </Text>
            <TouchableOpacity
              onPress={close}
              activeOpacity={0.7}
              hitSlop={8}
              accessibilityLabel="Fermer"
            >
              <X size={20} color={palette.inkSoft} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <PartnerApplyForm onDone={close} onDirtyChange={setDirty} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
