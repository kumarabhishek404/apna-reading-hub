import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function BrandHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <View style={styles.headerWrap}>
      {(title || subtitle) && (
        <View style={styles.titleBlock}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: 8,
  },
  titleBlock: {},
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
