import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import * as leaderboardsApi from '~/lib/api/leaderboards';
import * as usersApi from '~/lib/api/users';
import * as sessionsApi from '~/lib/api/sessions';
import * as rankingsApi from '~/lib/api/rankings';
import * as dashboardApi from '~/lib/api/dashboard';
import * as roomsApi from '~/lib/api/rooms';
import * as friendsApi from '~/lib/api/friends';
import * as invitationsApi from '~/lib/api/invitations';
import * as notificationsApi from '~/lib/api/notifications';
import * as dailyApi from '~/lib/api/daily';
import * as achievementsApi from '~/lib/api/achievements';

// ──────────────────────────────────────────────
// User
// ──────────────────────────────────────────────

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: usersApi.getMe,
  });
}

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: () => usersApi.getUserProfile(userId),
    enabled: !!userId,
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: queryKeys.userSearch(query),
    queryFn: () => usersApi.searchUsers(query),
    enabled: query.length >= 2,
  });
}

// ──────────────────────────────────────────────
// Session
// ──────────────────────────────────────────────

export function useSession(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.session(sessionId ?? ''),
    queryFn: () => sessionsApi.getSession(sessionId!),
    enabled: !!sessionId,
  });
}

// ──────────────────────────────────────────────
// Rankings
// ──────────────────────────────────────────────

export function useGlobalRankings(page = 0) {
  return useQuery({
    queryKey: queryKeys.globalRankings(page),
    queryFn: () => rankingsApi.getGlobalRankings({ page }),
  });
}

export function useMyGlobalRank() {
  return useQuery({
    queryKey: queryKeys.myGlobalRank,
    queryFn: rankingsApi.getMyGlobalRank,
  });
}

export function useSessionRankings(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessionRankings(sessionId),
    queryFn: () => rankingsApi.getSessionRankings(sessionId),
    enabled: !!sessionId,
  });
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.getDashboard,
  });
}

export function useDashboardV2() {
  return useQuery({
    queryKey: queryKeys.dashboardV2,
    queryFn: dashboardApi.getDashboardV2,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.userStats,
    queryFn: dashboardApi.getUserStats,
  });
}

// ──────────────────────────────────────────────
// Rooms
// ──────────────────────────────────────────────

export function useRooms() {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: roomsApi.getUserRooms,
  });
}

export function useRoomDetail(roomId: string) {
  return useQuery({
    queryKey: queryKeys.roomDetail(roomId),
    queryFn: () => roomsApi.getRoomDetail(roomId),
    enabled: !!roomId,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.createRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rooms }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.deleteRoom(roomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rooms }),
  });
}

// ──────────────────────────────────────────────
// Friends
// ──────────────────────────────────────────────

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends,
    queryFn: friendsApi.getFriends,
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: queryKeys.pendingRequests,
    queryFn: friendsApi.getPendingRequests,
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => friendsApi.sendFriendRequest(targetUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pendingRequests }),
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => friendsApi.acceptFriendRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friends });
      qc.invalidateQueries({ queryKey: queryKeys.pendingRequests });
    },
  });
}

export function useDeclineFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => friendsApi.declineFriendRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pendingRequests }),
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => friendsApi.removeFriend(friendId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.friends }),
  });
}

// ──────────────────────────────────────────────
// Invitations
// ──────────────────────────────────────────────

export function usePendingInvitations() {
  return useQuery({
    queryKey: queryKeys.pendingInvitations,
    queryFn: invitationsApi.getPendingInvitations,
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.acceptInvitation(invitationId),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.pendingInvitations }),
      qc.invalidateQueries({ queryKey: queryKeys.notifications }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboardV2 }),
    ]),
  });
}

export function useDeclineInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.declineInvitation(invitationId),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.pendingInvitations }),
      qc.invalidateQueries({ queryKey: queryKeys.notifications }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboardV2 }),
    ]),
  });
}

import * as soloApi from '~/lib/api/solo';
import * as trainingApi from '~/lib/api/training';

// ──────────────────────────────────────────────
// Solo Careers & Training
// ──────────────────────────────────────────────

export function useSoloCareers() {
  return useQuery({
    queryKey: queryKeys.careers,
    queryFn: soloApi.listCareers,
    staleTime: 1000 * 30, // 30s
  });
}

