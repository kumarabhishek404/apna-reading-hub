import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BrandHeader } from '@/components/BrandHeader';
import { clearSession, getStoredSession, type AuthSession } from '@/lib/auth';
import { backgroundSync } from '@/lib/backgroundSync';
import { useIsOnline } from '@/lib/networkMonitor';
import { getSyncStats } from '@/lib/storage';
import { AppIcon } from '@/components/AppIcon';
import { useToast } from '@/components/ToastContext';

export default function SettingsScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    totalEntities: 0,
    dirtyEntities: 0,
    pendingSyncItems: 0,
    failedSyncItems: 0,
  });
  const { showSuccess, showError } = useToast();
  const isOnline = useIsOnline();

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const stored = await getStoredSession();
      if (active) setSession(stored);
    };

    const loadSyncStats = async () => {
      const stats = await getSyncStats();
      if (active) setSyncStats(stats);
    };

    loadSession();
    loadSyncStats();

    const interval = setInterval(loadSyncStats, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const user = session?.user;
  const initials = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'A';

  const handleLogout = async () => {
    await clearSession();
    router.replace('/login' as any);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      showError('No internet connection');
      return;
    }

    setSyncing(true);
    try {
      await backgroundSync.triggerManualSync();
      const stats = await getSyncStats();
      setSyncStats(stats);
      showSuccess('Sync completed');
    } catch (error) {
      console.error('[Settings] Manual sync failed', error);
      showError('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BrandHeader title="Settings" subtitle="Customize your reading experience" />

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'Guest User'}</Text>
            <Text style={styles.profileTitle}>{user?.title || 'User'}</Text>
            <Text style={styles.profileMobile}>{user?.mobile || 'No mobile number'}</Text>
          </View>
        </View>

        <View style={styles.list}>
          <View style={styles.item}><Text style={styles.itemTitle}>Network</Text><Text style={[styles.itemValue, { color: isOnline ? '#22c55e' : '#ef4444' }]}>{isOnline ? 'Online' : 'Offline'}</Text></View>
          <View style={styles.item}><Text style={styles.itemTitle}>Pending sync</Text><Text style={styles.itemValue}>{syncStats.pendingSyncItems + syncStats.failedSyncItems}</Text></View>
          <View style={styles.item}><Text style={styles.itemTitle}>Total items</Text><Text style={styles.itemValue}>{syncStats.totalEntities}</Text></View>
        </View>

        <Pressable 
          style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]} 
          onPress={handleManualSync}
          disabled={!isOnline || syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <AppIcon name="sync-outline" size={18} color="#fff" />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { flex: 1, padding: 20 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#edf1fa',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#22409a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: '#1d2f5f', fontSize: 18, fontWeight: '800' },
  profileTitle: { color: '#5f6d89', fontSize: 14, marginTop: 3 },
  profileMobile: { color: '#ff8a00', fontSize: 14, fontWeight: '700', marginTop: 4 },
  list: { gap: 12 },
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
  syncButton: {
    backgroundColor: '#22409a',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  logoutButton: {
    backgroundColor: '#22409a',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  logoutText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
