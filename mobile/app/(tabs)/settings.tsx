import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '@/components/BrandHeader';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BrandHeader title="Settings" subtitle="Customize your reading experience" />

        <View style={styles.list}>
          <View style={styles.item}><Text style={styles.itemTitle}>Notifications</Text><Text style={styles.itemValue}>Enabled</Text></View>
          <View style={styles.item}><Text style={styles.itemTitle}>Theme</Text><Text style={styles.itemValue}>Light</Text></View>
          <View style={styles.item}><Text style={styles.itemTitle}>Data sync</Text><Text style={styles.itemValue}>Auto</Text></View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#1d2f5f', letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: '#5f6d89', marginTop: 6 },
  list: { marginTop: 20, gap: 12 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#edf1fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: { color: '#1d2f5f', fontWeight: '700', fontSize: 15 },
  itemValue: { color: '#ff8a00', fontWeight: '700', fontSize: 13 },
});
