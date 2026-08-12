import { Pressable, StyleSheet, Text } from 'react-native';

export function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  text: { color: '#fff', fontWeight: '700' },
});
