import React from 'react';

export function XalaatMark({
  size = 36,
  color = 'var(--color-primary-ink)',
  accent = 'var(--color-accent)',
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" style={{ display: 'block' }}>
      <path d="M18 2 L34 18 L18 34 L2 18 Z" fill={color} />
      <path d="M18 8 L28 18 L18 28 L8 18 Z" fill={accent} opacity="0.85" />
      <circle cx="18" cy="18" r="3" fill={color} />
    </svg>
  );
}
