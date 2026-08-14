import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
