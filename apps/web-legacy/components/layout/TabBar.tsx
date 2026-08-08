'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid, Gamepad2, Trophy, Users, User } from 'lucide-react';
import { useAuthStore } from '~/stores/useAuthStore';

const TABS = [
  { href: '/rooms', icon: Grid, label: 'Multijoueur' },
  { href: '/dashboard', icon: Gamepad2, label: 'Solo' },
  { href: '/rankings', icon: Trophy, label: 'Classement' },
  { href: '/friends', icon: Users, label: 'Amis' },
  { href: '/profile', icon: User, label: 'Profil' },
] satisfies ReadonlyArray<{
  href: string;
  icon: typeof Grid;
  label: string;
}>;

export function TabBar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const showUnconfirmedBadge = user && (!user.email || !user.emailVerified);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around px-1.5 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] bg-header-glass backdrop-blur-md border-t border-line">
      {TABS.map(({ href, icon: Icon, label }) => {
        const isActive =
          pathname === href ||
          pathname.startsWith(href + '/') ||
          (href === '/rooms' && pathname.startsWith('/room')) ||
          (href === '/dashboard' && pathname.startsWith('/solo'));

        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 font-ui font-semibold text-[10.5px] transition-colors ${
              isActive ? 'text-accent' : 'text-txt-40 hover:text-txt-60'
            }`}
          >
            <div className="relative">
              <Icon size={22} />
              {label === 'Profil' && showUnconfirmedBadge && (
                <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-bad border border-bg" />
              )}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
