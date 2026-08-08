import React from 'react';

export function Avatar({
  name,
  avatarUrl,
  hue,
  size = 36,
  ring,
}: {
  name: string;
  avatarUrl?: string | null;
  hue?: number;
  size?: number;
  ring?: string;
}) {
  const initials = name ? name.split(' ').map(s => s[0]).slice(0, 2).join('') : '?';
  const bg = hue !== undefined ? `hsl(${hue}, 50%, 75%)` : 'var(--color-surface-2)';
  const ink = hue !== undefined ? `hsl(${hue}, 60%, 25%)` : 'var(--color-ink)';

  if (avatarUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
          flex: '0 0 auto',
          background: 'var(--color-surface-2)',
        }}
      >
        <img
          src={avatarUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color: ink,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size * 0.38,
        letterSpacing: '0.02em',
        boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
        flex: '0 0 auto',
      }}
    >
      {initials}
    </div>
  );
}
