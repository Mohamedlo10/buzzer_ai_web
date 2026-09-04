import { useState, useEffect, useCallback } from 'react';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import { appStorage } from '~/lib/utils/storage';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import type { RoomInfo, PlayerResponse } from '~/types/api';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

export interface UseLobbySessionOptions {
  code: string;
  onNavigate?: (path: string) => void;
  onReplaceRoute?: (path: string) => void;
}

export function useLobbySession({ code, onNavigate: _onNavigate, onReplaceRoute }: UseLobbySessionOptions) {
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [kickingPlayerId, setKickingPlayerId] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [teamPickerTargetPlayer, setTeamPickerTargetPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [showQLimit, setShowQLimit] = useState(false);
  const [adjustedQPerCat, setAdjustedQPerCat] = useState(1);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [selectedLobbyPlayer, setSelectedLobbyPlayer] = useState<PlayerResponse | null>(null);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqText, setReqText] = useState('');
  const [reqSent, setReqSent] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { session, players, teams, fetchSession, startSession, deleteSession, isStarting, leaveSession } = useBuzzStore();

  const isManager = session?.managerId === user?.id;
  const currentPlayer = players.find((p) => p.userId === user?.id);
  const { isConnected } = useGameSocket(session?.id || null);

  useEffect(() => {
    if (!code) return;
    if (session && session.code === code) return;
    if (session && session.code !== code) leaveSession();
    const loadSession = async () => {
      try {
        const activeSession = await appStorage.getActiveSession();
        if (activeSession?.sessionId && activeSession?.code === code) {
          await fetchSession(activeSession.sessionId);
          return;
        }
        const checkResult = await useBuzzStore.getState().joinCheck(code);
        if (checkResult?.sessionId) {
          await fetchSession(checkResult.sessionId);
          await appStorage.setActiveSession({ sessionId: checkResult.sessionId, code: checkResult.code });
        } else { onReplaceRoute?.('/rooms'); }
      } catch { onReplaceRoute?.('/rooms'); }
    };
    loadSession();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety poll fallback ONLY when WebSocket is disconnected
  useEffect(() => {
    if (!session?.id || isConnected) return;
    const interval = setInterval(() => fetchSession(session.id), 3000);
    return () => clearInterval(interval);
  }, [session?.id, fetchSession, isConnected]);

  useEffect(() => {
    if (session?.id) fetchSession(session.id);
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session?.roomId) return;
    roomsApi.getRoomDetail(session.roomId).then((data) => setRoomInfo(data.room)).catch(() => {});
  }, [session?.roomId]);

  useEffect(() => {
    if (!session?.id || !user?.id) return;
    if (session.status !== 'LOBBY') return;
    if (isManager) return;

    const inPlayers = players.some((p) => p.userId === user.id);
    if (!inPlayers) {
      if (session.categorySelectionMode === 'MANAGER' || session.questionMode === 'MANUAL') {
        if (session.isTeamMode) {
          onReplaceRoute?.(`/session/${code}/categories`);
        } else {
          sessionsApi
            .joinSession(session.id, { categories: [], isSpectator: false })
            .then(() => fetchSession(session.id))
            .catch((err) => {
              if (err?.response?.status === 409) {
                fetchSession(session.id);
              }
            });
        }
      } else {
        onReplaceRoute?.(`/session/${code}/categories`);
      }
    }
  }, [
    session?.id,
    session?.status,
    session?.categorySelectionMode,
    session?.questionMode,
    session?.isTeamMode,
    user?.id,
    isManager,
    players,
    code,
    fetchSession,
    onReplaceRoute,
  ]);

  useEffect(() => {
    if (session?.status === 'GENERATING') onReplaceRoute?.(`/session/${code}/loading`);
    else if (session?.status === 'PLAYING') onReplaceRoute?.(`/session/${code}/game`);
    else if (session?.status === 'RESULTS') onReplaceRoute?.(`/session/${code}/results`);
    else if (session?.status === 'CANCELLED') {
      onReplaceRoute?.(session?.roomId ? `/room/${session.roomId}` : '/rooms');
    }
  }, [session?.status, session?.roomId, code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive avatars synchronously from player data — zero N+1 API calls
  useEffect(() => {
    if (!players.length) return;
    const map: Record<string, string | null> = {};
    players.forEach((player) => {
      if (player.userId) {
        map[player.userId] = player.avatarUrl ?? (player.userId === user?.id ? user.avatarUrl ?? null : null);
      }
    });
    setAvatarMap(map);
  }, [players, user]);

  const handleStartGame = useCallback(async () => {
    if (!session?.id || !code) return;
    if (session.questionMode === 'AI') {
      const realPlayers = session.sessionMode !== 'WITH_MODERATOR'
        ? players.filter((p) => !p.isSpectator).length
        : players.filter((p) => !p.isSpectator && !p.isManager).length;
      const total = (session.maxCategoriesPerPlayer ?? 1) * (session.questionsPerCategory ?? 1) * realPlayers;
      if (total > 60) {
        setAdjustedQPerCat(Math.max(1, Math.floor(60 / ((session.maxCategoriesPerPlayer ?? 1) * realPlayers))));
        setShowQLimit(true);
        return;
      }
    }
    try { await startSession(session.id); }
    catch (err: any) { notify.error(err?.response?.data?.message || err?.message || 'Impossible de démarrer la partie'); }
  }, [session, code, players, startSession]);

  const handleManagerStartClick = useCallback(async () => {
    const realCount = players.filter((p) => !p.isSpectator).length;
    if (realCount < 2) {
      notify.error('Minimum 2 joueurs requis pour lancer la partie');
      return;
    }
    if (session!.questionMode === 'MANUAL' && session!.totalQuestions === 0) {
      notify.error('Ajoutez des questions manuelles avant de lancer');
      return;
    }
    await handleStartGame();
  }, [players, session, handleStartGame]);

  const handleStartWithAdjustedQ = useCallback(async () => {
    if (!session?.id) return;
    setIsSavingConfig(true);
    try {
      await sessionsApi.updateSessionConfig(session.id, { questionsPerCategory: adjustedQPerCat });
      await fetchSession(session.id);
    } catch { /* proceed */ }
    finally { setIsSavingConfig(false); }
    setShowQLimit(false);
    try { await startSession(session.id); }
    catch (err: any) { notifyApiError(err, 'Impossible de démarrer la partie'); }
  }, [session?.id, adjustedQPerCat, fetchSession, startSession]);

  const handleLeave = useCallback(async () => {
    const confirmed = await confirmAsync({
      title: 'Quitter la session ?', message: 'Vous serez retiré de cette session.', confirmLabel: 'Quitter', tone: 'danger',
    });
    if (!confirmed) return;
    const roomId = session?.roomId;
    leaveSession();
    onReplaceRoute?.(roomId ? `/room/${roomId}` : '/');
  }, [session?.roomId, leaveSession, onReplaceRoute]);

  const handleDeleteSession = useCallback(async () => {
    if (!session?.id || isDeletingSession) return;
    const confirmed = await confirmAsync({
      title: 'Supprimer la session ?', message: 'Cette action est irréversible. Tous les joueurs seront expulsés.', confirmLabel: 'Supprimer', tone: 'danger',
    });
    if (!confirmed) return;
    setIsDeletingSession(true);
    const roomId = session.roomId;
    try {
      await deleteSession(session.id);
      onReplaceRoute?.(roomId ? `/room/${roomId}` : '/rooms');
    } catch (err: any) {
      notifyApiError(err, 'Impossible de supprimer la session');
      setIsDeletingSession(false);
    }
  }, [session?.id, session?.roomId, isDeletingSession, deleteSession, onReplaceRoute]);

  const handleKickPlayer = useCallback(async (playerId: string, playerName: string) => {
    if (!session?.id || kickingPlayerId) return;
    const confirmed = await confirmAsync({
      title: 'Retirer ce joueur ?', message: `${playerName} sera expulsé de la session.`, confirmLabel: 'Retirer', tone: 'danger',
    });
    if (!confirmed) return;
    setKickingPlayerId(playerId);
    try { await sessionsApi.removePlayer(session.id, playerId); }
    catch (err: any) { notifyApiError(err, "Impossible d'expulser le joueur"); }
    finally { setKickingPlayerId(null); }
  }, [session?.id, kickingPlayerId]);

  const handleAssignTeam = useCallback(async (playerId: string, teamId: string) => {
    if (!session?.id) return;
    setIsChangingTeam(true);
    try {
      await sessionsApi.changePlayerTeam(session.id, playerId, teamId);
      await fetchSession(session.id);
    } catch (err: any) { notifyApiError(err, "Impossible de changer d'équipe"); }
    finally {
      setIsChangingTeam(false);
      setShowTeamPicker(false);
      setTeamPickerTargetPlayer(null);
    }
  }, [session?.id, fetchSession]);

  const handleChangeTeam = useCallback(() => {
    if (!currentPlayer) return;
    setTeamPickerTargetPlayer({ id: currentPlayer.id, name: currentPlayer.name });
    setShowTeamPicker(true);
  }, [currentPlayer]);

  const handleManagerReassign = useCallback((playerId: string, playerName: string) => {
    setTeamPickerTargetPlayer({ id: playerId, name: playerName });
    setShowTeamPicker(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!session?.id) return;
    setIsRefreshing(true);
    await fetchSession(session.id);
    setIsRefreshing(false);
  }, [session?.id, fetchSession]);

  const handleSendCategoryRequest = useCallback(() => {
    if (reqText.trim().length < 3) return;
    setReqSent(true);
    setTimeout(() => { setReqOpen(false); setReqSent(false); setReqText(''); }, 1600);
  }, [reqText]);

  const managerPlayer = players.find((p) => p.isManager);
  const realPlayerCount = players.filter((p) => !p.isSpectator).length;
  const canStart = realPlayerCount >= 2 && (session?.questionMode !== 'MANUAL' || (session?.totalQuestions ?? 0) > 0);
  const isWithoutModerator = session?.sessionMode === 'WITHOUT_MODERATOR';
  const totalQuestionsEstimate = session?.categorySelectionMode === 'MANAGER'
    ? (session?.targetTotalQuestions ?? 25)
    : (session?.maxCategoriesPerPlayer ?? 1) * (session?.questionsPerCategory ?? 1) * Math.max(1, realPlayerCount);

  return {
    isCopied, setIsCopied, isRefreshing, isDeletingSession, kickingPlayerId, roomInfo,
    showQRModal, setShowQRModal, showTeamPicker, setShowTeamPicker, teamPickerTargetPlayer, setTeamPickerTargetPlayer,
    isChangingTeam, showQLimit, setShowQLimit, adjustedQPerCat, setAdjustedQPerCat, isSavingConfig,
    avatarMap, showStartConfirm, setShowStartConfirm, profileUserId, setProfileUserId,
    selectedLobbyPlayer, setSelectedLobbyPlayer, reqOpen, setReqOpen, reqText, setReqText, reqSent,
    user, session, players, teams, isManager, currentPlayer, isConnected, isStarting,
    managerPlayer, realPlayerCount, canStart, isWithoutModerator, totalQuestionsEstimate,
    handleStartGame, handleManagerStartClick, handleStartWithAdjustedQ, handleLeave,
    handleDeleteSession, handleKickPlayer, handleAssignTeam, handleChangeTeam,
    handleManagerReassign, handleRefresh, handleSendCategoryRequest,
  };
}
