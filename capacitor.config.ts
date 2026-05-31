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
};

export default config;
