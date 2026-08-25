import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle2, Zap, Clock, HelpCircle, SkipForward, Award } from 'lucide-react-native';
import { Avatar } from '~/components/shared/Avatar';
import { palette, font } from '~/lib/theme/tokens';
import type { CategoryRanking, CategoryQuestionSummary } from '~/types/api';

interface CategoryQuestionsModalProps {
  visible: boolean;
  category: CategoryRanking | null;
  categoryColor: string;
  categoryIcon: string;
  isSprint: boolean;
  onClose: () => void;
}

function formatSolverTime(ms?: number | null): string {
  if (!ms || ms <= 0) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function difficultyColor(diff?: string): string {
  if (!diff) return palette.inkSoft;
  switch (diff.toUpperCase()) {
    case 'EASY':
    case 'FACILE':
      return palette.good;
    case 'HARD':
    case 'DIFFICILE':
      return palette.bad;
    case 'MEDIUM':
    case 'MOYEN':
    default:
      return palette.warn;
  }
}

function difficultyLabel(diff?: string): string {
  if (!diff) return 'Moyen';
  switch (diff.toUpperCase()) {
    case 'EASY':
    case 'FACILE':
      return 'Facile';
    case 'HARD':
    case 'DIFFICILE':
      return 'Difficile';
    case 'MEDIUM':
    case 'MOYEN':
    default:
      return 'Moyen';
  }
}

export function CategoryQuestionsModal({
  visible,
  category,
  categoryColor,
  categoryIcon,
  isSprint,
  onClose,
}: CategoryQuestionsModalProps) {
  const insets = useSafeAreaInsets();
  if (!category) return null;

  const questions: CategoryQuestionSummary[] = category.questions ?? [];
  const rankings = category.rankings ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'flex-end',
        }}
      >
        {/* Backdrop to tap and dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Bottom Sheet Content */}
        <View
          style={{
            height: '85%',
            backgroundColor: palette.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: palette.line,
            paddingBottom: Math.max(insets.bottom, 16),
            overflow: 'hidden',
          }}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: palette.line,
              }}
            />
          </View>

          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 12,
              // borderBottomWidth: 1,
              // borderBottomColor: palette.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: categoryColor + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: categoryColor + '40',
                }}
              >
                <Text style={{ fontSize: 22 }}>{categoryIcon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 18,
                    color: palette.txt,
                    fontWeight: '700',
                  }}
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
                <Text style={{ color: palette.inkSoft, fontSize: 12, marginTop: 2 }}>
                  {questions.length} question{questions.length > 1 ? 's' : ''} posée{questions.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: palette.surface2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <X size={18} color={palette.txt} />
            </TouchableOpacity>
          </View>

          {/* Category Player Podium Bar */}
          {rankings.length > 0 && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: palette.surface2 + '80',
                borderBottomWidth: 1,
                borderBottomColor: palette.line,
              }}
            >
              <Text
                style={{
                  fontSize: 9.5,
                  fontWeight: '700',
                  color: palette.inkSoft,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Classement de la catégorie
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {rankings.map((r, idx) => (
                  <View
                    key={r.userId || `${r.username}-${idx}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor: idx === 0 ? categoryColor + '25' : palette.surface,
                      borderWidth: 1,
                      borderColor: idx === 0 ? categoryColor + '50' : palette.line,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: idx === 0 ? categoryColor : palette.inkSoft,
                      }}
                    >
                      #{r.rank}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: idx === 0 ? palette.txt : palette.inkSoft,
                      }}
                    >
                      {r.username}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: font.nativeFamily.display,
                        fontWeight: '700',
                        color: idx === 0 ? categoryColor : palette.txt,
                      }}
                    >
                      {r.score} pts
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Questions List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40, gap: 14 }}
            showsVerticalScrollIndicator={true}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {questions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
                <HelpCircle size={36} color={palette.inkSoft} />
                <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 16 }}>
                  Aucune question détaillée disponible
                </Text>
                <Text style={{ color: palette.inkSoft, fontSize: 13, textAlign: 'center' }}>
                  Les questions pour cette catégorie n'ont pas encore été enregistrées.
                </Text>
              </View>
            ) : (
              questions.map((q, qIndex) => {
                const diffColor = difficultyColor(q.difficulty);
                const diffText = difficultyLabel(q.difficulty);
                const isSkipped = Boolean(q.isSkipped);
                const hasWinner = Boolean(q.winnerName || q.winnerUsername);
                const solvers = q.solvers ?? [];
                const hasSolvers = solvers.length > 0;

                return (
                  <View
                    key={q.id || `q-${qIndex}`}
                    style={{
                      backgroundColor: palette.surface2,
                      borderRadius: 18,
                      padding: 16,
                      gap: 12,
                    }}
                  >
                    {/* Question Header: Number + Difficulty + Skipped */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: palette.primary + '20',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: font.nativeFamily.display,
                              fontSize: 12,
                              color: palette.primary,
                              fontWeight: '700',
                            }}
                          >
                            Question {q.orderIndex !== undefined ? q.orderIndex + 1 : qIndex + 1}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: diffColor + '20',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: diffColor,
                            }}
                          >
                            {diffText}
                          </Text>
                        </View>
                      </View>

                      {isSkipped && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: palette.warn + '20',
                          }}
                        >
                          <SkipForward size={12} color={palette.warn} />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: palette.warn }}>
                            Passée
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Question Text */}
                    <Text
                      style={{
                        fontSize: 15,
                        lineHeight: 22,
                        color: palette.txt,
                        fontWeight: '600',
                      }}
                    >
                      {q.text}
                    </Text>

                    {/* Correct Answer Box */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        // borderRadius: 12,
                        // backgroundColor: palette.good + '15',
                      }}
                    >
                      <CheckCircle2 size={16} color={palette.good} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, color: palette.good, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Bonne réponse
                        </Text>
                        <Text style={{ fontSize: 14, color: palette.good, fontWeight: '700', marginTop: 1 }}>
                          {q.answer}
                        </Text>
                      </View>
                    </View>

                    {/* Who Solved It Section */}
                    <View
                      style={{
                        gap: 6,
                      }}
                    >
                      {isSprint ? (
                        /* Sprint Mode: List of Solvers */
                        hasSolvers ? (
                          <View style={{ gap: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Zap size={14} color={palette.gold} />
                              <Text style={{ fontSize: 11, fontWeight: '700', color: palette.gold, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                Trouvée par {solvers.length} joueur{solvers.length > 1 ? 's' : ''} :
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                              {solvers.map((solver, sIdx) => (
                                <View
                                  key={solver.userId || `${solver.username}-${sIdx}`}
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    borderRadius: 12,
                                    backgroundColor: palette.surface,
                                    borderWidth: 1,
                                    borderColor: palette.line,
                                  }}
                                >
                                  <Avatar name={solver.name || solver.username} avatarUrl={solver.avatarUrl} size={20} />
                                  <Text style={{ fontSize: 12, fontWeight: '600', color: palette.txt }}>
                                    {solver.name || solver.username}
                                  </Text>
                                  {solver.responseTimeMs && solver.responseTimeMs > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                      <Clock size={10} color={palette.inkSoft} />
                                      <Text style={{ fontSize: 10, color: palette.inkSoft, fontWeight: '500' }}>
                                        {formatSolverTime(solver.responseTimeMs)}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              ))}
                            </View>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 12, fontStyle: 'italic', color: palette.inkSoft }}>
                            {isSkipped ? 'Question passée par le manager.' : '❌ Aucun joueur n\'a trouvé la réponse.'}
                          </Text>
                        )
                      ) : (
                        /* Moderated Mode: Single Winner */
                        hasWinner ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Award size={16} color={palette.gold} />
                            <Avatar name={q.winnerName || q.winnerUsername || 'Gagnant'} avatarUrl={q.winnerAvatarUrl} size={22} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
                              Trouvée par{' '}
                              <Text style={{ color: palette.primary }}>
                                {q.winnerName || q.winnerUsername}
                              </Text>
                            </Text>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 12, fontStyle: 'italic', color: palette.inkSoft }}>
                            {isSkipped ? 'Question passée par le manager.' : '❌ Aucun joueur n\'a buzzé la bonne réponse.'}
                          </Text>
                        )
                      )}
                    </View>

                    {/* Explanation (if present) */}
                    {q.explanation && q.explanation.trim().length > 0 && (
                      <View
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: palette.surface,
                          gap: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          💡 Explication
                        </Text>
                        <Text style={{ fontSize: 12, color: palette.inkSoft, fontStyle: 'italic', lineHeight: 16 }}>
                          {q.explanation}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
