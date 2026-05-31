import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skinly.app',
  appName: 'SKINLY',
  webDir: 'dist',
  // Custom URL scheme for OAuth deep links (e.g. skinly://auth/callback)
  appUrlScheme: 'skinly',
  android: {
    backgroundColor: '#FFFFFF',
  },
};

export default config;
