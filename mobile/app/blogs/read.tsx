import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { getBlogById } from '@/api/blogs';
import { ActionMenu } from '@/components/ActionMenu';
import { useToast } from '@/components/ToastContext';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';
import type { BlogItem } from '@/types';

const theme = getTypeTheme('blog');

export default function ReadBlogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    async function loadBlog() {
      if (!id) return;
      try {
        const data = await getBlogById(id);
        setBlog(data.blog);
      } catch (error) {
        showError('Could not load blog');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadBlog();
  }, [id]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/notes');
  };

  const openUrl = async () => {
    if (blog?.url) {
      const url = blog.url.startsWith('http') ? blog.url : `https://${blog.url}`;
      await Linking.openURL(url);
    }
  };

  const getActions = () => [
    {
      label: 'Edit',
      icon: 'create-outline',
      color: theme.primary,
      onPress: () => router.push(`/blogs/edit?id=${id}`),
    },
    {
      label: 'Add Reminder',
      icon: 'alarm-outline',
      color: theme.primary,
      onPress: () => router.push(`/reminders/create?linkedId=${id}&linkedType=blog`),
    },
    {
      label: blog?.url ? 'Open URL' : 'No URL',
      icon: 'open-outline',
      color: blog?.url ? theme.primary : colors.textMuted,
      onPress: () => blog?.url && openUrl(),
      disabled: !blog?.url,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading blog...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!blog) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Blog not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.iconButton, { backgroundColor: theme.muted, borderColor: theme.soft }]}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="chevron-back" size={22} color={theme.primary} />
        </Pressable>
        <Pressable
          style={[styles.iconButton, { backgroundColor: theme.muted, borderColor: theme.soft }]}
          onPress={() => setShowMenu(true)}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <AppIcon name="ellipsis-vertical" size={22} color={theme.primary} />
        </Pressable>
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.dark }]}>{blog.title}</Text>
        {blog.url && (
          <Pressable style={[styles.urlButton, { backgroundColor: theme.primary }]} onPress={openUrl}>
            <Text style={styles.urlButtonText}>Open Original URL</Text>
            <AppIcon name="open-outline" size={16} color={theme.onPrimary} />
          </Pressable>
        )}
        <Text style={styles.content}>{blog.content || 'No content available.'}</Text>
        <Text style={styles.meta}>
          Created: {new Date(blog.createdAt).toLocaleDateString()}
        </Text>
      </ScrollView>

      <ActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        actions={getActions()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  urlButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
