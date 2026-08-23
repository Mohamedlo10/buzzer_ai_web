import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Brain,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import { palette } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';

const DIFFICULTIES = [
  { id: 'FACILE', label: 'Facile' },
  { id: 'MOYEN', label: 'Moyen' },
  { id: 'DIFFICILE', label: 'Difficile' },
  { id: 'EXTREME', label: 'Extrême' },
];

export default function NewCustomTrainingScreen() {
  const router = useRouter();
  const [theme, setTheme] = useState('');
  const [difficulty, setDifficulty] = useState('MOYEN');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    const trimmed = theme.trim();
    if (!trimmed) {
      notify.error('Veuillez entrer un thème');
      return;
    }
    if (trimmed.length < 3) {
      notify.error('Le thème doit faire au moins 3 caractères');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await soloApi.createCustomTraining(trimmed, difficulty);
      notify.success('Entraînement IA généré avec succès !');
      router.replace(`/solo/training/${response.planId}` as any);
    } catch (err: any) {
      notifyApiError(err, 'Erreur lors de la génération du plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: '800', color: palette.txt, flex: 1 }}>
          Générer un Plan IA
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 18 }} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 20,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: palette.primary + '26',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={22} color={palette.primary} />
          </View>

          <Text style={{ fontSize: 17, fontWeight: '800', color: palette.txt }}>
            Entraînement Personnalisé
          </Text>

          <Text style={{ fontSize: 13, color: palette.inkSoft, lineHeight: 18 }}>
            L'intelligence artificielle va concevoir 3 séries de questions progressives adaptées au thème et au niveau choisis.
          </Text>
        </View>

        {/* Input & Difficulty */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 20,
            gap: 16,
          }}
        >
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
              Thème souhaité
            </Text>
            <TextInput
              value={theme}
              onChangeText={setTheme}
              placeholder="Ex: Mythologie Grecque, Jazz, Intelligence Artificielle..."
              placeholderTextColor={palette.inkSoft}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: palette.txt,
                fontSize: 15,
                fontWeight: '600',
              }}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
              Niveau de difficulté
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => setDifficulty(d.id)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: difficulty === d.id ? palette.primary : palette.surface2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: difficulty === d.id ? palette.primaryInk : palette.txt,
                    }}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleGenerate}
            disabled={isGenerating || !theme.trim()}
            activeOpacity={0.8}
            style={{
              backgroundColor: isGenerating || !theme.trim() ? palette.surface2 : palette.primary,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              marginTop: 4,
            }}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color={palette.primaryInk} />
                <Text style={{ color: palette.primaryInk, fontSize: 14, fontWeight: '700' }}>
                  Génération des questions (10-20s)…
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={16} color={isGenerating || !theme.trim() ? palette.inkSoft : palette.primaryInk} />
                <Text
                  style={{
                    color: isGenerating || !theme.trim() ? palette.inkSoft : palette.primaryInk,
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                >
                  Générer l'entraînement
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
