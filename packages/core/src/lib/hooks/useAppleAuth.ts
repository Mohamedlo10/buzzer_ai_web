import { useState, useCallback } from 'react';
import { useAuthStore } from '~/stores/useAuthStore';

export interface UseAppleAuthOptions {
  /**
   * Platform-specific callback to prompt the user and obtain an Apple identity token.
   * On iOS, provided by native Apple Authentication provider.
   */
  getIdentityToken: () => Promise<string | null>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAppleAuth({ getIdentityToken, onSuccess, onError }: UseAppleAuthOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const loginWithApple = useAuthStore((state) => state.loginWithApple);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const identityToken = await getIdentityToken();
      if (!identityToken) {
        // User cancelled or no token returned — silent abort
        setIsLoading(false);
        return;
      }
      await loginWithApple(identityToken);
      onSuccess?.();
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || "Erreur d'authentification Apple");
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [getIdentityToken, loginWithApple, onSuccess, onError]);

  return {
    signIn,
    isLoading,
  };
}
