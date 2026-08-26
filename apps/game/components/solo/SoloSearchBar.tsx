import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';

const QUICK_THEMES = [
  { label: 'Histoire du Sénégal 🇸🇳', theme: 'Histoire du Sénégal' },
  { label: 'Cinéma & Séries 🎬', theme: 'Cinéma' },
  { label: 'Musique & Mbalax 🎵', theme: 'Mbalax et Musique' },
  { label: 'Géographie 🌍', theme: 'Géographie' },
  { label: 'Sciences & Nature 🧪', theme: 'Sciences' },
  { label: 'Football & Sport ⚽', theme: 'Football et Sport' },
];

interface SoloSearchBarProps {
  onSearch?: (prompt: string) => void;
}

export function SoloSearchBar({ onSearch }: SoloSearchBarProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (onSearch) {
      onSearch(trimmed);
    } else {
      if (trimmed) {
        router.push(`/solo/career/new?theme=${encodeURIComponent(trimmed)}` as any);
      } else {
        router.push('/solo/career/new' as any);
      }
    }
  };

  const handleChipPress = (theme: string) => {
    router.push(`/solo/career/new?theme=${encodeURIComponent(theme)}` as any);
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Search Input Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: palette.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: palette.line,
          paddingHorizontal: 14,
          paddingVertical: 7,
          gap: 10,
          shadowColor: '#000',
          shadowOpacity: 0.03,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        <Sparkles size={18} color={palette.primary} />
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Tape un sujet généré par IA…"
          placeholderTextColor={palette.inkSoft}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
          style={{
            flex: 1,
            fontSize: 14,
            color: palette.txt,
            paddingVertical: 6,
          }}
        />
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.8}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: palette.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowRight size={16} color={palette.primaryInk} />
        </TouchableOpacity>
      </View>

      {/* Quick Theme Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {QUICK_THEMES.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => handleChipPress(item.theme)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: palette.txt }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
