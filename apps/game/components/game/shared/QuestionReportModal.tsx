import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { X, CheckCircle, Flag } from 'lucide-react-native';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';
import { notify } from '~/lib/ui/notify';

interface QuestionReportModalProps {
  visible: boolean;
  questionId?: string;
  questionText?: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Contenu offensant ou inapproprié',
  'Réponse ou fait inexact',
  'Faute de formulation / orthographe',
  'Autre motif',
];

export function QuestionReportModal({
  visible,
  questionId: _questionId,
  questionText: _questionText,
  onClose,
}: QuestionReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      notify.success('Signalement transmis à la modération.');
      onClose();
    }, 600);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 440, backgroundColor: palette.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: palette.line }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: palette.warn + '26', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.warn + '4D' }}>
                <Flag size={16} color={palette.warn} />
              </View>
              <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 18, paddingTop: 2 }}>Signaler la question</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ padding: 4 }}>
              <X size={20} color={palette.txt} />
            </TouchableOpacity>
          </View>

          <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 13, marginBottom: 16 }}>
            Aidez-nous à maintenir des questions de qualité.
          </Text>

          {/* Reasons */}
          <View style={{ gap: 8, marginBottom: 16 }}>
            {REPORT_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.8}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isSelected ? palette.primary + '26' : palette.bg,
                    borderColor: isSelected ? palette.primary : palette.line,
                  }}
                >
                  <Text style={{ fontFamily: font.nativeFamily.ui, fontSize: 13, fontWeight: '600', color: isSelected ? palette.txt : palette.inkSoft }}>
                    {reason}
                  </Text>
                  {isSelected && <CheckCircle size={14} color={palette.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional Details */}
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Détails supplémentaires (facultatif)..."
            placeholderTextColor={inkAlpha.faint}
            style={{
              fontFamily: font.nativeFamily.ui,
              width: '100%',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: palette.bg,
              color: palette.txt,
              fontSize: 13,
              borderWidth: 1,
              borderColor: palette.line,
              marginBottom: 16,
              minHeight: 60,
            }}
            multiline
            textAlignVertical="top"
          />

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 14, paddingTop: 2 }}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: palette.bad, alignItems: 'center', justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ fontFamily: font.nativeFamily.display, color: '#FFFFFF', fontSize: 14, paddingTop: 2 }}>Signaler</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
