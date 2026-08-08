/**
 * Résolution des couleurs d'équipe.
 *
 * Le serveur stocke un **jeton** (`blue`, `red`, …), pas une couleur CSS.
 * Auparavant le formulaire envoyait directement `var(--indigo)` — une chaîne de
 * 13 caractères — dans une colonne `VARCHAR(7)` : toute création de partie en
 * mode équipe échouait au commit avec `value too long for type character
 * varying(7)`.
 *
 * Le jeton est la seule forme portable : un hexadécimal figerait la variante
 * claire d'une couleur qui change selon le thème, et stocker `var(--x)` ferait
 * entrer la syntaxe CSS de ce client précis dans le modèle de données.
 * La conversion en couleur affichable se fait donc ici, au rendu.
 */

export const TEAM_COLOR_TOKENS = [
  'red',
  'blue',
  'green',
  'amber',
  'violet',
  'teal',
  'pink',
  'slate',
] as const;

export type TeamColorToken = (typeof TEAM_COLOR_TOKENS)[number];

/**
 * Jeton → variable de thème. Les couleurs restent donc sensibles au thème :
 * `--indigo` vaut `rgb(42 54 86)` en clair et `rgb(107 123 168)` en sombre.
 */
const TOKEN_TO_CSS: Record<TeamColorToken, string> = {
  red: 'var(--bad)',
  blue: 'var(--indigo)',
  green: 'var(--good)',
  amber: 'var(--warn)',
  violet: 'var(--violet)',
  teal: 'var(--good)',
  pink: 'var(--primary)',
  slate: 'var(--txt-60)',
};

/** Libellés pour le sélecteur de couleur du formulaire de session. */
export const TEAM_COLOR_LABELS: Record<TeamColorToken, string> = {
  red: 'Rouge',
  blue: 'Bleu',
  green: 'Vert',
  amber: 'Ambre',
  violet: 'Violet',
  teal: 'Turquoise',
  pink: 'Terracotta',
  slate: 'Ardoise',
};

/**
 * Anciennes valeurs encore possibles dans les données ou dans un client non
 * rechargé. Même table que côté serveur, pour que les deux restent d'accord.
 */
const LEGACY_ALIASES: Record<string, TeamColorToken> = {
  'var(--bad)': 'red',
  'var(--buzz)': 'red',
  'var(--danger)': 'red',
  bad: 'red',
  buzz: 'red',
  danger: 'red',
  'var(--indigo)': 'blue',
  'var(--team)': 'blue',
  indigo: 'blue',
  team: 'blue',
  'var(--good)': 'green',
  'var(--success)': 'green',
  good: 'green',
  success: 'green',
  'var(--warn)': 'amber',
  'var(--gold)': 'amber',
  'var(--energy)': 'amber',
  warn: 'amber',
  gold: 'amber',
  energy: 'amber',
  'var(--violet)': 'violet',
  'var(--host)': 'violet',
  host: 'violet',
};

const DEFAULT_TOKEN: TeamColorToken = 'slate';

function isToken(value: string): value is TeamColorToken {
  return (TEAM_COLOR_TOKENS as readonly string[]).includes(value);
}

/** Normalise n'importe quelle valeur reçue en jeton de la palette. */
export function toTeamColorToken(raw: string | null | undefined): TeamColorToken {
  if (!raw) return DEFAULT_TOKEN;
  const value = raw.trim().toLowerCase();
  if (isToken(value)) return value;
  return LEGACY_ALIASES[value] ?? DEFAULT_TOKEN;
}

/**
 * Couleur affichable pour une équipe.
 *
 * Point d'entrée unique du rendu : passer `team.color` ici plutôt que de
 * l'injecter tel quel dans un style, pour qu'une valeur héritée ou inconnue
 * dégrade proprement au lieu de produire une couleur invalide.
 */
export function teamColor(raw: string | null | undefined): string {
  return TOKEN_TO_CSS[toTeamColorToken(raw)];
}

/** Teinte translucide, pour les fonds de pastille et de carte. */
export function teamColorTint(raw: string | null | undefined, percent = 22): string {
  return `color-mix(in oklab, ${teamColor(raw)} ${percent}%, transparent)`;
}

/** Jeton attribué par défaut à la n-ième équipe. Même rotation que le serveur. */
export function teamColorByIndex(index: number): TeamColorToken {
  const size = TEAM_COLOR_TOKENS.length;
  return TEAM_COLOR_TOKENS[((index % size) + size) % size];
}
