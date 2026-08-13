import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { completeReminder, deleteReminder, getReminders } from '@/api/reminders';
import { ActionMenu } from '@/components/ActionMenu';
import { AppIcon } from '@/components/AppIcon';
import { getSoundOption } from '@/constants/notificationSounds';
import { useToast } from '@/components/ToastContext';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';
import { useDataSync } from '@/lib/dataSync';
import type { ReminderItem } from '@/types';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  async function load() {
    console.log('[Reminders] Loading reminders from database');
    try {
      const data = await getReminders({ upcoming: true, includeCompleted: false });
      setReminders(data.reminders);
      setError(null);
      console.log('[Reminders] Reminders loaded successfully', { count: data.reminders.length });
    } catch {
      console.error('[Reminders] Failed to load reminders');
      setError('Could not load reminders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, []);

  useEffect(() => {
    void load();
    void syncScheduledNotificationsFromBackend();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  // Auto-sync data for database consistency
  useDataSync(load, { immediate: false, interval: 45000 });

  async function onComplete(id: string) {
    try {
      const updated = await completeReminder(id);
      setReminders((current) => current.filter((item) => item.id !== id && item.id !== updated.reminder.id));
      await syncScheduledNotificationsFromBackend();
    } catch {
      setError('Could not complete reminder');
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteReminder(id);
      setReminders((current) => current.filter((item) => item.id !== id));
      await syncScheduledNotificationsFromBackend();
      showSuccess('Reminder deleted successfully');
    } catch {
      showError('Could not delete reminder');
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22409a"
              colors={['#22409a']}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable 
                style={{ flex: 1 }} 
                onPress={() => onComplete(item.id)}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
                <Text style={styles.cardTime}>{new Date(item.dueAt).toLocaleString()}</Text>
                <Text style={styles.cardMeta}>{getSoundOption(item.sound).label}</Text>
              </Pressable>
              <View style={styles.actions}>
                <Pressable 
                  style={styles.actionButton} 
                  onPress={() => router.push(`/reminders/edit?id=${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit reminder"
                >
                  <AppIcon name="create-outline" size={18} color="#22409a" />
                </Pressable>
                <Pressable 
                  style={styles.actionButton} 
                  onPress={() => onDelete(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete reminder"
                >
                  <AppIcon name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              </View>
            </View>
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
  cardMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  error: { marginTop: 16, color: '#b91c1c', paddingHorizontal: 20 },
});
