import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Star, Target, Flame, Activity } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

interface SoloProgressPillsProps {
  rank?: number;
  totalScore?: number;
  winRate?: number; // 0.0 - 1.0
  totalGames?: number;
  currentStreak?: number;
}

export function SoloProgressPills({
  rank,
  totalScore = 0,
  winRate = 0,
  totalGames = 0,
  currentStreak = 0,
}: SoloProgressPillsProps) {
  const router = useRouter();

  const winRatePercent = Math.round(winRate > 1 ? winRate : winRate * 100);

  return (
    <View style={{ flexDirection: 'row', gap: 7 }}>
      {/* 1. Rang Mondial Pill */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/rankings')}
        activeOpacity={0.8}
        style={{
          flex: 1,
          backgroundColor: palette.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.line,
          paddingVertical: 10,
          paddingHorizontal: 8,
          gap: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Trophy size={12} color={palette.gold} />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: palette.inkSoft,
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            Rang
          </Text>
        </View>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '800',
            fontSize: 15,
            lineHeight: 20,
            color: palette.txt,
          }}
          numberOfLines={1}
        >
          {rank && rank > 0 ? `#${rank}` : '—'}
        </Text>
      </TouchableOpacity>

      {/* 2. Score Total Pill */}
      <View
        style={{
          flex: 1,
          backgroundColor: palette.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.line,
          paddingVertical: 10,
          paddingHorizontal: 8,
          gap: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Star size={12} color={palette.primary} />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: palette.inkSoft,
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            Points
          </Text>
        </View>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '800',
            fontSize: 15,
            lineHeight: 20,
            color: palette.txt,
          }}
          numberOfLines={1}
        >
          {totalScore.toLocaleString('fr-FR')}
        </Text>
      </View>

      {/* 3. Taux de Réussite / Succès Pill */}
      <View
        style={{
          flex: 1,
          backgroundColor: palette.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.line,
          paddingVertical: 10,
          paddingHorizontal: 8,
          gap: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Target size={12} color={palette.good} />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: palette.inkSoft,
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            Succès
          </Text>
        </View>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '800',
            fontSize: 15,
            lineHeight: 20,
            color: palette.txt,
          }}
          numberOfLines={1}
        >
          {winRatePercent}%
        </Text>
      </View>

      {/* 4. Série ou Parties Jouées */}
      <View
        style={{
          flex: 1,
          backgroundColor: palette.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.line,
          paddingVertical: 10,
          paddingHorizontal: 8,
          gap: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {currentStreak >= 2 ? (
            <Flame size={12} color={palette.gold} />
          ) : (
            <Activity size={12} color={palette.indigo} />
          )}
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: palette.inkSoft,
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            {currentStreak >= 2 ? 'Série' : 'Parties'}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '800',
            fontSize: 15,
            lineHeight: 20,
            color: palette.txt,
          }}
          numberOfLines={1}
        >
          {currentStreak >= 2 ? `${currentStreak} j` : totalGames}
        </Text>
      </View>
    </View>
  );
}
