import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router } from 'expo-router';
import { createTag, updateTag } from '@/api/tags';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useToast } from '@/components/ToastContext';
import { useLocalSearchParams } from 'expo-router';

export default function CreateTagScreen() {
  const { id, name: initialName } = useLocalSearchParams<{ id?: string; name?: string }>();
  const [name, setName] = useState(initialName || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const { showSuccess, showError } = useToast();

  const isEditing = !!id;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/tags');
  };

  async function submit() {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Tag name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      if (isEditing && id) {
        await updateTag(id, name.trim());
        showSuccess('Tag updated successfully');
      } else {
        await createTag(name.trim());
        showSuccess('Tag created successfully');
      }
      setLoading(false);
      router.back();
    } catch (error) {
      console.error('[Tag Create] API call failed', error);
      setLoading(false);
      showError(isEditing ? 'Could not update tag. Please try again.' : 'Could not create tag. Please try again.');
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
        <Text style={styles.title}>{isEditing ? 'Edit Tag' : 'New Tag'}</Text>
        <Input
          label="Tag Name"
          placeholder="Enter tag name"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
        <PrimaryButton title={loading ? 'Saving...' : isEditing ? 'Update Tag' : 'Create Tag'} onPress={submit} disabled={loading} />
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22409a" />
          <Text style={styles.loadingText}>{isEditing ? 'Updating tag...' : 'Creating tag...'}</Text>
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
