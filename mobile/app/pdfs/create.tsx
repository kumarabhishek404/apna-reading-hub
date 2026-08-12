import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router } from 'expo-router';
import { createPdf } from '@/api/pdfs';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function CreatePdfScreen() {
  const [title, setTitle] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/content');
  };

  async function submit() {
    if (!title.trim() || !pdfUrl.trim()) {
      Alert.alert('Title and PDF URL required');
      return;
    }
    setLoading(true);
    try {
      await createPdf({ title, pdfUrl, description, isFavorite: false });
      setLoading(false);
      // Navigate back to content list after successful creation
      router.back();
    } catch {
      setLoading(false);
      Alert.alert('Could not create PDF');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
        </View>
        <Text style={styles.title}>New PDF</Text>
        <TextInput 
          style={styles.input} 
          placeholder="PDF title" 
          placeholderTextColor="#7b8798" 
          value={title} 
          onChangeText={setTitle} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="PDF URL" 
          placeholderTextColor="#7b8798" 
          value={pdfUrl} 
          onChangeText={setPdfUrl} 
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Description (optional)" 
          placeholderTextColor="#7b8798" 
          value={description} 
          onChangeText={setDescription} 
          multiline 
          numberOfLines={3}
        />
        <PrimaryButton title={loading ? 'Saving...' : 'Create PDF'} onPress={submit} disabled={loading} />
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22409a" />
          <Text style={styles.loadingText}>Saving PDF...</Text>
        </View>
      )}
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d2f5f',
  },
});