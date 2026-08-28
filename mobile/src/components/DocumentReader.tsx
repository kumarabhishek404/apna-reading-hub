import { ScrollView, StyleSheet, Text, View, Pressable, Linking, Image } from 'react-native';
import { AppIcon } from './AppIcon';
import { HandwrittenPageImage } from './HandwritingCanvas';
import { colors } from '@/theme/colors';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { LinkedText, openExternalUrl } from './LinkedText';
import { normalizeUrl } from '@/lib/linkify';

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

interface DocumentReaderProps {
  title: string;
  blocks: ContentBlock[];
  accentColor?: string;
}

export function DocumentReader({ title, blocks, accentColor = colors.primary }: DocumentReaderProps) {
  const getTextStyle = (block: ContentBlock) => {
    const baseStyle = {
      fontSize: 16,
      color: block.color || colors.text,
      lineHeight: 24,
    };

    switch (block.format) {
      case 'heading':
        return { ...baseStyle, fontSize: 28, fontWeight: '800' as const, lineHeight: 36 };
      case 'subheading':
        return { ...baseStyle, fontSize: 22, fontWeight: '700' as const, lineHeight: 30 };
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
          <LinkedText
            key={block.id}
            text={block.content || ''}
            style={getTextStyle(block)}
            linkColor={accentColor}
          />
        );

      case 'image': {
        const imageUrl = resolveMediaUrl(block.url);
        return (
          <View key={block.id} style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <AppIcon name="image" size={40} color={accentColor} />
                <Text style={styles.imageText}>Image</Text>
              </View>
            )}
          </View>
        );
      }

      case 'pdf': {
        const pdfUrl = resolveMediaUrl(block.url);
        return (
          <Pressable
            key={block.id}
            style={styles.fileContainer}
            onPress={() => pdfUrl && Linking.openURL(pdfUrl)}
          >
            <AppIcon name="document" size={32} color={accentColor} />
            <Text style={styles.fileName} numberOfLines={1}>
              {block.content || 'PDF Document'}
            </Text>
          </Pressable>
        );
      }

      case 'url': {
        const href = block.url || block.content;
        const openHref = href ? normalizeUrl(href) : '';
        return (
          <Pressable
            key={block.id}
            style={styles.urlContainer}
            onPress={() => openHref && void openExternalUrl(openHref)}
          >
            <AppIcon name="link" size={20} color={accentColor} />
            <Text style={styles.urlText} numberOfLines={1}>
              {href || 'Link'}
            </Text>
          </Pressable>
        );
      }

      case 'checklist':
        return (
          <View key={block.id} style={styles.checklistRow}>
            <View style={[styles.checkbox, { borderColor: accentColor, backgroundColor: block.checked ? accentColor : 'transparent' }]}>
              {block.checked && <AppIcon name="checkmark" size={16} color="#fff" />}
            </View>
            <LinkedText
              text={block.content || ''}
              style={[styles.checklistText, block.checked && styles.checklistTextChecked]}
              linkColor={accentColor}
            />
          </View>
        );

      case 'handwriting': {
        const drawingUrl = resolveMediaUrl(block.url);
        return (
          <View key={block.id} style={styles.handwritingContainer}>
            {drawingUrl ? (
              <HandwrittenPageImage uri={drawingUrl} />
            ) : (
              <>
                <AppIcon name="pencil-outline" size={40} color={accentColor} />
                <Text style={styles.handwritingText}>Handwriting</Text>
              </>
            )}
          </View>
        );
      }

      case 'video':
        return (
          <View key={block.id} style={styles.videoContainer}>
            <AppIcon name="play-circle" size={40} color={accentColor} />
            <Text style={styles.videoText}>Video</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LinkedText text={title} style={styles.title} linkColor={accentColor} />
      {blocks.sort((a, b) => a.order - b.order).map(renderBlock)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    lineHeight: 40,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    marginVertical: 12,
  },
  image: {
    width: '100%',
    height: '100%',
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
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    marginVertical: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  checklistTextChecked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  handwritingContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFEFB',
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
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
    marginVertical: 8,
  },
  videoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
