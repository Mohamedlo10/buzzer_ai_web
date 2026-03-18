'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';

export default function JoinSessionByCodePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  useEffect(() => {
    if (code) {
      router.replace(`/session/${code}/categories`);
    }
  }, [code, router]);

  return (
    <SafeScreen className="bg-[#292349]">
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
            <Sparkles size={40} color="#00D397" />
          </div>
          <p className="text-white font-semibold">Connexion en cours...</p>
        </div>
      </div>
    </SafeScreen>
  );
}
