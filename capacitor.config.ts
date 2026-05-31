import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skinly.app',
  appName: 'SKINLY',
  webDir: 'dist',
  server: {
    url: 'https://skinly-zeta.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  // Custom URL scheme for OAuth deep links (e.g. skinly://auth/callback)
  appUrlScheme: 'skinly',
};

export default config;
