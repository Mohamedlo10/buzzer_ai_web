import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles, Flame, Trophy } from 'lucide-react-native';
import type { GamificationDTO } from '~/types/training';
import { palette, font } from '~/lib/theme/tokens';
import { BadgePill } from './BadgePill';
import { PopView, FadeInUpView, FloatView } from '~/components/anim';

interface GamificationSummaryCardProps {
  gamification: GamificationDTO;
}

export function GamificationSummaryCard({ gamification }: GamificationSummaryCardProps) {
  const { xpEarned, totalXp, currentStreak, badge, newBadge } = gamification;

  return (
    <View style={{ gap: 12 }}>
      {/* ── Badge Level-Up Celebration Banner ── */}
      {newBadge && badge !== 'NONE' && (
        <PopView
          duration={450}
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderWidth: 1.5,
            borderColor: 'rgba(245, 158, 11, 0.5)',
            borderRadius: 20,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <FloatView duration={1800} distance={4}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: palette.gold + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={24} color={palette.gold} />
            </View>
          </FloatView>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: palette.gold, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              🎉 NOUVEAU RANG DÉBLOQUÉ !
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: palette.txt, marginTop: 2 }}>
              Vous avez obtenu le rang {badge} !
            </Text>
          </View>

          <BadgePill badge={badge} size="md" />
        </PopView>
      )}

      {/* ── XP & Streak Grid ── */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* XP Card */}
        <FadeInUpView
          duration={350}
          delay={100}
          style={{
            flex: 1,
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 16,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                backgroundColor: palette.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color={palette.primary} />
            </View>
            <BadgePill badge={badge} size="sm" />
          </View>

          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: palette.primary, fontFamily: font.nativeFamily.display }}>
              +{xpEarned} XP
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: palette.inkSoft, marginTop: 2 }}>
              Total : {totalXp} XP
            </Text>
          </View>
        </FadeInUpView>

        {/* Streak Card */}
        <FadeInUpView
          duration={350}
          delay={200}
          style={{
            flex: 1,
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: currentStreak > 1 ? 'rgba(249, 115, 22, 0.4)' : palette.line,
            padding: 16,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={18} color="#F97316" />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: palette.inkSoft }}>
              Série
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#F97316', fontFamily: font.nativeFamily.display }}>
              {currentStreak} {currentStreak > 1 ? 'jours' : 'jour'}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: palette.inkSoft, marginTop: 2 }}>
              {currentStreak > 1 ? '🔥 Continuez ainsi !' : 'Première session'}
            </Text>
          </View>
        </FadeInUpView>
      </View>
    </View>
  );
}
