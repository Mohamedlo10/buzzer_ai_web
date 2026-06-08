'use client';

interface SpinnerProps {
  size?: 'small' | 'large';
  text?: string;
  className?: string;
}

export function Spinner({ size = 'small', text, className = '' }: SpinnerProps) {
  const spinnerSize = size === 'large' ? 'w-10 h-10 border-4' : 'w-5 h-5 border-2';

  return (
    <div className={`flex flex-row items-center justify-center ${className}`}>
      <div
        className={`${spinnerSize} border-accent border-t-transparent rounded-full animate-spin ${text ? 'mr-2' : ''}`}
      />
      {text && <span className="text-txt-60 text-sm font-medium ml-2">{text}</span>}
    </div>
  );
}

interface FullScreenLoaderProps {
  text?: string;
}

export function FullScreenLoader({ text = 'Chargement...' }: FullScreenLoaderProps) {
  return (
    <div className="flex-1 min-h-screen bg-bg flex items-center justify-center flex-col">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-accent/20 to-buzz/20">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-txt font-semibold text-lg">{text}</p>
    </div>
  );
}
