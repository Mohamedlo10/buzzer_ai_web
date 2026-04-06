'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Trophy, Gamepad2, User } from 'lucide-react';
import { AuthGuard } from '~/components/providers/AuthGuard';
import { DashboardHeader } from '~/components/layout/DashboardHeader';
import { useFriendStore } from '~/stores/useFriendStore';
import { usePresence } from '~/lib/websocket';

const tabs = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/friends', icon: Users, label: 'Amis' },
  { href: '/rankings', icon: Trophy, label: 'Classement' },
  { href: '/rooms', icon: Gamepad2, label: 'Partie' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pendingRequests = useFriendStore((state) => state.pendingRequests);

  // Mark the user online as soon as they enter the app
  usePresence();
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isRoom = pathname.startsWith('/room/');

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        {!isDashboard && !isRoom && <DashboardHeader notificationCount={pendingRequests.length} />}
        <main className="flex-1 pb-[70px]">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-dark-card border-t border-border-color flex items-center justify-around px-2 z-50 safe-bottom">
          {tabs.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              pathname.startsWith(href + '/') ||
              (href === '/rooms' && pathname.startsWith('/room'));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </AuthGuard>
  );
}
