import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '~/stores/useAuthStore';
import { useRoomSocket } from '~/lib/websocket';
import * as roomsApi from '~/lib/api/rooms';
import * as friendsApi from '~/lib/api/friends';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';
import type { RoomDetailResponse, RoomSessionResponse, SessionResponse } from '~/types/api';
import { resolvePostCreationRoute } from '~/lib/game/sessionRouting';
import { notify } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

export interface UseRoomDetailOptions {
  roomId: string;
  onNavigate?: (path: string) => void;
  onReplaceRoute?: (path: string) => void;
}

export function useRoomDetail({ roomId, onNavigate, onReplaceRoute }: UseRoomDetailOptions) {
  const [roomData, setRoomData] = useState<RoomDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState<RoomDetailResponse['members'][number] | null>(null);
  const [showQrExpanded, setShowQrExpanded] = useState(false);
  const [memberPresence, setMemberPresence] = useState<Record<string, boolean>>({});

  const user = useAuthStore((state) => state.user);
  const room = roomData?.room;
  const isOwner = room?.ownerId === user?.id;

  const members = (roomData?.members ?? []).map((m) =>
    m.userId in memberPresence ? { ...m, isOnline: memberPresence[m.userId] } : m
  );
  const sessions = roomData?.sessions ?? [];
  const rankings = roomData?.rankings ?? [];

  const activeSessions = sessions.filter(
    (s) => s.status === 'LOBBY' || s.status === 'GENERATING' || s.status === 'PLAYING' || s.status === 'PAUSED'
  );
  const pastSessions = sessions.filter((s) => s.status === 'RESULTS' || s.status === 'CANCELLED');
  const hasActiveSession = activeSessions.length > 0;

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await roomsApi.getRoomDetail(roomId);
      setRoomData(data);
    } catch (err) {
      console.error('Failed to load room:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    const interval = setInterval(loadRoom, 10_000);
    return () => clearInterval(interval);
  }, [loadRoom]);

  useRoomSocket(roomId ?? null, {
    onPresence: (event) => {
      setMemberPresence((prev) => ({ ...prev, [event.userId]: event.isOnline }));
    },
    onDisconnect: () => {
      if (user?.id) {
        setMemberPresence((prev) => ({ ...prev, [user.id]: false }));
      }
    },
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRoom();
    setIsRefreshing(false);
  }, [loadRoom]);

  const navigateToSession = useCallback(async (session: RoomSessionResponse) => {
    const { code, status, id: sessionId } = session;
    await appStorage.setActiveSession({ sessionId, code });

    if (status === 'LOBBY') {
      onNavigate?.(`/session/${code}/categories?sessionId=${sessionId}`);
    } else {
      const routes: Record<string, string> = {
        GENERATING: `/session/${code}/loading`,
        PLAYING: `/session/${code}/game`,
        RESULTS: `/session/${code}/results`,
        PAUSED: `/session/${code}/game`,
      };
      onNavigate?.(`${routes[status] || `/session/${code}/lobby`}?sessionId=${sessionId}&roomId=${roomId}`);
    }
  }, [roomId, onNavigate]);

  const handleSessionCreated = useCallback((_sessionId: string, code: string, session?: SessionResponse) => {
    setShowConfigModal(false);
    const route = resolvePostCreationRoute({
      code,
      sessionMode: session?.sessionMode ?? 'WITHOUT_MODERATOR',
      categorySelectionMode: session?.categorySelectionMode,
    });
    onNavigate?.(route);
  }, [onNavigate]);

  const handleSendFriendRequest = useCallback(async (targetUserId: string) => {
    if (targetUserId === user?.id) return;
    try {
      await friendsApi.sendFriendRequest(targetUserId);
      await loadRoom();
    } catch {
      // silently ignore
    }
  }, [user?.id, loadRoom]);

  const handleLeaveRoom = useCallback(async () => {
    if (!room) return;
    const confirmed = await confirmAsync({
      title: 'Quitter la salle ?',
      message: `Vous ne verrez plus "${room.name}" dans vos salles.`,
      confirmLabel: 'Quitter',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await roomsApi.leaveRoom(room.code);
      onReplaceRoute?.('/rooms');
    } catch {
      notify.error('Impossible de quitter la salle');
    }
  }, [room, onReplaceRoute]);

  const handleDeleteSession = useCallback(async (sessionId: string, sessionCode: string) => {
    const confirmed = await confirmAsync({
      title: 'Supprimer la session ?',
      message: `La session ${sessionCode} sera définitivement supprimée.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await sessionsApi.deleteSession(sessionId);
      await loadRoom();
    } catch {
      notify.error('Impossible de supprimer la session');
    }
  }, [loadRoom]);

  const handleDeleteRoom = useCallback(async () => {
    const confirmed = await confirmAsync({
      title: 'Supprimer la salle ?',
      message: 'Cette action est irréversible. Toutes les statistiques seront perdues.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await roomsApi.deleteRoom(roomId);
      onReplaceRoute?.('/rooms');
    } catch {
      notify.error('Impossible de supprimer la salle');
    }
  }, [roomId, onReplaceRoute]);

  return {
    roomData,
    isLoading,
    isRefreshing,
    showConfigModal,
    setShowConfigModal,
    showInviteModal,
    setShowInviteModal,
    showHistoryModal,
    setShowHistoryModal,
    selectedUserModal,
    setSelectedUserModal,
    showQrExpanded,
    setShowQrExpanded,
    user,
    room,
    isOwner,
    members,
    sessions,
    rankings,
    activeSessions,
    pastSessions,
    hasActiveSession,
    loadRoom,
    handleRefresh,
    navigateToSession,
    handleSessionCreated,
    handleSendFriendRequest,
    handleLeaveRoom,
    handleDeleteSession,
    handleDeleteRoom,
  };
}
