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
  LogOut,
  Crown,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/sessions', label: 'Sessions', icon: Gamepad2 },
  { href: '/admin/rooms', label: 'Salles', icon: DoorOpen },
  { href: '/admin/questions', label: 'Questions', icon: BookOpen },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
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
  );
}
