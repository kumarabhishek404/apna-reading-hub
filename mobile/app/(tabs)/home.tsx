import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { getDashboard } from '@/api/dashboard';
import type { DashboardStats } from '@/types';

export default function HomeScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDashboard();
        setStats(data.stats);
      } catch (e) {
        setError('Could not load dashboard');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Apna Sathi</Text>
        <Text style={styles.subtitle}>Your personal reading and reminder hub</Text>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <View style={styles.grid}>
            <View style={styles.card}><Text style={styles.cardLabel}>Notes</Text><Text style={styles.cardValue}>{stats?.totalNotes ?? 0}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>PDFs</Text><Text style={styles.cardValue}>{stats?.totalPdfs ?? 0}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Links</Text><Text style={styles.cardValue}>{stats?.totalLinks ?? 0}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Reminders</Text><Text style={styles.cardValue}>{stats?.totalReminders ?? 0}</Text></View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <Link href="/alarms/create" asChild>
            <Pressable style={styles.action}><Text style={styles.actionText}>Create Alarm</Text></Pressable>
          </Link>
          <Link href="/reminders/create" asChild>
            <Pressable style={styles.action}><Text style={styles.actionText}>Create Reminder</Text></Pressable>
          </Link>
          <Link href="/content" asChild>
            <Pressable style={styles.action}><Text style={styles.actionText}>Open Library</Text></Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  card: { width: '47%', backgroundColor: '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  cardLabel: { fontSize: 13, color: '#6b7280' },
  cardValue: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 8 },
  section: { marginTop: 8, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  action: { backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  actionText: { color: '#111827', fontWeight: '600' },
  error: { marginTop: 16, color: '#b91c1c' },
});
