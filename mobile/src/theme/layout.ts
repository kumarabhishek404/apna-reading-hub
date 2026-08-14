import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Extra space so tab-screen lists clear the floating tab bar on all devices. */
export const TAB_BAR_BASE_HEIGHT = 70;

export function useTabContentPaddingBottom(extra = 24) {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 8) + extra;
}
