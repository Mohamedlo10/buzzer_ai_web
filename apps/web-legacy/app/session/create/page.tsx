'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { SessionConfigForm } from '~/components/session/SessionConfigForm';

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') ?? undefined;

  useEffect(() => {
    if (!roomId) {
      router.replace('/rooms');
    }
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuccess = (sessionId: string, code: string) => {
    router.replace(`/session/${code}/lobby`);
  };

  if (!roomId) return null;

  return (
    <SafeScreen className="h-screen flex flex-col overflow-hidden">
      <SessionConfigForm onSuccess={handleSuccess} roomId={roomId} onClose={() => router.back()} />
    </SafeScreen>
  );
}
