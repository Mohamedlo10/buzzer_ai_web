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
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isRoom = pathname.startsWith('/room/');

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        {!isDashboard && !isRoom && <DashboardHeader notificationCount={pendingRequests.length} />}
        <main className="flex-1 pb-[78px]">{children}</main>
        <TabBar />
      </div>
    </AuthGuard>
  );
}
