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
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Trophy,
  ArrowLeft,
  Send,
  Sparkles,
  Award,
} from 'lucide-react-native';

import * as soloApi from '~/lib/api/solo';
import { palette, font } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';

export default function NewCareerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ theme?: string }>();
  const [category, setCategory] = useState(params.theme || '');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    const trimmed = category.trim();
    if (!trimmed) {
      notify.error('Veuillez entrer un thème');
      return;
    }
    if (trimmed.length < 3) {
      notify.error('Le thème doit comporter au moins 3 caractères');
      return;
    }

    setIsCreating(true);
    try {
      const response = await soloApi.createCareer(trimmed);
      notify.success('Carrière créée avec succès !');
      router.replace(`/solo/career/${response.careerId}` as any);
    } catch (err: any) {
      notifyApiError(err, 'Erreur lors de la création de la carrière');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/dashboard');
            }
          }}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 22,
            lineHeight: 28,
            color: palette.txt,
            paddingTop: 4,
            flex: 1,
          }}
        >
          Nouvelle Carrière
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Rules Card */}
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
              backgroundColor: palette.gold + '26',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={22} color={palette.gold} />
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 17,
              lineHeight: 22,
              color: palette.txt,
              paddingTop: 2,
            }}
          >
            Règles du Mode Carrière
          </Text>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: palette.inkSoft, lineHeight: 18 }}>
              • Choisissez un sujet libre ou spécifique (ex: « Histoire romaine », « Cinéma des années 90 »).
            </Text>
            <Text style={{ fontSize: 13, color: palette.inkSoft, lineHeight: 18 }}>
              • Gravissez 12 niveaux de difficulté progressive (Facile → Moyen → Difficile → Extrême).
            </Text>
            <Text style={{ fontSize: 13, color: palette.inkSoft, lineHeight: 18 }}>
              • Chaque palier validé du 1er coup rapporte un bonus de +500 pts.
            </Text>
          </View>
        </View>

        {/* Input Card */}
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
              Quel thème souhaitez-vous conquérir ?
            </Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Ex: Football Européen, Histoire de France, Astronomie..."
              placeholderTextColor={palette.inkSoft}
              maxLength={50}
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

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isCreating || !category.trim()}
            activeOpacity={0.8}
            style={{
              backgroundColor: isCreating || !category.trim() ? palette.surface2 : palette.primary,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color={palette.primaryInk} />
            ) : (
              <>
                <Send size={16} color={isCreating || !category.trim() ? palette.inkSoft : palette.primaryInk} />
                <Text
                  style={{
                    color: isCreating || !category.trim() ? palette.inkSoft : palette.primaryInk,
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                >
                  Lancer la carrière
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
