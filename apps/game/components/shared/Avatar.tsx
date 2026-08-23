import React, { useState } from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { palette } from '~/lib/theme/tokens';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  hue?: number;
  size?: number;
  ring?: string;
}

export function Avatar({
  name,
  avatarUrl,
  hue,
  size = 36,
  ring,
}: AvatarProps) {
  const [loadError, setLoadError] = useState(false);
  const initials = name
    ? name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const isSvg = avatarUrl && (avatarUrl.includes('.svg') || avatarUrl.includes('dicebear'));

  const bg = hue !== undefined ? `hsl(${hue}, 50%, 75%)` : palette.surface2;
  const ink = hue !== undefined ? `hsl(${hue}, 60%, 25%)` : palette.txt;

  if (avatarUrl && !loadError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.surface2,
          borderWidth: ring ? 2 : 0,
          borderColor: ring || 'transparent',
        }}
      >
        {Platform.OS === 'web' ? (
          <Image
            source={{ uri: avatarUrl }}
            onError={() => setLoadError(true)}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : isSvg ? (
          <SvgUri
            uri={avatarUrl}
            width={size}
            height={size}
            onError={() => setLoadError(true)}
          />
        ) : (
          <Image
            source={{ uri: avatarUrl }}
            onError={() => setLoadError(true)}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderWidth: ring ? 2 : 0,
        borderColor: ring || 'transparent',
      }}
    >
      <Text
        style={{
          color: ink,
          fontWeight: '700',
          fontSize: size * 0.38,
          letterSpacing: 0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
