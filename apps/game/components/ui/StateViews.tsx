/**
 * Les quatre états que chaque écran important doit savoir rendre (cahier des charges §29 :
 * LOADING · SUCCESS · EMPTY · ERROR). SUCCESS est le rendu de l'écran lui-même ; les trois
 * autres vivent ici.
 *
 * Ces composants existent parce que la base dupliquait un `<ActivityIndicator>` inline dans
 * chaque écran et n'avait aucun rendu d'erreur ni de vide : une requête en échec laissait
 * une liste vide et muette. Aucun écran ne doit rester vide sans explication.
 *
 * Ils vivent dans `apps/game` et non dans `packages/core` : ce dernier n'a pas `react-native`
 * en dépendance, et c'est ce qui le garde consommable par `apps/admin` (Vite/DOM).
 *
 * Convention de couleurs : `palette.*` depuis `~/lib/theme/tokens`, jamais `var(--color-*)`
 * dans un objet de style (inopérant en React Native / NativeWind).
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { alpha, palette, radius, withAlpha } from '~/lib/theme/tokens';

// ─────────────────────────────────────────────────────────────────────────────

interface LoadingStateProps {
  /** Ce qu'on attend, formulé pour l'utilisateur. Ex. « Chargement du classement… ». */
  label?: string;
  /** `true` pour occuper tout l'écran, `false` pour s'insérer dans une section. */
  fullScreen?: boolean;
}

export function LoadingState({ label, fullScreen = false }: LoadingStateProps) {
  return (
    <View
      style={{
        flex: fullScreen ? 1 : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: fullScreen ? 0 : 32,
        gap: 12,
      }}
    >
      <ActivityIndicator size={fullScreen ? 'large' : 'small'} color={palette.primary} />
      {label ? (
        <Text
          style={{
            color: withAlpha(palette.txt, alpha.txt60),
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Emoji ou petit nœud décoratif. Optionnel : un vide n'a pas besoin d'illustration. */
  icon?: ReactNode;
  /** Le fait, en une ligne. Ex. « Pas de défi aujourd'hui ». */
  title: string;
  /** Ce que ça implique ou quoi faire ensuite. */
  description?: string;
  /** Une seule action, s'il y en a une qui a du sens. */
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 8 }}>
      {icon ? <View style={{ marginBottom: 4 }}>{icon}</View> : null}

      <Text
        style={{
          color: palette.txt,
          fontSize: 16,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={{
            color: withAlpha(palette.txt, alpha.txt60),
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      ) : null}

      {action ? (
        <TouchableOpacity
          onPress={action.onPress}
          activeOpacity={0.85}
          style={{
            marginTop: 12,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: radius.pill,
            backgroundColor: palette.primary,
          }}
        >
          <Text style={{ color: palette.primaryInk, fontSize: 14, fontWeight: '700' }}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  /**
   * L'erreur telle que remontée. Le message affiché est extrait de la réponse backend quand
   * elle en fournit un : le front peut reformuler la présentation, jamais le sens métier.
   */
  error?: unknown;
  /** Message de repli quand l'erreur ne porte rien d'exploitable. */
  fallbackMessage?: string;
  /** Absent = pas de bouton. Ne jamais proposer un « Réessayer » qui ne réessaie rien. */
  onRetry?: () => void;
  fullScreen?: boolean;
}

/**
 * Extrait le message le plus utile d'une erreur, en privilégiant celui du backend.
 * Ordre de préférence : `response.data.message` (contrat d'ErrorResponse) → `message` → repli.
 */
function resolveErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error;

  if (error && typeof error === 'object') {
    const maybeAxios = error as { response?: { data?: { message?: unknown } }; message?: unknown };
    const backendMessage = maybeAxios.response?.data?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim()) return backendMessage;
    if (typeof maybeAxios.message === 'string' && maybeAxios.message.trim()) {
      return maybeAxios.message;
    }
  }

  return fallback;
}

export function ErrorState({
  error,
  fallbackMessage = 'Une erreur est survenue. Réessaie dans un instant.',
  onRetry,
  fullScreen = false,
}: ErrorStateProps) {
  const message = resolveErrorMessage(error, fallbackMessage);

  return (
    <View
      style={{
        flex: fullScreen ? 1 : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: fullScreen ? 0 : 32,
        paddingHorizontal: 24,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 28 }}>⚠️</Text>

      <Text
        style={{
          color: palette.txt,
          fontSize: 16,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        Impossible d’afficher ce contenu
      </Text>

      <Text
        style={{
          color: withAlpha(palette.txt, alpha.txt60),
          fontSize: 14,
          lineHeight: 20,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>

      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.85}
          style={{
            marginTop: 12,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: radius.pill,
            backgroundColor: palette.surface2,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text style={{ color: palette.txt, fontSize: 14, fontWeight: '700' }}>Réessayer</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  /** Par défaut `radius.card`. Passer `radius.pill` pour une pastille. */
  borderRadius?: number | string;
}

/**
 * Bloc gris de la forme du contenu à venir. Volontairement statique : une animation de
 * pulsation sur une liste entière coûte un re-render par frame, ce que §27 proscrit.
 */
export function Skeleton({ width = '100%', height = 16, borderRadius }: SkeletonProps) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: (borderRadius ?? radius.card) as number,
        backgroundColor: withAlpha(palette.txt, alpha.lineSoft),
      }}
    />
  );
}
