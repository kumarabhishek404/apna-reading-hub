import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useIsOnline } from '@/lib/networkMonitor';
import { getSyncStats } from '@/lib/storage';
import { AppIcon } from './AppIcon';
import { colors } from '@/theme/colors';

export function OfflineStatus() {
  const isOnline = useIsOnline();
  const [syncStats, setSyncStats] = React.useState({
    totalEntities: 0,
    dirtyEntities: 0,
    pendingSyncItems: 0,
    failedSyncItems: 0,
  });

  React.useEffect(() => {
    const loadStats = async () => {
      const stats = await getSyncStats();
      setSyncStats(stats);
    };

    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline && syncStats.pendingSyncItems === 0 && syncStats.failedSyncItems === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBadge}>
          <AppIcon name="wifi-outline" size={14} color="#fff" />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}

      {(syncStats.pendingSyncItems > 0 || syncStats.failedSyncItems > 0) && (
        <View style={styles.syncBadge}>
          <AppIcon name="sync-outline" size={14} color="#fff" />
          <Text style={styles.syncText}>
            {syncStats.pendingSyncItems + syncStats.failedSyncItems} pending
          </Text>
        </View>
      )}
    </View>
  );
}

export function OfflineStatusCompact() {
  const isOnline = useIsOnline();
  const [syncStats, setSyncStats] = React.useState({
    totalEntities: 0,
    dirtyEntities: 0,
    pendingSyncItems: 0,
    failedSyncItems: 0,
  });

  React.useEffect(() => {
    const loadStats = async () => {
      const stats = await getSyncStats();
      setSyncStats(stats);
    };

    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline && syncStats.pendingSyncItems === 0 && syncStats.failedSyncItems === 0) {
    return null;
  }

  return (
    <View style={styles.compactContainer}>
      {!isOnline && (
        <View style={styles.compactOfflineBadge}>
          <AppIcon name="wifi-outline" size={12} color="#fff" />
        </View>
      )}

      {(syncStats.pendingSyncItems > 0 || syncStats.failedSyncItems > 0) && (
        <View style={styles.compactSyncBadge}>
          <AppIcon name="sync-outline" size={12} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  compactOfflineBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactSyncBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
