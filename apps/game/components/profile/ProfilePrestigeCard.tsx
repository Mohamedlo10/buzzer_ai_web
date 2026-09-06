import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Trophy, Zap, Calendar, Award, Flame } from 'lucide-react-native';

import type { ProfileSummaryResponse } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';

interface ProfilePrestigeCardProps {
  profile: ProfileSummaryResponse;
}

export function ProfilePrestigeCard({ profile }: ProfilePrestigeCardProps) {
  // ── Données et calculs ────────────────────────────────────────────────────
  const gamesPlayed = profile.gamesPlayed || 0;
  const wins = profile.wins || 0;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  const successRate = Math.min(
    Math.max(Math.round(Number(profile.successRate || 0)), 0),
    100
  );

  // Géométrie du diagramme circulaire (Gauge SVG agrandie pour un centrage parfait)
  const size = 68;
  const strokeWidth = 4.5;
  const radius = 27;
  const circumference = 2 * Math.PI * radius; // ~169.65
  const strokeDashoffset =
    circumference - (circumference * successRate) / 100;

  const displayRank =
    profile.seasonRank !== null ? `#${profile.seasonRank}` : '#1';

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 14,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* ── Section Supérieure : Diagramme Circulaire + Barres de Ratios ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {/* Diagramme circulaire de réussite parfaitement proportionné et centré */}
        <View
          style={{
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Anneau de fond */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(91, 78, 61, 0.12)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Arc de progression */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={palette.good}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          {/* Valeur centrale et label bien espacés pour ne pas toucher l'anneau */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 12,
                lineHeight: 22,
                color: palette.txt,
                paddingTop: 1,
              }}
            >
              {successRate}%
            </Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontSize: 7,
                color: palette.inkSoft,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginTop: 1,
              }}
            >
              Réussite
            </Text>
          </View>
        </View>

        {/* Barres horizontales de performance bien centrées verticalement */}
        <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
          {/* En-tête : Titre + Rang */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontSize: 11,
                fontWeight: '700',
                color: palette.inkSoft,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              PERFORMANCES
            </Text> */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(143, 100, 20, 0.12)',
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 999,
              }}
            >
              {/* <Trophy size={11} color={palette.gold} /> */}
              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: palette.gold,
                }}
              >
                {displayRank} mondial
              </Text>
            </View>
          </View>

          {/* Barre 1 : Victoires */}
          <View style={{ gap: 3.5 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  fontSize: 11,
                  color: palette.inkSoft,
                  fontWeight: '500',
                }}
              >
                Victoires
              </Text>
              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  fontSize: 11,
                  color: palette.txt,
                  fontWeight: '700',
                }}
              >
                {wins} / {gamesPlayed} {gamesPlayed > 1 ? 'parties' : 'partie'}{' '}
                <Text style={{ color: palette.inkSoft, fontWeight: '500' }}>
                  ({winRate}%)
                </Text>
              </Text>
            </View>
            <View
              style={{
                height: 4.5,
                backgroundColor: 'rgba(91, 78, 61, 0.12)',
                borderRadius: 2.5,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${winRate}%`,
                  backgroundColor: palette.primary,
                  borderRadius: 2.5,
                }}
              />
            </View>
          </View>

          {/* Barre 2 : Bonnes réponses */}
          <View style={{ gap: 3.5 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  fontSize: 11,
                  color: palette.inkSoft,
                  fontWeight: '500',
                }}
              >
                Bonnes réponses
              </Text>
              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  fontSize: 11,
                  color: palette.txt,
                  fontWeight: '700',
                }}
              >
                {profile.correctAnswers} correctes
              </Text>
            </View>
            <View
              style={{
                height: 4.5,
                backgroundColor: 'rgba(91, 78, 61, 0.12)',
                borderRadius: 2.5,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${successRate}%`,
                  backgroundColor: palette.good,
                  borderRadius: 2.5,
                }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Ligne séparatrice discrète */}
      {/* <View style={{ height: 1, backgroundColor: palette.line, opacity: 0.6 }} /> */}

      {/* ── Section Inférieure : 4 Capsules Compactes et Bien Centrées ── */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <StatCapsule
          value={String(profile.bestScore)}
          label="Record"
        />
        <StatCapsule
          value={`${profile.daysPlayed} j`}
          label="Participation"
        />
        <StatCapsule
          value={String(profile.seasonPoints)}
          label="Pts saison"
        />
        <StatCapsule
          value={`${profile.currentStreak} j`}
          label="Série"
        />
      </View>
    </View>
  );
}

// ─── Capsule Statistique Compacte et Parfaitement Centrée ─────────────────────

function StatCapsule({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        // backgroundColor: palette.surface2,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3.5,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 12,
            lineHeight: 18,
            color: palette.txt,
            paddingTop: 1,
          }}
        >
          {value}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontFamily: font.nativeFamily.ui,
          fontSize: 9.5,
          fontWeight: '600',
          color: palette.inkSoft,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
