import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { createTag, updateTag } from '@/api/tags';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useToast } from '@/components/ToastContext';
import { colors } from '@/theme/colors';

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
      showError(
        isEditing
          ? 'Could not update tag. Please try again.'
          : 'Could not create tag. Please try again.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Tag</Text>
        </View>

        <Text style={styles.title}>{isEditing ? 'Edit tag' : 'New tag'}</Text>
        <Text style={styles.subtitle}>
          Use short labels so you can filter library items later.
        </Text>

        <Input
          label="Tag name"
          placeholder="e.g. work, ideas, research"
          value={name}
          onChangeText={setName}
          error={errors.name}
          accentColor={colors.primary}
        />

        <PrimaryButton
          title={loading ? 'Saving…' : isEditing ? 'Update tag' : 'Create tag'}
          onPress={submit}
          disabled={loading}
          color={colors.primary}
        />
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {isEditing ? 'Updating tag…' : 'Creating tag…'}
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.note.background },
  container: { flex: 1, padding: 20, gap: 14 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryMuted,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: -6,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
