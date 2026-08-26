// ──────────────────────────────────────────────
// Training v2 — Types
// Mode Entraînement interactif (apprendre → tester → comprendre)
// ──────────────────────────────────────────────

export type TrainingDifficulty = 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'EXTREME';

export type TrainingPhase = 'LEARNING' | 'ASSESSMENT' | 'REMEDIATION' | 'COMPLETED';

export type TrainingStepType = 'NOTION' | 'CHALLENGE' | 'BOSS' | 'RESULT';

export type TrainingChallengeType =
  | 'MCQ'
  | 'TRUE_FALSE'
  | 'ASSOCIATION'
  | 'ORDERING'
  | 'ODD_ONE_OUT'
  | 'SHORT_ANSWER'
  | 'IDENTIFICATION';

export type EssentialPointFormat = 'DATE' | 'DEFINITION' | 'RELATION' | 'COMPARISON' | 'LIST' | 'FACT';

// ── Session Response (backend → frontend) ──

export interface TrainingSessionResponse {
  sessionId: string;
  subject: string;
  difficulty: TrainingDifficulty;
  durationMinutes: number;
  phase: TrainingPhase;
  stepType: TrainingStepType;
  currentUnit: number;
  totalUnits: number;
  currentNotion: LearningNotionDTO | null;
  currentChallenge: ChallengeDTO | null;
  lastResult: ChallengeResultDTO | null;
  progress: ProgressDTO;
}

export interface LearningNotionDTO {
  title: string;
  notionTag: string;
  essentialPoints: EssentialPointDTO[];
}

export interface EssentialPointDTO {
  format: EssentialPointFormat;
  content: string;
  detail?: string | null;
}

export interface ChallengeDTO {
  challengeType: TrainingChallengeType;
  question: string;
  options?: string[] | null;
  associations?: Record<string, string> | null;
  orderItems?: string[] | null;
  boss: boolean;
}

export interface ChallengeResultDTO {
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  notionTag: string;
}

export interface ProgressDTO {
  correctChallenges: number;
  totalChallenges: number;
  percentComplete: number;
}

// ── Result Response ──

export interface TrainingResultResponse {
  sessionId: string;
  subject: string;
  difficulty: string;
  masteryScore: number;
  comprehensionScore: number;
  memorizationScore: number;
  applicationScore: number;
  correctChallenges: number;
  totalChallenges: number;
  weaknesses: WeaknessDTO[];
  progression: ProgressionDTO;
  remediationAvailable: boolean;
  gamification: GamificationDTO;
}

export interface WeaknessDTO {
  notionTag: string;
  notionTitle: string;
  score: number;
}

export interface ProgressionDTO {
  currentScore: number;
  previousScore: number;
  delta: number;
  totalSessions: number;
}

// ── Gamification ──

export type TrainingBadge = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';

export interface GamificationDTO {
  xpEarned: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  badge: TrainingBadge;
  previousBadge: TrainingBadge;
  newBadge: boolean;
}

export interface TrainingSubjectMastery {
  id: string;
  subject: string;
  masteryScore: number;
  sessionsCount: number;
  bestScore: number;
  lastSessionScore: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  badge: TrainingBadge;
  lastSessionAt: string | null;
}

export interface TrainingSessionSummary {
  sessionId: string;
  subject: string;
  difficulty: TrainingDifficulty;
  durationMinutes: number;
  totalUnits: number;
  currentUnit: number;
  phase: TrainingPhase;
  stepType: TrainingStepType;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  masteryScore: number;
  correctChallenges: number;
  totalChallenges: number;
  percentComplete: number;
  startedAt: string;
  completedAt?: string | null;
}
