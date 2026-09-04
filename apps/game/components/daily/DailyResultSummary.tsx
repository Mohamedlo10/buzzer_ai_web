/**
 * DailyResultSummary
 *
 * Affiche le résumé de la tentative terminée :
 * - Score et max
 * - Rang du jour (si disponible)
 * - Tableau de révision des réponses
 *
 * Reçoit DailyAttemptResultResponse du serveur. Ne calcule rien.
 */
import { View, Text, ScrollView } from 'react-native';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { DailyAttemptResultResponse } from '~/types/daily';

interface DailyResultSummaryProps {
  result: DailyAttemptResultResponse;
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export function DailyResultSummary({ result }: DailyResultSummaryProps) {
  const scorePercent = result.maxPoints > 0
    ? Math.round((result.score / result.maxPoints) * 100)
    : 0;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40, gap: 20 }}
    >
      {/* ── Carte score ── */}
      <View
        style={{
          backgroundColor: palette.indigo,
          borderRadius: 20,
          padding: 24,
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontWeight: '700',
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          Score du jour
        </Text>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 52,
            lineHeight: 60,
            color: '#FFFFFF',
            paddingTop: 4,
          }}
        >
          {result.score}
        </Text>

        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontSize: 14,
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          sur {result.maxPoints} pts ({scorePercent} %)
        </Text>

        {/* Stats secondaires */}
        <View
          style={{
            flexDirection: 'row',
            gap: 20,
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <StatChip
            icon={<CheckCircle size={14} color="rgba(255,255,255,0.8)" />}
            value={`${result.correctCount} / ${result.totalQuestions}`}
            label="Bonnes"
          />
          {result.rank !== null && (
            <StatChip
              icon={<Text style={{ fontSize: 14 }}>🏆</Text>}
              value={`#${result.rank}`}
              label="Rang"
            />
          )}
          <StatChip
            icon={<Clock size={14} color="rgba(255,255,255,0.8)" />}
            value={formatMs(result.totalTimeMs)}
            label="Durée"
          />
        </View>
      </View>

      {/* ── Révision des réponses ── */}
      {result.answers && result.answers.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '700',
              fontSize: 13,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: palette.inkSoft,
              marginBottom: 4,
            }}
          >
            Révision
          </Text>

          {result.answers.map((review) => (
            <View
              key={review.orderIndex}
              style={{
                backgroundColor: palette.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: review.isCorrect ? palette.good : palette.bad,
                borderLeftWidth: 4,
                padding: 14,
                gap: 8,
              }}
            >
              {/* Question */}
              <Text
                style={{
                  fontFamily: font.nativeFamily.ui,
                  fontWeight: '600',
                  fontSize: 13,
                  color: palette.txt,
                  lineHeight: 18,
                }}
              >
                Q{review.orderIndex + 1}. {review.questionText}
              </Text>

              {/* Icône résultat + réponse choisie */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {review.isCorrect
                  ? <CheckCircle size={16} color={palette.good} />
                  : <XCircle    size={16} color={palette.bad}  />}
                <Text
                  style={{
                    fontFamily: font.nativeFamily.ui,
                    fontSize: 13,
                    color: review.isCorrect ? palette.good : palette.bad,
                    fontWeight: '600',
                    flex: 1,
                  }}
                >
                  {review.yourIndex !== null
                    ? review.choices[review.yourIndex] ?? '—'
                    : 'Pas de réponse (temps écoulé)'}
                </Text>
              </View>

              {/* Bonne réponse si mauvaise */}
              {!review.isCorrect && (
                <Text
                  style={{
                    fontFamily: font.nativeFamily.ui,
                    fontSize: 12,
                    color: palette.good,
                  }}
                >
                  ✓ {review.choices[review.correctIndex] ?? '—'}
                </Text>
              )}

              {/* Explication */}
              {review.explanation ? (
                <Text
                  style={{
                    fontFamily: font.nativeFamily.serif,
                    fontStyle: 'italic',
                    fontSize: 12,
                    color: palette.inkSoft,
                    lineHeight: 17,
                  }}
                >
                  {review.explanation}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Chip de stat ─────────────────────────────────────────────────────────────

function StatChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      {icon}
      <Text
        style={{
          fontFamily: font.nativeFamily.ui,
          fontWeight: '700',
          fontSize: 13,
          color: '#FFFFFF',
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: font.nativeFamily.ui,
          fontSize: 10,
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
