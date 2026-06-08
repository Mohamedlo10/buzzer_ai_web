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
    <SafeScreen>
      {/* Header */}
      <div className="bg-bg pt-6 pb-4 px-4 border-b border-line sticky top-0 z-10">
        <div className="flex flex-row items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-3 hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-txt font-bold text-xl">Nouvelle session</p>
            <div className="flex flex-row items-center mt-0.5 gap-1">
              <Sparkles size={12} className="text-energy" />
              <span className="text-txt-60 text-xs">Configurez votre partie</span>
            </div>
          </div>
        </div>
      </div>

      <SessionConfigForm onSuccess={handleSuccess} roomId={roomId} />
    </SafeScreen>
  );
}
