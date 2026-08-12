import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createAlarm } from '@/api/alarms';
import { PrimaryButton } from '@/components/PrimaryButton';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';

export default function CreateAlarmScreen() {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Title required');
      return;
    }
    setLoading(true);
    try {
      await createAlarm({ title, time, repeatDays: [1, 2, 3, 4, 5], isEnabled: true });
      await syncScheduledNotificationsFromBackend();
      Alert.alert('Alarm created');
    } catch {
      Alert.alert('Could not create alarm');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>New Alarm</Text>
        <TextInput style={styles.input} placeholder="Alarm label" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Time (HH:MM)" value={time} onChangeText={setTime} />
        <PrimaryButton title={loading ? 'Saving...' : 'Create Alarm'} onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
});
