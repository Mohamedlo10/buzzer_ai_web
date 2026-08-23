'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { queryClient } from '~/lib/query/queryClient';
import { useAuthStore } from '~/stores/useAuthStore';
import { ThemeProvider } from '~/components/providers/ThemeProvider';
import { AuthGate } from '~/components/providers/AuthGate';
import { ConfirmHost } from '~/components/providers/ConfirmHost';
import { setNotifyHandler } from '~/lib/ui/notify';

setNotifyHandler({
  error: (msg) => toast.error(msg, { duration: 5000 }),
  success: (msg) => toast.success(msg, { duration: 3000 }),
  info: (msg) => toast(msg, { duration: 4000 }),
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession().finally(() => setReady(true));
  }, [restoreSession]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {/* Monté ici, donc après `restoreSession()` : `isAuthenticated` est déjà
            stabilisé et le garde couvre TOUTES les routes d'un coup. */}
        <AuthGate>{children}</AuthGate>
        {/* Hors de `AuthGate` : une confirmation déclenchée juste avant une
            redirection doit pouvoir se résoudre au lieu d'être démontée. */}
        <ConfirmHost />
        <Toaster position="top-center" richColors theme="dark" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

