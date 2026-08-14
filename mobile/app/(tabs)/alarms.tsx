import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { deleteAlarm, getAlarms, toggleAlarm } from '@/api/alarms';
import { AppIcon } from '@/components/AppIcon';
import { BrandHeader } from '@/components/BrandHeader';
import { TypeContentCard } from '@/components/TypeContentCard';
import { useToast } from '@/components/ToastContext';
import { getSoundOption } from '@/constants/notificationSounds';
import { colors } from '@/theme/colors';
import { useTabContentPaddingBottom } from '@/theme/layout';
import { getTypeTheme } from '@/theme/typeColors';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';
import { useDataSync } from '@/lib/dataSync';
import type { AlarmItem } from '@/types';

const alarmTheme = getTypeTheme('alarm');

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const tabPaddingBottom = useTabContentPaddingBottom();

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
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <BrandHeader title="Alarms" subtitle="Stay on schedule" />
        <Link href="/alarms/create" asChild>
          <Pressable style={styles.createButton}>
            <Text style={styles.createButtonText}>+ Create</Text>
          </Pressable>
        </Link>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={alarmTheme.primary} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: tabPaddingBottom }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={alarmTheme.primary}
              colors={[alarmTheme.primary]}
            />
          }
          renderItem={({ item }) => (
            <TypeContentCard
              type="alarm"
              title={item.title}
              meta={`${item.time} · ${getSoundOption(item.sound).label}`}
              showKindBadge={false}
              onPress={() => onToggle(item.id)}
              actions={
                <>
                  <Pressable 
                    style={styles.actionButton} 
                    onPress={() => router.push(`/alarms/edit?id=${item.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel="Edit alarm"
                  >
                    <AppIcon name="create-outline" size={18} color={alarmTheme.primary} />
                  </Pressable>
                  <Pressable 
                    style={styles.actionButton} 
                    onPress={() => onToggle(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={item.isEnabled ? "Turn off alarm" : "Turn on alarm"}
                  >
                    <AppIcon
                      name={item.isEnabled ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={alarmTheme.primary}
                    />
                  </Pressable>
                  <Pressable 
                    style={styles.actionButton} 
                    onPress={() => onDelete(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete alarm"
                  >
                    <AppIcon name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </>
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.alarm.background },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: alarmTheme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  error: { marginTop: 16, color: colors.error, paddingHorizontal: 20, fontWeight: '600' },
});
