import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createReminder } from '@/api/reminders';
import { PrimaryButton } from '@/components/PrimaryButton';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';

export default function CreateReminderScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);

  const goBack = () => {
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
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
        </View>
        <Text style={styles.title}>New Reminder</Text>
        <TextInput style={styles.input} placeholder="Reminder title" placeholderTextColor="#7b8798" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#7b8798" value={description} onChangeText={setDescription} multiline />
        <TextInput style={styles.input} placeholder="Due date (ISO string)" placeholderTextColor="#7b8798" value={dueAt} onChangeText={setDueAt} />
        <PrimaryButton title={loading ? 'Saving...' : 'Create Reminder'} onPress={submit} />
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
    minHeight: 48,
  },
});
