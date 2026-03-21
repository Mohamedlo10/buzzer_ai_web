/**
 * Centralised React Query key factory.
 * Ensures cache invalidation is consistent across the app.
 */
export const queryKeys = {
  // Auth
  me: ['me'] as const,

  // Sessions
  session: (id: string) => ['session', id] as const,

  // Rankings
  globalRankings: (page?: number) => ['rankings', 'global', page] as const,
  sessionRankings: (sessionId: string) => ['rankings', 'session', sessionId] as const,
  myGlobalRank: ['rankings', 'myRank'] as const,

  // Dashboard
  dashboard: ['dashboard'] as const,
  dashboardV2: ['dashboard', 'v2'] as const,
  userStats: ['dashboard', 'stats'] as const,

  // Rooms
  rooms: ['rooms'] as const,
  roomDetail: (id: string) => ['rooms', id] as const,

  // Friends
  friends: ['friends'] as const,
  pendingRequests: ['friends', 'pending'] as const,

  // Invitations
  pendingInvitations: ['invitations', 'pending'] as const,

  // Notifications
  notifications: ['notifications'] as const,

  // Users
  userProfile: (id: string) => ['users', id] as const,
  userSearch: (query: string) => ['users', 'search', query] as const,

  // Admin
  adminStats: ['admin', 'stats'] as const,
  adminUsers: (page?: number) => ['admin', 'users', page] as const,
  adminSessions: (page?: number) => ['admin', 'sessions', page] as const,
} as const;
