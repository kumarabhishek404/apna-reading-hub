import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { AppIcon } from '@/components/AppIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { getPdfById } from '@/api/pdfs';
import { ActionMenu } from '@/components/ActionMenu';
import { API_BASE_URL } from '@/config/env';
import { useToast } from '@/components/ToastContext';
import type { PdfItem } from '@/types';

export default function ViewPdfScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pdf, setPdf] = useState<PdfItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    async function loadPdf() {
      if (!id) return;
      try {
        const data = await getPdfById(id);
        setPdf(data.pdf);
        
        // Set up PDF URI for in-app viewing
        if (data.pdf.pdfUrl.startsWith('http')) {
          setPdfUri(data.pdfUrl);
        } else {
          setPdfUri(`${API_BASE_URL}${data.pdf.pdfUrl}`);
        }
      } catch (error) {
        showError('Could not load PDF');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadPdf();
  }, [id]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/content');
  };

  const openPdf = async () => {
    if (pdfUri) {
      await Linking.openURL(pdfUri);
    }
  };

  const getActions = () => [
    {
      label: 'Edit',
      icon: 'create-outline',
      color: '#22409a',
      onPress: () => router.push(`/pdfs/edit?id=${id}`),
    },
    {
      label: 'Add Reminder',
      icon: 'alarm-outline',
      color: '#22409a',
      onPress: () => router.push(`/reminders/create?linkedId=${id}&linkedType=pdf`),
    },
    {
      label: 'Open in Browser',
      icon: 'open-outline',
      color: '#22409a',
      onPress: () => openPdf(),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22409a" />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pdf) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>PDF not found</Text>
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
      
      <View style={styles.pdfContainer}>
        {pdfUri ? (
          <Pdf
            source={{ uri: pdfUri }}
            style={styles.pdf}
            trustAllCerts={false}
            onLoadComplete={(numberOfPages) => {
              console.log(`[PDF] Loaded ${numberOfPages} pages`);
            }}
            onError={(error) => {
              console.error('[PDF] Load error:', error);
              showError('Could not load PDF. Opening in browser instead.');
              openPdf();
            }}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <AppIcon name="document-outline" size={48} color="#94a3b8" />
            <Text style={styles.fallbackText}>PDF URL not available</Text>
            <Pressable style={styles.fallbackButton} onPress={openPdf}>
              <Text style={styles.fallbackButtonText}>Open in Browser</Text>
            </Pressable>
          </View>
        )}
      </View>

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
  pdfContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdf: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  fallbackText: {
    fontSize: 16,
    color: '#64748b',
  },
  fallbackButton: {
    backgroundColor: '#22409a',
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
    color: '#64748b',
  },
});
