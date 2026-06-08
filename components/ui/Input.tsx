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
        <label className="block text-txt-60 text-sm font-medium mb-2">
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
            bg-surface text-txt text-base
            border ${error ? 'border-danger' : 'border-line'}
            placeholder:text-txt-40
            outline-none focus:border-accent transition-colors
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-0 bottom-0 flex items-center justify-center text-txt-40 hover:text-txt transition-colors"
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
