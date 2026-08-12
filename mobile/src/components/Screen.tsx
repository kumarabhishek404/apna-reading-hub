import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7ff' },
});
