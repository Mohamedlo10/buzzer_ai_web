import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Plus,
  X,
  Check,
  Sparkles,
  Crown,
  Medal,
  Award,
  Flame,
  TrendingUp,
} from 'lucide-react-native';
import * as categoriesApi from '~/lib/api/categories';
import type { CategoryRequest, Difficulty } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';

const PREDEFINED_CATEGORIES = [
  { name: 'Histoire', emoji: '📜', hexColor: palette.gold },
  { name: 'Science', emoji: '🔬', hexColor: palette.primary },
  { name: 'Sports', emoji: '🏆', hexColor: palette.bad },
  { name: 'Géographie', emoji: '🌍', hexColor: palette.indigo },
  { name: 'Culture G', emoji: '🌐', hexColor: palette.violet },
  { name: 'Cinéma', emoji: '🎬', hexColor: palette.bad },
];

const DIFFICULTIES: { value: Difficulty; label: string; hexColor: string }[] = [
  { value: 'FACILE', label: 'Facile', hexColor: palette.primary },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire', hexColor: palette.gold },
  { value: 'EXPERT', label: 'Expert', hexColor: palette.bad },
];

const getRankBadgeStyle = (index: number) => {
  switch (index) {
    case 0:
      return {
        bg: palette.gold + '24',
        text: palette.gold,
        border: palette.gold + '44',
        icon: <Crown size={12} color={palette.gold} strokeWidth={2.5} />,
      };
    case 1:
      return {
        bg: '#64748B20',
        text: '#475569',
        border: '#64748B38',
        icon: <Medal size={12} color="#475569" strokeWidth={2.5} />,
      };
    case 2:
      return {
        bg: palette.bronze + '20',
        text: palette.bronze,
        border: palette.bronze + '44',
        icon: <Award size={12} color={palette.bronze} strokeWidth={2.5} />,
      };
    case 3:
      return {
        bg: palette.primary + '1A',
        text: palette.primary,
        border: palette.primary + '38',
        icon: <Flame size={12} color={palette.primary} strokeWidth={2.5} />,
      };
    case 4:
      return {
        bg: palette.indigo + '1A',
        text: palette.indigo,
        border: palette.indigo + '38',
        icon: <TrendingUp size={12} color={palette.indigo} strokeWidth={2.5} />,
      };
    case 5:
    default:
      return {
        bg: palette.surface2,
        text: palette.inkSoft,
        border: palette.line,
        icon: <Sparkles size={12} color={palette.inkSoft} strokeWidth={2.5} />,
      };
  }
};

export interface CategoryPickerProps {
  selectedCategories: CategoryRequest[];
  onChange: (categories: CategoryRequest[]) => void;
  maxCategories?: number;
  showProgress?: boolean;
}

