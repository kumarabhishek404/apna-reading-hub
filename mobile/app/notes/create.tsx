import { useState } from 'react';
import { router } from 'expo-router';
import { createNote } from '@/api/notes';
import { Input } from '@/components/Input';
import { OfflineStatusCompact } from '@/components/OfflineStatus';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { noteRepository } from '@/lib/offlineRepositories/noteOfflineRepository';
import { runOnlineOrLocal } from '@/lib/offlineSave';
import { getTypeTheme } from '@/theme/typeColors';

const TYPE = 'note' as const;
const theme = getTypeTheme(TYPE);

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const { showSuccess, showError, showInfo } = useToast();

  async function submit() {
    const newErrors: { title?: string } = {};
    if (!title.trim()) newErrors.title = 'Note title is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { savedLocally } = await runOnlineOrLocal(
        () => createNote({ title, content, tags, isPinned: false, isFavorite: false }),
        () =>
          noteRepository.createNote({
            title,
            content,
            tags: tags.map((t) => ({ id: t, name: t })),
            isPinned: false,
            isFavorite: false,
          }),
      );
      setLoading(false);
      if (savedLocally) {
        showInfo('Note saved locally. Will sync when online.');
      } else {
        showSuccess('Note created successfully');
      }
      router.back();
    } catch (error) {
      console.warn('[Note Create] Failed', error);
      setLoading(false);
      showError('Could not create note. Please try again.');
    }
  }

  return (
    <TypeThemedScreen type={TYPE} title="New Note" headerRight={<OfflineStatusCompact />}>
      <Input
        label="Note Title"
        placeholder="Enter note title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        accentColor={theme.primary}
      />
      <Input
        label="Content"
        placeholder="Enter note content (optional)"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        accentColor={theme.primary}
      />
      <TagSelector
        label="Tags"
        placeholder="Select tags (optional)"
        selectedTags={tags}
        onTagsChange={setTags}
        accentColor={theme.primary}
      />
      <PrimaryButton
        title={loading ? 'Saving...' : 'Create Note'}
        onPress={submit}
        disabled={loading}
        color={theme.primary}
      />
    </TypeThemedScreen>
  );
}
