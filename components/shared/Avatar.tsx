import React from 'react';

export function Avatar({
  name,
  hue,
  size = 36,
  ring,
}: {
  name: string;
  hue?: number;
  size?: number;
  ring?: string;
}) {
  const initials = name ? name.split(' ').map(s => s[0]).slice(0, 2).join('') : '?';
  const bg = hue !== undefined ? `oklch(0.72 0.14 ${hue})` : 'var(--color-surface-2)';
  const ink = hue !== undefined ? `oklch(0.22 0.06 ${hue})` : 'var(--color-ink)';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-pill)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color: ink,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size * 0.4,
        letterSpacing: '0.02em',
        boxShadow: ring ? `0 0 0 2px ${ring}, 0 0 0 4px ${bg}` : 'none',
        flex: '0 0 auto',
      }}
    >
      {initials}
    </div>
  );
}
