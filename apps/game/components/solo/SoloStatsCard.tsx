import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Star, Target, Flame, Activity, ChevronRight, Sparkles } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

interface SoloStatsCardProps {
  rank?: number;
  totalScore?: number;
  winRate?: number; // 0.0 - 1.0
  totalGames?: number;
  currentStreak?: number;
}

export function SoloStatsCard({
  rank = 1,
  totalScore = 0,
  winRate = 0,
  totalGames = 0,
  currentStreak = 0,
}: SoloStatsCardProps) {
  const router = useRouter();

  const winRatePercent = Math.round(winRate > 1 ? winRate : winRate * 100);
  const rankDisplay = rank && rank > 0 ? `#${rank}` : '—';

  // Contextual subtitle
  const getRankCaption = () => {
    if (rank && rank > 0 && rank <= 10) return 'Top 10 mondial · Élite Xalaat';
    if (rank && rank > 0 && rank <= 100) return 'Top 100 mondial · Très bien classé';
    if (totalGames > 0) return 'En route vers le sommet';
    return 'Lance-toi pour intégrer le classement';
  };

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/rankings')}
      activeOpacity={0.88}
      style={{
        backgroundColor: palette.txt,
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 18,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 5,
        gap: 16,
      }}
    >
      {/* Decorative background glow circle */}
      <View
        style={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(232, 166, 48, 0.08)',
        }}
      />

      {/* ── Top Hero Section ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {/* Concentric Dual Badge with Rank Number */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 2.5,
            borderColor: 'rgba(232, 166, 48, 0.35)',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(232, 166, 48, 0.06)',
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: palette.gold,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(232, 166, 48, 0.18)',
            }}
          >
            {rank && rank > 0 ? (
              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  fontWeight: '900',
                  fontSize: 16,
                  color: palette.gold,
                }}
                numberOfLines={1}
              >
                {rankDisplay}
              </Text>
            ) : (
              <Trophy size={22} color={palette.gold} />
            )}
          </View>
        </View>

        {/* Text Details */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                backgroundColor: 'rgba(232, 166, 48, 0.22)',
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 9999,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: palette.gold,
                  fontWeight: '800',
                }}
              >
                Performances
              </Text>
            </View>
            <Sparkles size={12} color={palette.primary} />
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 18,
              lineHeight: 23,
              color: palette.bg,
              paddingTop: 6,
            }}
          >
            Statistiques & Classement
          </Text>

          <Text
            style={{
              fontFamily: font.nativeFamily.serif,
              fontStyle: 'italic',
              fontSize: 12.5,
              color: palette.bg,
              opacity: 0.85,
              lineHeight: 16,
            }}
          >
            {getRankCaption()}
          </Text>
        </View>
      </View>

      {/* ── Bottom Section: 4 Stat Pillars Grid ── */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          paddingVertical: 10,
          paddingHorizontal: 6,
        }}
      >
        {/* 1. RANG */}
        <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Trophy size={11} color={palette.gold} />
            <Text
              style={{
                fontSize: 9.5,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              Rang
            </Text>
          </View>
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '800',
              fontSize: 15,
              color: palette.gold,
            }}
            numberOfLines={1}
          >
            {rankDisplay}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ width: 1, height: '70%', alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* 2. POINTS */}
        <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Star size={11} color={palette.primary} />
            <Text
              style={{
                fontSize: 9.5,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              Points
            </Text>
          </View>
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '800',
              fontSize: 15,
              color: '#FFFFFF',
            }}
            numberOfLines={1}
          >
            {totalScore.toLocaleString('fr-FR')}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ width: 1, height: '70%', alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* 3. SUCCÈS */}
        <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Target size={11} color={palette.good} />
            <Text
              style={{
                fontSize: 9.5,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              Succès
            </Text>
          </View>
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '800',
              fontSize: 15,
              color: palette.good,
            }}
            numberOfLines={1}
          >
            {winRatePercent}%
          </Text>
        </View>

        {/* Divider */}
        <View style={{ width: 1, height: '70%', alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* 4. SÉRIE / PARTIES */}
        <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            {currentStreak >= 2 ? (
              <Flame size={11} color={palette.gold} />
            ) : (
              <Activity size={11} color={palette.indigo} />
            )}
            <Text
              style={{
                fontSize: 9.5,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              {currentStreak >= 2 ? 'Série' : 'Parties'}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '800',
              fontSize: 15,
              color: currentStreak >= 2 ? palette.gold : '#FFFFFF',
            }}
            numberOfLines={1}
          >
            {currentStreak >= 2 ? `${currentStreak} j` : totalGames}
          </Text>
        </View>
      </View>

      {/* ── Bottom Link ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <Text style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.65)', fontWeight: '500' }}>
          Classement mondial en direct
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: palette.primary }}>
            Voir le classement
          </Text>
          <ChevronRight size={14} color={palette.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
