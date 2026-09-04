/**
 * Types TypeScript du Défi du Jour — miroir exact des DTOs Java.
 *
 * Chaque interface cite son fichier Java source en commentaire.
 * La divergence front/back est la classe de bug la plus fréquente ici :
 * tout changement côté Java doit se refléter ici.
 *
 * Règle de sérialisation critique : DailyQuestionView ne contient JAMAIS
 * correctIndex, answer ni explanation — voir DailyQuestionView.java.
 */

// ─── DailyTodayResponse.java ──────────────────────────────────────────────────

/**
 * Tout ce dont la carte « Défi du Jour » de l'accueil a besoin, en un seul appel.
 * Source : model/dto/response/DailyTodayResponse.java
 */
export interface DailyTodayResponse {
  /** Y a-t-il une édition jouable aujourd'hui ? Toujours 200, jamais 204 ni 404. */
  available: boolean;
  challenge: DailyTodayChallenge | null;
  /**
   * null si l'utilisateur n'a pas encore tenté.
   * Non-null → afficher l'état « déjà joué » (score, rang, bouton classement).
   */
  myAttempt: DailyTodayMyAttempt | null;
}

/** Source : DailyTodayResponse.Challenge (classe interne Java) */
export interface DailyTodayChallenge {
  id: string; // UUID
  date: string; // LocalDate → 'YYYY-MM-DD'
  theme: string | null;
  difficulty: string | null;
  questionCount: number;
  /** Total affichable calculé serveur — ne jamais coder 1000 en dur. */
  maxPoints: number;
  estimatedMinutes: number;
  closesAt: string; // Instant → ISO-8601
}

/** Source : DailyTodayResponse.MyAttempt (classe interne Java) */
export interface DailyTodayMyAttempt {
  attemptId: string; // UUID
  status: DailyAttemptStatus;
  score: number;
  correctCount: number;
  answeredCount: number;
  /** Rang du jour ; null tant que la tentative n'est pas terminée. */
  rank: number | null;
  totalPlayers: number | null;
  finishedAt: string | null; // Instant → ISO-8601
}

// ─── DailyAttemptStateResponse.java ──────────────────────────────────────────

/**
 * État courant d'une tentative : ce que l'écran de jeu affiche.
 * Sert au démarrage et à la reprise — la vérité vient du serveur, jamais du stockage local.
 * Source : model/dto/response/DailyAttemptStateResponse.java
 */
export interface DailyAttemptStateResponse {
  attemptId: string; // UUID
  challengeId: string; // UUID
  status: DailyAttemptStatus;
  currentIndex: number;
  totalQuestions: number;
  runningScore: number;
  maxPoints: number;
  /** null lorsque la tentative est terminée. */
  question: DailyQuestionView | null;
}

// ─── DailyQuestionView.java ───────────────────────────────────────────────────

/**
 * Une question telle qu'elle est servie au joueur pendant qu'il y répond.
 *
 * RÈGLE ABSOLUE : ne contient JAMAIS correctIndex, answer ni explanation.
 * Ces champs rendraient le Défi du Jour trivialement trichable.
 * Source : model/dto/response/DailyQuestionView.java
 */
export interface DailyQuestionView {
  id: string; // UUID
  orderIndex: number;
  text: string;
  /** Ordre officiel, identique pour tous les joueurs. */
  choices: string[];
  timeLimitSec: number;
  /**
   * Temps restant calculé serveur.
   * Le front anime une barre depuis cette valeur mais ne décide rien :
   * à expiration, il envoie selectedIndex: null.
   */
  remainingMs: number;
  category: string | null;
  difficulty: string | null;
}

// ─── DailyAnswerResultResponse.java ──────────────────────────────────────────

/**
 * Verdict d'une réponse + question suivante dans la même charge utile.
 * Évite un second aller-retour par question.
 * Source : model/dto/response/DailyAnswerResultResponse.java
 */
export interface DailyAnswerResultResponse {
  correct: boolean;
  /** Révélé maintenant — il n'était pas dans DailyQuestionView. */
  correctIndex: number;
  explanation: string | null;
  pointsAwarded: number;
  runningScore: number;
  answeredCount: number;
  totalQuestions: number;
  /** null sur la dernière question. */
  next: DailyQuestionView | null;
  finished: boolean;
  /** Renseigné uniquement quand finished === true. */
  result: DailyAttemptResultResponse | null;
}

// ─── DailyAttemptResultResponse.java ─────────────────────────────────────────

/**
 * Écran de résultat d'une tentative terminée.
 * Source : model/dto/response/DailyAttemptResultResponse.java
 */
export interface DailyAttemptResultResponse {
  attemptId: string; // UUID
  score: number;
  maxPoints: number;
  correctCount: number;
  totalQuestions: number;
  totalTimeMs: number;
  rank: number | null;
  totalPlayers: number | null;
  /** Vide en V1 (lot 7 non livré). Présent pour ne pas casser l'écran quand livré. */
  unlockedAchievements: string[];
  /** Disponible seulement après finalisation de la tentative. */
  answers: DailyAnswerReview[] | null;
}

/** Source : DailyAttemptResultResponse.AnswerReview (classe interne Java) */
export interface DailyAnswerReview {
  orderIndex: number;
  questionText: string;
  choices: string[];
  /** null si le temps s'est écoulé sans réponse. */
  yourIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string | null;
  responseTimeMs: number;
}

// ─── SubmitDailyAnswerRequest.java ────────────────────────────────────────────

/**
 * Réponse envoyée par le joueur.
 * Aucun horodatage : le temps est mesuré côté serveur.
 * Source : model/dto/request/SubmitDailyAnswerRequest.java
 */
export interface SubmitDailyAnswerRequest {
  questionId: string; // UUID — requis pour rejeter une réponse en retard d'un tour
  /** null = le temps est écoulé, le joueur n'a rien choisi. */
  selectedIndex: number | null;
}

// ─── Enums ────────────────────────────────────────────────────────────────────

/** Source : model/enums/DailyAttemptStatus.java */
export type DailyAttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

/**
 * Source : model/enums/DailyChallengeStatus.java — les neuf états.
 *
 * Le joueur n'en voit en pratique que PUBLISHED, LIVE et CLOSED, mais le type doit
 * couvrir l'énum complète : le back-office manipule les autres, et un type partiel
 * ferait passer un état légitime pour une valeur invalide.
 */
export type DailyChallengeStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'GENERATED'
  | 'REVIEW'
  | 'PUBLISHED'
  | 'LIVE'
  | 'CLOSED'
  | 'FAILED'
  | 'CANCELLED';
