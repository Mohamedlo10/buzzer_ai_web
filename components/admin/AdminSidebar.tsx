'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  DoorOpen,
  BookOpen,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, short: 'Dash' },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users, short: 'Users' },
  { href: '/admin/sessions', label: 'Sessions', icon: Gamepad2, short: 'Sessions' },
  { href: '/admin/rooms', label: 'Salles', icon: DoorOpen, short: 'Salles' },
  { href: '/admin/questions', label: 'Questions', icon: BookOpen, short: 'QCM' },
  { href: '/admin/audit-logs', label: 'Audit', icon: ShieldAlert, short: 'Audit' },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings, short: 'Settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-[#1E1A40] border-r border-[#3E3666] transition-all duration-300 sticky top-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-[#3E3666]">
          <Crown size={24} color="#FFD700" />
          {!collapsed && (
            <span className="text-white font-bold text-lg whitespace-nowrap">Admin</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#9B59B6] text-white'
                    : 'text-white/60 hover:bg-[#3E3666] hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[#3E3666]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-xl text-white/40 hover:bg-[#3E3666] hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span className="ml-2 text-sm">Réduire</span>}
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header (hamburger + logo) ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1E1A40] border-b border-[#3E3666] h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Crown size={20} color="#FFD700" />
          <span className="text-white font-bold">Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center text-white"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ─── Mobile Drawer ─── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-14 left-0 right-0 bg-[#1E1A40] border-b border-[#3E3666] p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-[#9B59B6] text-white'
                      : 'text-white/60 hover:bg-[#3E3666] hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </aside>
        </div>
      )}

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1E1A40] border-t border-[#3E3666] px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 rounded-xl transition-colors ${
                  isActive ? 'text-[#9B59B6]' : 'text-white/40'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
