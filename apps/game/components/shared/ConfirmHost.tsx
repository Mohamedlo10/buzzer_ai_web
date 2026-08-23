import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { AlertTriangle, AlertCircle, HelpCircle, LogOut } from 'lucide-react-native';
import { useConfirmStore, type ConfirmTone } from '~/lib/ui/confirm';
import { palette, font } from '~/lib/theme/tokens';

const TONE_COLORS: Record<ConfirmTone, string> = {
  default: palette.primary,
  danger: palette.bad,
  warning: palette.gold,
};

export function ConfirmHost() {
  const pending = useConfirmStore((s) => s.pending);
  const settle = useConfirmStore((s) => s.settle);

  if (!pending) return null;

  const tone = pending.tone || 'default';
  const color = TONE_COLORS[tone] || palette.primary;
  const isLogout = pending.title.toLowerCase().includes('déconnexion');

  const IconComponent = isLogout
    ? LogOut
    : tone === 'danger'
      ? AlertTriangle
      : tone === 'warning'
        ? AlertCircle
        : HelpCircle;

  return (
    <Modal
      key={pending.id}
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => settle(false)}
    >
      <TouchableWithoutFeedback onPress={() => settle(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(28, 19, 13, 0.65)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                width: '100%',
                maxWidth: 340,
                backgroundColor: palette.surface,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: palette.line,
                padding: 22,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              {/* Tone Icon */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: `${color}1A`,
                  borderWidth: 1,
                  borderColor: `${color}33`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <IconComponent size={26} color={color} />
              </View>

              {/* Title */}
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 18,
                  lineHeight: 24,
                  color: palette.txt,
                  textAlign: 'center',
                  paddingTop: 2,
                  marginBottom: 8,
                }}
              >
                {pending.title}
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontSize: 13.5,
                  lineHeight: 19,
                  color: palette.inkSoft,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                {pending.message}
              </Text>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  onPress={() => settle(false)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: palette.surface2,
                    borderWidth: 1,
                    borderColor: palette.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>
                    {pending.cancelLabel || 'Annuler'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => settle(true)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: color,
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 14 }}>
                    {pending.confirmLabel || 'Confirmer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
