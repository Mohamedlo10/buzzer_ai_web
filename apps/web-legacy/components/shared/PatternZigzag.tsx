import React, { useId } from 'react';

export function PatternZigzag({
  color = 'var(--color-secondary)',
  opacity = 0.12,
  size = 22,
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
            d={`M0 ${size * 0.7} L${size / 2} ${size * 0.3} L${size} ${size * 0.7}`}
            fill="none"
            stroke={color}
            strokeWidth="1.4"
            opacity={opacity}
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