export function CategoryPicker({
  selectedCategories,
  onChange,
  maxCategories = 10,
  showProgress = true,
}: CategoryPickerProps) {
  const [customCategory, setCustomCategory] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<Difficulty>('INTERMEDIAIRE');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [popularCategories, setPopularCategories] = useState<{ name: string; hexColor: string }[]>(PREDEFINED_CATEGORIES);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadPopular = async () => {
      try {
        const catNames = await categoriesApi.getPopularCategories(6);
        let mapped = catNames.map((name) => {
          const predefined = PREDEFINED_CATEGORIES.find((p) => p.name.toLowerCase() === name.toLowerCase());
          if (predefined) return { name: predefined.name, hexColor: predefined.hexColor };
          const colors = [palette.primary, palette.gold, palette.bad, palette.indigo, palette.violet];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          return { name, hexColor: randomColor };
        });

        if (mapped.length < 6) {
          const needed = 6 - mapped.length;
          const toAdd = PREDEFINED_CATEGORIES.filter(
            (p) => !mapped.some((m) => m.name.toLowerCase() === p.name.toLowerCase())
          )
            .slice(0, needed)
            .map((p) => ({ name: p.name, hexColor: p.hexColor }));
          mapped = [...mapped, ...toAdd];
        }
        setPopularCategories(mapped);
      } catch {
        // fallback to predefined
      } finally {
        setIsLoadingPopular(false);
      }
    };
    loadPopular();
  }, []);

  const canAddMore = selectedCategories.length < maxCategories;

  const toggleCategory = (catName: string) => {
    const exists = selectedCategories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (exists) {
      onChange(selectedCategories.filter((c) => c.name.toLowerCase() !== catName.toLowerCase()));
    } else if (canAddMore) {
      onChange([...selectedCategories, { name: catName, difficulty: 'INTERMEDIAIRE' }]);
    }
  };

  const updateDifficulty = (catName: string, difficulty: Difficulty) => {
    onChange(
      selectedCategories.map((c) =>
        c.name.toLowerCase() === catName.toLowerCase() ? { ...c, difficulty } : c
      )
    );
  };

  const removeCategory = (name: string) => {
    onChange(selectedCategories.filter((c) => c.name !== name));
  };

  const commitCustomCategory = (nameToCommit?: string) => {
    const name = (nameToCommit ?? customCategory).trim().replace(/[,;\n]/g, '');
    if (!name || name.length < 2) return;
    if (!canAddMore) return;

    const exists = selectedCategories.some((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!exists) {
      onChange([...selectedCategories, { name, difficulty: customDifficulty }]);
    }
    setCustomCategory('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleCustomCategoryChange = (text: string) => {
    if (text.includes(',') || text.includes(';') || text.includes('\n')) {
      const parts = text.split(/[,;\n]/);
      for (const part of parts) {
        if (part.trim().length >= 2) commitCustomCategory(part.trim());
      }
      setCustomCategory('');
      return;
    }
    setCustomCategory(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const trimmed = text.trim();
    if (trimmed.length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await categoriesApi.searchCategories(trimmed);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Optional Progress bar */}
      {showProgress && (
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontFamily: font.nativeFamily.display, color: palette.inkSoft, fontSize: 13, lineHeight: 18, paddingTop: 4, paddingBottom: 2 }}>
              Progression
            </Text>
            <Text style={{ fontFamily: font.nativeFamily.display, color: palette.primary, fontSize: 13, lineHeight: 18, paddingTop: 4, paddingBottom: 2 }}>
              {selectedCategories.length}/{maxCategories}
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: palette.surface2, borderRadius: 9999, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${Math.min(100, (selectedCategories.length / maxCategories) * 100)}%`,
                backgroundColor: palette.primary,
                borderRadius: 9999,
              }}
            />
          </View>
        </View>
      )}

      {/* Custom Category Input */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Catégorie sur mesure
          </Text>
          <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 12 }}>
            Virgule ou bouton
          </Text>
        </View>

        <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: palette.line }}>
            <Sparkles size={16} color={palette.primary} />
            <TextInput
              value={customCategory}
              onChangeText={handleCustomCategoryChange}
              onSubmitEditing={() => commitCustomCategory()}
              placeholder="Ton thème (ex: Manga, Jazz, Pâtisserie)"
              placeholderTextColor={palette.inkSoft}
              returnKeyType="done"
              style={{ flex: 1, color: palette.txt, fontSize: 14, fontWeight: '500' }}
            />
            {customCategory.trim() ? (
              <TouchableOpacity
                onPress={() => commitCustomCategory()}
                activeOpacity={0.8}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: palette.primary }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Ajouter</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {showDropdown && customCategory.trim().length >= 2 && (
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {isSearching ? (
                <View style={{ width: '100%', paddingVertical: 8, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={palette.primary} />
                </View>
              ) : (
                searchResults.map((result) => (
                  <TouchableOpacity
                    key={result}
                    onPress={() => commitCustomCategory(result)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 9999,
                      backgroundColor: palette.surface2,
                      borderWidth: 1,
                      borderColor: palette.line,
                    }}
                  >
                    <Plus size={12} color={palette.primary} />
                    <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '600' }}>{result}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </View>

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Check size={14} color={palette.primary} />
            <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Sélectionnées ({selectedCategories.length})
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            {selectedCategories.map((category) => {
              const popularIdx = popularCategories.findIndex((c) => c.name.toLowerCase() === category.name.toLowerCase());
              const rankStyle = popularIdx >= 0 ? getRankBadgeStyle(popularIdx) : null;

              return (
                <View
                  key={category.name}
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: palette.line,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {popularIdx >= 0 ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: rankStyle!.bg,
                        borderWidth: 1,
                        borderColor: rankStyle!.border,
                      }}
                    >
                      {rankStyle!.icon}
                      <Text style={{ fontSize: 11, fontWeight: '800', color: rankStyle!.text }}>
                        {popularIdx + 1}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: palette.surface2,
                        borderWidth: 1,
                        borderColor: palette.line,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: palette.inkSoft }}>#</Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>{category.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {DIFFICULTIES.map((diff) => (
                        <TouchableOpacity
                          key={diff.value}
                          onPress={() => updateDifficulty(category.name, diff.value)}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: category.difficulty === diff.value ? diff.hexColor : palette.surface2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: category.difficulty === diff.value ? '#ffffff' : palette.inkSoft,
                            }}
                          >
                            {diff.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeCategory(category.name)}
                    activeOpacity={0.7}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      backgroundColor: palette.bad + '2E',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={14} color={palette.bad} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Popular Categories Grid */}
      <View>
        <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
          Catégories populaires
        </Text>
        {isLoadingPopular ? (
          <ActivityIndicator color={palette.primary} style={{ marginTop: 10 }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {popularCategories.map((cat, index) => {
              const isSelected = !!selectedCategories.find((c) => c.name.toLowerCase() === cat.name.toLowerCase());
              const disabled = !isSelected && !canAddMore;
              const rankStyle = getRankBadgeStyle(index);

              return (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => toggleCategory(cat.name)}
                  disabled={disabled}
                  activeOpacity={0.75}
                  style={{
                    width: '48%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: isSelected ? cat.hexColor : palette.line,
                    backgroundColor: isSelected ? cat.hexColor + '28' : palette.surface,
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: rankStyle.bg,
                      borderWidth: 1,
                      borderColor: rankStyle.border,
                    }}
                  >
                    {rankStyle.icon}
                    <Text style={{ fontSize: 11, fontWeight: '800', color: rankStyle.text }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontWeight: '600', fontSize: 14, flex: 1, paddingBottom: 2, paddingTop: 4 }} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  {isSelected && <Check size={16} color={cat.hexColor} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
