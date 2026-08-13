import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { deleteAlarm, getAlarms, toggleAlarm } from '@/api/alarms';
import { ActionMenu } from '@/components/ActionMenu';
import { AppIcon } from '@/components/AppIcon';
import { BrandHeader } from '@/components/BrandHeader';
import { useToast } from '@/components/ToastContext';
import { getSoundOption } from '@/constants/notificationSounds';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';
import { useDataSync } from '@/lib/dataSync';
import type { AlarmItem } from '@/types';

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  async function load() {
    console.log('[Alarms] Loading alarms from database');
    try {
      const data = await getAlarms();
      setAlarms(data.alarms);
      setError(null);
      console.log('[Alarms] Alarms loaded successfully', { count: data.alarms.length });
    } catch {
      console.error('[Alarms] Failed to load alarms');
      setError('Could not load alarms');
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

  async function onToggle(id: string) {
    try {
      const updated = await toggleAlarm(id);
      setAlarms((current) => current.map((item) => item.id === id ? updated.alarm : item));
      await syncScheduledNotificationsFromBackend();
    } catch {
      setError('Could not update alarm');
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteAlarm(id);
      setAlarms((current) => current.filter((item) => item.id !== id));
      await syncScheduledNotificationsFromBackend();
      showSuccess('Alarm deleted successfully');
    } catch {
      showError('Could not delete alarm');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BrandHeader title="Alarms" subtitle="Stay on schedule" />
        <Link href="/alarms/create" asChild>
          <Pressable style={styles.createButton}><Text style={styles.createButtonText}>+ Create Alarm</Text></Pressable>
        </Link>
      </View>
      {loading ? <ActivityIndicator size="large" style={{ marginTop: 24 }} /> : error ? <Text style={styles.error}>{error}</Text> : (
        <FlatList
          data={alarms}
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
                onPress={() => onToggle(item.id)}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
                <Text style={styles.cardMeta}>{getSoundOption(item.sound).label}</Text>
              </Pressable>
              <View style={styles.actions}>
                <Pressable 
                  style={styles.actionButton} 
                  onPress={() => router.push(`/alarms/edit?id=${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit alarm"
                >
                  <AppIcon name="create-outline" size={18} color="#22409a" />
                </Pressable>
                <Pressable 
                  style={styles.actionButton} 
                  onPress={() => onToggle(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={item.isEnabled ? "Turn off alarm" : "Turn on alarm"}
                >
                  <AppIcon name={item.isEnabled ? "power" : "power-outline"} size={18} color="#22409a" />
                </Pressable>
                <Pressable 
                  style={styles.actionButton} 
                  onPress={() => onDelete(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete alarm"
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
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1d2f5f', letterSpacing: -0.4 },
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
  cardMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#edf1fa',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  error: { marginTop: 16, color: '#d14f46', paddingHorizontal: 20, fontWeight: '600' },
});
