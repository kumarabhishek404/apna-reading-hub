import { StyleSheet, Text, View } from 'react-native';

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
    marginTop: 4,
    marginBottom: 10,
  },
  titleBlock: {
    marginTop: 10,
  },
  title: {
    color: '#1d2f5f',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#5f6d89',
  },
});
