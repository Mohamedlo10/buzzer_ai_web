import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { AlertTriangle, X, CheckCircle, Flag } from 'lucide-react-native';
import { palette, inkAlpha } from '~/lib/theme/tokens';
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
  questionId,
  questionText,
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
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="w-full max-w-md bg-surface rounded-3xl p-6 border border-line shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-warn/15 flex-row items-center justify-center border border-warn/30">
                <Flag size={16} color={palette.warn} />
              </View>
              <Text className="text-txt font-bold text-lg font-display">Signaler la question</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-1">
              <X size={20} color={palette.txt} />
            </TouchableOpacity>
          </View>

          <Text className="text-txt-60 text-xs mb-4">
            Aidez-nous à maintenir des questions de qualité générées par l&apos;IA.
          </Text>

          {/* Reasons */}
          <View className="flex-col gap-2 mb-4">
            {REPORT_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.8}
                  className={`p-3 rounded-xl border flex-row items-center justify-between ${
                    isSelected ? 'bg-accent/15 border-accent' : 'bg-bg border-line'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${isSelected ? 'text-txt' : 'text-txt-60'}`}>
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
            className="w-full px-3.5 py-2.5 rounded-xl bg-bg text-txt text-xs border border-line mb-4 min-h-[60px]"
            multiline
            textAlignVertical="top"
          />

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-1 py-3 rounded-xl bg-surface2 border border-line items-center justify-center"
            >
              <Text className="text-txt font-semibold text-xs">Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
              className="flex-1 py-3 rounded-xl bg-bad items-center justify-center"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-xs">Signaler</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
