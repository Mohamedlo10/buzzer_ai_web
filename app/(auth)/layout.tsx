'use client';

import { useAuthStore } from '~/stores/useAuthStore';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Si déjà authentifié (ex: cookie absent mais session restaurée),
  // le middleware s'en charge via has_session. On ne rend pas les pages
  // auth pour éviter tout flash.
  if (isAuthenticated) return null;

  return <>{children}</>;
}
