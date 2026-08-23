import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useGoogleAuth } from '@xalaat/core';
import { useNativeGoogleAuth } from '~/native/auth/googleAuth';
import { notifyApiError } from '~/lib/ui/notify';
import { palette } from '~/lib/theme/tokens';

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </Svg>
  );
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onSuccess, disabled }: GoogleSignInButtonProps) {
  const { getIdToken } = useNativeGoogleAuth();

  const { signIn, isLoading } = useGoogleAuth({
    getIdToken,
    onSuccess,
    onError: (err) => {
      notifyApiError(err, 'Erreur de connexion Google');
    },
  });

  return (
    <TouchableOpacity
      onPress={signIn}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={{
        width: '100%',
        height: 52,
        borderRadius: 16,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.line,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        opacity: isLoading || disabled ? 0.6 : 1,
      }}
    >
      {isLoading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={{ color: palette.txt, fontWeight: '600', fontSize: 15, marginLeft: 10 }}>
            Connexion avec Google...
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <GoogleIcon size={20} />
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 15, marginLeft: 10 }}>
            Continuer avec Google
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
