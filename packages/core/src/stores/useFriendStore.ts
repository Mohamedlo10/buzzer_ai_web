import { create } from 'zustand';
import type { FriendRequestResponse, SentFriendRequestResponse, FriendResponse } from '~/types/api';
import * as friendsApi from '~/lib/api/friends';

interface FriendState {
  friends: FriendResponse[];
  pendingRequests: FriendRequestResponse[];
  sentRequests: SentFriendRequestResponse[];
  blockedUsers: FriendResponse[];
  isLoading: boolean;

  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  fetchBlockedUsers: () => Promise<void>;
  sendRequest: (targetUserId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string, snapshot?: FriendResponse) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;

  // WebSocket updates
  setFriendOnline: (userId: string) => void;
  setFriendOffline: (userId: string) => void;
  addPendingRequest: (request: FriendRequestResponse) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  blockedUsers: [],
  isLoading: false,

  fetchFriends: async () => {
    set({ isLoading: true });
    try {
      const friends = await friendsApi.getFriends();
      set({ friends });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingRequests: async () => {
    const requests = await friendsApi.getPendingRequests();
    set({ pendingRequests: requests });
  },

  fetchSentRequests: async () => {
    const requests = await friendsApi.getSentRequests();
    set({ sentRequests: requests });
  },

  fetchBlockedUsers: async () => {
    try {
      const blocked = await friendsApi.getBlockedUsers();
      set((state) => {
        // Merge with existing locally blocked if backend returned empty list
        const map = new Map<string, FriendResponse>();
        state.blockedUsers.forEach((u) => map.set(u.id, u));
        blocked.forEach((u) => map.set(u.id, u));
        return { blockedUsers: Array.from(map.values()) };
      });
    } catch {
      // keep current state
    }
  },

  sendRequest: async (targetUserId) => {
    await friendsApi.sendFriendRequest(targetUserId);
  },

  acceptRequest: async (requestId) => {
    await friendsApi.acceptFriendRequest(requestId);
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
    }));
    // Refresh friends list after accepting
    get().fetchFriends();
  },

  declineRequest: async (requestId) => {
    await friendsApi.declineFriendRequest(requestId);
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
    }));
  },

  cancelRequest: async (requestId) => {
    await friendsApi.cancelFriendRequest(requestId);
    set((state) => ({
      sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
    }));
  },

  removeFriend: async (friendId) => {
    await friendsApi.removeFriend(friendId);
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
    }));
  },

  blockUser: async (userId, snapshot) => {
    await friendsApi.blockUser(userId);
    set((state) => {
      const existingFriend = state.friends.find((f) => f.id === userId);
      const userObj: FriendResponse = snapshot || (existingFriend ? {
        id: existingFriend.id,
        username: existingFriend.username,
        avatarUrl: existingFriend.avatarUrl,
        isOnline: false,
        lastSeenAt: null,
      } : {
        id: userId,
        username: 'Utilisateur',
        avatarUrl: null,
        isOnline: false,
        lastSeenAt: null,
      });

      const newBlocked = state.blockedUsers.some((u) => u.id === userId)
        ? state.blockedUsers
        : [...state.blockedUsers, userObj];

      return {
        friends: state.friends.filter((f) => f.id !== userId),
        pendingRequests: state.pendingRequests.filter((r) => r.requester.id !== userId),
        sentRequests: state.sentRequests.filter((r) => r.receiver.id !== userId),
        blockedUsers: newBlocked,
      };
    });
  },

  unblockUser: async (userId) => {
    // Optimistic removal from blocked list
    set((state) => ({
      blockedUsers: state.blockedUsers.filter((u) => u.id !== userId),
    }));
    try {
      await friendsApi.unblockUser(userId);
    } catch (err) {
      // Revert if API fails
      get().fetchBlockedUsers();
      throw err;
    }
    // Refresh friends list
    get().fetchFriends();
  },

  // WebSocket updates
  setFriendOnline: (userId) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === userId ? { ...f, isOnline: true } : f,
      ),
    })),
  setFriendOffline: (userId) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === userId ? { ...f, isOnline: false } : f,
      ),
    })),
  addPendingRequest: (request) =>
    set((state) => ({
      pendingRequests: [...state.pendingRequests, request],
    })),
}));
