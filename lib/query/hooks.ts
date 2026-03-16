import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import * as usersApi from '~/lib/api/users';
import * as sessionsApi from '~/lib/api/sessions';
import * as rankingsApi from '~/lib/api/rankings';
import * as dashboardApi from '~/lib/api/dashboard';
import * as roomsApi from '~/lib/api/rooms';
import * as friendsApi from '~/lib/api/friends';
import * as invitationsApi from '~/lib/api/invitations';

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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pendingInvitations }),
  });
}

export function useDeclineInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.declineInvitation(invitationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pendingInvitations }),
  });
}
