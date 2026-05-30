'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Bell, User } from 'lucide-react';
import Link from 'next/link';

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'admin') return [];
  const crumbs = [{ label: 'Admin', href: '/admin' }];
  const labels: Record<string, string> = {
    users: 'Utilisateurs',
    sessions: 'Sessions',
    rooms: 'Salles',
    questions: 'Questions',
    'audit-logs': 'Audit Logs',
    settings: 'Paramètres',
  };
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (labels[seg]) {
      crumbs.push({ label: labels[seg], href: '/' + segments.slice(0, i + 1).join('/') });
    } else if (seg.length > 3) {
      crumbs.push({ label: seg.substring(0, 8) + '...', href: '/' + segments.slice(0, i + 1).join('/') });
    }
  }
  return crumbs;
}

export function AdminHeader() {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-[#1E1A40] border-b border-[#3E3666]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} color="#FFFFFF40" />}
            <Link
              href={crumb.href}
              className={`${i === crumbs.length - 1 ? 'text-white font-semibold' : 'text-white/50 hover:text-white'} transition-colors`}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="relative text-white/50 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#9B59B6] flex items-center justify-center">
          <User size={16} color="white" />
        </div>
      </div>
    </header>
  );
}
