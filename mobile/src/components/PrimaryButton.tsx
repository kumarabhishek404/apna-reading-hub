import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/colors';

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
});
