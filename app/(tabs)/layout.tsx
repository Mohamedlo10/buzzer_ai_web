'use client';

import { usePathname } from 'next/navigation';
import { AuthGuard } from '~/components/providers/AuthGuard';
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

  return (
    <AuthGuard>
      <div className={`flex flex-col ${isRoom ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
        {!isRoom && <DashboardHeader notificationCount={pendingRequests.length} />}
        <main key={pathname} className={`flex-1 ${isRoom ? 'h-full min-h-0 flex flex-col pb-0 overflow-hidden' : 'pb-[78px]'} animate-page-transition`}>
          {children}
        </main>
        <TabBar />
      </div>
    </AuthGuard>
  );
}
