'use client';

interface SafeScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function SafeScreen({ children, className = '', ...props }: SafeScreenProps) {
  return (
    <div
      className={`min-h-screen bg-dark-bg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
