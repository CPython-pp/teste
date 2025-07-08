import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.vitaflow',
  appName: 'VitaFlow',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
