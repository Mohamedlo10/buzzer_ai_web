export type SoloDifficulty = 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'EXTREME';

export interface SoloQuestionDTO {
  id: string;
  text: string;
  questionType: 'TEXT' | 'IDENTIFICATION';
  imageUrl?: string;
  answerChoices: string[];  // 4 choices mixed (correct answer included)
  questionNumber: number;
  totalQuestions: number;
}

export interface SoloSessionStartResponse {
  sessionId: string;
  totalQuestions: number;
  firstQuestion: SoloQuestionDTO;
}

export interface SoloAnswerRevealResponse {
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  questionNumber: number;
  totalQuestions: number;
  correctAnswersSoFar: number;
  isLastQuestion: boolean;
}

export interface SoloNextQuestionResponse {
  completed: boolean;
  question?: SoloQuestionDTO;
}

export interface SoloSessionResultResponse {
  sessionId: string;
  sessionType: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  score: number;
  passed: boolean;
  threshold: number;
  streak: number;
  answers: AnswerSummary[];
  careerLevelResult?: CareerLevelResult;
}

export interface AnswerSummary {
  questionNumber: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  correct: boolean;
}

export interface CareerLevelResult {
  careerId: string;
  levelNumber: number;
  difficulty: string;
  levelCompleted: boolean;
  nextLevelUnlocked: boolean;
  scoreEarned: number;
  scorePenalty: number;
  attempts: number;
  careerCompleted: boolean;
}

export interface SoloCareerProgressResponse {
  careerId: string;
  category: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  currentLevel: number;
  totalScore: number;
  failureCount: number;
  completionPercentage: number;
  levels: LevelInfo[];
  activeSessionId?: string;
}

export interface LevelInfo {
  levelNumber: number;
  difficulty: SoloDifficulty;
  status: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED';
  bestScore: number;
  correctAnswers?: number;
  totalQuestions?: number;
  attempts: number;
  threshold: number;
}

export interface SoloTrainingPlanResponse {
  planId: string;
  name: string;
  theme: string;
  parentDifficulty: SoloDifficulty;
  planType: 'CUSTOM' | 'PREDEFINED';
  voteCount: number;
  votesNeeded: number;
  hasVoted: boolean;
  levels: TrainingLevelInfo[];
}

export interface TrainingLevelInfo {
  subLevel: 1 | 2 | 3;
  subDifficulty: string;
  label: string;
  questionCount: number;
  poolId: string;
  userStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  activeSessionId?: string;
}
