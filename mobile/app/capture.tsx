import { CaptureCanvas } from '@/components/CaptureCanvas';
import { HomeAtmosphere } from '@/components/HomeAtmosphere';
import { colors } from '@/theme/colors';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CaptureScreen() {
  return (
    <View style={styles.root}>
      <HomeAtmosphere />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <CaptureCanvas />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.note.background },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
});
