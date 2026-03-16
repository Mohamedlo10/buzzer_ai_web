'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '~/stores/useAuthStore';
import { useSessionStore } from '~/stores/useSessionStore';
import { tokenStorage } from '~/lib/utils/storage';

export function DebugAuth() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const { user, isAuthenticated } = useAuthStore();
  const createSession = useSessionStore(state => state.createSession);

  const checkTokens = async () => {
    const accessToken = await tokenStorage.getAccessToken();
    const refreshToken = await tokenStorage.getRefreshToken();

    let decodedToken = null;
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        decodedToken = {
          sub: payload.sub,
          exp: new Date(payload.exp * 1000).toLocaleString(),
          expired: now > payload.exp
        };
      } catch (e) {
        decodedToken = { error: 'Cannot decode token' };
      }
    }

    setTokenInfo({
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenPreview: accessToken ? `${accessToken.slice(0, 30)}...` : null,
      decoded: decodedToken
    });
  };

  const testCreateSession = async () => {
    try {
      console.log('🧪 [Debug] Testing session creation...');
      const result = await createSession({
        debtAmount: 5,
        questionsPerCategory: 5,
        maxPlayers: 20,
        isPrivate: false,
        isTeamMode: false,
        maxCategoriesPerPlayer: 3
      });
      console.log('🧪 [Debug] Result received:', result);
      window.alert(`Success! Session created: ${result.code}`);
    } catch (error) {
      console.error('🧪 [Debug] Test session creation failed:', error);
      window.alert(`Error: Failed: ${error}`);
    }
  };

  useEffect(() => {
    checkTokens();
  }, []);

  return (
    <div style={{ backgroundColor: 'red', padding: 16, margin: 16, borderRadius: 8 }}>
      <p style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>DEBUG AUTH</p>
      <p style={{ color: 'white', fontSize: 12 }}>
        User: {user ? user.username : 'None'}
      </p>
      <p style={{ color: 'white', fontSize: 12 }}>
        Authenticated: {isAuthenticated ? 'Yes' : 'No'}
      </p>
      <p style={{ color: 'white', fontSize: 12 }}>
        Has Access Token: {tokenInfo?.hasAccessToken ? 'Yes' : 'No'}
      </p>
      <p style={{ color: 'white', fontSize: 12 }}>
        Has Refresh Token: {tokenInfo?.hasRefreshToken ? 'Yes' : 'No'}
      </p>
      {tokenInfo?.decoded && (
        <>
          <p style={{ color: 'white', fontSize: 12 }}>
            Token User: {tokenInfo.decoded.sub}
          </p>
          <p style={{ color: 'white', fontSize: 12 }}>
            Token Expires: {tokenInfo.decoded.exp}
          </p>
          <p style={{ color: 'white', fontSize: 12 }}>
            Token Expired: {tokenInfo.decoded.expired ? 'YES' : 'NO'}
          </p>
        </>
      )}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <button onClick={checkTokens}>Refresh</button>
        <button onClick={testCreateSession}>Test Create</button>
      </div>
    </div>
  );
}
