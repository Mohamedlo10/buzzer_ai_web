// Debug script pour tester l'authentification
const { tokenStorage } = require('./lib/utils/storage');

async function checkAuth() {
  try {
    console.log('=== Debug Authentication ===');
    
    const accessToken = await tokenStorage.getAccessToken();
    console.log('Access token:', accessToken ? `${accessToken.slice(0, 20)}...` : 'None');
    
    const refreshToken = await tokenStorage.getRefreshToken();
    console.log('Refresh token:', refreshToken ? `${refreshToken.slice(0, 20)}...` : 'None');
    
    if (accessToken) {
      // Decode JWT to check expiration (simplified)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        console.log('Token expires:', new Date(payload.exp * 1000));
        console.log('Token expired:', now > payload.exp);
        console.log('User in token:', payload.sub);
      } catch (e) {
        console.log('Could not decode token:', e.message);
      }
    }
    
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}

checkAuth();