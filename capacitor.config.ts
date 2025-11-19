import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fittrack.app',
  appName: 'FitTrack',
  webDir: 'dist',
  server: {
    // Pour Android, ne pas utiliser cleartext (HTTP)
    androidScheme: 'https',
    // Autoriser les connexions externes
    allowNavigation: ['https://apimuscu.chocot.be']
  }
};

export default config;
