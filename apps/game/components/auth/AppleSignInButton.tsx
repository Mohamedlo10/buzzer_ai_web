import { useState, useEffect } from 'react';
import { Platform, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { Path } from 'react-native-svg';
import { useAppleAuth } from '@xalaat/core';
import { notifyApiError } from '~/lib/ui/notify';
import { palette } from '~/lib/theme/tokens';

function AppleIcon({ size = 22, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.61-.74 1.03-1.77.91-2.8-.89.04-1.99.6-2.63 1.34-.56.64-1.05 1.69-.92 2.69 1 .08 2.03-.5 2.64-1.23z" />
    </Svg>
  );
}

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  disabled?: boolean;
  variant?: 'full' | 'icon';
}

export function AppleSignInButton({
  onSuccess,
  disabled,
  variant = 'full',
}: AppleSignInButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAvailable).catch(() => setIsAvailable(false));
    }
  }, []);

  const getIdentityToken = async (): Promise<string | null> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      return credential.identityToken || null;
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        return null;
      }
      throw e;
    }
  };

  const { signIn, isLoading } = useAppleAuth({
    getIdentityToken,
    onSuccess,
    onError: (err) => {
      notifyApiError(err, "Erreur d'authentification Apple");
    },
  });

  if (!isAvailable) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={signIn}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
        style={{
          flex: 1,
          height: 50,
          borderRadius: 14,
          backgroundColor: palette.bg,
          borderWidth: 1.5,
          borderColor: palette.line,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoading || disabled ? 0.6 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={palette.txt} />
        ) : (
          <AppleIcon size={22} color={palette.txt} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ width: '100%' }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={14}
        style={{ width: '100%', height: 50 }}
        onPress={signIn}
      />
    </View>
  );
}