export function useTrainingSessions() {
  return useQuery({
    queryKey: queryKeys.trainingSessions,
    queryFn: trainingApi.listSessions,
    staleTime: 1000 * 30,
  });
}

export function useTrainingHistory() {
  return useQuery({
    queryKey: queryKeys.trainingMastery(),
    queryFn: trainingApi.getHistory,
    staleTime: 1000 * 60,
  });
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationsApi.getNotifications,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

// ──────────────────────────────────────────────
// Daily Challenge
// ──────────────────────────────────────────────



/**
 * Charge l'état du défi du jour pour l'accueil.
 * staleTime: 0 — le serveur est la source de vérité ; une entrée périmée
 * afficherait un état « déjà joué » erroné au retour sur l'écran.
 */
export function useDailyToday() {
  return useQuery({
    queryKey: queryKeys.dailyToday,
    queryFn: dailyApi.getToday,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Recharge l'état courant d'une tentative.
 * Utilisé par play.tsx pour la reprise et la resynchronisation après STALE_QUESTION.
 * enabled: false par défaut — l'appelant active manuellement via refetch().
 */
export function useDailyAttemptState(attemptId: string) {
  return useQuery({
    queryKey: queryKeys.dailyAttemptState(attemptId),
    queryFn: dailyApi.getCurrentAttempt,
    enabled: false, // piloté par refetch() depuis play.tsx
    staleTime: 0,
  });
}

// ──────────────────────────────────────────────
// Profil joueur & historique
// ──────────────────────────────────────────────

/**
 * Sept statistiques du profil (§19), calculées côté serveur.
 * staleTime: 0 — toujours recalculé à l'affichage de l'écran.
 */
export function useProfileSummary() {
  return useQuery({
    queryKey: queryKeys.dailyProfileSummary,
    queryFn: dailyApi.getProfileSummary,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Historique paginé des parties (§24).
 * useInfiniteQuery — la pagination est serveur, jamais tout chargé.
 */

export function useDailyHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.dailyHistory,
    queryFn: ({ pageParam = 0 }) => dailyApi.getHistory(pageParam as number, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    staleTime: 1000 * 60, // 1 min
  });
}

// ──────────────────────────────────────────────
// Accomplissements
// ──────────────────────────────────────────────



/** Catalogue complet (débloqués + verrouillés). Affiché sur badges.tsx. */
export function useAchievementsCatalog() {
  return useQuery({
    queryKey: queryKeys.achievementsCatalog,
    queryFn: achievementsApi.getCatalog,
    staleTime: 1000 * 60 * 5, // 5 min — catalogue stable
  });
}

/**
 * Badges débloqués dont la modale n'a pas été vue.
 * Filet de rattrapage au montage du profil.
 */
export function useUnseenAchievements() {
  return useQuery({
    queryKey: queryKeys.achievementsUnseen,
    queryFn: achievementsApi.getUnseen,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/** Marque une liste de badges comme vus, puis invalide le cache unseen. */
export function useMarkAchievementsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => achievementsApi.markSeen(ids),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.achievementsUnseen }),
  });
}

// ─── Classements par période (§11) ───────────────────────────────────────────

/**
 * Une page de classement, pour la période demandée.
 *
 * `placeholderData` conserve la page précédente pendant le chargement de la suivante :
 * sans cela, chaque changement d'onglet ou de page ferait clignoter la liste.
 */
export function useLeaderboard(
  period: leaderboardsApi.GetLeaderboardParams['period'],
  page: number,
  username?: string,
) {
  return useQuery({
    queryKey: queryKeys.leaderboard(period, page, username),
    queryFn: () => leaderboardsApi.getLeaderboard({ period, page, username }),
    placeholderData: (previous) => previous,
  });
}

/** Ma position seule — pour l'accueil et le profil. Null si je n'ai pas joué la période. */
export function useMyLeaderboardPosition(
  period: leaderboardsApi.GetLeaderboardParams['period'],
) {
  return useQuery({
    queryKey: queryKeys.leaderboardMe(period),
    queryFn: () => leaderboardsApi.getMyPosition(period),
  });
}
