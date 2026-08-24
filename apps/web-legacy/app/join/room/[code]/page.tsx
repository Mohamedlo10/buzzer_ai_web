'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

import * as sessionsApi from '~/lib/api/sessions';
import * as roomsApi from '~/lib/api/rooms';
import { resolveJoinRoute } from '~/lib/game/sessionRouting';
import { SafeScreen } from '~/components/layout/SafeScreen';

export default function JoinRoomByCodePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  useEffect(() => {
    if (!code) return;
    let isMounted = true;

    async function handleJoin() {
      try {
        const roomData = await roomsApi.joinRoom(code);
        if (!isMounted) return;
        router.replace(`/room/${roomData.room.id}`);
      } catch (roomErr: any) {
        if (!isMounted) return;
        if (roomErr?.response?.status === 409 && roomErr?.response?.data?.roomId) {
          router.replace(`/room/${roomErr.response.data.roomId}`);
          return;
        }
        try {
          const check = await sessionsApi.joinCheck(code);
          if (!isMounted) return;
          const targetRoute = resolveJoinRoute({
            code,
            sessionId: check.session.id,
            categorySelectionMode: check.session.categorySelectionMode,
          });
          router.replace(targetRoute);
        } catch {
          if (!isMounted) return;
          router.replace(`/session/${code}/categories`);
        }
      }
    }

    handleJoin();

    return () => {
      isMounted = false;
    };
  }, [code, router]);

  return (
    <SafeScreen>
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-4">
            <Sparkles size={40} className="text-accent" />
          </div>
          <p className="text-txt font-semibold">Connexion en cours...</p>
        </div>
      </div>
    </SafeScreen>
  );
}
