import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAlarms, toggleAlarm } from '@/api/alarms';
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
      <View style={styles.header}><Text style={styles.title}>Alarms</Text></View>
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
  safeArea: { flex: 1, backgroundColor: '#f5f7ff' },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardTime: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  enabled: { backgroundColor: '#dcfce7', color: '#166534' },
  disabled: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  error: { marginTop: 16, color: '#b91c1c', paddingHorizontal: 20 },
});
