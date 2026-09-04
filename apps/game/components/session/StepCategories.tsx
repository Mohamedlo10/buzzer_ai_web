import React from 'react';
import { View, Text } from 'react-native';
import { Target } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { CategoryRequest } from '~/types/api';
import { CategoryPicker } from './CategoryPicker';

export interface StepCategoriesProps {
  sessionCategories: CategoryRequest[];
  setSessionCategories: (cats: CategoryRequest[]) => void;
  maxCategories?: number;
}

export function StepCategories({
  sessionCategories,
  setSessionCategories,
  maxCategories = 10,
}: StepCategoriesProps) {
  return (
    <View style={{ gap: 20 }}>
      {/* Banner explicatif */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.primary + '50',
          backgroundColor: palette.primary + '14',
        }}
      >
        <Target size={20} color={palette.primary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{
              color: palette.txt,
              fontSize: 14,
              fontWeight: '700',
              fontFamily: font.nativeFamily.display,
            }}
          >
            Thèmes imposés de la session
          </Text>
          <Text style={{ color: palette.inkSoft, fontSize: 12, lineHeight: 18 }}>
            Sélectionnez entre 1 et {maxCategories} thèmes. Tous les participants recevront des questions uniquement sur ces thèmes.
          </Text>
        </View>
      </View>

      {/* Sélecteur de catégories */}
      <CategoryPicker
        selectedCategories={sessionCategories}
        onChange={setSessionCategories}
        maxCategories={maxCategories}
        showProgress={true}
      />
    </View>
  );
}
