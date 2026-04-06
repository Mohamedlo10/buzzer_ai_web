// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

export interface RegisterRequest {
  username: string;
  email: string | null;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface TokenResponse {
  accessToken: string;
}

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserResponse {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  avatarStyle: string | null;
  avatarSeed: string | null;
  role: UserRole;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────

export interface PageableObject {
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
  sort: SortObject;
}

export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  sort: SortObject;
  pageable: PageableObject;
}

// ──────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────

export type Difficulty = 'FACILE' | 'INTERMEDIAIRE' | 'EXPERT';

export interface CategoryRequest {
  name: string;
  difficulty: Difficulty;
}

// ──────────────────────────────────────────────
// Sessions
// ──────────────────────────────────────────────

export type SessionStatus =
  | 'LOBBY'
  | 'GENERATING'
  | 'PLAYING'
  | 'PAUSED'
  | 'RESULTS'
  | 'CANCELLED';

export type QuestionMode = 'AI' | 'MANUAL';

export interface TeamRequest {
  name: string;
  color?: string;
}

export interface TeamResponse {
  id: string;
  name: string;
  color: string | null;
  score: number;
  members: PlayerResponse[];
}

export interface CreateSessionRequest {
  debtAmount: number;
  pointsPerCorrectAnswer: number;
  questionsPerCategory: number;
  maxPlayers: number;
  isPrivate: boolean;
  isTeamMode: boolean;
  maxCategoriesPerPlayer: number;
  roomId?: string;
  questionMode?: QuestionMode;
  teams?: TeamRequest[];
  buzzCountdownSeconds?: number;
}

export interface ManualQuestion {
  text: string;
  answer: string;
  explanation?: string | null;
}

export interface SetManualQuestionsRequest {
  questions: ManualQuestion[];
}

export interface ParsedQuestionsResponse {
  questions: ManualQuestion[];
  totalQuestions: number;
  warnings: string[];
}

export interface CreateSessionResponse {
  session: SessionResponse;
  player: PlayerResponse;
}

export interface JoinSessionRequest {
  categories: CategoryRequest[];
  isSpectator: boolean;
  teamId?: string | null;
}

export interface SessionResponse {
  id: string;
  code: string;
  status: SessionStatus;
  managerId: string;
  managerName: string;
  roomId: string | null;
  debtAmount: number;
  questionsPerCategory: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  maxPlayers: number;
  isPrivate: boolean;
  isTeamMode: boolean;
  questionMode: QuestionMode;
  maxCategoriesPerPlayer: number;
  buzzCountdownSeconds: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface PlayerResponse {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  isManager: boolean;
  isSpectator: boolean;
  teamId: string | null;
  categoryScores: Record<string, number>;
  selectedCategories: string[];
}

export interface QuestionResponse {
  id: string;
  category: string;
  text: string;
  answer: string | null;
  explanation: string | null;
  difficulty: Difficulty;
  orderIndex: number;
  winnerId: string | null;
  isSkipped: boolean;
}

export interface SessionDetailResponse {
  session: SessionResponse;
  players: PlayerResponse[];
  questions: QuestionResponse[];
  teams?: TeamResponse[];
}

export interface JoinCheckResponse {
  session: SessionResponse;
  players: PlayerResponse[];
  teams?: TeamResponse[];
}

// ──────────────────────────────────────────────
// Game Actions
// ──────────────────────────────────────────────

export interface ValidateRequest {
  playerId: string;
  isCorrect: boolean;
  points?: number;
  category?: string;
  applyPenalty?: boolean;
}

export interface ScoreCorrectionRequest {
  playerId: string;
  amount: number;
  reason?: string;
}

export interface BuzzRequest {
  timestamp: number;
}

export interface BuzzResponse {
  queuePosition: number;
  serverTimestamp: number;
}

export interface BuzzQueueItem {
  playerId: string;
  playerName: string;
  timeDiffMs: number;
  teamId?: string | null;
  teamName?: string | null;
}

export interface GameStateResponse {
  session: Record<string, unknown>;
  currentQuestion: QuestionResponse | null;
  players: PlayerResponse[];
  buzzQueue: BuzzQueueItem[];
  myPlayer: PlayerResponse | null;
  hasBuzzed?: boolean;
  teams?: TeamResponse[];
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

export interface NotificationFriendRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    avatarUrl: string | null;
    globalRank?: number | null;
  };
  createdAt: string;
}

export interface NotificationGameInvitation {
  id: string;
  sessionId: string;
  sessionCode: string;
  senderName: string;
  expiresAt: string;
  createdAt: string;
}

export interface NotificationRoomInvitation {
  id: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  createdAt: string;
  /** true si l'utilisateur est déjà membre de cette salle */
  alreadyMember?: boolean;
}

export interface NotificationResponse {
  total: number;
  friendRequests: NotificationFriendRequest[];
  gameInvitations: NotificationGameInvitation[];
  roomInvitations: NotificationRoomInvitation[];
}

// ──────────────────────────────────────────────
// Rankings
// ──────────────────────────────────────────────

export interface GlobalRanking {
  id?: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalScore: number;
  totalGames: number;
  totalWins: number;
  bestScore: number;
  avgScore: number;
  winRate: number;
  updatedAt?: string;
  // New fields from API
  rank?: number;
  friendshipStatus?: 'SELF' | 'ACCEPTED' | 'PENDING' | 'DECLINED' | 'BLOCKED' | 'NONE';
  // Legacy nested user structure (optional for backward compatibility)
  user?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface SessionRankingPlayer {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  friendshipStatus?: FriendshipStatus;
}

export interface SessionRankingCorrection {
  amount: number;
  reason: string;
}

export interface SessionRankingEntry {
  player: SessionRankingPlayer;
  score: number;
  corrections: SessionRankingCorrection[];
  finalScore: number;
  rank: number;
  categoryPerformance: Record<string, number>;
  debts: DebtEntry[];           // debts this player owes to others
  debtsReceived: DebtReceivedEntry[]; // debts others owe to this player
  // Team mode fields (optional — only present when session.isTeamMode)
  teamId?: string | null;
  teamName?: string | null;
  teamColor?: string | null;
  teamScore?: number | null;
}

export interface DebtEntry {
  owedTo: string;   // username of the creditor
  category: string;
  amount: number;
}

export interface DebtReceivedEntry {
  owedBy: string;   // username of the debtor
  category: string;
  amount: number;
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

export interface DashboardResponse {
  activeSession?: {
    sessionId: string;
    code: string;
    status: SessionStatus;
    roomName?: string;
  };
  rooms: Array<{
    id: string;
    name: string;
    code: string;
    totalGames: number;
  }>;
  pendingInvitations: number;
  pendingFriendRequests: number;
  recentSessions: Array<{
    sessionId: string;
    code: string;
    date: string;
    winnerName: string;
    winnerScore: number;
    playerCount: number;
  }>;
}

// ──────────────────────────────────────────────
// Dashboard V2
// ──────────────────────────────────────────────

export interface DashboardV2Response {
  recentSessions: LastSession[];
  recentRooms: LastRoom[];
  globalStats: GlobalStats;
  topCategories: CategoryPodium[];
  pendingInvitations: number;
  pendingFriendRequests: number;
}

export interface LastSession {
  id: string;
  code: string;
  status: 'LOBBY' | 'GENERATING' | 'PLAYING' | 'PAUSED' | 'RESULTS';
  managerName: string;
  managerFriendshipStatus?: FriendshipStatus;
  roomId: string | null;
  roomName: string | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  playerCount: number;
  createdAt: string;
  endedAt: string | null;
  myScore: number | null;
  myRank: number | null;
  totalPlayers: number | null;
  isManager: boolean;
}

export interface LastRoom {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  ownerFriendshipStatus?: FriendshipStatus;
  memberCount: number;
  hasActiveSession: boolean;
  joinedAt: string;
}

export interface GlobalStats {
  rank: number;
  totalScore: number;
  totalGames: number;
  totalWins: number;
  bestScore: number;
  winRate: number;
  avgScore: number;
}

export interface CategoryPodium {
  category: string;
  totalScore: number;
  gamesPlayed: number;
  questionsWon: number;
  totalQuestionsFaced: number;
  winRate: number;
}

export interface UserStatsResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
  globalRank: number;
  totalScore: number;
  totalGames: number;
  totalWins: number;
  bestScore: number;
  avgScore: number;
  winRate: number;
  categories: CategoryStat[];
  topCategories: CategoryStat[];
  recentGames: RecentGameStat[];
  totalRooms: number;
  totalRoomWins: number;
  friendshipStatus?: FriendshipStatus;
}

export interface CategoryStat {
  category: string;
  totalScore: number;
  gamesPlayed: number;
  questionsWon: number;
  totalQuestionsFaced: number;
  winRate: number;
}

export interface RecentGameStat {
  sessionId: string;
  sessionCode: string;
  roomName: string | null;
  score: number;
  rank: number;
  totalPlayers: number;
  endedAt: string;
}

// ──────────────────────────────────────────────
// Rooms
// ──────────────────────────────────────────────

export interface CreateRoomRequest {
  name: string;
  description?: string;
  maxPlayers?: number;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  maxPlayers?: number;
}

// GET /api/rooms - RoomSummaryResponse
export type FriendshipStatus = 'SELF' | 'ACCEPTED' | 'PENDING' | 'DECLINED' | 'BLOCKED' | 'NONE';

export interface RoomSummaryResponse {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  ownerFriendshipStatus?: FriendshipStatus;
  maxPlayers: number;
  memberCount: number;
  hasActiveSession: boolean;
  createdAt: string;
}

// POST /api/rooms - RoomCreateResponse
export interface RoomCreateResponse {
  id: string;
  name: string;
  code: string;
  maxPlayers: number;
}

// GET /api/rooms/{roomId} - RoomDetailResponse
export interface RoomDetailResponse {
  room: RoomInfo;
  members: RoomMemberResponse[];
  sessions: RoomSessionResponse[];
  rankings: RoomRankingEntry[];
  /** IDs des utilisateurs ayant déjà une invitation en attente pour cette salle */
  pendingInvitationUserIds?: string[];
}

export interface RoomInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  ownerId: string;
  ownerName: string;
  maxPlayers: number;
}

export interface RoomMemberResponse {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  isOwner: boolean;
  isOnline: boolean;
  joinedAt: string;
  friendshipStatus?: FriendshipStatus;
}

export interface RoomSessionResponse {
  id: string;
  code: string;
  status: SessionStatus;
  managerId: string;
  managerName: string;
  managerFriendshipStatus?: FriendshipStatus;
  playerCount: number;
  maxPlayers: number;
  createdAt: string;
}

export interface RoomRankingEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number;
  friendshipStatus?: FriendshipStatus;
}

