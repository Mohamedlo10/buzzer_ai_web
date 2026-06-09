'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { queryClient } from '~/lib/query/queryClient';
import { useAuthStore } from '~/stores/useAuthStore';
import { ThemeProvider } from '~/components/providers/ThemeProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession().finally(() => setReady(true));
  }, [restoreSession]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-center" richColors theme="dark" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

