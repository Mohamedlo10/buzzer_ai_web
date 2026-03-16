'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  isPassword?: boolean;
  className?: string;
  onChangeText?: (value: string) => void;
}

export function Input({
  label,
  error,
  isPassword = false,
  className = '',
  onChangeText,
  onChange,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChangeText) onChangeText(e.target.value);
    if (onChange) onChange(e);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-white/80 text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          type={isPassword && !showPassword ? 'password' : (props.type ?? 'text')}
          onChange={handleChange}
          autoCapitalize="none"
          className={`
            w-full px-4 py-3.5 rounded-xl
            bg-dark-card text-white text-base
            border ${error ? 'border-danger' : 'border-dark-hover'}
            placeholder:text-[hsl(215,25%,45%)]
            outline-none focus:border-[#00D397] transition-colors
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-0 bottom-0 flex items-center justify-center text-[hsl(215,25%,55%)] hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-danger text-sm mt-1.5">{error}</p>
      )}
    </div>
  );
}
