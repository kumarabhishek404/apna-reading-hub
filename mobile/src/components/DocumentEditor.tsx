import { type ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AppIcon } from './AppIcon';
import { HandwritingCanvas, DRAWING_MODAL_ORIENTATIONS, HandwrittenPageImage } from './HandwritingCanvas';
import { colors } from '@/theme/colors';
import { LinkAwareTextInput } from './LinkAwareTextInput';
import { openExternalUrl } from './LinkedText';
import { isValidHttpUrl, normalizeUrl } from '@/lib/linkify';
import { resolveMediaUrl } from '@/lib/mediaUrl';

export type ContentBlock = {
  id: string;
  type: 'text' | 'image' | 'pdf' | 'url' | 'checklist' | 'handwriting' | 'video';
  content?: string | null;
  url?: string | null;
  checked?: boolean;
  order: number;
  format?: 'body' | 'heading' | 'subheading' | 'bold' | 'italic';
  color?: string;
};

interface DocumentEditorProps {
  blocks: ContentBlock[];
  onChangeBlocks: (blocks: ContentBlock[]) => void;
  accentColor?: string;
  children?: (slots: { body: ReactNode; toolbar: ReactNode }) => ReactNode;
}

export function DocumentEditor({
  blocks,
  onChangeBlocks,
  accentColor = colors.primary,
  children,
}: DocumentEditorProps) {
  const [drawing, setDrawing] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const addImageBlock = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library permission to add images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newBlock: ContentBlock = {
          id: Date.now().toString(),
          type: 'image',
          url: result.assets[0].uri,
          order: blocks.length,
        };
        onChangeBlocks([...blocks, newBlock]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const addPdfBlock = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', '*/*'],
      });

      if (result.canceled === false && result.assets[0]) {
        const newBlock: ContentBlock = {
          id: Date.now().toString(),
          type: 'pdf',
          url: result.assets[0].uri,
          content: result.assets[0].name,
          order: blocks.length,
        };
        onChangeBlocks([...blocks, newBlock]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChangeBlocks(blocks.map(block => block.id === id ? { ...block, ...updates } : block));
  };

  const removeBlock = (id: string) => {
    onChangeBlocks(blocks.filter(block => block.id !== id));
  };

  const startWriting = (text: string) => {
    onChangeBlocks([
      {
        id: Date.now().toString(),
        type: 'text',
        content: text,
        order: 0,
        format: 'body',
      },
      ...blocks.map((block) => ({ ...block, order: block.order + 1 })),
    ]);
  };

  const getTextStyle = (block: ContentBlock) => {
    const baseStyle = {
      fontSize: 17,
      lineHeight: 26,
      color: block.color || colors.text,
    };

    switch (block.format) {
      case 'heading':
        return { ...baseStyle, fontSize: 24, fontWeight: '800' as const };
      case 'subheading':
        return { ...baseStyle, fontSize: 20, fontWeight: '700' as const };
      case 'bold':
        return { ...baseStyle, fontWeight: '700' as const };
      case 'italic':
        return { ...baseStyle, fontStyle: 'italic' as const };
      default:
        return baseStyle;
    }
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <LinkAwareTextInput
              style={[styles.textInput, getTextStyle(block)]}
              placeholder="Start writing..."
              placeholderTextColor={colors.textLight}
              value={block.content || ''}
              onChangeText={(text) => updateBlock(block.id, { content: text })}
              multiline
              autoFocus={false}
            />
          </View>
        );

      case 'image':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.mediaShell}>
              <View style={styles.imageContainer}>
                {block.url ? (
                  <View style={styles.imagePlaceholder}>
                    <AppIcon name="image" size={40} color={accentColor} />
                    <Text style={styles.imageText}>Image attached</Text>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <ActivityIndicator size="small" color={accentColor} />
                  </View>
                )}
              </View>
              <Pressable style={styles.mediaDelete} onPress={() => removeBlock(block.id)} accessibilityLabel="Remove image">
                <AppIcon name="close" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>
        );

      case 'pdf':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.mediaShell}>
              <View style={styles.pdfContainer}>
                <AppIcon name="document" size={32} color={accentColor} />
                <Text style={styles.pdfName} numberOfLines={1}>
                  {block.content || 'File attached'}
                </Text>
              </View>
              <Pressable style={styles.mediaDelete} onPress={() => removeBlock(block.id)} accessibilityLabel="Remove file">
                <AppIcon name="close" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>
        );

      case 'url':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.mediaShell}>
              <LinkAwareTextInput
                style={styles.urlInput}
                placeholder="https://example.com"
                placeholderTextColor={colors.textLight}
                value={block.content || ''}
                onChangeText={(text) => updateBlock(block.id, { content: text, url: text })}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable style={styles.mediaDelete} onPress={() => removeBlock(block.id)} accessibilityLabel="Remove link">
                <AppIcon name="close" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
            {isValidHttpUrl(block.content || block.url || '') ? (
              <Pressable
                style={styles.openLinkButton}
                onPress={() => void openExternalUrl(normalizeUrl(block.content || block.url || ''))}
                accessibilityRole="link"
                accessibilityLabel="Open link"
              >
                <AppIcon name="open-outline" size={16} color={accentColor} />
                <Text style={[styles.openLinkText, { color: accentColor }]}>Open link</Text>
              </Pressable>
            ) : null}
          </View>
        );

      case 'checklist':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.checklistRow}>
              <Pressable
                style={[styles.checkbox, { borderColor: accentColor, backgroundColor: block.checked ? accentColor : 'transparent' }]}
                onPress={() => updateBlock(block.id, { checked: !block.checked })}
              >
                {block.checked && <AppIcon name="checkmark" size={16} color="#fff" />}
              </Pressable>
              <LinkAwareTextInput
                style={styles.checklistInput}
                placeholder="Add item..."
                placeholderTextColor={colors.textLight}
                value={block.content || ''}
                onChangeText={(text) => updateBlock(block.id, { content: text })}
              />
              <Pressable onPress={() => removeBlock(block.id)} hitSlop={8} accessibilityLabel="Remove item">
                <AppIcon name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>
        );

      case 'handwriting': {
        const drawingUrl = resolveMediaUrl(block.url);
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.mediaShell}>
              <View style={styles.drawingContainer}>
                {drawingUrl ? (
                  <HandwrittenPageImage uri={drawingUrl} />
                ) : (
                  <>
                    <AppIcon name="pencil-outline" size={40} color={accentColor} />
                    <Text style={styles.handwritingText}>Handwriting attached</Text>
                  </>
                )}
              </View>
              <Pressable style={styles.mediaDelete} onPress={() => removeBlock(block.id)} accessibilityLabel="Remove drawing">
                <AppIcon name="close" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>
        );
      }

      case 'video':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.mediaShell}>
              <View style={styles.videoContainer}>
                <AppIcon name="play-circle" size={40} color={accentColor} />
                <Text style={styles.videoText}>Video attached</Text>
              </View>
              <Pressable style={styles.mediaDelete} onPress={() => removeBlock(block.id)} accessibilityLabel="Remove video">
                <AppIcon name="close" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const hasTextBlock = blocks.some((block) => block.type === 'text');

  const body = (
    <View style={styles.body}>
      {!hasTextBlock ? (
        <View style={styles.blockContainer}>
          <LinkAwareTextInput
            style={styles.textInput}
            placeholder="Start writing..."
            placeholderTextColor={colors.textLight}
            value=""
            onChangeText={startWriting}
            multiline
            autoFocus={false}
          />
        </View>
      ) : null}
      {[...blocks].sort((a, b) => a.order - b.order).map((block) => renderBlock(block))}
    </View>
  );

  const toolbar = (
    <View style={styles.toolbar}>
      <Pressable style={styles.toolbarButton} onPress={addImageBlock} accessibilityLabel="Add image">
        <AppIcon name="image" size={22} color={accentColor} />
      </Pressable>
      <Pressable style={styles.toolbarButton} onPress={addPdfBlock} accessibilityLabel="Add file">
        <AppIcon name="document" size={22} color={accentColor} />
      </Pressable>
      <Pressable style={styles.toolbarButton} onPress={() => setDrawing(true)} accessibilityLabel="Write by hand">
        <AppIcon name="pencil-outline" size={22} color={accentColor} />
      </Pressable>
      <Pressable
        style={styles.toolbarButton}
        onPress={() => setFullScreen(true)}
        accessibilityLabel="Write in full screen"
      >
        <AppIcon name="expand-outline" size={22} color={accentColor} />
      </Pressable>
    </View>
  );

  const sheet = (
    <Modal
      visible={drawing}
      animationType="slide"
      presentationStyle="fullScreen"
      supportedOrientations={[...DRAWING_MODAL_ORIENTATIONS]}
      onRequestClose={() => setDrawing(false)}
    >
      <HandwritingCanvas
        onCancel={() => setDrawing(false)}
        onComplete={(uris) => {
          onChangeBlocks([
            ...blocks,
            ...uris.map((uri, index) => ({
              id: `${Date.now()}-${index}`,
              type: 'handwriting' as const,
              url: uri,
              content: uris.length > 1 ? `Handwritten note p.${index + 1}` : 'Handwritten note',
              order: blocks.length + index,
            })),
          ]);
          setDrawing(false);
        }}
      />
    </Modal>
  );

  const textBlock = blocks.find((block) => block.type === 'text');
  const writeSheet = (
    <Modal
      visible={fullScreen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setFullScreen(false)}
    >
      <SafeAreaView style={styles.fullScreenSafe}>
        <KeyboardAvoidingView style={styles.fullScreenSafe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.fullScreenHeader}>
            <Pressable
              style={styles.toolbarButton}
              onPress={() => setFullScreen(false)}
              accessibilityLabel="Exit full screen"
            >
              <AppIcon name="contract-outline" size={22} color={accentColor} />
            </Pressable>
            <Text style={styles.fullScreenTitle}>Write</Text>
            <Pressable
              style={styles.toolbarButton}
              onPress={() => setDrawing(true)}
              accessibilityLabel="Write by hand"
            >
              <AppIcon name="pencil-outline" size={22} color={accentColor} />
            </Pressable>
          </View>
          <LinkAwareTextInput
            style={styles.fullScreenInput}
            placeholder="Start writing..."
            placeholderTextColor={colors.textLight}
            value={textBlock?.content || ''}
            onChangeText={(text) => {
              if (textBlock) updateBlock(textBlock.id, { content: text });
              else startWriting(text);
            }}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  if (children) {
    return (
      <>
        {children({ body, toolbar })}
        {sheet}
        {writeSheet}
      </>
    );
  }

  return (
    <View style={styles.container}>
      {body}
      {toolbar}
      {sheet}
      {writeSheet}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  body: {
    gap: 12,
  },
  blockContainer: {
    gap: 8,
  },
  mediaShell: {
    position: 'relative',
  },
  mediaDelete: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    minHeight: 44,
    paddingVertical: 4,
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
    textAlignVertical: 'top',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageText: {
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
  },
  pdfName: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  urlInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  openLinkButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
  },
  openLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  handwritingContainer: {
    minHeight: 180,
    backgroundColor: '#FFFEFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  drawingContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFEFB',
    borderWidth: 1,
    borderColor: colors.border,
  },
  handwritingText: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  videoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
  },
  videoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenSafe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  fullScreenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  fullScreenInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    fontSize: 18,
    lineHeight: 28,
    color: colors.text,
  },
});
