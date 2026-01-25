import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d5ab80de5a4a4cfa8848ae7eb2dd95fb',
  appName: 'Ping Caset',
  webDir: 'dist',
  server: {
    url: 'https://d5ab80de-5a4a-4cfa-8848-ae7eb2dd95fb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    AdMob: {
      // Test Ad Unit IDs - REPLACE WITH YOUR PRODUCTION IDS BEFORE PUBLISHING
      androidApplicationId: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
      iosApplicationId: 'ca-app-pub-3940256099942544~1458002511', // Test App ID
    }
  }
};

export default config;
