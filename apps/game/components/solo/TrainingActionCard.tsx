import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, ChevronRight, BookOpen, RotateCcw, Target } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { TrainingSessionSummary } from '~/types/training';

interface TrainingActionCardProps {
  session?: TrainingSessionSummary | null;
  totalSessions?: number;
  totalXp?: number;
}

export function TrainingActionCard({ session, totalSessions = 0, totalXp = 0 }: TrainingActionCardProps) {
  const router = useRouter();

  // ── State 1: Active Session in Progress ──
  if (session && session.status === 'IN_PROGRESS') {
    const percent = Math.min(Math.max(session.percentComplete ?? 0, 0), 100);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/solo/training/session/${session.sessionId}` as any)}
        activeOpacity={0.88}
        style={{
          backgroundColor: palette.surface,
          borderRadius: 24,
          borderWidth: 1.5,
          borderColor: palette.primary + '40',
          padding: 20,
          gap: 14,
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
                backgroundColor: palette.primary + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  fontSize: 10.5,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: palette.primary,
                  fontWeight: '800',
                  marginBottom: 1,
                }}
              >
                Session en cours
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
                {session.subject}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: palette.primary + '18',
              paddingHorizontal: 9,
              paddingVertical: 3.5,
              borderRadius: 9999,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: palette.primary }}>
              {session.difficulty}
            </Text>
          </View>
        </View>

        {/* Units Progression */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
              Unité {session.currentUnit} <Text style={{ color: palette.inkSoft, fontWeight: '500' }}>/ {session.totalUnits}</Text>
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: palette.primary }}>
              {percent}%
            </Text>
          </View>

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
                width: `${percent}%`,
                height: '100%',
                backgroundColor: palette.primary,
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
            <RotateCcw size={13} color={palette.primary} />
            <Text style={{ fontSize: 11.5, fontWeight: '600', color: palette.inkSoft }}>
              {session.correctChallenges}/{session.totalChallenges} défis réussis
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.primary }}>
              Reprendre la session
            </Text>
            <ChevronRight size={15} color={palette.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ── State 2: General Training Action Card ──
  return (
    <TouchableOpacity
      onPress={() => router.push('/solo/training' as any)}
      activeOpacity={0.88}
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: palette.primary + '35',
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
              backgroundColor: palette.primary + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={20} color={palette.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontSize: 10.5,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: palette.primary,
                fontWeight: '800',
                marginBottom: 1,
              }}
            >
              Mode Entraînement
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
              Apprendre & Tester
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: palette.primary + '18',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 9999,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: palette.primary }}>
            IA PÉDAGOGIQUE
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 12.5, color: palette.inkSoft, lineHeight: 17 }}>
        Fiches synthétiques, micro-défis variés et détection des lacunes pour maîtriser n'importe quel thème à votre rythme.
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: palette.line,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Target size={13} color={palette.primary} />
          <Text style={{ fontSize: 11.5, fontWeight: '600', color: palette.inkSoft }}>
            {totalSessions > 0 ? `${totalSessions} sessions effectuées` : 'Thèmes illimités'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.primary }}>
            Choisir un sujet
          </Text>
          <ChevronRight size={15} color={palette.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
