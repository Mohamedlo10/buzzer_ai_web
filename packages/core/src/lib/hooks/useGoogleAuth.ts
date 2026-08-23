import { useState, useCallback } from 'react';
import { useAuthStore } from '~/stores/useAuthStore';

export interface UseGoogleAuthOptions {
  /**
   * Platform-specific callback to prompt the user and obtain a Google ID token.
   * On mobile/web, provided by native auth provider.
   */
  getIdToken: () => Promise<string | null>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useGoogleAuth({ getIdToken, onSuccess, onError }: UseGoogleAuthOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        // User cancelled or no token returned — silent abort
        setIsLoading(false);
        return;
      }
      await loginWithGoogle(idToken);
      onSuccess?.();
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Erreur de connexion Google');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [getIdToken, loginWithGoogle, onSuccess, onError]);

  return {
    signIn,
    isLoading,
  };
}
