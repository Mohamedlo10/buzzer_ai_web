import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Check, X, ArrowRight, Crown, Sparkles } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { ChallengeDTO } from '~/types/training';
import { PopView, FadeInUpView, FloatView } from '~/components/anim';

interface ChallengeViewProps {
  challenge: ChallengeDTO;
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

/**
 * Composant qui rend le bon type de défi en fonction de challengeType.
 * Le frontend ne valide rien — il envoie la réponse au backend.
 */
export function ChallengeView({ challenge, onSubmit, isSubmitting }: ChallengeViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');

  const handleSubmit = (answer: string) => {
    if (isSubmitting || !answer) return;
    setSelectedAnswer(answer);
    onSubmit(answer);
  };

  const isBoss = challenge.boss;

  return (
    <View style={{ gap: 16 }}>
      {/* Boss Epic Banner */}
      {isBoss && (
        <PopView duration={400}>
          <View
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: 'rgba(245, 158, 11, 0.5)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <FloatView duration={1600} distance={3}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: palette.gold + '25',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Crown size={22} color={palette.gold} />
              </View>
            </FloatView>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: palette.gold, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                ÉPREUVE ULTIME
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: palette.txt }}>
                Boss Final de Maîtrise
              </Text>
            </View>
          </View>
        </PopView>
      )}

      {/* Question */}
      <FadeInUpView duration={300}>
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 22,
            borderWidth: isBoss ? 2 : 1,
            borderColor: isBoss ? palette.gold + '60' : palette.line,
            padding: 22,
            minHeight: 105,
            justifyContent: 'center',
            shadowColor: isBoss ? palette.gold : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isBoss ? 0.15 : 0,
            shadowRadius: 10,
            elevation: isBoss ? 3 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: palette.txt,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            {challenge.question}
          </Text>
        </View>
      </FadeInUpView>

      {/* Challenge Type Renderers */}
      {(challenge.challengeType === 'MCQ' ||
        challenge.challengeType === 'ODD_ONE_OUT' ||
        challenge.challengeType === 'IDENTIFICATION') &&
        challenge.options && (
          <View style={{ gap: 10 }}>
            {challenge.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSubmit(option)}
                  disabled={isSubmitting || selectedAnswer !== null}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isSelected ? palette.primary + '20' : palette.surface,
                    borderRadius: 16,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? palette.primary : palette.line,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: isSelected ? palette.primary : palette.surface2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: isSelected ? palette.primaryInk : palette.txt,
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: '600',
                      color: palette.txt,
                      lineHeight: 20,
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      {challenge.challengeType === 'TRUE_FALSE' && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {['Vrai', 'Faux'].map((option) => {
            const isSelected = selectedAnswer === option;
            const isVrai = option === 'Vrai';
            return (
              <TouchableOpacity
                key={option}
                onPress={() => handleSubmit(option)}
                disabled={isSubmitting || selectedAnswer !== null}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: isSelected
                    ? (isVrai ? palette.good : palette.bad) + '20'
                    : palette.surface,
                  borderRadius: 18,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? (isVrai ? palette.good : palette.bad)
                    : palette.line,
                  paddingVertical: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {isVrai ? (
                  <Check size={24} color={isSelected ? palette.good : palette.txt} />
                ) : (
                  <X size={24} color={isSelected ? palette.bad : palette.txt} />
                )}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: isSelected ? (isVrai ? palette.good : palette.bad) : palette.txt,
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {challenge.challengeType === 'SHORT_ANSWER' && (
        <View style={{ gap: 12 }}>
          <TextInput
            value={textAnswer}
            onChangeText={setTextAnswer}
            placeholder="Votre réponse..."
            placeholderTextColor={palette.inkSoft}
            editable={!isSubmitting && selectedAnswer === null}
            style={{
              backgroundColor: palette.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: palette.line,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: palette.txt,
              fontSize: 16,
              fontWeight: '600',
            }}
          />
          <TouchableOpacity
            onPress={() => handleSubmit(textAnswer.trim())}
            disabled={isSubmitting || !textAnswer.trim() || selectedAnswer !== null}
            activeOpacity={0.8}
            style={{
              backgroundColor: !textAnswer.trim() || isSubmitting ? palette.surface2 : palette.primary,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: !textAnswer.trim() || isSubmitting ? palette.inkSoft : palette.primaryInk,
              }}
            >
              Valider
            </Text>
            <ArrowRight
              size={16}
              color={!textAnswer.trim() || isSubmitting ? palette.inkSoft : palette.primaryInk}
            />
          </TouchableOpacity>
        </View>
      )}

      {challenge.challengeType === 'ORDERING' && challenge.options && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, color: palette.inkSoft, textAlign: 'center', fontWeight: '600' }}>
            Sélectionnez les éléments dans le bon ordre
          </Text>
          {challenge.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSubmit(option)}
                disabled={isSubmitting || selectedAnswer !== null}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isSelected ? palette.primary + '20' : palette.surface,
                  borderRadius: 16,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? palette.primary : palette.line,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: palette.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: palette.txt }}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: palette.txt }}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {challenge.challengeType === 'ASSOCIATION' && challenge.options && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, color: palette.inkSoft, textAlign: 'center', fontWeight: '600' }}>
            Sélectionnez la bonne association
          </Text>
          {challenge.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const parts = option.split('::');
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSubmit(option)}
                disabled={isSubmitting || selectedAnswer !== null}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isSelected ? palette.primary + '20' : palette.surface,
                  borderRadius: 16,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? palette.primary : palette.line,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
                  {parts[0]}
                </Text>
                <ArrowRight size={14} color={palette.inkSoft} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: palette.primary }}>
                  {parts[1] || ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
