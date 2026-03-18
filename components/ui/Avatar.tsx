interface AvatarProps {
  avatarUrl?: string | null;
  username: string;
  size?: number;
  borderColor?: string;
  className?: string;
}

export function Avatar({ avatarUrl, username, size = 40, borderColor, className = '' }: AvatarProps) {
  const initial = username.charAt(0).toUpperCase();
  const borderStyle = borderColor ? `2px solid ${borderColor}` : undefined;

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: borderStyle,
  };

  if (avatarUrl) {
    return (
      <div style={baseStyle} className={className}>
        <img
          src={avatarUrl}
          alt={username}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ ...baseStyle, backgroundColor: '#3E3666' }}
      className={className}
    >
      <span
        style={{ color: '#FFFFFF', fontWeight: 700, fontSize: size * 0.38, lineHeight: 1 }}
      >
        {initial}
      </span>
    </div>
  );
}
