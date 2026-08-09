import { useState, useEffect, useCallback } from 'react';
import { useDashboardV2 } from '~/lib/query/hooks';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';
import { useAuthStore } from '~/stores/useAuthStore';

export interface ActiveSessionInfo {
  code: string;
  status?: string;
  roomId?: string;
}

export interface UseRoomsDataOptions {
  onNavigate?: (path: string) => void;
}

export function useRoomsData(options?: UseRoomsDataOptions) {
  const { data, isLoading, isError, refetch } = useDashboardV2();
  const user = useAuthStore((s) => s.user);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAllRoomsModal, setShowAllRoomsModal] = useState(false);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [activeSessionInfo, setActiveSessionInfo] = useState<ActiveSessionInfo | null>(null);

  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Check for active session for instant reconnection banner
  useEffect(() => {
    let isMounted = true;

    async function checkActiveSession() {
      try {
        const stored = await appStorage.getActiveSession();
        if (stored?.code) {
          const resData = await sessionsApi.joinCheck(stored.code).catch(() => null);
          if (!isMounted) return;
          const status = resData?.session?.status;
          if (status && ['LOBBY', 'GENERATING', 'PLAYING', 'PAUSED'].includes(status)) {
            setActiveSessionInfo({
              code: stored.code,
              status,
              roomId: resData.session.roomId ?? undefined,
            });
            return;
          } else {
            await appStorage.clearActiveSession();
          }
        }

        const roomWithActiveSession = data?.recentRooms?.find((r) => r.hasActiveSession);
        if (roomWithActiveSession && isMounted) {
          try {
            const resData = await sessionsApi.joinCheck(roomWithActiveSession.code);
            const status = resData?.session?.status;
            if (status && ['LOBBY', 'GENERATING', 'PLAYING', 'PAUSED'].includes(status)) {
              await appStorage.setActiveSession({
                sessionId: resData.session.id,
                code: resData.session.code,
              });
              if (isMounted) {
                setActiveSessionInfo({
                  code: resData.session.code,
                  status,
                  roomId: roomWithActiveSession.id,
                });
              }
              return;
            }
          } catch {
            // ignore
          }

          if (isMounted) {
            setActiveSessionInfo({
              code: '',
              status: 'PLAYING',
              roomId: roomWithActiveSession.id,
            });
          }
        } else if (isMounted) {
          setActiveSessionInfo(null);
        }
      } catch (err) {
        console.error('Failed to check active session:', err);
      }
    }

    checkActiveSession();

    return () => {
      isMounted = false;
    };
  }, [data?.recentRooms]);

  const resolveSessionRoute = useCallback((sessionCode: string, status?: string): string => {
    if (status === 'LOBBY') return `/session/${sessionCode}/categories`;
    if (status === 'GENERATING') return `/session/${sessionCode}/loading`;
    if (status === 'PLAYING' || status === 'PAUSED') return `/session/${sessionCode}/game`;
    if (status === 'RESULTS') return `/session/${sessionCode}/results`;
    return `/session/${sessionCode}/lobby`;
  }, []);

  const handleReconnectSession = useCallback(() => {
    if (!activeSessionInfo) return;
    const sessionCode = activeSessionInfo.code;
    const status = activeSessionInfo.status || 'PLAYING';

    if (!sessionCode && activeSessionInfo.roomId) {
      options?.onNavigate?.(`/room/${activeSessionInfo.roomId}`);
      return;
    }

    const route = resolveSessionRoute(sessionCode, status);
    options?.onNavigate?.(route);
  }, [activeSessionInfo, options, resolveSessionRoute]);

  const handleJoinCode = useCallback(
    async (rawCode: string) => {
      const trimmedCode = rawCode.trim().toUpperCase();
      if (!trimmedCode) {
        setJoinError('Le code est requis pour rejoindre.');
        return;
      }
      if (trimmedCode.replace(/[^A-Z0-9]/g, '').length < 4) {
        setJoinError('Code trop court — vérifie les caractères saisis.');
        return;
      }

      setIsJoining(true);
      setJoinError(null);

      try {
        const dataRes = await sessionsApi.joinCheck(trimmedCode);

        if (dataRes?.session?.id) {
          await appStorage.setActiveSession({
            sessionId: dataRes.session.id,
            code: trimmedCode,
          });
        }

        setShowJoinModal(false);
        setCode('');

        const targetRoute = resolveSessionRoute(trimmedCode, dataRes?.session?.status);
        options?.onNavigate?.(targetRoute);
      } catch (sessionErr: unknown) {
        const errObj = sessionErr as {
          response?: { status?: number; data?: { session?: { id?: string; status?: string }; message?: string } };
        };
        const sessionStatus = errObj?.response?.status;

        if (sessionStatus === 409) {
          const sessionFromError = errObj?.response?.data?.session;
          if (sessionFromError?.id) {
            await appStorage.setActiveSession({
              sessionId: sessionFromError.id,
              code: trimmedCode,
            });
            setShowJoinModal(false);
            setCode('');
            const targetRoute = resolveSessionRoute(trimmedCode, sessionFromError.status);
            options?.onNavigate?.(targetRoute);
            return;
          }
        }

        try {
          const roomData = await roomsApi.joinRoom(trimmedCode);
          setShowJoinModal(false);
          setCode('');
          options?.onNavigate?.(`/room/${roomData.room.id}`);
        } catch (roomErr: unknown) {
          const rErrObj = roomErr as { response?: { status?: number; data?: { message?: string } } };
          const status = rErrObj?.response?.status;
          if (status === 404) {
            setJoinError('Aucune salle ou partie trouvée avec ce code');
          } else if (status === 409) {
            setJoinError('Vous avez déjà rejoint cette salle');
          } else if (status === 400) {
            setJoinError('Cette salle est pleine');
          } else {
            setJoinError(rErrObj?.response?.data?.message || 'Erreur lors de la connexion');
          }
        } finally {
          setIsJoining(false);
        }
        return;
      } finally {
        setIsJoining(false);
      }
    },
    [options, resolveSessionRoute]
  );

  return {
    data,
    isLoading,
    isError,
    refetch,
    user,
    recentRooms: data?.recentRooms ?? [],
    rank: data?.globalStats?.rank ?? 0,
    activeSessionInfo,
    showJoinModal,
    setShowJoinModal,
    showAllRoomsModal,
    setShowAllRoomsModal,
    showAllRooms,
    setShowAllRooms,
    code,
    setCode: (val: string) => {
      setCode(val);
      setJoinError(null);
    },
    isJoining,
    joinError,
    handleReconnectSession,
    handleJoinCode,
  };
}
