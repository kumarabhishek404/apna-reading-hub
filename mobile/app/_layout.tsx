import 'react-native-gesture-handler';
import { useCallback, useEffect, useState } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSplash } from '@/components/AppSplash';
import { IoniconsReadyProvider } from '@/components/IoniconsReadyContext';
import { ToastProvider } from '@/components/ToastContext';
import { SidebarProvider } from '@/components/SidebarContext';
import { initDatabase } from '@/lib/storage';
import { backgroundSync } from '@/lib/backgroundSync';
import { colors } from '@/theme/colors';
// Registers notification listeners, Stop Alarm actions, and background task.
import '@/services/notifications';
import { ensureNotificationSetup } from '@/services/notifications';

LogBox.ignoreLogs([
  'Network request failed',
  '[API Client] Network failure',
]);

SplashScreen.preventAutoHideAsync().catch(() => {});
const splashApi = SplashScreen as typeof SplashScreen & {
  setOptions?: (options: { duration?: number; fade?: boolean }) => void;
};
splashApi.setOptions?.({ duration: 0, fade: false });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ionicons: require('../assets/fonts/ionicons.ttf'),
  });
  const [splashGone, setSplashGone] = useState(false);
  const [servicesReady, setServicesReady] = useState(false);
  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    const initOfflineServices = async () => {
      try {
        await initDatabase();
        await backgroundSync.start();
        await ensureNotificationSetup();
        console.log('[App] Offline services initialized');
      } catch (error) {
        console.error('[App] Failed to initialize offline services', error);
      } finally {
        setServicesReady(true);
      }
    };

    void initOfflineServices();
  }, []);

  const hideNativeSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const finishSplash = useCallback(() => {
    setSplashGone(true);
  }, []);

  if (!splashGone) {
    return (
      <View style={styles.boot}>
        <StatusBar style="dark" />
        <AppSplash ready={fontsReady && servicesReady} onPainted={hideNativeSplash} onFinished={finishSplash} />
      </View>
    );
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

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.note.background,
  },
});
