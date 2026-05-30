import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skinly.app',
  appName: 'SKINLY',
  webDir: 'dist',
  server: {
    url: 'https://skinly-zeta.vercel.app',
    cleartext: false
  },
  plugins: {
    GoogleAuth: {
      // Web / Android OAuth client ID from Google Cloud Console
      clientId: '707382874829-ri1sldhabes6hrh60rp3m63kd3v2pp2u.apps.googleusercontent.com',
      // Scopes requested from Google
      scopes: ['profile', 'email'],
      // Return serverAuthCode so Supabase can exchange it for a session
      serverClientId: '707382874829-ri1sldhabes6hrh60rp3m63kd3v2pp2u.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
