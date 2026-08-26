import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, ChevronRight, Zap, Plus } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { SoloCareerProgressResponse } from '~/types/solo';

interface CareerProgressCardProps {
  career?: SoloCareerProgressResponse | null;
  isLoading?: boolean;
}

export function CareerProgressCard({ career, isLoading }: CareerProgressCardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: palette.line,
          padding: 20,
          minHeight: 140,
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: palette.inkSoft, fontSize: 13, textAlign: 'center' }}>
          Chargement de votre carrière…
        </Text>
      </View>
    );
  }

  // ── State 1: Active Career in Progress ──
  if (career && career.status === 'ACTIVE') {
    const level = career.currentLevel || 1;
    const percentage = Math.min(Math.max(career.completionPercentage ?? Math.round(((level - 1) / 12) * 100), 0), 100);

    // Difficulty tier label & color
    let tierLabel = 'Facile';
    let tierColor = palette.good;
    if (level >= 10) {
      tierLabel = 'Extrême';
      tierColor = palette.primary;
    } else if (level >= 7) {
      tierLabel = 'Difficile';
      tierColor = palette.gold;
    } else if (level >= 4) {
      tierLabel = 'Moyen';
      tierColor = palette.indigo;
    }

    return (
      <TouchableOpacity
        onPress={() => router.push(`/solo/career/${career.careerId}` as any)}
        activeOpacity={0.88}
        style={{
          backgroundColor: palette.surface,
          borderRadius: 24,
          borderWidth: 1.5,
          borderColor: palette.gold + '40',
          padding: 20,
          gap: 14,
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        {/* Header: Trophy + Tag */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: palette.gold + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={20} color={palette.gold} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  fontSize: 10.5,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: palette.gold,
                  fontWeight: '800',
                  marginBottom: 1,
                }}
              >
                Carrière en cours
              </Text>
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 19,
                  lineHeight: 25,
                  color: palette.txt,
                  paddingTop: 3,
                  paddingBottom: 1,
                }}
                numberOfLines={1}
              >
                {career.category}
              </Text>
            </View>
          </View>

          {/* Difficulty Tier Badge */}
          <View
            style={{
              backgroundColor: tierColor + '18',
              paddingHorizontal: 9,
              paddingVertical: 3.5,
              borderRadius: 9999,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: tierColor }}>
              {tierLabel}
            </Text>
          </View>
        </View>

        {/* Level Progression & Percentage Bar */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
              Niveau {level} <Text style={{ color: palette.inkSoft, fontWeight: '500' }}>/ 12</Text>
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: palette.gold }}>
              {percentage}%
            </Text>
          </View>

          {/* Progress Bar Track */}
          <View
            style={{
              height: 7,
              backgroundColor: palette.line,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${percentage}%`,
                height: '100%',
                backgroundColor: palette.gold,
                borderRadius: 4,
              }}
            />
          </View>
        </View>

        {/* Footer CTA */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: palette.line,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Zap size={13} color={palette.gold} />
            <Text style={{ fontSize: 11.5, fontWeight: '600', color: palette.inkSoft }}>
              Score : {career.totalScore.toLocaleString('fr-FR')} pts
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.gold }}>
              Continuer le niveau {level}
            </Text>
            <ChevronRight size={15} color={palette.gold} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ── State 2: No Active Career ──
  return (
    <TouchableOpacity
      onPress={() => router.push('/solo/career/new' as any)}
      activeOpacity={0.88}
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: palette.gold + '40',
        padding: 20,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: palette.gold + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={20} color={palette.gold} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontSize: 10.5,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: palette.gold,
                fontWeight: '800',
                marginBottom: 1,
              }}
            >
              Mode Carrière
            </Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 18,
                lineHeight: 24,
                color: palette.txt,
                paddingTop: 3,
                paddingBottom: 1,
              }}
            >
              12 Niveaux à gravir
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: palette.gold + '20',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 9999,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: palette.gold }}>
            PROGRESSION
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 12.5, color: palette.inkSoft, lineHeight: 17 }}>
        Gravissez les échelons de Facile à Extrême sur le sujet de votre choix. Lancez votre première carrière !
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: palette.line,
          gap: 4,
        }}
      >
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.gold }}>
          Créer une carrière
        </Text>
        <Plus size={15} color={palette.gold} />
      </View>
    </TouchableOpacity>
  );
}
