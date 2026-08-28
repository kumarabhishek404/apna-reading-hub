import { Linking, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { splitLinkSegments } from '@/lib/linkify';

export async function openExternalUrl(raw: string) {
  try {
    await Linking.openURL(raw);
  } catch {
    // Ignore invalid or blocked URLs.
  }
}

type LinkedTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  linkColor?: string;
  onPressText?: () => void;
};

export function LinkedText({ text, style, linkColor = colors.primary, onPressText }: LinkedTextProps) {
  const segments = splitLinkSegments(text);

  return (
    <Text style={style}>
      {segments.map((segment, index) =>
        segment.href ? (
          <Text
            key={`${segment.href}-${index}`}
            style={[styles.link, { color: linkColor }]}
            onPress={() => void openExternalUrl(segment.href!)}
            onLongPress={onPressText}
            accessibilityRole="link"
            accessibilityLabel={segment.href}
          >
            {segment.text}
          </Text>
        ) : (
          <Text key={`text-${index}`} onPress={onPressText} onLongPress={onPressText}>
            {segment.text}
          </Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
});