// ──────────────────────────────────────────────
// Friends
// ──────────────────────────────────────────────

export interface FriendResponse {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  globalRank?: number;
}

// POST /api/friends/request
export interface FriendRequestCreateResponse {
  friendship: {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  };
}

// GET /api/friends/requests — pending incoming requests
export interface FriendRequestResponse {
  id: string;
  requester: UserResponse;
  createdAt: string;
}

// GET /api/friends/requests/sent — sent pending requests
export interface SentFriendRequestResponse {
  id: string;
  receiver: UserResponse;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Invitations
// ──────────────────────────────────────────────

export interface InvitationResponse {
  id: string;
  sessionId: string;
  sessionCode: string;
  senderName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

// ──────────────────────────────────────────────
// Rankings
// ──────────────────────────────────────────────

export interface RankingEntryResponse {
  rank: number;
  userId: string;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  averageScore: number;
  winRate: number;
  friendshipStatus?: 'SELF' | 'ACCEPTED' | 'PENDING' | 'DECLINED' | 'BLOCKED' | 'NONE';
}

export interface GlobalRankingResponse {
  rankings: RankingEntryResponse[];
  currentUserRank: number | null;
  totalPlayers: number;
}

export interface GlobalRankingPaginatedResponse extends Page<GlobalRanking> {
  currentUserRank: number | null;
}

export interface CategoryPlayerRank {
  rank: number;
  userId: string;
  username: string;
  score: number;
}

export interface CategoryRankingResponse {
  categories: CategoryRanking[];
}

export interface CategoryRanking {
  name: string;
  rankings: CategoryPlayerRank[];
}

// ──────────────────────────────────────────────
// Admin
// ──────────────────────────────────────────────

export interface AdminStatsResponse {
  totalUsers: number;
  totalSessions: number;
  activeSessions: number;
  totalQuestions: number;
  aiCostThisMonth: number;
  aiInputTokensThisMonth: number;
  aiOutputTokensThisMonth: number;
}

export type AdminSessionStatus = 'LOBBY' | 'GENERATING' | 'PLAYING' | 'PAUSED' | 'RESULTS' | 'CANCELLED';

export interface AdminSessionSummaryResponse {
  id: string;
  code: string;
  status: AdminSessionStatus;
  managerId: string;
  managerUsername: string;
  roomId: string | null;
  roomName: string | null;
  roomCode: string | null;
  playerCount: number;
  totalQuestions: number;
  maxPlayers: number;
  isTeamMode: boolean;
  isPrivate: boolean;
  questionMode: QuestionMode;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface AdminSessionPlayer {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  name: string;
  score: number;
  isManager: boolean;
  isSpectator: boolean;
  categoryScores: Record<string, number>;
  joinedAt: string;
}

export interface AdminSessionQuestion {
  id: string;
  category: string;
  text: string;
  answer: string;
  explanation: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  orderIndex: number;
  isSkipped: boolean;
  winnerName: string | null;
  createdAt: string;
}

export interface AdminSessionDetailResponse {
  id: string;
  code: string;
  status: AdminSessionStatus;
  managerId: string;
  managerUsername: string;
  roomId: string | null;
  roomName: string | null;
  roomCode: string | null;
  maxPlayers: number;
  isTeamMode: boolean;
  isPrivate: boolean;
  questionMode: QuestionMode;
  debtAmount: number;
  questionsPerCategory: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  pointsPerCorrectAnswer: number;
  buzzCountdownSeconds: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  players: AdminSessionPlayer[];
  questions: AdminSessionQuestion[];
}

export interface AdminRoomSummaryResponse {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerUsername: string;
  description: string | null;
  isActive: boolean;
  maxPlayers: number;
  memberCount: number;
  sessionCount: number;
  createdAt: string;
}

export interface AdminRoomMember {
  userId: string;
  username: string;
  avatarUrl: string;
  isOwner: boolean;
  joinedAt: string;
}

export interface AdminRoomSession {
  id: string;
  code: string;
  status: AdminSessionStatus;
  managerUsername: string;
  playerCount: number;
  totalQuestions: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface AdminRoomDetailResponse {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerUsername: string;
  description: string | null;
  isActive: boolean;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
  members: AdminRoomMember[];
  sessions: AdminRoomSession[];
}

export interface AdminCategoryResponse {
  category: string;
  questionCount: number;
  lastUsedAt: string;
}

export interface AdminQuestionResponse {
  id: string;
  category: string;
  text: string;
  answer: string;
  explanation: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  orderIndex: number;
  isSkipped: boolean;
  sessionId: string;
  sessionCode: string;
  winnerName: string | null;
  createdAt: string;
}
