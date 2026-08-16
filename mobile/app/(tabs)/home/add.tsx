import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { TimePicker } from '@/components/TimePicker';
import { DatePicker } from '@/components/DatePicker';
import { useToast } from '@/components/ToastContext';
import { createNote } from '@/api/notes';
import { createLink } from '@/api/links';
import { createBlog } from '@/api/blogs';
import { createReminder } from '@/api/reminders';
import { DEFAULT_NOTIFICATION_SOUND, type NotificationSoundId } from '@/constants/notificationSounds';
import { colors } from '@/theme/colors';

type ContentType = 'note' | 'link' | 'blog' | 'pdf' | 'reminder';

export default function UniversalAddScreen() {
  const [content, setContent] = useState('');
  const [detectedType, setDetectedType] = useState<ContentType>('note');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [sound, setSound] = useState<NotificationSoundId>(DEFAULT_NOTIFICATION_SOUND);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ content?: string; url?: string }>({});
  const { showSuccess, showError } = useToast();

  // Auto-detect content type
  const detectContentType = (text: string): ContentType => {
    if (text.match(/^https?:\/\/[^\s]+$/i)) {
      return 'link';
    }
    if (text.match(/meeting|call|remind|tomorrow|today|schedule/i)) {
      return 'reminder';
    }
    if (text.match(/article|blog|post|read/i)) {
      return 'blog';
    }
    if (text.match(/pdf|document|file/i)) {
      return 'pdf';
    }
    return 'note';
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    const type = detectContentType(text);
    setDetectedType(type);
    
    // Auto-extract URL if present
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      setUrl(urlMatch[1]);
    }
    
    // Auto-generate title from first line
    const lines = text.split('\n');
    if (lines.length > 0 && lines[0].trim()) {
      setTitle(lines[0].trim().substring(0, 50));
    }
  };

  async function save() {
    const newErrors: { content?: string; url?: string } = {};
    
    if (!content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (detectedType === 'link' && !url.trim()) {
      newErrors.url = 'URL is required for links';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      switch (detectedType) {
        case 'note':
          await createNote({
            title: title || 'Untitled Note',
            content,
            tags,
          });
          showSuccess('Note saved');
          break;
        case 'link':
          await createLink({
            title: title || 'Untitled Link',
            url,
            description: content,
            tags,
            isFavorite: false,
          });
          showSuccess('Link saved');
          break;
        case 'blog':
          await createBlog({
            title: title || 'Untitled Blog',
            url,
            content,
            tags,
          });
          showSuccess('Blog saved');
          break;
        case 'pdf':
          showError('PDF upload requires file selection. Please use the PDF upload option.');
          break;
        case 'reminder':
          const dueAt = new Date();
          if (reminderDate && reminderTime) {
            const [year, month, day] = reminderDate.split('-').map(Number);
            const [hour, minute] = reminderTime.split(':').map(Number);
            dueAt.setFullYear(year, month - 1, day);
            dueAt.setHours(hour, minute, 0);
          }
          await createReminder({
            title: title || 'Untitled Reminder',
            description: content,
            dueAt: dueAt.toISOString(),
            priority: 'medium',
            repeat: 'none',
            sound,
          });
          showSuccess('Reminder saved');
          break;
      }
      setLoading(false);
      router.back();
    } catch (error) {
      console.error('[Universal Add] Failed to save:', error);
      setLoading(false);
      showError('Could not save. Please try again.');
    }
  }

  const getTypeDisplay = () => {
    const types = {
      note: '📝 Note',
      link: '🔗 Link',
      blog: '📰 Blog',
      pdf: '📄 PDF',
      reminder: '🔔 Reminder',
    };
    return types[detectedType];
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Add</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>Detected as: {getTypeDisplay()}</Text>
          </View>

          <Input
            label="What do you want to save?"
            placeholder="Type anything here... NoName will understand it"
            value={content}
            onChangeText={handleContentChange}
            error={errors.content}
            multiline
            numberOfLines={6}
            accentColor={colors.primary}
          />

          {detectedType === 'link' && (
            <Input
              label="URL"
              placeholder="https://example.com"
              value={url}
              onChangeText={setUrl}
              error={errors.url}
              autoCapitalize="none"
              keyboardType="url"
              accentColor={colors.link.primary}
            />
          )}

          <Input
            label="Title (optional)"
            placeholder="Auto-generated from content"
            value={title}
            onChangeText={setTitle}
            accentColor={colors.primary}
          />

          <TagSelector
            label="Tags (optional)"
            placeholder="Select tags"
            selectedTags={tags}
            onTagsChange={setTags}
            accentColor={colors.primary}
          />

          {detectedType === 'reminder' && (
            <>
              <DatePicker
                value={reminderDate}
                onChange={setReminderDate}
                label="Date (optional)"
                accentColor={colors.reminder.primary}
              />
              <TimePicker
                value={reminderTime}
                onChange={setReminderTime}
                label="Time (optional)"
                accentColor={colors.reminder.primary}
              />
            </>
          )}

          <View style={styles.hintBox}>
            <AppIcon name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.hintText}>
              NoName automatically detects the type of content you're adding. You can change the type manually from the dropdown if needed.
            </Text>
          </View>

          <PrimaryButton
            title={loading ? 'Saving...' : 'Save'}
            onPress={save}
            disabled={loading}
            color={colors.primary}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardAvoid: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primaryMuted,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 18,
  },
});
