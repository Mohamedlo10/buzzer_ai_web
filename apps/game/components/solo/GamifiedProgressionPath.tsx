import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import {
  Check,
  Lock,
  Play,
  Trophy,
  BookOpen,
  Gift,
} from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

export interface PathNodeItem {
  id: string | number;
  number: number;
  title: string;
  subtitle?: string;
  status: 'COMPLETED' | 'AVAILABLE' | 'UNLOCKED' | 'IN_PROGRESS' | 'LOCKED';
  score?: number;
  difficulty?: string;
  attempts?: number;
  threshold?: number;
  stars?: number;
}

export interface PathStageGroup {
  stageNumber: number;
  title: string;
  subtitle: string;
  difficulty: string;
  color: string;
  nodes: PathNodeItem[];
}

export interface GamifiedProgressionPathProps {
  theme: 'gold' | 'orange';
  stages: PathStageGroup[];
  onNodePress: (node: PathNodeItem) => void;
  headerTitle?: string;
  headerSubtitle?: string;
}

export function GamifiedProgressionPath({
  theme = 'gold',
  stages,
  onNodePress,
  headerTitle: _headerTitle,
  headerSubtitle: _headerSubtitle,
}: GamifiedProgressionPathProps) {
  // Theme Color Configurations
  const isGold = theme === 'gold';

  const themeColors = isGold
    ? {
        primary: palette.gold,
        primaryBright: '#F5C452',
        primaryDark: '#B87B14',
        glow: 'rgba(232, 166, 48, 0.35)',
        surfaceGlow: 'rgba(232, 166, 48, 0.12)',
        bannerBg: palette.txt,
        bannerText: palette.gold,
        badgeBg: 'rgba(232, 166, 48, 0.25)',
        checkBg: palette.gold,
        checkDark: '#B87B14',
      }
    : {
        primary: palette.primary,
        primaryBright: '#EB6847',
        primaryDark: '#9C351D',
        glow: 'rgba(209, 87, 58, 0.35)',
        surfaceGlow: 'rgba(209, 87, 58, 0.12)',
        bannerBg: palette.primary,
        bannerText: '#FFFFFF',
        badgeBg: 'rgba(255, 255, 255, 0.22)',
        checkBg: palette.primary,
        checkDark: '#9C351D',
      };

  // Subtle floating bounce animation for active node tooltip
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  // Sine-wave horizontal offset sequence generator
  const getXOffset = (index: number) => {
    // Elegant alternating S-curve pattern: 0 -> -48 -> -56 -> -20 -> +36 -> +56 -> +30 -> -24...
    const offsets = [0, -42, -54, -20, 24, 52, 38, -14, -48, -42, 18, 48, 20];
    return offsets[index % offsets.length];
  };

  let globalNodeIndex = 0;

  return (
    <View style={{ gap: 24, paddingBottom: 40 }}>
      {stages.map((stage, _stageIndex) => {
        const isStageCompleted = stage.nodes.every((n) => n.status === 'COMPLETED');

        return (
          <View key={stage.stageNumber} style={{ gap: 16 }}>
            {/* ── 1. Duolingo-Style Stage Section Header Banner ── */}
            <View
              style={{
                backgroundColor: themeColors.bannerBg,
                borderRadius: 22,
                paddingVertical: 14,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1.5,
                borderColor: isGold ? 'rgba(232, 166, 48, 0.35)' : 'rgba(255, 255, 255, 0.2)',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View style={{ gap: 3, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '800',
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      color: isGold ? themeColors.primary : '#FFFFFF',
                      opacity: isGold ? 1 : 0.9,
                    }}
                  >
                    Section {stage.stageNumber} · {stage.difficulty}
                  </Text>
                </View>

                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 17,
                    lineHeight: 22,
                    color: isGold ? palette.bg : '#FFFFFF',
                    paddingTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {stage.title}
                </Text>
              </View>

              {/* Guidebook / Stage Icon Badge */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: themeColors.badgeBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isGold ? (
                  <Trophy size={18} color={themeColors.primary} />
                ) : (
                  <BookOpen size={18} color="#FFFFFF" />
                )}
              </View>
            </View>

            {/* ── 2. Stepping Stone Nodes Path ── */}
            <View style={{ alignItems: 'center', marginVertical: 8, gap: 14 }}>
              {stage.nodes.map((node) => {
                const nodeIdx = globalNodeIndex++;
                const xOffset = getXOffset(nodeIdx);

                const isCompleted = node.status === 'COMPLETED';
                const isCurrent =
                  node.status === 'AVAILABLE' ||
                  node.status === 'UNLOCKED' ||
                  node.status === 'IN_PROGRESS';
                const isLocked = node.status === 'LOCKED';

                return (
                  <View
                    key={node.id}
                    style={{
                      alignItems: 'center',
                      transform: [{ translateX: xOffset }],
                      position: 'relative',
                      marginVertical: 4,
                    }}
                  >
                    {/* Active Floating Tooltip */}
                    {isCurrent && (
                      <Animated.View
                        style={{
                          transform: [{ translateY: bounceAnim }],
                          alignItems: 'center',
                          marginBottom: 6,
                          zIndex: 10,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: themeColors.primary,
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            shadowColor: themeColors.primary,
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.35,
                            shadowRadius: 6,
                            elevation: 5,
                          }}
                        >
                          <Play size={10} color={palette.primaryInk} fill={palette.primaryInk} />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '900',
                              color: palette.primaryInk,
                              letterSpacing: 0.5,
                            }}
                          >
                            JOUER
                          </Text>
                        </View>
                        {/* Triangle tip */}
                        <View
                          style={{
                            width: 0,
                            height: 0,
                            backgroundColor: 'transparent',
                            borderStyle: 'solid',
                            borderLeftWidth: 6,
                            borderRightWidth: 6,
                            borderTopWidth: 6,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderTopColor: themeColors.primary,
                          }}
                        />
                      </Animated.View>
                    )}

                    {/* ── Circular 3D Step Node ── */}
                    <TouchableOpacity
                      disabled={isLocked}
                      onPress={() => onNodePress(node)}
                      activeOpacity={0.82}
                      style={{
                        width: isCurrent ? 74 : 64,
                        height: isCurrent ? 74 : 64,
                        borderRadius: isCurrent ? 37 : 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isCompleted
                          ? themeColors.checkBg
                          : isCurrent
                          ? themeColors.primaryBright
                          : palette.surface,
                        borderWidth: isCurrent ? 4 : isCompleted ? 0 : 2,
                        borderColor: isCurrent
                          ? themeColors.primaryDark
                          : isLocked
                          ? palette.line
                          : themeColors.primary,
                        // 3D bottom bevel
                        borderBottomWidth: isCompleted ? 5 : isCurrent ? 6 : 4,
                        borderBottomColor: isCompleted
                          ? themeColors.checkDark
                          : isCurrent
                          ? themeColors.primaryDark
                          : palette.line,
                        shadowColor: isCompleted || isCurrent ? themeColors.primary : '#000000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isCompleted || isCurrent ? 0.3 : 0.05,
                        shadowRadius: 8,
                        elevation: isCurrent ? 6 : 3,
                      }}
                    >
                      {isCompleted ? (
                        <Check size={28} color="#FFFFFF" strokeWidth={3.8} />
                      ) : isCurrent ? (
                        <Text
                          style={{
                            fontFamily: font.nativeFamily.ui,
                            fontWeight: '900',
                            fontSize: 24,
                            color: palette.primaryInk,
                          }}
                        >
                          {node.number}
                        </Text>
                      ) : (
                        <Lock size={20} color={palette.inkSoft} />
                      )}
                    </TouchableOpacity>

                    {/* Star or Score pill below completed node */}
                    {isCompleted && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 2,
                          backgroundColor: palette.surface,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: palette.line,
                          marginTop: 6,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: themeColors.primary, fontWeight: '800' }}>
                          ★ {node.score ? `${node.score} pts` : 'Réussi'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* ── 3. Stage Reward Chest / Milestone Box at End of Section ── */}
              <View
                style={{
                  alignItems: 'center',
                  marginVertical: 10,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 22,
                    backgroundColor: isStageCompleted
                      ? themeColors.primary
                      : palette.surface,
                    borderWidth: 2,
                    borderColor: isStageCompleted
                      ? themeColors.primaryDark
                      : palette.line,
                    borderBottomWidth: 5,
                    borderBottomColor: isStageCompleted
                      ? themeColors.primaryDark
                      : palette.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isStageCompleted ? themeColors.primary : '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isStageCompleted ? 0.35 : 0.06,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Gift
                    size={30}
                    color={isStageCompleted ? '#FFFFFF' : palette.inkSoft}
                    strokeWidth={2.2}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: isStageCompleted ? themeColors.primary : palette.inkSoft,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {isStageCompleted ? 'Étape Complétée !' : `Coffre Étape ${stage.stageNumber}`}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
