import React, { useId } from 'react';

export function PatternLozenge({
  color = 'var(--color-primary)',
  opacity = 0.08,
  size = 28,
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
          <path
            d={`M${size / 2} 2 L${size - 2} ${size / 2} L${size / 2} ${size - 2} L2 ${size / 2} Z`}
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
