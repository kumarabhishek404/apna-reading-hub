import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { AppIcon } from '@/components/AppIcon';
import { router } from 'expo-router';
import { createPdf } from '@/api/pdfs';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { useToast } from '@/components/ToastContext';

export default function CreatePdfScreen() {
  const [title, setTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; pdfFile?: string }>({});
  const { showSuccess, showError } = useToast();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/content');
  };

  const pickPdfFile = async () => {
    console.log('[PDF Create] File picker started');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      console.log('[PDF Create] File picker result', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetCount: result.assets?.length,
      });

      if (result.canceled) {
        console.log('[PDF Create] File picker canceled by user');
        return;
      }

      const selectedFile = result.assets[0];
      console.log('[PDF Create] File selected', {
        name: selectedFile.name,
        size: selectedFile.size,
        mimeType: selectedFile.mimeType,
        uri: selectedFile.uri,
      });

      setPdfFile(selectedFile);
      // Auto-fill title if empty
      if (!title.trim()) {
        const autoTitle = selectedFile.name.replace('.pdf', '');
        console.log('[PDF Create] Auto-filling title', autoTitle);
        setTitle(autoTitle);
      }
    } catch (error) {
      console.error('[PDF Create] File picker error:', error);
      showError('Could not pick PDF file');
    }
  };

  async function submit() {
    console.log('[PDF Create] Submit started', {
      hasTitle: !!title.trim(),
      hasFile: !!pdfFile,
      title: title.trim(),
    });

    const newErrors: { title?: string; pdfFile?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'PDF title is required';
    }

    if (!pdfFile) {
      newErrors.pdfFile = 'Please select a PDF file';
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('[PDF Create] Validation failed', newErrors);
      setErrors(newErrors);
      return;
    }

    console.log('[PDF Create] Validation passed, preparing upload');
    setErrors({});
    setLoading(true);
    try {
      if (!pdfFile) {
        showError('Please select a PDF file');
        setLoading(false);
        return;
      }
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('tags', tags.join(','));
      formData.append('file', {
        uri: pdfFile.uri,
        type: 'application/pdf',
        name: pdfFile.name,
      } as any);

      console.log('[PDF Create] FormData prepared', {
        fields: ['title', 'description', 'file'],
        title: title.trim(),
        description: description.trim(),
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
      });

      await createPdf(formData);
      console.log('[PDF Create] Upload successful');
      setLoading(false);
      showSuccess('PDF uploaded successfully');
      router.back();
    } catch (error) {
      console.error('[PDF Create] API call failed', error);
      setLoading(false);
      showError('Could not upload PDF. Please try again.');
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
        
        <Pressable style={styles.filePickerButton} onPress={pickPdfFile}>
          <AppIcon name="document-outline" size={24} color="#22409a" />
          <View style={styles.filePickerContent}>
            <Text style={styles.filePickerTitle}>
              {pdfFile ? pdfFile.name : 'Select PDF File'}
            </Text>
            <Text style={styles.filePickerSubtitle}>
              {pdfFile ? 'Tap to change file' : 'Tap to browse files'}
            </Text>
          </View>
          <AppIcon name="chevron-forward" size={20} color="#94a3b8" />
        </Pressable>
        
        <Input
          label="PDF Title"
          placeholder="Enter PDF title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />
        <Input
          label="Description"
          placeholder="Enter description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        <TagSelector
          label="Tags"
          placeholder="Select tags (optional)"
          selectedTags={tags}
          onTagsChange={setTags}
        />
        <PrimaryButton title={loading ? 'Uploading...' : 'Upload PDF'} onPress={submit} disabled={loading} />
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22409a" />
          <Text style={styles.loadingText}>Uploading PDF...</Text>
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
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22409a',
    borderStyle: 'dashed',
  },
  filePickerContent: {
    flex: 1,
  },
  filePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d2f5f',
  },
  filePickerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
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