'use client';

import { usePathname } from 'next/navigation';
import { DashboardHeader } from '~/components/layout/DashboardHeader';
import { TabBar } from '~/components/layout/TabBar';
import { useFriendStore } from '~/stores/useFriendStore';
import { usePresence } from '~/lib/websocket';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pendingRequests = useFriendStore((state) => state.pendingRequests);

  // Mark the user online as soon as they enter the app
  usePresence();
  const isRoom = pathname.startsWith('/room/');

  // Plus de garde d'authentification ici : `AuthGate` est monté dans
  // `AppProviders` et couvre toutes les routes, pas seulement ce groupe.
  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full overflow-hidden relative">
      {!isRoom && <DashboardHeader notificationCount={pendingRequests.length} />}
      <main
        key={pathname}
        className={`flex-1 min-h-0 h-full flex flex-col ${isRoom ? 'pb-0 overflow-hidden' : 'pb-[76px] overflow-y-auto overscroll-contain touch-pan-y'} animate-page-transition`}
      >
        {children}
      </main>
      <TabBar />
    </div>
  );
}
