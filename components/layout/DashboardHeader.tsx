'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '~/stores/useAuthStore';
import { useTheme } from '~/components/providers/ThemeProvider';
import { Bell, User, Sun, Moon, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  notificationCount?: number;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

function RoundIconButton({
  onClick,
  ariaLabel,
  title,
  children,
}: {
  onClick?: () => void;
  ariaLabel: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className="relative w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-txt hover:bg-surface-2 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

export function DashboardHeader({
  notificationCount = 0,
  onNotificationPress,
  onProfilePress,
}: DashboardHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-row items-center justify-between px-4 pb-3 pt-5 bg-header-glass backdrop-blur-md border-b border-line">
      {/* Logo & Wordmark */}
      <div className="flex flex-row items-center">
        <div
          className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #D5442F, #FF6B4A)' }}
        >
          <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
        </div>
        <div>
          <p className="text-txt font-display font-semibold text-lg leading-tight">Quiz</p>
          <p className="text-accent text-[10px] font-bold uppercase tracking-[0.18em]">By Mouha_Dev</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-row items-center gap-2">
        {/* Theme toggle — adaptabilité (B&S) */}
        <RoundIconButton
          onClick={toggleTheme}
          ariaLabel={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </RoundIconButton>

        {/* Notification Bell */}
        <RoundIconButton
          onClick={onNotificationPress ?? (() => router.push('/notifications'))}
          ariaLabel="Notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-buzz rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold leading-none">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            </span>
          )}
        </RoundIconButton>

        {/* Profile */}
        <button
          onClick={onProfilePress ?? (() => router.push('/profile'))}
          aria-label="Mon profil"
          className="relative w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center overflow-hidden hover:border-accent transition-colors cursor-pointer"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={18} className="text-txt" />
          )}
          {user && (!user.email || !user.emailVerified) && (
            <span className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] bg-buzz rounded-full border-2 border-bg" />
          )}
        </button>
      </div>
    </div>
  );
}

export function WelcomeSection() {
  const user = useAuthStore((state) => state.user);
  const username = user?.username || 'Joueur';
  const hour = new Date().getHours();

  let greeting = 'Bonjour';
  if (hour >= 12 && hour < 18) greeting = 'Bon après-midi';
  else if (hour >= 18) greeting = 'Bonsoir';

  return (
    <div className="px-4 py-4">
      <p className="text-txt-60 text-sm font-semibold mb-1">{greeting},</p>
      <p className="text-txt font-display font-semibold text-[26px] leading-tight tracking-[-0.01em]">{username} 👋</p>
    </div>
  );
}
