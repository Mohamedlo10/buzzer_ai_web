'use client';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onClick: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-cyan',
    text: 'text-dark-bg',
  },
  secondary: {
    container: 'bg-dark-card border border-dark-hover',
    text: 'text-white',
  },
  danger: {
    container: 'bg-danger',
    text: 'text-white',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-cyan',
  },
};

export function Button({
  title,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        px-6 py-4 rounded-xl flex items-center justify-center
        ${styles.container}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:opacity-80 cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <div
          className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
            variant === 'primary' ? 'border-dark-bg' : 'border-white'
          }`}
        />
      ) : (
        <span className={`font-bold text-base ${styles.text}`}>{title}</span>
      )}
    </button>
  );
}
