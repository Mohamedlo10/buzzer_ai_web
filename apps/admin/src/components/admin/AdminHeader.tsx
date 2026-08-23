import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Bell, User } from 'lucide-react';

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Admin', href: '/' }];
  const labels: Record<string, string> = {
    users: 'Utilisateurs',
    sessions: 'Sessions',
    rooms: 'Salles',
    questions: 'Questions',
    'audit-logs': 'Audit Logs',
    settings: 'Paramètres',
  };
  for (let i = 0; i < segments.length; i++) {
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
  const { pathname } = useLocation();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-bg-deep border-b border-line flex-shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} color="var(--txt-40)" />}
            <Link
              to={crumb.href}
              className={`${i === crumbs.length - 1 ? 'text-txt font-semibold font-display' : 'text-txt-60 hover:text-txt'} transition-colors`}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="relative text-txt-60 hover:text-txt transition-colors cursor-pointer">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-bad rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-host flex items-center justify-center">
          <User size={16} color="var(--primary-ink)" />
        </div>
      </div>
    </header>
  );
}
