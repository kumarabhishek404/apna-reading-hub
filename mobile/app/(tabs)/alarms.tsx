import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAlarms, toggleAlarm } from '@/api/alarms';
import { BrandHeader } from '@/components/BrandHeader';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';
import type { AlarmItem } from '@/types';

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getAlarms();
      setAlarms(data.alarms);
      setError(null);
    } catch {
      setError('Could not load alarms');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void syncScheduledNotificationsFromBackend();
  }, []);

  async function onToggle(id: string) {
    try {
      const updated = await toggleAlarm(id);
      setAlarms((current) => current.map((item) => item.id === id ? updated.alarm : item));
      await syncScheduledNotificationsFromBackend();
    } catch {
      setError('Could not update alarm');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}><BrandHeader title="Alarms" subtitle="Stay on schedule" /></View>
      {loading ? <ActivityIndicator size="large" style={{ marginTop: 24 }} /> : error ? <Text style={styles.error}>{error}</Text> : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => onToggle(item.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
              </View>
              <Text style={[styles.badge, item.isEnabled ? styles.enabled : styles.disabled]}>{item.isEnabled ? 'On' : 'Off'}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1d2f5f', letterSpacing: -0.4 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#edf1fa',
    shadowColor: '#22409a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1d2f5f' },
  cardTime: { fontSize: 13, color: '#64748b', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '700', overflow: 'hidden' },
  enabled: { backgroundColor: '#e8f7ee', color: '#0f8b52' },
  disabled: { backgroundColor: '#eef3ff', color: '#22409a' },
  error: { marginTop: 16, color: '#d14f46', paddingHorizontal: 20, fontWeight: '600' },
});
