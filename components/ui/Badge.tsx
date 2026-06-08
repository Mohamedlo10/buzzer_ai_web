'use client';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-2 text-txt',
  success: 'bg-accent/15 text-accent border border-accent/30',
  error: 'bg-buzz/15 text-buzz border border-buzz/30',
  warning: 'bg-energy/15 text-energy border border-energy/30',
  info: 'bg-accent/15 text-accent border border-accent/30',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ isOnline, className = '' }: { isOnline: boolean; className?: string }) {
  return (
    <div className={`flex flex-row items-center ${className}`}>
      <span
        className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-accent' : 'bg-surface-2'}`}
        style={isOnline ? { boxShadow: '0 0 4px 1px #00D397cc' } : {}}
      />
      <span className={`text-xs ${isOnline ? 'text-accent' : 'text-txt-40'}`}>
        {isOnline ? 'En ligne' : 'Hors ligne'}
      </span>
    </div>
  );
}
