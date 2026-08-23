interface AvatarProps {
  url?: string | null;
  username?: string;
  size?: number;
}

export function Avatar({ url, username = 'U', size = 32 }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={username}
        className="rounded-full object-cover bg-surface-2"
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = username.charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full bg-host/20 text-host font-bold flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  );
}
