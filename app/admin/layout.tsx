'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '~/stores/useAuthStore';
import { AdminSidebar } from '~/components/admin/AdminSidebar';
import { AdminHeader } from '~/components/admin/AdminHeader';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#9B59B6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="min-h-screen bg-bg flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header desktop only — mobile header is inside AdminSidebar */}
        <div className="hidden lg:block">
          <AdminHeader />
        </div>
        {/* Mobile: padding top for header, padding bottom for bottom tab bar */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto pt-[72px] lg:pt-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-surface text-txt border border-line',
        }}
      />
    </div>
  );
}
