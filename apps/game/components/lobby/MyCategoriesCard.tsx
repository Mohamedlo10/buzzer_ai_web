import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Check, Edit3, Plus, Send } from 'lucide-react-native';
import { palette, inkAlpha } from '~/lib/theme/tokens';
import type { PlayerResponse, SessionResponse } from '~/types/api';

export interface MyCategoriesCardProps {
  currentPlayer?: PlayerResponse;
  session?: SessionResponse | null;
  questionMode?: string;
  onEditCategories: () => void;
  reqOpen: boolean;
  setReqOpen: React.Dispatch<React.SetStateAction<boolean>>;
  reqSent: boolean;
  reqText: string;
  setReqText: (text: string) => void;
  onSendCategoryRequest: () => void;
  categoryEmojiMap: Record<string, string>;
}

export function MyCategoriesCard({
  currentPlayer,
  session,
  questionMode,
  onEditCategories,
  reqOpen,
  setReqOpen,
  reqSent,
  reqText,
  setReqText,
  onSendCategoryRequest,
  categoryEmojiMap,
}: MyCategoriesCardProps) {
  if (currentPlayer?.isSpectator || questionMode === 'MANUAL') {
    return null;
  }

  const isManagerMode = session?.categorySelectionMode === 'MANAGER';
  const sessionThemes = session?.sessionCategories?.map((c) => c.name) ?? [];
  const selectedCategories = isManagerMode
    ? (sessionThemes.length > 0 ? sessionThemes : (currentPlayer?.selectedCategories ?? []))
    : (currentPlayer?.selectedCategories ?? []);

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      {/* Card Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: palette.primary, textTransform: 'uppercase' }}>
          {isManagerMode ? 'Thèmes imposés (par l’hôte)' : 'Mes catégories'}
        </Text>
        {!isManagerMode && (
          <TouchableOpacity
            onPress={onEditCategories}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 9999,
              backgroundColor: `${palette.primary}18`,
              borderWidth: 1,
              borderColor: `${palette.primary}33`,
            }}
          >
            <Edit3 size={11} color={palette.primary} />
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.primary }}>
              Modifier
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {selectedCategories.map((cat) => (
          <View
            key={cat}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.bg,
              borderWidth: 1,
              borderColor: isManagerMode ? `${palette.primary}44` : palette.line,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 9999,
            }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: palette.txt }}>
              {categoryEmojiMap[cat] ? `${categoryEmojiMap[cat]} ` : ''}{cat}
            </Text>
          </View>
        ))}

        {selectedCategories.length === 0 && (
          <Text style={{ fontSize: 12.5, color: palette.inkSoft, fontStyle: 'italic', paddingVertical: 4 }}>
            {isManagerMode ? 'Aucun thème imposé configuré' : 'Aucune catégorie sélectionnée'}
          </Text>
        )}

        {!isManagerMode && (
          <TouchableOpacity
            onPress={() => setReqOpen(!reqOpen)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: palette.line,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 9999,
            }}
          >
            <Plus size={12} color={palette.inkSoft} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: palette.inkSoft }}>
              Demander
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Request Form */}
      {!isManagerMode && reqOpen && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line }}>
          {reqSent ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
              <Check size={14} color={palette.good} />
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: palette.good }}>
                Demande envoyée à l&apos;hôte !
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <TextInput
                value={reqText}
                onChangeText={setReqText}
                placeholder="Suggère une catégorie à l'hôte…"
                placeholderTextColor={inkAlpha.faint}
                style={{
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: palette.bg,
                  borderWidth: 1,
                  borderColor: palette.line,
                  paddingHorizontal: 12,
                  fontSize: 13,
                  color: palette.txt,
                }}
              />
              <TouchableOpacity
                onPress={onSendCategoryRequest}
                disabled={reqText.trim().length < 3}
                activeOpacity={0.8}
                style={{
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: palette.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: reqText.trim().length < 3 ? 0.5 : 1,
                }}
              >
                <Send size={13} color={palette.primaryInk} />
                <Text style={{ color: palette.primaryInk, fontSize: 12.5, fontWeight: '700' }}>
                  Envoyer la suggestion
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
