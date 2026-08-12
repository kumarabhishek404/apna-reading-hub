import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createNote } from '@/api/notes';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/content');
  };

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Title required');
      return;
    }
    console.log('[Note Create] Starting submission', { title, content });
    setLoading(true);
    try {
      console.log('[Note Create] Calling createNote API');
      const result = await createNote({ title, content, isPinned: false, isFavorite: false });
      console.log('[Note Create] API call successful', { result });
      
      // Clear loading state
      setLoading(false);
      console.log('[Note Create] Loading state cleared');
      
      // Navigate back
      router.back();
      console.log('[Note Create] Navigation executed');
    } catch (error) {
      console.error('[Note Create] API call failed', error);
      setLoading(false);
      Alert.alert('Could not create note');
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
        <Text style={styles.title}>New Note</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Note title" 
          placeholderTextColor="#7b8798" 
          value={title} 
          onChangeText={setTitle} 
        />
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Note content" 
          placeholderTextColor="#7b8798" 
          value={content} 
          onChangeText={setContent} 
          multiline 
          numberOfLines={4}
        />
        <PrimaryButton title={loading ? 'Saving...' : 'Create Note'} onPress={submit} disabled={loading} />
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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});