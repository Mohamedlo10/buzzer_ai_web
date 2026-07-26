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

const variantStyles: Record<ButtonVariant, { container: string; text: string; spinner: string }> = {
  primary: {
    container: 'bg-accent',
    text: 'text-btn-fg',
    spinner: 'border-btn-fg',
  },
  secondary: {
    container: 'bg-surface border border-line',
    text: 'text-txt',
    spinner: 'border-txt',
  },
  danger: {
    container: 'bg-danger',
    text: 'text-white',
    spinner: 'border-white',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-accent',
    spinner: 'border-accent',
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
          className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${styles.spinner}`}
        />
      ) : (
        <span className={`font-bold text-base ${styles.text}`}>{title}</span>
      )}
    </button>
  );
}
