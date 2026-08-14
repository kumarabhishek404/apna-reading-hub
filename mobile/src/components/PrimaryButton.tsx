import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/colors';

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  color = colors.primary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: color, shadowColor: color },
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
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
