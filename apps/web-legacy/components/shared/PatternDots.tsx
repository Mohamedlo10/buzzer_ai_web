import React, { useId } from 'react';

export function PatternDots({
  color = 'var(--color-ink)',
  opacity = 0.18,
  size = 16,
}: {
  color?: string;
  opacity?: number;
  size?: number;
}) {
  const id = useId();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={size / 2} cy={size / 2} r="1" fill={color} opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
