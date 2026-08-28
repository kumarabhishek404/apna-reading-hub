import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { AppIcon } from '@/components/AppIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { getPdfById } from '@/api/pdfs';
import { ActionMenu } from '@/components/ActionMenu';
import { API_BASE_URL } from '@/config/env';
import { useToast } from '@/components/ToastContext';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';
import type { PdfItem } from '@/types';

const theme = getTypeTheme('pdf');

export default function ViewPdfScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pdf, setPdf] = useState<PdfItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [viewerFailed, setViewerFailed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    async function loadPdf() {
      if (!id) return;
      try {
        const data = await getPdfById(id);
        setPdf(data.pdf);

        const pdfUrl = (data.pdf as any).url || (data.pdf as any).pdfUrl;
        if (pdfUrl && pdfUrl.startsWith('http')) {
          setPdfUri(pdfUrl);
        } else if (pdfUrl) {
          setPdfUri(`${API_BASE_URL}${pdfUrl}`);
        }
      } catch {
        showError('Could not load PDF');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadPdf();
  }, [id]);

  const viewerUri = useMemo(() => {
    if (!pdfUri) return null;
    return pdfUri;
  }, [pdfUri]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/notes');
  };

  const openPdf = async () => {
    if (pdfUri) {
      await Linking.openURL(pdfUri);
    }
  };

  const getActions = () => [
    {
      label: 'Edit',
      icon: 'create-outline' as const,
      color: theme.primary,
      onPress: () => router.push(`/pdfs/edit?id=${id}`),
    },
    {
      label: 'Add Reminder',
      icon: 'alarm-outline' as const,
      color: theme.primary,
      onPress: () => router.push(`/reminders/create?linkedId=${id}&linkedType=pdf`),
    },
    {
      label: 'Open in Browser',
      icon: 'open-outline' as const,
      color: theme.primary,
      onPress: () => openPdf(),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pdf) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>PDF not found</Text>
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
        <Text style={[styles.headerTitle, { color: theme.dark }]} numberOfLines={1}>
          {pdf.title}
        </Text>
        <Pressable
          style={[styles.iconButton, { backgroundColor: theme.muted, borderColor: theme.soft }]}
          onPress={() => setShowMenu(true)}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <AppIcon name="ellipsis-vertical" size={22} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.pdfContainer}>
        {viewerUri && !viewerFailed ? (
          <WebView
            source={{ uri: viewerUri }}
            style={styles.pdf}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            )}
            onHttpError={() => {
              setViewerFailed(true);
              showError('Could not load PDF in-app. Use Open in Browser.');
            }}
            onError={() => {
              setViewerFailed(true);
              showError('Could not load PDF in-app. Use Open in Browser.');
            }}
            allowsFullscreenVideo={false}
            setSupportMultipleWindows={false}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <AppIcon name="document-outline" size={48} color={colors.textMuted} />
            <Text style={styles.fallbackText}>
              {pdfUri ? 'In-app preview unavailable' : 'PDF URL not available'}
            </Text>
            {pdfUri ? (
              <Pressable style={[styles.fallbackButton, { backgroundColor: theme.primary }]} onPress={openPdf}>
                <Text style={styles.fallbackButtonText}>Open in Browser</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <ActionMenu visible={showMenu} onClose={() => setShowMenu(false)} actions={getActions()} />
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
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdf: {
    flex: 1,
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  fallbackText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  fallbackButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  fallbackButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
