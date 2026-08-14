import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IoniconsReadyProvider } from '@/components/IoniconsReadyContext';
import { ToastProvider } from '@/components/ToastContext';
import { SidebarProvider } from '@/components/SidebarContext';
import { initDatabase } from '@/lib/storage';
import { backgroundSync } from '@/lib/backgroundSync';
// Registers notification listeners, Stop Alarm actions, and background task.
import '@/services/notifications';
import { ensureNotificationSetup } from '@/services/notifications';

// Keep splash visible until icon fonts are ready.
// @expo/vector-icons renders an empty <Text /> until the font is loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Must match the family name used by @expo/vector-icons Ionicons ('ionicons').
    ionicons: require('../assets/fonts/ionicons.ttf'),
  });

  useEffect(() => {
    // Initialize offline services
    const initOfflineServices = async () => {
      try {
        await initDatabase();
        await backgroundSync.start();
        await ensureNotificationSetup();
        console.log('[App] Offline services initialized');
      } catch (error) {
        console.error('[App] Failed to initialize offline services', error);
      }
    };

    initOfflineServices();

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <IoniconsReadyProvider ready={!!fontsLoaded && !fontError}>
      <SafeAreaProvider>
        <SidebarProvider>
          <ToastProvider>
            <StatusBar style="auto" />
            <Stack 
              screenOptions={{ 
                headerShown: false,
              }} 
            />
          </ToastProvider>
        </SidebarProvider>
      </SafeAreaProvider>
    </IoniconsReadyProvider>
  );
}
