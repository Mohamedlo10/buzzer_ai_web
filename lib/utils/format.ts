/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a date string to a short format (e.g., "16 fév").
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format a timestamp diff in ms to a human-readable buzz time.
 * e.g., 230 → "0.23s"
 */
export function formatBuzzTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format a score with optional sign.
 */
export function formatScore(score: number, showSign = false): string {
  if (showSign && score > 0) return `+${score}`;
  return `${score}`;
}

/**
 * Format a relative time (e.g., "2h ago", "just now").
 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'à l\'instant';
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return formatDateShort(dateStr);
}
