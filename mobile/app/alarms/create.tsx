import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createAlarm } from '@/api/alarms';
import { PrimaryButton } from '@/components/PrimaryButton';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';

export default function CreateAlarmScreen() {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [loading, setLoading] = useState(false);

  console.log('[Alarm Create Screen] Component mounted', { loading });

  const goBack = () => {
    console.log('[Alarm Create Screen] Navigating back');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/home');
  };

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Title required');
      return;
    }
    console.log('[Alarm Create] Starting submission', { title, time });
    setLoading(true);
    try {
      console.log('[Alarm Create] Calling createAlarm API');
      const result = await createAlarm({ title, time, repeatDays: [1, 2, 3, 4, 5], isEnabled: true });
      console.log('[Alarm Create] API call successful', { result });
      
      // Clear loading state
      setLoading(false);
      console.log('[Alarm Create] Loading state cleared');
      
      // Navigate back
      router.back();
      console.log('[Alarm Create] Navigation executed');
      
      // Sync notifications in background
      syncScheduledNotificationsFromBackend().catch(console.error);
    } catch (error) {
      console.error('[Alarm Create] API call failed', error);
      setLoading(false);
      Alert.alert('Could not create alarm');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
        </View>
        <Text style={styles.title}>New Alarm</Text>
        <TextInput style={styles.input} placeholder="Alarm label" placeholderTextColor="#7b8798" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Time (HH:MM)" placeholderTextColor="#7b8798" value={time} onChangeText={setTime} />
        <PrimaryButton title={loading ? 'Saving...' : 'Create Alarm'} onPress={submit} disabled={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { flex: 1, padding: 20, gap: 14 },
  headerRow: { marginBottom: 4 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#dfe9ff',
  },
  title: { fontSize: 30, fontWeight: '800', color: '#1d2f5f', letterSpacing: -0.5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e3ebf7',
    color: '#1d2f5f',
    fontSize: 16,
  },
});
