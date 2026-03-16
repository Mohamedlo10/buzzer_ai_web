'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '~/stores/useAuthStore';
import { appStorage } from '~/lib/utils/storage';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
      return;
    }
    // Si onboarding déjà vu → login, sinon → onboarding
    appStorage.isOnboardingDone().then((done) => {
      router.replace(done ? '/login' : '/onboarding');
    });
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
