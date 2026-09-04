/**
 * Classements par période (§11).
 *
 * Miroir des DTO de `controller/LeaderboardController.java`. Un seul contrat pour les trois
 * périodes : la liste, le rang, le DTO et l'écran sont identiques, seule `periodType` change.
 * C'est ce qui permet un écran à sélecteur plutôt que trois écrans en parallèle.
 */

/** Source : model/enums/LeaderboardPeriodType.java */
export type LeaderboardPeriodType = 'DAY' | 'WEEK' | 'SEASON';

/** Source : model/dto/response/LeaderboardEntryResponse.java */
export interface LeaderboardEntryResponse {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
  challengesPlayed: number;
  correctAnswers: number;
  bestScore: number | null;

  /** Calculé serveur : le client n'a pas à comparer des identifiants. */
  isMe: boolean;

  /**
   * Évolution de rang (« ↑ +12 places »).
   *
   * **Toujours null en V1**, et c'est une décision, pas un oubli : le §14 dit « ne jamais
   * inventer l'évolution ». La calculer exigerait un instantané quotidien des rangs qui
   * n'existe pas encore. Ne rien afficher tant que ce champ est nul.
   */
  delta: number | null;
}

/** Source : model/dto/response/LeaderboardPageResponse.java */
export interface LeaderboardPageResponse {
  periodType: LeaderboardPeriodType;
  periodKey: string;

  /**
   * « Aujourd'hui » · « Cette semaine » · « Saison septembre 2026 ».
   * Calculé serveur : le reconstruire côté client demanderait sa propre locale
   * et son propre calendrier.
   */
  periodLabel: string;

  totalPlayers: number;
  entries: LeaderboardEntryResponse[];

  /** Ma position, même hors de la page affichée (§14). Null si je n'ai pas joué. */
  me: LeaderboardEntryResponse | null;

  page: number;
  size: number;
  totalPages: number;
}
