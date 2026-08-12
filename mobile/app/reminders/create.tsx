import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createReminder } from '@/api/reminders';
import { PrimaryButton } from '@/components/PrimaryButton';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';

export default function CreateReminderScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Title required');
      return;
    }
    setLoading(true);
    try {
      await createReminder({ title, description, dueAt, priority: 'medium', repeat: 'none' });
      await syncScheduledNotificationsFromBackend();
      Alert.alert('Reminder created');
    } catch {
      Alert.alert('Could not create reminder');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>New Reminder</Text>
        <TextInput style={styles.input} placeholder="Reminder title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
        <TextInput style={styles.input} placeholder="Due date (ISO string)" value={dueAt} onChangeText={setDueAt} />
        <PrimaryButton title={loading ? 'Saving...' : 'Create Reminder'} onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', minHeight: 48 },
});
