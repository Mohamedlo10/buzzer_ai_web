import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { TrendingUp, X, Play, Minus, Plus } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { SessionResponse } from '~/types/api';

export interface QuestionLimitModalProps {
  visible: boolean;
  session: SessionResponse;
  realPlayerCount: number;
  adjustedQPerCat: number;
  setAdjustedQPerCat: React.Dispatch<React.SetStateAction<number>>;
  isSavingConfig: boolean;
  isStarting: boolean;
  onClose: () => void;
  onStartWithAdjustedQ: () => void;
}

export function QuestionLimitModal({
  visible,
  session,
  realPlayerCount,
  adjustedQPerCat,
  setAdjustedQPerCat,
  isSavingConfig,
  isStarting,
  onClose,
  onStartWithAdjustedQ,
}: QuestionLimitModalProps) {
  if (!visible) return null;

  const cats = session.maxCategoriesPerPlayer ?? 1;
  const totalCurrent = cats * (session.questionsPerCategory ?? 1) * realPlayerCount;
  const totalAdjusted = cats * adjustedQPerCat * realPlayerCount;
  const maxAllowed = Math.max(1, Math.floor(60 / (cats * realPlayerCount)));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            width: '100%',
            maxWidth: 380,
            padding: 20,
            borderWidth: 1,
            borderColor: palette.line,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: `${palette.bad}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp size={18} color={palette.bad} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 16,
                    lineHeight: 22,
                    color: palette.txt,
                    paddingTop: 2,
                  }}
                >
                  Limite dépassée
                </Text>
                <Text style={{ fontSize: 11.5, color: palette.inkSoft }}>
                  Le total dépasse 60 questions
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: palette.bg,
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} color={palette.txt} />
            </TouchableOpacity>
          </View>

          {/* Breakdown Box */}
          <View
            style={{
              backgroundColor: palette.bg,
              borderRadius: 16,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: palette.inkSoft, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
              Calcul actuel
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
                {cats} thèmes × {session.questionsPerCategory} Q × {realPlayerCount} joueurs = <Text style={{ color: palette.bad }}>{totalCurrent} Q</Text>
              </Text>
            </View>
          </View>

          {/* Stepper */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt, marginBottom: 8 }}>
              Questions par catégorie :
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                backgroundColor: palette.bg,
                borderRadius: 16,
                padding: 10,
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <TouchableOpacity
                onPress={() => setAdjustedQPerCat((v) => Math.max(1, v - 1))}
                activeOpacity={0.7}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor: palette.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Minus size={16} color={palette.txt} />
              </TouchableOpacity>

              <Text style={{ fontSize: 20, fontWeight: '800', color: palette.primary, minWidth: 32, textAlign: 'center' }}>
                {adjustedQPerCat}
              </Text>

              <TouchableOpacity
                onPress={() => setAdjustedQPerCat((v) => Math.min(maxAllowed, v + 1))}
                activeOpacity={0.7}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor: palette.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={16} color={palette.txt} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: palette.inkSoft }}>Nouveau total :</Text>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: totalAdjusted <= 60 ? palette.good : palette.bad }}>
                {totalAdjusted} questions
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={onStartWithAdjustedQ}
            disabled={isSavingConfig || isStarting || totalAdjusted > 60}
            activeOpacity={0.85}
            style={{
              height: 48,
              borderRadius: 14,
              backgroundColor: palette.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isSavingConfig || isStarting || totalAdjusted > 60 ? 0.6 : 1,
            }}
          >
            {isSavingConfig || isStarting ? (
              <ActivityIndicator size="small" color={palette.primaryInk} />
            ) : (
              <>
                <Play size={16} color={palette.primaryInk} fill="currentColor" />
                <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 14 }}>
                  Appliquer et lancer ({totalAdjusted} Q)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
