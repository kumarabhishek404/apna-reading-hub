import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IoniconsReadyProvider } from '@/components/IoniconsReadyContext';
import { ToastProvider } from '@/components/ToastContext';
import { screenTransitions } from '@/lib/transitions';

// Keep splash visible until icon fonts are ready.
// @expo/vector-icons renders an empty <Text /> until the font is loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Must match the family name used by @expo/vector-icons Ionicons ('ionicons').
    ionicons: require('../assets/fonts/ionicons.ttf'),
  });

  useEffect(() => {
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
        <ToastProvider>
          <StatusBar style="auto" />
          <Stack 
            screenOptions={{ 
              headerShown: false,
              ...screenTransitions
            }} 
          />
        </ToastProvider>
      </SafeAreaProvider>
    </IoniconsReadyProvider>
  );
}
