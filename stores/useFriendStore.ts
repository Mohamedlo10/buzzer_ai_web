import { create } from 'zustand';
import type { FriendRequestResponse, SentFriendRequestResponse, FriendResponse } from '~/types/api';
import * as friendsApi from '~/lib/api/friends';

interface FriendState {
  friends: FriendResponse[];
  pendingRequests: FriendRequestResponse[];
  sentRequests: SentFriendRequestResponse[];
  isLoading: boolean;

  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendRequest: (targetUserId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;

  // WebSocket updates
  setFriendOnline: (userId: string) => void;
  setFriendOffline: (userId: string) => void;
  addPendingRequest: (request: FriendRequestResponse) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
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
