import { useState } from 'react';
import { useAuthStore } from '~/stores/useAuthStore';

export interface UseRegisterFormOptions {
  onNavigate?: (path: string) => void;
}

export interface RegisterFormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function useRegisterForm(options?: UseRegisterFormOptions) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterFormErrors>({});

  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  function validate(): boolean {
    const newErrors: RegisterFormErrors = {};

    if (!username.trim()) {
      newErrors.username = "Nom d'utilisateur requis";
    } else if (username.trim().length < 3) {
      newErrors.username = 'Minimum 3 caractères';
    }

    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Format d'email invalide";
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }

    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function clearFieldError(field: keyof RegisterFormErrors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleRegister() {
    if (isLoading) return;
    if (!validate()) return;

    try {
      await register(username.trim(), email.trim(), password);
      options?.onNavigate?.('/rooms');
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        apiError?.response?.data?.message ??
        (apiError?.message === 'Network Error'
          ? 'Impossible de contacter le serveur. Vérifiez votre connexion internet.'
          : "Échec de l'inscription. Veuillez réessayer.");
      setErrors({ username: message });
    }
  }

  return {
    username,
    setUsername: (val: string) => {
      setUsername(val);
      clearFieldError('username');
    },
    email,
    setEmail: (val: string) => {
      setEmail(val);
      clearFieldError('email');
    },
    password,
    setPassword: (val: string) => {
      setPassword(val);
      clearFieldError('password');
    },
    confirmPassword,
    setConfirmPassword: (val: string) => {
      setConfirmPassword(val);
      clearFieldError('confirmPassword');
    },
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    errors,
    isLoading,
    handleRegister,
  };
}
