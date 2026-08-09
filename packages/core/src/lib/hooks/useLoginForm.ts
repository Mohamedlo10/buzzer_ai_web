import { useState } from 'react';
import { useAuthStore } from '~/stores/useAuthStore';
import { readReturnTo } from '~/lib/auth/returnTo';

export interface UseLoginFormOptions {
  onNavigate?: (path: string) => void;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
}

export function useLoginForm(options?: UseLoginFormOptions) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const isEmailInput = username.includes('@');

  function validate(u: string, p: string): boolean {
    const newErrors: LoginFormErrors = {};
    if (!u.trim()) {
      newErrors.username = "Nom d'utilisateur requis";
    }
    if (!p) {
      newErrors.password = 'Mot de passe requis';
    } else if (p.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function clearFieldError(field: keyof LoginFormErrors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleLogin() {
    if (isLoading) return;

    if (!validate(username, password)) return;

    try {
      await login(username.trim(), password);
      const user = useAuthStore.getState().user;

      const redirect =
        readReturnTo() ?? (user?.role === 'SUPER_ADMIN' ? '/admin' : '/rooms');

      options?.onNavigate?.(redirect);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        apiError?.response?.data?.message ??
        (apiError?.message === 'Network Error'
          ? 'Impossible de contacter le serveur. Vérifiez que le serveur est démarré ou l’URL réseau.'
          : 'Échec de la connexion. Veuillez réessayer.');
      setErrors({ password: message });
    }
  }

  return {
    username,
    setUsername: (val: string) => {
      setUsername(val);
      clearFieldError('username');
    },
    password,
    setPassword: (val: string) => {
      setPassword(val);
      clearFieldError('password');
    },
    showPassword,
    setShowPassword,
    errors,
    isLoading,
    isEmailInput,
    handleLogin,
  };
}
