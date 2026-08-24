'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { SessionConfigForm } from '~/components/session/SessionConfigForm';
import { resolvePostCreationRoute } from '~/lib/game/sessionRouting';
import type { SessionResponse } from '~/types/api';

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') ?? undefined;

  useEffect(() => {
    if (!roomId) {
      router.replace('/rooms');
    }
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuccess = (_sessionId: string, code: string, session?: SessionResponse) => {
    const route = resolvePostCreationRoute({
      code,
      sessionMode: session?.sessionMode ?? 'WITHOUT_MODERATOR',
      categorySelectionMode: session?.categorySelectionMode,
    });
    router.replace(route);
  };

  if (!roomId) return null;

  return (
    <SafeScreen className="h-screen flex flex-col overflow-hidden">
      <SessionConfigForm onSuccess={handleSuccess} roomId={roomId} onClose={() => router.back()} />
    </SafeScreen>
  );
}
