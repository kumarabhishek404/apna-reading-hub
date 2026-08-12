import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' },
});
