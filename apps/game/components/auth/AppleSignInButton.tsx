import { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAppleAuth } from '@xalaat/core';
import { notifyApiError } from '~/lib/ui/notify';

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  disabled?: boolean;
}

export function AppleSignInButton({ onSuccess, disabled }: AppleSignInButtonProps) {
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

  return (
    <View className="w-full mt-3">
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={16}
        style={{ width: '100%', height: 48 }}
        onPress={signIn}
      />
    </View>
  );
}
