import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Notification and app preferences will live here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 8 },
});
