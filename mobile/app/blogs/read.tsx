import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { getBlogById } from '@/api/blogs';
import { ActionMenu } from '@/components/ActionMenu';
import { useToast } from '@/components/ToastContext';
import type { BlogItem } from '@/types';

export default function ReadBlogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const { showError, showSuccess } = useToast();

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
    router.replace('/(tabs)/content');
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
      color: '#22409a',
      onPress: () => router.push(`/blogs/edit?id=${id}`),
    },
    {
      label: 'Add Reminder',
      icon: 'alarm-outline',
      color: '#22409a',
      onPress: () => router.push(`/reminders/create?linkedId=${id}&linkedType=blog`),
    },
    {
      label: blog?.url ? 'Open URL' : 'No URL',
      icon: 'open-outline',
      color: blog?.url ? '#22409a' : '#94a3b8',
      onPress: () => blog?.url && openUrl(),
      disabled: !blog?.url,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22409a" />
          <Text style={styles.loadingText}>Loading blog...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!blog) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Blog not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
          <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
        </Pressable>
        <Pressable style={styles.menuButton} onPress={() => setShowMenu(true)} accessibilityRole="button" accessibilityLabel="More options">
          <AppIcon name="ellipsis-vertical" size={22} color="#1d2f5f" />
        </Pressable>
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{blog.title}</Text>
        {blog.url && (
          <Pressable style={styles.urlButton} onPress={openUrl}>
            <Text style={styles.urlButtonText}>Open Original URL</Text>
            <AppIcon name="open-outline" size={16} color="#22409a" />
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
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#dfe9ff',
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#dfe9ff',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1d2f5f',
    letterSpacing: -0.3,
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22409a',
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
    color: '#94a3b8',
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
    color: '#64748b',
  },
});
