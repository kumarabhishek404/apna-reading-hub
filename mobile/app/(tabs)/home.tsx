import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { getDashboard } from '@/api/dashboard';
import { BrandHeader } from '@/components/BrandHeader';
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <BrandHeader title="Welcome back" subtitle="Your personal reading and reminder hub" />

        <View style={styles.heroCard}>
          <View style={styles.glassOverlay} />
          <Text style={styles.heroLabel}>Overview</Text>
          <Text style={styles.heroTitle}>Your focus dashboard</Text>
          <Text style={styles.heroValue}>{stats ? (stats.totalNotes + stats.totalReminders + stats.totalLinks + stats.totalPdfs) : 0}</Text>
          <Text style={styles.heroMeta}>items in your hub</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <View style={styles.grid}>
            <View style={styles.card}><Text style={styles.cardLabel}>Notes</Text><Text style={styles.cardValue}>{stats?.totalNotes ?? 0}</Text></View>
            <View style={[styles.card, styles.cardAccent]}><Text style={styles.cardLabel}>PDFs</Text><Text style={styles.cardValue}>{stats?.totalPdfs ?? 0}</Text></View>
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
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  scrollView: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 116,
    gap: 18,
  },
  heroCard: {
    backgroundColor: '#22409a',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#22409a',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  glassOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(8px)',
  },
  heroLabel: { color: '#dfe9ff', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 8 },
  heroValue: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 12, letterSpacing: -1 },
  heroMeta: { color: '#dfe9ff', fontSize: 13, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  card: {
    width: '47%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ebf0fa',
    shadowColor: '#22409a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardAccent: { backgroundColor: '#fff7ef' },
  cardLabel: { fontSize: 13, color: '#5f6d89', fontWeight: '600' },
  cardValue: { fontSize: 26, fontWeight: '800', color: '#1d2f5f', marginTop: 8 },
  section: { marginTop: 8, gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1d2f5f', marginBottom: 4 },
  action: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dfe8f8',
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionText: { color: '#1d2f5f', fontWeight: '700', fontSize: 16 },
  error: { marginTop: 16, color: '#d14f46', fontWeight: '600' },
});
