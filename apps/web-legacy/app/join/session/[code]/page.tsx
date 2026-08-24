'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

import * as sessionsApi from '~/lib/api/sessions';
import { resolveJoinRoute } from '~/lib/game/sessionRouting';
import { SafeScreen } from '~/components/layout/SafeScreen';

export default function JoinSessionByCodePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  useEffect(() => {
    if (!code) return;
    let isMounted = true;

    async function checkRoute() {
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

    checkRoute();

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
