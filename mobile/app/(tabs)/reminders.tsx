import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { getReminders, completeReminder } from '@/api/reminders';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';
import type { ReminderItem } from '@/types';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getReminders({ upcoming: true, includeCompleted: false });
      setReminders(data.reminders);
      setError(null);
    } catch {
      setError('Could not load reminders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void syncScheduledNotificationsFromBackend();
  }, []);

  async function onComplete(id: string) {
    try {
      const updated = await completeReminder(id);
      setReminders((current) => current.filter((item) => item.id !== id && item.id !== updated.reminder.id));
      await syncScheduledNotificationsFromBackend();
    } catch {
      setError('Could not complete reminder');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <Link href="/reminders/create" asChild>
          <Pressable style={styles.createButton}><Text style={styles.createButtonText}>+ Create Reminder</Text></Pressable>
        </Link>
      </View>
      {loading ? <ActivityIndicator size="large" style={{ marginTop: 24 }} /> : error ? <Text style={styles.error}>{error}</Text> : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => onComplete(item.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
                <Text style={styles.cardTime}>{new Date(item.dueAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.badge}>{item.priority}</Text>
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
  createButton: {
    backgroundColor: '#22409a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardDescription: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  cardTime: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: 12 },
  error: { marginTop: 16, color: '#b91c1c', paddingHorizontal: 20 },
});
