import { StyleSheet, Text, View } from 'react-native';

export function BrandHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>A</Text>
        </View>
        <Text style={styles.brandText}>Apna Sathi</Text>
      </View>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    alignSelf: 'flex-start',
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#22409a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff8a00',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  brandText: {
    color: '#1d2f5f',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
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
