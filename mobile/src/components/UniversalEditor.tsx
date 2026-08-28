import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AppIcon } from './AppIcon';
import { colors } from '@/theme/colors';

export type ContentBlock = {
  id: string;
  type: 'text' | 'image' | 'pdf' | 'url' | 'checklist';
  content?: string | null;
  url?: string | null;
  checked?: boolean;
  order: number;
};

interface UniversalEditorProps {
  blocks: ContentBlock[];
  onChangeBlocks: (blocks: ContentBlock[]) => void;
  accentColor?: string;
}

export function UniversalEditor({ blocks, onChangeBlocks, accentColor = colors.primary }: UniversalEditorProps) {
  const [loading, setLoading] = useState(false);

  const addTextBlock = () => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type: 'text',
      content: '',
      order: blocks.length,
    };
    onChangeBlocks([...blocks, newBlock]);
  };

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
        type: 'application/pdf',
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
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const addUrlBlock = () => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type: 'url',
      content: '',
      order: blocks.length,
    };
    onChangeBlocks([...blocks, newBlock]);
  };

  const addChecklistBlock = () => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type: 'checklist',
      content: '',
      checked: false,
      order: blocks.length,
    };
    onChangeBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChangeBlocks(blocks.map(block => block.id === id ? { ...block, ...updates } : block));
  };

  const removeBlock = (id: string) => {
    onChangeBlocks(blocks.filter(block => block.id !== id));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    onChangeBlocks(newBlocks.map((block, index) => ({ ...block, order: index })));
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'text':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.blockHeader}>
              <Pressable onPress={() => removeBlock(block.id)} style={styles.deleteButton}>
                <AppIcon name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.textInput, { borderColor: accentColor }]}
              placeholder="Type here..."
              value={block.content || ''}
              onChangeText={(text) => updateBlock(block.id, { content: text })}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.textLight}
            />
          </View>
        );

      case 'image':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.blockHeader}>
              <Pressable onPress={() => removeBlock(block.id)} style={styles.deleteButton}>
                <AppIcon name="close-outline" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.imageContainer}>
              {block.url ? (
                <View style={styles.imagePlaceholder}>
                  <AppIcon name="image-outline" size={40} color={accentColor} />
                  <Text style={styles.imageText}>Image attached</Text>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" color={accentColor} />
                </View>
              )}
            </View>
          </View>
        );

      case 'pdf':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.blockHeader}>
              <Pressable onPress={() => removeBlock(block.id)} style={styles.deleteButton}>
                <AppIcon name="close-outline" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.pdfContainer}>
              <AppIcon name="document-outline" size={32} color={accentColor} />
              <Text style={styles.pdfName} numberOfLines={1}>
                {block.content || 'PDF attached'}
              </Text>
            </View>
          </View>
        );

      case 'url':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.blockHeader}>
              <Pressable onPress={() => removeBlock(block.id)} style={styles.deleteButton}>
                <AppIcon name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.urlInput, { borderColor: accentColor }]}
              placeholder="https://example.com"
              value={block.content || ''}
              onChangeText={(text) => updateBlock(block.id, { content: text })}
              keyboardType="url"
              autoCapitalize="none"
              placeholderTextColor={colors.textLight}
            />
          </View>
        );

      case 'checklist':
        return (
          <View key={block.id} style={styles.blockContainer}>
            <View style={styles.blockHeader}>
              <Pressable onPress={() => removeBlock(block.id)} style={styles.deleteButton}>
                <AppIcon name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.checklistRow}>
              <Pressable
                style={[styles.checkbox, { borderColor: accentColor, backgroundColor: block.checked ? accentColor : 'transparent' }]}
                onPress={() => updateBlock(block.id, { checked: !block.checked })}
              >
                {block.checked && <AppIcon name="checkmark-outline" size={16} color="#fff" />}
              </Pressable>
              <TextInput
                style={[styles.checklistInput, { borderColor: accentColor }]}
                placeholder="Add item..."
                value={block.content || ''}
                onChangeText={(text) => updateBlock(block.id, { content: text })}
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.blocksContainer} showsVerticalScrollIndicator={false}>
        {blocks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Start by adding content</Text>
            <Text style={styles.emptySubtext}>Use the toolbar below to add text, images, PDFs, URLs, or checklists</Text>
          </View>
        ) : (
          blocks.sort((a, b) => a.order - b.order).map((block, index) => renderBlock(block, index))
        )}
      </ScrollView>

      <View style={styles.toolbar}>
        <Pressable style={styles.toolbarButton} onPress={addTextBlock}>
          <AppIcon name="text-outline" size={24} color={accentColor} />
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={addImageBlock}>
          <AppIcon name="image-outline" size={24} color={accentColor} />
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={addPdfBlock}>
          <AppIcon name="document-outline" size={24} color={accentColor} />
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={addUrlBlock}>
          <AppIcon name="link-outline" size={24} color={accentColor} />
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={addChecklistBlock}>
          <AppIcon name="checkbox-outline" size={24} color={accentColor} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  blocksContainer: {
    flex: 1,
    gap: 12,
    maxHeight: 400,
  },
  blockContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    padding: 4,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    color: colors.text,
  },
  imageContainer: {
    borderRadius: 8,
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
    padding: 12,
    backgroundColor: colors.primaryMuted,
    borderRadius: 8,
  },
  pdfName: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  urlInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
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
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolbarButton: {
    padding: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
