'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Trophy, Users, User } from 'lucide-react';

// `href` sert à l'état actif, `linkTo` à la navigation — les deux diffèrent
// pour Multijoueur, dont l'entrée porte `?join=1` : la page /rooms y voit le
// signal « ouvre le modal de code », puis nettoie l'URL (cf. RoomsPage).
const TABS = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/rooms', linkTo: '/rooms?join=1', icon: Grid, label: 'Multijoueur' },
  { href: '/rankings', icon: Trophy, label: 'Classement' },
  { href: '/friends', icon: Users, label: 'Amis' },
  { href: '/profile', icon: User, label: 'Profil' },
] satisfies ReadonlyArray<{
  href: string;
  linkTo?: string;
  icon: typeof Home;
  label: string;
}>;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around px-1.5 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] bg-header-glass backdrop-blur-md border-t border-line">
      {TABS.map(({ href, linkTo, icon: Icon, label }) => {
        const isActive =
          pathname === href ||
          pathname.startsWith(href + '/') ||
          (href === '/rooms' && pathname.startsWith('/room'));

        return (
          <Link
            key={href}
            href={linkTo ?? href}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 font-ui font-semibold text-[10.5px] transition-colors ${
              isActive ? 'text-accent' : 'text-txt-40 hover:text-txt-60'
            }`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
