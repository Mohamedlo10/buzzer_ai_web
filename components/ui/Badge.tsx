'use client';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#3E3666] text-white',
  success: 'bg-[#00D39720] text-[#00D397] border border-[#00D39740]',
  error: 'bg-[#D5442F20] text-[#D5442F] border border-[#D5442F40]',
  warning: 'bg-[#FFD70020] text-[#FFD700] border border-[#FFD70040]',
  info: 'bg-[#00D39720] text-[#00D397] border border-[#00D39740]',
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
        className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-[#00D397]' : 'bg-[#3E3666]'}`}
        style={isOnline ? { boxShadow: '0 0 4px 1px #00D397cc' } : {}}
      />
      <span className={`text-xs ${isOnline ? 'text-[#00D397]' : 'text-white/50'}`}>
        {isOnline ? 'En ligne' : 'Hors ligne'}
      </span>
    </div>
  );
}
